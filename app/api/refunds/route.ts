import { NextRequest, NextResponse } from 'next/server'
import { PaymentDB, RefundOrder, RefundQueryParams } from '@/lib/payment-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const params: RefundQueryParams = {
      app_id: searchParams.get('app_id') || undefined,
      status: searchParams.get('status') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      search_term: searchParams.get('search_term') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    }

    // 构建查询SQL
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (params.app_id) {
      whereConditions.push(`r.app_id = $${paramIndex++}`)
      queryParams.push(params.app_id)
    }

    if (params.status && params.status !== 'all') {
      whereConditions.push(`r.status = $${paramIndex++}`)
      queryParams.push(params.status)
    }

    if (params.start_date) {
      whereConditions.push(`r.created_at >= $${paramIndex++}`)
      queryParams.push(params.start_date)
    }

    if (params.end_date) {
      whereConditions.push(`r.created_at <= $${paramIndex++}`)
      queryParams.push(params.end_date)
    }

    if (params.search_term) {
      whereConditions.push(`(p.merchant_order_id ILIKE $${paramIndex} OR r.gateway_refund_id ILIKE $${paramIndex} OR r.reason ILIKE $${paramIndex})`)
      queryParams.push(`%${params.search_term}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM refund_orders r
      LEFT JOIN payment_orders p ON r.payment_order_id = p.id
      ${whereClause}
    `
    const countResult = await PaymentDB.queryOne<{count: string}>(countQuery, queryParams.slice())
    const total = parseInt(countResult?.count || '0')

    // 获取数据
    const offset = (params.page! - 1) * params.limit!
    const dataQuery = `
      SELECT 
        r.id,
        r.app_id,
        r.payment_order_id,
        r.status,
        r.amount as refund_amount,
        r.currency,
        r.reason,
        r.gateway_refund_id,
        r.extra_data,
        r.created_at,
        r.updated_at,
        p.merchant_order_id,
        p.amount as original_amount,
        p.gateway_transaction_id,
        p.order_type,
        p.payment_gateway
      FROM refund_orders r
      LEFT JOIN payment_orders p ON r.payment_order_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    const dataParams = [...queryParams, params.limit, offset]

    const refunds = await PaymentDB.query<RefundOrder & {
      merchant_order_id: string
      original_amount: number
      gateway_transaction_id: string
      order_type: string
      payment_gateway: string
    }>(dataQuery, dataParams)

    // 获取退款统计数据
    const statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN r.status = 'succeeded' THEN r.amount ELSE 0 END), 0) as total_refunds,
        COALESCE(SUM(CASE WHEN r.status = 'succeeded' AND DATE(r.created_at) = CURRENT_DATE THEN r.amount ELSE 0 END), 0) as today_refunds,
        COUNT(*) as total_refund_orders,
        COUNT(CASE WHEN r.status = 'succeeded' THEN 1 END) as completed_refunds,
        COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_refunds,
        COUNT(CASE WHEN r.status = 'failed' THEN 1 END) as failed_refunds
      FROM refund_orders r
      ${params.app_id ? 'WHERE r.app_id = $1' : ''}
    `
    const statsParams = params.app_id ? [params.app_id] : []
    const stats = await PaymentDB.queryOne(statsQuery, statsParams)

    return NextResponse.json({
      success: true,
      data: refunds,
      stats: stats || {
        total_refunds: 0,
        today_refunds: 0,
        total_refund_orders: 0,
        completed_refunds: 0,
        pending_refunds: 0,
        failed_refunds: 0
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit!),
      }
    })
  } catch (error) {
    console.error('Error fetching refund orders:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '获取退款订单失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
