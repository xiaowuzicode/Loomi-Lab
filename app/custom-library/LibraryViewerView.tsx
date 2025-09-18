'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Select,
  Badge,
  Card,
  CardBody,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { RiDatabase2Line, RiSearchLine } from 'react-icons/ri'
import { useCustomFields } from '@/hooks/useCustomFields'
import { CustomFieldRecord } from '@/types'
import { ReadOnlyTable } from '@/components/custom-library/ReadOnlyTable'

interface TypeGroup {
  type: string
  tables: CustomFieldRecord[]
}

const FALLBACK_TYPE = '未分类'

export function CustomLibraryView() {
  const toast = useToast()
  const {
    records,
    loading,
    error,
    fetchCustomFields,
  } = useCustomFields()

  const [userIdInput, setUserIdInput] = useState('')
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  const typeGroups: TypeGroup[] = useMemo(() => {
    if (!records.length) return []
    const groups = new Map<string, CustomFieldRecord[]>()
    records.forEach((record) => {
      const typeName = record.type || FALLBACK_TYPE
      if (!groups.has(typeName)) {
        groups.set(typeName, [])
      }
      groups.get(typeName)!.push(record)
    })

    return Array.from(groups.entries()).map(([type, tables]) => ({
      type,
      tables: tables.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    }))
  }, [records])

  const allCount = useMemo(() => records.length, [records])
  const typeOptions = useMemo(() => typeGroups.map(g => ({ type: g.type, count: g.tables.length })), [typeGroups])

  const displayGroups: TypeGroup[] = useMemo(() => {
    if (typeFilter === 'all') return typeGroups
    const g = typeGroups.find(x => x.type === typeFilter)
    return g ? [g] : []
  }, [typeGroups, typeFilter])

  useEffect(() => {
    if (!records.length) {
      setSelectedType(null)
      setSelectedTableId(null)
      return
    }

    const currentGroup = typeGroups.find((group) => group.type === selectedType)
    if (currentGroup && currentGroup.tables.some((table) => table.id === selectedTableId)) {
      return
    }

    const firstGroup = typeGroups[0]
    setSelectedType(firstGroup?.type ?? null)
    setSelectedTableId(firstGroup?.tables[0]?.id ?? null)
  }, [records, typeGroups, selectedType, selectedTableId])

  const currentTable = useMemo(() => {
    if (!selectedTableId) return null
    return records.find((record) => record.id === selectedTableId) ?? null
  }, [records, selectedTableId])

  const handleLoad = async () => {
    const trimmed = userIdInput.trim()
    if (!trimmed) {
      toast({
        title: '请输入用户ID',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      })
      return
    }

    setLoadingUser(true)
    try {
      const result = await fetchCustomFields(trimmed, { limit: 200, sortBy: 'updated_at', sortOrder: 'desc' })
      if (result.records.length === 0) {
        toast({
          title: '未找到数据',
          description: '该用户暂无自定义表',
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
      }
      setLoadedUserId(trimmed)
    } finally {
      setLoadingUser(false)
    }
  }

  const leftCardBg = useColorModeValue('white', 'gray.800')
  const muted = useColorModeValue('gray.500', 'gray.400')
  const inactiveBorderColor = useColorModeValue('gray.200', 'gray.600')
  const activeItemBg = useColorModeValue('blue.50', 'blue.900')
  const descriptionBg = useColorModeValue('gray.50', 'gray.800')
  const descriptionBorder = useColorModeValue('gray.200', 'gray.600')
  const descriptionTextColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <Flex gap={6} align="stretch" flexDir={{ base: 'column', xl: 'row' }}>
      <Card flex={{ base: 'none', xl: '0 0 320px' }} bg={leftCardBg} shadow="lg">
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={2}>自定义库</Text>
              <Text fontSize="sm" color={muted}>
                输入用户ID并点击“加载”查看该用户的自定义表类型与数据。
              </Text>
            </Box>

            <VStack align="stretch" spacing={2}>
              <Input
                placeholder="请输入用户ID (UUID)"
                value={userIdInput}
                onChange={(event) => setUserIdInput(event.target.value)}
                size="sm"
              />
              <Button
                leftIcon={<RiSearchLine />}
                colorScheme="blue"
                onClick={handleLoad}
                isLoading={loadingUser}
                loadingText="加载中"
                isDisabled={!userIdInput.trim()}
                size="sm"
              >
                加载
              </Button>
            </VStack>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {loadedUserId && (
              <Box mt={2} fontSize="sm" color={muted}>
                当前用户：<Text as="span" fontWeight="medium" color="gray.700">{loadedUserId}</Text>
              </Box>
            )}

            <Divider />

            {/* 类型筛选下拉，与“创建公域表”一致的交互 */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>类型筛选</Text>
              <Select
                size="sm"
                value={typeFilter}
                onChange={(e) => {
                  const v = e.target.value as 'all' | string
                  setTypeFilter(v)
                  // 联动选择首个表格，避免右侧空白
                  if (v === 'all') {
                    const firstGroup = typeGroups[0]
                    setSelectedType(firstGroup?.type ?? null)
                    setSelectedTableId(firstGroup?.tables[0]?.id ?? null)
                  } else {
                    const target = typeGroups.find(g => g.type === v)
                    setSelectedType(target?.type ?? null)
                    setSelectedTableId(target?.tables[0]?.id ?? null)
                  }
                }}
              >
                <option value="all">全部（{allCount}）</option>
                {typeOptions.map(opt => (
                  <option key={opt.type} value={opt.type}>{opt.type}（{opt.count}）</option>
                ))}
              </Select>
            </Box>

            {loading || loadingUser ? (
              <HStack justify="center" py={8}>
                <Spinner size="sm" />
                <Text fontSize="sm" color={muted}>正在加载表格...</Text>
              </HStack>
            ) : displayGroups.length === 0 ? (
              <Box py={6} textAlign="center" color={muted}>
                {loadedUserId ? '暂无表格数据' : '输入用户ID后点击加载'}
              </Box>
            ) : (
              <VStack align="stretch" spacing={4} maxH="60vh" overflowY="auto" pr={2}>
                {displayGroups.map((group) => (
                  <Box key={group.type}>
                    <HStack spacing={2} mb={2}>
                      <Box as={RiDatabase2Line} color="blue.400" />
                      <Text fontWeight="semibold">{group.type}</Text>
                      <Badge colorScheme="gray" variant="subtle">
                        {group.tables.length}
                      </Badge>
                    </HStack>

                    <VStack align="stretch" spacing={2}>
                      {group.tables.map((table) => {
                        const rowCount = table.extendedField?.length || 0
                        const isActive = table.id === selectedTableId
                        return (
                          <Box
                            key={table.id}
                            p={3}
                            borderRadius="md"
                            borderWidth={isActive ? '2px' : '1px'}
                            borderColor={isActive ? 'blue.400' : inactiveBorderColor}
                            bg={isActive ? activeItemBg : 'transparent'}
                            cursor="pointer"
                            onClick={() => {
                              setSelectedType(group.type)
                              setSelectedTableId(table.id)
                            }}
                          >
                            <VStack align="stretch" spacing={1}>
                              <Text fontWeight="medium" noOfLines={1}>{table.tableName || '未命名表格'}</Text>
                              <HStack spacing={3} fontSize="xs" color={muted}>
                                <HStack spacing={1}>
                                  <Text>行数</Text>
                                  <Badge colorScheme="blue" variant="subtle">{rowCount}</Badge>
                                </HStack>
                                <Text>
                                  更新于 {table.updatedAt ? format(new Date(table.updatedAt), 'yyyy-MM-dd HH:mm') : '未知'}
                                </Text>
                              </HStack>
                            </VStack>
                          </Box>
                        )
                      })}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>

      <Card flex={1} shadow="lg">
        <CardBody>
          {!loadedUserId ? (
            <Box py={24} textAlign="center" color={muted}>
              输入用户ID并加载后，可在此查看表格详情。
            </Box>
          ) : !currentTable ? (
            <Box py={24} textAlign="center" color={muted}>
              请选择左侧的表格以查看详情。
            </Box>
          ) : (
            <VStack align="stretch" spacing={6}>
              <Box>
                <Text fontSize="xl" fontWeight="bold">{currentTable.tableName || '未命名表格'}</Text>
                <HStack spacing={3} mt={2} color={muted} fontSize="sm">
                  <Badge colorScheme="blue" variant="subtle">{currentTable.type || FALLBACK_TYPE}</Badge>
                  <Text>创建者：{currentTable.createdUserName}</Text>
                  <Text>创建时间：{currentTable.createdAt ? format(new Date(currentTable.createdAt), 'yyyy-MM-dd HH:mm') : '未知'}</Text>
                  <Text>更新：{currentTable.updatedAt ? format(new Date(currentTable.updatedAt), 'yyyy-MM-dd HH:mm') : '未知'}</Text>
                </HStack>
              </Box>

              <Tabs colorScheme="blue">
                <TabList>
                  <Tab>数据</Tab>
                  <Tab>说明</Tab>
                  {currentTable.exampleData && <Tab>示例数据</Tab>}
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <ReadOnlyTable
                      data={currentTable.extendedField || []}
                      fields={currentTable.tableFields || []}
                      loading={loading || loadingUser}
                    />
                  </TabPanel>
                  <TabPanel>
                    <Box
                      whiteSpace="pre-wrap"
                      fontSize="sm"
                      color={descriptionTextColor}
                      borderWidth="1px"
                      borderColor={descriptionBorder}
                      borderRadius="md"
                      p={4}
                      bg={descriptionBg}
                    >
                      {currentTable.readme || '暂无说明'}
                    </Box>
                  </TabPanel>
                  {currentTable.exampleData && (
                    <TabPanel>
                      <Box
                        whiteSpace="pre-wrap"
                        fontSize="sm"
                        color={descriptionTextColor}
                        borderWidth="1px"
                        borderColor={descriptionBorder}
                        borderRadius="md"
                        p={4}
                        bg={descriptionBg}
                      >
                        {currentTable.exampleData}
                      </Box>
                    </TabPanel>
                  )}
                </TabPanels>
              </Tabs>
            </VStack>
          )}
        </CardBody>
      </Card>
    </Flex>
  )
}
