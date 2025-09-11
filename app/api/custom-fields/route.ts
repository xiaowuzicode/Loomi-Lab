import { NextRequest, NextResponse } from 'next/server'
import { customFieldStorage } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const id = searchParams.get('id')
    const action = searchParams.get('action')

    // 验证必填的userId参数
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '缺少必填参数：userId'
      }, { status: 400 })
    }

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({
        success: false,
        error: 'userId格式无效，必须是标准UUID格式'
      }, { status: 400 })
    }
    
    // 获取统计信息
    if (action === 'stats') {
      const stats = await customFieldStorage.getStats(userId)
      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    // 获取列表（分页）
    if (action === 'list' || (!id && !action)) {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const search = searchParams.get('search') || ''
      const userSearch = searchParams.get('userSearch') || ''
      const type = searchParams.get('type') || 'all'
      const appCode = searchParams.get('appCode') || ''
      const amountMin = searchParams.get('amountMin') ? parseFloat(searchParams.get('amountMin')!) : undefined
      const amountMax = searchParams.get('amountMax') ? parseFloat(searchParams.get('amountMax')!) : undefined
      const dateFrom = searchParams.get('dateFrom') || ''
      const dateTo = searchParams.get('dateTo') || ''
      const visibility = searchParams.get('visibility') === 'true' ? true : searchParams.get('visibility') === 'false' ? false : undefined
      const isPublic = searchParams.get('isPublic') === 'true' ? true : searchParams.get('isPublic') === 'false' ? false : undefined
      const sortBy = searchParams.get('sortBy') || 'created_at'
      const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

      const result = await customFieldStorage.getCustomFields({
        page,
        limit,
        search,
        userSearch: userSearch || undefined,
        type,
        appCode: appCode || undefined,
        userId,
        amountMin,
        amountMax,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        visibility,
        isPublic,
        sortBy,
        sortOrder
      })

      return NextResponse.json({
        success: true,
        data: result.records,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      })
    }

    // 根据ID查询单条记录
    if (id) {
      // 验证表格ID的UUID格式
      if (!uuidRegex.test(id)) {
        return NextResponse.json({
          success: false,
          error: '表格ID格式无效，必须是标准UUID格式'
        }, { status: 400 })
      }

      const record = await customFieldStorage.getCustomFieldById(id, userId)
      
      if (!record) {
        return NextResponse.json({
          success: false,
          error: '记录不存在或无权限访问'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        data: record
      })
    }

    return NextResponse.json({
      success: false,
      error: '请提供有效的查询参数'
    }, { status: 400 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      createdUserId,
      appCode,
      type,
      tableName,
      extendedField,
      amount,
      readme,
      exampleData,
      visibility = true,
      isPublic = false
    } = body

    // 验证必填参数
    if (!userId || !createdUserId) {
      return NextResponse.json({
        success: false,
        error: '缺少必填参数：userId 和 createdUserId'
      }, { status: 400 })
    }

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId) || !uuidRegex.test(createdUserId)) {
      return NextResponse.json({
        success: false,
        error: 'userId 和 createdUserId 格式无效，必须是标准UUID格式'
      }, { status: 400 })
    }

    // 基础验证
    if (!appCode || !type || !tableName || !readme || !extendedField) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段'
      }, { status: 400 })
    }
    
    // 验证表名
    if (!tableName.trim() || tableName.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: '表名至少需要2个字符'
      }, { status: 400 })
    }

    // 验证类型
    if (!['洞察', '钩子', '情绪'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: '无效的类型'
      }, { status: 400 })
    }

    // 确保扩展字段包含标题字段
    let titleField = extendedField.find((field: any) => field.key === 'title' || field.label === '标题')
    if (!titleField) {
      // 如果没有标题字段，自动添加（但值为空）
      titleField = { key: 'title', label: '标题', value: '', required: true }
      extendedField.unshift(titleField) // 添加到开头
    }

    // 验证金额
    const amountInCents = Math.round((amount || 0) * 100)
    if (amountInCents < 0) {
      return NextResponse.json({
        success: false,
        error: '金额不能为负数'
      }, { status: 400 })
    }

    const record = await customFieldStorage.createCustomField({
      userId,
      createdUserId,
      appCode,
      type,
      tableName: tableName.trim(),
      extendedField,
      amount: amountInCents,
      readme,
      exampleData,
      visibility,
      isPublic
    })

    return NextResponse.json({
      success: true,
      data: record,
      message: '创建成功'
    }, { status: 201 })

  } catch (error) {
    console.error('创建自定义字段失败:', error)
    return NextResponse.json({
      success: false,
      error: '创建失败'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      id,
      appCode,
      extendedField,
      amount,
      readme,
      exampleData,
      visibility,
      isPublic
    } = body

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

    const updates: any = {}
    
    // 只更新提供的字段
    if (appCode !== undefined) updates.appCode = appCode
    if (extendedField !== undefined) {
      // 确保扩展字段包含标题字段
      let titleField = extendedField.find((field: any) => field.key === 'title' || field.label === '标题')
      if (!titleField) {
        // 如果没有标题字段，自动添加（但值为空）
        titleField = { key: 'title', label: '标题', value: '', required: true }
        extendedField.unshift(titleField) // 添加到开头
      }
      updates.extendedField = extendedField
    }
    if (amount !== undefined) {
      const amountInCents = Math.round(amount * 100)
      if (amountInCents < 0) {
        return NextResponse.json({
          success: false,
          error: '金额不能为负数'
        }, { status: 400 })
      }
      updates.amount = amountInCents
    }
    if (readme !== undefined) updates.readme = readme
    if (exampleData !== undefined) updates.exampleData = exampleData
    if (visibility !== undefined) updates.visibility = visibility
    if (isPublic !== undefined) updates.isPublic = isPublic

    const record = await customFieldStorage.updateCustomField(id, userId, updates)

    if (!record) {
      return NextResponse.json({
        success: false,
        error: '记录不存在或无权限修改'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: record,
      message: '更新成功'
    })

  } catch (error) {
    console.error('更新自定义字段失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新失败'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, id } = body

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

    const record = await customFieldStorage.deleteCustomField(id, userId)

    if (!record) {
      return NextResponse.json({
        success: false,
        error: '记录不存在或无权限删除'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: record,
      message: '删除成功'
    })

  } catch (error) {
    console.error('删除自定义字段失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除失败'
    }, { status: 500 })
  }
}