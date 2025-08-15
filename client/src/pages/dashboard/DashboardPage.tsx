import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  useColorModeValue,
  Spinner,
  Center,
} from '@chakra-ui/react'
import {
  MdPeople,
  MdPersonAdd,
  MdToken,
  MdAttachMoney,
} from 'react-icons/md'
import { useQuery } from '@tanstack/react-query'

import { dashboardApi } from '@/services/api'
import { UserActivityChart } from './components/UserActivityChart'
import { TokenConsumptionChart } from './components/TokenConsumptionChart'
import { RevenueChart } from './components/RevenueChart'

export function DashboardPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.700', 'gray.300')

  // 获取概览统计数据
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardApi.getOverviewStats(),
  })

  const stats = overviewData?.data

  const statCards = [
    {
      label: 'DAU (日活用户)',
      value: stats?.dau || 0,
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: MdPeople,
      color: 'blue',
    },
    {
      label: '新增用户',
      value: stats?.newUsers || 0,
      change: '+8.2%',
      changeType: 'increase' as const,
      icon: MdPersonAdd,
      color: 'green',
    },
    {
      label: 'Token 消耗',
      value: stats?.totalTokenConsumption || 0,
      change: '+15.3%',
      changeType: 'increase' as const,
      icon: MdToken,
      color: 'purple',
      format: (value: number) => `${(value / 1000).toFixed(1)}K`,
    },
    {
      label: '总收入',
      value: stats?.totalRevenue || 0,
      change: '+23.1%',
      changeType: 'increase' as const,
      icon: MdAttachMoney,
      color: 'orange',
      format: (value: number) => `¥${value.toLocaleString()}`,
    },
  ]

  if (overviewLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="primary.500" />
          <Text color={textColor}>加载仪表板数据中...</Text>
        </VStack>
      </Center>
    )
  }

  return (
    <Box>
      <VStack align="stretch" spacing={8}>
        {/* 页面标题 */}
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            📊 统计分析看板
          </Heading>
          <Text color={textColor} opacity={0.7}>
            实时监控平台核心指标和业务数据
          </Text>
        </Box>

        {/* 核心指标卡片 */}
        <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={6}>
          {statCards.map((stat, index) => (
            <GridItem key={index}>
              <Card bg={cardBg} shadow="md" borderRadius="xl">
                <CardBody>
                  <HStack justify="space-between" mb={4}>
                    <Box>
                      <Text fontSize="sm" color={textColor} opacity={0.7}>
                        {stat.label}
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                        {stat.format ? stat.format(stat.value) : stat.value.toLocaleString()}
                      </Text>
                    </Box>
                    <Box
                      p={3}
                      borderRadius="full"
                      bg={`${stat.color}.100`}
                    >
                      <Icon
                        as={stat.icon}
                        boxSize={6}
                        color={`${stat.color}.500`}
                      />
                    </Box>
                  </HStack>
                  <HStack>
                    <StatArrow type={stat.changeType} />
                    <Text fontSize="sm" color="green.500" fontWeight="medium">
                      {stat.change}
                    </Text>
                    <Text fontSize="sm" color={textColor} opacity={0.7}>
                      较上月
                    </Text>
                  </HStack>
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </Grid>

        {/* 图表区域 */}
        <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={6}>
          {/* 用户活跃度趋势 */}
          <GridItem>
            <Card bg={cardBg} shadow="md" borderRadius="xl">
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Heading size="md" color={textColor} mb={1}>
                      用户活跃度趋势
                    </Heading>
                    <Text fontSize="sm" color={textColor} opacity={0.7}>
                      过去30天的用户活跃情况
                    </Text>
                  </Box>
                  <UserActivityChart />
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Token 消耗统计 */}
          <GridItem>
            <Card bg={cardBg} shadow="md" borderRadius="xl">
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Heading size="md" color={textColor} mb={1}>
                      Token 消耗分布
                    </Heading>
                    <Text fontSize="sm" color={textColor} opacity={0.7}>
                      各功能模块的Token使用情况
                    </Text>
                  </Box>
                  <TokenConsumptionChart />
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* 收入分析 */}
        <Card bg={cardBg} shadow="md" borderRadius="xl">
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading size="md" color={textColor} mb={1}>
                  收入分析
                </Heading>
                <Text fontSize="sm" color={textColor} opacity={0.7}>
                  过去12个月的收入趋势和订单量
                </Text>
              </Box>
              <RevenueChart />
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
