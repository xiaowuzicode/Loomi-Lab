import { NextRequest, NextResponse } from 'next/server'
import { paymentStorage } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const action = searchParams.get('action')

    // 获取支付统计信息
    if (action === 'stats') {
      const stats = await paymentStorage.getPaymentStats()
      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    // 构建过滤条件
    const filters: any = {}
    
    if (status && status !== 'all') {
      filters.status = status
    }
    
    if (userId) {
      filters.userId = userId
    }
    
    if (startDate && endDate) {
      filters.dateRange = {
        start: startDate,
        end: endDate
      }
    }

    const payments = await paymentStorage.getPayments(filters)
    
    return NextResponse.json({
      success: true,
      data: payments,
      total: payments.length
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}
