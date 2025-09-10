import { NextRequest, NextResponse } from 'next/server'
import { customFieldStorage } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// PUT /api/custom-fields/fields - 字段操作
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = token ? verifyToken(token) : null

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('id')

    if (!tableId) {
      return NextResponse.json({
        success: false,
        error: '缺少表格ID'
      }, { status: 400 })
    }

    const body = await request.json()
    const { action, fieldName, newFieldName } = body

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

    // 保护标题字段
    if (fieldName === '标题' && (action === 'remove' || action === 'rename')) {
      return NextResponse.json({
        success: false,
        error: '标题字段不可删除或重命名'
      }, { status: 400 })
    }

    const updatedRecord = await customFieldStorage.updateTableFields(
      tableId,
      user.userId,
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