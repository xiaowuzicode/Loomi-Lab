import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ApiResponse } from '@/types'

// UUID v4 校验（与文件夹接口保持一致）
const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// 校验用户是否存在（用于写操作防误写）
async function userExists(userId: string): Promise<boolean> {
  try {
    // 使用RPC函数检查auth.users表中的用户是否存在
    const { data, error } = await supabaseServiceRole
      .rpc('lab_check_user_exists', { user_id_param: userId })
    
    if (error) {
      console.error('检查用户是否存在时出错:', error)
      return false
    }
    
    return !!data
  } catch (error) {
    console.error('userExists函数异常:', error)
    return false
  }
}

// 解析 foldId 查询参数：'null'|'none' 视为 null；否则校验 UUID
function parseFoldIdParam(val: string | null): string | null | undefined {
  if (val === null) return undefined
  const v = String(val).trim()
  if (!v) return undefined
  if (v.toLowerCase() === 'null' || v.toLowerCase() === 'none') return null
  if (!uuidV4Regex.test(v)) return undefined
  return v
}

// 限制字符串长度（按字节近似）
function exceedsBytes(text: string, maxBytes: number) {
  try {
    return Buffer.byteLength(text || '', 'utf8') > maxBytes
  } catch {
    // 非 Node 环境兜底（Next API 在 Node 环境运行）
    return (text || '').length > maxBytes
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!userId || !uuidV4Regex.test(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: '缺少或无效的 userId' }, { status: 400 })
    }

    // 详情
    if (id) {
      if (!uuidV4Regex.test(id)) {
        return NextResponse.json<ApiResponse>({ success: false, error: '无效的 id' }, { status: 400 })
      }

      const { data, error } = await supabaseServiceRole
        .from('book_notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .maybeSingle()

      if (error) {
        console.error('GET detail error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: '查询失败' }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json<ApiResponse>({ success: false, error: '记录不存在' }, { status: 404 })
      }

      return NextResponse.json<ApiResponse>({ success: true, data })
    }

    // 列表
    const foldIdParam = searchParams.get('foldId')
    const foldId = parseFoldIdParam(foldIdParam)
    if (foldIdParam !== null && foldId === undefined) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'foldId 无效' }, { status: 400 })
    }

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
    const limitRaw = parseInt(searchParams.get('limit') || '20', 10) || 20
    const limit = Math.min(Math.max(limitRaw, 1), 100)
    const offset = (page - 1) * limit
    const search = (searchParams.get('search') || '').trim()

    // 计数查询
    let countQuery = supabaseServiceRole
      .from('book_notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false)

    if (foldId !== undefined) {
      if (foldId === null) countQuery = countQuery.is('fold_id', null)
      else countQuery = countQuery.eq('fold_id', foldId)
    }
    if (search) {
      // ILIKE 模糊匹配 note_name 或 note
      countQuery = countQuery.or(`note_name.ilike.%${search}%,note.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      console.error('GET list count error:', countError)
      return NextResponse.json<ApiResponse>({ success: false, error: '查询失败' }, { status: 500 })
    }

    // 数据查询（精简字段）
    let dataQuery = supabaseServiceRole
      .from('book_notes')
      .select('id,note_name,fold_id,updated_at')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (foldId !== undefined) {
      if (foldId === null) dataQuery = dataQuery.is('fold_id', null)
      else dataQuery = dataQuery.eq('fold_id', foldId)
    }
    if (search) {
      dataQuery = dataQuery.or(`note_name.ilike.%${search}%,note.ilike.%${search}%`)
    }

    const { data: items, error: dataError } = await dataQuery
    if (dataError) {
      console.error('GET list data error:', dataError)
      return NextResponse.json<ApiResponse>({ success: false, error: '查询失败' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        items: items || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('GET /api/memo-notes error:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, note_name, note = '', fold_id = null } = body || {}

    if (!userId || !uuidV4Regex.test(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }
    if (!note_name || String(note_name).trim().length < 1 || String(note_name).trim().length > 100) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'note_name 长度需为 1-100' }, { status: 400 })
    }
    if (typeof note !== 'string') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'note 必须为字符串' }, { status: 400 })
    }
    if (exceedsBytes(note, 200 * 1024)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'note 过大，建议不超过 200KB' }, { status: 400 })
    }
    if (fold_id !== null && !(typeof fold_id === 'string' && uuidV4Regex.test(fold_id))) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'fold_id 无效' }, { status: 400 })
    }

    // 写操作需要用户存在
    if (!(await userExists(userId))) {
      return NextResponse.json<ApiResponse>({ success: false, error: '用户不存在' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const payload = {
      user_id: userId,
      created_user_id: userId,
      fold_id: fold_id,
      note_name: String(note_name).trim(),
      note: note,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabaseServiceRole
      .from('book_notes')
      .insert([payload])
      .select('id,created_at,updated_at')
      .single()

    if (error) {
      console.error('POST create error:', error)
      return NextResponse.json<ApiResponse>({ success: false, error: '创建失败' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({ success: true, data })
  } catch (error) {
    console.error('POST /api/memo-notes error:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, id, action } = body || {}

    if (!userId || !uuidV4Regex.test(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }
    if (!id || !uuidV4Regex.test(id)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'id 缺失或格式无效' }, { status: 400 })
    }

    // 验证归属
    const { data: existed, error: existErr } = await supabaseServiceRole
      .from('book_notes')
      .select('id,user_id')
      .eq('id', id)
      .maybeSingle()
    if (existErr) {
      console.error('PUT fetch exist error:', existErr)
      return NextResponse.json<ApiResponse>({ success: false, error: '查询失败' }, { status: 500 })
    }
    if (!existed || existed.user_id !== userId) {
      return NextResponse.json<ApiResponse>({ success: false, error: '记录不存在或无权限' }, { status: 404 })
    }

    const now = new Date().toISOString()

    if (action === 'rename') {
      const { note_name } = body
      if (!note_name || String(note_name).trim().length < 1 || String(note_name).trim().length > 100) {
        return NextResponse.json<ApiResponse>({ success: false, error: 'note_name 长度需为 1-100' }, { status: 400 })
      }

      const { data, error } = await supabaseServiceRole
        .from('book_notes')
        .update({ note_name: String(note_name).trim(), updated_at: now })
        .eq('id', id)
        .eq('user_id', userId)
        .select('id,note_name,updated_at')
        .single()
      if (error) {
        console.error('PUT rename error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: '更新失败' }, { status: 500 })
      }
      return NextResponse.json<ApiResponse>({ success: true, data })
    }

    if (action === 'update-content') {
      const { note } = body
      if (typeof note !== 'string') {
        return NextResponse.json<ApiResponse>({ success: false, error: 'note 必须为字符串' }, { status: 400 })
      }
      if (exceedsBytes(note, 200 * 1024)) {
        return NextResponse.json<ApiResponse>({ success: false, error: 'note 过大，建议不超过 200KB' }, { status: 400 })
      }

      const { data, error } = await supabaseServiceRole
        .from('book_notes')
        .update({ note, updated_at: now })
        .eq('id', id)
        .eq('user_id', userId)
        .select('id,updated_at')
        .single()
      if (error) {
        console.error('PUT update-content error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: '更新失败' }, { status: 500 })
      }
      return NextResponse.json<ApiResponse>({ success: true, data })
    }

    if (action === 'move') {
      let { fold_id = null } = body
      if (fold_id !== null && !(typeof fold_id === 'string' && uuidV4Regex.test(fold_id))) {
        return NextResponse.json<ApiResponse>({ success: false, error: 'fold_id 无效' }, { status: 400 })
      }

      const { data, error } = await supabaseServiceRole
        .from('book_notes')
        .update({ fold_id, updated_at: now })
        .eq('id', id)
        .eq('user_id', userId)
        .select('id,fold_id,updated_at')
        .single()
      if (error) {
        console.error('PUT move error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: '更新失败' }, { status: 500 })
      }
      return NextResponse.json<ApiResponse>({ success: true, data })
    }

    return NextResponse.json<ApiResponse>({ success: false, error: '无效的操作类型' }, { status: 400 })
  } catch (error) {
    console.error('PUT /api/memo-notes error:', error)
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

    // 软删除
    const now = new Date().toISOString()
    const { data, error } = await supabaseServiceRole
      .from('book_notes')
      .update({ is_deleted: true, updated_at: now })
      .in('id', ids)
      .eq('user_id', userId)
      .select('id')

    if (error) {
      console.error('DELETE error:', error)
      return NextResponse.json<ApiResponse>({ success: false, error: '删除失败' }, { status: 500 })
    }

    const deletedIds = (data || []).map((r: any) => r.id)
    return NextResponse.json<ApiResponse>({ success: true, data: { deletedIds } })
  } catch (error) {
    console.error('DELETE /api/memo-notes error:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
