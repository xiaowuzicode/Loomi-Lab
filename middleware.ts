import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// 需要认证的路径
const protectedPaths = [
  '/dashboard',
  '/users',
  '/payments', 
  '/prompts',
  '/knowledge-base-v2',
  '/content-library',
  '/strategy-library',
  '/xiaohongshu',
  '/xiaohongshu-import',
  '/message-query',
  '/settings',
  '/profile',
  '/system-config',
  '/test-milvus',
  '/api/dashboard',
  '/api/users',
  '/api/payments',
  '/api/prompts',
  '/api/knowledge-base',
  '/api/content-library',
  '/api/strategy',
  '/api/xiaohongshu',
  '/api/message-query',
  '/api/milvus-data',
  '/api/refunds'
]

// 公开路径（不需要认证）
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/_next',
  '/favicon.ico',
  '/images'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 检查是否为公开路径
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // 根路径重定向到仪表板（客户端将处理认证检查）
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // 其他路径直接通过，让客户端AuthProvider处理认证
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
}