'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@chakra-ui/react'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  total?: number
}

export function useUserData() {
  const [users, setUsers] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const fetchUserById = async (userId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/users?id=${encodeURIComponent(userId)}`)
      const result: ApiResponse<any> = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || '获取用户信息失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '获取用户信息失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchUserByEmail = async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`)
      const result: ApiResponse<any> = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || '获取用户信息失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '获取用户信息失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersByIds = async (userIds: string[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      })
      
      const result: ApiResponse<any[]> = await response.json()
      
      if (result.success && result.data) {
        setUsers(result.data)
        return result.data
      } else {
        throw new Error(result.error || '批量获取用户信息失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '批量获取用户信息失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/users?action=stats')
      const result: ApiResponse<any> = await response.json()
      
      if (result.success && result.data) {
        setUserStats(result.data)
        return result.data
      } else {
        throw new Error(result.error || '获取用户统计失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '获取用户统计失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    users,
    userStats,
    loading,
    error,
    fetchUserById,
    fetchUserByEmail,
    fetchUsersByIds,
    fetchUserStats,
  }
}

export function usePaymentData() {
  const [payments, setPayments] = useState<any[]>([])
  const [paymentStats, setPaymentStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const fetchPayments = async (filters?: {
    status?: string
    userId?: string
    startDate?: string
    endDate?: string
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.userId) params.append('userId', filters.userId)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      
      const response = await fetch(`/api/payments?${params.toString()}`)
      const result: ApiResponse<any[]> = await response.json()
      
      if (result.success && result.data) {
        setPayments(result.data)
        return result.data
      } else {
        throw new Error(result.error || '获取支付记录失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '获取支付记录失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/payments?action=stats')
      const result: ApiResponse<any> = await response.json()
      
      if (result.success && result.data) {
        setPaymentStats(result.data)
        return result.data
      } else {
        throw new Error(result.error || '获取支付统计失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '获取支付统计失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    payments,
    paymentStats,
    loading,
    error,
    fetchPayments,
    fetchPaymentStats,
  }
}

// 通用的数据获取 Hook
export function useSupabaseQuery<T>(
  url: string,
  options?: {
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
  }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const refetch = async () => {
    if (!options?.enabled && options?.enabled !== undefined) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(url)
      const result: ApiResponse<T> = await response.json()
      
      if (result.success && result.data) {
        setData(result.data)
        options?.onSuccess?.(result.data)
      } else {
        throw new Error(result.error || '获取数据失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      options?.onError?.(errorMessage)
      
      toast({
        title: '获取数据失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (options?.enabled !== false) {
      refetch()
    }
  }, [url, options?.enabled])

  return {
    data,
    loading,
    error,
    refetch,
  }
}
