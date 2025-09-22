import { NextRequest, NextResponse } from 'next/server'
import { customFieldStorage } from '@/lib/supabase'

const uuidRegexV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId: string | undefined = body?.userId
    const tableId: string | undefined = body?.id
    const fieldsRaw = body?.fields

    if (!userId || !tableId) {
      return NextResponse.json({ success: false, error: '缺少必填参数：userId 和 id' }, { status: 400 })
    }

    if (!uuidRegexV4.test(userId) || !uuidRegexV4.test(tableId)) {
      return NextResponse.json({ success: false, error: 'userId 或 id 格式无效，必须是标准UUIDv4' }, { status: 400 })
    }

    if (!Array.isArray(fieldsRaw) || fieldsRaw.length === 0) {
      return NextResponse.json({ success: false, error: '缺少必填参数：fields（行ID数组）' }, { status: 400 })
    }

    const rowIds: number[] = fieldsRaw
      .map((x: any) => typeof x === 'number' ? x : Number(x))
      .filter((n: number) => Number.isFinite(n) && n > 0)

    if (rowIds.length === 0) {
      return NextResponse.json({ success: false, error: 'fields 必须为正整数行ID数组' }, { status: 400 })
    }

    const record = await customFieldStorage.getCustomFieldById(tableId, userId)
    if (!record) {
      return NextResponse.json({ success: false, error: '记录不存在或无权限访问' }, { status: 404 })
    }

    const rowsMap = new Map<number, any>()
    for (const row of (record.extendedField || [])) {
      if (typeof row?.id === 'number') {
        rowsMap.set(row.id, row)
      }
    }

    const found: any[] = []
    const notFound: number[] = []
    for (const id of rowIds) {
      if (rowsMap.has(id)) {
        found.push(rowsMap.get(id))
      } else {
        notFound.push(id)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tableId,
        fields: rowIds,
        rows: found,
        notFound,
      }
    })
  } catch (error) {
    console.error('按行ID批量查询失败:', error)
    return NextResponse.json({ success: false, error: '按行ID批量查询失败' }, { status: 500 })
  }
}


