import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { verifyPlainPassword, comparePassword } from '@/lib/password'
import { isValidEmail } from '@/lib/utils'
import type { LoginRequest, LoginResponse, ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // 验证输入
    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户名和密码不能为空'
      }, { status: 400 })
    }

    // 默认管理员账户（从环境变量获取）
    const adminUsername = process.env.ADMIN_EMAIL || 'loomiadmin'
    const adminPassword = process.env.ADMIN_PASSWORD
    
    // 先检查是否为管理员账户登录
    if (adminPassword && email === adminUsername) {
      if (verifyPlainPassword(password, adminPassword)) {
        const authUser = {
          id: 'admin-001',
          email: 'admin@loomi.com',
          username: adminUsername,
          role: 'admin'
        }
        
        const token = generateToken(authUser)

        const response: LoginResponse = {
          user: authUser,
          token
        }

        return NextResponse.json<ApiResponse<LoginResponse>>({
          success: true,
          data: response,
          message: '登录成功'
        })
      } else {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '管理员密码错误'
        }, { status: 401 })
      }
    }

    // 对于普通用户，检查邮箱格式
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '邮箱格式不正确'
      }, { status: 400 })
    }

    // 查询用户
    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .single()

    if (error || !user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户不存在或已被禁用'
      }, { status: 401 })
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '密码错误'
      }, { status: 401 })
    }

    // 生成 JWT token
    const authUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    }
    
    const token = generateToken(authUser)

    // 更新最后登录时间
    await supabase
      .from(TABLES.USERS)
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    const response: LoginResponse = {
      user: authUser,
      token
    }

    return NextResponse.json<ApiResponse<LoginResponse>>({
      success: true,
      data: response,
      message: '登录成功'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
