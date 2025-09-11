'use client'

import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
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
  Icon,
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
  RiCloseLine,
  RiInformationLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/custom-fields/DataTable'
import { TableToolbar } from '@/components/custom-fields/TableToolbar'
import { BatchOperationBar } from '@/components/custom-fields/BatchOperationBar'
import { 
  CustomFieldRecord, 
  CustomFieldForm, 
  TableRow, 
  CustomFieldStats 
} from '@/types'
import { useTableCustomFields } from '@/hooks/useTableCustomFields'
import { format } from 'date-fns'
import { exportToExcel } from '@/lib/excel-utils'

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
  const { isOpen: isDeleteTableOpen, onOpen: onDeleteTableOpen, onClose: onDeleteTableClose } = useDisclosure()
  
  // Form states
  const [createTableForm, setCreateTableForm] = useState<CustomFieldForm & { type: string; tableName: string }>({
    appCode: 'loomi',
    type: '洞察',
    tableName: '', // 表名字段，必填
    amount: 0,
    readme: '',
    exampleData: '',
    visibility: true,
    isPublic: false,
    extendedField: [], // 由后端自动创建标题字段
    tableFields: [] // 由后端自动生成
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [pendingDeleteTable, setPendingDeleteTable] = useState<CustomFieldRecord | null>(null)
  
  // 新行管理状态
  const [isAddingRow, setIsAddingRow] = useState(false)
  
  // 新字段管理状态
  const [pendingNewField, setPendingNewField] = useState<string | null>(null)
  const [isAddingField, setIsAddingField] = useState(false)
  
  // 删除行确认状态
  const [pendingDeleteRow, setPendingDeleteRow] = useState<{ id: number, title: string } | null>(null)
  const [isDeletingRow, setIsDeletingRow] = useState(false)
  
  // 删除字段确认状态
  const [pendingDeleteField, setPendingDeleteField] = useState<string | null>(null)
  const [isDeletingField, setIsDeletingField] = useState(false)
  
  // 重命名字段状态
  const [editingField, setEditingField] = useState<string | null>(null)
  
  // 删除表格确认状态
  const [isDeletingTable, setIsDeletingTable] = useState(false)
  
  // 未保存的更改状态管理
  const [pendingChanges, setPendingChanges] = useState<{
    fieldRenames: { oldName: string; newName: string }[]
    cellUpdates: { rowId: number; field: string; value: string; originalValue: string }[]
    newRows: { tempId: string; data: Record<string, string> }[]
  }>({
    fieldRenames: [],
    cellUpdates: [],
    newRows: []
  })
  const [isSavingChanges, setIsSavingChanges] = useState(false)

  const cancelRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()

  // 颜色主题
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400')
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700')
  
  // 选中状态的颜色配置（与DataTable保持一致）
  const selectedBgColor = useColorModeValue('blue.50', 'blue.800')
  const selectedHoverBgColor = useColorModeValue('blue.100', 'blue.700')

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
      tableName: '', // 初始化表名字段
      amount: 0,
      readme: '',
      exampleData: '',
      visibility: true,
      isPublic: false,
      extendedField: [], // 由后端自动创建标题字段
      tableFields: [] // 由后端自动生成
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
    if (!currentTable) return
    
    // 生成临时ID
    const tempId = `temp_${Date.now()}`
    
    // 创建新行数据
    const newRowData: Record<string, string> = {}
    currentTable.tableFields.forEach(field => {
      newRowData[field] = ''
    })
    
    // 添加到未保存更改
    addNewRow(tempId, newRowData)
  }

  const handleNewRowUpdate = (tempId: string, field: string, value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      newRows: prev.newRows.map(row => 
        row.tempId === tempId 
          ? { ...row, data: { ...row.data, [field]: value } }
          : row
      )
    }))
  }


  // 字段管理函数
  const handleAddField = () => {
    if (!currentTable) return
    
    // 如果已经在编辑状态，先取消
    if (pendingNewField !== null) {
      setPendingNewField(null)
      return
    }
    
    // 开始编辑新字段
    setPendingNewField('')
  }

  const handlePendingFieldUpdate = (fieldName: string) => {
    setPendingNewField(fieldName)
  }

  const handlePendingFieldSave = async () => {
    if (!currentTable || !pendingNewField?.trim()) {
      toast({
        title: '字段名不能为空',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (currentTable.tableFields.includes(pendingNewField.trim())) {
      toast({
        title: '字段名已存在',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsAddingField(true)
    try {
      const updatedTable = await updateTableFields(currentTable.id, {
        action: 'add',
        fieldName: pendingNewField.trim(),
      })
      
      if (updatedTable) {
        setPendingNewField(null)
        toast({
          title: '字段添加成功',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('添加字段失败:', error)
      toast({
        title: '添加字段失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsAddingField(false)
    }
  }

  const handlePendingFieldCancel = () => {
    setPendingNewField(null)
    setIsAddingField(false)
  }

  // 删除字段相关函数
  const handleFieldDelete = (fieldName: string) => {
    if (fieldName === '标题') {
      toast({
        title: '标题字段不可删除',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    setPendingDeleteField(fieldName)
  }

  const confirmDeleteField = async () => {
    if (!currentTable || !pendingDeleteField) return
    
    setIsDeletingField(true)
    try {
      const updatedTable = await updateTableFields(currentTable.id, {
        action: 'remove',
        fieldName: pendingDeleteField,
      })
      
      if (updatedTable) {
        setPendingDeleteField(null)
        toast({
          title: '字段删除成功',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('删除字段失败:', error)
      toast({
        title: '删除字段失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDeletingField(false)
    }
  }

  const cancelDeleteField = () => {
    setPendingDeleteField(null)
  }

  const handleFieldSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // 重命名字段函数（现在只更新显示，不立即保存）
  const handleFieldRename = (oldName: string, newName: string) => {
    if (!currentTable || oldName === newName) return
    
    if (oldName === '标题') {
      toast({
        title: '标题字段不可重命名',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    // 检查是否与其他字段名冲突（包括原始字段和pending重命名）
    const allFieldNames = [
      ...currentTable.tableFields,
      ...pendingChanges.fieldRenames.map(r => r.newName)
    ].filter(name => name !== oldName) // 排除当前正在重命名的字段
    
    if (allFieldNames.includes(newName)) {
      toast({
        title: '字段名已存在',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    // 添加到未保存更改
    addFieldRename(oldName, newName)
  }
  
  // 取消重命名
  const handleCancelRename = () => {
    setEditingField(null)
  }
  
  // 删除表格函数
  const handleTableDelete = (table: CustomFieldRecord) => {
    setPendingDeleteTable(table)
    onDeleteTableOpen()
  }
  
  const confirmTableDelete = async () => {
    if (!pendingDeleteTable) return
    
    setIsDeletingTable(true)
    try {
      const success = await hookDeleteTable(pendingDeleteTable.id)
      
      if (success) {
        // 如果删除的是当前选中的表，清空选中状态
        if (currentTable?.id === pendingDeleteTable.id) {
          setCurrentTable(null)
        }
        
        setPendingDeleteTable(null)
        onDeleteTableClose()
        
        toast({
          title: '删除成功',
          description: `表格“${pendingDeleteTable.tableName}”已删除`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
        
        // 刷新表格列表和统计数据
        await fetchTables()
        await fetchStats()
      }
    } catch (error) {
      console.error('删除表格失败:', error)
      toast({
        title: '删除表格失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDeletingTable(false)
    }
  }
  
  const cancelTableDelete = () => {
    setPendingDeleteTable(null)
    onDeleteTableClose()
  }
  
  // 检查是否有未保存的更改
  const hasUnsavedChanges = () => {
    return pendingChanges.fieldRenames.length > 0 || 
           pendingChanges.cellUpdates.length > 0 || 
           pendingChanges.newRows.length > 0
  }
  
  // 清空所有未保存的更改
  const clearPendingChanges = () => {
    setPendingChanges({
      fieldRenames: [],
      cellUpdates: [],
      newRows: []
    })
  }
  
  // 添加字段重命名到未保存更改
  const addFieldRename = (oldName: string, newName: string) => {
    setPendingChanges(prev => ({
      ...prev,
      fieldRenames: [
        ...prev.fieldRenames.filter(r => r.oldName !== oldName),
        { oldName, newName }
      ]
    }))
  }
  
  // 添加单元格更新到未保存更改
  const addCellUpdate = (rowId: number, field: string, value: string, originalValue: string) => {
    setPendingChanges(prev => ({
      ...prev,
      cellUpdates: [
        ...prev.cellUpdates.filter(u => !(u.rowId === rowId && u.field === field)),
        { rowId, field, value, originalValue }
      ]
    }))
  }
  
  // 添加新行到未保存更改
  const addNewRow = (tempId: string, data: Record<string, string>) => {
    setPendingChanges(prev => ({
      ...prev,
      newRows: [
        ...prev.newRows.filter(r => r.tempId !== tempId),
        { tempId, data }
      ]
    }))
  }
  
  // 统一保存所有更改
  const saveAllChanges = async () => {
    if (!currentTable || !hasUnsavedChanges()) return
    
    setIsSavingChanges(true)
    try {
      // 1. 保存字段重命名
      for (const rename of pendingChanges.fieldRenames) {
        if (rename.oldName !== rename.newName) {
          await updateTableFields(currentTable.id, {
            action: 'rename',
            fieldName: rename.oldName,
            newFieldName: rename.newName,
          })
        }
      }
      
      // 2. 保存单元格更新
      for (const update of pendingChanges.cellUpdates) {
        if (update.value !== update.originalValue) {
          await updateCellValue(currentTable.id, update.rowId, update.field, update.value)
        }
      }
      
      // 3. 保存新增行
      for (const newRow of pendingChanges.newRows) {
        await updateTableRow(currentTable.id, 'add', undefined, newRow.data)
      }
      
      // 清空未保存更改
      clearPendingChanges()
      
      toast({
        title: '保存成功',
        description: '所有更改已保存',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
      
    } catch (error) {
      console.error('保存失败:', error)
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSavingChanges(false)
    }
  }
  
  // Excel导出功能
  const handleExportExcel = async () => {
    if (!currentTable) {
      toast({
        title: '请先选择一个表格',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const result = await exportToExcel(
        currentTable,
        undefined, // 导出所有数据
        `${currentTable.tableName}_完整数据_${new Date().toISOString().split('T')[0]}`
      )
      
      toast({
        title: '导出成功',
        description: `已导出Excel文件，包含 ${result.count} 条数据`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('导出失败:', error)
      toast({
        title: '导出失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // 批量删除函数
  const handleBatchDelete = async () => {
    if (!currentTable || selectedRows.length === 0) return
    
    try {
      // 逐个删除选中的行
      for (const rowId of selectedRows) {
        await updateTableRow(currentTable.id, 'delete', rowId)
      }
      setSelectedRows([])
      toast({
        title: '删除成功',
        description: `已删除 ${selectedRows.length} 条记录`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('批量删除失败:', error)
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleExportSelected = async () => {
    if (!currentTable || selectedRows.length === 0) {
      toast({
        title: '请选择要导出的数据',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      // 获取选中的数据
      const selectedData = currentTable.extendedField.filter(row => 
        selectedRows.includes(row.id)
      )
      
      // 导出为Excel文件
      const result = await exportToExcel(
        currentTable,
        selectedData,
        `${currentTable.tableName}_选中数据_${new Date().toISOString().split('T')[0]}`
      )
      
      toast({
        title: '导出成功',
        description: `已导出Excel文件，包含 ${result.count} 条数据`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('导出失败:', error)
      toast({
        title: '导出失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // 表单验证
  const validateCreateTableForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!createTableForm.tableName.trim()) {
      errors.tableName = '表名是必填的'
    } else if (createTableForm.tableName.trim().length < 2) {
      errors.tableName = '表名至少需要2个字符'
    }

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
            <HStack justify="space-between" align="center" mb={3}>
              <Text fontWeight="semibold" color={textColor}>
                {selectedType}类型表格
              </Text>
            </HStack>
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
                    position="relative"
                    role="group"
                    p={3}
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    cursor="pointer"
                    bg={currentTable?.id === table.id ? selectedBgColor : 'transparent'}
                    _hover={{ bg: currentTable?.id === table.id ? selectedHoverBgColor : selectedBgColor }}
                    onClick={() => handleTableSelect(table)}
                  >
                    <HStack justify="space-between" align="center">
                      <Box flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                          {table.tableName}
                        </Text>
                        <Text fontSize="xs" color={mutedTextColor}>
                          {table.extendedField.length} 行数据
                        </Text>
                      </Box>
                      
                      {/* 删除按钮 - 悬停时显示 */}
                      <IconButton
                        icon={<RiCloseLine />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        aria-label="删除表格"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.2s"
                        onClick={(e) => {
                          e.stopPropagation() // 防止触发表格选择
                          handleTableDelete(table)
                        }}
                        zIndex={1}
                      />
                    </HStack>
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
                onImportData={() => console.log('导入数据')}
                onExportExcel={handleExportExcel}
                onRefresh={() => {
                  fetchTables()
                  fetchStats()
                }}
                onSearch={setSearchTerm}
                loading={tableLoading}
                hasUnsavedChanges={hasUnsavedChanges()}
                unsavedChangesCount={
                  pendingChanges.fieldRenames.length + 
                  pendingChanges.cellUpdates.length + 
                  pendingChanges.newRows.length
                }
                onSaveAllChanges={saveAllChanges}
                isSavingChanges={isSavingChanges}
              />
              
              {/* 未保存更改提示 */}
              {hasUnsavedChanges() && (
                <Box
                  bg="orange.50"
                  borderColor="orange.200"
                  borderWidth="1px"
                  borderRadius="md"
                  p={3}
                  mb={4}
                >
                  <HStack spacing={2}>
                    <Icon as={RiInformationLine} color="orange.500" />
                    <Text fontSize="sm" color="orange.700">
                      您有 <Text as="span" fontWeight="bold">
                        {pendingChanges.fieldRenames.length + pendingChanges.cellUpdates.length + pendingChanges.newRows.length}
                      </Text> 项未保存的更改，请点击“保存更改”按钮进行保存。
                    </Text>
                  </HStack>
                </Box>
              )}

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
                  onFieldDelete={handleFieldDelete}
                  onFieldRename={handleFieldRename}
                  editingField={editingField}
                  onEditingFieldChange={setEditingField}
                  pendingFieldRenames={pendingChanges.fieldRenames}
                  onCancelRename={handleCancelRename}
                  onAddField={handleAddField}
                  pendingNewField={pendingNewField}
                  onPendingFieldUpdate={handlePendingFieldUpdate}
                  onPendingFieldSave={handlePendingFieldSave}
                  onPendingFieldCancel={handlePendingFieldCancel}
                  isAddingField={isAddingField}
                  loading={tableLoading}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  newRows={pendingChanges.newRows}
                  onNewRowUpdate={handleNewRowUpdate}
                  isAddingRow={isAddingRow}
                  isDeletingRow={isDeletingRow}
                  pendingDeleteRowId={pendingDeleteRow?.id}
                  pendingCellUpdates={pendingChanges.cellUpdates}
                  onCellValueChange={addCellUpdate}
                />
              </Card>

              {/* 批量操作栏 */}
              <BatchOperationBar
                selectedCount={selectedRows.length}
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
              <FormControl isInvalid={!!formErrors.tableName} isRequired>
                <FormLabel>表名</FormLabel>
                <Input
                  value={createTableForm.tableName}
                  onChange={(e) => setCreateTableForm(prev => ({ ...prev, tableName: e.target.value }))}
                  placeholder="请输入表格名称"
                />
                <FormErrorMessage>{formErrors.tableName}</FormErrorMessage>
              </FormControl>
              
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
              确定要删除行“{pendingDeleteRow?.title}”吗？
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

      {/* 删除字段确认对话框 */}
      <AlertDialog
        isOpen={!!pendingDeleteField}
        leastDestructiveRef={cancelRef}
        onClose={cancelDeleteField}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              确认删除字段
            </AlertDialogHeader>

            <AlertDialogBody>
              确定要删除字段“{pendingDeleteField}”吗？
              <br />
              <Text fontSize="sm" color="gray.500" mt={2}>
                删除后，该字段下的所有数据都将丢失，此操作无法撤销
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={cancelDeleteField} isDisabled={isDeletingField}>
                取消
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDeleteField} 
                ml={3}
                isLoading={isDeletingField}
                loadingText="删除中..."
              >
                删除字段
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* 删除表格确认对话框 */}
      <AlertDialog
        isOpen={!!pendingDeleteTable}
        leastDestructiveRef={cancelRef}
        onClose={cancelTableDelete}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              确认删除表格
            </AlertDialogHeader>

            <AlertDialogBody>
              确定要删除表格“{pendingDeleteTable?.tableName}”吗？
              <br />
              <Text fontSize="sm" color="gray.500" mt={2}>
                表格中的所有数据都将丢失，此操作无法撤销
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={cancelTableDelete} isDisabled={isDeletingTable}>
                取消
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmTableDelete} 
                ml={3}
                isLoading={isDeletingTable}
                loadingText="删除中..."
              >
                删除表格
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </PageLayout>
  )
}