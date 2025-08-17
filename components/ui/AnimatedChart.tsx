'use client'

import { Box, useColorModeValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts'
import { Card } from './Card'

const MotionBox = motion(Box)

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface AnimatedChartProps {
  data: ChartData[]
  type?: 'area' | 'line' | 'bar'
  color?: string
  height?: number
  title?: string
  loading?: boolean
  yAxisFormat?: 'default' | 'token' // 新增Y轴格式化选项
}

export function AnimatedChart({
  data,
  type = 'area',
  color,
  height = 300,
  title,
  loading = false,
  yAxisFormat = 'default',
}: AnimatedChartProps) {
  const defaultColor = useColorModeValue('#3b82f6', '#60a5fa')
  const finalColor = color || defaultColor
  const gridColor = useColorModeValue('#f3f4f6', '#374151')
  const textColor = useColorModeValue('#6b7280', '#9ca3af')
  
  // Token数据转换：将原始Token数量转换为万单位
  const processedData = yAxisFormat === 'token' 
    ? data.map(item => ({
        ...item,
        value: Math.round(item.value / 10000 * 10) / 10, // 转换为万单位，保留1位小数
        originalValue: item.value // 保留原始值用于tooltip显示
      }))
    : data
    
  // Y轴格式化函数
  const formatYAxisTick = (value: number) => {
    if (yAxisFormat === 'token') {
      return `${value.toFixed(1)}万`
    }
    return value.toLocaleString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].payload.originalValue || payload[0].value
      const displayValue = yAxisFormat === 'token' 
        ? `${Math.round(value / 10000 * 10) / 10}万` 
        : value.toLocaleString()
      
      return (
        <Card variant="glass" p={3}>
          <Box fontSize="sm" color={textColor} mb={1}>
            {label}
          </Box>
          <Box fontSize="lg" fontWeight="bold" color={finalColor}>
            {displayValue}
          </Box>
        </Card>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12 }}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={finalColor}
              strokeWidth={3}
              dot={{ fill: finalColor, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: finalColor }}
            />
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12 }}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill={finalColor}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12 }}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={finalColor}
              strokeWidth={2}
              fill={`url(#gradient-${type})`}
            />
            <defs>
              <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={finalColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={finalColor} stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <Box h={height} bg="gray.100" borderRadius="md" />
      </Card>
    )
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        {title && (
          <Box mb={4}>
            <Box fontSize="lg" fontWeight="semibold" mb={2}>
              {title}
            </Box>
          </Box>
        )}
        <Box h={height}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </Box>
      </Card>
    </MotionBox>
  )
}
