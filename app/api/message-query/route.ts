import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const conversationId = searchParams.get('conversationId') // 会话ID（即项目ID）

    // 如果没有任何查询参数，返回空结果
    if (!startDate && !endDate && !userId && !conversationId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '请设置至少一个查询条件'
      })
    }

    let queryParams: any = {}

    // 构建查询参数
    if (startDate) queryParams.start_date = startDate
    if (endDate) queryParams.end_date = endDate
    if (userId) queryParams.user_id_param = userId
    if (conversationId) queryParams.conversation_id_param = conversationId

    let results = []

    if (userId && conversationId) {
      // 查询特定用户的特定项目 (会话ID就是项目ID)
      const { data, error } = await supabaseServiceRole
        .rpc('lab_query_user_project_by_id', {
          user_id_param: userId,
          project_id_param: conversationId,
          start_date: startDate || null,
          end_date: endDate || null
        })
      
      if (error) throw error
      results = data || []
    } else if (userId) {
      // 查询特定用户的所有项目
      const { data, error } = await supabaseServiceRole
        .rpc('lab_query_user_projects', {
          user_id_param: userId,
          start_date: startDate || null,
          end_date: endDate || null
        })
      
      if (error) throw error
      results = data || []
    } else if (conversationId) {
      // 查询特定会话的信息 (会话ID就是项目ID)
      const { data, error } = await supabaseServiceRole
        .rpc('lab_query_project_by_id', {
          project_id_param: conversationId,
          start_date: startDate || null,
          end_date: endDate || null
        })
      
      if (error) throw error
      results = data || []
    } else {
      // 按时间范围查询所有项目
      const { data, error } = await supabaseServiceRole
        .rpc('lab_query_projects_by_date', {
          start_date: startDate || null,
          end_date: endDate || null
        })
      
      if (error) throw error
      results = data || []
    }

    // 如果需要获取聊天消息，为每个项目获取相关消息
    const enrichedResults = await Promise.all(
      results.map(async (project: any) => {
        try {
          // 获取该项目的聊天消息
          const { data: messages, error: msgError } = await supabaseServiceRole
            .from('chat_messages')
            .select('id, content, created_at')
            .eq('project_id', project.id)
            .order('created_at', { ascending: true })
            .limit(10) // 限制消息数量避免过大
          
          if (msgError) {
            console.error('获取聊天消息失败:', msgError)
            return { ...project, chat_messages: [] }
          }
          
          return {
            ...project,
            chat_messages: messages || []
          }
        } catch (error) {
          console.error('获取项目聊天消息失败:', error)
          return { ...project, chat_messages: [] }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedResults,
      count: enrichedResults.length
    })

  } catch (error) {
    console.error('用户消息查询失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '查询失败',
      data: []
    }, { status: 500 })
  }
}
