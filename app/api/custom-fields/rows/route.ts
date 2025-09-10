import { NextRequest, NextResponse } from 'next/server'
import { customFieldStorage } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// POST /api/custom-fields/rows - 添加行
export async function POST(request: NextRequest) {
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
    const { rowData = {} } = body

    const updatedRecord = await customFieldStorage.updateTableRow(
      tableId,
      user.userId,
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

// PUT /api/custom-fields/rows - 更新行或批量操作
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
    const rowId = searchParams.get('rowId')
    const batch = searchParams.get('batch') === 'true'

    if (!tableId) {
      return NextResponse.json({
        success: false,
        error: '缺少表格ID'
      }, { status: 400 })
    }

    const body = await request.json()

    if (batch) {
      // 批量操作
      const { action, rowIds, updates } = body

      if (!['update', 'delete'].includes(action) || !Array.isArray(rowIds)) {
        return NextResponse.json({
          success: false,
          error: '批量操作参数错误'
        }, { status: 400 })
      }

      const updatedRecord = await customFieldStorage.batchUpdateTableRows(
        tableId,
        user.userId,
        { action, rowIds, updates }
      )

      return NextResponse.json({
        success: true,
        data: updatedRecord,
        message: `批量${action === 'update' ? '更新' : '删除'}成功`
      })

    } else {
      // 单行操作
      const { action, rowData } = body

      if (!rowId && !['duplicate'].includes(action)) {
        return NextResponse.json({
          success: false,
          error: '缺少行ID'
        }, { status: 400 })
      }

      const updatedRecord = await customFieldStorage.updateTableRow(
        tableId,
        user.userId,
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
    }

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
    const rowId = searchParams.get('rowId')

    if (!tableId || !rowId) {
      return NextResponse.json({
        success: false,
        error: '缺少表格ID或行ID'
      }, { status: 400 })
    }

    const updatedRecord = await customFieldStorage.updateTableRow(
      tableId,
      user.userId,
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