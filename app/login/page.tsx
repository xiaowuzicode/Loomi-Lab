'use client'

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  useColorModeValue,
  useToast,
  Checkbox,
  Link,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RiEyeLine,
  RiEyeOffLine,
  RiMailLine,
  RiLockLine,
  RiSparklingFill,
} from 'react-icons/ri'
import { Card } from '@/components/ui/Card'
import { GlowingButton } from '@/components/ui/GlowingButton'

const MotionBox = motion(Box)
const MotionContainer = motion(Container)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const router = useRouter()
  const toast = useToast()

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, purple.900, blue.900)'
  )
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}
    
    if (!email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }
    
    if (!password) {
      newErrors.password = '请输入密码'
    } else if (password.length < 6) {
      newErrors.password = '密码长度至少为6位'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // 模拟登录API调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: '登录成功',
        description: '欢迎回到 Loomi-Lab！',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: '登录失败',
        description: '邮箱或密码错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg={bgGradient} display="flex" alignItems="center">
      {/* Background decorations */}
      <MotionBox
        position="absolute"
        top="10%"
        left="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="primary.400"
        opacity={0.1}
        filter="blur(60px)"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <MotionBox
        position="absolute"
        bottom="10%"
        right="10%"
        w="200px"
        h="200px"
        borderRadius="full"
        bg="purple.400"
        opacity={0.1}
        filter="blur(40px)"
        animate={{
          scale: [1, 0.8, 1],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <MotionContainer
        maxW="md"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Card variant="glass" p={8}>
          <VStack spacing={8}>
            {/* Logo and Title */}
            <MotionBox
              textAlign="center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <MotionBox
                display="inline-block"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <RiSparklingFill
                  size={48}
                  color={useColorModeValue('#3b82f6', '#60a5fa')}
                  style={{ filter: 'drop-shadow(0 0 20px currentColor)' }}
                />
              </MotionBox>
              <Text
                fontSize="2xl"
                fontWeight="bold"
                mt={4}
                bgGradient="linear(to-r, primary.400, purple.400)"
                bgClip="text"
              >
                Loomi-Lab
              </Text>
              <Text color="gray.500" fontSize="sm" mt={2}>
                智能体管理平台
              </Text>
            </MotionBox>

            {/* Login Form */}
            <MotionBox
              w="full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  {/* Email Input */}
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      邮箱地址
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <RiMailLine color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        placeholder="请输入您的邮箱"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg={useColorModeValue('white', 'gray.700')}
                        border="2px solid"
                        borderColor={useColorModeValue('gray.200', 'gray.600')}
                        _hover={{
                          borderColor: useColorModeValue('primary.300', 'primary.400'),
                        }}
                        _focus={{
                          borderColor: 'primary.500',
                          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
                        }}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  {/* Password Input */}
                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      密码
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <RiLockLine color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入您的密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg={useColorModeValue('white', 'gray.700')}
                        border="2px solid"
                        borderColor={useColorModeValue('gray.200', 'gray.600')}
                        _hover={{
                          borderColor: useColorModeValue('primary.300', 'primary.400'),
                        }}
                        _focus={{
                          borderColor: 'primary.500',
                          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
                        }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="Toggle password visibility"
                          icon={showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  {/* Remember Me & Forgot Password */}
                  <HStack justify="space-between" w="full">
                    <Checkbox
                      isChecked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      colorScheme="primary"
                      size="sm"
                    >
                      <Text fontSize="sm">记住我</Text>
                    </Checkbox>
                    <Link
                      href="#"
                      fontSize="sm"
                      color="primary.500"
                      _hover={{ color: 'primary.600' }}
                    >
                      忘记密码？
                    </Link>
                  </HStack>

                  {/* Login Button */}
                  <GlowingButton
                    type="submit"
                    w="full"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="登录中..."
                    intensity="high"
                  >
                    登录
                  </GlowingButton>
                </VStack>
              </form>
            </MotionBox>

            {/* Footer */}
            <MotionBox
              textAlign="center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Text fontSize="xs" color="gray.500">
                © 2024 BlueFocus Team. All rights reserved.
              </Text>
            </MotionBox>
          </VStack>
        </Card>
      </MotionContainer>
    </Box>
  )
}
