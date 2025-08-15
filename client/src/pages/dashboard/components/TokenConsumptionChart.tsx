import { useQuery } from '@tanstack/react-query'
import { Box, Spinner, Center, VStack, HStack, Text, useColorModeValue } from '@chakra-ui/react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

import { dashboardApi } from '@/services/api'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export function TokenConsumptionChart() {
  const textColor = useColorModeValue('gray.600', 'gray.400')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'token-consumption'],
    queryFn: () => dashboardApi.getTokenConsumptionStats(),
  })

  if (isLoading) {
    return (
      <Center h="300px">
        <Spinner color="primary.500" />
      </Center>
    )
  }

  const stats = data?.data
  const chartData = stats?.topConsumers || []

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <Box
          bg="blackAlpha.800"
          p={3}
          borderRadius="md"
          color="white"
          fontSize="sm"
        >
          <Text fontWeight="medium">{data.category}</Text>
          <Text>消耗量: {data.consumption.toLocaleString()}</Text>
          <Text>占比: {data.percentage}%</Text>
        </Box>
      )
    }
    return null
  }

  return (
    <VStack spacing={4}>
      <Box h="200px" w="100%">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="consumption"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* 统计信息 */}
      <VStack spacing={2} w="100%">
        <HStack justify="space-between" w="100%">
          <Text fontSize="sm" color={textColor}>总消耗</Text>
          <Text fontSize="sm" fontWeight="medium">
            {stats?.totalConsumption?.toLocaleString() || 0}
          </Text>
        </HStack>
        <HStack justify="space-between" w="100%">
          <Text fontSize="sm" color={textColor}>月消耗</Text>
          <Text fontSize="sm" fontWeight="medium">
            {stats?.monthlyConsumption?.toLocaleString() || 0}
          </Text>
        </HStack>
        <HStack justify="space-between" w="100%">
          <Text fontSize="sm" color={textColor}>日均消耗</Text>
          <Text fontSize="sm" fontWeight="medium">
            {stats?.dailyAverage?.toLocaleString() || 0}
          </Text>
        </HStack>
      </VStack>

      {/* 图例 */}
      <VStack spacing={1} w="100%">
        {chartData.map((item: any, index: number) => (
          <HStack key={item.category} justify="space-between" w="100%">
            <HStack spacing={2}>
              <Box
                w={3}
                h={3}
                borderRadius="full"
                bg={COLORS[index % COLORS.length]}
              />
              <Text fontSize="xs" color={textColor}>
                {item.category}
              </Text>
            </HStack>
            <Text fontSize="xs" fontWeight="medium">
              {item.percentage}%
            </Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  )
}
