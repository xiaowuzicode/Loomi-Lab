import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ContentImportRequest, ContentImportResult, ContentImportItem } from '@/types'

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
        // 验证核心必填字段
        if (!item.title || !item.content) {
          result.failed++
          result.errors.push(`第 ${i + 1} 条记录：标题和内容为必填项`)
          continue
        }

        // 自动设置平台（默认小红书）
        const platform = item.platform?.trim() || '小红书'
        
        // 自动分类逻辑（基于内容关键词）
        let category = item.category?.trim()
        if (!category) {
          category = autoClassifyContent(item.title + ' ' + item.content)
        }

        // 检查是否已存在相同标题的内容
        if (!override_existing) {
          const { data: existing } = await supabaseServiceRole
            .from('lab_content_library')
            .select('id')
            .eq('title', item.title)
            .eq('platform', platform)
            .single()

          if (existing) {
            result.failed++
            result.errors.push(`第 ${i + 1} 条记录：标题 "${item.title}" 在平台 "${platform}" 上已存在`)
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
          category,
          platform,
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
          published_at: item.published_at ? new Date(item.published_at).toISOString() : null,
          // 初始向量化状态
          vector_status: 'pending',
          vector_id: null,
          vector_error: null,
          last_vectorized_at: null
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
        title: "秋季穿搭指南｜温柔系女孩必备单品", // 必填
        content: "秋天来了，又到了展现温柔系穿搭的季节～今天给大家分享几个超实用的秋季穿搭技巧，让你轻松变身温柔小仙女✨\n\n1️⃣ 针织开衫 + 半身裙\n温柔的针织开衫搭配飘逸的半身裙，既保暖又优雅...", // 必填
        description: "分享秋季温柔系穿搭技巧和单品推荐", // 可选
        author: "时尚博主小雅", // 可选
        source_url: "https://www.xiaohongshu.com/explore/123456", // 可选
        category: "", // 可选，留空将自动分类
        platform: "", // 可选，留空默认为"小红书"
        hot_category: "trending", // 可选：viral/trending/normal
        status: "published", // 可选，默认为draft
        thumbnail_url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=200&fit=crop", // 可选
        images_urls: [
          "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=600&fit=crop",
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop"
        ], // 可选
        video_url: "", // 可选
        views_count: 15600, // 可选，默认为0
        likes_count: 1250, // 可选，默认为0
        shares_count: 89, // 可选，默认为0
        comments_count: 156, // 可选，默认为0
        favorites_count: 523, // 可选，默认为0
        engagement_rate: 8.5, // 可选，默认为0
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
        ], // 可选
        tags: ["秋季穿搭", "温柔系", "针织开衫", "半身裙"], // 可选
        keywords: ["穿搭", "秋季", "温柔", "女装"], // 可选
        published_at: "2024-01-20T10:30:00Z" // 可选
      },
      {
        title: "护肤小白必看｜建立正确护肤步骤", // 必填
        content: "很多小仙女问我护肤的正确步骤是什么？今天就来详细分享一下基础护肤的完整流程～\n\n🧼 第一步：清洁\n选择温和的洁面产品，早晚各一次...", // 必填
        description: "护肤小白入门指南，详细护肤步骤分享", // 可选
        author: "美妆达人小美", // 可选
        source_url: "https://www.xiaohongshu.com/explore/789012", // 可选
        category: "", // 留空自动分类（基于"护肤"等关键词会分类为"美妆"）
        platform: "", // 留空默认为"小红书"
        hot_category: "viral", // 可选
        status: "published", // 可选
        thumbnail_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=200&fit=crop", // 可选
        images_urls: [
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=600&fit=crop"
        ], // 可选
        video_url: "", // 可选
        views_count: 18900, // 可选
        likes_count: 2100, // 可选
        shares_count: 156, // 可选
        comments_count: 289, // 可选
        favorites_count: 845, // 可选
        engagement_rate: 12.3, // 可选
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
        ], // 可选
        tags: ["护肤", "护肤步骤", "护肤小白", "基础护肤"], // 可选
        keywords: ["护肤", "美妆", "保养", "步骤"], // 可选
        published_at: "2024-01-18T14:20:00Z" // 可选
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
