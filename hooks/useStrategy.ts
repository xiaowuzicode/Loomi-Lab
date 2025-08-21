'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@chakra-ui/react'

// 策略数据类型
export interface Strategy {
  id: string
  title: string  
  content: string
  vector_status: 'pending' | 'success' | 'failed' // 黄、绿、红点状态
  vector_id?: string
  created_at: string  
  updated_at: string
  error_message?: string
}

// 统计数据类型
export interface StrategyStats {
  total: number
  vectorized: number    // 向量化成功数
  pending: number       // 未向量化数
  failed: number        // 向量化失败数
}

// 分页信息
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// RAG查询结果
export interface RAGResult {
  query: string
  results: {
    id: string
    title: string
    content: string
    similarity: number
    metadata: any
  }[]
  timestamp: string
}

// API响应格式
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function useStrategy() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [stats, setStats] = useState<StrategyStats>()
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  // 获取策略列表
  const fetchStrategies = useCallback(async (page: number = 1, limit: number = 10) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔗 正在获取策略列表: page=${page}, limit=${limit}`)
      const response = await fetch(`/api/strategy?action=list&page=${page}&limit=${limit}&env=hosted`)
      const result: ApiResponse<{ strategies: Strategy[]; pagination: Pagination }> = await response.json()
      console.log(`📡 策略API响应:`, result)
      
      if (result.success && result.data) {
        setStrategies(result.data.strategies)
        setPagination(result.data.pagination)
        console.log(`✅ 成功获取 ${result.data.strategies.length} 个策略`)
        return result.data.strategies
      } else {
        throw new Error(result.error || '获取策略列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '获取策略列表失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      console.log('🔗 正在获取策略统计数据')
      const response = await fetch('/api/strategy?action=stats&env=hosted')
      const result: ApiResponse<StrategyStats> = await response.json()
      
      if (result.success && result.data) {
        setStats(result.data)
        console.log('✅ 成功获取统计数据:', result.data)
        return result.data
      } else {
        throw new Error(result.error || '获取统计数据失败')
      }
    } catch (err) {
      console.error('获取统计数据失败:', err)
      // 设置默认统计数据
      const defaultStats: StrategyStats = {
        total: 0,
        vectorized: 0,
        pending: 0,
        failed: 0
      }
      setStats(defaultStats)
      return defaultStats
    }
  }, [])

  // 创建新策略
  const createStrategy = useCallback(async (title: string, content: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/strategy?action=create&env=hosted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      })
      
      const result: ApiResponse<Strategy> = await response.json()
      
      if (result.success) {
        toast({
          title: '策略创建成功',
          description: `策略 "${title}" 已创建`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        // 刷新策略列表和统计数据
        await fetchStrategies(pagination.page, pagination.limit)
        await fetchStats()
        return true
      } else {
        throw new Error(result.error || '创建策略失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '创建策略失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, pagination.page, pagination.limit, fetchStrategies, fetchStats])

  // 更新策略
  const updateStrategy = useCallback(async (id: string, title: string, content: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/strategy?action=update&id=${id}&env=hosted`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      })
      
      const result: ApiResponse<Strategy> = await response.json()
      
      if (result.success) {
        toast({
          title: '策略更新成功',
          description: `策略 "${title}" 已更新`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        // 刷新策略列表和统计数据
        await fetchStrategies(pagination.page, pagination.limit)
        await fetchStats()
        return true
      } else {
        throw new Error(result.error || '更新策略失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '更新策略失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, pagination.page, pagination.limit, fetchStrategies, fetchStats])

  // 删除策略
  const deleteStrategy = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/strategy?action=delete&id=${id}&env=hosted`, {
        method: 'DELETE',
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        toast({
          title: '策略删除成功',
          description: '策略已删除',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        // 刷新策略列表和统计数据
        await fetchStrategies(pagination.page, pagination.limit)
        await fetchStats()
        return true
      } else {
        throw new Error(result.error || '删除策略失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '删除策略失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, pagination.page, pagination.limit, fetchStrategies, fetchStats])

  // 批量向量化策略
  const vectorizeStrategies = useCallback(async (ids?: string[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/strategy?action=vectorize&env=hosted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      })
      
      const result: ApiResponse<{
        processed: number
        successful: number
        failed: number
        results: any[]
      }> = await response.json()
      
      if (result.success && result.data) {
        const { processed, successful, failed } = result.data
        
        toast({
          title: '向量化完成',
          description: `处理 ${processed} 个策略，成功 ${successful} 个，失败 ${failed} 个`,
          status: successful > 0 ? 'success' : 'warning',
          duration: 5000,
          isClosable: true,
        })
        
        // 刷新策略列表和统计数据
        await fetchStrategies(pagination.page, pagination.limit)
        await fetchStats()
        return result.data
      } else {
        throw new Error(result.error || '向量化失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '向量化失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast, pagination.page, pagination.limit, fetchStrategies, fetchStats])

  // RAG召回测试
  const ragQuery = useCallback(async (
    query: string,
    topK: number = 5,
    threshold: number = 0.5
  ): Promise<RAGResult | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/strategy?action=rag-query&env=hosted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          topK,
          threshold,
        }),
      })
      
      const result: ApiResponse<RAGResult> = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || 'RAG查询失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: 'RAG查询失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 检查连接状态
  const checkHealth = async () => {
    try {
      const response = await fetch('/api/strategy?action=health&env=hosted')
      const result: ApiResponse<{ connected: boolean; status: string }> = await response.json()
      
      return result.success ? result.data : null
    } catch (err) {
      console.error('检查策略库连接状态失败:', err)
      return null
    }
  }

  // 初始化时获取数据
  useEffect(() => {
    fetchStrategies()
    fetchStats()
  }, [fetchStrategies, fetchStats])

  return {
    // 数据状态
    strategies,
    stats,
    pagination,
    loading,
    error,
    
    // 操作方法
    fetchStrategies,
    fetchStats,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    vectorizeStrategies,
    ragQuery,
    checkHealth,
  }
}