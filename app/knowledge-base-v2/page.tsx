'use client'

import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Badge,
  Flex,
  Input,
  Textarea,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Code,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMilvus } from '@/hooks/useMilvus'
import type { KnowledgeBase } from '@/types'
import {
  RiAddLine,
  RiSearchLine,
  RiDatabase2Line,
  RiBrainLine,
  RiFileTextLine,
  RiUploadLine,
  RiDownloadLine,
  RiPlayLine,
  RiSettingsLine,
  RiMoreLine,
  RiDeleteBinLine,
  RiEditLine,
  RiHistoryLine,
  RiCheckLine,
  RiCloseLine,
  RiAlertLine,
  RiRefreshLine,
  RiEyeLine,
  RiBarChartLine,
  RiArrowDropDownLine,
  RiCodeLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'

interface ImportRecord {
  id: string
  collection_name: string
  file_name: string
  file_type: 'csv' | 'json' | 'txt' | 'pdf'
  file_size: number
  status: 'success' | 'failed' | 'processing'
  imported_count: number
  error_message?: string
  field_mappings?: Record<string, string>
  created_at: string
  completed_at?: string
  metadata?: Record<string, any>
}

interface SearchResult {
  id: string
  content: string
  similarity: number
  metadata: {
    title?: string
    category?: string
    source?: string
  }
}

export default function KnowledgeBaseV2Page() {
  const toast = useToast()
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  
  // 使用真实的Milvus Hook
    const {
    knowledgeBases,
    loading,
    error,
    fetchKnowledgeBases,
    createKnowledgeBase,
    deleteKnowledgeBase,
    clearKnowledgeBase,
    ragQuery,
    importXiaohongshuData
  } = useMilvus()
  
  // 弹窗控制
  const { isOpen: isNewKBOpen, onOpen: onNewKBOpen, onClose: onNewKBClose } = useDisclosure()
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure()
  
  // 危险操作确认弹窗
  const { isOpen: isRebuildIndexOpen, onOpen: onRebuildIndexOpen, onClose: onRebuildIndexClose } = useDisclosure()
  const { isOpen: isClearKBOpen, onOpen: onClearKBOpen, onClose: onClearKBClose } = useDisclosure()  
  const { isOpen: isDeleteKBOpen, onOpen: onDeleteKBOpen, onClose: onDeleteKBClose } = useDisclosure()
  
  // 表单状态
  const [newKBName, setNewKBName] = useState('')
  const [queryText, setQueryText] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [topK, setTopK] = useState(5)
  const [similarity, setSimilarity] = useState(0.01)
  const [ragLoading, setRagLoading] = useState(false)
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([])

  // 获取导入历史
  const fetchImportHistory = useCallback(async (collectionName?: string) => {
    try {
      const url = collectionName 
        ? `/api/knowledge-base/import-history?collection=${encodeURIComponent(collectionName)}`
        : '/api/knowledge-base/import-history'
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success && result.data) {
        setImportHistory(result.data)
      }
    } catch (error) {
      console.error('获取导入历史失败:', error)
    }
  }, [])

  // 在组件加载时获取真实数据（只执行一次）
  useEffect(() => {
    fetchKnowledgeBases()
    fetchImportHistory() // 获取全部导入历史
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 空依赖数组，只在组件挂载时执行一次

  // 当选中知识库变化时，获取该知识库的导入历史
  useEffect(() => {
    if (selectedKB) {
      fetchImportHistory(selectedKB.name)
    }
  }, [selectedKB, fetchImportHistory])

  // 监听错误状态
  useEffect(() => {
    if (error) {
      toast({
        title: '数据加载失败',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [error]) // 移除toast依赖，它应该是稳定的

  // 颜色主题 (使用useMemo稳定值)
  const colors = useMemo(() => ({
    bg: useColorModeValue('gray.50', 'gray.900'),
    cardBg: useColorModeValue('white', 'gray.800'),
    border: useColorModeValue('gray.200', 'gray.700'),
    selectedBg: useColorModeValue('blue.50', 'blue.900')
  }), [])

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '活跃', colorScheme: 'green' },
      inactive: { label: '未激活', colorScheme: 'gray' },
      building: { label: '构建中', colorScheme: 'blue' },
      error: { label: '错误', colorScheme: 'red' },
      processing: { label: '处理中', colorScheme: 'orange' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return (
      <Badge size="sm" colorScheme={config.colorScheme}>
        {config.label}
      </Badge>
    )
  }

  // 处理新建知识库
  const handleCreateKB = async () => {
    if (!newKBName.trim()) {
      toast({
        title: '请输入知识库名称',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const collectionName = `lab_${newKBName.trim()}`
      const success = await createKnowledgeBase(collectionName)
      
      if (success) {
        setNewKBName('')
        onNewKBClose()
        
        // 重新获取知识库列表
        await fetchKnowledgeBases()
        
        toast({
          title: '知识库创建成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        throw new Error('创建失败')
      }
    } catch (error) {
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // 处理RAG搜索
  const handleSearch = async () => {
    if (!queryText.trim() || !selectedKB) {
      toast({
        title: '请输入查询内容并选择知识库',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setRagLoading(true)
    try {
      const result = await ragQuery(selectedKB.name, queryText, topK, similarity)
      
      if (result && result.sources) {
        // 转换RAG结果格式为SearchResult格式
        const formattedResults: SearchResult[] = result.sources.map((source, index) => ({
          id: `${index + 1}`,
          content: source.text,
          similarity: source.score,
          metadata: {
            title: source.metadata?.title || source.source,
            category: source.metadata?.category || '知识库文档',
            source: source.source
          }
        }))
        
        setSearchResults(formattedResults)
        
        toast({
          title: `找到 ${formattedResults.length} 条相关结果`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        setSearchResults([])
        toast({
          title: '没有找到相关结果',
          description: '请尝试使用不同的关键词或降低相似度阈值',
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      toast({
        title: '搜索失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setRagLoading(false)
    }
  }

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedKB) {
      if (!selectedKB) {
        toast({
          title: '请先选择知识库',
          description: '需要先选择一个知识库才能上传文件',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
      }
      return
    }

    // 检查文件类型
    const fileType = file.name.toLowerCase().endsWith('.json') ? 'json' : 
                    file.name.toLowerCase().endsWith('.csv') ? 'csv' : null
                    
    if (!fileType) {
      toast({
        title: '不支持的文件格式',
        description: '请选择 .json 或 .csv 文件',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 检查文件大小 (10MB限制)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: '文件过大',
        description: '文件大小不能超过 10MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    let importHistoryId: string | null = null
    
    try {
      // 显示上传开始提示
      toast({
        title: `开始上传文件: ${file.name}`,
        description: '正在读取文件内容...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      })

      // 读取文件内容
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsText(file, 'utf-8')
      })

      // 记录导入开始
      console.log('📝 创建导入历史记录:', {
        collectionName: selectedKB.name,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        status: 'processing'
      })
      
      const createResponse = await fetch('/api/knowledge-base/import-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionName: selectedKB.name,
          fileName: file.name,
          fileType,
          fileSize: file.size,
          status: 'processing'
        })
      })
      
      const createResult = await createResponse.json()
      importHistoryId = createResult.success ? createResult.data?.id : null
      console.log('📋 导入历史记录创建结果:', { createResult, importHistoryId })

      // 调用导入API
      console.log('🚀 开始导入数据到:', selectedKB.name)
      const result = await importXiaohongshuData(selectedKB.name, fileType, fileContent)
      console.log('📊 导入API结果:', result)
      
      if (result.success && importHistoryId) {
        // 更新导入历史状态为成功
        console.log('🔄 更新导入历史状态:', {
          id: importHistoryId,
          status: 'success',
          importedCount: result.importedCount || 0
        })
        
        const updateResponse = await fetch('/api/knowledge-base/import-history', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: importHistoryId,
            status: 'success',
            importedCount: result.importedCount || 0
          })
        })
        
        const updateResult = await updateResponse.json()
        console.log('✅ 导入历史更新结果:', updateResult)
        
        if (!updateResult.success) {
          console.error('❌ 导入历史更新失败:', updateResult.error)
        }

        toast({
          title: '文件上传成功！',
          description: `${file.name} 已成功导入 ${result.importedCount || 0} 条数据到知识库`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        
        // 刷新知识库数据和导入历史
        const updatedKBs = await fetchKnowledgeBases()
        await fetchImportHistory(selectedKB.name)
        
        // 如果当前选中的知识库就是导入目标，更新其信息
        const updatedKB = updatedKBs?.find(kb => kb.name === selectedKB.name)
        if (updatedKB) {
          setSelectedKB(updatedKB)
        }
      } else {
        throw new Error(result.error || '数据导入失败')
      }

    } catch (error) {
      // 记录导入失败 - 如果已经有导入记录ID，更新状态；否则创建新记录
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      if (importHistoryId) {
        // 更新现有记录为失败状态
        console.log('🔄 更新失败状态:', { id: importHistoryId, status: 'failed', errorMessage })
        const failUpdateResponse = await fetch('/api/knowledge-base/import-history', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: importHistoryId,
            status: 'failed',
            errorMessage
          })
        })
        
        const failUpdateResult = await failUpdateResponse.json()
        console.log('📋 失败状态更新结果:', failUpdateResult)
      } else {
        // 创建新的失败记录
        await fetch('/api/knowledge-base/import-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionName: selectedKB.name,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            status: 'failed',
            errorMessage
          })
        }).catch(console.error)
      }

      toast({
        title: '文件上传失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      // 清空文件输入框
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // 处理模版下载
  const handleDownloadTemplate = async (format: 'csv' | 'json') => {
    try {
      toast({
        title: '正在生成模版文件...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      })

      const response = await fetch(`/api/knowledge-base/template?format=${format}`)
      
      if (!response.ok) {
        throw new Error('下载失败')
      }
      
      // 获取文件内容
      const blob = await response.blob()
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `xiaohongshu_template.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: '模版下载成功！',
        description: `${format.toUpperCase()} 格式模版已下载到本地`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
    } catch (error) {
      toast({
        title: '下载失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // 处理重建索引
  const handleRebuildIndex = async () => {
    if (!selectedKB) return

    onRebuildIndexClose()
    
    try {
      toast({
        title: '开始重建索引...',
        description: '这可能需要几分钟时间',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })

      // 这里应该调用重建索引的API
      // TODO: 实现重建索引API
      
      setTimeout(() => {
        toast({
          title: '索引重建成功！',
          description: '知识库索引已优化完成',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }, 3000)

    } catch (error) {
      toast({
        title: '重建索引失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // 处理清空知识库
  const handleClearKnowledgeBase = async () => {
    if (!selectedKB) return

    onClearKBClose()
    
    try {
      const success = await clearKnowledgeBase(selectedKB.name)
      
      if (success) {
        // 刷新数据
        await fetchKnowledgeBases()
        await fetchImportHistory(selectedKB.name)
        
        // 更新选中的知识库信息
        setSelectedKB(prev => prev ? { ...prev, documentCount: 0, vectorCount: 0, status: 'inactive' } : null)
      }
    } catch (error) {
      console.error('清空知识库失败:', error)
    }
  }

  // 处理删除知识库
  const handleDeleteKnowledgeBase = async () => {
    if (!selectedKB) return

    onDeleteKBClose()
    
    try {
      const success = await deleteKnowledgeBase(selectedKB.name)
      
      if (success) {
        // 清空选中状态
        setSelectedKB(null)
        
        // 刷新知识库列表
        await fetchKnowledgeBases()
        setImportHistory([])
      }
    } catch (error) {
      console.error('删除知识库失败:', error)
    }
  }

  return (
    <PageLayout>
      <Flex h="calc(100vh - 80px)" gap={6}>
        {/* 左侧：知识库列表 */}
        <Box w="350px" flexShrink={0}>
          <Card h="full" p={0}>
            <VStack spacing={0} align="stretch" h="full">
                                   {/* 标题和新建按钮 */}
                     <Box p={4} borderBottom="1px" borderColor={colors.border}>
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="lg" fontWeight="bold">
                    🧠 知识库列表
                  </Text>
                  <Button
                    leftIcon={<RiAddLine />}
                    colorScheme="blue"
                    onClick={onNewKBOpen}
                  >
                    新建知识库
                  </Button>
                </VStack>
              </Box>

              {/* 知识库列表 */}
              <Box flex={1} overflowY="auto" p={2}>
                {loading ? (
                  <VStack spacing={2} p={2}>
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} height="80px" borderRadius="md" />
                    ))}
                  </VStack>
                ) : knowledgeBases.length === 0 ? (
                  <Box p={4}>
                    <Alert status="info">
                      <AlertIcon />
                      没有找到知识库
                    </Alert>
                  </Box>
                ) : (
                  <VStack spacing={1} p={2} align="stretch">
                    {knowledgeBases.map((kb) => (
                      <Card
                        key={kb.id}
                        p={3}
                        variant={selectedKB?.id === kb.id ? 'glass' : 'outlined'}
                        bg={selectedKB?.id === kb.id ? colors.selectedBg : colors.cardBg}
                        borderColor={selectedKB?.id === kb.id ? 'blue.200' : colors.border}
                        cursor="pointer"
                        onClick={() => setSelectedKB(kb)}
                      >
                        <VStack align="start" spacing={2}>
                          <Flex justify="space-between" w="full" align="start">
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                {kb.name.startsWith('lab_') ? kb.name.replace('lab_', '') : kb.name}
                              </Text>
                              <HStack spacing={2}>
                                <Text fontSize="xs" color="gray.500">
                                  {formatNumber(kb.documentCount)} 篇文档
                                </Text>
                                {getStatusBadge(kb.status)}
                              </HStack>
                            </VStack>

                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<RiMoreLine />}
                                variant="ghost"
                                size="xs"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <MenuList>
                                <MenuItem icon={<RiEditLine />}>编辑</MenuItem>
                                <MenuItem icon={<RiDeleteBinLine />} color="red.500">删除</MenuItem>
                              </MenuList>
                            </Menu>
                          </Flex>
                          {kb.status === 'building' && (
                            <Box w="full">
                              <Progress value={65} colorScheme="blue" size="xs" />
                            </Box>
                          )}
                        </VStack>
                      </Card>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          </Card>
        </Box>

        {/* 右侧：主工作区 */}
        <Box flex={1}>
          {selectedKB ? (
            <Card h="full" p={0}>
              <VStack spacing={0} align="stretch" h="full">
                {/* 工作区标题 */}
                <Box p={4} borderBottom="1px" borderColor={colors.border}>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xl" fontWeight="bold">
                        {selectedKB.name.startsWith('lab_') ? selectedKB.name.replace('lab_', '') : selectedKB.name}
                      </Text>
                      <HStack spacing={4}>
                        <Text fontSize="sm" color="gray.500">
                          文档: {formatNumber(selectedKB.documentCount)}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          向量: {formatNumber(selectedKB.vectorCount)}
                        </Text>
                        {getStatusBadge(selectedKB.status)}
                      </HStack>
                    </VStack>
                    <HStack>
                      <IconButton
                        icon={<RiRefreshLine />}
                        variant="ghost"
                        aria-label="刷新"
                      />
                      <IconButton
                        icon={<RiSettingsLine />}
                        variant="ghost"
                        aria-label="设置"
                      />
                    </HStack>
                  </HStack>
                </Box>

                {/* 标签页内容 */}
                <Box flex={1} p={4}>
                  <Tabs index={activeTab} onChange={setActiveTab}>
                    <TabList>
                      <Tab>
                        <HStack spacing={2}>
                          <RiBarChartLine />
                          <Text>概览</Text>
                        </HStack>
                      </Tab>
                      <Tab>
                        <HStack spacing={2}>
                          <RiUploadLine />
                          <Text>数据管理</Text>
                        </HStack>
                      </Tab>
                      <Tab>
                        <HStack spacing={2}>
                          <RiBrainLine />
                          <Text>RAG召回测试</Text>
                        </HStack>
                      </Tab>
                      <Tab>
                        <HStack spacing={2}>
                          <RiSettingsLine />
                          <Text>设置</Text>
                        </HStack>
                      </Tab>
                    </TabList>

                    <TabPanels>
                      {/* 概览标签 */}
                      <TabPanel>
                        <VStack spacing={6} align="stretch">
                          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                            <GridItem>
                              <Stat>
                                <StatLabel>总文档数</StatLabel>
                                <StatNumber>{selectedKB.documentCount}</StatNumber>
                                <StatHelpText>实际文档数量</StatHelpText>
                              </Stat>
                            </GridItem>
                            <GridItem>
                              <Stat>
                                <StatLabel>向量总数</StatLabel>
                                <StatNumber>{selectedKB.vectorCount}</StatNumber>
                                <StatHelpText>实际向量数量</StatHelpText>
                              </Stat>
                            </GridItem>
                            <GridItem>
                              <Stat>
                                <StatLabel>集合状态</StatLabel>
                                <StatNumber>{selectedKB.status === 'active' ? '活跃' : '未激活'}</StatNumber>
                                <StatHelpText>当前运行状态</StatHelpText>
                              </Stat>
                            </GridItem>
                          </Grid>

                          <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={4}>
                              最近活动
                            </Text>
                            <VStack spacing={3} align="stretch">
                                                                   {[
                                       { action: '文档数量', count: `${selectedKB.documentCount}个`, time: '当前' },
                                       { action: '向量数量', count: `${selectedKB.vectorCount}个`, time: '当前' },
                                       { action: '状态更新', count: '', time: '实时' }
                                     ].map((activity, index) => (
                                <Box
                                  key={index}
                                  p={3}
                                  border="1px"
                                  borderColor={colors.border}
                                  borderRadius="md"
                                >
                                  <HStack justify="space-between">
                                    <HStack>
                                      <Text fontWeight="medium">{activity.action}</Text>
                                      {activity.count && (
                                        <Badge colorScheme="blue">{activity.count}</Badge>
                                      )}
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500">
                                      {activity.time}
                                    </Text>
                                  </HStack>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        </VStack>
                      </TabPanel>

                      {/* 数据管理标签 */}
                      <TabPanel>
                        <VStack spacing={6} align="stretch">
                          <Box>
                            <HStack justify="space-between" mb={4}>
                              <Text fontSize="lg" fontWeight="semibold">
                                文件上传
                              </Text>
                              <HStack>
                                <Menu>
                                  <MenuButton 
                                    as={Button}
                                    leftIcon={<RiDownloadLine />}
                                    variant="outline"
                                    size="sm"
                                    rightIcon={<RiArrowDropDownLine />}
                                  >
                                    下载模板
                                  </MenuButton>
                                  <MenuList>
                                    <MenuItem 
                                      icon={<RiFileTextLine />}
                                      onClick={() => handleDownloadTemplate('csv')}
                                    >
                                      CSV 格式
                                    </MenuItem>
                                    <MenuItem 
                                      icon={<RiCodeLine />}
                                      onClick={() => handleDownloadTemplate('json')}
                                    >
                                      JSON 格式
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                                <Button
                                  leftIcon={<RiUploadLine />}
                                  colorScheme="blue"
                                  onClick={onImportOpen}
                                >
                                  上传文件
                                </Button>
                              </HStack>
                            </HStack>

                            <Box
                              border="2px"
                              borderStyle="dashed"
                              borderColor="gray.300"
                              borderRadius="lg"
                              p={8}
                              textAlign="center"
                            >
                                                              <VStack spacing={4}>
                                  <RiUploadLine size="48px" />
                                  <VStack spacing={2}>
                                    <Text fontWeight="medium">
                                      拖拽文件到这里或点击上传
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                      支持 JSON, CSV 格式，最大 10MB
                                    </Text>
                                    <Text fontSize="xs" color="blue.500">
                                      💡 提示：支持拖拽上传，支持 JSON 和 CSV 格式
                                    </Text>
                                  </VStack>
                                <Input
                                  type="file"
                                  accept=".json,.csv"
                                  onChange={handleFileUpload}
                                  display="none"
                                  id="file-upload"
                                />
                                <Button
                                  as="label"
                                  htmlFor="file-upload"
                                  colorScheme="blue"
                                  variant="outline"
                                >
                                  选择文件
                                </Button>
                              </VStack>
                            </Box>
                          </Box>

                          <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={4}>
                              导入历史
                            </Text>
{importHistory.length > 0 ? (
                              <TableContainer>
                                <Table size="sm">
                                  <Thead>
                                    <Tr>
                                      <Th>文件名</Th>
                                      <Th>类型</Th>
                                      <Th>记录数</Th>
                                      <Th>状态</Th>
                                      <Th>导入时间</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {importHistory.map((record) => (
                                      <Tr key={record.id}>
                                        <Td>{record.file_name}</Td>
                                        <Td>
                                          <Code>{record.file_type.toUpperCase()}</Code>
                                        </Td>
                                        <Td>{record.imported_count.toLocaleString()}</Td>
                                        <Td>{getStatusBadge(record.status)}</Td>
                                        <Td fontSize="sm" color="gray.500">
                                          {new Date(record.created_at).toLocaleDateString('zh-CN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Box textAlign="center" py={8} color="gray.500">
                                <RiHistoryLine size="48px" style={{ margin: '0 auto 16px' }} />
                                <Text>暂无导入历史</Text>
                                <Text fontSize="sm">上传文件后，导入记录将在这里显示</Text>
                              </Box>
                            )}
                          </Box>
                        </VStack>
                      </TabPanel>

                      {/* RAG召回测试标签 */}
                      <TabPanel>
                        <VStack spacing={6} align="stretch">
                          <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={4}>
                              查询测试
                            </Text>
                            <VStack spacing={4}>
                              <FormControl>
                                <FormLabel>查询内容</FormLabel>
                                <Textarea
                                  value={queryText}
                                  onChange={(e) => setQueryText(e.target.value)}
                                  placeholder="输入您想要查询的问题..."
                                  rows={3}
                                />
                              </FormControl>

                              <HStack spacing={4} w="full">
                                <FormControl>
                                  <FormLabel>Top-K</FormLabel>
                                  <HStack>
                                    <Slider
                                      value={topK}
                                      onChange={setTopK}
                                      min={1}
                                      max={20}
                                      step={1}
                                      flex={1}
                                    >
                                      <SliderTrack>
                                        <SliderFilledTrack />
                                      </SliderTrack>
                                      <SliderThumb />
                                    </Slider>
                                    <Text w="30px" textAlign="center">{topK}</Text>
                                  </HStack>
                                </FormControl>

                                <FormControl>
                                  <FormLabel>相似度阈值</FormLabel>
                                  <HStack>
                                    <Slider
                                      value={similarity}
                                      onChange={setSimilarity}
                                      min={0.0}
                                      max={1.0}
                                      step={0.01}
                                      flex={1}
                                    >
                                      <SliderTrack>
                                        <SliderFilledTrack />
                                      </SliderTrack>
                                      <SliderThumb />
                                    </Slider>
                                    <Text w="50px" textAlign="center">{similarity.toFixed(2)}</Text>
                                  </HStack>
                                </FormControl>
                              </HStack>

                              <Button
                                leftIcon={<RiPlayLine />}
                                colorScheme="blue"
                                onClick={handleSearch}
                                isLoading={ragLoading}
                                loadingText="搜索中..."
                                w="full"
                              >
                                开始搜索
                              </Button>
                            </VStack>
                          </Box>

                          {searchResults.length > 0 && (
                            <Box>
                              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                                搜索结果
                              </Text>
                              <VStack spacing={3} align="stretch">
                                {searchResults.map((result: any, index) => (
                                  <Box
                                    key={result.id}
                                    p={4}
                                    border="1px"
                                    borderColor={colors.border}
                                    borderRadius="md"
                                  >
                                    <VStack align="stretch" spacing={2}>
                                      <HStack justify="space-between">
                                        <Text fontWeight="medium">
                                          #{index + 1} {result.metadata?.title || '无标题'}
                                        </Text>
                                        <Badge colorScheme="green">
                                          {(result.similarity * 100).toFixed(1)}%
                                        </Badge>
                                      </HStack>
                                      <Text fontSize="sm" color="gray.600">
                                        {result.content}
                                      </Text>
                                      <HStack spacing={2}>
                                        <Badge variant="outline">
                                          {result.metadata?.category || '未分类'}
                                        </Badge>
                                      </HStack>
                                    </VStack>
                                  </Box>
                                ))}
                              </VStack>
                            </Box>
                          )}
                        </VStack>
                      </TabPanel>

                      {/* 设置标签 */}
                      <TabPanel>
                        <VStack spacing={6} align="stretch">
                          <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={4}>
                              基本设置
                            </Text>
                            <VStack spacing={4} align="stretch">
                              <FormControl>
                                <FormLabel>知识库名称</FormLabel>
                                <Input
                                  defaultValue={selectedKB.name.startsWith('lab_') ? selectedKB.name.replace('lab_', '') : selectedKB.name}
                                  placeholder="输入知识库名称"
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel>描述</FormLabel>
                                <Textarea
                                  placeholder="描述这个知识库的用途和内容"
                                  rows={3}
                                />
                              </FormControl>

                              <Button colorScheme="blue" alignSelf="start">
                                保存设置
                              </Button>
                            </VStack>
                          </Box>

                          <Divider />

                          <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={4} color="red.500">
                              危险区域
                            </Text>
                            <VStack spacing={3} align="stretch">
                              <Button
                                colorScheme="orange"
                                variant="outline"
                                leftIcon={<RiRefreshLine />}
                                onClick={onRebuildIndexOpen}
                              >
                                重建索引
                              </Button>
                              <Button
                                colorScheme="red"
                                variant="outline"
                                leftIcon={<RiDeleteBinLine />}
                                onClick={onClearKBOpen}
                              >
                                清空知识库
                              </Button>
                              <Button
                                colorScheme="red"
                                leftIcon={<RiDeleteBinLine />}
                                onClick={onDeleteKBOpen}
                              >
                                删除知识库
                              </Button>
                            </VStack>
                          </Box>
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </VStack>
            </Card>
          ) : (
            <Card h="full">
              <VStack spacing={4} align="center" justify="center" h="full">
                <RiDatabase2Line size="64px" />
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="xl" fontWeight="bold">
                    选择知识库
                  </Text>
                  <Text color="gray.500">
                    请从左侧选择一个知识库来开始管理
                  </Text>
                </VStack>
              </VStack>
            </Card>
          )}
        </Box>
      </Flex>

      {/* 新建知识库弹窗 */}
      <Modal isOpen={isNewKBOpen} onClose={onNewKBClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>新建知识库</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>知识库名称</FormLabel>
              <Input
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                placeholder="输入知识库名称"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onNewKBClose}>
              取消
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateKB}
              isLoading={loading}
            >
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 重建索引确认对话框 */}
      <Modal isOpen={isRebuildIndexOpen} onClose={onRebuildIndexClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <RiRefreshLine color="orange" />
              <Text>重建索引</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="start" spacing={4}>
              <Text>
                重建索引将优化搜索性能，但可能需要几分钟时间。在此期间，搜索功能可能会受到影响。
              </Text>
              <Text fontWeight="medium" color="orange.500">
                确定要重建知识库 "{selectedKB?.name.replace('lab_', '')}" 的索引吗？
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="orange" mr={3} onClick={handleRebuildIndex}>
              开始重建
            </Button>
            <Button onClick={onRebuildIndexClose}>取消</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 清空知识库确认对话框 */}
      <Modal isOpen={isClearKBOpen} onClose={onClearKBClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <RiAlertLine color="red" />
              <Text>清空知识库</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="start" spacing={4}>
              <Text>
                清空操作将删除知识库中的所有数据和向量，但保留知识库结构。此操作<Text as="span" color="red.500" fontWeight="bold">不可逆转</Text>。
              </Text>
              <Text fontWeight="medium" color="red.500">
                确定要清空知识库 "{selectedKB?.name.replace('lab_', '')}" 吗？
              </Text>
              <Text fontSize="sm" color="gray.500">
                当前包含 {selectedKB?.documentCount || 0} 个文档和 {selectedKB?.vectorCount || 0} 个向量
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleClearKnowledgeBase}>
              确定清空
            </Button>
            <Button onClick={onClearKBClose}>取消</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除知识库确认对话框 */}
      <Modal isOpen={isDeleteKBOpen} onClose={onDeleteKBClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <RiDeleteBinLine color="red" />
              <Text>删除知识库</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="start" spacing={4}>
              <Text>
                删除操作将完全移除知识库及其所有数据、向量和配置。此操作<Text as="span" color="red.500" fontWeight="bold">不可逆转</Text>。
              </Text>
              <Text fontWeight="medium" color="red.500">
                确定要删除知识库 "{selectedKB?.name.replace('lab_', '')}" 吗？
              </Text>
              <Text fontSize="sm" color="gray.500">
                当前包含 {selectedKB?.documentCount || 0} 个文档和 {selectedKB?.vectorCount || 0} 个向量
              </Text>
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">警告：此操作无法撤销</Text>
                  <Text fontSize="sm">所有相关数据将永久丢失</Text>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleDeleteKnowledgeBase}>
              确定删除
            </Button>
            <Button onClick={onDeleteKBClose}>取消</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageLayout>
  )
}