import { NextRequest, NextResponse } from 'next/server'
import { milvusService, ragService } from '@/lib/milvus'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const collectionName = searchParams.get('collection')

    // 获取所有知识库集合
    if (action === 'list') {
      await milvusService.connect()
      const collections = await milvusService.listCollections()
      
      // 获取每个集合的统计信息
      const collectionsWithStats = await Promise.all(
        collections.map(async (name) => {
          const stats = await milvusService.getCollectionStats(name)
          return {
            name,
            ...stats,
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: collectionsWithStats
      })
    }

    // 获取特定集合的统计信息
    if (action === 'stats' && collectionName) {
      await milvusService.connect()
      const stats = await milvusService.getCollectionStats(collectionName)
      
      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    // 检查连接状态
    if (action === 'health') {
      const isConnected = await milvusService.connect()
      
      return NextResponse.json({
        success: true,
        data: {
          connected: isConnected,
          status: isConnected ? 'healthy' : 'disconnected'
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

      await milvusService.connect()
      const success = await milvusService.createKnowledgeBaseCollection(name, dimension)
      
      return NextResponse.json({
        success,
        data: { name, dimension },
        message: success ? '知识库创建成功' : '知识库创建失败'
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

      await milvusService.connect()
      const success = await ragService.addDocument(collectionName, text, source, metadata)
      
      return NextResponse.json({
        success,
        message: success ? '文档添加成功' : '文档添加失败'
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

      await milvusService.connect()
      const result = await ragService.query(collectionName, question, topK, minScore)
      
      return NextResponse.json({
        success: true,
        data: result
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

    if (!collectionName) {
      return NextResponse.json({
        success: false,
        error: '请提供集合名称'
      }, { status: 400 })
    }

    await milvusService.connect()
    
    let success = false
    let message = ''

    switch (action) {
      case 'drop':
        // 删除整个集合
        success = await milvusService.dropCollection(collectionName)
        message = success ? '知识库删除成功' : '知识库删除失败'
        break
        
      case 'clear':
        // 清空集合数据但保留结构
        success = await milvusService.clearCollection(collectionName)
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
        
        success = await milvusService.deleteEntity(collectionName, ids)
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
        
        success = await milvusService.deleteByExpression(collectionName, expression)
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
      data: { action, collection: collectionName }
    })

  } catch (error) {
    console.error('Knowledge Base Delete API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
