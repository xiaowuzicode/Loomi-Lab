import { useQuery } from '@tanstack/react-query'
import { Box, Spinner, Center, useColorModeValue } from '@chakra-ui/react'
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { dashboardApi } from '@/services/api'

export function RevenueChart() {
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const gridColor = useColorModeValue('gray.200', 'gray.600')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'revenue-analysis'],
    queryFn: () => dashboardApi.getRevenueAnalysis(12),
  })

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner color="primary.500" />
      </Center>
    )
  }

  const chartData = data?.data || []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          bg="blackAlpha.800"
          p={3}
          borderRadius="md"
          color="white"
          fontSize="sm"
        >
          <Text fontWeight="medium">{label}</Text>
          {payload.map((entry: any, index: number) => (
            <Text key={index} color={entry.color}>
              {entry.name}: {
                entry.dataKey === 'revenue' 
                  ? `¥${entry.value.toLocaleString()}`
                  : `${entry.value} 笔`
              }
            </Text>
          ))}
        </Box>
      )
    }
    return null
  }

  return (
    <Box h="400px">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: textColor }}
            tickFormatter={(value) => {
              const [year, month] = value.split('-')
              return `${month}月`
            }}
          />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tick={{ fontSize: 12, fill: textColor }}
            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}K`}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tick={{ fontSize: 12, fill: textColor }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            name="收入"
          />
          <Bar
            yAxisId="orders"
            dataKey="orders"
            fill="#10B981"
            name="订单数"
            opacity={0.8}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  )
}
