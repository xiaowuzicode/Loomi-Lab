'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import type { KnowledgeBase } from '@/types'

interface MilvusCollection {
  name: string
  row_count: number
  data_size: string
}

interface RAGResult {
  question: string
  context: string
  sources: {
    source: string
    text: string
    score: number
    metadata: any
  }[]
  timestamp: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function useMilvus() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  // 获取所有知识库
  const fetchKnowledgeBases = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/knowledge-base?action=list')
      const result: ApiResponse<MilvusCollection[]> = await response.json()
      
      if (result.success && result.data) {
        // 将 Milvus 集合数据映射为 KnowledgeBase 格式
        const knowledgeBases: KnowledgeBase[] = result.data.map((collection, index) => ({
          id: `kb_${index + 1}`,
          name: collection.name,
          description: `知识库: ${collection.name}`,
          type: 'general' as const,
          status: collection.row_count > 0 ? 'active' as const : 'inactive' as const,
          documentCount: collection.row_count,
          vectorCount: collection.row_count,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
        
        setKnowledgeBases(knowledgeBases)
        return knowledgeBases
      } else {
        throw new Error(result.error || '获取知识库列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '获取知识库列表失败',
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

  // 检查 Milvus 连接状态
  const checkHealth = async () => {
    try {
      const response = await fetch('/api/knowledge-base?action=health')
      const result: ApiResponse<{ connected: boolean; status: string }> = await response.json()
      
      return result.success ? result.data : null
    } catch (err) {
      console.error('检查 Milvus 连接状态失败:', err)
      return null
    }
  }

  // 创建新的知识库
  const createKnowledgeBase = useCallback(async (name: string, dimension: number = 1536) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/knowledge-base?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, dimension }),
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        toast({
          title: '知识库创建成功',
          description: `知识库 "${name}" 已创建`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        // 刷新知识库列表
        await fetchKnowledgeBases()
        return true
      } else {
        throw new Error(result.error || '创建知识库失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '创建知识库失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 添加文档到知识库
  const addDocument = async (
    collectionName: string,
    text: string,
    source: string,
    metadata: any = {}
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/knowledge-base?action=add-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName,
          text,
          source,
          metadata,
        }),
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        toast({
          title: '文档添加成功',
          description: `文档已添加到知识库 "${collectionName}"`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        return true
      } else {
        throw new Error(result.error || '添加文档失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '添加文档失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // RAG 查询
  const ragQuery = useCallback(async (
    collectionName: string,
    question: string,
    topK: number = 3,
    minScore: number = 0.5
  ): Promise<RAGResult | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/knowledge-base?action=query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName,
          question,
          topK,
          minScore,
        }),
      })
      
      const result: ApiResponse<RAGResult> = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || 'RAG 查询失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: 'RAG 查询失败',
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

  // 删除知识库（完整删除）
  const deleteKnowledgeBase = useCallback(async (collectionName: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/knowledge-base?collection=${encodeURIComponent(collectionName)}&action=drop`, {
        method: 'DELETE',
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        toast({
          title: '知识库删除成功',
          description: `知识库 "${collectionName}" 已删除`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        // 刷新知识库列表
        await fetchKnowledgeBases()
        return true
      } else {
        throw new Error(result.error || '删除知识库失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '删除知识库失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 清空知识库数据（保留结构）
  const clearKnowledgeBase = useCallback(async (collectionName: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/knowledge-base?collection=${encodeURIComponent(collectionName)}&action=clear`, {
        method: 'DELETE',
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        toast({
          title: '知识库清空成功',
          description: `知识库 "${collectionName}" 的所有数据已清空`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        // 刷新知识库列表
        await fetchKnowledgeBases()
        return true
      } else {
        throw new Error(result.error || '清空知识库失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '清空知识库失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 删除指定ID的记录
  const deleteEntities = useCallback(async (collectionName: string, ids: string[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/knowledge-base?collection=${encodeURIComponent(collectionName)}&action=entities`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids })
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        toast({
          title: '记录删除成功',
          description: `成功删除 ${ids.length} 条记录`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        return true
      } else {
        throw new Error(result.error || '删除记录失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '删除记录失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 根据条件删除记录
  const deleteByCondition = useCallback(async (collectionName: string, expression: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/knowledge-base?collection=${encodeURIComponent(collectionName)}&action=expression`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expression })
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        toast({
          title: '条件删除成功',
          description: `成功删除符合条件的记录`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        return true
      } else {
        throw new Error(result.error || '条件删除失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '条件删除失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 获取知识库统计信息
  const getKnowledgeBaseStats = async (collectionName: string) => {
    try {
      const response = await fetch(`/api/knowledge-base?action=stats&collection=${encodeURIComponent(collectionName)}`)
      const result: ApiResponse<MilvusCollection> = await response.json()
      
      if (result.success && result.data) {
        // 将 Milvus 统计数据映射为 KnowledgeBase 格式
        const kbStats: KnowledgeBase = {
          id: `kb_${collectionName}`,
          name: result.data.name,
          description: `知识库: ${result.data.name}`,
          type: 'general' as const,
          status: result.data.row_count > 0 ? 'active' as const : 'inactive' as const,
          documentCount: result.data.row_count,
          vectorCount: result.data.row_count,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        return kbStats
      }
      
      return null
    } catch (err) {
      console.error('获取知识库统计失败:', err)
      return null
    }
  }

  // 小红书数据导入
  const importXiaohongshuData = async (
    collectionName: string,
    dataType: 'csv' | 'json',
    data: string
  ): Promise<{ success: boolean; importedCount?: number; error?: string }> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/xiaohongshu-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName,
          dataType,
          data,
        }),
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        const importedCount = result.data?.importedCount || 0
        
        toast({
          title: '小红书数据导入成功',
          description: `成功导入 ${importedCount} 条数据到 "${collectionName}"`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        // 刷新知识库列表
        await fetchKnowledgeBases()
        return { success: true, importedCount }
      } else {
        throw new Error(result.error || '导入失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '小红书数据导入失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // ANN 相似性搜索
  const searchSimilarContent = async (
    collectionName: string,
    query: string,
    searchType: 'title' | 'content' | 'both' = 'both',
    topK: number = 5,
    minScore: number = 0.3
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/xiaohongshu-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName,
          query,
          searchType,
          topK,
          minScore,
        }),
      })
      
      const result: ApiResponse<any[]> = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || '搜索失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: 'ANN搜索失败',
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

  // 初始化小红书集合
  const initializeXiaohongshuCollection = async (collectionName?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/xiaohongshu-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collectionName }),
      })
      
      const result: ApiResponse<any> = await response.json()
      
      if (result.success) {
        toast({
          title: '小红书集合初始化成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        await fetchKnowledgeBases()
        return true
      } else {
        throw new Error(result.error || '初始化失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      toast({
        title: '初始化失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    knowledgeBases,
    loading,
    error,
    fetchKnowledgeBases,
    checkHealth,
    createKnowledgeBase,
    addDocument,
    ragQuery,
    deleteKnowledgeBase,
    clearKnowledgeBase,
    deleteEntities,
    deleteByCondition,
    getKnowledgeBaseStats,
    // 新增的小红书相关功能
    importXiaohongshuData,
    searchSimilarContent,
    initializeXiaohongshuCollection,
  }
}

// 文档处理相关的 Hook
export function useDocumentProcessor() {
  const [processing, setProcessing] = useState(false)
  const toast = useToast()

  // 处理文件上传和文档解析
  const processFile = async (file: File): Promise<string | null> => {
    setProcessing(true)
    
    try {
      // 这里应该实现文件解析逻辑
      // 支持 PDF, DOC, TXT 等格式
      const text = await file.text() // 简单的文本文件处理
      
      toast({
        title: '文件处理成功',
        description: `已解析 ${file.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      return text
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件处理失败'
      toast({
        title: '文件处理失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    } finally {
      setProcessing(false)
    }
  }

  // 批量处理多个文件
  const processFiles = async (files: FileList): Promise<{ name: string; content: string }[]> => {
    setProcessing(true)
    const results = []
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const content = await processFile(file)
        
        if (content) {
          results.push({
            name: file.name,
            content,
          })
        }
      }
      
      return results
    } finally {
      setProcessing(false)
    }
  }

  return {
    processing,
    processFile,
    processFiles,
  }
}
