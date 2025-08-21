import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@chakra-ui/react'
import type { ContentItem, ContentImportRequest, ContentImportResult, PaginatedResponse } from '@/types'

interface UseContentLibraryOptions {
  page?: number
  limit?: number
  category?: string
  platform?: string
  status?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface ContentLibraryStats {
  overview: {
    total_content: number
    published_content: number
    draft_content: number
    archived_content: number
    total_views: number
    total_likes: number
    total_shares: number
    total_comments: number
    total_favorites: number
    avg_engagement_rate: number
    vectorized_success?: number
    vectorized_pending?: number
    vectorized_failed?: number
  }
  category_stats: Record<string, any>
  platform_stats: Record<string, any>
  hot_category_stats: Record<string, number>
  daily_trends: any[]
}

export function useContentLibrary(options: UseContentLibraryOptions = {}) {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [stats, setStats] = useState<ContentLibraryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [vectorizing, setVectorizing] = useState(false)
  const [vectorProgress, setVectorProgress] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 })
  const toast = useToast()

  const {
    page = 1,
    limit = 20,
    category,
    platform,
    status,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options

  // 获取内容列表
  const fetchContents = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      })

      if (category && category !== 'all') params.append('category', category)
      if (platform && platform !== 'all') params.append('platform', platform)
      if (status && status !== 'all') params.append('status', status)
      if (search) params.append('search', search)

      const response = await fetch(`/api/content-library?${params}`)
      const result = await response.json()

      if (result.success) {
        setContents(result.data.items || [])
        setTotalCount(result.data.total || 0)
        setTotalPages(result.data.totalPages || 0)
      } else {
        throw new Error(result.error || '获取内容列表失败')
      }
    } catch (error) {
      console.error('Fetch contents error:', error)
      toast({
        title: '获取内容列表失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }, [page, limit, category, platform, status, search, sortBy, sortOrder, toast])

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/content-library/stats')
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        throw new Error(result.error || '获取统计数据失败')
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
      toast({
        title: '获取统计数据失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [toast])

  // 向量化待处理内容（串行分批）
  const vectorizePending = useCallback(async (env: 'local' | 'hosted' | 'aliyun' = 'local') => {
    if (vectorizing) return null
    setVectorizing(true)
    setVectorProgress({ processed: 0, total: 0 })

    try {
      // 先获取总量（简单做法：拉一次列表，或后端返回）
      // 这里直接按批次推进，直到后端返回没有待处理
      const batchLimit = 200
      let totalProcessed = 0
      let totalSuccessful = 0
      let totalFailed = 0

      while (true) {
        const res = await fetch(`/api/content-library/vectorize?env=${env}&limit=${batchLimit}`, { method: 'POST' })
        const result = await res.json()
        if (!result.success && result.data?.processed === 0) {
          // 失败且没有处理，直接退出
          break
        }

        const processed = result.data?.processed || 0
        const successful = result.data?.successful || 0
        const failed = result.data?.failed || 0

        totalProcessed += processed
        totalSuccessful += successful
        totalFailed += failed

        setVectorProgress(prev => ({ processed: prev.processed + processed, total: prev.total + processed }))

        // 没有更多待处理
        if (processed === 0) break

        // 小延迟避免阻塞UI
        await new Promise(r => setTimeout(r, 200))
      }

      await fetchContents()
      await fetchStats()

      toast({
        title: '向量化完成',
        description: `处理 ${totalProcessed} 条，成功 ${totalSuccessful} 条，失败 ${totalFailed} 条`,
        status: totalSuccessful > 0 ? 'success' : 'warning',
        duration: 4000,
        isClosable: true,
      })

      return { totalProcessed, totalSuccessful, totalFailed }
    } catch (error) {
      toast({ title: '向量化失败', description: error instanceof Error ? error.message : '未知错误', status: 'error' })
      return null
    } finally {
      setVectorizing(false)
    }
  }, [vectorizing, fetchContents, fetchStats, toast])

  // 创建内容
  const createContent = useCallback(async (contentData: Partial<ContentItem>) => {
    try {
      const response = await fetch('/api/content-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '内容创建成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        await fetchContents()
        await fetchStats()
        return result.data
      } else {
        throw new Error(result.error || '创建内容失败')
      }
    } catch (error) {
      toast({
        title: '创建内容失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      throw error
    }
  }, [toast, fetchContents, fetchStats])

  // 更新内容
  const updateContent = useCallback(async (id: string, contentData: Partial<ContentItem>) => {
    try {
      const response = await fetch('/api/content-library', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...contentData }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '内容更新成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        await fetchContents()
        await fetchStats()
        return result.data
      } else {
        throw new Error(result.error || '更新内容失败')
      }
    } catch (error) {
      toast({
        title: '更新内容失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      throw error
    }
  }, [toast, fetchContents, fetchStats])

  // 删除内容
  const deleteContent = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/content-library?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '内容删除成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        await fetchContents()
        await fetchStats()
      } else {
        throw new Error(result.error || '删除内容失败')
      }
    } catch (error) {
      toast({
        title: '删除内容失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      throw error
    }
  }, [toast, fetchContents, fetchStats])

  // 导入内容
  const importContents = useCallback(async (importData: ContentImportRequest): Promise<ContentImportResult> => {
    try {
      setImportLoading(true)
      
      const response = await fetch('/api/content-library/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '导入完成',
          description: result.message,
          status: result.data.failed > 0 ? 'warning' : 'success',
          duration: 5000,
          isClosable: true,
        })
        await fetchContents()
        await fetchStats()
        return result.data
      } else {
        throw new Error(result.error || '导入失败')
      }
    } catch (error) {
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      throw error
    } finally {
      setImportLoading(false)
    }
  }, [toast, fetchContents, fetchStats])

  // 下载导入模板
  const downloadTemplate = useCallback(async () => {
    try {
      const response = await fetch('/api/content-library/import')
      
      if (!response.ok) {
        throw new Error('下载模板失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `爆文导入模板_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: '模板下载成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '下载模板失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [toast])

  // 导出数据
  const exportData = useCallback(async (
    exportFormat: 'original' | 'xiaohongshu' = 'original',
    filters?: {
      category?: string
      platform?: string 
      status?: string
      search?: string
    },
    exportLimit: number = 1000
  ) => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        format: exportFormat,
        exportLimit: exportLimit.toString(),
        sortBy: 'created_at',
        sortOrder: 'desc'
      })

      // 应用筛选条件
      if (filters?.category && filters.category !== 'all') {
        params.append('category', filters.category)
      }
      if (filters?.platform && filters.platform !== 'all') {
        params.append('platform', filters.platform)
      }
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters?.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`/api/content-library?${params}`)
      
      if (!response.ok) {
        throw new Error('导出数据失败')
      }

      // 获取导出信息
      const exportCount = response.headers.get('X-Export-Count')
      const exportFormatType = response.headers.get('X-Export-Format')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // 从response headers获取文件名，或生成默认文件名
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `爆文库导出_${new Date().toISOString().split('T')[0]}.json`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''))
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      const formatName = exportFormatType === 'xiaohongshu' ? '小红书向量格式' : '爆文库格式'
      toast({
        title: '数据导出成功',
        description: `已导出 ${exportCount} 条数据 (${formatName})`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '数据导出失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [toast])

  // 初始化数据
  useEffect(() => {
    fetchContents()
    fetchStats()
  }, [fetchContents, fetchStats])

  return {
    // 数据
    contents,
    stats,
    totalCount,
    totalPages,
    
    // 状态
    loading,
    importLoading,
    vectorizing,
    vectorProgress,
    
    // 方法
    fetchContents,
    fetchStats,
    createContent,
    updateContent,
    deleteContent,
    importContents,
    downloadTemplate,
    exportData,
    vectorizePending,
    
    // 刷新
    refresh: () => {
      fetchContents()
      fetchStats()
    }
  }
}
