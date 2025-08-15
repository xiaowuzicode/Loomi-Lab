import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import type { ApiResponse, AuthUser } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    return NextResponse.json<ApiResponse<AuthUser>>({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Get user info error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
