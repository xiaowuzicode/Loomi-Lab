'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  RiUser3Line,
  RiUserHeartLine,
  RiUserAddLine,
  RiBrainLine,
  RiUserFollowLine,
  RiUserSharedLine,
  RiUserStarLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { StatCard } from '@/components/ui/StatCard'
import { AnimatedChart } from '@/components/ui/AnimatedChart'
import { Card } from '@/components/ui/Card'

const MotionBox = motion(Box)

// API响应类型
interface DashboardStats {
  summary: {
    total_access: number
    today_access: number
    today_users: number
    daily_new_users: number
    user_retention_7d: number
    user_retention_3d: number
    user_retention_1d: number
    token_consumption: number
  }
  daily_chart: {
    labels: string[]
    access_counts: number[]
    user_counts: number[]
  }
  monthly_chart: {
    labels: string[]
    access_counts: number[]
  }
  token_stats: {
    today_tokens: number
    weekly_tokens: number
    monthly_tokens: number
    today_top_users: number
  }
  daily_token_chart: {
    labels: string[]
    token_counts: number[]
  }
  monthly_token_chart: {
    labels: string[]
    token_counts: number[]
  }
  recent_top_users: any[]
  token_ranking: any[]
  last_updated: string
}

export default function DashboardPage() {
  const titleColor = useColorModeValue('gray.800', 'white')
  const router = useRouter()
  const { token, isAuthenticated, isLoading: authLoading } = useAuth()
  
  // 状态管理
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取统计数据
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 检查认证状态
      if (!token) {
        throw new Error('用户未登录')
      }
      
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('用户认证失败，请重新登录')
        }
        throw new Error('获取统计数据失败')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '获取数据失败')
      }

      setData(result.data)
    } catch (err) {
      console.error('Dashboard data error:', err)
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 认证完成后获取数据
  useEffect(() => {
    // 等待认证状态确定
    if (authLoading) return
    
    // 如果未认证，不获取数据
    if (!isAuthenticated || !token) {
      setLoading(false)
      setError('请先登录以查看统计数据')
      return
    }
    
    // 认证通过，获取数据
    fetchDashboardData()
  }, [authLoading, isAuthenticated, token])

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`
    }
    return num.toLocaleString()
  }

  // 格式化Token数量（万单位）
  const formatTokenCount = (count: number): string => {
    if (count >= 100000000) {
      return `${(count / 100000000).toFixed(1)}亿`
    } else if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toLocaleString()
  }

  // 截取邮箱显示（保留悬停功能）
  const truncateEmail = (email: string, maxLength: number = 20): string => {
    if (!email) return ''
    
    if (email.includes('@')) {
      const [username, domain] = email.split('@')
      const maxUsernameLength = Math.floor(maxLength * 0.6)
      const maxDomainLength = maxLength - maxUsernameLength - 1
      
      const truncatedUsername = username.length > maxUsernameLength ? 
        username.substring(0, maxUsernameLength - 2) + '..' : username
      const truncatedDomain = domain.length > maxDomainLength ? 
        domain.substring(0, maxDomainLength - 2) + '..' : domain
        
      return `${truncatedUsername}@${truncatedDomain}`
    } else {
      return email.length > maxLength ? email.substring(0, maxLength - 2) + '..' : email
    }
  }

  // 转换图表数据格式
  const convertChartData = (labels: string[], values: number[]) => {
    return labels.map((label, index) => ({
      name: label,
      value: values[index] || 0
    }))
  }

  // 认证加载中
  if (authLoading) {
    return (
      <PageLayout>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="primary.500" />
          <Text color="gray.500">正在验证用户身份...</Text>
        </VStack>
      </PageLayout>
    )
  }

  // 用户未认证
  if (!isAuthenticated) {
    return (
      <PageLayout>
        <VStack spacing={6} align="center" justify="center" minH="400px">
          <Alert status="warning" maxW="md">
            <AlertIcon />
            <Box>
              <AlertTitle>需要登录</AlertTitle>
              <AlertDescription>
                请登录后查看统计数据
              </AlertDescription>
            </Box>
          </Alert>
          <Button 
            colorScheme="primary" 
            size="lg" 
            onClick={() => router.push('/login')}
          >
            前往登录
          </Button>
        </VStack>
      </PageLayout>
    )
  }

  // 数据加载中
  if (loading) {
    return (
      <PageLayout>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="primary.500" />
          <Text color="gray.500">正在加载统计数据...</Text>
        </VStack>
      </PageLayout>
    )
  }

  // 数据加载错误
  if (error) {
    return (
      <PageLayout>
        <VStack spacing={6}>
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>加载失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
          <Button 
            colorScheme="primary" 
            onClick={fetchDashboardData}
            isLoading={loading}
          >
            重试
          </Button>
        </VStack>
      </PageLayout>
    )
  }

  // 检查是否有真实数据
  const hasRealData = data && (
    data.summary.total_access > 0 ||
    data.summary.today_access > 0 ||
    data.summary.today_users > 0 ||
    data.summary.token_consumption > 0
  )

  if (!data) {
    return (
      <PageLayout>
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>暂无数据</AlertTitle>
          <AlertDescription>无法获取统计数据</AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <VStack spacing={8} align="stretch">
        {/* Page Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <VStack align="start" spacing={2}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color={titleColor}
              bgGradient="linear(to-r, primary.400, purple.400)"
              bgClip="text"
            >
              📊 统计分析
            </Text>
            <Text color="gray.500" fontSize="lg">
              实时监控您的业务核心指标
            </Text>
          </VStack>
        </MotionBox>

        {/* Data Status Alert */}
        {!hasRealData && (
          <Alert status="info" variant="subtle">
            <AlertIcon />
            <Box>
              <AlertTitle>系统正在初始化</AlertTitle>
              <AlertDescription>
                当前显示的是系统默认数据。真实统计数据将在以下情况下开始累积：
                <VStack align="start" spacing={1} mt={2} fontSize="sm">
                  <Text>• 用户开始访问和使用系统功能</Text>
                  <Text>• AI模型被调用并产生Token消耗</Text>
                  <Text>• 系统的访问统计组件开始记录数据</Text>
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Main Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="总访问次数"
            value={data.summary.total_access}
            change={0} // 暂时不显示变化率
            icon={RiUser3Line}
            iconColor="blue.400"
            format="number"
          />
          <StatCard
            title="今日活跃用户"
            value={data.summary.today_users}
            change={0}
            icon={RiUserHeartLine}
            iconColor="green.400"
            format="number"
          />
          <StatCard
            title="今日新增用户"
            value={data.summary.daily_new_users}
            change={0}
            icon={RiUserAddLine}
            iconColor="yellow.400"
            format="number"
          />
          <StatCard
            title="Token 消耗"
            value={data.summary.token_consumption}
            change={0}
            icon={RiBrainLine}
            iconColor="purple.400"
            format="number"
            suffix="tokens"
          />
        </SimpleGrid>

        {/* User Retention Stats */}
        <VStack spacing={4} align="stretch">
          <Text fontSize="2xl" fontWeight="bold" color={titleColor}>
            👥 老用户留存分析
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <StatCard
              title="1天内留存"
              value={data.summary.user_retention_1d}
              change={0}
              icon={RiUserFollowLine}
              iconColor="red.400"
              format="number"
              suffix="人"
            />
            <StatCard
              title="3天内留存"
              value={data.summary.user_retention_3d}
              change={0}
              icon={RiUserSharedLine}
              iconColor="orange.400"
              format="number"
              suffix="人"
            />
            <StatCard
              title="7天内留存"
              value={data.summary.user_retention_7d}
              change={0}
              icon={RiUserStarLine}
              iconColor="teal.400"
              format="number"
              suffix="人"
            />
          </SimpleGrid>
        </VStack>

        {/* Charts Section */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Daily Access Chart */}
          <AnimatedChart
            data={convertChartData(data.daily_chart.labels, data.daily_chart.access_counts)}
            type="area"
            title="最近7天访问趋势"
            color="#3b82f6"
            height={300}
          />

          {/* Monthly Access Chart */}
          <AnimatedChart
            data={convertChartData(data.monthly_chart.labels, data.monthly_chart.access_counts)}
            type="line"
            title="月度访问趋势"
            color="#10b981"
            height={300}
          />
        </SimpleGrid>

        {/* Token Statistics Section */}
        <VStack spacing={6} align="stretch">
          <Text fontSize="2xl" fontWeight="bold" color={titleColor}>
            🪙 Token 消耗统计
          </Text>
          
          {/* Token Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <StatCard
              title="今日 Token"
              value={formatTokenCount(data.token_stats.today_tokens)}
              change={0}
              icon={RiBrainLine}
              iconColor="orange.400"
            />
            <StatCard
              title="本周 Token"
              value={formatTokenCount(data.token_stats.weekly_tokens)}
              change={0}
              icon={RiBrainLine}
              iconColor="cyan.400"
            />
            <StatCard
              title="本月 Token"
              value={formatTokenCount(data.token_stats.monthly_tokens)}
              change={0}
              icon={RiBrainLine}
              iconColor="pink.400"
            />
            <StatCard
              title="活跃用户"
              value={data.token_stats.today_top_users}
              change={0}
              icon={RiUserHeartLine}
              iconColor="green.400"
              format="number"
            />
          </SimpleGrid>

          {/* Token Charts */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <AnimatedChart
              data={convertChartData(data.daily_token_chart.labels, data.daily_token_chart.token_counts)}
              type="bar"
              title="每日 Token 消耗"
              color="#f97316"
              height={350}
            />
            <AnimatedChart
              data={convertChartData(data.monthly_token_chart.labels, data.monthly_token_chart.token_counts)}
              type="line"
              title="月度 Token 消耗"
              color="#ec4899"
              height={350}
            />
          </SimpleGrid>
        </VStack>

        {/* Additional Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Card>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="semibold">
                  最近活跃用户
                </Text>
                <Text fontSize="sm" color="gray.500">
                  最近3天
                </Text>
              </HStack>
              <VStack align="start" spacing={3} w="full">
                {data.recent_top_users.length > 0 ? (
                  data.recent_top_users.slice(0, 5).map((user, index) => {
                    const fullEmail = user.top_user_display || user.top_user_email || user.top_user
                    const truncatedEmail = truncateEmail(fullEmail, 18)
                    
                    return (
                      <HStack justify="space-between" w="full" key={index}>
                        <HStack spacing={2}>
                          <Box
                            w="24px"
                            h="24px"
                            bg={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                            color="white"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            {index + 1}
                          </Box>
                          <Box position="relative">
                            <Text 
                              fontSize="sm" 
                              cursor="pointer"
                              _hover={{ transform: "scale(1.05)" }}
                              transition="transform 0.2s"
                              title={fullEmail}
                            >
                              {truncatedEmail}
                            </Text>
                          </Box>
                        </HStack>
                        <Text fontSize="sm" fontWeight="bold" color="primary.500">
                          {user.access_count}
                        </Text>
                      </HStack>
                    )
                  })
                ) : (
                  <Text fontSize="sm" color="gray.500">暂无数据</Text>
                )}
              </VStack>
            </VStack>
          </Card>

          <Card>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="semibold">
                  系统概览
                </Text>
                <Box w={3} h={3} bg="green.400" borderRadius="full" />
              </HStack>
              <VStack align="start" spacing={3} w="full">
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">总访问次数</Text>
                  <Text fontSize="sm" fontWeight="bold" color="blue.500">
                    {formatNumber(data.summary.total_access)}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">今日访问</Text>
                  <Text fontSize="sm" fontWeight="bold" color="green.500">
                    {formatNumber(data.summary.today_access)}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">7天内留存</Text>
                  <Text fontSize="sm" fontWeight="bold" color="purple.500">
                    {data.summary.user_retention_7d}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <Card>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="semibold">
                  Token 消耗排行
                </Text>
                <Text fontSize="sm" color="gray.500">
                  今日
                </Text>
              </HStack>
              
              {/* 排行榜表头 */}
              <Box 
                w="full" 
                bg={useColorModeValue('gray.50', 'gray.700')} 
                p={3} 
                borderRadius="md"
                border={`1px solid ${useColorModeValue('gray.200', 'gray.600')}`}
              >
                <HStack 
                  spacing={3}
                  fontSize="xs" 
                  fontWeight="semibold" 
                  color={useColorModeValue('gray.600', 'gray.300')}
                >
                  <Box w="30px" textAlign="center">排名</Box>
                  <Box w="100px" textAlign="left">用户邮箱</Box>
                  <Box w="60px" textAlign="center">Token</Box>
                  <Box w="40px" textAlign="center">会话</Box>
                  <Box w="50px" textAlign="center">平均</Box>
                  <Box w="40px" textAlign="center">调用</Box>
                </HStack>
              </Box>
              
              {/* 排行榜列表 */}
              <VStack align="start" spacing={2} w="full" maxH="200px" overflowY="auto">
                {data.token_ranking.length > 0 ? (
                  data.token_ranking.slice(0, 8).map((user, index) => {
                    const fullEmail = user.user_display || user.user_email || user.user_id
                    const truncatedEmail = truncateEmail(fullEmail, 14)
                    const rankColors = ["yellow.400", "gray.400", "orange.400"]
                    const rankColor = index < 3 ? rankColors[index] : "gray.500"
                    
                    return (
                      <Box
                        key={index}
                        w="full"
                        p={2}
                        bg={useColorModeValue('white', 'gray.800')}
                        border={`1px solid ${useColorModeValue('gray.100', 'gray.700')}`}
                        borderRadius="md"
                        _hover={{ 
                          bg: useColorModeValue('blue.50', 'blue.900'),
                          borderColor: useColorModeValue('blue.200', 'blue.600') 
                        }}
                        transition="all 0.2s"
                      >
                        <HStack spacing={3} fontSize="sm">
                          <Box w="30px" textAlign="center">
                            <Text fontWeight="bold" color={rankColor}>
                              {index + 1}
                            </Text>
                          </Box>
                          <Box w="100px" textAlign="left">
                            <Text 
                              fontWeight="medium" 
                              cursor="pointer"
                              _hover={{ transform: "scale(1.02)" }}
                              transition="transform 0.2s"
                              title={fullEmail}
                              isTruncated
                            >
                              {truncatedEmail}
                            </Text>
                          </Box>
                          <Box w="60px" textAlign="center">
                            <Text color="blue.500" fontWeight="bold">
                              {formatTokenCount(user.total_tokens)}
                            </Text>
                          </Box>
                          <Box w="40px" textAlign="center">
                            <Text color={useColorModeValue('gray.700', 'gray.300')}>
                              {user.session_count}
                            </Text>
                          </Box>
                          <Box w="50px" textAlign="center">
                            <Text color={useColorModeValue('gray.700', 'gray.300')}>
                              {(user.avg_tokens_per_session || 0).toFixed(0)}
                            </Text>
                          </Box>
                          <Box w="40px" textAlign="center">
                            <Text color={useColorModeValue('gray.700', 'gray.300')}>
                              {user.llm_calls}
                            </Text>
                          </Box>
                        </HStack>
                      </Box>
                    )
                  })
                ) : (
                  <Text fontSize="sm" color="gray.500" textAlign="center" w="full" py={4}>
                    暂无数据
                  </Text>
                )}
              </VStack>
            </VStack>
          </Card>
        </SimpleGrid>

        {/* Last Updated */}
        <HStack justify="center" pt={4}>
          <Text fontSize="sm" color="gray.500">
            最后更新: {new Date(data.last_updated).toLocaleString('zh-CN')}
          </Text>
        </HStack>
      </VStack>
    </PageLayout>
  )
}
