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
      const stats = await userStorage.getUserStatisticsSummary()
      return NextResponse.json({
        success: true,
        data: stats
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
      error: '请提供用户ID或邮箱'
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
    const { userIds } = body

    if (!userIds || !Array.isArray(userIds)) {
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

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
