import { NextRequest, NextResponse } from 'next/server'
import { 
  milvusService, 
  ragService, 
  MilvusEnvironmentManager, 
  type MilvusEnvironment 
} from '@/lib/milvus'

// 获取并验证环境参数
function getEnvironment(searchParams: URLSearchParams): MilvusEnvironment {
  const env = searchParams.get('env') as MilvusEnvironment
  if (env === 'hosted') return 'hosted'
  if (env === 'aliyun') return 'aliyun' 
  return 'local' // 默认本地
}

// 获取适当的Milvus服务实例
function getMilvusService(env: MilvusEnvironment) {
  console.log(`🔧 获取Milvus服务实例，请求环境: ${env}`)
  console.log(`🌍 全局服务当前环境: ${milvusService.getCurrentEnvironment()}`)
  
  if (env !== milvusService.getCurrentEnvironment()) {
    console.log(`🆕 创建新的 ${env} 环境服务实例`)
    return MilvusEnvironmentManager.createService(env)
  }
  
  console.log(`♻️ 使用全局服务实例`)
  return milvusService
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const collectionName = searchParams.get('collection')
    const env = getEnvironment(searchParams)
    const service = getMilvusService(env)

    // 获取环境信息
    if (action === 'environments') {
      const environments = MilvusEnvironmentManager.getAvailableEnvironments()
      console.log(`🌐 环境信息请求，当前环境: ${service.getCurrentEnvironment()}`)
      console.log(`📋 可用环境:`, environments.map(e => e.info.name))
      
      return NextResponse.json({
        success: true,
        data: {
          environments,
          current: service.getCurrentEnvironment()
        }
      })
    }

    // 获取所有知识库集合
    if (action === 'list') {
      console.log(`🔍 API收到list请求，环境参数: env=${env}`)
      console.log(`🔧 使用的服务环境: ${service.getCurrentEnvironment()}`)
      console.log(`🌐 服务配置信息:`, MilvusEnvironmentManager.getEnvironmentInfo(env))
      
      await service.connect()
      const collections = await service.listCollections()
      console.log(`📚 从环境 "${env}" 获取到集合:`, collections)
      
      // 获取每个集合的统计信息
      const collectionsWithStats = await Promise.all(
        collections.map(async (name) => {
          const stats = await service.getCollectionStats(name)
          return {
            name,
            ...stats,
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: collectionsWithStats,
        meta: {
          environment: env,
          environmentInfo: MilvusEnvironmentManager.getEnvironmentInfo(env)
        }
      })
    }

    // 获取特定集合的统计信息
    if (action === 'stats' && collectionName) {
      await service.connect()
      const stats = await service.getCollectionStats(collectionName)
      
      return NextResponse.json({
        success: true,
        data: stats,
        meta: {
          environment: env,
          environmentInfo: MilvusEnvironmentManager.getEnvironmentInfo(env)
        }
      })
    }

    // 检查连接状态
    if (action === 'health') {
      const isConnected = await service.connect()
      
      return NextResponse.json({
        success: true,
        data: {
          connected: isConnected,
          status: isConnected ? 'healthy' : 'disconnected',
          environment: env,
          environmentInfo: MilvusEnvironmentManager.getEnvironmentInfo(env)
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: '无效的操作'
    }, { status: 400 })

  } catch (error) {
    console.error('Knowledge Base API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const env = getEnvironment(searchParams)
    const service = getMilvusService(env)
    const body = await request.json()

    // 创建新的知识库集合
    if (action === 'create') {
      const { name, dimension = 1536 } = body
      
      if (!name) {
        return NextResponse.json({
          success: false,
          error: '请提供集合名称'
        }, { status: 400 })
      }

      await service.connect()
      const success = await service.createKnowledgeBaseCollection(name, dimension)
      
      return NextResponse.json({
        success,
        data: { name, dimension },
        message: success ? '知识库创建成功' : '知识库创建失败',
        meta: {
          environment: env,
          environmentInfo: MilvusEnvironmentManager.getEnvironmentInfo(env)
        }
      })
    }

    // 添加文档到知识库
    if (action === 'add-document') {
      const { collectionName, text, source, metadata = {} } = body
      
      if (!collectionName || !text || !source) {
        return NextResponse.json({
          success: false,
          error: '请提供集合名称、文本内容和来源'
        }, { status: 400 })
      }

      await service.connect()
      // 为指定环境创建RAG服务实例
      const { RAGService } = await import('@/lib/milvus')
      const envRagService = new RAGService(service)
      const success = await envRagService.addDocument(collectionName, text, source, metadata)
      
      return NextResponse.json({
        success,
        message: success ? '文档添加成功' : '文档添加失败',
        meta: {
          environment: env,
          environmentInfo: MilvusEnvironmentManager.getEnvironmentInfo(env)
        }
      })
    }

    // RAG 查询
    if (action === 'query') {
      const { collectionName, question, topK = 3, minScore = 0.5 } = body
      
      if (!collectionName || !question) {
        return NextResponse.json({
          success: false,
          error: '请提供集合名称和查询问题'
        }, { status: 400 })
      }

      await service.connect()
      // 为指定环境创建RAG服务实例
      const { RAGService } = await import('@/lib/milvus')
      const envRagService = new RAGService(service)
      const result = await envRagService.query(collectionName, question, topK, minScore)
      
      return NextResponse.json({
        success: true,
        data: result,
        meta: {
          environment: env,
          environmentInfo: MilvusEnvironmentManager.getEnvironmentInfo(env)
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: '无效的操作'
    }, { status: 400 })

  } catch (error) {
    console.error('Knowledge Base API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'drop' // 默认删除整个集合
    const collectionName = searchParams.get('collection')
    const env = getEnvironment(searchParams)
    const service = getMilvusService(env)

    if (!collectionName) {
      return NextResponse.json({
        success: false,
        error: '请提供集合名称'
      }, { status: 400 })
    }

    await service.connect()
    
    let success = false
    let message = ''

    switch (action) {
      case 'drop':
        // 删除整个集合
        success = await service.dropCollection(collectionName)
        message = success ? '知识库删除成功' : '知识库删除失败'
        break
        
      case 'clear':
        // 清空集合数据但保留结构
        success = await service.clearCollection(collectionName)
        message = success ? '知识库清空成功' : '知识库清空失败'
        break
        
      case 'entities':
        // 删除指定ID的记录
        const body = await request.json()
        const { ids } = body
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({
            success: false,
            error: '请提供要删除的记录ID列表'
          }, { status: 400 })
        }
        
        success = await service.deleteEntity(collectionName, ids)
        message = success ? `成功删除 ${ids.length} 条记录` : '删除记录失败'
        break
        
      case 'expression':
        // 根据表达式删除记录
        const bodyExpr = await request.json()
        const { expression } = bodyExpr
        
        if (!expression) {
          return NextResponse.json({
            success: false,
            error: '请提供删除条件表达式'
          }, { status: 400 })
        }
        
        success = await service.deleteByExpression(collectionName, expression)
        message = success ? '条件删除成功' : '条件删除失败'
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: '不支持的删除操作类型'
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success,
      message,
      data: { action, collection: collectionName },
      meta: {
        environment: env,
        environmentInfo: MilvusEnvironmentManager.getEnvironmentInfo(env)
      }
    })

  } catch (error) {
    console.error('Knowledge Base Delete API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
