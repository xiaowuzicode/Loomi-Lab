'use client'

import {
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Spacer,
} from '@chakra-ui/react'
import {
  RiAddLine,
  RiSettings3Line,
  RiMoreLine,
  RiUploadLine,
  RiDownloadLine,
  RiFileExcelLine,
  RiSearchLine,
  RiRefreshLine,
  RiCheckLine,
  RiCloseLine,
  RiFileDownloadLine,
} from 'react-icons/ri'
import { useState } from 'react'

interface TableToolbarProps {
  onCreateTable: () => void
  onImportData: () => void
  onExportExcel: () => void
  onRefresh: () => void
  onSearch: (searchTerm: string) => void
  searchPlaceholder?: string
  loading?: boolean
  // 统一保存相关
  hasUnsavedChanges?: boolean
  unsavedChangesCount?: number
  onSaveAllChanges?: () => void
  isSavingChanges?: boolean
  // 取消修改相关
  onCancelChanges?: () => void
  // 模板下载相关
  onDownloadTemplate?: () => void
  currentType?: '洞察' | '钩子' | '情绪'
  // 显示控制
  showCreateButton?: boolean
  showMoreActions?: boolean
}

export function TableToolbar({
  onCreateTable,
  onImportData,
  onExportExcel,
  onRefresh,
  onSearch,
  searchPlaceholder = "搜索表格数据...",
  loading = false,
  hasUnsavedChanges = false,
  unsavedChangesCount = 0,
  onSaveAllChanges,
  isSavingChanges = false,
  onCancelChanges,
  onDownloadTemplate,
  currentType,
  showCreateButton = true,
  showMoreActions = true,
}: TableToolbarProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm)
    }
  }

  return (
    <HStack spacing={4} mb={4} justify="space-between" flexWrap="wrap">
      {/* 左侧操作按钮 */}
      <HStack spacing={3}>
        {showCreateButton && (
          <Button
            leftIcon={<RiAddLine />}
            colorScheme="blue"
            onClick={onCreateTable}
            size="sm"
          >
            新建表
          </Button>
        )}
        
        {/* 统一保存按钮 */}
        {hasUnsavedChanges && (
          <Button
            leftIcon={<RiCheckLine />}
            colorScheme="green"
            onClick={onSaveAllChanges}
            size="sm"
            isLoading={isSavingChanges}
            loadingText="保存中"
          >
            保存更改 ({unsavedChangesCount})
          </Button>
        )}
        
        {/* 取消修改按钮 */}
        {hasUnsavedChanges && (
          <Button
            leftIcon={<RiCloseLine />}
            colorScheme="gray"
            variant="outline"
            onClick={onCancelChanges}
            size="sm"
            isDisabled={isSavingChanges}
          >
            取消修改
          </Button>
        )}
        
        {showMoreActions && (
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<RiMoreLine />}
              variant="outline"
              size="sm"
            >
              更多操作
            </MenuButton>
            <MenuList>
              <MenuItem icon={<RiUploadLine />} onClick={onImportData}>
                导入Excel数据
              </MenuItem>
              <MenuItem icon={<RiFileExcelLine />} onClick={onExportExcel}>
                导出为Excel
              </MenuItem>
              {currentType && onDownloadTemplate && (
                <MenuItem icon={<RiFileDownloadLine />} onClick={onDownloadTemplate}>
                  下载{currentType}导入模板
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        )}
      </HStack>

      {/* 右侧搜索和刷新 */}
      <HStack spacing={3}>
        <InputGroup w="300px" size="sm">
          <InputLeftElement pointerEvents="none">
            <RiSearchLine color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
        </InputGroup>
        
        <IconButton
          icon={<RiRefreshLine />}
          onClick={onRefresh}
          isLoading={loading}
          variant="outline"
          size="sm"
          aria-label="刷新"
          title="刷新数据"
        />
      </HStack>
    </HStack>
  )
}