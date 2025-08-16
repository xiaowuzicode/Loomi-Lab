'use client'

import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  useColorModeValue,
  Badge,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
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
  Code,
  Divider,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useMilvus, useDocumentProcessor } from '@/hooks/useMilvus'
import type { KnowledgeBase } from '@/types'
import {
  RiSearchLine,
  RiBrainLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiAddLine,
  RiUploadLine,
  RiPlayLine,
  RiFileTextLine,
  RiDatabase2Line,
  RiTestTubeLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'

const MotionBox = motion(Box)

interface RAGResult {
  text: string
  score: number
  source: string
  metadata?: any
}

export default function KnowledgeBasePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null)
  const [ragQuery, setRagQuery] = useState('')
  const [ragResults, setRagResults] = useState<RAGResult[]>([])
  const [ragLoading, setRagLoading] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isRAGOpen,
    onOpen: onRAGOpen,
    onClose: onRAGClose,
  } = useDisclosure()
  const toast = useToast()

  // 使用 Milvus Hook
  const {
    knowledgeBases,
    loading,
    error,
    fetchKnowledgeBases,
    checkHealth,
    createKnowledgeBase,
    addDocument,
    ragQuery: performRAGQuery,
    deleteKnowledgeBase,
  } = useMilvus()

  // 使用文档处理 Hook
  const { processing, processFile } = useDocumentProcessor()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      // 检查 Milvus 连接状态
      const healthStatus = await checkHealth()
      if (healthStatus?.connected) {
        // 获取知识库列表
        await fetchKnowledgeBases()
      } else {
        console.warn('Milvus 连接失败，使用模拟数据')
        // 可以在这里设置模拟数据作为回退
      }
    }

    initializeData()
  }, [])

  // 过滤知识库
  const filteredKBs = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateKB = () => {
    setSelectedKB(null)
    onOpen()
  }

  const handleEditKB = (kb: any) => {
    setSelectedKB(kb)
    onOpen()
  }

  const handleDeleteKB = async (kbName: string) => {
    const success = await deleteKnowledgeBase(kbName)
    if (success) {
      // 刷新列表
      await fetchKnowledgeBases()
    }
  }

  const handleRAGTest = async () => {
    if (!ragQuery.trim() || !selectedCollection) {
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
      const result = await performRAGQuery(selectedCollection, ragQuery, 3, 0.5)
      
      if (result) {
        const mockResults: RAGResult[] = result.sources.map(source => ({
          text: source.text,
          score: source.score,
          source: source.source,
          metadata: source.metadata
        }))
        
        setRagResults(mockResults)
        
        toast({
          title: 'RAG 查询成功',
          description: `找到 ${mockResults.length} 个相关文档`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('RAG 查询失败:', error)
    }
    
    setRagLoading(false)
  }

  // 文件上传处理
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !selectedCollection) return
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const content = await processFile(file)
      
      if (content) {
        await addDocument(selectedCollection, content, file.name, {
          file_type: file.type,
          file_size: file.size,
          upload_time: new Date().toISOString(),
        })
      }
    }
    
    // 刷新知识库列表
    await fetchKnowledgeBases()
  }

  const getStatusBadge = (status: KnowledgeBase['status']) => {
    const statusConfig = {
      active: { color: 'green', label: '运行中' },
      inactive: { color: 'gray', label: '未激活' },
      building: { color: 'yellow', label: '构建中' },
      error: { color: 'red', label: '错误' },
    }
    
    const config = statusConfig[status]
    return (
      <Badge colorScheme={config.color} variant="subtle">
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num)
  }

  return (
    <PageLayout>
      <VStack spacing={6} align="stretch">
        {/* 页面标题 */}
        <MotionBox
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VStack align="start" spacing={2}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              bgGradient="linear(to-r, primary.400, purple.400)"
              bgClip="text"
            >
              🧠 知识库管理
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理 AI 向量知识库，测试 RAG 召回效果
            </Text>
          </VStack>
        </MotionBox>

        {/* 统计卡片 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <HStack spacing={6} flexWrap="wrap">
            <StatCard
              title="知识库总数"
              value={knowledgeBases.length}
              icon={RiDatabase2Line}
              iconColor="blue.400"
              loading={loading}
            />
            <StatCard
              title="活跃知识库"
              value={knowledgeBases.filter(kb => kb.status === 'active').length}
              icon={RiBrainLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="总文档数"
              value={knowledgeBases.reduce((sum, kb) => sum + kb.documentCount, 0)}
              icon={RiFileTextLine}
              iconColor="purple.400"
              loading={loading}
            />
            <StatCard
              title="总向量数"
              value={knowledgeBases.reduce((sum, kb) => sum + kb.vectorCount, 0)}
              icon={RiTestTubeLine}
              iconColor="orange.400"
              loading={loading}
            />
          </HStack>
        </MotionBox>

        <Tabs variant="enclosed" colorScheme="primary">
          <TabList>
            <Tab>知识库管理</Tab>
            <Tab>RAG 召回测试</Tab>
          </TabList>

          <TabPanels>
            {/* 知识库管理面板 */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6} align="stretch">
                {/* 搜索和操作 */}
                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <HStack spacing={4} flexWrap="wrap">
                      <InputGroup maxW="400px">
                        <InputLeftElement>
                          <RiSearchLine color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="搜索知识库名称或描述..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>

                      <Button
                        leftIcon={<RiAddLine />}
                        onClick={handleCreateKB}
                        colorScheme="primary"
                      >
                        新建知识库
                      </Button>

                      <Button
                        leftIcon={<RiTestTubeLine />}
                        onClick={onRAGOpen}
                        variant="outline"
                      >
                        RAG 测试
                      </Button>
                    </HStack>
                  </Card>
                </MotionBox>

                {/* 知识库列表 */}
                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {loading ? (
                    <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} height="200px" borderRadius="xl" />
                      ))}
                    </Grid>
                  ) : filteredKBs.length === 0 ? (
                    <Card>
                      <Alert status="info">
                        <AlertIcon />
                        没有找到符合条件的知识库
                      </Alert>
                    </Card>
                  ) : (
                    <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                      {filteredKBs.map((kb) => (
                        <MotionBox
                          key={kb.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card hover>
                            <VStack align="start" spacing={4}>
                              <Flex justify="space-between" w="full" align="start">
                                <VStack align="start" spacing={2} flex={1}>
                                  <HStack>
                                    <Text fontWeight="bold" fontSize="lg">
                                      {kb.name}
                                    </Text>
                                    {getStatusBadge(kb.status)}
                                  </HStack>
                                  <Text color="gray.500" fontSize="sm" noOfLines={2}>
                                    {kb.description}
                                  </Text>
                                </VStack>

                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<RiMoreLine />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem
                                      icon={<RiEditLine />}
                                      onClick={() => handleEditKB(kb)}
                                    >
                                      编辑知识库
                                    </MenuItem>
                                    <MenuItem
                                      icon={<RiUploadLine />}
                                    >
                                      上传文档
                                    </MenuItem>
                                    <MenuItem
                                      icon={<RiDeleteBinLine />}
                                      color="red.500"
                                      onClick={() => handleDeleteKB(kb.id)}
                                    >
                                      删除知识库
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Flex>

                              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="xs" color="gray.400">文档数量</Text>
                                  <Text fontWeight="semibold" color="blue.500">
                                    {formatNumber(kb.documentCount)}
                                  </Text>
                                </VStack>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="xs" color="gray.400">向量数量</Text>
                                  <Text fontWeight="semibold" color="purple.500">
                                    {formatNumber(kb.vectorCount)}
                                  </Text>
                                </VStack>
                              </Grid>

                              {kb.status === 'building' && (
                                <Box w="full">
                                  <Text fontSize="xs" color="gray.400" mb={2}>构建进度</Text>
                                  <Progress value={65} colorScheme="yellow" size="sm" />
                                </Box>
                              )}

                              <Text fontSize="xs" color="gray.400">
                                更新时间: {formatDate(kb.updatedAt.toString())}
                              </Text>
                            </VStack>
                          </Card>
                        </MotionBox>
                      ))}
                    </Grid>
                  )}
                </MotionBox>
              </VStack>
            </TabPanel>

            {/* RAG 测试面板 */}
            <TabPanel p={0} pt={6}>
              <MotionBox
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Grid templateColumns="1fr 1fr" gap={6}>
                  {/* 查询输入 */}
                  <GridItem>
                    <Card>
                      <VStack align="stretch" spacing={4}>
                        <Text fontSize="lg" fontWeight="semibold">
                          RAG 召回测试
                        </Text>
                        <FormControl>
                          <FormLabel>测试查询</FormLabel>
                          <Textarea
                            placeholder="请输入要测试的问题或查询内容..."
                            value={ragQuery}
                            onChange={(e) => setRagQuery(e.target.value)}
                            rows={4}
                          />
                        </FormControl>
                        <Button
                          leftIcon={<RiPlayLine />}
                          onClick={handleRAGTest}
                          isLoading={ragLoading}
                          loadingText="查询中..."
                          colorScheme="primary"
                          isDisabled={!ragQuery.trim()}
                        >
                          开始测试
                        </Button>
                      </VStack>
                    </Card>
                  </GridItem>

                  {/* 召回结果 */}
                  <GridItem>
                    <Card>
                      <VStack align="stretch" spacing={4}>
                        <Text fontSize="lg" fontWeight="semibold">
                          召回结果
                        </Text>
                        {ragLoading ? (
                          <VStack spacing={3}>
                            {[1, 2, 3].map(i => (
                              <Skeleton key={i} height="100px" borderRadius="md" />
                            ))}
                          </VStack>
                        ) : ragResults.length === 0 ? (
                          <Alert status="info">
                            <AlertIcon />
                            请输入查询内容并点击测试按钮
                          </Alert>
                        ) : (
                          <VStack spacing={4} align="stretch">
                            {ragResults.map((result, index) => (
                              <Box
                                key={index}
                                p={4}
                                borderWidth="1px"
                                borderColor={borderColor}
                                borderRadius="lg"
                                bg={bgColor}
                              >
                                <VStack align="stretch" spacing={3}>
                                  <Flex justify="space-between" align="center">
                                    <Badge colorScheme="green" variant="subtle">
                                      相似度: {(result.score * 100).toFixed(1)}%
                                    </Badge>
                                    <Text fontSize="xs" color="gray.400">
                                      来源: {result.source}
                                    </Text>
                                  </Flex>
                                  <Text fontSize="sm" lineHeight="1.6">
                                    {result.text}
                                  </Text>
                                  {result.metadata && (
                                    <>
                                      <Divider />
                                      <Code fontSize="xs" p={2}>
                                        {JSON.stringify(result.metadata, null, 2)}
                                      </Code>
                                    </>
                                  )}
                                </VStack>
                              </Box>
                            ))}
                          </VStack>
                        )}
                      </VStack>
                    </Card>
                  </GridItem>
                </Grid>
              </MotionBox>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* 创建/编辑知识库模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedKB ? '编辑知识库' : '新建知识库'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>知识库名称</FormLabel>
                <Input 
                  placeholder="请输入知识库名称"
                  defaultValue={selectedKB?.name || ''}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>描述</FormLabel>
                <Textarea 
                  placeholder="请输入知识库描述"
                  defaultValue={selectedKB?.description || ''}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button colorScheme="primary" onClick={() => {
              toast({
                title: selectedKB ? '知识库已更新' : '知识库已创建',
                status: 'success',
                duration: 3000,
                isClosable: true,
              })
              onClose()
            }}>
              {selectedKB ? '保存' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* RAG 测试模态框 */}
      <Modal isOpen={isRAGOpen} onClose={onRAGClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>RAG 召回测试</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <Grid templateColumns="1fr 1fr" gap={6}>
              {/* 查询部分 */}
              <GridItem>
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="md" fontWeight="semibold">查询输入</Text>
                  <Textarea
                    placeholder="请输入要测试的问题或查询内容..."
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    rows={6}
                  />
                  <Button
                    leftIcon={<RiPlayLine />}
                    onClick={handleRAGTest}
                    isLoading={ragLoading}
                    loadingText="查询中..."
                    colorScheme="primary"
                    isDisabled={!ragQuery.trim()}
                  >
                    开始测试
                  </Button>
                </VStack>
              </GridItem>

              {/* 结果部分 */}
              <GridItem>
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="md" fontWeight="semibold">召回结果</Text>
                  <Box maxH="400px" overflowY="auto">
                    {ragLoading ? (
                      <VStack spacing={3}>
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} height="100px" borderRadius="md" />
                        ))}
                      </VStack>
                    ) : ragResults.length === 0 ? (
                      <Alert status="info">
                        <AlertIcon />
                        请输入查询内容并点击测试按钮
                      </Alert>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {ragResults.map((result, index) => (
                          <Box
                            key={index}
                            p={3}
                            borderWidth="1px"
                            borderColor={borderColor}
                            borderRadius="md"
                            bg={bgColor}
                          >
                            <VStack align="stretch" spacing={2}>
                              <Flex justify="space-between" align="center">
                                <Badge colorScheme="green" size="sm">
                                  {(result.score * 100).toFixed(1)}%
                                </Badge>
                                <Text fontSize="xs" color="gray.400">
                                  {result.source}
                                </Text>
                              </Flex>
                              <Text fontSize="sm" lineHeight="1.5">
                                {result.text}
                              </Text>
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onRAGClose}>关闭</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageLayout>
  )
}
