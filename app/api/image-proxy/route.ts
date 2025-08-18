import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 })
    }

    // 验证URL格式，只允许特定域名的图片
    const allowedDomains = [
      'sns-webpic-qc.xhscdn.com',
      'sns-img-qc.xhscdn.com', 
      'sns-avatar-qc.xhscdn.com',
      'ci.xiaohongshu.com',
      // 可以添加更多允许的图片域名
    ]
    
    const urlObj = new URL(imageUrl)
    if (!allowedDomains.includes(urlObj.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
    }

    // 设置请求头，模拟浏览器访问
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.xiaohongshu.com/',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    }

    // 请求原始图片
    const response = await fetch(imageUrl, {
      headers,
      // 设置超时时间
      signal: AbortSignal.timeout(10000), // 10秒超时
    })

    if (!response.ok) {
      console.error(`图片获取失败: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // 返回图片数据，设置缓存头
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 缓存24小时
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    })

  } catch (error) {
    console.error('图片代理错误:', error)
    
    // 超时或网络错误
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 })
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return NextResponse.json({ error: 'Network error' }, { status: 502 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 支持OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
