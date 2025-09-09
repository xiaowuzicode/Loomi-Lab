import { NextRequest, NextResponse } from 'next/server'
import { customFieldStorage } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = token ? verifyToken(token) : null

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')
    
    // 获取统计信息
    if (action === 'stats') {
      const userId = user?.userId || 'admin-001' // 使用验证用户ID或默认admin-001
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

      const userId = user?.userId || 'admin-001' // 使用验证用户ID或默认admin-001

      const result = await customFieldStorage.getCustomFields({
        page,
        limit,
        search,
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
      const userId = user?.userId || 'admin-001' // 使用验证用户ID或默认admin-001
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = token ? verifyToken(token) : null

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    const body = await request.json()
    const {
      appCode,
      type,
      extendedField,
      amount,
      readme,
      exampleData,
      visibility = true,
      isPublic = false
    } = body

    // 基础验证
    if (!appCode || !type || !readme || !extendedField) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段'
      }, { status: 400 })
    }

    // 验证类型
    if (!['洞察', '钩子', '情绪'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: '无效的类型'
      }, { status: 400 })
    }

    // 验证扩展字段必须包含标题
    const titleField = extendedField.find((field: any) => field.key === 'title')
    if (!titleField || !titleField.value) {
      return NextResponse.json({
        success: false,
        error: '标题字段是必填的'
      }, { status: 400 })
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
      userId: '00000000-0000-0000-0000-000000000001', // 使用有效的UUID格式代表管理员
      createdUserId: '00000000-0000-0000-0000-000000000001', // 使用有效的UUID格式代表管理员
      appCode,
      type,
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = token ? verifyToken(token) : null

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少记录ID'
      }, { status: 400 })
    }

    const body = await request.json()
    const {
      appCode,
      extendedField,
      amount,
      readme,
      exampleData,
      visibility,
      isPublic
    } = body

    const updates: any = {}
    
    // 只更新提供的字段
    if (appCode !== undefined) updates.appCode = appCode
    if (extendedField !== undefined) {
      // 验证扩展字段必须包含标题
      const titleField = extendedField.find((field: any) => field.key === 'title')
      if (!titleField || !titleField.value) {
        return NextResponse.json({
          success: false,
          error: '标题字段是必填的'
        }, { status: 400 })
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

    const record = await customFieldStorage.updateCustomField(id, user.userId, updates)

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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = token ? verifyToken(token) : null

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少记录ID'
      }, { status: 400 })
    }

    const record = await customFieldStorage.deleteCustomField(id, user.userId)

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