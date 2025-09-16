import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ApiResponse } from '@/types'

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseFoldIdParam(val: string | null): string | null | undefined {
  if (val === null) return undefined
  const trimmed = String(val).trim()
  if (!trimmed) return undefined
  if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'none') return null
  if (!uuidV4Regex.test(trimmed)) return undefined
  return trimmed
}

function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) return value
  return []
}

function ensureObject<T extends Record<string, any>>(value: unknown): T {
  if (value && typeof value === 'object') {
    return value as T
  }
  return {} as T
}

function buildSearchFilters(search: string | undefined) {
  if (!search) return undefined
  const keyword = search.trim()
  if (!keyword) return undefined
  const like = `%${keyword}%`
  return [
    `title.ilike.${like}`,
    `content.ilike.${like}`,
    `meta_data->>title.ilike.${like}`,
    `meta_data->>content.ilike.${like}`,
  ].join(',')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!userId || !uuidV4Regex.test(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: '缺少或无效的 userId' }, { status: 400 })
    }

    if (id) {
      if (!uuidV4Regex.test(id)) {
        return NextResponse.json<ApiResponse>({ success: false, error: '无效的 id' }, { status: 400 })
      }

      const { data, error } = await supabaseServiceRole
        .from('knowledge_base')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('GET posts detail error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: '查询失败' }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json<ApiResponse>({ success: false, error: '记录不存在' }, { status: 404 })
      }

      let meta = data.meta_data
      if (typeof meta === 'string') {
        try {
          meta = JSON.parse(meta)
        } catch {
          meta = {}
        }
      }

      const detail = {
        ...data,
        meta: ensureObject(meta),
      }

      return NextResponse.json<ApiResponse>({ success: true, data: detail })
    }

    const foldIdParam = searchParams.get('foldId')
    const foldId = parseFoldIdParam(foldIdParam)
    if (foldIdParam !== null && foldId === undefined) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'foldId 无效' }, { status: 400 })
    }

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
    const limitRaw = parseInt(searchParams.get('limit') || '20', 10) || 20
    const limit = Math.min(Math.max(limitRaw, 1), 100)
    const offset = (page - 1) * limit
    const search = searchParams.get('search')?.trim()

    const countQuery = supabaseServiceRole
      .from('knowledge_base')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (foldId !== undefined) {
      if (foldId === null) countQuery.is('fold_id', null)
      else countQuery.eq('fold_id', foldId)
    }
    const searchFilters = buildSearchFilters(search)
    if (searchFilters) {
      countQuery.or(searchFilters)
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      console.error('GET posts count error:', countError)
      return NextResponse.json<ApiResponse>({ success: false, error: '查询失败' }, { status: 500 })
    }

    const dataQuery = supabaseServiceRole
      .from('knowledge_base')
      .select('id,title,fold_id,updated_at,meta_data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (foldId !== undefined) {
      if (foldId === null) dataQuery.is('fold_id', null)
      else dataQuery.eq('fold_id', foldId)
    }
    if (searchFilters) {
      dataQuery.or(searchFilters)
    }

    const { data, error } = await dataQuery
    if (error) {
      console.error('GET posts list error:', error)
      return NextResponse.json<ApiResponse>({ success: false, error: '查询失败' }, { status: 500 })
    }

    const items = (data || []).map((row: any) => {
      let meta = row.meta_data
      if (typeof meta === 'string') {
        try {
          meta = JSON.parse(meta)
        } catch {
          meta = {}
        }
      }
      const metaObj = ensureObject(meta)
      const title = metaObj.title || row.title || '(未命名)'
      return {
        id: row.id,
        title,
        fold_id: row.fold_id,
        updated_at: row.updated_at,
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        items,
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    })
  } catch (error) {
    console.error('GET /api/posts-library error:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ids } = body || {}

    if (!userId || !uuidV4Regex.test(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'ids 必须为非空数组' }, { status: 400 })
    }
    const invalid = ids.some((x: any) => typeof x !== 'string' || !uuidV4Regex.test(x))
    if (invalid) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'ids 中包含无效的 UUID' }, { status: 400 })
    }

    const { data, error } = await supabaseServiceRole
      .from('knowledge_base')
      .delete()
      .eq('user_id', userId)
      .in('id', ids)
      .select('id')

    if (error) {
      console.error('DELETE posts error:', error)
      return NextResponse.json<ApiResponse>({ success: false, error: '删除失败' }, { status: 500 })
    }

    const deletedIds = ensureArray(data?.map((row: any) => row.id))

    return NextResponse.json<ApiResponse>({ success: true, data: { deletedIds } })
  } catch (error) {
    console.error('DELETE /api/posts-library error:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
