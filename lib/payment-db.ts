import { Pool, PoolClient } from 'pg'
import { SecureConfig } from './encryption'

// 从加密的环境变量中获取支付系统数据库连接配置
function getPaymentDbConfig() {
  try {
    // 优先使用加密配置
    if (process.env.PAYMENT_DB_ENCRYPTED) {
      const config = SecureConfig.getDatabaseConfig('PAYMENT_DB')
      SecureConfig.validateConfig(config, ['host', 'port', 'database', 'user', 'password'])
      return config
    }
    
    // 降级到环境变量配置（用于开发环境）
    if (process.env.PAYMENT_DB_HOST && 
        process.env.PAYMENT_DB_USER && 
        process.env.PAYMENT_DB_PASSWORD) {
      
      console.warn('⚠️  使用未加密的数据库配置，建议在生产环境使用 PAYMENT_DB_ENCRYPTED')
      
      return {
        host: process.env.PAYMENT_DB_HOST,
        port: parseInt(process.env.PAYMENT_DB_PORT || '5432'),
        database: process.env.PAYMENT_DB_NAME || 'loomi_pay',
        user: process.env.PAYMENT_DB_USER,
        password: process.env.PAYMENT_DB_PASSWORD,
        max: parseInt(process.env.PAYMENT_DB_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    }
    
    throw new Error('支付数据库配置缺失，请设置 PAYMENT_DB_ENCRYPTED 或相关环境变量')
  } catch (error) {
    console.error('获取支付数据库配置失败:', error)
    throw error
  }
}

const paymentDbConfig = getPaymentDbConfig()

// 创建连接池
const pool = new Pool(paymentDbConfig)

// 测试数据库连接
pool.on('connect', () => {
  console.log('Connected to payment database')
})

pool.on('error', (err) => {
  console.error('Payment database connection error:', err)
})

// 数据库查询方法
export class PaymentDB {
  /**
   * 执行查询
   */
  static async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await pool.connect()
    try {
      const result = await client.query(text, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  /**
   * 获取单条记录
   */
  static async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(text, params)
    return results.length > 0 ? results[0] : null
  }

  /**
   * 执行事务
   */
  static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

// 支付订单接口
export interface PaymentOrder {
  id: string
  app_id: string
  merchant_order_id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  order_type: 'payment' | 'recharge'
  amount: number
  currency: string
  payment_gateway: string
  gateway_transaction_id?: string
  extra_data?: any
  created_at: string
  updated_at: string
}

// 退款订单接口
export interface RefundOrder {
  id: string
  app_id: string
  payment_order_id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  amount: number
  currency: string
  reason?: string
  gateway_refund_id?: string
  extra_data?: any
  created_at: string
  updated_at: string
}

// 查询条件接口
export interface PaymentQueryParams {
  app_id?: string
  status?: string
  order_type?: string
  start_date?: string
  end_date?: string
  search_term?: string
  page?: number
  limit?: number
}

export interface RefundQueryParams {
  app_id?: string
  status?: string
  start_date?: string
  end_date?: string
  search_term?: string
  page?: number
  limit?: number
}

// 统计数据接口
export interface PaymentStats {
  total_revenue: number
  today_revenue: number
  total_orders: number
  completed_orders: number
  pending_orders: number
  failed_orders: number
  refund_orders: number
  total_refunds: number
}
