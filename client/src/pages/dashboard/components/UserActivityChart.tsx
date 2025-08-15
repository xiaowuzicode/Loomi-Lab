import { useQuery } from '@tanstack/react-query'
import { Box, Spinner, Center, Text, useColorModeValue } from '@chakra-ui/react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { dashboardApi } from '@/services/api'

export function UserActivityChart() {
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const gridColor = useColorModeValue('gray.200', 'gray.600')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'user-activity-trend'],
    queryFn: () => dashboardApi.getUserActivityTrend(30),
  })

  if (isLoading) {
    return (
      <Center h="300px">
        <Spinner color="primary.500" />
      </Center>
    )
  }

  const chartData = data?.data || []

  return (
    <Box h="300px">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: textColor }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: textColor }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
            }}
            labelFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString('zh-CN')
            }}
            formatter={(value: number) => [value, '活跃用户']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorActivity)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}
