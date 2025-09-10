'use client'

import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  useColorModeValue,
  useToast,
  useDisclosure,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Grid,
  GridItem,
  FormErrorMessage,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Skeleton,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  RiBrainLine,
  RiHeart3Line,
  RiSparklingFill,
  RiAddLine,
  RiDeleteBinLine,
  RiFileTextLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/custom-fields/DataTable'
import { TableToolbar } from '@/components/custom-fields/TableToolbar'
import { FieldManagerModal } from '@/components/custom-fields/FieldManagerModal'
import { BatchOperationBar } from '@/components/custom-fields/BatchOperationBar'
import { 
  CustomFieldRecord, 
  CustomFieldForm, 
  TableRow, 
  FieldOperation,
  CustomFieldStats 
} from '@/types'
import { useTableCustomFields } from '@/hooks/useTableCustomFields'
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

export default function CustomFieldsTablePage() {
  const [selectedType, setSelectedType] = useState<'洞察' | '钩子' | '情绪'>('洞察')
  const [currentTable, setCurrentTable] = useState<CustomFieldRecord | null>(null)
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Loading states - 移除重复状态，使用 hook 中的状态

  // Modal states
  const { isOpen: isCreateTableOpen, onOpen: onCreateTableOpen, onClose: onCreateTableClose } = useDisclosure()
  const { isOpen: isFieldManagerOpen, onOpen: onFieldManagerOpen, onClose: onFieldManagerClose } = useDisclosure()
  const { isOpen: isDeleteTableOpen, onOpen: onDeleteTableOpen, onClose: onDeleteTableClose } = useDisclosure()
  
  // Form states
  const [createTableForm, setCreateTableForm] = useState<CustomFieldForm & { type: string }>({
    appCode: 'loomi',
    type: '洞察',
    amount: 0,
    readme: '',
    exampleData: '',
    visibility: true,
    isPublic: false,
    extendedField: [
      { id: 1, 标题: '', 正文: '' }
    ],
    tableFields: ['标题', '正文']
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [pendingDeleteTable, setPendingDeleteTable] = useState<CustomFieldRecord | null>(null)
  
  // 新行管理状态
  const [pendingRow, setPendingRow] = useState<TableRow | null>(null)
  const [isAddingRow, setIsAddingRow] = useState(false)
  
  // 删除行确认状态
  const [pendingDeleteRow, setPendingDeleteRow] = useState<{ id: number, title: string } | null>(null)
  const [isDeletingRow, setIsDeletingRow] = useState(false)

  const cancelRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()

  // 颜色主题
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400')
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700')

  // 使用新的 hook
  const {
    tables,
    currentTable: hookCurrentTable,
    loading,
    tableLoading,
    statsLoading,
    error,
    stats,
    fetchTables: hookFetchTables,
    fetchStats,
    fetchTableById,
    createTable: hookCreateTable,
    deleteTable: hookDeleteTable,
    setCurrentTable: setHookCurrentTable,
    updateTableFields,
    updateTableRow,
    batchUpdateTableRows,
    updateCellValue,
  } = useTableCustomFields()

  const fetchTables = useCallback(async () => {
    await hookFetchTables({
      type: selectedType,
      page: 1,
      limit: 50
    })
  }, [hookFetchTables, selectedType])

  useEffect(() => {
    fetchTables()
    fetchStats()
  }, [fetchTables, fetchStats])

  // 同步hook中的currentTable到本地状态
  useEffect(() => {
    if (hookCurrentTable) {
      setCurrentTable(hookCurrentTable)
    }
  }, [hookCurrentTable])

  // 表格操作函数
  const handleCreateTable = () => {
    setCreateTableForm({
      appCode: 'loomi',
      type: selectedType,
      amount: 0,
      readme: '',
      exampleData: '',
      visibility: true,
      isPublic: false,
      extendedField: [
        { id: 1, 标题: '', 正文: '' }
      ],
      tableFields: ['标题', '正文']
    })
    setFormErrors({})
    onCreateTableOpen()
  }

  const handleTableSelect = (table: CustomFieldRecord) => {
    setCurrentTable(table)
    setHookCurrentTable(table)
    setSelectedRows([])
  }

  const handleRowSelect = (rowId: number) => {
    setSelectedRows(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    )
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected && currentTable) {
      setSelectedRows(currentTable.extendedField.map(row => row.id))
    } else {
      setSelectedRows([])
    }
  }

  const handleRowUpdate = async (rowId: number, field: string, value: string) => {
    if (!currentTable) return
    await updateCellValue(currentTable.id, rowId, field, value)
  }

  const handleRowDelete = (rowId: number) => {
    if (!currentTable) return
    
    // 获取要删除行的标题，用于确认对话框显示
    const rowToDelete = currentTable.extendedField.find(row => row.id === rowId)
    const rowTitle = rowToDelete?.['标题'] || `ID: ${rowId}`
    
    setPendingDeleteRow({ id: rowId, title: rowTitle })
  }

  const confirmRowDelete = async () => {
    if (!currentTable || !pendingDeleteRow) return
    
    setIsDeletingRow(true)
    try {
      const updatedTable = await updateTableRow(currentTable.id, 'delete', pendingDeleteRow.id)
      
      if (updatedTable) {
        setSelectedRows(prev => prev.filter(id => id !== pendingDeleteRow.id))
        setPendingDeleteRow(null)
        
        toast({
          title: '删除成功',
          description: `行"${pendingDeleteRow.title}"已删除`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除行失败:', error)
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsDeletingRow(false)
    }
  }

  const cancelRowDelete = () => {
    setPendingDeleteRow(null)
  }

  const handleRowDuplicate = async (rowId: number) => {
    if (!currentTable) return
    await updateTableRow(currentTable.id, 'duplicate', rowId)
  }

  const handleAddRow = () => {
    if (!currentTable || pendingRow) return
    
    // 创建新的待编辑行，使用当前最大ID + 1
    const maxId = Math.max(...currentTable.extendedField.map(row => row.id), 0)
    const newRow: TableRow = { id: maxId + 1 }
    
    // 为每个字段初始化空值
    currentTable.tableFields.forEach(field => {
      newRow[field] = ''
    })
    
    setPendingRow(newRow)
  }

  const handlePendingRowUpdate = (field: string, value: string) => {
    if (!pendingRow) return
    setPendingRow(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handlePendingRowSave = async () => {
    if (!currentTable || !pendingRow) return
    
    // 验证标题字段必填
    if (!pendingRow['标题']?.trim()) {
      toast({
        title: '验证失败',
        description: '标题字段不能为空',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    setIsAddingRow(true)
    try {
      // 调用API保存新行
      const rowData = { ...pendingRow }
      delete rowData.id // 删除临时ID，让服务器生成
      
      const updatedTable = await updateTableRow(currentTable.id, 'add', undefined, rowData)
      
      if (updatedTable) {
        // 清理状态
        setPendingRow(null)
        
        toast({
          title: '添加成功',
          description: '新行已成功添加到表格',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('添加行失败:', error)
    } finally {
      setIsAddingRow(false)
    }
  }

  const handlePendingRowCancel = () => {
    setPendingRow(null)
  }

  const handleFieldOperation = async (operation: FieldOperation) => {
    if (!currentTable) return
    await updateTableFields(currentTable.id, operation)
  }

  const handleFieldSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // 批量操作函数
  const handleBatchEdit = () => {
    // TODO: 实现批量编辑模态框
    toast({
      title: '功能开发中',
      description: '批量编辑功能正在开发中',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleBatchDelete = async () => {
    if (!currentTable || selectedRows.length === 0) return
    
    try {
      await batchUpdateTableRows(currentTable.id, {
        action: 'delete',
        rowIds: selectedRows
      })
      setSelectedRows([])
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  }

  const handleExportSelected = () => {
    if (!currentTable || selectedRows.length === 0) {
      toast({
        title: '请选择要导出的数据',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 导出选中数据为JSON格式
    const selectedData = currentTable.extendedField.filter(row => 
      selectedRows.includes(row.id)
    )
    
    const exportData = {
      tableName: currentTable.extendedField.find(r => r.标题)?.标题 || '自定义数据',
      tableFields: currentTable.tableFields,
      data: selectedData,
      exportTime: new Date().toISOString(),
      count: selectedData.length
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentTable.type}_数据_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: '导出成功',
      description: `已导出 ${selectedData.length} 条数据`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  // 表单验证
  const validateCreateTableForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!createTableForm.readme.trim() || createTableForm.readme.trim().length < 10) {
      errors.readme = '说明文档至少需要10个字符'
    }

    if (createTableForm.amount < 0) {
      errors.amount = '金额不能为负数'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateTableSubmit = async () => {
    if (!validateCreateTableForm()) {
      return
    }

    try {
      const result = await hookCreateTable(createTableForm)
      if (result) {
        onCreateTableClose()
        fetchTables()
        fetchStats()
      }
    } catch (error) {
      console.error('创建表格失败:', error)
    }
  }

  return (
    <PageLayout>
      <Flex h="calc(100vh - 200px)" gap={6}>
        {/* 左侧分类导航 */}
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
            📁 数据表管理
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
                    onClick={() => setSelectedType(type)}
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

          {/* 表格列表 */}
          <Box mt={6}>
            <Text fontWeight="semibold" mb={3} color={textColor}>
              {selectedType}类型表格
            </Text>
            <VStack spacing={2} align="stretch">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} height="40px" borderRadius="md" />
                ))
              ) : tables.length === 0 ? (
                <Text color={mutedTextColor} textAlign="center" py={4} fontSize="sm">
                  暂无{selectedType}表格
                </Text>
              ) : (
                tables.map((table) => (
                  <Box
                    key={table.id}
                    p={3}
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    cursor="pointer"
                    bg={currentTable?.id === table.id ? 'blue.50' : 'transparent'}
                    _hover={{ bg: 'blue.50' }}
                    onClick={() => handleTableSelect(table)}
                  >
                    <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                      {table.extendedField[0]?.标题 || '未命名表格'}
                    </Text>
                    <Text fontSize="xs" color={mutedTextColor}>
                      {table.extendedField.length} 行数据
                    </Text>
                  </Box>
                ))
              )}
            </VStack>
          </Box>
        </Box>

        {/* 主内容区域 */}
        <Box flex={1} overflow="hidden">
          {currentTable ? (
            <>
              {/* 表格工具栏 */}
              <TableToolbar
                onCreateTable={handleCreateTable}
                onFieldManager={onFieldManagerOpen}
                onImportData={() => console.log('导入数据')}
                onExportData={() => console.log('导出数据')}
                onExportExcel={() => console.log('导出Excel')}
                onRefresh={() => {
                  fetchTables()
                  fetchStats()
                }}
                onSearch={setSearchTerm}
                loading={tableLoading}
              />

              {/* 数据表格 */}
              <Card p={0} overflow="hidden">
                <DataTable
                  data={currentTable.extendedField}
                  fields={currentTable.tableFields}
                  selectedRows={selectedRows}
                  onRowSelect={handleRowSelect}
                  onSelectAll={handleSelectAll}
                  onRowUpdate={handleRowUpdate}
                  onRowDelete={handleRowDelete}
                  onRowDuplicate={handleRowDuplicate}
                  onAddRow={handleAddRow}
                  onFieldSort={handleFieldSort}
                  loading={tableLoading}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  pendingRow={pendingRow}
                  onPendingRowUpdate={handlePendingRowUpdate}
                  onPendingRowSave={handlePendingRowSave}
                  onPendingRowCancel={handlePendingRowCancel}
                  isAddingRow={isAddingRow}
                  isDeletingRow={isDeletingRow}
                  pendingDeleteRowId={pendingDeleteRow?.id}
                />
              </Card>

              {/* 批量操作栏 */}
              <BatchOperationBar
                selectedCount={selectedRows.length}
                onBatchEdit={handleBatchEdit}
                onBatchDelete={handleBatchDelete}
                onExportSelected={handleExportSelected}
                onClearSelection={() => setSelectedRows([])}
              />
            </>
          ) : (
            <Card>
              <Flex direction="column" align="center" justify="center" py={12}>
                <RiFileTextLine size="48px" color="gray.400" />
                <Text mt={4} color={mutedTextColor} textAlign="center">
                  请从左侧选择或创建一个{selectedType}表格
                </Text>
                <Button
                  mt={4}
                  leftIcon={<RiAddLine />}
                  colorScheme="blue"
                  onClick={handleCreateTable}
                >
                  创建新表格
                </Button>
              </Flex>
            </Card>
          )}
        </Box>
      </Flex>

      {/* 字段管理模态框 */}
      {currentTable && (
        <FieldManagerModal
          isOpen={isFieldManagerOpen}
          onClose={onFieldManagerClose}
          fields={currentTable.tableFields}
          onFieldOperation={handleFieldOperation}
        />
      )}

      {/* 创建表格模态框 */}
      <Modal isOpen={isCreateTableOpen} onClose={onCreateTableClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            新建{createTableForm.type}数据表
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!formErrors.readme} isRequired>
                <FormLabel>📖 表格说明</FormLabel>
                <Textarea
                  value={createTableForm.readme}
                  onChange={(e) => setCreateTableForm(prev => ({ ...prev, readme: e.target.value }))}
                  placeholder="请输入表格用途说明（至少10个字符）"
                  rows={4}
                />
                <FormErrorMessage>{formErrors.readme}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>💡 示例数据</FormLabel>
                <Textarea
                  value={createTableForm.exampleData}
                  onChange={(e) => setCreateTableForm(prev => ({ ...prev, exampleData: e.target.value }))}
                  placeholder="可选的示例数据说明"
                  rows={3}
                />
              </FormControl>

              <HStack spacing={6}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>👁️ 可见性</FormLabel>
                  <Switch
                    isChecked={createTableForm.visibility}
                    onChange={(e) => setCreateTableForm(prev => ({ ...prev, visibility: e.target.checked }))}
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>🌐 公开性</FormLabel>
                  <Switch
                    isChecked={createTableForm.isPublic}
                    onChange={(e) => setCreateTableForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                </FormControl>
              </HStack>

              <Grid templateColumns="1fr 1fr" gap={4}>
                <FormControl>
                  <FormLabel>应用代码</FormLabel>
                  <Input
                    value={createTableForm.appCode}
                    onChange={(e) => setCreateTableForm(prev => ({ ...prev, appCode: e.target.value }))}
                    placeholder="请输入应用代码，如：loomi"
                  />
                </FormControl>

                <FormControl isInvalid={!!formErrors.amount}>
                  <FormLabel>金额 (元)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createTableForm.amount}
                    onChange={(e) => setCreateTableForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="请输入金额，如：199.99"
                  />
                  <FormErrorMessage>{formErrors.amount}</FormErrorMessage>
                </FormControl>
              </Grid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateTableClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleCreateTableSubmit}>
              创建表格
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除行确认对话框 */}
      <AlertDialog
        isOpen={!!pendingDeleteRow}
        leastDestructiveRef={cancelRef}
        onClose={cancelRowDelete}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              确认删除行
            </AlertDialogHeader>

            <AlertDialogBody>
              确定要删除行"{pendingDeleteRow?.title}"吗？
              <br />
              <Text fontSize="sm" color="gray.500" mt={2}>
                此操作无法撤销
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={cancelRowDelete} isDisabled={isDeletingRow}>
                取消
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmRowDelete} 
                ml={3}
                isLoading={isDeletingRow}
                loadingText="删除中..."
              >
                删除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </PageLayout>
  )
}