'use client'

import {
  Box,
  Button,
  HStack,
  VStack,
  Input,
  FormControl,
  FormLabel,
  Text,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  Badge,
  IconButton,
  Tooltip,
  Flex,
  Spacer,
  ButtonGroup,
  Card,
  CardBody,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Textarea,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  RiSearchLine,
  RiDownloadLine,
  RiRefreshLine,
  RiEyeLine,
  RiFileExcel2Line,
  RiCalendarLine,
  RiUserLine,
  RiMessage3Line,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'

const MotionBox = motion(Box)

interface MessageQueryResult {
  id: string
  title: string
  user_id: string
  conversation_id?: string
  created_at: string
  updated_at: string
  user_background?: any
  config?: any
  chat_messages?: {
    id: string
    content: string
    created_at: string
  }[]
}

export default function MessageQueryPage() {
  const [queryForm, setQueryForm] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    conversationId: ''
  })
  const [results, setResults] = useState<MessageQueryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<MessageQueryResult | null>(null)
  const toast = useToast()
  
  const { isOpen, onOpen, onClose } = useDisclosure()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const handleQuery = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (queryForm.startDate) params.append('startDate', queryForm.startDate)
      if (queryForm.endDate) params.append('endDate', queryForm.endDate)
      if (queryForm.userId) params.append('userId', queryForm.userId.trim())
      if (queryForm.conversationId) params.append('conversationId', queryForm.conversationId.trim())

      const response = await fetch(`/api/message-query?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data || [])
        toast({
          title: '查询成功',
          description: `共找到 ${data.data?.length || 0} 条记录`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        throw new Error(data.error || '查询失败')
      }
    } catch (error) {
      console.error('查询失败:', error)
      toast({
        title: '查询失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleExportToExcel = () => {
    if (results.length === 0) {
      toast({
        title: '无数据可导出',
        description: '请先执行查询获取数据',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 准备导出数据
    const exportData = results.map(item => ({
      '项目ID': item.id,
      '标题': item.title,
      '用户ID': item.user_id,
      '会话ID': item.id, // 会话ID就是项目ID
      '创建时间': new Date(item.created_at).toLocaleString('zh-CN'),
      '更新时间': new Date(item.updated_at).toLocaleString('zh-CN'),
      '用户背景': item.user_background ? JSON.stringify(item.user_background) : '',
      '配置信息': item.config ? JSON.stringify(item.config) : '',
      '聊天消息数量': item.chat_messages?.length || 0
    }))

    // 创建CSV内容
    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
      )
    ].join('\n')

    // 下载文件
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `用户消息查询结果_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: '导出成功',
      description: '文件已开始下载',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleViewDetails = (item: MessageQueryResult) => {
    setSelectedMessage(item)
    onOpen()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const clearForm = () => {
    setQueryForm({
      startDate: '',
      endDate: '',
      userId: '',
      conversationId: ''
    })
    setResults([])
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
              💬 用户消息查询
            </Text>
            <Text color="gray.500" fontSize="lg">
              查询用户的项目和消息记录，支持按时间、用户ID、会话ID筛选
            </Text>
          </VStack>
        </MotionBox>

        {/* 查询表单 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold" mb={2}>查询条件</Text>
                
                <HStack spacing={4} align="end" flexWrap="wrap">
                  <FormControl maxW="200px">
                    <FormLabel>开始日期</FormLabel>
                    <Input
                      type="date"
                      value={queryForm.startDate}
                      onChange={(e) => setQueryForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl maxW="200px">
                    <FormLabel>结束日期</FormLabel>
                    <Input
                      type="date"
                      value={queryForm.endDate}
                      onChange={(e) => setQueryForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl maxW="300px">
                    <FormLabel>用户ID</FormLabel>
                    <Input
                      placeholder="输入用户ID"
                      value={queryForm.userId}
                      onChange={(e) => setQueryForm(prev => ({ ...prev, userId: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl maxW="300px">
                    <FormLabel>会话ID</FormLabel>
                    <Input
                      placeholder="输入会话ID（项目ID）"
                      value={queryForm.conversationId}
                      onChange={(e) => setQueryForm(prev => ({ ...prev, conversationId: e.target.value }))}
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={3}>
                  <Button
                    leftIcon={<RiSearchLine />}
                    colorScheme="primary"
                    onClick={handleQuery}
                    isLoading={loading}
                  >
                    查询
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={clearForm}
                  >
                    清空
                  </Button>

                  <Spacer />

                  <ButtonGroup size="sm">
                    <Tooltip label="刷新数据">
                      <IconButton
                        icon={<RiRefreshLine />}
                        aria-label="刷新"
                        variant="ghost"
                        onClick={handleQuery}
                        isLoading={loading}
                      />
                    </Tooltip>
                    <Tooltip label="导出Excel">
                      <IconButton
                        icon={<RiFileExcel2Line />}
                        aria-label="导出Excel"
                        variant="ghost"
                        onClick={handleExportToExcel}
                        isDisabled={results.length === 0}
                      />
                    </Tooltip>
                  </ButtonGroup>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>

        {/* 查询结果 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Flex align="center">
                  <Text fontSize="lg" fontWeight="semibold">
                    查询结果 {results.length > 0 && `(${results.length} 条记录)`}
                  </Text>
                </Flex>

                {loading ? (
                  <VStack spacing={3}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} height="60px" />
                    ))}
                  </VStack>
                ) : results.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    暂无数据，请设置查询条件后点击查询
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>项目标题</Th>
                          <Th>用户ID</Th>
                          <Th>会话ID</Th>
                          <Th>创建时间</Th>
                          <Th>更新时间</Th>
                          <Th>操作</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {results.map((item) => (
                          <Tr key={item.id}>
                            <Td maxW="200px">
                              <Text isTruncated title={item.title}>
                                {item.title}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme="blue" fontSize="xs">
                                {item.user_id.slice(0, 8)}...
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme="green" fontSize="xs">
                                {item.id.slice(0, 8)}...
                              </Badge>
                            </Td>
                            <Td fontSize="sm">{formatDate(item.created_at)}</Td>
                            <Td fontSize="sm">{formatDate(item.updated_at)}</Td>
                            <Td>
                              <Tooltip label="查看详情">
                                <IconButton
                                  icon={<RiEyeLine />}
                                  size="sm"
                                  variant="ghost"
                                  aria-label="查看详情"
                                  onClick={() => handleViewDetails(item)}
                                />
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>
      </VStack>

      {/* 详情模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>消息详情</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedMessage && (
              <VStack spacing={6} align="stretch">
                {/* 基本信息 */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>基本信息</Text>
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Text fontWeight="medium" minW="100px">项目标题:</Text>
                      <Text>{selectedMessage.title}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium" minW="100px">项目ID:</Text>
                      <Badge colorScheme="blue">{selectedMessage.id}</Badge>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium" minW="100px">用户ID:</Text>
                      <Badge colorScheme="purple">{selectedMessage.user_id}</Badge>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium" minW="100px">会话ID:</Text>
                      <Badge colorScheme="green">{selectedMessage.id}</Badge>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium" minW="100px">创建时间:</Text>
                      <Text>{formatDate(selectedMessage.created_at)}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium" minW="100px">更新时间:</Text>
                      <Text>{formatDate(selectedMessage.updated_at)}</Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* 用户背景 */}
                {selectedMessage.user_background && (
                  <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={3}>用户背景</Text>
                    <Textarea
                      value={JSON.stringify(selectedMessage.user_background, null, 2)}
                      readOnly
                      height="120px"
                      fontSize="sm"
                      fontFamily="mono"
                      bg={useColorModeValue('gray.50', 'gray.700')}
                    />
                  </Box>
                )}

                {/* 配置信息 */}
                {selectedMessage.config && (
                  <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={3}>配置信息</Text>
                    <Textarea
                      value={JSON.stringify(selectedMessage.config, null, 2)}
                      readOnly
                      height="120px"
                      fontSize="sm"
                      fontFamily="mono"
                      bg={useColorModeValue('gray.50', 'gray.700')}
                    />
                  </Box>
                )}

                {/* 聊天消息 */}
                {selectedMessage.chat_messages && selectedMessage.chat_messages.length > 0 && (
                  <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={3}>
                      聊天消息 ({selectedMessage.chat_messages.length} 条)
                    </Text>
                    <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                      {selectedMessage.chat_messages.map((msg, index) => (
                        <Box
                          key={msg.id}
                          p={3}
                          bg={useColorModeValue('gray.50', 'gray.700')}
                          borderRadius="md"
                          borderLeft="3px solid"
                          borderLeftColor="primary.500"
                        >
                          <HStack justify="space-between" mb={2}>
                            <Badge colorScheme="gray" fontSize="xs">
                              消息 #{index + 1}
                            </Badge>
                            <Text fontSize="xs" color="gray.500">
                              {formatDate(msg.created_at)}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" whiteSpace="pre-wrap">
                            {msg.content}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </PageLayout>
  )
}
