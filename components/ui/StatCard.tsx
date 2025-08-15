'use client'

import {
  Box,
  Text,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
  Skeleton,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { IconType } from 'react-icons'
// import { RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri'
import { Card } from './Card'
import { formatNumber, formatCurrency } from '@/lib/utils'

const MotionBox = motion(Box)

interface StatCardProps {
  title: string
  value: number | string
  change?: number
  icon: IconType
  iconColor?: string
  format?: 'number' | 'currency' | 'percentage'
  loading?: boolean
  suffix?: string
}

export function StatCard({
  title,
  value,
  change,
  icon,
  iconColor = 'primary.500',
  format = 'number',
  loading = false,
  suffix,
}: StatCardProps) {
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const valueColor = useColorModeValue('gray.900', 'white')
  const positiveColor = useColorModeValue('green.500', 'green.400')
  const negativeColor = useColorModeValue('red.500', 'red.400')

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return `${val}%`
      case 'number':
      default:
        return formatNumber(val)
    }
  }

  const isPositiveChange = change && change > 0
  const changeColor = isPositiveChange ? positiveColor : negativeColor
  // const ChangeIcon = isPositiveChange ? RiArrowUpLine : RiArrowDownLine

  if (loading) {
    return (
      <Card>
        <VStack align="start" spacing={4}>
          <HStack justify="space-between" w="full">
            <Skeleton height="20px" width="100px" />
            <Skeleton height="24px" width="24px" borderRadius="md" />
          </HStack>
          <Skeleton height="32px" width="120px" />
          <Skeleton height="16px" width="80px" />
        </VStack>
      </Card>
    )
  }

  return (
    <Card hover>
      <VStack align="start" spacing={4}>
        {/* 标题和图标 */}
        <HStack justify="space-between" w="full">
          <Text fontSize="sm" color={textColor} fontWeight="medium">
            {title}
          </Text>
          <MotionBox
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Icon
              as={icon}
              boxSize={6}
              color={iconColor}
              filter="drop-shadow(0 0 8px currentColor)"
            />
          </MotionBox>
        </HStack>

        {/* 数值 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Text
            fontSize="3xl"
            fontWeight="bold"
            color={valueColor}
            lineHeight="1"
          >
            {formatValue(value)}
            {suffix && (
              <Text as="span" fontSize="lg" color={textColor} ml={1}>
                {suffix}
              </Text>
            )}
          </Text>
        </MotionBox>

        {/* 变化趋势 */}
        {change !== undefined && (
          <MotionBox
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <HStack spacing={1}>
              <Text fontSize="sm" color={changeColor}>
                {isPositiveChange ? '↗' : '↙'}
              </Text>
              <Text fontSize="sm" color={changeColor} fontWeight="medium">
                {Math.abs(change)}%
              </Text>
              <Text fontSize="sm" color={textColor}>
                vs 上月
              </Text>
            </HStack>
          </MotionBox>
        )}
      </VStack>
    </Card>
  )
}
