'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  Divider,
  SimpleGrid,
  Button,
  IconButton,
  Card,
  CardBody,
  Flex,
  Icon,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  RiUserLine,
  RiMailLine,
  RiShieldUserLine,
  RiCalendarLine,
  RiEditLine,
  RiBarChartLine,
  RiTimeLine,
  RiFileTextLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

const MotionBox = motion(Box)

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardBg = useColorModeValue('gray.50', 'gray.700')

  if (isLoading) {
    return (
      <PageLayout>
        <Box p={6}>
          <Text>加载中...</Text>
        </Box>
      </PageLayout>
    )
  }

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'purple', label: '超级管理员' },
      operator: { color: 'blue', label: '运营管理员' },
      viewer: { color: 'gray', label: '查看者' },
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || { color: 'gray', label: role }
    return (
      <Badge colorScheme={config.color} variant="subtle" px={3} py={1}>
        {config.label}
      </Badge>
    )
  }

  // 模拟的用户统计数据
  const userStats = {
    loginCount: 127,
    lastLogin: '2024-01-20 14:30:25',
    operationCount: 2890,
    managedUsers: 892,
  }

  return (
    <PageLayout>
      <VStack spacing={6} align="stretch" p={6}>
        {/* 页面标题 */}
        <MotionBox
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VStack align="start" spacing={2}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              bgGradient="linear(to-r, primary.400, purple.400)"
              bgClip="text"
            >
              👤 个人资料
            </Text>
            <Text color="gray.500" fontSize="lg">
              查看和管理您的账户信息
            </Text>
          </VStack>
        </MotionBox>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          {/* 基本信息卡片 */}
          <MotionBox
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            gridColumn={{ base: '1', lg: '1 / 3' }}
          >
            <Card>
              <CardBody>
                <VStack spacing={6}>
                  {/* 用户头像和基本信息 */}
                  <HStack spacing={6} w="full" justify="space-between">
                    <HStack spacing={4}>
                      <Avatar
                        size="xl"
                        name={user.username}
                        src="/images/loomi-icon.svg"
                        bg="primary.500"
                        color="white"
                      />
                      <VStack align="start" spacing={2}>
                        <HStack spacing={3}>
                          <Text fontSize="2xl" fontWeight="bold">
                            {user.username}
                          </Text>
                          {getRoleBadge(user.role)}
                        </HStack>
                        <HStack spacing={4}>
                          <HStack spacing={2}>
                            <Icon as={RiMailLine} color="gray.500" />
                            <Text color="gray.600">{user.email}</Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Icon as={RiShieldUserLine} color="gray.500" />
                            <Text color="gray.600">ID: {user.id}</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    <Button
                      leftIcon={<RiEditLine />}
                      colorScheme="primary"
                      variant="outline"
                      onClick={() => router.push('/settings')}
                    >
                      编辑资料
                    </Button>
                  </HStack>

                  <Divider />

                  {/* 账户详细信息 */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                    <VStack align="start" spacing={3}>
                      <Text fontSize="lg" fontWeight="semibold">账户信息</Text>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Text fontWeight="medium" minW="80px">用户名:</Text>
                          <Text>{user.username}</Text>
                        </HStack>
                        <HStack>
                          <Text fontWeight="medium" minW="80px">邮箱:</Text>
                          <Text>{user.email}</Text>
                        </HStack>
                        <HStack>
                          <Text fontWeight="medium" minW="80px">角色:</Text>
                          {getRoleBadge(user.role)}
                        </HStack>
                        <HStack>
                          <Text fontWeight="medium" minW="80px">状态:</Text>
                          <Badge colorScheme="green" variant="subtle">
                            正常
                          </Badge>
                        </HStack>
                      </VStack>
                    </VStack>

                    <VStack align="start" spacing={3}>
                      <Text fontSize="lg" fontWeight="semibold">登录信息</Text>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Text fontWeight="medium" minW="100px">登录次数:</Text>
                          <Text color="primary.500" fontWeight="bold">
                            {userStats.loginCount} 次
                          </Text>
                        </HStack>
                        <HStack>
                          <Text fontWeight="medium" minW="100px">最后登录:</Text>
                          <Text>{userStats.lastLogin}</Text>
                        </HStack>
                        <HStack>
                          <Text fontWeight="medium" minW="100px">创建时间:</Text>
                          <Text>2023-06-15 09:30:00</Text>
                        </HStack>
                      </VStack>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>

          {/* 统计信息卡片 */}
          <MotionBox
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <VStack spacing={4}>
              {/* 操作统计 */}
              <Card w="full">
                <CardBody>
                  <Stat>
                    <StatLabel>
                      <HStack>
                        <Icon as={RiBarChartLine} color="blue.500" />
                        <Text>总操作次数</Text>
                      </HStack>
                    </StatLabel>
                    <StatNumber color="blue.500">
                      {userStats.operationCount.toLocaleString()}
                    </StatNumber>
                    <StatHelpText>管理平台操作统计</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              {/* 管理用户数 */}
              <Card w="full">
                <CardBody>
                  <Stat>
                    <StatLabel>
                      <HStack>
                        <Icon as={RiUserLine} color="green.500" />
                        <Text>管理用户数</Text>
                      </HStack>
                    </StatLabel>
                    <StatNumber color="green.500">
                      {userStats.managedUsers.toLocaleString()}
                    </StatNumber>
                    <StatHelpText>当前管理的用户总数</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              {/* 在线时长 */}
              <Card w="full">
                <CardBody>
                  <Stat>
                    <StatLabel>
                      <HStack>
                        <Icon as={RiTimeLine} color="orange.500" />
                        <Text>在线时长</Text>
                      </HStack>
                    </StatLabel>
                    <StatNumber color="orange.500">
                      2,340h
                    </StatNumber>
                    <StatHelpText>累计在线时间</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </VStack>
          </MotionBox>
        </SimpleGrid>

        {/* 最近活动 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <Text fontSize="lg" fontWeight="semibold">
                  最近活动
                </Text>
                <VStack align="start" spacing={3} w="full">
                  {[
                    { action: '查看用户列表', time: '刚刚', icon: RiUserLine },
                    { action: '更新系统配置', time: '5分钟前', icon: RiEditLine },
                    { action: '导出用户数据', time: '1小时前', icon: RiFileTextLine },
                    { action: '查看统计报表', time: '2小时前', icon: RiBarChartLine },
                    { action: '登录系统', time: '3小时前', icon: RiShieldUserLine },
                  ].map((activity, index) => (
                    <HStack key={index} spacing={3} w="full" p={3} bg={cardBg} borderRadius="md">
                      <Icon as={activity.icon} color="primary.500" />
                      <Text flex="1">{activity.action}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {activity.time}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>
      </VStack>
    </PageLayout>
  )
}
