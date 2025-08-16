'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'

interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  status: 'active' | 'inactive' | 'banned'
  role: 'admin' | 'user' | 'moderator'
  subscription: 'free' | 'premium' | 'enterprise'
  last_login: string
  created_at: string
  updated_at: string
  email_confirmed: boolean
  phone_confirmed: boolean
  banned_until?: string
  total_usage: number
  monthly_usage: number
  raw_user_meta_data?: any
  raw_app_meta_data?: any
}

interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  dailyNewUsers: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: any
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    dailyNewUsers: 0
  })
  const toast = useToast()

  // 获取用户列表
  const fetchUsers = useCallback(async (options: {
    page?: number
    limit?: number
    search?: string
    status?: string
    role?: string
  } = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        action: 'list',
        page: String(options.page || 1),
        limit: String(options.limit || 12),
        search: options.search || '',
        status: options.status || 'all',
        role: options.role || 'all'
      })

      const response = await fetch(`/api/users?${params}`)
      const result: ApiResponse<User[]> = await response.json()

      if (result.success && result.data) {
        setUsers(result.data)
        return {
          users: result.data,
          pagination: result.pagination
        }
      } else {
        throw new Error(result.error || '获取用户列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取用户列表失败'
      setError(errorMessage)
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return {
        users: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0
        }
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 获取用户统计信息
  const fetchUserStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await fetch('/api/users?action=stats')
      const result: ApiResponse<UserStats> = await response.json()

      if (result.success && result.data) {
        setStats(result.data)
        return result.data
      } else {
        throw new Error(result.error || '获取用户统计失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取用户统计失败'
      console.error('获取用户统计失败:', errorMessage)
      toast({
        title: '获取统计数据失败',
        description: errorMessage,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      // 返回默认值，避免无限循环
      const defaultStats = {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        dailyNewUsers: 0
      }
      setStats(defaultStats)
      return defaultStats
    } finally {
      setStatsLoading(false)
    }
  }, [toast])

  // 获取单个用户信息
  const fetchUserById = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/users?id=${userId}`)
      const result: ApiResponse<User> = await response.json()

      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || '获取用户信息失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取用户信息失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }, [toast])

  // 更新用户信息
  const updateUser = useCallback(async (userId: string, updates: {
    phone?: string
    raw_user_meta_data?: any
  }): Promise<User | null> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          userId,
          updates
        })
      })

      const result: ApiResponse<User> = await response.json()

      if (result.success && result.data) {
        // 更新本地状态
        setUsers(prev => prev.map(user => 
          user.id === userId ? result.data! : user
        ))

        toast({
          title: '成功',
          description: result.message || '用户信息更新成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        return result.data
      } else {
        throw new Error(result.error || '更新用户信息失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新用户信息失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }, [toast])

  // 封禁用户
  const banUser = useCallback(async (userId: string, banUntil?: Date): Promise<User | null> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ban',
          userId,
          banUntil: banUntil?.toISOString()
        })
      })

      const result: ApiResponse<User> = await response.json()

      if (result.success && result.data) {
        // 更新本地状态
        setUsers(prev => prev.map(user => 
          user.id === userId ? result.data! : user
        ))

        toast({
          title: '成功',
          description: result.message || '用户封禁成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        return result.data
      } else {
        throw new Error(result.error || '封禁用户失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '封禁用户失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }, [toast])

  // 解封用户
  const unbanUser = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unban',
          userId
        })
      })

      const result: ApiResponse<User> = await response.json()

      if (result.success && result.data) {
        // 更新本地状态
        setUsers(prev => prev.map(user => 
          user.id === userId ? result.data! : user
        ))

        toast({
          title: '成功',
          description: result.message || '用户解封成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        return result.data
      } else {
        throw new Error(result.error || '解封用户失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '解封用户失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }, [toast])

  // 删除用户
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      })

      const result: ApiResponse<User> = await response.json()

      if (result.success) {
        // 从本地状态中移除用户
        setUsers(prev => prev.filter(user => user.id !== userId))

        toast({
          title: '成功',
          description: result.message || '用户删除成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        return true
      } else {
        throw new Error(result.error || '删除用户失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除用户失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    }
  }, [toast])

  return {
    users,
    loading,
    statsLoading,
    error,
    stats,
    fetchUsers,
    fetchUserStats,
    fetchUserById,
    updateUser,
    banUser,
    unbanUser,
    deleteUser,
  }
}
