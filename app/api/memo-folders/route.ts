import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseServiceRole } from '@/lib/supabase'
import { Folders, type FolderNode, insertFolder, renameFolder, moveFolder, deleteFolder, validateFolderName } from '@/lib/folders'

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function userExists(userId: string): Promise<boolean> {
  const { data, error } = await supabaseServiceRole
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  if (error) return false
  return !!data
}

const TYPE_LABEL_MAP: Record<string, string> = {
  memo: '备忘录',
  posts: '帖子',
}

function resolveFoldType(type: unknown): string | null {
  if (typeof type !== 'string') return null
  const trimmed = type.trim()
  if (!trimmed) return null
  const mapped = TYPE_LABEL_MAP[trimmed.toLowerCase()]
  return mapped || trimmed
}

async function getUserRecord(userId: string, foldType: string) {
  const { data, error } = await supabaseServiceRole
    .from('book_folds')
    .select('id,user_id,fold_structure,type,created_at,updated_at')
    .eq('user_id', userId)
    .eq('type', foldType)
    .maybeSingle()
  if (error) throw error
  return data
}

async function initUserRecord(userId: string, foldType: string) {
  const { data, error } = await supabaseServiceRole
    .from('book_folds')
    .insert({ user_id: userId, fold_structure: [], type: foldType })
    .select('id,user_id,fold_structure,type,created_at,updated_at')
    .single()
  if (error) throw error
  return data
}

async function updateUserStructure(userId: string, foldType: string, structure: FolderNode[]) {
  const { data, error } = await supabaseServiceRole
    .from('book_folds')
    .update({ fold_structure: structure, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('type', foldType)
    .select('id,user_id,fold_structure,type,created_at,updated_at')
    .single()

  if (error) throw error
  return data
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const typeParam = searchParams.get('type')
    const foldType = resolveFoldType(typeParam)

    if (!userId) {
      return NextResponse.json({ success: false, error: '缺少必填参数：userId' }, { status: 400 })
    }
    if (!uuidV4Regex.test(userId)) {
      return NextResponse.json({ success: false, error: 'userId 格式无效，必须是标准UUID格式' }, { status: 400 })
    }
    if (!foldType) {
      return NextResponse.json({ success: false, error: '缺少必填参数：type' }, { status: 400 })
    }

    const existing = await getUserRecord(userId, foldType)
    if (existing) {
      const folders: FolderNode[] = Array.isArray(existing.fold_structure) ? existing.fold_structure : []
      return NextResponse.json({ success: true, data: { folders } })
    }

    const exists = await userExists(userId)
    if (!exists) {
      return NextResponse.json({ success: true, data: { folders: [] } })
    }

    return NextResponse.json({ success: true, data: { folders: [] } })
  } catch (error) {
    console.error('GET /api/memo-folders error:', error)
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, fold_name, parent_id = null, position = 0 } = body || {}

    if (!userId || !uuidV4Regex.test(userId)) {
      return NextResponse.json({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }
    const foldType = resolveFoldType(type)
    if (!foldType) {
      return NextResponse.json({ success: false, error: 'type 缺失或格式无效' }, { status: 400 })
    }
    if (!validateFolderName(fold_name)) {
      return NextResponse.json({ success: false, error: '文件夹名称长度需为 1-50 个字符' }, { status: 400 })
    }
    if (parent_id && !uuidV4Regex.test(parent_id)) {
      return NextResponse.json({ success: false, error: 'parent_id 格式无效' }, { status: 400 })
    }

    if (!(await userExists(userId))) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 400 })
    }

    const rec = (await getUserRecord(userId, foldType)) || (await initUserRecord(userId, foldType))
    const curr = Array.isArray(rec.fold_structure) ? rec.fold_structure : []

    const newNode: FolderNode = {
      fold_id: (globalThis as any).crypto?.randomUUID?.() || randomUUID(),
      fold_name: String(fold_name).trim(),
      children: [],
    }

    const next = insertFolder(curr, newNode, parent_id, Number(position) || 0, Folders.MAX_DEPTH)
    const updated = await updateUserStructure(userId, foldType, next)

    return NextResponse.json({ success: true, data: { folders: updated.fold_structure, created: newNode } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '服务器内部错误'
    console.error('POST /api/memo-folders error:', error)
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, action } = body || {}

    if (!userId || !uuidV4Regex.test(userId)) {
      return NextResponse.json({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }
    const foldType = resolveFoldType(type)
    if (!foldType) {
      return NextResponse.json({ success: false, error: 'type 缺失或格式无效' }, { status: 400 })
    }

    if (!(await userExists(userId))) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 400 })
    }
    const rec = await getUserRecord(userId, foldType)
    if (!rec) {
      return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 })
    }
    const curr = Array.isArray(rec.fold_structure) ? rec.fold_structure : []

    if (action === 'rename') {
      const { fold_id, fold_name } = body
      if (!fold_id || !uuidV4Regex.test(fold_id)) {
        return NextResponse.json({ success: false, error: 'fold_id 缺失或格式无效' }, { status: 400 })
      }
      if (!validateFolderName(fold_name)) {
        return NextResponse.json({ success: false, error: '文件夹名称长度需为 1-50 个字符' }, { status: 400 })
      }
      const next = renameFolder(curr, fold_id, String(fold_name).trim())
      const updated = await updateUserStructure(userId, foldType, next)
      return NextResponse.json({ success: true, data: { folders: updated.fold_structure } })
    }

    if (action === 'move') {
      const { fold_id, new_parent_id = null, position = 0 } = body
      if (!fold_id || !uuidV4Regex.test(fold_id)) {
        return NextResponse.json({ success: false, error: 'fold_id 缺失或格式无效' }, { status: 400 })
      }
      if (new_parent_id && !uuidV4Regex.test(new_parent_id)) {
        return NextResponse.json({ success: false, error: 'new_parent_id 格式无效' }, { status: 400 })
      }
      const next = moveFolder(curr, fold_id, new_parent_id, Number(position) || 0, Folders.MAX_DEPTH)
      const updated = await updateUserStructure(userId, foldType, next)
      return NextResponse.json({ success: true, data: { folders: updated.fold_structure } })
    }

    return NextResponse.json({ success: false, error: '无效的操作类型' }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '服务器内部错误'
    console.error('PUT /api/memo-folders error:', error)
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, fold_id } = body || {}

    if (!userId || !uuidV4Regex.test(userId)) {
      return NextResponse.json({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }
    const foldType = resolveFoldType(type)
    if (!foldType) {
      return NextResponse.json({ success: false, error: 'type 缺失或格式无效' }, { status: 400 })
    }
    if (!fold_id || !uuidV4Regex.test(fold_id)) {
      return NextResponse.json({ success: false, error: 'fold_id 缺失或格式无效' }, { status: 400 })
    }

    if (!(await userExists(userId))) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 400 })
    }
    const rec = await getUserRecord(userId, foldType)
    if (!rec) {
      return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 })
    }
    const curr = Array.isArray(rec.fold_structure) ? rec.fold_structure : []

    const { structure: next, deletedIds } = deleteFolder(curr, fold_id)
    if (deletedIds.length === 0) {
      return NextResponse.json({ success: false, error: '目标文件夹不存在' }, { status: 404 })
    }
    const updated = await updateUserStructure(userId, foldType, next)
    return NextResponse.json({ success: true, data: { folders: updated.fold_structure, deletedIds } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '服务器内部错误'
    console.error('DELETE /api/memo-folders error:', error)
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}
