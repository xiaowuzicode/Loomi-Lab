'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Center, Spinner, VStack, Text } from '@chakra-ui/react'

// 不需要认证的公开路径
const publicPaths = ['/login', '/api']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // 检查当前路径是否需要认证
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const needsAuth = !isPublicPath

  // 处理认证重定向
  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) return
    
    // 避免重复重定向
    if (typeof window === 'undefined') return
    
    // 如果在需要认证的页面但未认证，重定向到登录页
    if (needsAuth && !isAuthenticated) {
      // 防止循环重定向，只在非登录页时才重定向
      if (pathname !== '/login') {
        window.location.href = '/login'
      }
      return
    }
    
    // 如果在登录页但已认证，重定向到仪表板
    if (pathname === '/login' && isAuthenticated) {
      window.location.href = '/dashboard'
      return
    }
  }, [isLoading, isAuthenticated, pathname, needsAuth])

  // 如果正在加载认证状态，显示加载页面
  if (isLoading) {
    return (
      <Center h="100vh" bg="gray.900">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <VStack spacing={1}>
            <Text color="white" fontSize="lg" fontWeight="medium">
              Loomi-Lab
            </Text>
            <Text color="gray.400" fontSize="sm">
              正在加载...
            </Text>
          </VStack>
        </VStack>
      </Center>
    )
  }

  // 渲染应用内容（暂时不做重定向判断）
  return <>{children}</>
}