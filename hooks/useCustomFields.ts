'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import { 
  CustomFieldRecord, 
  CustomFieldForm, 
  CustomFieldStats, 
  CustomFieldListParams,
  ApiResponse 
} from '@/types'

interface CustomFieldListResponse {
  records: CustomFieldRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useCustomFields() {
  const [records, setRecords] = useState<CustomFieldRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<CustomFieldStats>({
    洞察: 0,
    钩子: 0,
    情绪: 0,
    总计: 0
  })
  const toast = useToast()

  // 获取自定义字段列表
  const fetchCustomFields = useCallback(async (params: CustomFieldListParams = {}) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({
        action: 'list',
        page: String(params.page || 1),
        limit: String(params.limit || 10),
        search: params.search || '',
        type: params.type || 'all',
        sortBy: params.sortBy || 'created_at',
        sortOrder: params.sortOrder || 'desc'
      })

      // 添加可选参数
      if (params.appCode) searchParams.set('appCode', params.appCode)
      if (params.amountMin !== undefined) searchParams.set('amountMin', String(params.amountMin))
      if (params.amountMax !== undefined) searchParams.set('amountMax', String(params.amountMax))
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
      if (params.dateTo) searchParams.set('dateTo', params.dateTo)
      if (params.visibility !== undefined) searchParams.set('visibility', String(params.visibility))
      if (params.isPublic !== undefined) searchParams.set('isPublic', String(params.isPublic))

      // 从localStorage获取token（修复key不匹配问题）
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/custom-fields?${searchParams}`, {
        headers
      })
      const result: ApiResponse<CustomFieldRecord[]> = await response.json()

      if (result.success && result.data) {
        setRecords(result.data)
        return {
          records: result.data,
          pagination: (result as any).pagination
        }
      } else {
        throw new Error(result.error || '获取自定义字段列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取自定义字段列表失败'
      setError(errorMessage)
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return {
        records: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 获取统计信息
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/custom-fields?action=stats', {
        headers
      })
      const result: ApiResponse<CustomFieldStats> = await response.json()

      if (result.success && result.data) {
        setStats(result.data)
        return result.data
      } else {
        throw new Error(result.error || '获取统计信息失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取统计信息失败'
      console.error('获取统计信息失败:', errorMessage)
      toast({
        title: '获取统计数据失败',
        description: errorMessage,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      const defaultStats = {
        洞察: 0,
        钩子: 0,
        情绪: 0,
        总计: 0
      }
      setStats(defaultStats)
      return defaultStats
    } finally {
      setStatsLoading(false)
    }
  }, [toast])


  // 根据ID获取单条记录
  const fetchCustomFieldById = useCallback(async (id: string): Promise<CustomFieldRecord | null> => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/custom-fields?id=${id}`, {
        headers
      })
      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || '获取记录详情失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取记录详情失败'
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

  // 创建自定义字段记录
  const createCustomField = useCallback(async (formData: CustomFieldForm & { type: string }): Promise<CustomFieldRecord | null> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('请先登录')
      }

      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success && result.data) {
        // 更新本地状态
        setRecords(prev => [result.data!, ...prev])

        toast({
          title: '成功',
          description: result.message || '创建成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        return result.data
      } else {
        throw new Error(result.error || '创建失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建失败'
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

  // 更新自定义字段记录
  const updateCustomField = useCallback(async (id: string, updates: Partial<CustomFieldForm>): Promise<CustomFieldRecord | null> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('请先登录')
      }

      const response = await fetch(`/api/custom-fields?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success && result.data) {
        // 更新本地状态
        setRecords(prev => prev.map(record => 
          record.id === id ? result.data! : record
        ))

        toast({
          title: '成功',
          description: result.message || '更新成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        return result.data
      } else {
        throw new Error(result.error || '更新失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失败'
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

  // 删除自定义字段记录 (软删除)
  const deleteCustomField = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('请先登录')
      }

      const response = await fetch(`/api/custom-fields?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success) {
        // 从本地状态中移除记录
        setRecords(prev => prev.filter(record => record.id !== id))

        toast({
          title: '成功',
          description: result.message || '删除成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        return true
      } else {
        throw new Error(result.error || '删除失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除失败'
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
    records,
    loading,
    statsLoading,
    error,
    stats,
    fetchCustomFields,
    fetchStats,
    fetchCustomFieldById,
    createCustomField,
    updateCustomField,
    deleteCustomField,
  }
}