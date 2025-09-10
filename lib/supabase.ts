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

      // 直接逐个用户查询 projects 表统计使用量（总/当月）
      try {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

        const enhanced = await Promise.all(filteredUsers.map(async (u: any) => {
          try {
            const totalRes = await this.supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', u.id)

            const monthRes = await this.supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', u.id)
              .gte('created_at', monthStart.toISOString())
              .lt('created_at', monthEnd.toISOString())

            return {
              ...u,
              total_usage: Number(totalRes.count || 0),
              monthly_usage: Number(monthRes.count || 0),
            }
          } catch (e) {
            console.error('统计用户使用量异常:', e)
            return {
              ...u,
              total_usage: u.total_usage || 0,
              monthly_usage: u.monthly_usage || 0,
            }
          }
        }))
        filteredUsers = enhanced
      } catch (usageErr) {
        console.error('统计用户使用量总流程异常:', usageErr)
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
        const baseUser = this.transformUserData(data[0])
        try {
          const now = new Date()
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

          const totalRes = await this.supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', baseUser.id)
          const monthRes = await this.supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', baseUser.id)
            .gte('created_at', monthStart.toISOString())
            .lt('created_at', monthEnd.toISOString())

          return {
            ...baseUser,
            total_usage: Number(totalRes.count || 0),
            monthly_usage: Number(monthRes.count || 0),
          }
        } catch (e) {
          console.error('查询单用户使用量异常:', e)
        }

        return baseUser
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
        const baseUser = this.transformUserData(data[0])
        try {
          const now = new Date()
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

          const totalRes = await this.supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', baseUser.id)
          const monthRes = await this.supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', baseUser.id)
            .gte('created_at', monthStart.toISOString())
            .lt('created_at', monthEnd.toISOString())

          return {
            ...baseUser,
            total_usage: Number(totalRes.count || 0),
            monthly_usage: Number(monthRes.count || 0),
          }
        } catch (e) {
          console.error('查询单用户使用量异常:', e)
        }

        return baseUser
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

// 自定义字段管理服务
export class CustomFieldStorage {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * 获取自定义字段列表（分页+筛选）
   */
  async getCustomFields(options: {
    page?: number
    limit?: number
    search?: string
    userSearch?: string
    type?: string
    appCode?: string
    userId?: string
    visibility?: boolean
    isPublic?: boolean
    amountMin?: number
    amountMax?: number
    dateFrom?: string
    dateTo?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        userSearch = '',
        type = 'all', 
        appCode,
        userId,
        visibility,
        isPublic,
        amountMin,
        amountMax,
        dateFrom,
        dateTo,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options
      const offset = (page - 1) * limit

      // 构建基础查询
      let query = this.supabase
        .from('book_user_custom_fields')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false) // 软删除过滤

      // 用户权限过滤 - 对于自定义字段管理，显示所有用户的记录
      // if (userId) {
      //   query = query.eq('user_id', userId)
      // }

      // 类型筛选
      if (type !== 'all') {
        query = query.eq('type', type)
      }

      // 应用代码筛选
      if (appCode) {
        query = query.eq('app_code', appCode)
      }

      // 可见性筛选
      if (visibility !== undefined) {
        query = query.eq('visibility', visibility)
      }

      // 公开性筛选
      if (isPublic !== undefined) {
        query = query.eq('is_public', isPublic)
      }

      // 金额范围筛选
      if (amountMin !== undefined) {
        query = query.gte('amount', amountMin * 100) // 转换为分
      }
      if (amountMax !== undefined) {
        query = query.lte('amount', amountMax * 100) // 转换为分
      }

      // 日期范围筛选
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      // 搜索功能 (搜索标题和readme字段)
      if (search && search.trim() !== '') {
        query = query.or(
          `readme.ilike.%${search}%,` +
          `extended_field->>title.ilike.%${search}%`
        )
      }

      // 用户搜索功能 (根据UUID或用户名搜索)
      if (userSearch && userSearch.trim() !== '') {
        const userSearchTerm = userSearch.trim()
        // 如果看起来像UUID，直接搜索user_id字段
        if (userSearchTerm.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          query = query.or(`user_id.eq.${userSearchTerm},created_user_id.eq.${userSearchTerm}`)
        } else {
          // 否则使用用户搜索函数查找用户ID
          try {
            const { data: users, error } = await this.supabase
              .rpc('lab_search_users', {
                search_term: userSearchTerm,
                result_limit: 100,  // 限制搜索结果数量
                result_offset: 0
              })
            
            if (!error && users && users.length > 0) {
              const userIds = users.map((user: any) => user.id)
              const userIdFilter = userIds.map((id: string) => `user_id.eq.${id},created_user_id.eq.${id}`).join(',')
              if (userIdFilter) {
                query = query.or(userIdFilter)
              }
            } else {
              // 如果没有找到用户，返回空结果
              query = query.eq('user_id', '00000000-0000-0000-0000-000000000000')
            }
          } catch (userSearchError) {
            console.error('用户搜索失败:', userSearchError)
            // 搜索失败时，返回空结果
            query = query.eq('user_id', '00000000-0000-0000-0000-000000000000')
          }
        }
      }

      // 排序
      const ascending = sortOrder === 'asc'
      query = query.order(sortBy, { ascending })

      // 分页
      const { data, error, count } = await query.range(offset, offset + limit - 1)

      if (error) throw error

      // 获取总数
      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / limit)

      // 转换数据格式
      const records = await Promise.all((data || []).map(record => this.transformCustomFieldData(record)))

      return {
        records,
        total: totalCount,
        page,
        limit,
        totalPages
      }
    } catch (error) {
      console.error('获取自定义字段列表失败:', error)
      return {
        records: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 10,
        totalPages: 0
      }
    }
  }

  /**
   * 根据ID获取单条记录
   */
  async getCustomFieldById(id: string, userId?: string) {
    try {
      let query = this.supabase
        .from('book_user_custom_fields')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)

      // 权限控制: 管理员可以查看所有记录
      // if (userId) {
      //   query = query.or(
      //     `user_id.eq.${userId},` +
      //     `and(visibility.eq.true,is_public.eq.true)`
      //   )
      // }

      const { data, error } = await query.single()

      if (error) throw error
      return await this.transformCustomFieldData(data)
    } catch (error) {
      console.error('获取自定义字段详情失败:', error)
      return null
    }
  }

  /**
   * 创建自定义字段记录
   */
  async createCustomField(record: {
    userId: string
    createdUserId: string
    appCode: string
    type: string
    extendedField: any[]
    amount: number
    readme: string
    exampleData?: string
    visibility: boolean
    isPublic: boolean
  }) {
    try {
      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .insert({
          user_id: record.userId,
          created_user_id: record.createdUserId,
          app_code: record.appCode,
          type: record.type,
          extended_field: record.extendedField,
          amount: record.amount, // 前端已转换为分
          readme: record.readme,
          example_data: record.exampleData,
          visibility: record.visibility,
          is_public: record.isPublic,
          post_ids: [], // 默认空数组
          is_deleted: false
        })
        .select()
        .single()

      if (error) throw error
      return await this.transformCustomFieldData(data)
    } catch (error) {
      console.error('创建自定义字段失败:', error)
      throw error
    }
  }

  /**
   * 更新自定义字段记录
   */
  async updateCustomField(
    id: string, 
    userId: string, 
    updates: Partial<{
      appCode: string
      extendedField: any[]
      amount: number
      readme: string
      exampleData: string
      visibility: boolean
      isPublic: boolean
    }>
  ) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // 只更新提供的字段
      if (updates.appCode !== undefined) updateData.app_code = updates.appCode
      if (updates.extendedField !== undefined) updateData.extended_field = updates.extendedField
      if (updates.amount !== undefined) updateData.amount = updates.amount
      if (updates.readme !== undefined) updateData.readme = updates.readme
      if (updates.exampleData !== undefined) updateData.example_data = updates.exampleData
      if (updates.visibility !== undefined) updateData.visibility = updates.visibility
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic

      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .update(updateData)
        .eq('id', id)
        // .eq('user_id', userId) // 移除权限控制：管理员可以更新所有记录
        .eq('is_deleted', false)
        .select()
        .single()

      if (error) throw error
      return await this.transformCustomFieldData(data)
    } catch (error) {
      console.error('更新自定义字段失败:', error)
      throw error
    }
  }

  /**
   * 软删除自定义字段记录
   */
  async deleteCustomField(id: string, userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        // .eq('user_id', userId) // 移除权限控制：管理员可以删除所有记录
        .eq('is_deleted', false)
        .select()
        .single()

      if (error) throw error
      return await this.transformCustomFieldData(data)
    } catch (error) {
      console.error('删除自定义字段失败:', error)
      throw error
    }
  }

  /**
   * 获取所有可用的应用代码 (备用功能，暂不使用)
   */
  async getAvailableAppCodes(userId?: string) {
    try {
      let query = this.supabase
        .from('book_user_custom_fields')
        .select('app_code')
        .eq('is_deleted', false)

      // 用户权限过滤 - 显示所有用户的记录
      // if (userId) {
      //   query = query.eq('user_id', userId)
      // }

      const { data, error } = await query

      if (error) throw error

      // 去重并排序
      const uniqueAppCodes = [...new Set((data || []).map(record => record.app_code))]
        .filter(code => code && code.trim() !== '')
        .sort()

      return uniqueAppCodes
    } catch (error) {
      console.error('获取应用代码失败:', error)
      // 返回默认值
      return ['loomi']
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(userId?: string) {
    try {
      let baseQuery = this.supabase
        .from('book_user_custom_fields')
        .select('type', { count: 'exact' })
        .eq('is_deleted', false)

      // 用户权限过滤 - 统计所有用户的记录
      // if (userId) {
      //   baseQuery = baseQuery.eq('user_id', userId)
      // }

      // 分别统计三种类型
      const [insightResult, hookResult, emotionResult] = await Promise.all([
        this.supabase.from('book_user_custom_fields')
          .select('*', { count: 'exact', head: true })
          .eq('type', '洞察')
          .eq('is_deleted', false)
          .then(r => ({ count: r.count || 0 })),
        this.supabase.from('book_user_custom_fields')
          .select('*', { count: 'exact', head: true })
          .eq('type', '钩子')
          .eq('is_deleted', false)
          .then(r => ({ count: r.count || 0 })),
        this.supabase.from('book_user_custom_fields')
          .select('*', { count: 'exact', head: true })
          .eq('type', '情绪')
          .eq('is_deleted', false)
          .then(r => ({ count: r.count || 0 }))
      ])

      return {
        洞察: insightResult.count,
        钩子: hookResult.count,
        情绪: emotionResult.count,
        总计: insightResult.count + hookResult.count + emotionResult.count
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return {
        洞察: 0,
        钩子: 0,
        情绪: 0,
        总计: 0
      }
    }
  }

  /**
   * 转换自定义字段数据格式
   */
  private async transformCustomFieldData(record: any) {
    // 对于自定义字段系统：管理员UUID显示为管理员，其他用户查询真实姓名
    let createdUserName: string
    if (record.created_user_id === '00000000-0000-0000-0000-000000000001') {
      createdUserName = '管理员'
    } else {
      try {
        const user = await userStorage.getUserById(record.created_user_id)
        createdUserName = user?.name || record.created_user_id
      } catch (error) {
        createdUserName = record.created_user_id
      }
    }

    // 处理扩展字段数据，支持新旧格式兼容
    let extendedField = record.extended_field || []
    let tableFields: string[] = []

    // 检测数据格式：新格式为数组，旧格式为对象数组
    if (Array.isArray(extendedField) && extendedField.length > 0) {
      const firstItem = extendedField[0]
      
      // 旧格式：[{key, label, value, required}] 转换为新格式
      if (firstItem && 'key' in firstItem && 'label' in firstItem && 'value' in firstItem) {
        const convertedData = { id: 1 }
        extendedField.forEach((field: any) => {
          convertedData[field.label] = field.value || ''
          if (!tableFields.includes(field.label)) {
            tableFields.push(field.label)
          }
        })
        extendedField = [convertedData]
      } 
      // 新格式：[{id, 标题, 正文, ...}] 直接使用
      else if (firstItem && 'id' in firstItem) {
        tableFields = Object.keys(firstItem).filter(key => key !== 'id')
        // 确保标题字段在首位
        if (tableFields.includes('标题')) {
          tableFields = ['标题', ...tableFields.filter(field => field !== '标题')]
        }
      }
    }

    // 如果没有字段定义，设置默认字段
    if (tableFields.length === 0) {
      tableFields = ['标题', '正文']
      if (extendedField.length === 0) {
        extendedField = [{ id: 1, 标题: '', 正文: '' }]
      }
    }

    return {
      id: record.id,
      userId: record.user_id,
      createdUserId: record.created_user_id,
      createdUserName,
      appCode: record.app_code,
      type: record.type,
      extendedField, // 新格式：TableRow[]
      tableFields,   // 新字段：字段名列表
      amount: record.amount / 100, // 转换为元
      postIds: record.post_ids || [],
      visibility: record.visibility,
      isPublic: record.is_public,
      exampleData: record.example_data,
      readme: record.readme,
      isDeleted: record.is_deleted,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }
  }

  /**
   * 字段操作：添加、删除、重命名字段
   */
  async updateTableFields(
    id: string, 
    userId: string, 
    operation: { action: 'add' | 'remove' | 'rename', fieldName: string, newFieldName?: string }
  ) {
    try {
      // 先获取当前数据
      const currentRecord = await this.getCustomFieldById(id, userId)
      if (!currentRecord) {
        throw new Error('记录不存在')
      }

      let updatedData = [...currentRecord.extendedField]
      let updatedFields = [...currentRecord.tableFields]

      switch (operation.action) {
        case 'add':
          if (!updatedFields.includes(operation.fieldName)) {
            updatedFields.push(operation.fieldName)
            updatedData = updatedData.map(row => ({
              ...row,
              [operation.fieldName]: ''
            }))
          }
          break

        case 'remove':
          if (operation.fieldName !== '标题') { // 保护标题字段
            updatedFields = updatedFields.filter(field => field !== operation.fieldName)
            updatedData = updatedData.map(row => {
              const { [operation.fieldName]: removed, ...rest } = row
              return rest
            })
          }
          break

        case 'rename':
          if (operation.newFieldName && operation.fieldName !== '标题') {
            const fieldIndex = updatedFields.indexOf(operation.fieldName)
            if (fieldIndex !== -1 && !updatedFields.includes(operation.newFieldName)) {
              updatedFields[fieldIndex] = operation.newFieldName
              updatedData = updatedData.map(row => {
                const { [operation.fieldName]: value, ...rest } = row
                return { ...rest, [operation.newFieldName]: value }
              })
            }
          }
          break
      }

      // 更新数据库
      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .update({
          extended_field: updatedData,
          table_fields: updatedFields, // 如果数据库有此字段
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_deleted', false)
        .select()
        .single()

      if (error) throw error
      return await this.transformCustomFieldData(data)
    } catch (error) {
      console.error('字段操作失败:', error)
      throw error
    }
  }

  /**
   * 行操作：添加、更新、删除行数据
   */
  async updateTableRow(
    id: string,
    userId: string,
    operation: { 
      action: 'add' | 'update' | 'delete' | 'duplicate',
      rowId?: number,
      rowData?: Record<string, any>
    }
  ) {
    try {
      const currentRecord = await this.getCustomFieldById(id, userId)
      if (!currentRecord) {
        throw new Error('记录不存在')
      }

      let updatedData = [...currentRecord.extendedField]

      switch (operation.action) {
        case 'add':
          const maxId = Math.max(0, ...updatedData.map(row => row.id || 0))
          const newRow = { id: maxId + 1 }
          // 为每个字段初始化空值
          currentRecord.tableFields.forEach(field => {
            newRow[field] = operation.rowData?.[field] || ''
          })
          updatedData.push(newRow)
          break

        case 'update':
          if (operation.rowId && operation.rowData) {
            updatedData = updatedData.map(row =>
              row.id === operation.rowId 
                ? { ...row, ...operation.rowData }
                : row
            )
          }
          break

        case 'delete':
          if (operation.rowId) {
            updatedData = updatedData.filter(row => row.id !== operation.rowId)
          }
          break

        case 'duplicate':
          if (operation.rowId) {
            const sourceRow = updatedData.find(row => row.id === operation.rowId)
            if (sourceRow) {
              const maxId = Math.max(0, ...updatedData.map(row => row.id || 0))
              updatedData.push({ ...sourceRow, id: maxId + 1 })
            }
          }
          break
      }

      // 更新数据库
      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .update({
          extended_field: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_deleted', false)
        .select()
        .single()

      if (error) throw error
      return await this.transformCustomFieldData(data)
    } catch (error) {
      console.error('行操作失败:', error)
      throw error
    }
  }

  /**
   * 批量行操作
   */
  async batchUpdateTableRows(
    id: string,
    userId: string,
    operations: {
      action: 'update' | 'delete',
      rowIds: number[],
      updates?: Record<string, any>
    }
  ) {
    try {
      const currentRecord = await this.getCustomFieldById(id, userId)
      if (!currentRecord) {
        throw new Error('记录不存在')
      }

      let updatedData = [...currentRecord.extendedField]

      switch (operations.action) {
        case 'update':
          if (operations.updates) {
            updatedData = updatedData.map(row =>
              operations.rowIds.includes(row.id)
                ? { ...row, ...operations.updates }
                : row
            )
          }
          break

        case 'delete':
          updatedData = updatedData.filter(row => !operations.rowIds.includes(row.id))
          break
      }

      // 更新数据库
      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .update({
          extended_field: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_deleted', false)
        .select()
        .single()

      if (error) throw error
      return await this.transformCustomFieldData(data)
    } catch (error) {
      console.error('批量操作失败:', error)
      throw error
    }
  }
}

// 创建全局实例
export const customFieldStorage = new CustomFieldStorage(supabaseServiceRole)