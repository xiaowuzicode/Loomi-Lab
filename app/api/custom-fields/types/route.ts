import { NextRequest, NextResponse } from 'next/server'
import { customFieldStorage } from '@/lib/supabase'
import { PUBLIC_USER_ID } from '@/lib/constants'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function resolveUserId(scope: string | null, userIdParam: string | null) {
  if (scope === 'public') {
    return PUBLIC_USER_ID
  }
  return userIdParam
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'user'
    const userIdParam = searchParams.get('userId')
    const targetUserId = resolveUserId(scope, userIdParam)

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: '缺少用户ID' }, { status: 400 })
    }

    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json({ success: false, error: '用户ID格式无效' }, { status: 400 })
    }

    const summary = await customFieldStorage.getTypeSummary(targetUserId)
    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    console.error('获取类型列表失败:', error)
    return NextResponse.json({ success: false, error: '获取类型列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, scope = 'user', userId } = body ?? {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: '类型名称不能为空' }, { status: 400 })
    }

    const trimmedName = name.trim()
    if (trimmedName.length > 50) {
      return NextResponse.json({ success: false, error: '类型名称长度不能超过50个字符' }, { status: 400 })
    }

    const targetUserId = resolveUserId(scope, userId)
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: '缺少用户ID' }, { status: 400 })
    }

    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json({ success: false, error: '用户ID格式无效' }, { status: 400 })
    }

    const existing = await customFieldStorage.getTypeSummary(targetUserId)
    const conflicted = existing.some((item) => item.name.toLowerCase() === trimmedName.toLowerCase())
    if (conflicted) {
      return NextResponse.json({ success: false, error: '类型已存在' }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      data: {
        name: trimmedName,
        scope,
        tableCount: 0,
      },
      message: '类型创建成功',
    })
  } catch (error) {
    console.error('创建类型失败:', error)
    return NextResponse.json({ success: false, error: '创建类型失败' }, { status: 500 })
  }
}

