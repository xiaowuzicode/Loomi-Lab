import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ApiResponse } from '@/types'
import { isValidUuid, parsePagination } from '@/lib/posts-embedding'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!isValidUuid(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }

    const { page, limit, offset } = parsePagination(searchParams.get('page'), searchParams.get('limit'))

    const countQuery = supabaseServiceRole
      .from('knowledge_base')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('embedding', null)

    const { count, error: countError } = await countQuery
    if (countError) {
      console.error('查询待向量化帖子数量失败:', countError)
      return NextResponse.json<ApiResponse>({ success: false, error: '统计待向量化帖子失败' }, { status: 500 })
    }

    const dataQuery = supabaseServiceRole
      .from('knowledge_base')
      .select('id,created_at,updated_at')
      .eq('user_id', userId)
      .is('embedding', null)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await dataQuery
    if (error) {
      console.error('查询待向量化帖子列表失败:', error)
      return NextResponse.json<ApiResponse>({ success: false, error: '查询待向量化帖子失败' }, { status: 500 })
    }

    const items = (data ?? []).map(item => ({
      id: item.id,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))

    const total = count ?? 0
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('GET /api/posts-library/vectorization/pending 失败:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
