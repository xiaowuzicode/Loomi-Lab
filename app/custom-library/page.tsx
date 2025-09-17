'use client'

import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import { PageLayout } from '@/components/layout/PageLayout'
import { CustomLibraryView } from './LibraryViewerView'

export default function CustomLibraryPage() {
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <PageLayout>
      <Box mb={8}>
        <Heading size="lg">自定义库</Heading>
        <Text mt={2} fontSize="sm" color={subtitleColor}>
          输入任意用户ID，按类型浏览其所有自定义表数据。
        </Text>
      </Box>

      <CustomLibraryView />
    </PageLayout>
  )
}
