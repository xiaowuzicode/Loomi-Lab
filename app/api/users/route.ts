import { NextRequest, NextResponse } from 'next/server'
import { userStorage } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    const email = searchParams.get('email')
    const action = searchParams.get('action')
    
    // 获取用户统计信息
    if (action === 'stats') {
      const stats = await userStorage.getUserStats()
      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    // 获取用户列表（分页）
    if (action === 'list') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '12')
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status') || 'all'
      const role = searchParams.get('role') || 'all'

      const result = await userStorage.getUsers({
        page,
        limit,
        search,
        status,
        role
      })

      return NextResponse.json({
        success: true,
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      })
    }

    // 根据用户ID查询
    if (userId) {
      const user = await userStorage.getUserById(userId)
      if (!user) {
        return NextResponse.json({
          success: false,
          error: '用户不存在'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        data: user
      })
    }

    // 根据邮箱查询
    if (email) {
      const user = await userStorage.getUserByEmail(email)
      if (!user) {
        return NextResponse.json({
          success: false,
          error: '用户不存在'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        data: user
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
    const { action, userIds, userId, updates } = body

    // 批量获取用户信息
    if (action === 'batch' && userIds) {
      if (!Array.isArray(userIds)) {
        return NextResponse.json({
          success: false,
          error: '请提供用户ID数组'
        }, { status: 400 })
      }

      const users = await userStorage.getUsersByIds(userIds)
      
      return NextResponse.json({
        success: true,
        data: users,
        total: users.length
      })
    }

    // 更新用户信息
    if (action === 'update' && userId && updates) {
      const user = await userStorage.updateUser(userId, updates)
      
      if (!user) {
        return NextResponse.json({
          success: false,
          error: '更新用户信息失败'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: user,
        message: '用户信息更新成功'
      })
    }

    // 封禁用户
    if (action === 'ban' && userId) {
      const banUntil = body.banUntil ? new Date(body.banUntil) : undefined
      const user = await userStorage.banUser(userId, banUntil)
      
      if (!user) {
        return NextResponse.json({
          success: false,
          error: '封禁用户失败'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: user,
        message: '用户封禁成功'
      })
    }

    // 解封用户
    if (action === 'unban' && userId) {
      const user = await userStorage.unbanUser(userId)
      
      if (!user) {
        return NextResponse.json({
          success: false,
          error: '解封用户失败'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: user,
        message: '用户解封成功'
      })
    }

    return NextResponse.json({
      success: false,
      error: '请提供有效的操作参数'
    }, { status: 400 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '请提供用户ID'
      }, { status: 400 })
    }

    const user = await userStorage.deleteUser(userId)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '删除用户失败'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: '用户删除成功'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}