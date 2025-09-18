import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'

const TABLE = 'book_user_memory'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LEVEL_VALUES = new Set(['user', 'project'])

function isValidUuid(value?: string | null): value is string {
  return !!value && UUID_REGEX.test(value)
}

function isValidLevel(value: unknown): value is 'user' | 'project' {
  return typeof value === 'string' && LEVEL_VALUES.has(value)
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 })
}

function notFound(message = '记录不存在或已删除') {
  return NextResponse.json({ success: false, error: message }, { status: 404 })
}

function serverError(error: unknown, fallback = '服务器内部错误') {
  console.error('[user-memory] Error:', error)
  return NextResponse.json({ success: false, error: fallback }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const id = searchParams.get('id')

    if (!isValidUuid(userId)) {
      return badRequest('缺少必填参数 userId 或格式无效')
    }

    // 详情查询
    if (id) {
      if (!isValidUuid(id)) {
        return badRequest('id 格式无效')
      }

      const { data, error } = await supabaseServiceRole
        .from(TABLE)
        .select('id,user_id,memory_name,level,memory,created_at,updated_at')
        .eq('id', id)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .maybeSingle()

      if (error) {
        return serverError(error)
      }

      if (!data) {
        return notFound()
      }

      return NextResponse.json({ success: true, data })
    }

    // 列表查询
    const level = searchParams.get('level')
    const search = searchParams.get('search')?.trim()
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
    const limitRaw = parseInt(searchParams.get('limit') || '20', 10)
    const limit = Math.min(Math.max(limitRaw || 20, 1), 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const query = supabaseServiceRole
      .from(TABLE)
      .select('id,memory_name,level,updated_at', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })

    if (level && isValidLevel(level)) {
      query.eq('level', level)
    }

    if (search) {
      query.ilike('memory_name', `%${search}%`)
    }

    const { data, count, error } = await query.range(from, to)

    if (error) {
      return serverError(error)
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId: string | undefined = body?.userId
    const memoryName: string | undefined = body?.memory_name
    const level: string | undefined = body?.level
    const memory = body?.memory

    if (!isValidUuid(userId)) {
      return badRequest('userId 必须为有效的 UUID')
    }

    const trimmedName = memoryName?.trim() || ''
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return badRequest('memory_name 长度需在 1-100 之间')
    }

    if (level !== undefined && level !== null && !isValidLevel(level)) {
      return badRequest('level 仅支持 user 或 project')
    }

    if (memory !== undefined && memory !== null && !isPlainObject(memory)) {
      return badRequest('memory 必须为 JSON 对象')
    }

    const payload: Record<string, any> = {
      user_id: userId,
      memory_name: trimmedName,
      level: level ? level : null,
      memory: memory ?? null,
      is_deleted: false,
    }

    const { data, error } = await supabaseServiceRole
      .from(TABLE)
      .insert(payload)
      .select('id,created_at,updated_at')
      .maybeSingle()

    if (error) {
      return serverError(error)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const userId: string | undefined = body?.userId
    const id: string | undefined = body?.id
    const action: string | undefined = body?.action

    if (!isValidUuid(userId)) {
      return badRequest('userId 必须为有效的 UUID')
    }
    if (!isValidUuid(id)) {
      return badRequest('id 必须为有效的 UUID')
    }
    if (!action) {
      return badRequest('缺少 action 参数')
    }

    const { data: existing, error: fetchError } = await supabaseServiceRole
      .from(TABLE)
      .select('id,memory_name,level,memory')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .maybeSingle()

    if (fetchError) {
      return serverError(fetchError)
    }

    if (!existing) {
      return notFound()
    }

    const updates: Record<string, any> = {}

    if (action === 'rename') {
      const name = (body?.memory_name ?? '').trim()
      if (name.length < 1 || name.length > 100) {
        return badRequest('memory_name 长度需在 1-100 之间')
      }
      updates.memory_name = name
    } else if (action === 'update-json') {
      const merge = Boolean(body?.merge)
      const payload = body?.memory

      if (payload !== undefined && payload !== null && !isPlainObject(payload)) {
        return badRequest('memory 必须为 JSON 对象')
      }

      let newMemory: Record<string, any> | null = payload ?? null

      if (merge) {
        const base = isPlainObject(existing.memory) ? { ...existing.memory } : {}
        if (isPlainObject(payload)) {
          newMemory = { ...base, ...payload }
        } else {
          newMemory = base
        }
      }

      updates.memory = newMemory
    } else if (action === 'update-level') {
      const level = body?.level
      if (level === null || level === undefined || level === '') {
        updates.level = null
      } else if (isValidLevel(level)) {
        updates.level = level
      } else {
        return badRequest('level 仅支持 user 或 project 或留空')
      }
    } else {
      return badRequest('action 不支持')
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseServiceRole
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .select('id,memory_name,level,memory,updated_at')
      .maybeSingle()

    if (error) {
      return serverError(error)
    }

    if (!data) {
      return notFound()
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return serverError(error)
  }
}

interface DeleteBody {
  userId?: string
  ids?: string[]
}

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteBody = await request.json()
    const userId = body.userId
    const ids = body.ids

    if (!isValidUuid(userId)) {
      return badRequest('userId 必须为有效的 UUID')
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return badRequest('ids 必须为非空数组')
    }

    if (ids.length > 50) {
      return badRequest('一次最多删除 50 条记录')
    }

    const invalidId = ids.find((item) => !isValidUuid(item))
    if (invalidId) {
      return badRequest(`无效的记录 ID: ${invalidId}`)
    }

    const { data, error } = await supabaseServiceRole
      .from(TABLE)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .in('id', ids)
      .select('id')

    if (error) {
      return serverError(error)
    }

    const deletedIds = (data || []).map((item) => item.id)
    const failedIds = ids.filter((id) => !deletedIds.includes(id))

    return NextResponse.json({
      success: true,
      data: {
        deletedIds,
        failedIds,
      },
    })
  } catch (error) {
    return serverError(error)
  }
}
