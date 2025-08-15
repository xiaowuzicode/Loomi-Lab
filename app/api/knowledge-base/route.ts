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
    const collectionName = searchParams.get('collection')

    if (!collectionName) {
      return NextResponse.json({
        success: false,
        error: '请提供集合名称'
      }, { status: 400 })
    }

    await milvusService.connect()
    const success = await milvusService.dropCollection(collectionName)
    
    return NextResponse.json({
      success,
      message: success ? '知识库删除成功' : '知识库删除失败'
    })

  } catch (error) {
    console.error('Knowledge Base API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
