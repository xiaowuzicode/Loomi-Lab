import {
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'

export function SystemConfigPage() {
  const textColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <Box>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            ⚙️ 系统配置
          </Heading>
          <Text color={textColor} opacity={0.7}>
            管理系统参数，配置Token计费和业务规则
          </Text>
        </Box>

        <Box p={8} textAlign="center">
          <Text color={textColor} opacity={0.6}>
            系统配置页面开发中...
          </Text>
          <Text fontSize="sm" color={textColor} opacity={0.4} mt={2}>
            将支持价格配置、系统参数、权限管理等功能
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
