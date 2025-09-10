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
} from 'react-icons/ri'
import { useState } from 'react'

interface TableToolbarProps {
  onCreateTable: () => void
  onFieldManager: () => void
  onImportData: () => void
  onExportData: () => void
  onExportExcel: () => void
  onRefresh: () => void
  onSearch: (searchTerm: string) => void
  searchPlaceholder?: string
  loading?: boolean
}

export function TableToolbar({
  onCreateTable,
  onFieldManager,
  onImportData,
  onExportData,
  onExportExcel,
  onRefresh,
  onSearch,
  searchPlaceholder = "搜索表格数据...",
  loading = false,
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
        <Button
          leftIcon={<RiAddLine />}
          colorScheme="blue"
          onClick={onCreateTable}
          size="sm"
        >
          新建表
        </Button>
        
        <Button
          leftIcon={<RiSettings3Line />}
          variant="outline"
          onClick={onFieldManager}
          size="sm"
        >
          字段管理
        </Button>
        
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
              导入数据
            </MenuItem>
            <MenuItem icon={<RiDownloadLine />} onClick={onExportData}>
              导出数据
            </MenuItem>
            <MenuItem icon={<RiFileExcelLine />} onClick={onExportExcel}>
              导出为Excel
            </MenuItem>
          </MenuList>
        </Menu>
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