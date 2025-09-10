'use client'

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
  onFieldRename?: (field: string) => void
  onFieldDelete?: (field: string) => void
  loading?: boolean
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  pendingRow?: TableRow | null
  onPendingRowUpdate?: (field: string, value: string) => void
  onPendingRowSave?: () => Promise<void>
  onPendingRowCancel?: () => void
  isAddingRow?: boolean
  isDeletingRow?: boolean
  pendingDeleteRowId?: number
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
  onFieldRename,
  onFieldDelete,
  loading = false,
  sortField,
  sortOrder,
  pendingRow,
  onPendingRowUpdate,
  onPendingRowSave,
  onPendingRowCancel,
  isAddingRow = false,
  isDeletingRow = false,
  pendingDeleteRowId,
}: DataTableProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700')
  
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
    <TableContainer>
      <Table variant="simple" size="md">
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
              const isTitle = field === '标题'
              const canSort = onFieldSort && field !== '标题'
              const canManage = onFieldRename || onFieldDelete
              const isSorted = sortField === field
              
              return (
                <Th key={field} minW="120px" maxW="300px">
                  <HStack spacing={2} justify="space-between">
                    <Text fontWeight="semibold" flex={1} noOfLines={1}>
                      {field}
                    </Text>
                    
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
                      
                      {/* 字段管理菜单 */}
                      {canManage && !isTitle && (
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<RiMoreLine />}
                            size="xs"
                            variant="ghost"
                            aria-label="字段操作"
                          />
                          <MenuList>
                            {onFieldFilter && (
                              <MenuItem icon={<RiFilterLine />} onClick={() => onFieldFilter(field)}>
                                筛选
                              </MenuItem>
                            )}
                            {onFieldRename && (
                              <MenuItem icon={<RiEditLine />} onClick={() => onFieldRename(field)}>
                                重命名
                              </MenuItem>
                            )}
                            {onFieldDelete && (
                              <MenuItem
                                icon={<RiDeleteBinLine />}
                                onClick={() => onFieldDelete(field)}
                                color="red.500"
                              >
                                删除字段
                              </MenuItem>
                            )}
                          </MenuList>
                        </Menu>
                      )}
                    </HStack>
                  </HStack>
                </Th>
              )
            })}
            
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
                bg={isSelected ? useColorModeValue('blue.50', 'blue.900') : bgColor}
                _hover={{ bg: isSelected ? useColorModeValue('blue.100', 'blue.800') : hoverBgColor }}
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
                {fields.map((field) => (
                  <Td key={field} maxW="300px" p={1}>
                    <EditableCell
                      value={row[field] || ''}
                      onSave={(newValue) => handleCellUpdate(row.id, field, newValue)}
                      isTitle={field === '标题'}
                      placeholder={`输入${field}...`}
                    />
                  </Td>
                ))}

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
                      isDisabled={isDeletingRow || !!pendingRow}
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
                      isDisabled={isDeletingRow || !!pendingRow}
                    />
                  </HStack>
                </Td>
              </Tr>
            )
          })}

          {/* 待编辑的新行 */}
          {pendingRow && (
            <Tr bg={useColorModeValue('green.50', 'green.900')} borderWidth="2px" borderColor="green.300">
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
              {fields.map((field) => (
                <Td key={field} maxW="300px" p={1}>
                  <EditableCell
                    value={pendingRow[field] || ''}
                    onSave={(newValue) => onPendingRowUpdate?.(field, newValue)}
                    isTitle={field === '标题'}
                    placeholder={`输入${field}...`}
                    autoFocus={field === '标题'}
                  />
                </Td>
              ))}

              {/* 保存/取消按钮 */}
              <Td>
                <HStack spacing={1}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={onPendingRowSave}
                    isLoading={isAddingRow}
                    loadingText="保存中"
                  >
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onPendingRowCancel}
                    isDisabled={isAddingRow}
                  >
                    取消
                  </Button>
                </HStack>
              </Td>
            </Tr>
          )}

          {/* 添加新行按钮 */}
          {!pendingRow && (
            <Tr bg="gray.25" _hover={{ bg: "gray.50" }}>
              <Td colSpan={2} position="sticky" left={0} bg="inherit" zIndex={1}>
                <Icon as={RiAddLine} color="gray.400" />
              </Td>
              <Td colSpan={fields.length + 1}>
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