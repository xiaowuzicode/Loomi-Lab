'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  useToast,
  Badge,
  Tag,
  TagLabel,
  TagRightIcon,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import {
  RiSearchLine,
  RiRefreshLine,
  RiCalendar2Line,
  RiTimeLine,
  RiInformationLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'

interface UserMemoryItem {
  id: string
  memory_name: string
  level: 'user' | 'project' | null
  updated_at: string
}

interface UserMemoryListResponse {
  items: UserMemoryItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface UserMemoryDetail extends UserMemoryItem {
  user_id: string
  memory: Record<string, any> | null
  created_at: string
}

type LevelFilter = 'all' | 'user' | 'project'

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'yyyy-MM-dd HH:mm')
}

const isPlainObject = (value: unknown): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export default function UserMemoryPage() {
  const toast = useToast()
  const [userIdInput, setUserIdInput] = useState('')
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [page, setPage] = useState(1)
  const [listData, setListData] = useState<UserMemoryListResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserMemoryDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const leftCardBg = useColorModeValue('white', 'gray.900')
  const listItemActiveBg = useColorModeValue('blue.50', 'blue.900')
  const listItemBorder = useColorModeValue('gray.200', 'gray.700')
  const emptyColor = useColorModeValue('gray.500', 'gray.400')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const fetchList = useCallback(async () => {
    if (!loadedUserId) return

    setListLoading(true)
    setListError(null)

    try {
      const params = new URLSearchParams({
        userId: loadedUserId,
        page: String(page),
        limit: String(listData.limit),
      })

      if (levelFilter !== 'all') {
        params.set('level', levelFilter)
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }

      const response = await fetch(`/api/user-memory?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '获取用户记忆失败')
      }

      const data: UserMemoryListResponse = result.data
      setListData(data)

      if (data.items.length === 0) {
        setSelectedId(null)
        setDetail(null)
      } else if (!selectedId || !data.items.some((item) => item.id === selectedId)) {
        setSelectedId(data.items[0].id)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取用户记忆失败'
      setListError(message)
      toast({
        title: '加载失败',
        description: message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setListLoading(false)
    }
  }, [debouncedSearch, levelFilter, listData.limit, loadedUserId, page, selectedId, toast])

  const fetchDetail = useCallback(async () => {
    if (!loadedUserId || !selectedId) {
      setDetail(null)
      return
    }

    setDetailLoading(true)
    setDetailError(null)

    try {
      const params = new URLSearchParams({
        id: selectedId,
        userId: loadedUserId,
      })

      const response = await fetch(`/api/user-memory?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '获取记忆详情失败')
      }

      setDetail(result.data as UserMemoryDetail)
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取记忆详情失败'
      setDetailError(message)
    } finally {
      setDetailLoading(false)
    }
  }, [loadedUserId, selectedId])

  useEffect(() => {
    if (!loadedUserId) return
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedUserId, levelFilter, debouncedSearch, page])

  useEffect(() => {
    if (!loadedUserId) return
    fetchDetail()
  }, [fetchDetail, loadedUserId, selectedId])

  const handleLoad = () => {
    const trimmed = userIdInput.trim()
    if (!trimmed) {
      toast({
        title: '请输入用户 ID',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      })
      return
    }

    setLoadedUserId(trimmed)
    setPage(1)
    setSelectedId(null)
  }

  const handleLevelChange = (value: string) => {
    setLevelFilter(value as LevelFilter)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleRefresh = () => {
    if (!loadedUserId) return
    fetchList()
    fetchDetail()
  }

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && page > 1) {
      setPage(page - 1)
    }
    if (direction === 'next' && page < listData.totalPages) {
      setPage(page + 1)
    }
  }

  const currentEntries = useMemo(() => {
    if (!detail || !isPlainObject(detail.memory)) return [] as Array<[string, any]>
    return Object.entries(detail.memory)
  }, [detail])

  return (
    <PageLayout>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" bgGradient="linear(to-r, primary.400, purple.400)" bgClip="text">
            用户记忆
          </Text>
          <Text mt={2} fontSize="sm" color="gray.500">
            按用户查看记忆列表与详情，仅支持查询操作。
          </Text>
        </Box>

        <Card bg={leftCardBg} shadow="lg">
          <CardBody>
            <VStack align="stretch" spacing={2}>
              <HStack spacing={3} align="flex-end" flexWrap="wrap">
                <Box flex={{ base: 1, xl: 2 }} minW="240px">
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    用户 ID
                  </Text>
                  <Input
                    placeholder="请输入用户 UUID"
                    value={userIdInput}
                    onChange={(event) => setUserIdInput(event.target.value)}
                  />
                </Box>

                <Box flex={{ base: 1, xl: 2 }} minW="260px">
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    搜索
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <RiSearchLine color="var(--chakra-colors-gray-400)" />
                    </InputLeftElement>
                    <Input
                      placeholder="按记忆名称搜索"
                      value={searchTerm}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      isDisabled={!loadedUserId}
                    />
                  </InputGroup>
                </Box>

                <Box minW="160px">
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    记忆级别
                  </Text>
                  <Select
                    value={levelFilter}
                    onChange={(event) => handleLevelChange(event.target.value)}
                    isDisabled={!loadedUserId}
                  >
                    <option value="all">全部</option>
                    <option value="user">用户级</option>
                    <option value="project">项目级</option>
                  </Select>
                </Box>

                <HStack spacing={2} alignSelf={{ base: 'stretch', md: 'flex-end' }}>
                  <Button colorScheme="blue" onClick={handleLoad} isDisabled={!userIdInput.trim()}>
                    加载
                  </Button>
                  <Tooltip label="刷新当前数据" hasArrow>
                    <IconButton
                      aria-label="刷新"
                      icon={<RiRefreshLine />}
                      variant="outline"
                      onClick={handleRefresh}
                      isDisabled={!loadedUserId}
                    />
                  </Tooltip>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Flex gap={6} direction={{ base: 'column', xl: 'row' }} align="stretch">
          <Card flex={{ base: 'none', xl: '0 0 340px' }} bg={leftCardBg} shadow="lg" minH="420px">
            <CardBody>
              <VStack align="stretch" spacing={4} height="100%">
                <HStack justify="space-between">
                  <Text fontSize="md" fontWeight="bold">
                    记忆列表
                  </Text>
                  {loadedUserId && (
                    <Badge colorScheme="blue" variant="subtle">
                      共 {listData.total}
                    </Badge>
                  )}
                </HStack>

                <Divider />

                <Box flex={1} overflowY="auto">
                  {listLoading ? (
                    <HStack justify="center" py={8}>
                      <Spinner />
                      <Text color="gray.500">正在加载...</Text>
                    </HStack>
                  ) : listError ? (
                    <VStack spacing={3} py={8} color={emptyColor}>
                      <Text>{listError}</Text>
                      <Button size="sm" onClick={fetchList} leftIcon={<RiRefreshLine />}>重试</Button>
                    </VStack>
                  ) : listData.items.length === 0 ? (
                    <Box py={8} textAlign="center" color={emptyColor}>
                      {loadedUserId ? '暂无记忆数据' : '请先输入用户 ID 并加载'}
                    </Box>
                  ) : (
                    <VStack align="stretch" spacing={3} pr={1}>
                      {listData.items.map((item) => {
                        const isActive = selectedId === item.id
                        return (
                          <Box
                            key={item.id}
                            p={3}
                            borderWidth={isActive ? '2px' : '1px'}
                            borderColor={isActive ? 'blue.400' : listItemBorder}
                            borderRadius="md"
                            bg={isActive ? listItemActiveBg : 'transparent'}
                            cursor="pointer"
                            onClick={() => setSelectedId(item.id)}
                          >
                            <VStack align="stretch" spacing={1}>
                              <HStack justify="space-between">
                                <Text fontWeight="semibold" noOfLines={1}>
                                  {item.memory_name}
                                </Text>
                                {item.level && (
                                  <Tag size="sm" colorScheme={item.level === 'user' ? 'blue' : 'purple'} variant="subtle">
                                    <TagLabel>{item.level === 'user' ? '用户级' : '项目级'}</TagLabel>
                                  </Tag>
                                )}
                              </HStack>
                              <HStack spacing={2} fontSize="xs" color="gray.500">
                                <RiTimeLine />
                                <Text>{formatDateTime(item.updated_at)}</Text>
                              </HStack>
                            </VStack>
                          </Box>
                        )
                      })}
                    </VStack>
                  )}
                </Box>

                {loadedUserId && listData.totalPages > 1 && (
                  <HStack justify="space-between" pt={2}>
                    <Button size="sm" onClick={() => handlePageChange('prev')} isDisabled={page <= 1 || listLoading}>
                      上一页
                    </Button>
                    <Text fontSize="sm" color="gray.500">
                      {page}/{listData.totalPages}
                    </Text>
                    <Button
                      size="sm"
                      onClick={() => handlePageChange('next')}
                      isDisabled={page >= listData.totalPages || listLoading}
                    >
                      下一页
                    </Button>
                  </HStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          <Card flex={1} shadow="lg" minH="420px">
            <CardBody>
              {detailLoading ? (
                <HStack justify="center" py={12}>
                  <Spinner />
                  <Text color="gray.500">正在加载详情...</Text>
                </HStack>
              ) : detailError ? (
                <VStack spacing={3} py={12} color={emptyColor}>
                  <Text>{detailError}</Text>
                  <Button size="sm" onClick={fetchDetail} leftIcon={<RiRefreshLine />}>重试</Button>
                </VStack>
              ) : !detail ? (
                <Box py={12} textAlign="center" color={emptyColor}>
                  {loadedUserId ? '请选择左侧的记忆查看详情' : '加载后可查看记忆详情'}
                </Box>
              ) : (
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between" align="flex-start">
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">
                        {detail.memory_name}
                      </Text>
                      <HStack spacing={3} mt={2} color="gray.500" fontSize="sm">
                        <HStack spacing={1}>
                          <RiCalendar2Line />
                          <Text>创建：{formatDateTime(detail.created_at)}</Text>
                        </HStack>
                        <HStack spacing={1}>
                          <RiTimeLine />
                          <Text>更新：{formatDateTime(detail.updated_at)}</Text>
                        </HStack>
                      </HStack>
                    </Box>
                    <Tag colorScheme={detail.level === 'project' ? 'purple' : 'blue'} variant="subtle">
                      <TagLabel>{detail.level ? (detail.level === 'user' ? '用户级' : '项目级') : '未指定级别'}</TagLabel>
                      {!detail.level && <TagRightIcon as={RiInformationLine} />}
                    </Tag>
                  </HStack>

                  <Divider />

                  <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={2}>
                      记忆内容
                    </Text>
                    {currentEntries.length === 0 ? (
                      <Box
                        borderWidth="1px"
                        borderColor={listItemBorder}
                        borderRadius="md"
                        p={4}
                        color={emptyColor}
                      >
                        暂无结构化内容
                      </Box>
                    ) : (
                      <VStack align="stretch" spacing={3}>
                        {currentEntries.map(([key, value]) => (
                          <Box
                            key={key}
                            borderWidth="1px"
                            borderColor={listItemBorder}
                            borderRadius="md"
                            p={3}
                          >
                            <Text fontWeight="semibold" fontSize="sm" color="gray.600" mb={1}>
                              {key}
                            </Text>
                            <Text whiteSpace="pre-wrap" fontSize="sm">
                              {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
                                ? String(value)
                                : JSON.stringify(value, null, 2)}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>

                  {/* 原始 JSON 展示已移除 */}
                </VStack>
              )}
            </CardBody>
          </Card>
        </Flex>
      </VStack>
    </PageLayout>
  )
}
