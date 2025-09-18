'use client'

import { useState } from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  IconButton,
  HStack,
  Text,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  Skeleton,
  Icon,
  Button,
  Input,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiAddLine,
  RiSortAsc,
  RiSortDesc,
  RiFilterLine,
  RiCheckLine,
  RiCloseLine,
  RiCloseCircleLine,
} from 'react-icons/ri'
import { TableRow } from '@/types'
import { EditableCell } from './EditableCell'

interface DataTableProps {
  data: TableRow[]
  fields: string[]
  selectedRows: number[]
  onRowSelect: (rowId: number) => void
  onSelectAll: (selected: boolean) => void
  onRowUpdate: (rowId: number, field: string, value: string) => Promise<void>
  onRowDelete: (rowId: number) => void
  onRowDuplicate: (rowId: number) => void
  onAddRow: () => void
  onFieldSort?: (field: string) => void
  onFieldFilter?: (field: string) => void
  onFieldDelete?: (field: string) => void
  onFieldRename?: (oldName: string, newName: string) => void
  editingField?: string | null
  onEditingFieldChange?: (field: string | null) => void
  pendingFieldRenames?: { oldName: string; newName: string }[]
  onCancelRename?: () => void
  onAddField?: () => void
  pendingNewField?: string | null
  onPendingFieldUpdate?: (fieldName: string) => void
  onPendingFieldSave?: () => Promise<void>
  onPendingFieldCancel?: () => void
  isAddingField?: boolean
  loading?: boolean
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  newRows?: { tempId: string; data: Record<string, string> }[]
  onNewRowUpdate?: (tempId: string, field: string, value: string) => void
  isAddingRow?: boolean
  isDeletingRow?: boolean
  pendingDeleteRowId?: number
  pendingCellUpdates?: { rowId: number; field: string; value: string; originalValue: string }[]
  onCellValueChange?: (rowId: number, field: string, value: string, originalValue: string) => void
}

export function DataTable({
  data = [],
  fields = [],
  selectedRows = [],
  onRowSelect,
  onSelectAll,
  onRowUpdate,
  onRowDelete,
  onRowDuplicate,
  onAddRow,
  onFieldSort,
  onFieldFilter,
  onFieldDelete,
  onFieldRename,
  editingField,
  onEditingFieldChange,
  pendingFieldRenames,
  onCancelRename,
  onAddField,
  pendingNewField,
  onPendingFieldUpdate,
  onPendingFieldSave,
  onPendingFieldCancel,
  isAddingField = false,
  loading = false,
  sortField,
  sortOrder,
  newRows = [],
  onNewRowUpdate,
  isAddingRow = false,
  isDeletingRow = false,
  pendingDeleteRowId,
  pendingCellUpdates = [],
  onCellValueChange,
}: DataTableProps) {
  const [tempFieldName, setTempFieldName] = useState<string>('')
  
  // 当开始编辑时初始化临时值
  const handleStartEditing = (fieldName: string) => {
    setTempFieldName(fieldName)
    onEditingFieldChange?.(fieldName)
  }
  
  // 当停止编辑时清空临时值
  const handleStopEditing = () => {
    setTempFieldName('')
    onEditingFieldChange?.(null)
  }
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700')
  
  // 选中行的颜色配置
  const selectedBgColor = useColorModeValue('blue.50', 'blue.800')
  const selectedHoverBgColor = useColorModeValue('blue.100', 'blue.700')
  
  // 新行的颜色配置
  const newRowBgColor = useColorModeValue('green.50', 'green.800')
  const newRowBorderColor = useColorModeValue('green.300', 'green.500')
  
  const allSelected = data.length > 0 && selectedRows.length === data.length
  const indeterminate = selectedRows.length > 0 && selectedRows.length < data.length

  const handleCellUpdate = async (rowId: number, field: string, value: string) => {
    await onRowUpdate(rowId, field, value)
  }

  if (loading) {
    return (
      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th w="40px">
                <Skeleton height="20px" width="20px" />
              </Th>
              <Th w="60px">
                <Skeleton height="20px" width="40px" />
              </Th>
              {fields.map((field, index) => (
                <Th key={field} minW="120px">
                  <Skeleton height="20px" width="80px" />
                </Th>
              ))}
              <Th w="120px">
                <Skeleton height="20px" width="60px" />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <Tr key={index}>
                <Td>
                  <Skeleton height="20px" width="20px" />
                </Td>
                <Td>
                  <Skeleton height="20px" width="30px" />
                </Td>
                {fields.map((field) => (
                  <Td key={field}>
                    <Skeleton height="60px" width="full" />
                  </Td>
                ))}
                <Td>
                  <Skeleton height="30px" width="100px" />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <TableContainer overflowX="auto">
      <Table variant="simple" size="md" style={{ minWidth: '800px' }}>
        {/* 表头 */}
        <Thead bg={hoverBgColor}>
          <Tr>
            <Th w="40px" position="sticky" left={0} bg={hoverBgColor} zIndex={1}>
              <Checkbox
                isChecked={allSelected}
                isIndeterminate={indeterminate}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </Th>
            <Th w="60px" position="sticky" left="40px" bg={hoverBgColor} zIndex={1}>
              ID
            </Th>
            
            {/* 动态字段表头 */}
            {fields.map((field) => {
              const isTitle = false
              const canSort = !!onFieldSort
              const canManage = onFieldFilter
              const isSorted = sortField === field
              
              return (
                <Th 
                  key={field} 
                  minW="120px" 
                  maxW="300px"
                  {...(isTitle ? {
                    position: 'sticky',
                    left: '100px',
                    bg: hoverBgColor,
                    zIndex: 1
                  } : {})}
                >
                  <Box
                    role="group"
                    _hover={{}}
                  >
                    <HStack spacing={2} justify="space-between">
                      {editingField === field ? (
                        <Input
                          value={tempFieldName}
                          onChange={(e) => {
                            setTempFieldName(e.target.value)
                          }}
                          onBlur={(e) => {
                            const newName = e.target.value.trim()
                            if (newName && newName !== field && onFieldRename) {
                              onFieldRename(field, newName)
                            }
                            handleStopEditing()
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newName = e.currentTarget.value.trim()
                              if (newName && newName !== field && onFieldRename) {
                                onFieldRename(field, newName)
                              }
                              handleStopEditing()
                            } else if (e.key === 'Escape') {
                              handleStopEditing()
                            }
                          }}
                          size="sm"
                          fontWeight="semibold"
                          border="1px solid"
                          borderColor="blue.300"
                          autoFocus
                          onFocus={(e) => e.target.select()}
                          flex={1}
                          minWidth="80px"
                          maxWidth="150px"
                        />
                      ) : (
                        <Text 
                          fontWeight="semibold" 
                          flex={1} 
                          noOfLines={1}
                          onDoubleClick={() => {
                            if (!isTitle && onFieldRename) {
                              handleStartEditing(field)
                            }
                          }}
                          cursor={!isTitle ? "pointer" : "default"}
                          _hover={!isTitle ? { bg: "gray.100" } : {}}
                          px={1}
                          borderRadius="sm"
                          title={!isTitle ? "双击重命名" : ""}
                          color={pendingFieldRenames?.find(r => r.oldName === field) ? "orange.500" : "inherit"}
                          fontStyle={pendingFieldRenames?.find(r => r.oldName === field) ? "italic" : "normal"}
                        >
                          {pendingFieldRenames?.find(r => r.oldName === field)?.newName || field}
                        </Text>
                      )}
                      
                      <HStack spacing={1}>
                        {/* 排序按钮 */}
                        {canSort && (
                          <IconButton
                            icon={
                              isSorted ? (
                                sortOrder === 'asc' ? <RiSortAsc /> : <RiSortDesc />
                              ) : (
                                <RiSortAsc />
                              )
                            }
                            size="xs"
                            variant="ghost"
                            opacity={isSorted ? 1 : 0.5}
                            onClick={() => onFieldSort(field)}
                            aria-label="排序"
                          />
                        )}
                        
                        {/* 删除字段按钮（hover显示） */}
                        {onFieldDelete && !isTitle && (
                          <IconButton
                            icon={<RiCloseCircleLine />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            opacity={0}
                            _groupHover={{ opacity: 1 }}
                            onClick={() => onFieldDelete(field)}
                            aria-label="删除字段"
                            title="删除字段"
                          />
                        )}
                        
                        {/* 筛选菜单 */}
                        {onFieldFilter && !isTitle && (
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<RiMoreLine />}
                              size="xs"
                              variant="ghost"
                              aria-label="字段操作"
                            />
                            <MenuList>
                              <MenuItem icon={<RiFilterLine />} onClick={() => onFieldFilter(field)}>
                                筛选
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        )}
                      </HStack>
                    </HStack>
                  </Box>
                </Th>
              )
            })}
            
            {/* 添加新字段列 */}
            {onAddField && (
              <Th minW="150px" maxW="200px">
                {pendingNewField !== null ? (
                  <HStack spacing={2}>
                    <Input
                      value={pendingNewField}
                      onChange={(e) => onPendingFieldUpdate?.(e.target.value)}
                      size="sm"
                      placeholder="输入字段名"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onPendingFieldSave?.()
                        } else if (e.key === 'Escape') {
                          onPendingFieldCancel?.()
                        }
                      }}
                      autoFocus
                    />
                    <IconButton
                      icon={<RiCheckLine />}
                      size="xs"
                      colorScheme="green"
                      onClick={onPendingFieldSave}
                      isLoading={isAddingField}
                      aria-label="保存字段"
                    />
                    <IconButton
                      icon={<RiCloseLine />}
                      size="xs"
                      variant="ghost"
                      onClick={onPendingFieldCancel}
                      isDisabled={isAddingField}
                      aria-label="取消"
                    />
                  </HStack>
                ) : (
                  <IconButton
                    icon={<RiAddLine />}
                    size="sm"
                    variant="ghost"
                    onClick={onAddField}
                    color="gray.500"
                    _hover={{ color: 'blue.500', bg: 'blue.50' }}
                    aria-label="添加字段"
                    title="添加字段"
                  />
                )}
              </Th>
            )}
            
            <Th w="120px">操作</Th>
          </Tr>
        </Thead>

        {/* 表身 */}
        <Tbody>
          {data.map((row, rowIndex) => {
            const isSelected = selectedRows.includes(row.id)
            
            return (
              <Tr
                key={row.id}
                bg={isSelected ? selectedBgColor : bgColor}
                _hover={{ bg: isSelected ? selectedHoverBgColor : hoverBgColor }}
                role="group"
              >
                {/* 选择框 */}
                <Td position="sticky" left={0} bg="inherit" zIndex={1}>
                  <Checkbox
                    isChecked={isSelected}
                    onChange={() => onRowSelect(row.id)}
                  />
                </Td>
                
                {/* 行ID */}
                <Td position="sticky" left="40px" bg="inherit" zIndex={1}>
                  <Badge variant="outline" colorScheme="gray">
                    {row.id}
                  </Badge>
                </Td>

                {/* 动态字段单元格 */}
                {fields.map((field) => {
                  const isTitle = false
                  return (
                    <Td 
                      key={field} 
                      maxW="300px" 
                      p={1}
                      {...(isTitle ? {
                        position: 'sticky',
                        left: '100px',
                        bg: 'inherit',
                        zIndex: 1
                      } : {})}
                    >
                      <EditableCell
                        value={pendingCellUpdates.find(u => u.rowId === row.id && u.field === field)?.value || row[field] || ''}
                        originalValue={row[field] || ''}
                        onValueChange={(newValue) => onCellValueChange?.(row.id, field, newValue, row[field] || '')}
                        isTitle={isTitle}
                        placeholder={`输入${field}...`}
                        isPending={!!pendingCellUpdates.find(u => u.rowId === row.id && u.field === field)}
                      />
                    </Td>
                  )
                })}

                {/* 新字段列占位 */}
                {onAddField && (
                  <Td minW="150px" maxW="200px">
                    {/* 空单元格，等待字段添加后显示内容 */}
                  </Td>
                )}

                {/* 操作按钮 */}
                <Td>
                  <HStack spacing={1}>
                    <IconButton
                      icon={<RiFileCopyLine />}
                      size="sm"
                      variant="ghost"
                      onClick={() => onRowDuplicate(row.id)}
                      aria-label="复制行"
                      title="复制行"
                      isDisabled={isDeletingRow || newRows.length > 0}
                    />
                    <IconButton
                      icon={<RiDeleteBinLine />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => onRowDelete(row.id)}
                      aria-label="删除行"
                      title="删除行"
                      isLoading={isDeletingRow && pendingDeleteRowId === row.id}
                      isDisabled={isDeletingRow || newRows.length > 0}
                    />
                  </HStack>
                </Td>
              </Tr>
            )
          })}

          {/* 待编辑的新行们 */}
          {newRows.map((newRow) => (
            <Tr key={newRow.tempId} bg={newRowBgColor} borderWidth="2px" borderColor={newRowBorderColor}>
              {/* 选择框 - 禁用状态 */}
              <Td position="sticky" left={0} bg="inherit" zIndex={1}>
                <Checkbox isDisabled />
              </Td>
              
              {/* 新行标识 */}
              <Td position="sticky" left="40px" bg="inherit" zIndex={1}>
                <Badge variant="solid" colorScheme="green">
                  新
                </Badge>
              </Td>

              {/* 字段编辑区域 */}
              {fields.map((field) => {
                const isTitle = false
                return (
                  <Td 
                    key={field} 
                    maxW="300px" 
                    p={1}
                    {...(isTitle ? {
                      position: 'sticky',
                      left: '100px',
                      bg: 'inherit',
                      zIndex: 1
                    } : {})}
                  >
                    <EditableCell
                      value={newRow.data[field] || ''}
                      originalValue=''
                      onValueChange={(newValue) => onNewRowUpdate?.(newRow.tempId, field, newValue)}
                      isTitle={isTitle}
                      placeholder={`输入${field}...`}
                      autoFocus={isTitle}
                      isPending={true}
                    />
                  </Td>
                )
              })}

              {/* 新字段列占位 */}
              {onAddField && (
                <Td minW="150px" maxW="200px">
                  {/* 空单元格 */}
                </Td>
              )}

              {/* 操作列暂时保留空占位 */}
              <Td>
                {/* 操作将通过统一保存按钮处理 */}
              </Td>
            </Tr>
          ))}

          {/* 添加新行按钮 */}
          {newRows.length === 0 && (
            <Tr bg="gray.25" _hover={{ bg: "gray.50" }}>
              <Td colSpan={2} position="sticky" left={0} bg="inherit" zIndex={1}>
                <Icon as={RiAddLine} color="gray.400" />
              </Td>
              <Td colSpan={fields.length + (onAddField ? 2 : 1)}>
                <Button
                  variant="ghost"
                  leftIcon={<RiAddLine />}
                  onClick={onAddRow}
                  w="full"
                  justifyContent="flex-start"
                  color="gray.500"
                  _hover={{ color: 'gray.700', bg: 'gray.100' }}
                  isDisabled={isAddingRow}
                >
                  添加新行...
                </Button>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  )
}