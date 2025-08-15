import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import { MdHome, MdError } from 'react-icons/md'

export function NotFoundPage() {
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50)',
    'linear(to-br, gray.900, purple.900)'
  )

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={bgGradient}
      p={4}
    >
      <VStack spacing={8} textAlign="center">
        <Icon as={MdError} boxSize={20} color="red.400" />
        
        <VStack spacing={4}>
          <Heading size="2xl" color={textColor}>
            404
          </Heading>
          <Heading size="lg" color={textColor}>
            页面未找到
          </Heading>
          <Text color={textColor} opacity={0.7} maxW="md">
            抱歉，您访问的页面不存在。可能是链接错误或页面已被移动。
          </Text>
        </VStack>

        <Button
          as={RouterLink}
          to="/dashboard"
          leftIcon={<MdHome />}
          colorScheme="primary"
          size="lg"
        >
          返回首页
        </Button>
      </VStack>
    </Flex>
  )
}
