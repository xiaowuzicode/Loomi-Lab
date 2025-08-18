import { NextRequest, NextResponse } from 'next/server'
import { XiaohongshuMilvusService } from '@/lib/xiaohongshu-milvus'
import { MilvusEnvironmentManager, type MilvusEnvironment } from '@/lib/milvus'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const environment = (searchParams.get('env') || 'local') as MilvusEnvironment
    
    const { collectionName, dataType, data } = await request.json()

    if (!data || !dataType) {
      return NextResponse.json({
        success: false,
        error: '请提供有效的数据内容和类型'
      }, { status: 400 })
    }

    // 如果没有指定集合名称，使用默认的小红书集合
    const targetCollection = collectionName || 'lab_xiaohongshu_posts'

    console.log(`🚀 开始小红书数据导入 - 环境: ${environment}, 集合: ${targetCollection}`)

    // 根据环境创建服务实例
    const milvusService = MilvusEnvironmentManager.createService(environment)
    const xiaohongshuService = new XiaohongshuMilvusService(milvusService, targetCollection)

    // 首先确保集合已初始化
    const initResult = await xiaohongshuService.initializeCollection()
    if (!initResult) {
      return NextResponse.json({
        success: false,
        error: '集合初始化失败，请检查Milvus连接配置'
      }, { status: 500 })
    }

    let result: { success: boolean; importedCount: number; error?: string }
    
    if (dataType === 'csv') {
      // 暂时保持CSV的旧接口，需要后续更新
      const success = await xiaohongshuService.importFromCSV(data)
      result = { success, importedCount: 0, error: success ? undefined : 'CSV导入失败' }
    } else if (dataType === 'json') {
      result = await xiaohongshuService.importFromJSON(data)
    } else {
      return NextResponse.json({
        success: false,
        error: '不支持的数据类型，请使用 csv 或 json'
      }, { status: 400 })
    }

    console.log(`📊 导入结果: ${result.success ? '成功' : '失败'}, 导入数量: ${result.importedCount}`)

    if (result.success) {
      // 获取统计信息
      const stats = await xiaohongshuService.getStats()
      
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
      console.error(`❌ 导入失败: ${result.error}`)
      return NextResponse.json({
        success: false,
        error: result.error || '数据导入失败，请检查数据格式'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ 小红书数据导入API异常:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}
