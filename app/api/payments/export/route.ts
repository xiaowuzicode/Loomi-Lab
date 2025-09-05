import { NextRequest, NextResponse } from 'next/server'
import { PaymentDB, PaymentOrder } from '@/lib/payment-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const params = {
      app_id: searchParams.get('app_id') || undefined,
      status: searchParams.get('status') || undefined,
      order_type: searchParams.get('order_type') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      search_term: searchParams.get('search_term') || undefined,
    }

    // 构建查询SQL
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (params.app_id) {
      whereConditions.push(`app_id = $${paramIndex++}`)
      queryParams.push(params.app_id)
    }

    if (params.status && params.status !== 'all') {
      whereConditions.push(`status = $${paramIndex++}`)
      queryParams.push(params.status)
    }

    if (params.order_type && params.order_type !== 'all') {
      whereConditions.push(`order_type = $${paramIndex++}`)
      queryParams.push(params.order_type)
    }

    if (params.start_date) {
      whereConditions.push(`created_at >= $${paramIndex++}`)
      queryParams.push(params.start_date)
    }

    if (params.end_date) {
      whereConditions.push(`created_at <= $${paramIndex++}`)
      queryParams.push(params.end_date)
    }

    if (params.search_term) {
      whereConditions.push(`(merchant_order_id ILIKE $${paramIndex} OR gateway_transaction_id ILIKE $${paramIndex} OR extra_data::text ILIKE $${paramIndex})`)
      queryParams.push(`%${params.search_term}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 获取所有数据（用于导出）
    const dataQuery = `
      SELECT 
        id,
        app_id,
        merchant_order_id,
        status,
        order_type,
        amount,
        currency,
        payment_gateway,
        gateway_transaction_id,
        extra_data,
        created_at,
        updated_at
      FROM payment_orders 
      ${whereClause}
      ORDER BY created_at DESC
    `

    const payments = await PaymentDB.query<PaymentOrder>(dataQuery, queryParams)

    // 转换为 CSV 格式
    const csvHeaders = [
      'ID',
      '应用ID',
      '商户订单号',
      '状态',
      '订单类型',
      '金额(元)',
      '货币',
      '支付网关',
      '网关交易号',
      '创建时间',
      '更新时间'
    ]

    const csvRows = payments.map(payment => [
      payment.id,
      payment.app_id,
      payment.merchant_order_id,
      payment.status === 'succeeded' ? '已完成' :
        payment.status === 'pending' ? '待处理' :
        payment.status === 'processing' ? '处理中' : '失败',
      payment.order_type === 'payment' ? '支付' : '充值',
      (payment.amount / 100).toFixed(2),
      payment.currency,
      payment.payment_gateway,
      payment.gateway_transaction_id || '',
      new Date(payment.created_at).toLocaleString('zh-CN'),
      new Date(payment.updated_at).toLocaleString('zh-CN')
    ])

    // 生成 CSV 内容
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // 返回 CSV 文件
    const filename = `payments_export_${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=${filename}`,
        'Content-Length': Buffer.byteLength(csvContent, 'utf8').toString(),
      },
    })

  } catch (error) {
    console.error('Error exporting payments:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '导出支付数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
