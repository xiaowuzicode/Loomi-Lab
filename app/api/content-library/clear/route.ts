import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'

export async function DELETE(_request: NextRequest) {
  try {
    // 统计当前数量
    const { count } = await supabaseServiceRole
      .from('lab_content_library')
      .select('*', { count: 'exact', head: true })

    // 删除全部
    const { error } = await supabaseServiceRole
      .from('lab_content_library')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `已清空爆文库，共删除 ${count || 0} 条记录`,
      data: { deleted: count || 0 }
    })
  } catch (error) {
    console.error('清空爆文库失败:', error)
    return NextResponse.json({ success: false, error: '清空失败' }, { status: 500 })
  }
}


