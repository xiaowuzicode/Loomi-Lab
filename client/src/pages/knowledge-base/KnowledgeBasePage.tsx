import {
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react'

export function KnowledgeBasePage() {
  const textColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <Box>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            🧠 知识库管理
            <Badge ml={3} colorScheme="purple" variant="subtle">
              AI
            </Badge>
          </Heading>
          <Text color={textColor} opacity={0.7}>
            管理人设向量库，配置RAG系统和知识检索
          </Text>
        </Box>

        <Box p={8} textAlign="center">
          <Text color={textColor} opacity={0.6}>
            知识库管理页面开发中...
          </Text>
          <Text fontSize="sm" color={textColor} opacity={0.4} mt={2}>
            将支持向量库管理、RAG测试、文档上传等功能
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
