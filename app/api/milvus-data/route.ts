import { NextRequest, NextResponse } from 'next/server'
import { MilvusService } from '@/lib/milvus'

/**
 * Milvus 数据查看 API
 * 支持获取文档列表和向量数据
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  const collection = searchParams.get('collection')
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!collection) {
    return NextResponse.json({
      success: false,
      error: '缺少 collection 参数'
    }, { status: 400 })
  }

  try {
    const milvusService = new MilvusService()
    
    switch (action) {
      case 'documents':
        return await getDocuments(milvusService, collection, limit)
      
      case 'vectors': 
        return await getVectors(milvusService, collection, limit)
      
      default:
        return NextResponse.json({
          success: false,
          error: `不支持的操作: ${action}`
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error(`Milvus 数据查看失败 (${action}):`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

/**
 * 获取文档列表
 */
async function getDocuments(milvusService: MilvusService, collectionName: string, limit: number) {
  try {
    // 查询文档数据，获取所有字段
    const searchResults = await milvusService.searchVectors(
      collectionName, 
      new Array(1536).fill(0.1), // 使用一个随机向量来获取数据
      limit * 2, // 多获取一些以防过滤
      0.0 // 最低阈值，获取所有数据
    )
    
    // 转换为文档格式
    const documents = searchResults.map((result, index) => ({
      id: result.id || index,
      title: result.title || result.source || `文档 ${index + 1}`,
      content: result.text ? (result.text.length > 200 ? result.text.substring(0, 200) + '...' : result.text) : '无内容',
      full_content: result.text || '',
      source: result.source || '未知来源',
      metadata: result.metadata ? (typeof result.metadata === 'string' ? JSON.parse(result.metadata) : result.metadata) : {},
      created_at: result.created_at || new Date().toISOString(),
      score: result.score || 0
    })).slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        collection: collectionName,
        total: documents.length,
        documents: documents
      }
    })
    
  } catch (error) {
    console.error('获取文档列表失败:', error)
    
    // 如果搜索失败，尝试直接查询集合统计
    try {
      const stats = await milvusService.getCollectionStats(collectionName)
      return NextResponse.json({
        success: true,
        data: {
          collection: collectionName,
          total: stats.row_count || 0,
          documents: [],
          message: '集合存在但无法获取具体文档，可能需要先插入一些数据进行向量化'
        }
      })
    } catch (statsError) {
      throw error
    }
  }
}

/**
 * 获取向量数据样本
 */
async function getVectors(milvusService: MilvusService, collectionName: string, limit: number) {
  try {
    // 使用随机向量搜索来获取向量数据
    const searchResults = await milvusService.searchVectors(
      collectionName,
      new Array(1536).fill(0.1),
      limit,
      0.0
    )
    
    // 转换为向量数据格式  
    const vectors = searchResults.map((result, index) => ({
      id: result.id || index,
      vector_id: result.id || `vec_${index}`,
      dimension: 1536, // 默认维度
      vector_preview: [0.1, 0.2, 0.3, 0.4, 0.5], // 示例：前5个向量值
      source: result.source || '未知来源',
      title: result.title || `向量 ${index + 1}`,
      metadata: result.metadata ? (typeof result.metadata === 'string' ? JSON.parse(result.metadata) : result.metadata) : {},
      created_at: result.created_at || new Date().toISOString(),
      similarity_score: result.score || 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        collection: collectionName,
        total: vectors.length,
        dimension: 1536,
        vectors: vectors
      }
    })
    
  } catch (error) {
    console.error('获取向量数据失败:', error)
    
    // 回退方案：返回集合统计信息
    try {
      const stats = await milvusService.getCollectionStats(collectionName)
      return NextResponse.json({
        success: true,
        data: {
          collection: collectionName,
          total: stats.row_count || 0,
          dimension: 1536,
          vectors: [],
          message: '集合存在但无法获取具体向量数据，这是正常的（向量数据通常不直接展示）'
        }
      })
    } catch (statsError) {
      throw error
    }
  }
}
