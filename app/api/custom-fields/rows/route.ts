import { NextRequest, NextResponse } from 'next/server'
import { customFieldStorage } from '@/lib/supabase'

// POST /api/custom-fields/rows - 添加行
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, id, rowData = {} } = body

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

    const updatedRecord = await customFieldStorage.updateTableRow(
      id,
      userId,
      { action: 'add', rowData }
    )

    if (!updatedRecord) {
      return NextResponse.json({
        success: false,
        error: '添加行失败'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: '添加行成功'
    })

  } catch (error) {
    console.error('添加行失败:', error)
    return NextResponse.json({
      success: false,
      error: '添加行失败'
    }, { status: 500 })
  }
}

// PUT /api/custom-fields/rows - 更新行
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, id, rowId, action, rowData } = body

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

    // 单行操作
    if (!rowId && !['duplicate'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: '缺少行ID'
      }, { status: 400 })
    }

    const updatedRecord = await customFieldStorage.updateTableRow(
      id,
      userId,
      { 
        action: action || 'update', 
        rowId: rowId ? parseInt(rowId) : undefined, 
        rowData 
      }
    )

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: `${action === 'update' ? '更新' : action === 'duplicate' ? '复制' : '操作'}成功`
    })

  } catch (error) {
    console.error('行操作失败:', error)
    return NextResponse.json({
      success: false,
      error: '行操作失败'
    }, { status: 500 })
  }
}

// DELETE /api/custom-fields/rows - 删除行
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, id, rowId } = body

    // 验证必填参数
    if (!userId || !id || rowId === undefined) {
      return NextResponse.json({
        success: false,
        error: '缺少必填参数：userId、id 和 rowId'
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

    const updatedRecord = await customFieldStorage.updateTableRow(
      id,
      userId,
      { action: 'delete', rowId: parseInt(rowId) }
    )

    if (!updatedRecord) {
      return NextResponse.json({
        success: false,
        error: '删除行失败'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: '删除行成功'
    })

  } catch (error) {
    console.error('删除行失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除行失败'
    }, { status: 500 })
  }
}