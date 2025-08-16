'use client'

import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Textarea,
  Input,
  HStack,
  Alert,
  AlertIcon,
  Code,
  Divider,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useMilvus } from '@/hooks/useMilvus'

export default function TestMilvusPage() {
  const [testCollection, setTestCollection] = useState('test_knowledge_base')
  const [testText, setTestText] = useState('')
  const [queryText, setQueryText] = useState('')
  const [queryResults, setQueryResults] = useState<any[]>([])
  const toast = useToast()

  const {
    knowledgeBases,
    loading,
    error,
    fetchKnowledgeBases,
    checkHealth,
    createKnowledgeBase,
    addDocument,
    ragQuery,
  } = useMilvus()

  const handleHealthCheck = async () => {
    const health = await checkHealth()
    if (health) {
      toast({
        title: 'Milvus 连接正常',
        description: `状态: ${health.status}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Milvus 连接失败',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleCreateTestCollection = async () => {
    const success = await createKnowledgeBase(testCollection)
    if (success) {
      await fetchKnowledgeBases()
    }
  }

  const handleAddTestDocument = async () => {
    if (!testText.trim()) {
      toast({
        title: '请输入测试文档内容',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const success = await addDocument(
      testCollection,
      testText,
      'test_document.txt',
      { test: true, timestamp: new Date().toISOString() }
    )

    if (success) {
      setTestText('')
      await fetchKnowledgeBases()
    }
  }

  const handleTestQuery = async () => {
    if (!queryText.trim()) {
      toast({
        title: '请输入查询内容',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const results = await ragQuery(testCollection, queryText, 3, 0.3)
    if (results) {
      setQueryResults(results.sources)
    }
  }

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">
          🧪 Milvus 向量数据库测试页面
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* 健康检查 */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            1. 连接测试
          </Text>
          <Button onClick={handleHealthCheck} colorScheme="blue" isLoading={loading}>
            检查 Milvus 连接状态
          </Button>
        </Box>

        <Divider />

        {/* 创建测试集合 */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            2. 创建测试知识库
          </Text>
          <HStack>
            <Input
              value={testCollection}
              onChange={(e) => setTestCollection(e.target.value)}
              placeholder="知识库名称"
              maxW="300px"
            />
            <Button onClick={handleCreateTestCollection} colorScheme="green" isLoading={loading}>
              创建知识库
            </Button>
          </HStack>
        </Box>

        <Divider />

        {/* 添加测试文档 */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            3. 添加测试文档
          </Text>
          <VStack align="stretch" spacing={3}>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="输入测试文档内容..."
              rows={4}
            />
            <Button onClick={handleAddTestDocument} colorScheme="purple" isLoading={loading}>
              添加文档到知识库
            </Button>
          </VStack>
        </Box>

        <Divider />

        {/* RAG 查询测试 */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            4. RAG 查询测试
          </Text>
          <VStack align="stretch" spacing={3}>
            <Input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="输入查询问题..."
            />
            <Button onClick={handleTestQuery} colorScheme="orange" isLoading={loading}>
              执行 RAG 查询
            </Button>
          </VStack>
        </Box>

        {/* 查询结果 */}
        {queryResults.length > 0 && (
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={3}>
              查询结果：
            </Text>
            <VStack align="stretch" spacing={3}>
              {queryResults.map((result, index) => (
                <Box key={index} p={4} borderWidth={1} borderRadius="md">
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    相似度: {result.score.toFixed(3)} | 来源: {result.source}
                  </Text>
                  <Code p={2} borderRadius="md" display="block" whiteSpace="pre-wrap">
                    {result.text}
                  </Code>
                  {result.metadata && (
                    <Text fontSize="xs" color="gray.400" mt={2}>
                      元数据: {JSON.stringify(result.metadata)}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        <Divider />

        {/* 知识库列表 */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            5. 当前知识库列表
          </Text>
          <Button onClick={fetchKnowledgeBases} mb={3} size="sm">
            刷新列表
          </Button>
          {knowledgeBases.length > 0 ? (
            <VStack align="stretch" spacing={2}>
              {knowledgeBases.map((kb, index) => (
                <Box key={index} p={3} borderWidth={1} borderRadius="md">
                  <Text fontWeight="semibold">{kb.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    文档数量: {kb.documentCount} | 向量数量: {kb.vectorCount}
                  </Text>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500">暂无知识库</Text>
          )}
        </Box>
      </VStack>
    </Box>
  )
}
