import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import { MilvusEnvironmentManager } from '@/lib/milvus'
import { XiaohongshuMilvusService } from '@/lib/xiaohongshu-milvus'

// 将内容库中的记录向量化入库（按 pending/failed 串行处理）
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const env = (searchParams.get('env') || 'local') as any
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

    // 查询所有待向量化/失败的数据
    const { data: items, error } = await supabaseServiceRole
      .from('lab_content_library')
      .select('*')
      .in('vector_status', ['pending', 'failed'])
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, data: { processed: 0, successful: 0, failed: 0, results: [] }, message: '没有需要向量化的记录' })
    }

    // 规范化为小红书向量格式（已在服务里兼容爆文库格式）
    const payload = JSON.stringify(items)

    // 使用向量服务导入
    const milvusService = MilvusEnvironmentManager.createService(env)
    const xhs = new XiaohongshuMilvusService(milvusService, 'lab_xiaohongshu_posts')
    const initOk = await xhs.initializeCollection()
    if (!initOk) throw new Error('向量集合初始化失败')

    const importResult = await xhs.importFromJSON(payload)

    // 根据结果更新状态
    const ids = items.map((it: any) => it.id)
    if (importResult.success) {
      await supabaseServiceRole
        .from('lab_content_library')
        .update({ vector_status: 'success', last_vectorized_at: new Date().toISOString() })
        .in('id', ids)
    } else {
      await supabaseServiceRole
        .from('lab_content_library')
        .update({ vector_status: 'failed', vector_error: importResult.error || 'unknown' })
        .in('id', ids)
    }

    return NextResponse.json({
      success: importResult.success,
      message: importResult.success ? `成功向量化 ${importResult.importedCount} 条` : '向量化失败',
      data: {
        processed: items.length,
        successful: importResult.success ? importResult.importedCount : 0,
        failed: importResult.success ? items.length - importResult.importedCount : items.length,
        results: ids
      }
    })
  } catch (error) {
    console.error('内容库向量化API错误:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '内部错误' }, { status: 500 })
  }
}


