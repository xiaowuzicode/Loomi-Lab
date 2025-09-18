import { NextRequest, NextResponse } from 'next/server'
import { customFieldStorage } from '@/lib/supabase'

// PUT /api/custom-fields/fields - 字段操作
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, id, action, fieldName, newFieldName } = body

    // 验证必填参数
    if (!userId || !id) {
      return NextResponse.json({
        success: false,
        error: '缺少必填参数：userId 和 id'
      }, { status: 400 })
    }

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId) || !uuidRegex.test(id)) {
      return NextResponse.json({
        success: false,
        error: 'userId 和 id 格式无效，必须是标准UUID格式'
      }, { status: 400 })
    }

    // 验证操作类型
    if (!['add', 'remove', 'rename'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: '无效的操作类型'
      }, { status: 400 })
    }

    // 验证字段名
    if (!fieldName || (action === 'rename' && !newFieldName)) {
      return NextResponse.json({
        success: false,
        error: '缺少字段名参数'
      }, { status: 400 })
    }

    const updatedRecord = await customFieldStorage.updateTableFields(
      id,
      userId,
      { action, fieldName, newFieldName }
    )

    if (!updatedRecord) {
      return NextResponse.json({
        success: false,
        error: '字段操作失败'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: `字段${action === 'add' ? '添加' : action === 'remove' ? '删除' : '重命名'}成功`
    })

  } catch (error) {
    console.error('字段操作失败:', error)
    return NextResponse.json({
      success: false,
      error: '字段操作失败'
    }, { status: 500 })
  }
}