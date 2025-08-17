import { NextRequest, NextResponse } from 'next/server'
import { xiaohongshuMilvusService } from '@/lib/xiaohongshu-milvus'

export async function POST(request: NextRequest) {
  try {
    const { collectionName } = await request.json()

    // 初始化小红书集合
    const success = await xiaohongshuMilvusService.initializeCollection()

    if (success) {
      // 获取集合统计信息
      const stats = await xiaohongshuMilvusService.getStats()
      
      return NextResponse.json({
        success: true,
        message: '小红书数据集合初始化成功',
        data: {
          collectionName: collectionName || 'lab_xiaohongshu_posts',
          initialized: true,
          stats
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '集合初始化失败，请检查Milvus连接'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('小红书集合初始化API错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '初始化服务异常'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取小红书集合统计信息
    const stats = await xiaohongshuMilvusService.getStats()
    
    return NextResponse.json({
      success: true,
      data: {
        collectionName: 'lab_xiaohongshu_posts',
        stats,
        available: !!stats
      }
    })
  } catch (error) {
    console.error('获取小红书集合信息API错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取信息失败'
    }, { status: 500 })
  }
}
