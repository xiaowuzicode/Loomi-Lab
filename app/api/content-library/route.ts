import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ContentItem } from '@/types'

// 智能内容分类函数（基于关键词匹配）
function autoClassifyContent(text: string): string {
  const content = text.toLowerCase()
  
  // 定义分类关键词
  const categories = {
    '汽车': ['汽车', '车', '理想', '小米汽车', 'su7', '新能源', '电动车', '燃油车', '试驾', '买车', '选车', '车评', '车型', '汽车评测', '驾驶', '自驾', 'byd', '比亚迪', '特斯拉', 'tesla', '蔚来', '小鹏', '理想one', 'l7', 'l8', 'l9'],
    '美妆': ['化妆', '护肤', '美妆', '口红', '粉底', '眼影', '面膜', '精华', '洗面奶', '防晒', '美白', '抗老', '彩妆', '底妆', '唇妆'],
    '穿搭': ['穿搭', '服装', '搭配', '时尚', '衣服', '裙子', '外套', '鞋子', '包包', '配饰', '风格', '造型', 'outfit', 'ootd', '街拍'],
    '美食': ['美食', '做饭', '菜谱', '餐厅', '小吃', '甜品', '蛋糕', '料理', '烘焙', '食材', '味道', '好吃', '探店', '美食推荐'],
    '母婴': ['母婴', '育儿', '宝宝', '孕妇', '怀孕', '婴儿', '儿童', '亲子', '早教', '奶粉', '纸尿裤', '玩具', '童装', '孕期', '产后', '备孕'],
    '宠物': ['宠物', '猫', '狗', '猫咪', '狗狗', '萌宠', '宠物用品', '猫粮', '狗粮', '宠物医院', '养宠', '铲屎官', '宠物护理'],
    '职场': ['职场', '工作', '求职', '面试', '简历', '职业', '升职', '加薪', '办公', '同事', '老板', '职业规划', '跳槽', '实习'],
    '理财': ['理财', '投资', '基金', '股票', '存钱', '省钱', '赚钱', '副业', '财务', '理财规划', '金融', '经济', '创业', '被动收入'],
    '情感': ['情感', '恋爱', '感情', '分手', '结婚', '婚姻', '单身', '相亲', '约会', '异地恋', '心理', '情绪', '治愈', '自我成长'],
    '摄影': ['摄影', '拍照', '相机', '修图', '滤镜', '人像', '风景', '摄影技巧', 'ps', 'lightroom', '构图', '光影', '写真'],
    '读书': ['读书', '书籍', '阅读', '小说', '文学', '知识', '学习', '读后感', '书单', '推荐书', '作者', '经典', '畅销书'],
    '生活': ['生活', '日常', '分享', '记录', '心情', '感悟', '经历', '体验', '感受', '生活方式', 'vlog', '生活好物'],
    '旅游': ['旅游', '旅行', '景点', '攻略', '酒店', '机票', '风景', '游记', '度假', '出行', '打卡', '民宿', '自由行', '跟团游'],
    '健身': ['健身', '运动', '减肥', '瘦身', '锻炼', '肌肉', '瑜伽', '跑步', '力量', '体型', '塑形', '马甲线', '健身房', '普拉提'],
    '教育': ['学习', '教育', '知识', '技能', '经验', '方法', '技巧', '教程', '分享', '成长', '提升', '考试', '学霸', '笔记'],
    '科技': ['科技', '数码', '手机', '电脑', '软件', 'app', '网络', '互联网', '人工智能', 'ai', 'iphone', '安卓', '科技评测'],
    '娱乐': ['娱乐', '电影', '音乐', '游戏', '明星', '综艺', '电视', '小说', '动漫', '追星', '八卦', '剧评', '影评'],
    '家居': ['家居', '装修', '家装', '房子', '设计', '家具', '收纳', '清洁', '整理', '装饰', '软装', '硬装', '家电', '布置']
  }
  
  // 匹配分类
  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        return category
      }
    }
  }
  
  // 默认分类
  return '生活'
}

// 格式转换函数：爆文库格式 -> 小红书向量格式
function convertToXiaohongshuFormat(content: ContentItem): any {
  return {
    title: content.title,
    content: content.content,
    audio_url: '', // 爆文库没有音频字段
    cover_image_url: content.thumbnail_url || (content.images_urls && content.images_urls[0]) || '',
    video_url: content.video_url || '',
    likes: content.likes_count,
    favorites: content.favorites_count,
    comments: content.comments_count,
    author: content.author || '',
    tags: content.tags || [],
    publish_time: content.published_at || content.created_at
  }
}

// 获取内容列表或导出数据
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
    
    // 新增导出相关参数
    const isExport = searchParams.get('export') === 'true'
    const exportFormat = searchParams.get('format') || 'original' // original, xiaohongshu
    const exportLimit = parseInt(searchParams.get('exportLimit') || '1000') // 导出限制

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

    if (isExport) {
      // 导出模式：获取所有数据（限制最大数量）
      query = query.range(0, exportLimit - 1)
      
      const { data, error } = await query

      if (error) {
        throw error
      }

      let exportData: any[] = data || []

      // 根据格式进行转换
      if (exportFormat === 'xiaohongshu') {
        exportData = exportData.map(item => convertToXiaohongshuFormat(item))
      }

      // 生成文件名
      const timestamp = new Date().toISOString().split('T')[0]
      const formatName = exportFormat === 'xiaohongshu' ? '小红书向量格式' : '爆文库格式'
      const filename = `爆文库导出_${formatName}_${timestamp}.json`

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'X-Export-Count': exportData.length.toString(),
          'X-Export-Format': exportFormat
        }
      })
    } else {
      // 正常分页模式
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
    }

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
    
    // 验证核心必填字段
    if (!body.title || !body.content) {
      return NextResponse.json({
        success: false,
        error: '标题和内容为必填项'
      }, { status: 400 })
    }

    // 自动设置分类和平台
    const category = body.category?.trim() || autoClassifyContent(body.title + ' ' + body.content)
    const platform = body.platform?.trim() || '小红书'

    const insertData = {
      title: body.title.trim(),
      content: body.content.trim(),
      description: body.description?.trim() || null,
      author: body.author?.trim() || null,
      source_url: body.source_url?.trim() || null,
      category,
      platform,
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
