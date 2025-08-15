import React, { createContext, useContext, useEffect, useState } from 'react'
import { useToast } from '@chakra-ui/react'

import { authApi } from '@/services/api'

interface User {
  id: string
  email: string
  username: string
  role: string
  status: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  // 检查本地存储的token
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      // 验证token并获取用户信息
      authApi.getProfile()
        .then((response) => {
          setUser(response.data.user)
        })
        .catch(() => {
          // token无效，清除本地存储
          localStorage.removeItem('access_token')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      const { access_token, user: userData } = response.data
      
      // 保存token到本地存储
      localStorage.setItem('access_token', access_token)
      setUser(userData)
      
      toast({
        title: '登录成功',
        description: `欢迎回来，${userData.username}！`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      const message = error.response?.data?.message || '登录失败，请检查邮箱和密码'
      toast({
        title: '登录失败',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    toast({
      title: '已退出登录',
      description: '感谢您的使用！',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
