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
  SimpleGrid,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useStrategy } from '@/hooks/useStrategy'
import type { Strategy, StrategyStats } from '@/hooks/useStrategy'
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
  RiBookLine,
  RiLightbulbLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

export default function StrategyLibraryPage() {
  const titleColor = useColorModeValue('gray.800', 'white')
  const colors = {
    bg: useColorModeValue('gray.50', 'gray.800'),
    border: useColorModeValue('gray.200', 'gray.600'),
    text: useColorModeValue('gray.600', 'gray.300'),
  }

  // Hook状态
  const {
    strategies,
    stats,
    pagination,
    loading,
    error,
    fetchStrategies,
    fetchStats,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    vectorizeStrategies,
    ragQuery,
  } = useStrategy()

  // UI状态
  const [activeTab, setActiveTab] = useState(0)
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Modal状态
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const [deleting, setDeleting] = useState(false)
  
  // 表单状态
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({})
  
  // RAG状态
  const [queryText, setQueryText] = useState('')
  const [topK, setTopK] = useState(5)
  const [similarity, setSimilarity] = useState(0.5)
  const [ragResults, setRagResults] = useState<any[]>([])
  const [ragLoading, setRagLoading] = useState(false)
  
  // 向量化状态
  const [vectorizing, setVectorizing] = useState(false)

  const toast = useToast()

  // 获取状态指示器颜色和文本
  const getStatusIndicator = (status: Strategy['vector_status']) => {
    switch (status) {
      case 'success':
        return { color: 'green', text: '已向量化', icon: '●' }
      case 'failed':
        return { color: 'red', text: '向量化失败', icon: '●' }
      case 'pending':
      default:
        return { color: 'yellow', text: '待向量化', icon: '●' }
    }
  }

  // 表单验证
  const validateForm = () => {
    const errors: { title?: string; content?: string } = {}
    
    if (!formTitle.trim()) {
      errors.title = '标题不能为空'
    }
    
    if (!formContent.trim()) {
      errors.content = '内容不能为空'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 重置表单
  const resetForm = () => {
    setFormTitle('')
    setFormContent('')
    setFormErrors({})
    setSelectedStrategy(null)
    setIsCreating(false)
  }

  // 打开新增Modal
  const handleCreate = () => {
    resetForm()
    setIsCreating(true)
    onModalOpen()
  }

  // 打开编辑Modal
  const handleEdit = (strategy: Strategy) => {
    setSelectedStrategy(strategy)
    setFormTitle(strategy.title)
    setFormContent(strategy.content)
    setFormErrors({})
    setIsCreating(false)
    onModalOpen()
  }

  // 提交表单
  const handleSubmit = async () => {
    if (submitting) return
    if (!validateForm()) return
    
    try {
      setSubmitting(true)
      // 提交开始后立即关闭弹窗，防止重复点击
      onModalClose()
      if (isCreating) {
        await createStrategy(formTitle.trim(), formContent.trim())
      } else if (selectedStrategy) {
        await updateStrategy(selectedStrategy.id, formTitle.trim(), formContent.trim())
      }
      
      resetForm()
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // 确认删除
  const handleDeleteConfirm = (strategy: Strategy) => {
    setSelectedStrategy(strategy)
    onDeleteOpen()
  }

  // 执行删除
  const handleDelete = async () => {
    if (deleting) return
    if (!selectedStrategy) return
    
    try {
      setDeleting(true)
      // 点击确认后先关闭弹窗，防止重复点击
      onDeleteClose()
      await deleteStrategy(selectedStrategy.id)
      setSelectedStrategy(null)
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setDeleting(false)
    }
  }

  // 开始向量化
  const handleVectorize = async () => {
    if (vectorizing) return
    setVectorizing(true)
    try {
      await vectorizeStrategies()
    } finally {
      setVectorizing(false)
    }
  }

  // RAG查询
  const handleRagQuery = async () => {
    if (ragLoading) return
    if (!queryText.trim()) {
      toast({
        title: '查询内容不能为空',
        status: 'warning',
        duration: 3000,
      })
      return
    }
    
    setRagLoading(true)
    try {
      const result = await ragQuery(queryText, topK, similarity)
      if (result) {
        setRagResults(result.results)
      }
    } finally {
      setRagLoading(false)
    }
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    fetchStrategies(page, pagination.limit)
  }

  return (
    <PageLayout>
      <VStack spacing={8} align="stretch">
        {/* 页面标题 */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <VStack align="start" spacing={2}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color={titleColor}
              bgGradient="linear(to-r, primary.400, purple.400)"
              bgClip="text"
            >
              📚 策略库
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理和向量化您的策略知识，支持智能召回测试
            </Text>
          </VStack>
        </MotionBox>

        {/* 主要内容 */}
        <Card>
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <RiBarChartLine />
                  <Text>概览</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <RiSearchLine />
                  <Text>RAG召回测试</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* 概览Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {/* 统计数据 */}
                  <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={4}>
                      策略统计
                    </Text>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      <Stat>
                        <StatLabel>总策略数</StatLabel>
                        <StatNumber color="blue.500">
                          {stats?.total || 0}
                        </StatNumber>
                        <StatHelpText>全部策略</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>向量成功数</StatLabel>
                        <StatNumber color="green.500">
                          {stats?.vectorized || 0}
                        </StatNumber>
                        <StatHelpText>已向量化</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>未向量化数</StatLabel>
                        <StatNumber color="yellow.500">
                          {stats?.pending || 0}
                        </StatNumber>
                        <StatHelpText>待处理</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>向量失败数</StatLabel>
                        <StatNumber color="red.500">
                          {stats?.failed || 0}
                        </StatNumber>
                        <StatHelpText>需重试</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </Box>

                  <Divider />

                  {/* 操作栏 */}
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Button
                        leftIcon={<RiAddLine />}
                        colorScheme="blue"
                        onClick={handleCreate}
                      >
                        新增策略
                      </Button>
                      <Button
                        leftIcon={<RiRefreshLine />}
                        variant="outline"
                        onClick={() => {
                          fetchStrategies(pagination.page, pagination.limit)
                          fetchStats()
                        }}
                        isLoading={loading}
                      >
                        刷新
                      </Button>
                    </HStack>
                    
                    <Button
                      leftIcon={<RiLightbulbLine />}
                      colorScheme="orange"
                      isLoading={vectorizing}
                      loadingText="向量化中..."
                      onClick={handleVectorize}
                      isDisabled={(stats?.pending || 0) + (stats?.failed || 0) === 0}
                    >
                      开始向量化 ({(stats?.pending || 0) + (stats?.failed || 0)})
                    </Button>
                  </HStack>

                  {/* 策略列表 */}
                  <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={4}>
                      策略列表
                    </Text>
                    
                    {loading && strategies.length === 0 ? (
                      <VStack spacing={3}>
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} height="60px" />
                        ))}
                      </VStack>
                    ) : strategies.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {strategies.map((strategy) => {
                          const status = getStatusIndicator(strategy.vector_status)
                          return (
                            <Box
                              key={strategy.id}
                              p={4}
                              border="1px"
                              borderColor={colors.border}
                              borderRadius="md"
                              _hover={{ 
                                bg: colors.bg,
                                transform: 'translateY(-1px)',
                                shadow: 'sm'
                              }}
                              transition="all 0.2s"
                            >
                              <HStack justify="space-between" align="start">
                                <VStack align="start" flex={1} spacing={1}>
                                  <HStack spacing={2} align="center">
                                    <Text
                                      fontWeight="medium"
                                      fontSize="md"
                                      noOfLines={1}
                                    >
                                      {strategy.title}
                                    </Text>
                                    <Text
                                      color={`${status.color}.500`}
                                      fontSize="lg"
                                      lineHeight="1"
                                    >
                                      {status.icon}
                                    </Text>
                                  </HStack>
                                  <Text
                                    fontSize="sm"
                                    color={colors.text}
                                    noOfLines={2}
                                  >
                                    {strategy.content}
                                  </Text>
                                  <HStack spacing={4}>
                                    <Text fontSize="xs" color="gray.500">
                                      创建时间: {new Date(strategy.created_at).toLocaleString('zh-CN')}
                                    </Text>
                                    <Badge
                                      colorScheme={status.color}
                                      variant="subtle"
                                    >
                                      {status.text}
                                    </Badge>
                                  </HStack>
                                </VStack>
                                
                                <HStack spacing={1}>
                                  <IconButton
                                    aria-label="编辑策略"
                                    icon={<RiEditLine />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(strategy)}
                                  />
                                  <IconButton
                                    aria-label="删除策略"
                                    icon={<RiDeleteBinLine />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleDeleteConfirm(strategy)}
                                  />
                                </HStack>
                              </HStack>
                            </Box>
                          )
                        })}
                      </VStack>
                    ) : (
                      <Center py={12}>
                        <VStack spacing={4} textAlign="center">
                          <RiBookLine size="48px" color="gray" />
                          <VStack spacing={2}>
                            <Text fontSize="lg" fontWeight="medium">
                              暂无策略
                            </Text>
                            <Text color="gray.500">
                              点击"新增策略"开始创建您的第一个策略
                            </Text>
                          </VStack>
                          <Button
                            leftIcon={<RiAddLine />}
                            colorScheme="blue"
                            onClick={handleCreate}
                          >
                            新增策略
                          </Button>
                        </VStack>
                      </Center>
                    )}

                    {/* 分页 */}
                    {pagination.totalPages > 1 && (
                      <HStack justify="center" mt={6} spacing={2}>
                        <Button
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          isDisabled={pagination.page <= 1}
                        >
                          上一页
                        </Button>
                        {[...Array(pagination.totalPages)].map((_, i) => (
                          <Button
                            key={i}
                            size="sm"
                            variant={pagination.page === i + 1 ? 'solid' : 'ghost'}
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          isDisabled={pagination.page >= pagination.totalPages}
                        >
                          下一页
                        </Button>
                      </HStack>
                    )}
                  </Box>
                </VStack>
              </TabPanel>

              {/* RAG召回测试Tab */}
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
                        onClick={handleRagQuery}
                        isLoading={ragLoading}
                        loadingText="查询中..."
                        w="full"
                      >
                        开始查询
                      </Button>
                    </VStack>
                  </Box>

                  {/* RAG查询结果 */}
                  {ragResults.length > 0 && (
                    <Box>
                      <Text fontSize="lg" fontWeight="semibold" mb={4}>
                        查询结果
                      </Text>
                      <VStack spacing={3} align="stretch">
                        {ragResults.map((result: any, index) => (
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
                                  #{index + 1} {result.title}
                                </Text>
                                <Badge colorScheme="green">
                                  {(result.similarity * 100).toFixed(1)}%
                                </Badge>
                              </HStack>
                              <Text fontSize="sm" color="gray.600">
                                {result.content}
                              </Text>
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Card>

        {/* 策略Modal */}
        <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <RiLightbulbLine color="blue" />
                <Text>{isCreating ? '新增策略' : '编辑策略'}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!formErrors.title}>
                  <FormLabel>策略标题</FormLabel>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="请输入策略标题..."
                  />
                  {formErrors.title && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {formErrors.title}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!formErrors.content}>
                  <FormLabel>策略内容</FormLabel>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="请输入策略详细内容..."
                    rows={8}
                  />
                  {formErrors.content && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {formErrors.content}
                    </Text>
                  )}
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleSubmit} isLoading={submitting} isDisabled={submitting}>
                {isCreating ? '创建' : '更新'}
              </Button>
              <Button onClick={onModalClose}>取消</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 删除确认Modal */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <RiDeleteBinLine color="red" />
                <Text>确认删除</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack align="start" spacing={4}>
                <Text>
                  确定要删除策略 <Text as="span" fontWeight="bold" color="red.500">"{selectedStrategy?.title}"</Text> 吗？
                </Text>
                <Text fontSize="sm" color="gray.500">
                  删除后将无法恢复，包括相关的向量数据。
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="red" mr={3} onClick={handleDelete}>
                确认删除
              </Button>
              <Button onClick={onDeleteClose}>取消</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </PageLayout>
  )
}