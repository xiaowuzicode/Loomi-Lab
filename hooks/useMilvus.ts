'use client'

import { useState } from 'react'
import { useToast } from '@chakra-ui/react'

interface KnowledgeBase {
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
  const fetchKnowledgeBases = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/knowledge-base?action=list')
      const result: ApiResponse<KnowledgeBase[]> = await response.json()
      
      if (result.success && result.data) {
        setKnowledgeBases(result.data)
        return result.data
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
  }

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
  const createKnowledgeBase = async (name: string, dimension: number = 1536) => {
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
  }

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
  const ragQuery = async (
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
  }

  // 删除知识库
  const deleteKnowledgeBase = async (collectionName: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/knowledge-base?collection=${encodeURIComponent(collectionName)}`, {
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
  }

  // 获取知识库统计信息
  const getKnowledgeBaseStats = async (collectionName: string) => {
    try {
      const response = await fetch(`/api/knowledge-base?action=stats&collection=${encodeURIComponent(collectionName)}`)
      const result: ApiResponse<KnowledgeBase> = await response.json()
      
      return result.success ? result.data : null
    } catch (err) {
      console.error('获取知识库统计失败:', err)
      return null
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
    getKnowledgeBaseStats,
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
