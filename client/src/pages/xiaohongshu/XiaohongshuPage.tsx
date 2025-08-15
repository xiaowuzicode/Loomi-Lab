import {
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react'

export function XiaohongshuPage() {
  const textColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <Box>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            📱 小红书管理
            <Badge ml={3} colorScheme="red" variant="subtle">
              Hot
            </Badge>
          </Heading>
          <Text color={textColor} opacity={0.7}>
            管理小红书账号矩阵，支持定时发布和内容自动化
          </Text>
        </Box>

        <Box p={8} textAlign="center">
          <Text color={textColor} opacity={0.6}>
            小红书管理页面开发中...
          </Text>
          <Text fontSize="sm" color={textColor} opacity={0.4} mt={2}>
            将支持账号管理、内容发布、定时任务等功能
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
