'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import { 
  CustomFieldRecord, 
  CustomFieldForm, 
  CustomFieldStats, 
  CustomFieldListParams,
  TableRow,
  FieldOperation,
  ApiResponse 
} from '@/types'

interface TableCustomFieldListResponse {
  records: CustomFieldRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useTableCustomFields() {
  const [tables, setTables] = useState<CustomFieldRecord[]>([])
  const [currentTable, setCurrentTable] = useState<CustomFieldRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<CustomFieldStats>({
    洞察: 0,
    钩子: 0,
    情绪: 0,
    总计: 0
  })
  const toast = useToast()
  const { user, isAuthenticated } = useAuth()

  // 获取表格列表
  const fetchTables = useCallback(async (params: CustomFieldListParams = {}) => {
    if (!isAuthenticated || !user?.id) {
      setError('用户未登录或用户信息不完整')
      setLoading(false)
      return {
        records: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    }

    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({
        userId: user.id,
        action: 'list',
        page: String(params.page || 1),
        limit: String(params.limit || 10),
        search: params.search || '',
        type: params.type || 'all',
        sortBy: params.sortBy || 'created_at',
        sortOrder: params.sortOrder || 'desc'
      })

      if (params.userSearch) searchParams.set('userSearch', params.userSearch)
      if (params.appCode) searchParams.set('appCode', params.appCode)
      if (params.amountMin !== undefined) searchParams.set('amountMin', String(params.amountMin))
      if (params.amountMax !== undefined) searchParams.set('amountMax', String(params.amountMax))
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
      if (params.dateTo) searchParams.set('dateTo', params.dateTo)
      if (params.visibility !== undefined) searchParams.set('visibility', String(params.visibility))
      if (params.isPublic !== undefined) searchParams.set('isPublic', String(params.isPublic))

      const response = await fetch(`/api/custom-fields?${searchParams}`)
      const result: ApiResponse<CustomFieldRecord[]> = await response.json()

      if (result.success && result.data) {
        setTables(result.data)
        return {
          records: result.data,
          pagination: (result as any).pagination
        }
      } else {
        throw new Error(result.error || '获取表格列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取表格列表失败'
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
  }, [toast, isAuthenticated, user])

  // 获取统计信息
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setStatsLoading(false)
      return {
        洞察: 0,
        钩子: 0,
        情绪: 0,
        总计: 0
      }
    }

    setStatsLoading(true)
    try {
      const searchParams = new URLSearchParams({
        userId: user.id,
        action: 'stats'
      })

      const response = await fetch(`/api/custom-fields?${searchParams}`)
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
  }, [isAuthenticated, user])

  // 获取单个表格详情
  const fetchTableById = useCallback(async (id: string): Promise<CustomFieldRecord | null> => {
    if (!isAuthenticated || !user?.id) {
      setTableLoading(false)
      return null
    }

    setTableLoading(true)
    try {
      const searchParams = new URLSearchParams({
        userId: user.id,
        id: id
      })

      const response = await fetch(`/api/custom-fields?${searchParams}`)
      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success && result.data) {
        setCurrentTable(result.data)
        return result.data
      } else {
        throw new Error(result.error || '获取表格详情失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取表格详情失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    } finally {
      setTableLoading(false)
    }
  }, [toast, isAuthenticated, user])

  // 创建新表格
  const createTable = useCallback(async (formData: CustomFieldForm & { type: string }): Promise<CustomFieldRecord | null> => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('用户未登录或用户信息不完整')
    }

    try {
      // 转换数据格式以匹配后端API期望的格式
      const transformedData = {
        userId: user.id,
        createdUserId: user.id,
        ...formData,
        // 如果没有提供 extendedField，创建默认的
        extendedField: formData.extendedField.length > 0 ? formData.extendedField : [
          { id: 1, '标题': '' }
        ],
        // 如果没有提供 tableFields，创建默认的
        tableFields: formData.tableFields.length > 0 ? formData.tableFields : ['标题']
      }

      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        body: JSON.stringify(transformedData)
      })

      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success && result.data) {
        setTables(prev => [result.data!, ...prev])
        toast({
          title: '成功',
          description: result.message || '创建表格成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        return result.data
      } else {
        throw new Error(result.error || '创建表格失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建表格失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }, [toast, isAuthenticated, user])

  // 字段操作
  const updateTableFields = useCallback(async (
    tableId: string, 
    operation: FieldOperation
  ): Promise<CustomFieldRecord | null> => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('用户未登录或用户信息不完整')
    }

    try {
      const requestData = {
        userId: user.id,
        id: tableId,
        ...operation
      }

      const response = await fetch('/api/custom-fields/fields', {
        method: 'PUT',
        body: JSON.stringify(requestData)
      })

      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success && result.data) {
        // 更新当前表格
        if (currentTable && currentTable.id === tableId) {
          setCurrentTable(result.data)
        }
        // 更新表格列表
        setTables(prev => prev.map(table => 
          table.id === tableId ? result.data! : table
        ))

        toast({
          title: '成功',
          description: result.message || '字段操作成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        return result.data
      } else {
        throw new Error(result.error || '字段操作失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '字段操作失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }, [currentTable, toast, isAuthenticated, user])

  // 行操作
  const updateTableRow = useCallback(async (
    tableId: string,
    action: 'add' | 'update' | 'delete' | 'duplicate',
    rowId?: number,
    rowData?: Record<string, any>
  ): Promise<CustomFieldRecord | null> => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('用户未登录或用户信息不完整')
    }

    try {
      let method: string
      let body: any = { 
        userId: user.id,
        id: tableId,
        action, 
        rowData,
        ...(rowId && { rowId })
      }

      if (action === 'add') {
        method = 'POST'
      } else if (action === 'delete') {
        method = 'DELETE'
      } else {
        method = 'PUT'
      }

      const response = await fetch('/api/custom-fields/rows', {
        method,
        body: JSON.stringify(body)
      })

      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success && result.data) {
        // 更新当前表格
        if (currentTable && currentTable.id === tableId) {
          setCurrentTable(result.data)
        }

        const actionText = {
          add: '添加行',
          update: '更新行',
          delete: '删除行',
          duplicate: '复制行'
        }[action]

        toast({
          title: '成功',
          description: result.message || `${actionText}成功`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
        return result.data
      } else {
        throw new Error(result.error || '行操作失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '行操作失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }, [currentTable, toast, isAuthenticated, user])


  // 删除表格
  const deleteTable = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('用户未登录或用户信息不完整')
    }

    try {
      const requestData = {
        userId: user.id,
        id: id
      }

      const response = await fetch('/api/custom-fields', {
        method: 'DELETE',
        body: JSON.stringify(requestData)
      })

      const result: ApiResponse<CustomFieldRecord> = await response.json()

      if (result.success) {
        setTables(prev => prev.filter(table => table.id !== id))
        if (currentTable && currentTable.id === id) {
          setCurrentTable(null)
        }

        toast({
          title: '成功',
          description: result.message || '删除表格成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        return true
      } else {
        throw new Error(result.error || '删除表格失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除表格失败'
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    }
  }, [currentTable, toast, isAuthenticated, user])

  // 单行字段更新（用于行内编辑）
  const updateCellValue = useCallback(async (
    tableId: string,
    rowId: number,
    field: string,
    value: string
  ): Promise<void> => {
    const updates = { [field]: value }
    await updateTableRow(tableId, 'update', rowId, updates)
  }, [updateTableRow])

  return {
    // 状态
    tables,
    currentTable,
    loading,
    tableLoading,
    statsLoading,
    error,
    stats,
    
    // 表格操作
    fetchTables,
    fetchStats,
    fetchTableById,
    createTable,
    deleteTable,
    setCurrentTable,
    
    // 字段操作
    updateTableFields,
    
    // 行操作
    updateTableRow,
    updateCellValue,
  }
}