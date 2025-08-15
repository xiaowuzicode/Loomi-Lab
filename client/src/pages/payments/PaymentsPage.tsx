import {
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'

export function PaymentsPage() {
  const textColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <Box>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            💳 支付管理
          </Heading>
          <Text color={textColor} opacity={0.7}>
            管理支付订单，查看交易记录和财务统计
          </Text>
        </Box>

        <Box p={8} textAlign="center">
          <Text color={textColor} opacity={0.6}>
            支付管理页面开发中...
          </Text>
          <Text fontSize="sm" color={textColor} opacity={0.4} mt={2}>
            将支持订单查询、状态管理、财务报表等功能
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
