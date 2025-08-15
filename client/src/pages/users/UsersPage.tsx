import {
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'

export function UsersPage() {
  const textColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <Box>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            👥 用户管理
          </Heading>
          <Text color={textColor} opacity={0.7}>
            管理平台用户，查看用户信息和活动状态
          </Text>
        </Box>

        <Box p={8} textAlign="center">
          <Text color={textColor} opacity={0.6}>
            用户管理页面开发中...
          </Text>
          <Text fontSize="sm" color={textColor} opacity={0.4} mt={2}>
            将支持用户搜索、筛选、状态管理等功能
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
