import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ContentImportRequest, ContentImportResult, ContentImportItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: ContentImportRequest = await request.json()
    const { items, override_existing = false } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '导入数据不能为空'
      }, { status: 400 })
    }

    const result: ContentImportResult = {
      total: items.length,
      success: 0,
      failed: 0,
      errors: [],
      imported_items: []
    }

    // 批量处理导入
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      try {
        // 验证必填字段
        if (!item.title || !item.content || !item.category || !item.platform) {
          result.failed++
          result.errors.push(`第 ${i + 1} 条记录：标题、内容、分类和平台为必填项`)
          continue
        }

        // 检查是否已存在相同标题的内容
        if (!override_existing) {
          const { data: existing } = await supabaseServiceRole
            .from('lab_content_library')
            .select('id')
            .eq('title', item.title)
            .eq('platform', item.platform)
            .single()

          if (existing) {
            result.failed++
            result.errors.push(`第 ${i + 1} 条记录：标题 "${item.title}" 在平台 "${item.platform}" 上已存在`)
            continue
          }
        }

        // 准备插入数据
        const insertData = {
          title: item.title.trim(),
          content: item.content.trim(),
          description: item.description?.trim() || null,
          author: item.author?.trim() || null,
          source_url: item.source_url?.trim() || null,
          category: item.category.trim(),
          platform: item.platform.trim(),
          hot_category: item.hot_category || null,
          status: item.status || 'draft',
          thumbnail_url: item.thumbnail_url?.trim() || null,
          images_urls: item.images_urls || [],
          video_url: item.video_url?.trim() || null,
          views_count: Math.max(0, item.views_count || 0),
          likes_count: Math.max(0, item.likes_count || 0),
          shares_count: Math.max(0, item.shares_count || 0),
          comments_count: Math.max(0, item.comments_count || 0),
          favorites_count: Math.max(0, item.favorites_count || 0),
          engagement_rate: Math.min(100, Math.max(0, item.engagement_rate || 0)),
          top_comments: item.top_comments || [],
          tags: item.tags || [],
          keywords: item.keywords || [],
          published_at: item.published_at ? new Date(item.published_at).toISOString() : null
        }

        // 插入数据库
        const { data, error } = await supabaseServiceRole
          .from('lab_content_library')
          .insert([insertData])
          .select('id, title')
          .single()

        if (error) {
          result.failed++
          result.errors.push(`第 ${i + 1} 条记录：数据库错误 - ${error.message}`)
          continue
        }

        result.success++
        result.imported_items.push(`${data.title} (ID: ${data.id})`)

      } catch (error) {
        result.failed++
        result.errors.push(`第 ${i + 1} 条记录：处理错误 - ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    // 返回结果
    return NextResponse.json({
      success: result.success > 0,
      data: result,
      message: `导入完成！成功 ${result.success} 条，失败 ${result.failed} 条`
    })

  } catch (error) {
    console.error('Content import error:', error)
    return NextResponse.json({
      success: false,
      error: '导入失败，请检查数据格式'
    }, { status: 500 })
  }
}

// 获取导入模板
export async function GET() {
  try {
    const template: ContentImportItem[] = [
      {
        title: "秋季穿搭指南｜温柔系女孩必备单品",
        content: "秋天来了，又到了展现温柔系穿搭的季节～今天给大家分享几个超实用的秋季穿搭技巧，让你轻松变身温柔小仙女✨\n\n1️⃣ 针织开衫 + 半身裙\n温柔的针织开衫搭配飘逸的半身裙，既保暖又优雅...",
        description: "分享秋季温柔系穿搭技巧和单品推荐",
        author: "时尚博主小雅",
        source_url: "https://www.xiaohongshu.com/explore/123456",
        category: "穿搭",
        platform: "小红书",
        hot_category: "trending",
        status: "published",
        thumbnail_url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=200&fit=crop",
        images_urls: [
          "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=600&fit=crop",
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop"
        ],
        video_url: "",
        views_count: 15600,
        likes_count: 1250,
        shares_count: 89,
        comments_count: 156,
        favorites_count: 523,
        engagement_rate: 8.5,
        top_comments: [
          {
            author: "用户A",
            content: "太实用了！马上去试试",
            likes: 23
          },
          {
            author: "用户B", 
            content: "博主分享的都好好看",
            likes: 18
          }
        ],
        tags: ["秋季穿搭", "温柔系", "针织开衫", "半身裙"],
        keywords: ["穿搭", "秋季", "温柔", "女装"],
        published_at: "2024-01-20T10:30:00Z"
      },
      {
        title: "护肤小白必看｜建立正确护肤步骤",
        content: "很多小仙女问我护肤的正确步骤是什么？今天就来详细分享一下基础护肤的完整流程～\n\n🧼 第一步：清洁\n选择温和的洁面产品，早晚各一次...",
        description: "护肤小白入门指南，详细护肤步骤分享",
        author: "美妆达人小美",
        source_url: "https://www.xiaohongshu.com/explore/789012",
        category: "美妆",
        platform: "小红书", 
        hot_category: "viral",
        status: "published",
        thumbnail_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=200&fit=crop",
        images_urls: [
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=600&fit=crop"
        ],
        video_url: "",
        views_count: 18900,
        likes_count: 2100,
        shares_count: 156,
        comments_count: 289,
        favorites_count: 845,
        engagement_rate: 12.3,
        top_comments: [
          {
            author: "护肤新手",
            content: "终于找到靠谱的护肤步骤了！",
            likes: 45
          },
          {
            author: "小仙女123",
            content: "按照这个步骤试了一个月，皮肤真的变好了",
            likes: 32
          }
        ],
        tags: ["护肤", "护肤步骤", "护肤小白", "基础护肤"],
        keywords: ["护肤", "美妆", "保养", "步骤"],
        published_at: "2024-01-18T14:20:00Z"
      }
    ]

    const filename = `爆文导入模板_${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
      }
    })

  } catch (error) {
    console.error('Template download error:', error)
    return NextResponse.json({
      success: false,
      error: '模板下载失败'
    }, { status: 500 })
  }
}
