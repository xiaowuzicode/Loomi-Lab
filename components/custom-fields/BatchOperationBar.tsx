'use client'

import {
  Box,
  HStack,
  Text,
  Button,
  Fade,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  RiEditLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiCloseLine,
} from 'react-icons/ri'

interface BatchOperationBarProps {
  selectedCount: number
  onBatchEdit: () => void
  onBatchDelete: () => void
  onExportSelected: () => void
  onClearSelection: () => void
  loading?: boolean
}

export function BatchOperationBar({
  selectedCount,
  onBatchEdit,
  onBatchDelete,
  onExportSelected,
  onClearSelection,
  loading = false,
}: BatchOperationBarProps) {
  const bgColor = useColorModeValue('blue.50', 'blue.900')
  const borderColor = useColorModeValue('blue.200', 'blue.700')
  const textColor = useColorModeValue('blue.800', 'blue.200')

  if (selectedCount === 0) {
    return null
  }

  return (
    <Fade in={selectedCount > 0}>
      <Box
        position="sticky"
        bottom={4}
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        mx={4}
        mb={4}
        boxShadow="lg"
        zIndex={10}
      >
        <HStack justify="space-between" align="center">
          {/* 左侧信息 */}
          <HStack spacing={4}>
            <Text fontWeight="semibold" color={textColor}>
              已选择 {selectedCount} 行
            </Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<RiCloseLine />}
              onClick={onClearSelection}
              color={textColor}
            >
              取消选择
            </Button>
          </HStack>

          {/* 右侧操作按钮 */}
          <HStack spacing={2}>
            <Button
              size="sm"
              leftIcon={<RiEditLine />}
              onClick={onBatchEdit}
              isDisabled={loading}
              colorScheme="blue"
              variant="outline"
            >
              批量编辑
            </Button>
            
            <Button
              size="sm"
              leftIcon={<RiDownloadLine />}
              onClick={onExportSelected}
              isDisabled={loading}
              colorScheme="green"
              variant="outline"
            >
              导出选中
            </Button>
            
            <Button
              size="sm"
              leftIcon={<RiDeleteBinLine />}
              onClick={onBatchDelete}
              isDisabled={loading}
              colorScheme="red"
              variant="outline"
            >
              批量删除
            </Button>
          </HStack>
        </HStack>
      </Box>
    </Fade>
  )
}