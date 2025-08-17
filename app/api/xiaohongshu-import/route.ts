import { NextRequest, NextResponse } from 'next/server'
import { xiaohongshuMilvusService } from '@/lib/xiaohongshu-milvus'

export async function POST(request: NextRequest) {
  try {
    const { collectionName, dataType, data } = await request.json()

    if (!data || !dataType) {
      return NextResponse.json({
        success: false,
        error: '请提供有效的数据内容和类型'
      }, { status: 400 })
    }

    // 如果没有指定集合名称，使用默认的小红书集合
    const targetCollection = collectionName || 'lab_xiaohongshu_posts'

    // 首先确保集合已初始化
    await xiaohongshuMilvusService.initializeCollection()

    let result: { success: boolean; importedCount: number; error?: string }
    
    if (dataType === 'csv') {
      // 暂时保持CSV的旧接口，需要后续更新
      const success = await xiaohongshuMilvusService.importFromCSV(data)
      result = { success, importedCount: 0, error: success ? undefined : 'CSV导入失败' }
    } else if (dataType === 'json') {
      result = await xiaohongshuMilvusService.importFromJSON(data)
    } else {
      return NextResponse.json({
        success: false,
        error: '不支持的数据类型，请使用 csv 或 json'
      }, { status: 400 })
    }

    if (result.success) {
      // 获取统计信息
      const stats = await xiaohongshuMilvusService.getStats()
      
      return NextResponse.json({
        success: true,
        message: `成功导入 ${result.importedCount} 条数据到集合 ${targetCollection}`,
        data: {
          collectionName: targetCollection,
          importedCount: result.importedCount,
          stats
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || '数据导入失败，请检查数据格式'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('小红书数据导入API错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}
