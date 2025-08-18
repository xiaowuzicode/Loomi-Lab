import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ContentItem } from '@/types'

// 获取内容列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabaseServiceRole
      .from('lab_content_library')
      .select('*', { count: 'exact' })

    // 应用筛选条件
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 搜索条件
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,author.ilike.%${search}%`)
    }

    // 排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 分页
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get content library error:', error)
    return NextResponse.json({
      success: false,
      error: '获取内容列表失败'
    }, { status: 500 })
  }
}

// 创建新内容
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证必填字段
    if (!body.title || !body.content || !body.category || !body.platform) {
      return NextResponse.json({
        success: false,
        error: '标题、内容、分类和平台为必填项'
      }, { status: 400 })
    }

    const insertData = {
      title: body.title.trim(),
      content: body.content.trim(),
      description: body.description?.trim() || null,
      author: body.author?.trim() || null,
      source_url: body.source_url?.trim() || null,
      category: body.category.trim(),
      platform: body.platform.trim(),
      hot_category: body.hot_category || null,
      status: body.status || 'draft',
      thumbnail_url: body.thumbnail_url?.trim() || null,
      images_urls: body.images_urls || [],
      video_url: body.video_url?.trim() || null,
      views_count: Math.max(0, body.views_count || 0),
      likes_count: Math.max(0, body.likes_count || 0),
      shares_count: Math.max(0, body.shares_count || 0),
      comments_count: Math.max(0, body.comments_count || 0),
      favorites_count: Math.max(0, body.favorites_count || 0),
      engagement_rate: Math.min(100, Math.max(0, body.engagement_rate || 0)),
      top_comments: body.top_comments || [],
      tags: body.tags || [],
      keywords: body.keywords || [],
      published_at: body.published_at ? new Date(body.published_at).toISOString() : null
    }

    const { data, error } = await supabaseServiceRole
      .from('lab_content_library')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
      message: '内容创建成功'
    })

  } catch (error) {
    console.error('Create content error:', error)
    return NextResponse.json({
      success: false,
      error: '创建内容失败'
    }, { status: 500 })
  }
}

// 更新内容
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '内容ID不能为空'
      }, { status: 400 })
    }

    // 清理数据
    if (updateData.title) updateData.title = updateData.title.trim()
    if (updateData.content) updateData.content = updateData.content.trim()
    if (updateData.description) updateData.description = updateData.description.trim()
    if (updateData.author) updateData.author = updateData.author.trim()
    if (updateData.source_url) updateData.source_url = updateData.source_url.trim()
    if (updateData.category) updateData.category = updateData.category.trim()
    if (updateData.platform) updateData.platform = updateData.platform.trim()
    if (updateData.thumbnail_url) updateData.thumbnail_url = updateData.thumbnail_url.trim()
    if (updateData.video_url) updateData.video_url = updateData.video_url.trim()
    
    // 确保数值字段在合理范围内
    if (updateData.views_count !== undefined) updateData.views_count = Math.max(0, updateData.views_count)
    if (updateData.likes_count !== undefined) updateData.likes_count = Math.max(0, updateData.likes_count)
    if (updateData.shares_count !== undefined) updateData.shares_count = Math.max(0, updateData.shares_count)
    if (updateData.comments_count !== undefined) updateData.comments_count = Math.max(0, updateData.comments_count)
    if (updateData.favorites_count !== undefined) updateData.favorites_count = Math.max(0, updateData.favorites_count)
    if (updateData.engagement_rate !== undefined) updateData.engagement_rate = Math.min(100, Math.max(0, updateData.engagement_rate))

    if (updateData.published_at) {
      updateData.published_at = new Date(updateData.published_at).toISOString()
    }

    const { data, error } = await supabaseServiceRole
      .from('lab_content_library')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
      message: '内容更新成功'
    })

  } catch (error) {
    console.error('Update content error:', error)
    return NextResponse.json({
      success: false,
      error: '更新内容失败'
    }, { status: 500 })
  }
}

// 删除内容
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '内容ID不能为空'
      }, { status: 400 })
    }

    const { error } = await supabaseServiceRole
      .from('lab_content_library')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '内容删除成功'
    })

  } catch (error) {
    console.error('Delete content error:', error)
    return NextResponse.json({
      success: false,
      error: '删除内容失败'
    }, { status: 500 })
  }
}
