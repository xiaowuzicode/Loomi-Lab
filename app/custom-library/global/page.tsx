'use client'

import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import { PageLayout } from '@/components/layout/PageLayout'
import CustomFieldsTablePage from '@/app/custom-fields/table-page'
import { PUBLIC_USER_ID } from '@/lib/constants'

export default function GlobalCustomTablesPage() {
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <PageLayout>
      <Box mb={8}>
        <Heading size="lg">创建公域表</Heading>
        <Text mt={2} fontSize="sm" color={subtitleColor}>
          管理归属 {PUBLIC_USER_ID} 的自定义表，可新建、导入、编辑字段与数据。
        </Text>
      </Box>

      <CustomFieldsTablePage
        userIdOverride={PUBLIC_USER_ID}
        createdUserIdOverride={PUBLIC_USER_ID}
        initialType="全部"
        hideLayout
      />
    </PageLayout>
  )
}


