import { NextRequest, NextResponse } from 'next/server'
import { xiaohongshuMilvusService } from '@/lib/xiaohongshu-milvus'

export async function POST(request: NextRequest) {
  try {
    const { 
      collectionName, 
      query, 
      searchType = 'both', 
      topK = 5, 
      minScore = 0.3 
    } = await request.json()

    if (!query || query.trim() === '') {
      return NextResponse.json({
        success: false,
        error: '请提供搜索查询内容'
      }, { status: 400 })
    }

    // 使用默认集合名称如果未提供
    const targetCollection = collectionName || 'lab_xiaohongshu_posts'

    // 执行相似度搜索
    const results = await xiaohongshuMilvusService.searchSimilarPosts(
      query,
      searchType,
      topK,
      minScore
    )

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query,
        searchType,
        topK,
        minScore,
        resultCount: results.length,
        collectionName: targetCollection
      }
    })
  } catch (error) {
    console.error('小红书ANN搜索API错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '搜索服务异常'
    }, { status: 500 })
  }
}
