import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 用户存储服务，对应 user_storage.py
export class UserStorage {
  /**
   * 根据用户ID查询用户信息
   */
  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase.rpc('search_users_with_auth', {
        search_term: userId.trim(),
        result_limit: 1
      })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const user = data.find((u: any) => u.user_id === userId.trim())
        if (user) {
          return {
            id: user.user_id,
            email: user.email,
            phone: user.phone,
            created_at: user.created_at,
            updated_at: user.updated_at,
            last_sign_in_at: user.last_sign_in_at,
            raw_user_meta_data: user.raw_user_meta_data,
            display_name: user.display_name,
            avatar_url: user.avatar_url
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  /**
   * 检查用户是否存在
   */
  async checkUserExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('search_users_with_auth', {
        search_term: userId.trim(),
        result_limit: 1
      })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        return data.some((user: any) => user.user_id === userId.trim())
      }
      
      return false
    } catch (error) {
      console.error('检查用户存在性失败:', error)
      return false
    }
  }

  /**
   * 根据邮箱查询用户信息
   */
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase.rpc('search_users_with_auth', {
        search_term: email.trim().toLowerCase(),
        result_limit: 1
      })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const user = data.find((u: any) => 
          u.email && u.email.toLowerCase() === email.trim().toLowerCase()
        )
        
        if (user) {
          return {
            id: user.user_id,
            email: user.email,
            phone: user.phone,
            created_at: user.created_at,
            updated_at: user.updated_at,
            last_sign_in_at: user.last_sign_in_at,
            raw_user_meta_data: user.raw_user_meta_data,
            display_name: user.display_name,
            avatar_url: user.avatar_url
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('根据邮箱获取用户失败:', error)
      return null
    }
  }

  /**
   * 批量查询用户信息
   */
  async getUsersByIds(userIds: string[]) {
    try {
      if (!userIds || userIds.length === 0) return []
      
      const cleanIds = Array.from(new Set(userIds.map(id => id.trim()).filter(Boolean)))
      const users = []
      
      // 由于 search_users_with_auth 没有批量查询功能，需要逐个查询
      for (const userId of cleanIds) {
        const user = await this.getUserById(userId)
        if (user) {
          users.push(user)
        }
      }
      
      return users
    } catch (error) {
      console.error('批量获取用户失败:', error)
      return []
    }
  }

  /**
   * 获取指定日期的新增用户数量
   */
  async getDailyNewUsersCount(targetDate?: string): Promise<number> {
    try {
      const dateStr = targetDate || new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase.rpc('get_daily_new_users_count', {
        target_date: dateStr
      })
      
      if (error) throw error
      
      return data || 0
    } catch (error) {
      console.error('获取新增用户统计失败:', error)
      return 0
    }
  }

  /**
   * 获取用户留存数量
   */
  async getUserRetentionCount(daysBack: number = 7, targetDate?: string): Promise<number> {
    try {
      const dateStr = targetDate || new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase.rpc('get_user_retention_count', {
        target_date: dateStr,
        days_back: daysBack
      })
      
      if (error) throw error
      
      return data || 0
    } catch (error) {
      console.error('获取用户留存统计失败:', error)
      return 0
    }
  }

  /**
   * 获取用户统计汇总信息
   */
  async getUserStatisticsSummary(targetDate?: string) {
    try {
      const dateStr = targetDate || new Date().toISOString().split('T')[0]
      
      const [newUsersCount, retentionCount] = await Promise.all([
        this.getDailyNewUsersCount(dateStr),
        this.getUserRetentionCount(7, dateStr)
      ])
      
      return {
        target_date: dateStr,
        daily_new_users: newUsersCount,
        user_retention_7d: retentionCount
      }
    } catch (error) {
      console.error('获取用户统计汇总失败:', error)
      return {
        target_date: dateStr || 'unknown',
        daily_new_users: 0,
        user_retention_7d: 0
      }
    }
  }
}

// 创建全局实例
export const userStorage = new UserStorage()

// 其他数据库服务可以在这里添加
export class PaymentStorage {
  async getPayments(filters?: {
    status?: string
    dateRange?: { start: string; end: string }
    userId?: string
  }) {
    try {
      let query = supabase
        .from('payments')
        .select('*')
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }
      
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取支付记录失败:', error)
      return []
    }
  }

  async getPaymentStats() {
    try {
      const { data, error } = await supabase.rpc('get_payment_statistics')
      
      if (error) throw error
      return data || {
        total_revenue: 0,
        today_revenue: 0,
        total_orders: 0,
        success_orders: 0
      }
    } catch (error) {
      console.error('获取支付统计失败:', error)
      return {
        total_revenue: 0,
        today_revenue: 0,
        total_orders: 0,
        success_orders: 0
      }
    }
  }
}

export const paymentStorage = new PaymentStorage()
