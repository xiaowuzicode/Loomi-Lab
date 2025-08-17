import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { safeRedisCommand, formatDate, getDateRange, getMonthRange } from '@/lib/redis'
import type { ApiResponse } from '@/types'

// Dashboard统计数据类型
interface DashboardStats {
  summary: {
    total_access: number
    today_access: number
    today_users: number
    daily_new_users: number
    user_retention_7d: number
    user_retention_3d: number
    user_retention_1d: number
    token_consumption: number
  }
  daily_chart: {
    labels: string[]
    access_counts: number[]
    user_counts: number[]
  }
  monthly_chart: {
    labels: string[]
    access_counts: number[]
  }
  token_stats: {
    today_tokens: number
    weekly_tokens: number
    monthly_tokens: number
    today_top_users: number
  }
  daily_token_chart: {
    labels: string[]
    token_counts: number[]
  }
  monthly_token_chart: {
    labels: string[]
    token_counts: number[]
  }
  recent_top_users: any[]
  token_ranking: any[]
  last_updated: string
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    const today = formatDate(new Date())
    const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
    
    // 获取最近7天和6个月的日期
    const last7Days = getDateRange(7)
    const last6Months = getMonthRange(6)

    // 首先快速检查Redis是否有基础数据
    const hasRedisData = await safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      const [totalKey, todayKey] = await Promise.all([
        redis.exists('novachat:access:total'),
        redis.exists(`novachat:access:daily:${today}`)
      ])
      return totalKey > 0 || todayKey > 0
    }, false)

    // 并行获取各项统计数据
    const [
      totalAccess,
      todayAccess,
      todayUsers,
      dailyNewUsers,
      userRetention7d,
      userRetention3d,
      userRetention1d,
      tokenStats,
      dailyAccessData,
      monthlyAccessData,
      tokenData
    ] = await Promise.all([
      // 总访问次数
      safeRedisCommand(async () => {
        const { redis } = await import('@/lib/redis')
        return await redis.get('novachat:access:total')
      }, '0'),
      
      // 今日访问次数
      safeRedisCommand(async () => {
        const { redis } = await import('@/lib/redis')
        return await redis.get(`novachat:access:daily:${today}`)
      }, '0'),
      
      // 今日独立用户数（通过每日用户访问记录计算）
      hasRedisData ? safeRedisCommand(async () => {
        const { redis } = await import('@/lib/redis')
        const keys = await redis.keys(`novachat:access:daily_user:${today}:*`)
        return keys.length
      }, 0) : Promise.resolve(0),
      
      // 每日新增用户数（通过数据库函数获取）
      getDailyNewUsers(today),
      
      // 用户留存数（7天内）
      getUserRetention(today, 7),
      
      // 用户留存数（3天内）
      getUserRetention(today, 3),
      
      // 用户留存数（1天内）
      getUserRetention(today, 1),
      
      // Token统计
      hasRedisData ? getTokenStats(today) : Promise.resolve({
        today_tokens: 0,
        weekly_tokens: 0,
        monthly_tokens: 0,
        today_top_users: 0
      }),
      
      // 最近7天访问数据（如果没有Redis数据，返回空数据）
      hasRedisData ? getDailyAccessData(last7Days) : Promise.resolve({
        labels: last7Days.map(date => {
          const d = new Date(date)
          return `${d.getMonth() + 1}/${d.getDate()}`
        }),
        access_counts: new Array(7).fill(0),
        user_counts: new Array(7).fill(0)
      }),
      
      // 最近6个月访问数据
      hasRedisData ? getMonthlyAccessData(last6Months) : Promise.resolve({
        labels: last6Months,
        access_counts: new Array(6).fill(0)
      }),
      
      // Token趋势数据
      hasRedisData ? getTokenTrendData(last7Days, last6Months) : Promise.resolve({
        daily: {
          labels: last7Days.map(date => {
            const d = new Date(date)
            return `${d.getMonth() + 1}/${d.getDate()}`
          }),
          token_counts: new Array(7).fill(0)
        },
        monthly: {
          labels: last6Months,
          token_counts: new Array(6).fill(0)
        }
      })
    ])

    const stats: DashboardStats = {
      summary: {
        total_access: parseInt(totalAccess?.toString() || '0'),
        today_access: parseInt(todayAccess?.toString() || '0'),
        today_users: todayUsers || 0,
        daily_new_users: dailyNewUsers,
        user_retention_7d: userRetention7d,
        user_retention_3d: userRetention3d,
        user_retention_1d: userRetention1d,
        token_consumption: tokenStats.today_tokens
      },
      daily_chart: dailyAccessData,
      monthly_chart: monthlyAccessData,
      token_stats: tokenStats,
      daily_token_chart: tokenData.daily,
      monthly_token_chart: tokenData.monthly,
      recent_top_users: hasRedisData ? await getRecentTopUsers() : [],
      token_ranking: hasRedisData ? await getTodayTokenRanking() : [],
      last_updated: new Date().toISOString()
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

// 获取每日新增用户数
async function getDailyNewUsers(targetDate: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_daily_new_users_count', {
      target_date: targetDate
    })
    
    if (error) {
      console.error('获取每日新增用户数失败:', error)
      return 0
    }
    
    return data || 0
  } catch (error) {
    console.error('调用获取每日新增用户数函数失败:', error)
    return 0
  }
}

// 获取用户留存数
async function getUserRetention(targetDate: string, daysBack: number = 7): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_user_retention_count', {
      target_date: targetDate,
      days_back: daysBack
    })
    
    if (error) {
      console.error('获取用户留存数失败:', error)
      return 0
    }
    
    return data || 0
  } catch (error) {
    console.error('调用获取用户留存数函数失败:', error)
    return 0
  }
}

// 获取Token统计
async function getTokenStats(today: string) {
  const currentMonth = today.slice(0, 7) // YYYY-MM
  const currentWeek = getDateRange(7) // 最近7天
  
  const [todayTokens, weeklyTokens, monthlyTokens, todayTopUsers] = await Promise.all([
    // 今日Token消耗
    safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      return await redis.get(`token_stats:daily:${today}`)
    }, '0'),
    
    // 本周Token消耗（累加最近7天）
    safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      let total = 0
      for (const date of currentWeek) {
        const count = await redis.get(`token_stats:daily:${date}`)
        total += parseInt(count || '0')
      }
      return total.toString()
    }, '0'),
    
    // 本月Token消耗
    safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      return await redis.get(`token_stats:monthly:${currentMonth}`)
    }, '0'),
    
    // 今日活跃用户数（有Token消耗的用户）
    safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      const keys = await redis.keys(`user_stats:detailed:*:${today}`)
      return keys.length
    }, 0)
  ])
  
  return {
    today_tokens: parseInt(todayTokens?.toString() || '0'),
    weekly_tokens: parseInt(weeklyTokens?.toString() || '0'),
    monthly_tokens: parseInt(monthlyTokens?.toString() || '0'),
    today_top_users: todayTopUsers || 0
  }
}

// 获取每日访问数据
async function getDailyAccessData(dates: string[]) {
  const accessCounts = []
  const userCounts = []
  
  for (const date of dates) {
    const [accessCount, userCount] = await Promise.all([
      safeRedisCommand(async () => {
        const { redis } = await import('@/lib/redis')
        return await redis.get(`novachat:access:daily:${date}`)
      }, '0'),
      safeRedisCommand(async () => {
        const { redis } = await import('@/lib/redis')
        const keys = await redis.keys(`novachat:access:daily_user:${date}:*`)
        return keys.length
      }, 0)
    ])
    
    accessCounts.push(parseInt(accessCount?.toString() || '0'))
    userCounts.push(userCount || 0)
  }
  
  return {
    labels: dates.map(date => {
      const d = new Date(date)
      return `${d.getMonth() + 1}/${d.getDate()}`
    }),
    access_counts: accessCounts,
    user_counts: userCounts
  }
}

// 获取月度访问数据
async function getMonthlyAccessData(months: string[]) {
  const accessCounts = []
  
  for (const month of months) {
    // 累加当月所有天的访问数据
    const monthAccess = await safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      const keys = await redis.keys(`novachat:access:daily:${month}-*`)
      let total = 0
      if (keys.length > 0) {
        const values = await redis.mGet(keys)
        total = values.reduce((sum, val) => sum + parseInt(val || '0'), 0)
      }
      return total
    }, 0)
    
    accessCounts.push(monthAccess || 0)
  }
  
  return {
    labels: months,
    access_counts: accessCounts
  }
}

// 获取Token趋势数据
async function getTokenTrendData(dailyDates: string[], monthlyDates: string[]) {
  const dailyTokens = []
  const monthlyTokens = []
  
  // 每日Token数据
  for (const date of dailyDates) {
    const tokens = await safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      return await redis.get(`token_stats:daily:${date}`)
    }, '0')
    dailyTokens.push(parseInt(tokens?.toString() || '0'))
  }
  
  // 月度Token数据
  for (const month of monthlyDates) {
    const tokens = await safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      return await redis.get(`token_stats:monthly:${month}`)
    }, '0')
    monthlyTokens.push(parseInt(tokens?.toString() || '0'))
  }
  
  return {
    daily: {
      labels: dailyDates.map(date => {
        const d = new Date(date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      }),
      token_counts: dailyTokens
    },
    monthly: {
      labels: monthlyDates,
      token_counts: monthlyTokens
    }
  }
}

// 获取最近活跃用户
async function getRecentTopUsers() {
  const dates = getDateRange(7) // 最近7天
  const topUsers: any[] = []
  
  for (const date of dates.slice(-3)) { // 只取最近3天
    const topUser = await safeRedisCommand(async () => {
      const { redis } = await import('@/lib/redis')
      const keys = await redis.keys(`novachat:access:daily_user:${date}:*`)
      if (keys.length === 0) return null
      
      let maxCount = 0
      let topUserId = ''
      
      for (const key of keys) {
        const count = parseInt(await redis.get(key) || '0')
        if (count > maxCount) {
          maxCount = count
          topUserId = key.split(':').pop() || ''
        }
      }
      
      return { user_id: topUserId, access_count: maxCount, total_users: keys.length }
    }, null)
    
    if (topUser && topUser.access_count > 0) {
      // 尝试获取用户邮箱显示
      const userInfo = await getUserDisplayInfo(topUser.user_id)
      topUsers.push({
        ...topUser,
        top_user: topUser.user_id,
        top_user_email: userInfo.email,
        top_user_display: userInfo.display
      })
    }
  }
  
  return topUsers
}

// 获取今日Token排行
async function getTodayTokenRanking() {
  const today = formatDate(new Date())
  
  const ranking = await safeRedisCommand(async () => {
    const { redis } = await import('@/lib/redis')
    const keys = await redis.keys(`user_stats:detailed:*:${today}`)
    const rawRankings = []
    
    // 首先收集所有统计数据，不查询用户信息
    for (const key of keys) {
      const stats = await redis.hGetAll(key)
      if (stats.total_tokens) {
        const userId = key.split(':')[2]
        rawRankings.push({
          user_id: userId,
          total_tokens: parseInt(stats.total_tokens),
          llm_calls: parseInt(stats.llm_calls || '0'),
          session_count: parseInt(stats.session_count || '1'),
          avg_tokens_per_session: Math.round(parseInt(stats.total_tokens) / Math.max(parseInt(stats.session_count || '1'), 1))
        })
      }
    }
    
    // 按Token数量排序，只处理前10名
    const topRankings = rawRankings
      .sort((a, b) => b.total_tokens - a.total_tokens)
      .slice(0, 10)
    
    // 批量获取用户信息（优化版本）
    const userIds = topRankings.map(r => r.user_id)
    const userInfoMap = await getBatchUserInfo(userIds)
    
    // 组合用户信息和统计数据
    const rankings = topRankings.map(ranking => ({
      ...ranking,
      user_email: userInfoMap[ranking.user_id]?.email || null,
      user_display: userInfoMap[ranking.user_id]?.display || ranking.user_id
    }))
    
    return rankings
  }, [])
  
  return ranking || []
}

// 批量获取用户信息（专用优化版本）
async function getBatchUserInfo(userIds: string[]): Promise<Record<string, { email: string | null, display: string }>> {
  const result: Record<string, { email: string | null, display: string }> = {}
  
  if (userIds.length === 0) return result
  
  // 首先从缓存中获取已有的用户信息
  const uncachedUserIds = []
  for (const userId of userIds) {
    const cached = userInfoCache.get(userId)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      result[userId] = { email: cached.email, display: cached.display }
    } else {
      uncachedUserIds.push(userId)
    }
  }
  
  // 对于未缓存的用户，并行获取信息
  if (uncachedUserIds.length > 0) {
    const userInfoPromises = uncachedUserIds.map(async (userId) => {
      const userInfo = await getUserDisplayInfo(userId)
      return { userId, userInfo }
    })
    
    const userInfoResults = await Promise.all(userInfoPromises)
    
    // 添加到结果集和缓存
    userInfoResults.forEach(({ userId, userInfo }) => {
      result[userId] = userInfo
    })
  }
  
  return result
}

// 简单的内存缓存（避免重复查询相同用户）
const userInfoCache = new Map<string, { email: string | null, display: string, cachedAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

// 获取用户显示信息
async function getUserDisplayInfo(userId: string): Promise<{ email: string | null, display: string }> {
  // 检查缓存
  const cached = userInfoCache.get(userId)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return { email: cached.email, display: cached.display }
  }
  
  try {
    // 使用现有的Supabase服务角色实例和RPC函数
    const { supabaseServiceRole } = await import('@/lib/supabase')
    
    // 使用现有的RPC函数获取用户信息（与用户管理模块一致）
    const { data, error } = await supabaseServiceRole
      .rpc('lab_get_user_by_id', { user_id_param: userId })
    
    if (data && data.length > 0 && data[0].email) {
      const result = { email: data[0].email, display: data[0].email }
      // 缓存成功的结果
      userInfoCache.set(userId, { ...result, cachedAt: Date.now() })
      return result
    }
    
    if (error) {
      console.warn(`获取用户 ${userId} 信息失败:`, error.message)
    }
  } catch (error) {
    console.warn(`查询用户 ${userId} 信息异常:`, error)
  }
  
  // 如果获取失败，使用用户ID的简短版本
  const fallbackResult = { 
    email: null, 
    display: userId.length > 12 ? `${userId.substring(0, 8)}...${userId.slice(-4)}` : userId 
  }
  
  // 也缓存失败的结果，避免重复查询不存在的用户
  userInfoCache.set(userId, { ...fallbackResult, cachedAt: Date.now() })
  return fallbackResult
}