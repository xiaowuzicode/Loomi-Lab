import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabase, TABLES } from '@/lib/db'
import type { ApiResponse, DashboardStats } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    // 并行查询各项统计数据
    const [
      totalUsersResult,
      activeUsersResult,
      totalRevenueResult,
      tokenConsumptionResult
    ] = await Promise.all([
      // 总用户数
      supabase
        .from(TABLES.USERS)
        .select('id', { count: 'exact' })
        .neq('role', 'admin'),
      
      // 活跃用户数（最近30天有登录）
      supabase
        .from(TABLES.USERS)
        .select('id', { count: 'exact' })
        .neq('role', 'admin')
        .gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // 总收入（已完成的支付）
      supabase
        .from(TABLES.PAYMENTS)
        .select('amount')
        .eq('status', 'completed'),
      
      // Token 消耗（模拟数据，实际应该从使用记录表查询）
      Promise.resolve({ data: [{ total_tokens: 1234567 }] })
    ])

    // 计算统计数据
    const totalUsers = totalUsersResult.count || 0
    const activeUsers = activeUsersResult.count || 0
    
    const totalRevenue = totalRevenueResult.data?.reduce(
      (sum, payment) => sum + payment.amount, 
      0
    ) || 0
    
    const tokenConsumption = 1234567 // 模拟数据

    // 计算增长率（模拟数据，实际需要对比上个月的数据）
    const userGrowth = 12.5 // 12.5%
    const revenueGrowth = 8.3 // 8.3%

    const stats: DashboardStats = {
      totalUsers,
      activeUsers,
      totalRevenue,
      tokenConsumption,
      userGrowth,
      revenueGrowth
    }

    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取统计数据失败'
    }, { status: 500 })
  }
}
