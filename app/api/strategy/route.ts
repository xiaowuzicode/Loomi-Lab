import { NextRequest, NextResponse } from 'next/server'
import { 
  milvusService, 
  MilvusEnvironmentManager, 
  type MilvusEnvironment 
} from '@/lib/milvus'
import { randomUUID } from 'crypto'
import OpenAI from 'openai'

// 策略数据类型
interface Strategy {
  id: string
  title: string
  content: string
  vector_status: 'pending' | 'success' | 'failed'
  vector_id?: string
  created_at: string
  updated_at: string
  error_message?: string
}

// 统计数据类型
interface StrategyStats {
  total: number
  vectorized: number
  pending: number
  failed: number
}

// OpenAI客户端初始化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

// 获取环境参数
function getEnvironment(searchParams: URLSearchParams): MilvusEnvironment {
  const env = searchParams.get('env') as MilvusEnvironment
  if (env === 'hosted') return 'hosted'
  if (env === 'aliyun') return 'aliyun' 
  return 'hosted' // 默认使用托管环境
}

// 获取适当的Milvus服务实例
function getMilvusService(env: MilvusEnvironment) {
  console.log(`🔧 获取策略库Milvus服务实例，请求环境: ${env}`)
  
  if (env !== milvusService.getCurrentEnvironment()) {
    console.log(`🆕 创建新的 ${env} 环境服务实例`)
    return MilvusEnvironmentManager.createService(env)
  }
  
  console.log(`♻️ 使用全局服务实例`)
  return milvusService
}

// 生成文本向量
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: text,
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('生成向量失败:', error)
    throw new Error('向量生成失败')
  }
}

// 初始化策略库集合
async function initializeStrategyCollection(service: any, collectionName = 'lab_strategy') {
  try {
    await service.connect()
    
    // 检查集合是否存在
    const collections = await service.listCollections()
    if (collections.includes(collectionName)) {
      console.log(`📚 策略库集合 "${collectionName}" 已存在`)
      return true
    }
    
    // 创建集合 - 使用现有的方法
    console.log(`🏗️ 创建策略库集合: ${collectionName}`)
    const success = await service.createKnowledgeBaseCollection(collectionName, 1536)
    
    if (success) {
      console.log(`✅ 策略库集合创建成功`)
      return true
    } else {
      throw new Error('集合创建失败')
    }
  } catch (error) {
    console.error('初始化策略库集合失败:', error)
    throw error
  }
}

// 辅助函数：查询所有策略文档
async function queryAllStrategies(service: any, collectionName: string, limit: number = 1000) {
  try {
    // 使用零向量进行搜索来获取所有文档
    const zeroVector = new Array(1536).fill(0)
    const results = await service.searchSimilarDocuments(collectionName, zeroVector, limit, 0)
    
    // 转换为Strategy格式
    return results.map((doc: any) => {
      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata
      return {
        id: doc.id,
        title: metadata?.title || '',
        content: metadata?.content || '',
        vector_status: metadata?.vector_status || 'pending',
        vector_id: doc.id,
        created_at: metadata?.created_at || new Date().toISOString(),
        updated_at: metadata?.updated_at || new Date().toISOString(),
        error_message: metadata?.error_message,
      }
    })
  } catch (error) {
    console.log('查询所有策略失败:', error)
    return []
  }
}

// GET请求处理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const env = getEnvironment(searchParams)
    const service = getMilvusService(env)
    
    console.log(`📥 策略库API GET请求: action=${action}, env=${env}`)
    
    // 获取策略列表
    if (action === 'list') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      
      await initializeStrategyCollection(service)
      
      try {
        const collectionName = 'lab_strategy'
        
        // 获取所有策略
        const allStrategies = await queryAllStrategies(service, collectionName)
        
        // 客户端分页
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const strategies = allStrategies.slice(startIndex, endIndex)
        
        return NextResponse.json({
          success: true,
          data: {
            strategies,
            pagination: {
              page,
              limit,
              total: allStrategies.length,
              totalPages: Math.ceil(allStrategies.length / limit)
            }
          }
        })
      } catch (error) {
        // 如果集合为空或查询失败，返回空列表
        console.log('查询策略列表失败，返回空列表:', error)
        return NextResponse.json({
          success: true,
          data: {
            strategies: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          }
        })
      }
    }
    
    // 获取统计数据
    if (action === 'stats') {
      await initializeStrategyCollection(service)
      
      try {
        const collectionName = 'lab_strategy'
        const allStrategies = await queryAllStrategies(service, collectionName)
        
        const stats: StrategyStats = {
          total: allStrategies.length,
          vectorized: allStrategies.filter((s: any) => s.vector_status === 'success').length,
          pending: allStrategies.filter((s: any) => s.vector_status === 'pending').length,
          failed: allStrategies.filter((s: any) => s.vector_status === 'failed').length,
        }
        
        return NextResponse.json({
          success: true,
          data: stats
        })
      } catch (error) {
        // 返回空统计
        const emptyStats: StrategyStats = {
          total: 0,
          vectorized: 0,
          pending: 0,
          failed: 0
        }
        
        return NextResponse.json({
          success: true,
          data: emptyStats
        })
      }
    }
    
    // 检查连接状态
    if (action === 'health') {
      const isConnected = await service.connect()
      return NextResponse.json({
        success: true,
        data: {
          connected: isConnected,
          environment: env,
          status: isConnected ? 'healthy' : 'disconnected'
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: `不支持的操作: ${action}`
    }, { status: 400 })
    
  } catch (error) {
    console.error('策略库API GET请求失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// POST请求处理
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const env = getEnvironment(searchParams)
    const service = getMilvusService(env)
    const body = await request.json()
    
    console.log(`📤 策略库API POST请求: action=${action}, env=${env}`)
    
    await initializeStrategyCollection(service)
    const collectionName = 'lab_strategy'
    
    // 创建新策略
    if (action === 'create') {
      const { title, content } = body
      
      if (!title || !content) {
        return NextResponse.json({
          success: false,
          error: '标题和内容不能为空'
        }, { status: 400 })
      }
      
      const strategy: Strategy = {
        id: randomUUID(),
        title,
        content,
        vector_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      // 插入到Milvus（使用零向量占位）
      const zeroVector = new Array(1536).fill(0)
      const combinedText = `${title}\n\n${content}`
      
      const documents = [{
        id: strategy.id,
        vector: zeroVector,
        text: combinedText,
        source: 'strategy_library',
        metadata: strategy
      }]
      
      const insertSuccess = await service.insertDocuments(collectionName, documents)
      
      if (insertSuccess) {
        return NextResponse.json({
          success: true,
          data: strategy,
          message: '策略创建成功'
        })
      } else {
        throw new Error('策略保存失败')
      }
    }
    
    // 向量化策略
    if (action === 'vectorize') {
      const { ids } = body
      
      try {
        let targetIds = ids
        
        // 如果没有指定ID，获取所有需要向量化的策略
        if (!targetIds || targetIds.length === 0) {
          const allStrategies = await queryAllStrategies(service, collectionName)
          targetIds = allStrategies
            .filter((s: any) => 
              s.vector_status === 'pending' || 
              s.vector_status === 'failed'
            )
            .map((s: any) => s.id)
        }
        
        const results = []
        
        for (const id of targetIds) {
          try {
            // 获取策略数据
            const allStrategies = await queryAllStrategies(service, collectionName)
            const strategy = allStrategies.find((s: any) => s.id === id)
            
            if (!strategy) continue
            
            const title = strategy.title || ''
            const content = strategy.content || ''
            const combinedText = `${title}\n\n${content}`
            
            // 生成向量
            const embedding = await generateEmbedding(combinedText)
            
            // 删除旧记录并刷新
            await service.deleteEntity(collectionName, [id])
            
            // 插入新记录
            const updatedStrategy = {
              ...strategy,
              vector_status: 'success',
              updated_at: new Date().toISOString(),
              error_message: undefined
            }
            
            const documents = [{
              id: id,
              vector: embedding,
              text: combinedText,
              source: 'strategy_library',
              metadata: updatedStrategy
            }]
            
            await service.insertDocuments(collectionName, documents)
            
            results.push({
              id,
              status: 'success',
              title
            })
            
          } catch (error) {
            // 更新失败状态
            try {
              const allStrategies = await queryAllStrategies(service, collectionName)
              const strategy = allStrategies.find((s: any) => s.id === id)
              
              if (strategy) {
                // 删除旧记录并刷新
                await service.deleteEntity(collectionName, [id])
                
                const updatedStrategy = {
                  ...strategy,
                  vector_status: 'failed',
                  updated_at: new Date().toISOString(),
                  error_message: error instanceof Error ? error.message : '向量化失败'
                }
                
                const combinedText = `${strategy.title}\n\n${strategy.content}`
                const zeroVector = new Array(1536).fill(0)
                
                const documents = [{
                  id: id,
                  vector: zeroVector,
                  text: combinedText,
                  source: 'strategy_library',
                  metadata: updatedStrategy
                }]
                
                await service.insertDocuments(collectionName, documents)
              }
            } catch (updateError) {
              console.error('更新失败状态时出错:', updateError)
            }
            
            results.push({
              id,
              status: 'failed',
              error: error instanceof Error ? error.message : '未知错误'
            })
          }
        }
        
        return NextResponse.json({
          success: true,
          data: {
            processed: results.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'failed').length,
            results
          },
          message: '向量化完成'
        })
        
      } catch (error) {
        console.error('批量向量化失败:', error)
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : '向量化失败'
        }, { status: 500 })
      }
    }
    
    // RAG查询
    if (action === 'rag-query') {
      const { query, topK = 5, threshold = 0.5 } = body
      
      if (!query) {
        return NextResponse.json({
          success: false,
          error: '查询内容不能为空'
        }, { status: 400 })
      }
      
      try {
        // 生成查询向量
        const queryVector = await generateEmbedding(query)
        
        // 在Milvus中搜索
        const searchResults = await service.searchSimilarDocuments(
          collectionName,
          queryVector,
          topK,
          threshold
        )
        
        // 过滤只包含成功向量化的策略并转换格式
        const validResults = searchResults
          .map((result: any) => {
            const metadata = typeof result.metadata === 'string' ? JSON.parse(result.metadata) : result.metadata
            return {
              id: result.id,
              title: metadata?.title || '',
              content: metadata?.content || '',
              similarity: result.score || 0,
              metadata: metadata,
              vector_status: metadata?.vector_status
            }
          })
          .filter((result: any) => result.vector_status === 'success')
        
        return NextResponse.json({
          success: true,
          data: {
            query,
            results: validResults,
            timestamp: new Date().toISOString()
          }
        })
        
      } catch (error) {
        console.error('RAG查询失败:', error)
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'RAG查询失败'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: `不支持的操作: ${action}`
    }, { status: 400 })
    
  } catch (error) {
    console.error('策略库API POST请求失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// PUT请求处理 - 更新策略
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const strategyId = searchParams.get('id')
    const env = getEnvironment(searchParams)
    const service = getMilvusService(env)
    const body = await request.json()
    
    console.log(`🔄 策略库API PUT请求: action=${action}, id=${strategyId}, env=${env}`)
    
    if (action === 'update' && strategyId) {
      const { title, content } = body
      
      if (!title || !content) {
        return NextResponse.json({
          success: false,
          error: '标题和内容不能为空'
        }, { status: 400 })
      }
      
      await initializeStrategyCollection(service)
      const collectionName = 'lab_strategy'
      
      try {
        // 获取现有策略
        const allStrategies = await queryAllStrategies(service, collectionName)
        const existingStrategy = allStrategies.find((s: any) => s.id === strategyId)
        
        if (!existingStrategy) {
          return NextResponse.json({
            success: false,
            error: '策略不存在'
          }, { status: 404 })
        }
        
        // 删除旧记录
        await service.deleteEntity(collectionName, [strategyId])
        
        // 更新策略数据，重置向量状态为pending
        const updatedStrategy: Strategy = {
          id: strategyId,
          title,
          content,
          vector_status: 'pending', // 内容更新后需要重新向量化
          vector_id: strategyId,
          created_at: existingStrategy.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: undefined
        }
        
        // 插入更新后的记录（使用零向量占位）
        const zeroVector = new Array(1536).fill(0)
        const combinedText = `${title}\n\n${content}`
        
        const documents = [{
          id: strategyId,
          vector: zeroVector,
          text: combinedText,
          source: 'strategy_library',
          metadata: updatedStrategy
        }]
        
        const insertSuccess = await service.insertDocuments(collectionName, documents)
        
        if (insertSuccess) {
          return NextResponse.json({
            success: true,
            data: updatedStrategy,
            message: '策略更新成功'
          })
        } else {
          throw new Error('策略更新失败')
        }
        
      } catch (error) {
        console.error('更新策略失败:', error)
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : '更新失败'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: `不支持的操作: ${action}`
    }, { status: 400 })
    
  } catch (error) {
    console.error('策略库API PUT请求失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// DELETE请求处理
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const strategyId = searchParams.get('id')
    const env = getEnvironment(searchParams)
    const service = getMilvusService(env)
    
    console.log(`🗑️ 策略库API DELETE请求: action=${action}, id=${strategyId}, env=${env}`)
    
    if (action === 'delete' && strategyId) {
      await initializeStrategyCollection(service)
      const collectionName = 'lab_strategy'
      
      try {
        const deleteSuccess = await service.deleteEntity(collectionName, [strategyId])
        
        if (deleteSuccess) {
          return NextResponse.json({
            success: true,
            message: '策略删除成功'
          })
        } else {
          throw new Error('策略删除失败')
        }
        
      } catch (error) {
        console.error('删除策略失败:', error)
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : '删除失败'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: `不支持的操作: ${action}`
    }, { status: 400 })
    
  } catch (error) {
    console.error('策略库API DELETE请求失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}