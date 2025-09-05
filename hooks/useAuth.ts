'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@chakra-ui/react'
import type { AuthUser, LoginRequest, LoginResponse, ApiResponse } from '@/types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false
  })
  
  const router = useRouter()
  const toast = useToast()

  // 初始化认证状态
  useEffect(() => {
    const initAuth = () => {
      // 确保只在客户端执行
      if (typeof window === 'undefined') return
      
      try {
        const token = localStorage.getItem('auth_token')
        const userStr = localStorage.getItem('auth_user')
        
        if (token && userStr) {
          const user = JSON.parse(userStr) as AuthUser
          setAuthState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }))
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // 清除无效数据
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setAuthState(prev => ({
          ...prev,
          isLoading: false
        }))
      }
    }

    initAuth()
  }, [])

  // 检查token是否有效
  const checkTokenValidity = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        // Token失效，清除本地数据
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        
        return false
      }
      
      return true
    } catch {
      return false
    }
  }, [])

  // 登录
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const result: ApiResponse<LoginResponse> = await response.json()

      if (result.success && result.data) {
        const { user, token } = result.data
        
        // 保存到localStorage和cookie
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user))
        
        // 设置cookie（7天有效期，用于中间件验证）
        document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`
        
        // 更新状态
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true
        })

        toast({
          title: '登录成功',
          description: `欢迎回来，${user.username}！`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        // 跳转到仪表板
        router.push('/dashboard')
        return { success: true }
      } else {
        toast({
          title: '登录失败',
          description: result.error || '登录失败，请检查用户名和密码',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = '网络错误，请稍后重试'
      toast({
        title: '登录失败',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return { success: false, error: errorMessage }
    }
  }, [toast, router])

  // 退出登录
  const logout = useCallback(() => {
    // 清除存储和cookie
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    
    // 清除cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    // 重置状态
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false
    })

    toast({
      title: '已退出登录',
      description: '感谢您的使用！',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })

    // 跳转到登录页
    router.push('/login')
  }, [toast, router])

  // 检查用户是否有特定权限
  const hasPermission = useCallback((requiredRole: string) => {
    if (!authState.user) return false
    
    const roleHierarchy = {
      viewer: 1,
      operator: 2,
      admin: 3,
    }

    const userLevel = roleHierarchy[authState.user.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
  }, [authState.user])

  return {
    ...authState,
    login,
    logout,
    hasPermission
  }
}
