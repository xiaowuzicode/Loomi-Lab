'use client'

import { Box, Text } from '@chakra-ui/react'

export default function PromptsPageSimple() {
  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold">
        提示词管理 - 简化版本
      </Text>
      <Text mt={4} color="gray.500">
        这是一个简化版本，用于测试组件导入是否正常
      </Text>
    </Box>
  )
}
