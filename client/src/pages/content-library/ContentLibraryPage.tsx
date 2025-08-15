import {
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'

export function ContentLibraryPage() {
  const textColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <Box>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            📚 爆文库管理
          </Heading>
          <Text color={textColor} opacity={0.7}>
            管理优质内容模板，支持关键词搜索和内容复用
          </Text>
        </Box>

        <Box p={8} textAlign="center">
          <Text color={textColor} opacity={0.6}>
            爆文库管理页面开发中...
          </Text>
          <Text fontSize="sm" color={textColor} opacity={0.4} mt={2}>
            将支持内容分类、标签管理、搜索筛选等功能
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
