'use client'

import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  RiUser3Line,
  RiUserHeartLine,
  RiMoneyDollarCircleLine,
  RiBrainLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { StatCard } from '@/components/ui/StatCard'
import { AnimatedChart } from '@/components/ui/AnimatedChart'
import { Card } from '@/components/ui/Card'

const MotionBox = motion(Box)

// 模拟数据
const statsData = {
  totalUsers: 12450,
  activeUsers: 8920,
  totalRevenue: 156780,
  tokenConsumption: 2340000,
  userGrowth: 12.5,
  revenueGrowth: 8.3,
}

const chartData = [
  { name: '1月', value: 4000 },
  { name: '2月', value: 3000 },
  { name: '3月', value: 5000 },
  { name: '4月', value: 4500 },
  { name: '5月', value: 6000 },
  { name: '6月', value: 5500 },
  { name: '7月', value: 7000 },
]

const revenueData = [
  { name: '1月', value: 12000 },
  { name: '2月', value: 15000 },
  { name: '3月', value: 18000 },
  { name: '4月', value: 22000 },
  { name: '5月', value: 25000 },
  { name: '6月', value: 28000 },
  { name: '7月', value: 32000 },
]

const tokenData = [
  { name: '1月', value: 180000 },
  { name: '2月', value: 220000 },
  { name: '3月', value: 280000 },
  { name: '4月', value: 320000 },
  { name: '5月', value: 380000 },
  { name: '6月', value: 420000 },
  { name: '7月', value: 480000 },
]

export default function DashboardPage() {
  const titleColor = useColorModeValue('gray.800', 'white')

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

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="总用户数"
            value={statsData.totalUsers}
            change={statsData.userGrowth}
            icon={RiUser3Line}
            iconColor="blue.400"
            format="number"
          />
          <StatCard
            title="活跃用户"
            value={statsData.activeUsers}
            change={15.2}
            icon={RiUserHeartLine}
            iconColor="green.400"
            format="number"
          />
          <StatCard
            title="总收入"
            value={statsData.totalRevenue}
            change={statsData.revenueGrowth}
            icon={RiMoneyDollarCircleLine}
            iconColor="yellow.400"
            format="currency"
          />
          <StatCard
            title="Token 消耗"
            value={statsData.tokenConsumption}
            change={-2.1}
            icon={RiBrainLine}
            iconColor="purple.400"
            format="number"
            suffix="tokens"
          />
        </SimpleGrid>

        {/* Charts Section */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* User Growth Chart */}
          <AnimatedChart
            data={chartData}
            type="area"
            title="用户增长趋势"
            color="#3b82f6"
            height={300}
          />

          {/* Revenue Chart */}
          <AnimatedChart
            data={revenueData}
            type="line"
            title="收入趋势"
            color="#10b981"
            height={300}
          />
        </SimpleGrid>

        {/* Token Consumption Chart */}
        <AnimatedChart
          data={tokenData}
          type="bar"
          title="Token 消耗统计"
          color="#8b5cf6"
          height={350}
        />

        {/* Additional Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Card>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="semibold">
                  热门功能
                </Text>
                <Text fontSize="sm" color="gray.500">
                  本月
                </Text>
              </HStack>
              <VStack align="start" spacing={3} w="full">
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">AI 文案生成</Text>
                  <Text fontSize="sm" fontWeight="bold" color="primary.500">
                    45.2%
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">智能回复</Text>
                  <Text fontSize="sm" fontWeight="bold" color="green.500">
                    32.8%
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">内容优化</Text>
                  <Text fontSize="sm" fontWeight="bold" color="yellow.500">
                    22.0%
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <Card>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="semibold">
                  平台状态
                </Text>
                <Box w={3} h={3} bg="green.400" borderRadius="full" />
              </HStack>
              <VStack align="start" spacing={3} w="full">
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">API 响应时间</Text>
                  <Text fontSize="sm" fontWeight="bold" color="green.500">
                    125ms
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">系统可用性</Text>
                  <Text fontSize="sm" fontWeight="bold" color="green.500">
                    99.9%
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">错误率</Text>
                  <Text fontSize="sm" fontWeight="bold" color="green.500">
                    0.01%
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <Card>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="semibold">
                  最新动态
                </Text>
                <Text fontSize="sm" color="gray.500">
                  实时
                </Text>
              </HStack>
              <VStack align="start" spacing={3} w="full">
                <Text fontSize="sm" color="gray.600">
                  🎉 新用户 @小红书达人 注册成功
                </Text>
                <Text fontSize="sm" color="gray.600">
                  💰 订单 #12345 支付完成
                </Text>
                <Text fontSize="sm" color="gray.600">
                  🤖 AI 模型更新完成
                </Text>
              </VStack>
            </VStack>
          </Card>
        </SimpleGrid>
      </VStack>
    </PageLayout>
  )
}
