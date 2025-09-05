import { NextRequest, NextResponse } from 'next/server'
import { PaymentDB } from '@/lib/payment-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const params = {
      app_id: searchParams.get('app_id') || undefined,
      status: searchParams.get('status') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      search_term: searchParams.get('search_term') || undefined,
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

    // 获取所有退款数据（用于导出）
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
    `

    const refunds = await PaymentDB.query(dataQuery, queryParams)

    // 转换为 CSV 格式
    const csvHeaders = [
      '退款ID',
      '应用ID',
      '原商户订单号',
      '退款状态',
      '退款金额(元)',
      '原订单金额(元)',
      '货币',
      '退款原因',
      '网关退款ID',
      '原交易号',
      '订单类型',
      '支付网关',
      '创建时间',
      '更新时间'
    ]

    const csvRows = refunds.map((refund: any) => [
      refund.id,
      refund.app_id,
      refund.merchant_order_id || '',
      refund.status === 'succeeded' ? '已完成' :
        refund.status === 'pending' ? '待处理' :
        refund.status === 'processing' ? '处理中' : '失败',
      (refund.refund_amount / 100).toFixed(2),
      refund.original_amount ? (refund.original_amount / 100).toFixed(2) : '0.00',
      refund.currency,
      refund.reason || '',
      refund.gateway_refund_id || '',
      refund.gateway_transaction_id || '',
      refund.order_type === 'payment' ? '支付' : '充值',
      refund.payment_gateway || '',
      new Date(refund.created_at).toLocaleString('zh-CN'),
      new Date(refund.updated_at).toLocaleString('zh-CN')
    ])

    // 生成 CSV 内容
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // 返回 CSV 文件
    const filename = `refunds_export_${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=${filename}`,
        'Content-Length': Buffer.byteLength(csvContent, 'utf8').toString(),
      },
    })

  } catch (error) {
    console.error('Error exporting refunds:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '导出退款数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
