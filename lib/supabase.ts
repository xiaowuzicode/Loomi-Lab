import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY



if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 客户端 Supabase 实例（用于前端）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端 Supabase 实例（用于后端 API，拥有更高权限）
export const supabaseServiceRole = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase

// 用户管理服务（基于 Supabase auth.users 表）
export class UserStorage {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * 获取用户列表（分页）
   * 使用 RPC 函数来访问 auth.users 表
   */
  async getUsers(options: {
    page?: number
    limit?: number
    search?: string
    status?: string
    role?: string
  } = {}) {
    try {
      const { page = 1, limit = 12, search = '', status = 'all', role = 'all' } = options
      const offset = (page - 1) * limit

      // 使用 RPC 函数搜索用户
      const { data, error } = await this.supabase
        .rpc('lab_search_users', {
          search_term: search,
          result_limit: limit,
          result_offset: offset
        })

      if (error) throw error

      // 获取总用户数或搜索结果总数
      let totalCount = 0
      let countError = null
      
      if (search && search.trim() !== '') {
        // 有搜索条件时，获取搜索结果总数
        const { data: searchCount, error: searchCountError } = await this.supabase
          .rpc('lab_get_search_users_count', { search_term: search })
        totalCount = searchCount || 0
        countError = searchCountError
      } else {
        // 无搜索条件时，获取总用户数
        const { data: allCount, error: allCountError } = await this.supabase
          .rpc('lab_get_total_users')
        totalCount = allCount || 0
        countError = allCountError
      }

      if (countError) {
        console.error('获取用户总数失败:', countError)
      }

      // 转换数据格式
      let users = (data || []).map((user: any) => this.transformUserData(user))

      // 应用前端过滤器
      let filteredUsers = users
      const hasStatusFilter = status !== 'all'
      const hasRoleFilter = role !== 'all'
      
      if (hasStatusFilter) {
        filteredUsers = filteredUsers.filter((user: any) => {
          switch (status) {
            case 'active':
              return user.status === 'active'
            case 'inactive':
              return user.status === 'inactive'
            case 'banned':
              return user.status === 'banned'
            default:
              return true
          }
        })
      }

      if (hasRoleFilter) {
        filteredUsers = filteredUsers.filter((user: any) => user.role === role)
      }

      // 计算总数和分页
      let actualTotal = totalCount || 0
      let actualTotalPages = Math.ceil(actualTotal / limit)
      
      // 如果有前端过滤条件（status或role），需要估算过滤后的总数
      // 注意：搜索条件已经在SQL层面处理了，所以不需要重新估算
      if ((hasStatusFilter || hasRoleFilter) && users.length > 0 && (!search || search.trim() === '')) {
        const originalCount = users.length
        const filteredCount = filteredUsers.length
        const filterRatio = filteredCount / originalCount
        
        // 基于过滤比例估算总数
        actualTotal = Math.round((totalCount || 0) * filterRatio)
        actualTotalPages = Math.ceil(actualTotal / limit)
        
        // 至少要有1页
        if (actualTotalPages === 0 && filteredUsers.length > 0) {
          actualTotalPages = 1
        }
      } else if ((hasStatusFilter || hasRoleFilter) && users.length > 0 && search && search.trim() !== '') {
        // 当同时有搜索条件和过滤条件时，使用当前页的过滤结果作为近似估算
        const originalCount = users.length
        const filteredCount = filteredUsers.length
        
        if (originalCount > 0) {
          const filterRatio = filteredCount / originalCount
          actualTotal = Math.round(actualTotal * filterRatio)
          actualTotalPages = Math.ceil(actualTotal / limit)
          
          // 至少要有1页
          if (actualTotalPages === 0 && filteredUsers.length > 0) {
            actualTotalPages = 1
          }
        }
      }

      return {
        users: filteredUsers,
        total: actualTotal,
        page,
        limit,
        totalPages: actualTotalPages
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      return {
        users: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 12,
        totalPages: 0
      }
    }
  }

  /**
   * 根据用户ID获取用户信息
   * 使用 RPC 函数来访问 auth.users 表
   */
  async getUserById(userId: string) {
    try {
      const { data, error } = await this.supabase
        .rpc('lab_get_user_by_id', { user_id_param: userId })

      if (error) throw error

      if (data && data.length > 0) {
        return this.transformUserData(data[0])
      }
      
      return null
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  /**
   * 根据邮箱获取用户信息
   * 使用 RPC 函数来访问 auth.users 表
   */
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await this.supabase
        .rpc('lab_get_user_by_email', { email_param: email })

      if (error) throw error

      if (data && data.length > 0) {
        return this.transformUserData(data[0])
      }
      
      return null
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  /**
   * 批量获取用户信息
   * 使用搜索函数逐个查询（因为没有批量查询的 RPC 函数）
   */
  async getUsersByIds(userIds: string[]) {
    try {
      if (!userIds || userIds.length === 0) return []

      const users = []
      for (const userId of userIds) {
        const user = await this.getUserById(userId)
        if (user) {
          users.push(user)
        }
      }

      return users
    } catch (error) {
      console.error('批量获取用户信息失败:', error)
      return []
    }
  }

  /**
   * 更新用户信息
   * 注意：由于无法直接访问 auth.users 表，返回 null
   */
  async updateUser(userId: string, updates: {
    phone?: string
    raw_user_meta_data?: any
    banned_until?: string | null
  }) {
    console.log('updateUser - 无法直接访问 auth.users 表，返回 null')
    return null
  }

  /**
   * 封禁用户
   * 注意：由于无法直接访问 auth.users 表，返回 null
   */
  async banUser(userId: string, banUntil?: Date) {
    console.log('banUser - 无法直接访问 auth.users 表，返回 null')
    return null
  }

  /**
   * 解封用户
   * 注意：由于无法直接访问 auth.users 表，返回 null
   */
  async unbanUser(userId: string) {
    console.log('unbanUser - 无法直接访问 auth.users 表，返回 null')
    return null
  }

  /**
   * 软删除用户
   * 注意：由于无法直接访问 auth.users 表，返回 null
   */
  async deleteUser(userId: string) {
    console.log('deleteUser - 无法直接访问 auth.users 表，返回 null')
    return null
  }

  /**
   * 获取用户统计信息
   * 使用自定义的 SQL 函数来获取统计数据
   */
  async getUserStats() {
    try {
      // 使用优化的统计摘要函数一次性获取所有数据
      const { data: statsData, error: statsError } = await this.supabase
        .rpc('lab_get_user_stats_summary')

      if (statsError) {
        console.error('获取用户统计摘要失败:', statsError)
        throw statsError
      }

      // 如果摘要函数失败，回退到单独调用各个函数
      if (!statsData || statsData.length === 0) {
        console.log('统计摘要为空，使用单独函数获取数据')
        
        // 分别获取各项统计数据
        const [totalData, activeData, dailyData, monthlyData] = await Promise.all([
          this.supabase.rpc('lab_get_total_users'),
          this.supabase.rpc('lab_get_active_users_count', { days_back: 7 }),
          this.supabase.rpc('lab_get_daily_new_users_count', { target_date: new Date().toISOString().split('T')[0] }),
          this.supabase.rpc('lab_get_monthly_new_users_count', { target_month: new Date().toISOString().split('T')[0] })
        ])

        return {
          totalUsers: totalData.data || 0,
          activeUsers: activeData.data || 0,
          newUsersThisMonth: monthlyData.data || 0,
          dailyNewUsers: dailyData.data || 0
        }
      }

      // 使用摘要数据
      const stats = statsData[0]
      return {
        totalUsers: stats.total_users || 0,
        activeUsers: stats.active_users || 0,
        newUsersThisMonth: stats.monthly_new_users || 0,
        dailyNewUsers: stats.daily_new_users || 0
      }
    } catch (error) {
      console.error('获取用户统计信息失败:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        dailyNewUsers: 0
      }
    }
  }

  /**
   * 获取每日新增用户数量
   * 使用自定义 SQL 函数
   */
  async getDailyNewUsersCount(targetDate?: string): Promise<number> {
    try {
      const dateStr = targetDate || new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .rpc('lab_get_daily_new_users_count', { target_date: dateStr })

      if (error) {
        console.error('获取每日新增用户数量失败:', error)
        return 0
      }
      
      return data || 0
    } catch (error) {
      console.error('获取每日新增用户数量失败:', error)
      return 0
    }
  }

  /**
   * 转换用户数据格式
   */
  private transformUserData(user: any) {
    // 处理从 RPC 函数返回的数据格式
    const userData = user.user_id ? {
      // 来自 search_users_with_auth 的格式
      id: user.user_id,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone_confirmed_at: user.phone_confirmed_at,
      banned_until: user.banned_until,
      raw_user_meta_data: user.raw_user_meta_data,
      raw_app_meta_data: user.raw_app_meta_data,
      is_super_admin: user.is_super_admin,
      deleted_at: user.deleted_at,
      display_name: user.display_name,
      avatar_url: user.avatar_url
    } : user // 来自其他 RPC 函数的格式

    const metadata = userData.raw_user_meta_data || {}
    const appMetadata = userData.raw_app_meta_data || {}
    
    // 确定用户状态
    let status = 'inactive'
    if (userData.banned_until && new Date(userData.banned_until) > new Date()) {
      status = 'banned'
    } else if (userData.email_confirmed_at || userData.phone_confirmed_at) {
      status = 'active'
    }

    // 确定用户角色
    let role = 'user'
    if (userData.is_super_admin) {
      role = 'admin'
    } else if (metadata.role) {
      role = metadata.role
    }

    return {
      id: userData.id,
      name: userData.display_name || metadata.full_name || metadata.name || userData.email?.split('@')[0] || 'Unknown',
      email: userData.email,
      phone: userData.phone,
      avatar: userData.avatar_url || metadata.avatar_url || metadata.picture,
      status,
      role,
      subscription: metadata.subscription || appMetadata.subscription || 'free',
      last_login: userData.last_sign_in_at,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      email_confirmed: !!userData.email_confirmed_at,
      phone_confirmed: !!userData.phone_confirmed_at,
      banned_until: userData.banned_until,
      total_usage: metadata.total_usage || 0,
      monthly_usage: metadata.monthly_usage || 0,
      raw_user_meta_data: userData.raw_user_meta_data,
      raw_app_meta_data: userData.raw_app_meta_data
    }
  }
}

// 创建全局实例
export const userStorage = new UserStorage(supabaseServiceRole)

// 支付存储服务
export class PaymentStorage {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  async getPayments(filters?: {
    status?: string
    dateRange?: { start: string; end: string }
    userId?: string
  }) {
    try {
      let query = this.supabase
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

  async getTotalRevenue() {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
      
      if (error) throw error
      
      const total = data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
      return total
    } catch (error) {
      console.error('获取总收入失败:', error)
      return 0
    }
  }

  async getPaymentStats() {
    try {
      // 总收入
      const totalRevenue = await this.getTotalRevenue()
      
      // 今日收入
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      
      const { data: todayPayments, error: todayError } = await this.supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
      
      if (todayError) throw todayError
      
      const todayRevenue = todayPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
      
      // 总订单数
      const { count: totalOrders } = await this.supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
      
      // 成功订单数
      const { count: successOrders } = await this.supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
      
      return {
        total_revenue: totalRevenue,
        today_revenue: todayRevenue,
        total_orders: totalOrders || 0,
        success_orders: successOrders || 0
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

export const paymentStorage = new PaymentStorage(supabaseServiceRole)