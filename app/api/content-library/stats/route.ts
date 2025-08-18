import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 获取总体统计
    const { data: totalStats, error: totalError } = await supabaseServiceRole
      .from('lab_content_library')
      .select(`
        id,
        views_count,
        likes_count,
        shares_count,
        comments_count,
        favorites_count,
        engagement_rate,
        status,
        category,
        platform,
        hot_category
      `)

    if (totalError) {
      throw totalError
    }

    // 计算统计数据
    const stats = {
      total_content: totalStats.length,
      published_content: totalStats.filter(item => item.status === 'published').length,
      draft_content: totalStats.filter(item => item.status === 'draft').length,
      archived_content: totalStats.filter(item => item.status === 'archived').length,
      total_views: totalStats.reduce((sum, item) => sum + (item.views_count || 0), 0),
      total_likes: totalStats.reduce((sum, item) => sum + (item.likes_count || 0), 0),
      total_shares: totalStats.reduce((sum, item) => sum + (item.shares_count || 0), 0),
      total_comments: totalStats.reduce((sum, item) => sum + (item.comments_count || 0), 0),
      total_favorites: totalStats.reduce((sum, item) => sum + (item.favorites_count || 0), 0),
      avg_engagement_rate: totalStats.length > 0 
        ? totalStats.reduce((sum, item) => sum + (item.engagement_rate || 0), 0) / totalStats.length 
        : 0,
    }

    // 按分类统计
    const categoryStats = totalStats.reduce((acc: any, item) => {
      const category = item.category || '未分类'
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          views: 0,
          likes: 0,
          shares: 0,
          avg_engagement: 0
        }
      }
      acc[category].count += 1
      acc[category].views += item.views_count || 0
      acc[category].likes += item.likes_count || 0
      acc[category].shares += item.shares_count || 0
      acc[category].engagement_sum = (acc[category].engagement_sum || 0) + (item.engagement_rate || 0)
      acc[category].avg_engagement = acc[category].engagement_sum / acc[category].count
      return acc
    }, {})

    // 按平台统计
    const platformStats = totalStats.reduce((acc: any, item) => {
      const platform = item.platform || '未知平台'
      if (!acc[platform]) {
        acc[platform] = {
          count: 0,
          views: 0,
          likes: 0,
          shares: 0,
          avg_engagement: 0
        }
      }
      acc[platform].count += 1
      acc[platform].views += item.views_count || 0
      acc[platform].likes += item.likes_count || 0
      acc[platform].shares += item.shares_count || 0
      acc[platform].engagement_sum = (acc[platform].engagement_sum || 0) + (item.engagement_rate || 0)
      acc[platform].avg_engagement = acc[platform].engagement_sum / acc[platform].count
      return acc
    }, {})

    // 热门程度统计
    const hotCategoryStats = {
      viral: totalStats.filter(item => item.hot_category === 'viral').length,
      trending: totalStats.filter(item => item.hot_category === 'trending').length,
      normal: totalStats.filter(item => item.hot_category === 'normal' || !item.hot_category).length,
    }

    // 获取最近7天的数据趋势
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentContent, error: recentError } = await supabaseServiceRole
      .from('lab_content_library')
      .select('created_at, views_count, likes_count, engagement_rate')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (recentError) {
      console.warn('获取最近数据失败:', recentError)
    }

    // 按天分组统计最近趋势
    const dailyTrends = recentContent?.reduce((acc: any, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          total_views: 0,
          total_likes: 0,
          avg_engagement: 0
        }
      }
      acc[date].count += 1
      acc[date].total_views += item.views_count || 0
      acc[date].total_likes += item.likes_count || 0
      acc[date].engagement_sum = (acc[date].engagement_sum || 0) + (item.engagement_rate || 0)
      acc[date].avg_engagement = acc[date].engagement_sum / acc[date].count
      return acc
    }, {}) || {}

    const trendData = Object.values(dailyTrends).slice(-7) // 最近7天

    return NextResponse.json({
      success: true,
      data: {
        overview: stats,
        category_stats: categoryStats,
        platform_stats: platformStats,
        hot_category_stats: hotCategoryStats,
        daily_trends: trendData
      }
    })

  } catch (error) {
    console.error('Get content library stats error:', error)
    return NextResponse.json({
      success: false,
      error: '获取统计数据失败'
    }, { status: 500 })
  }
}
