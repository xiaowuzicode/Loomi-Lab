import { NextRequest, NextResponse } from 'next/server'

/**
 * 知识库模版下载API
 * 支持CSV和JSON格式的数据导入模版
 */

// 小红书数据结构定义（用于生成模版）
interface XiaohongshuTemplate {
  title: string
  content: string
  audio_url?: string
  cover_image_url?: string
  video_url?: string
  likes?: number
  favorites?: number
  comments?: number
  author?: string
  tags?: string
  publish_time?: string
}

// 模版示例数据
const templateData: XiaohongshuTemplate[] = [
  {
    title: '超简单芝士蛋糕教程',
    content: '今天给大家分享一个超级简单的芝士蛋糕制作方法，零失败！材料：奶油奶酪200g、鸡蛋2个、牛奶100ml、糖50g...',
    audio_url: 'https://example.com/audio/cheesecake-tutorial.mp3',
    cover_image_url: 'https://example.com/images/cheesecake-cover.jpg', 
    video_url: 'https://example.com/videos/cheesecake-tutorial.mp4',
    likes: 1580,
    favorites: 892,
    comments: 156,
    author: '美食达人小李',
    tags: '美食,甜品,芝士蛋糕,教程',
    publish_time: '2024-03-15 14:30:00'
  },
  {
    title: '三亚旅游攻略 | 5天4夜完整规划',
    content: '超详细的三亚旅游攻略来啦！包含住宿推荐、必打卡景点、美食地图、交通指南等。第一天：天涯海角→南山寺...',
    cover_image_url: 'https://example.com/images/sanya-travel.jpg',
    video_url: 'https://example.com/videos/sanya-guide.mp4', 
    likes: 2340,
    favorites: 1456,
    comments: 287,
    author: '旅行达人Amy',
    tags: '旅游,三亚,攻略,海南',
    publish_time: '2024-03-14 09:15:00'
  },
  {
    title: '春季穿搭分享 | 温柔系look',
    content: '春天来了，分享几套温柔系的穿搭look！今天的搭配：米色毛衣+卡其色长裙+小白鞋，简约又优雅...',
    cover_image_url: 'https://example.com/images/spring-outfit.jpg',
    likes: 987,
    favorites: 623,
    comments: 94,
    author: '时尚博主小欣',
    tags: '穿搭,时尚,春季,温柔风',
    publish_time: '2024-03-13 16:45:00'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    
    if (format === 'csv') {
      // 生成CSV格式模版
      const headers = [
        'title',
        'content', 
        'audio_url',
        'cover_image_url',
        'video_url',
        'likes',
        'favorites',
        'comments',
        'author',
        'tags',
        'publish_time'
      ]
      
      // CSV头部
      let csvContent = headers.join(',') + '\n'
      
      // CSV数据行
      templateData.forEach(item => {
        const row = headers.map(header => {
          let value = item[header as keyof XiaohongshuTemplate] || ''
          // 处理标签数组
          if (header === 'tags' && typeof value === 'string') {
            // 如果已经是字符串就直接使用
          } else if (header === 'tags' && Array.isArray(value)) {
            value = value.join(',')
          }
          // CSV转义：如果包含逗号、换行符或双引号，需要用双引号包围
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        csvContent += row.join(',') + '\n'
      })
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="xiaohongshu_template.csv"',
          'Cache-Control': 'no-cache'
        }
      })
      
    } else if (format === 'json') {
      // 生成JSON格式模版
      const jsonContent = JSON.stringify(templateData, null, 2)
      
      return new NextResponse(jsonContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="xiaohongshu_template.json"',
          'Cache-Control': 'no-cache'
        }
      })
      
    } else {
      return NextResponse.json({
        success: false,
        error: '不支持的文件格式，请使用 csv 或 json'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ 生成模版文件失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成模版文件失败'
    }, { status: 500 })
  }
}
