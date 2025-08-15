import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Card,
  CardBody,
  Icon,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Divider,
  Badge,
} from '@chakra-ui/react'
import {
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdAutoAwesome,
} from 'react-icons/md'
import { useForm } from 'react-hook-form'

import { useAuth } from '@/contexts/AuthContext'

interface LoginForm {
  email: string
  password: string
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50)',
    'linear(to-br, gray.900, purple.900)'
  )
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.700', 'gray.300')

  // 如果已经登录，重定向到目标页面或首页
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
    } catch (error) {
      // 错误处理已在 AuthContext 中完成
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={bgGradient}
      p={4}
    >
      <Box maxW="md" w="full">
        <VStack spacing={8}>
          {/* Logo和标题 */}
          <VStack spacing={4} textAlign="center">
            <Flex align="center" gap={3}>
              <Icon as={MdAutoAwesome} boxSize={12} color="primary.500" />
              <Box>
                <Text fontSize="3xl" fontWeight="bold" color="primary.500">
                  Loomi-Lab
                </Text>
                <Badge colorScheme="purple" variant="subtle">
                  多智能体管理平台
                </Badge>
              </Box>
            </Flex>
            <Text fontSize="lg" color={textColor}>
              登录到您的管理后台
            </Text>
          </VStack>

          {/* 登录表单 */}
          <Card w="full" bg={cardBg} shadow="xl" borderRadius="2xl">
            <CardBody p={8}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={6}>
                  {/* 邮箱输入 */}
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel>邮箱地址</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={MdEmail} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        placeholder="请输入您的邮箱"
                        size="lg"
                        {...register('email', {
                          required: '请输入邮箱地址',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: '请输入有效的邮箱地址',
                          },
                        })}
                      />
                    </InputGroup>
                    <FormErrorMessage>
                      {errors.email?.message}
                    </FormErrorMessage>
                  </FormControl>

                  {/* 密码输入 */}
                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel>密码</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={MdLock} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入您的密码"
                        size="lg"
                        {...register('password', {
                          required: '请输入密码',
                          minLength: {
                            value: 6,
                            message: '密码长度至少为6位',
                          },
                        })}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="显示/隐藏密码"
                          icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>
                      {errors.password?.message}
                    </FormErrorMessage>
                  </FormControl>

                  {/* 登录按钮 */}
                  <Button
                    type="submit"
                    colorScheme="primary"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    loadingText="登录中..."
                  >
                    登录
                  </Button>
                </VStack>
              </form>

              <Divider my={6} />

              {/* 演示账号提示 */}
              <Box
                p={4}
                bg="blue.50"
                borderRadius="lg"
                border="1px solid"
                borderColor="blue.200"
              >
                <Text fontSize="sm" fontWeight="medium" color="blue.800" mb={2}>
                  演示账号
                </Text>
                <VStack spacing={1} fontSize="xs" color="blue.700">
                  <HStack w="full" justify="space-between">
                    <Text>管理员:</Text>
                    <Text>admin@loomi.com / 123456</Text>
                  </HStack>
                  <HStack w="full" justify="space-between">
                    <Text>运营者:</Text>
                    <Text>operator@loomi.com / 123456</Text>
                  </HStack>
                </VStack>
              </Box>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Flex>
  )
}
