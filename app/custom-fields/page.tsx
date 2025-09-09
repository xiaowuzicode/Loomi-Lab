'use client'

import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
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
  Switch,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Tooltip,
  Stack,
  Divider,
  ButtonGroup,
  Textarea,
  FormErrorMessage,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Icon,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import {
  RiSearchLine,
  RiAddLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiEyeLine,
  RiEyeOffLine,
  RiGlobalLine,
  RiLockLine,
  RiFileTextLine,
  RiBrainLine,
  RiHeart3Line,
  RiSparklingFill,
  RiCloseLine,
  RiUser3Line,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { useCustomFields } from '@/hooks/useCustomFields'
import { CustomFieldRecord, CustomFieldForm, CustomField } from '@/types'
import { format } from 'date-fns'

const MotionBox = motion(Box)

// 类型图标映射
const TYPE_ICONS = {
  '洞察': RiBrainLine,
  '钩子': RiHeart3Line,
  '情绪': RiSparklingFill,
}

// 类型颜色映射
const TYPE_COLORS = {
  '洞察': 'blue.400',
  '钩子': 'pink.400',
  '情绪': 'purple.400',
}

export default function CustomFieldsPage() {
  const [selectedType, setSelectedType] = useState<'洞察' | '钩子' | '情绪' | 'all'>('洞察')
  const [searchTerm, setSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [amountRange, setAmountRange] = useState({ min: '', max: '' })
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedRecord, setSelectedRecord] = useState<CustomFieldRecord | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  
  // 表单状态
  const [form, setForm] = useState<CustomFieldForm & { type: string }>({
    appCode: 'loomi',
    type: '洞察',
    amount: 0,
    readme: '',
    exampleData: '',
    visibility: true,
    isPublic: false,
    extendedField: [
      { key: 'title', label: '标题', value: '', required: true },
      { key: 'content', label: '正文', value: '', required: false }
    ]
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [amountDisplay, setAmountDisplay] = useState<string>('')

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const {
    records,
    loading,
    statsLoading,
    error,
    stats,
    fetchCustomFields,
    fetchStats,
    createCustomField,
    updateCustomField,
    deleteCustomField,
  } = useCustomFields()

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })


  // 颜色主题
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400')
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700')

  // 加载数据
  const loadData = async () => {
    const result = await fetchCustomFields({
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      userSearch: userSearchTerm,
      type: selectedType,
      amountMin: amountRange.min ? parseFloat(amountRange.min) : undefined,
      amountMax: amountRange.max ? parseFloat(amountRange.max) : undefined,
      dateFrom: dateRange.from || undefined,
      dateTo: dateRange.to || undefined,
    })
    
    if (result.pagination) {
      setPagination(result.pagination)
    }
  }

  useEffect(() => {
    loadData()
    fetchStats()
  }, [selectedType, currentPage, pageSize])

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1)
    loadData()
  }

  // 重置搜索
  const handleReset = () => {
    setSearchTerm('')
    setUserSearchTerm('')
    setAmountRange({ min: '', max: '' })
    setDateRange({ from: '', to: '' })
    setCurrentPage(1)
    setTimeout(loadData, 100)
  }

  // 打开创建表单
  const handleCreate = () => {
    setFormMode('create')
    setForm({
      appCode: 'loomi',
      type: selectedType === 'all' ? '洞察' : selectedType,
      amount: 0,
      readme: '',
      exampleData: '',
      visibility: true,
      isPublic: false,
      extendedField: [
        { key: 'title', label: '标题', value: '', required: true },
        { key: 'content', label: '正文', value: '', required: false }
      ]
    })
    setAmountDisplay('')
    setFormErrors({})
    onFormOpen()
  }

  // 打开编辑表单
  const handleEdit = async (record: CustomFieldRecord) => {
    setFormMode('edit')
    setSelectedRecord(record)
    setForm({
      appCode: record.appCode,
      type: record.type,
      amount: record.amount,
      readme: record.readme,
      exampleData: record.exampleData || '',
      visibility: record.visibility,
      isPublic: record.isPublic,
      extendedField: record.extendedField
    })
    setAmountDisplay(record.amount === 0 ? '' : record.amount.toString())
    setFormErrors({})
    onFormOpen()
  }

  // 打开删除确认
  const handleDeleteClick = (record: CustomFieldRecord) => {
    setSelectedRecord(record)
    onDeleteOpen()
  }

  // 执行删除
  const handleDelete = async () => {
    if (selectedRecord) {
      const success = await deleteCustomField(selectedRecord.id)
      if (success) {
        onDeleteClose()
        loadData()
        fetchStats()
      }
    }
  }

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // 应用代码是可选的，不需要验证

    if (!form.readme.trim() || form.readme.trim().length < 10) {
      errors.readme = '说明文档至少需要10个字符'
    }

    if (form.amount < 0) {
      errors.amount = '金额不能为负数'
    }

    // 验证扩展字段
    const titleField = form.extendedField.find(field => field.key === 'title')
    if (!titleField || !titleField.value.trim() || titleField.value.trim().length < 2) {
      errors.title = '标题至少需要2个字符'
    }

    // 验证字段key唯一性
    const keys = form.extendedField.map(field => field.key)
    const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index)
    if (duplicateKeys.length > 0) {
      errors.extendedField = '字段名不能重复'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      if (formMode === 'create') {
        await createCustomField(form)
      } else if (selectedRecord) {
        await updateCustomField(selectedRecord.id, form)
      }
      
      onFormClose()
      loadData()
      fetchStats()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  // 添加自定义字段
  const addCustomField = () => {
    const newField: CustomField = {
      key: `field_${Date.now()}`,
      label: '自定义字段',
      value: '',
      required: false
    }
    setForm(prev => ({
      ...prev,
      extendedField: [...prev.extendedField, newField]
    }))
  }

  // 删除自定义字段
  const removeCustomField = (index: number) => {
    setForm(prev => ({
      ...prev,
      extendedField: prev.extendedField.filter((_, i) => i !== index)
    }))
  }

  // 更新字段值
  const updateFieldValue = (index: number, field: Partial<CustomField>) => {
    setForm(prev => ({
      ...prev,
      extendedField: prev.extendedField.map((item, i) => 
        i === index ? { ...item, ...field } : item
      )
    }))
  }

  return (
    <PageLayout>
      <Flex h="calc(100vh - 200px)" gap={6}>
        {/* 左侧文件夹导航 */}
        <Box
          w="280px"
          bg={bgColor}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
          p={6}
          flexShrink={0}
        >
          <Text fontWeight="bold" mb={4} color={textColor}>
            📁 自定义数据管理
          </Text>
          
          <VStack spacing={2} align="stretch">
            {(['洞察', '钩子', '情绪'] as const).map((type) => {
              const Icon = TYPE_ICONS[type]
              const isSelected = selectedType === type
              const count = stats[type]
              
              return (
                <MotionBox
                  key={type}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Flex
                    align="center"
                    p={3}
                    borderRadius="lg"
                    cursor="pointer"
                    bg={isSelected ? hoverBgColor : 'transparent'}
                    border={isSelected ? '2px solid' : '2px solid transparent'}
                    borderColor={isSelected ? TYPE_COLORS[type] : 'transparent'}
                    onClick={() => {
                      setSelectedType(type)
                      setCurrentPage(1)
                    }}
                    _hover={{ bg: hoverBgColor }}
                  >
                    <Icon color={TYPE_COLORS[type]} />
                    <Text ml={3} fontWeight={isSelected ? 'semibold' : 'normal'}>
                      {type}
                    </Text>
                    <Badge
                      ml="auto"
                      colorScheme={isSelected ? 'blue' : 'gray'}
                      variant={isSelected ? 'solid' : 'subtle'}
                    >
                      {statsLoading ? '...' : count}
                    </Badge>
                  </Flex>
                </MotionBox>
              )
            })}
          </VStack>
        </Box>

        {/* 主内容区域 */}
        <Box flex={1} overflow="hidden">
          {/* 顶部操作栏 */}
          <Card mb={6}>
            <Flex justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                {selectedType !== 'all' && (
                  <>
                    {TYPE_ICONS[selectedType] && 
                      <Icon as={TYPE_ICONS[selectedType]} color={TYPE_COLORS[selectedType]} size="20px" />
                    }
                  </>
                )}
                <Text fontSize="xl" fontWeight="bold">
                  {selectedType === 'all' ? '全部数据' : `${selectedType}数据管理`}
                </Text>
              </HStack>
              <Button
                leftIcon={<RiAddLine />}
                colorScheme="blue"
                onClick={handleCreate}
              >
                新建
              </Button>
            </Flex>

            {/* 搜索和筛选 */}
            <VStack spacing={3} align="stretch">
              <HStack spacing={4}>
                <InputGroup flex="1">
                  <InputLeftElement pointerEvents="none">
                    <RiSearchLine color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="搜索标题或内容..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </InputGroup>
                
                <InputGroup flex="1">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={RiUser3Line} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="搜索用户 (UUID或用户名)..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </InputGroup>
              </HStack>
              
              <HStack justify="space-between">
                <HStack spacing={2}>
                <Input
                  size="sm"
                  w="100px"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="最小金额"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                />
                <Text>-</Text>
                <Input
                  size="sm"
                  w="100px"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="最大金额"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                />
              </HStack>
              </HStack>

              <HStack>
                <Input
                  type="date"
                  size="sm"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
                <Input
                  type="date"
                  size="sm"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </HStack>

              <HStack>
                <Button size="sm" leftIcon={<RiSearchLine />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  重置
                </Button>
                <IconButton
                  aria-label="刷新"
                  icon={<RiRefreshLine />}
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    loadData()
                    fetchStats()
                  }}
                />
              </HStack>
            </VStack>
          </Card>

          {/* 数据列表 */}
          <Box flex={1} overflow="auto">
            {loading ? (
              <VStack spacing={4}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} height="120px" width="100%" borderRadius="lg" />
                ))}
              </VStack>
            ) : error ? (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                {error}
              </Alert>
            ) : records.length === 0 ? (
              <Card>
                <Flex direction="column" align="center" justify="center" py={12}>
                  <RiFileTextLine size="48px" color="gray.400" />
                  <Text mt={4} color={mutedTextColor}>
                    暂无数据，点击"新建"添加第一条记录
                  </Text>
                </Flex>
              </Card>
            ) : (
              <VStack spacing={4} align="stretch">
                {records.map((record) => {
                  const titleField = record.extendedField.find(f => f.key === 'title')
                  const title = titleField?.value || '未命名'
                  const preview = record.readme.slice(0, 50) + (record.readme.length > 50 ? '...' : '')
                  
                  return (
                    <MotionBox
                      key={record.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card>
                        <Flex justify="space-between" align="flex-start">
                          <Box flex={1}>
                            <HStack spacing={3} mb={2}>
                              <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                                📄 {title}
                              </Text>
                              <Badge colorScheme="green" variant="subtle">
                                ¥{record.amount.toFixed(2)}
                              </Badge>
                              <HStack spacing={1}>
                                {record.visibility ? (
                                  <Tooltip label="可见">
                                    <Box><RiEyeLine color="green" size="14px" /></Box>
                                  </Tooltip>
                                ) : (
                                  <Tooltip label="隐藏">
                                    <Box><RiEyeOffLine color="gray" size="14px" /></Box>
                                  </Tooltip>
                                )}
                                {record.isPublic ? (
                                  <Tooltip label="公开">
                                    <Box><RiGlobalLine color="blue" size="14px" /></Box>
                                  </Tooltip>
                                ) : (
                                  <Tooltip label="私有">
                                    <Box><RiLockLine color="gray" size="14px" /></Box>
                                  </Tooltip>
                                )}
                              </HStack>
                            </HStack>
                            <Text color={mutedTextColor} mb={3}>
                              📝 {preview}
                            </Text>
                            <HStack spacing={4} fontSize="sm" color={mutedTextColor}>
                              <Text>👤 创建者: {record.createdUserName}</Text>
                              <Text>📱 应用: {record.appCode}</Text>
                              <Text>🕒 {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm')}</Text>
                            </HStack>
                          </Box>
                          
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label="操作"
                              icon={<RiMoreLine />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem icon={<RiEditLine />} onClick={() => handleEdit(record)}>
                                编辑
                              </MenuItem>
                              <MenuItem icon={<RiDeleteBinLine />} onClick={() => handleDeleteClick(record)}>
                                删除
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Flex>
                      </Card>
                    </MotionBox>
                  )
                })}
                
                {/* 分页 */}
                {pagination.totalPages > 1 && (
                  <Card>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color={mutedTextColor}>
                        共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
                      </Text>
                      <HStack>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                          上一页
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage === pagination.totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        >
                          下一页
                        </Button>
                      </HStack>
                    </Flex>
                  </Card>
                )}
              </VStack>
            )}
          </Box>
        </Box>
      </Flex>

      {/* 创建/编辑表单 Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {formMode === 'create' ? '新建' : '编辑'}{form.type}数据
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* 基础信息 */}
              <Box>
                <Text fontWeight="bold" mb={3}>基础信息</Text>
                
                <FormControl isInvalid={!!formErrors.readme} isRequired>
                  <FormLabel>📖 说明文档</FormLabel>
                  <Textarea
                    value={form.readme}
                    onChange={(e) => setForm(prev => ({ ...prev, readme: e.target.value }))}
                    placeholder="请输入说明文档（至少10个字符）"
                    rows={4}
                  />
                  <FormErrorMessage>{formErrors.readme}</FormErrorMessage>
                </FormControl>

                <FormControl mt={4}>
                  <FormLabel>💡 示例数据</FormLabel>
                  <Textarea
                    value={form.exampleData}
                    onChange={(e) => setForm(prev => ({ ...prev, exampleData: e.target.value }))}
                    placeholder="可选的示例数据说明"
                    rows={3}
                  />
                </FormControl>

                <HStack mt={4} spacing={6}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb={0}>👁️ 可见性</FormLabel>
                    <Switch
                      isChecked={form.visibility}
                      onChange={(e) => setForm(prev => ({ ...prev, visibility: e.target.checked }))}
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb={0}>🌐 公开性</FormLabel>
                    <Switch
                      isChecked={form.isPublic}
                      onChange={(e) => setForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    />
                  </FormControl>
                </HStack>

                <Grid templateColumns="1fr 1fr" gap={4} mt={4}>
                  <FormControl isInvalid={!!formErrors.appCode}>
                    <FormLabel>应用代码</FormLabel>
                    <Input
                      value={form.appCode}
                      onChange={(e) => setForm(prev => ({ ...prev, appCode: e.target.value }))}
                      placeholder="请输入应用代码，如：loomi"
                    />
                    <FormErrorMessage>{formErrors.appCode}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!formErrors.amount}>
                    <FormLabel>金额 (元)</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountDisplay}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        setAmountDisplay(inputValue)
                        const numValue = inputValue === '' ? 0 : parseFloat(inputValue) || 0
                        setForm(prev => ({ ...prev, amount: numValue }))
                      }}
                      placeholder="请输入金额，如：199.99"
                    />
                    <FormErrorMessage>{formErrors.amount}</FormErrorMessage>
                  </FormControl>
                </Grid>
              </Box>

              {/* 扩展字段 */}
              <Box>
                <Text fontWeight="bold" mb={3}>扩展字段</Text>
                
                {formErrors.extendedField && (
                  <Alert status="error" mb={3}>
                    <AlertIcon />
                    {formErrors.extendedField}
                  </Alert>
                )}
                
                <VStack spacing={3} align="stretch">
                  {form.extendedField.map((field, index) => {
                    const isTitle = field.key === 'title'
                    const isRequired = field.required || isTitle
                    const canRemove = !isTitle && form.extendedField.length > 1
                    
                    return (
                      <Box key={index} p={4} border="1px" borderColor={borderColor} borderRadius="lg">
                        <HStack spacing={3} mb={2}>
                          <FormControl flex={1} isInvalid={isTitle && !!formErrors.title}>
                            <FormLabel fontSize="sm">
                              字段名 {isRequired && <Text as="span" color="red.500">*</Text>}
                            </FormLabel>
                            <Input
                              size="sm"
                              value={field.label}
                              onChange={(e) => updateFieldValue(index, { label: e.target.value })}
                              disabled={isTitle}
                            />
                          </FormControl>
                          
                          <FormControl flex={1}>
                            <FormLabel fontSize="sm">字段Key</FormLabel>
                            <Input
                              size="sm"
                              value={field.key}
                              onChange={(e) => updateFieldValue(index, { key: e.target.value })}
                              disabled={isTitle}
                            />
                          </FormControl>
                          
                          {canRemove && (
                            <IconButton
                              aria-label="删除字段"
                              icon={<RiCloseLine />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeCustomField(index)}
                              alignSelf="end"
                            />
                          )}
                        </HStack>
                        
                        <FormControl isInvalid={isTitle && !!formErrors.title}>
                          <FormLabel fontSize="sm">
                            字段值 {isRequired && <Text as="span" color="red.500">*</Text>}
                          </FormLabel>
                          <Textarea
                            size="sm"
                            value={field.value}
                            onChange={(e) => updateFieldValue(index, { value: e.target.value })}
                            rows={isTitle ? 1 : 3}
                          />
                          {isTitle && <FormErrorMessage>{formErrors.title}</FormErrorMessage>}
                        </FormControl>
                      </Box>
                    )
                  })}
                  
                  <Button
                    leftIcon={<RiAddLine />}
                    variant="outline"
                    size="sm"
                    onClick={addCustomField}
                  >
                    添加自定义字段
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFormClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认对话框 */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>⚠️ 确认删除数据</AlertDialogHeader>
            <AlertDialogBody>
              此操作将标记数据为已删除状态，管理员可以恢复。
              {selectedRecord && (
                <>
                  <Text mt={2}><strong>数据标题:</strong> {selectedRecord.extendedField.find(f => f.key === 'title')?.value || '未命名'}</Text>
                  <Text><strong>创建时间:</strong> {format(new Date(selectedRecord.createdAt), 'yyyy-MM-dd HH:mm')}</Text>
                </>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                取消
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                确认删除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </PageLayout>
  )
}