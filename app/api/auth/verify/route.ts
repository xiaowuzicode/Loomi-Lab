import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import type { ApiResponse, AuthUser } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未登录或Token已失效'
      }, { status: 401 })
    }
    
    return NextResponse.json<ApiResponse<AuthUser>>({
      success: true,
      data: user,
      message: 'Token有效'
    })
    
  } catch (error) {
    console.error('Token验证错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Token验证失败'
    }, { status: 500 })
  }
}