import {
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react'

export function PromptsPage() {
  const textColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <Box>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            ✍️ 提示词管理
            <Badge ml={3} colorScheme="purple" variant="subtle">
              AI
            </Badge>
          </Heading>
          <Text color={textColor} opacity={0.7}>
            管理AI提示词模板，按Action类型分类优化
          </Text>
        </Box>

        <Box p={8} textAlign="center">
          <Text color={textColor} opacity={0.6}>
            提示词管理页面开发中...
          </Text>
          <Text fontSize="sm" color={textColor} opacity={0.4} mt={2}>
            将支持提示词编辑、版本管理、效果测试等功能
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
