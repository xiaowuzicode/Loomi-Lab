'use client'

import { Box, BoxProps, useColorModeValue } from '@chakra-ui/react'
// import { motion } from 'framer-motion' // 暂时移除动画

// const MotionBox = Box // 暂时移除动画

interface CardProps extends BoxProps {
  children: React.ReactNode
  variant?: 'elevated' | 'outlined' | 'glass'
  hover?: boolean
}

export function Card({ 
  children, 
  variant = 'elevated', 
  hover = true,
  ...props 
}: CardProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)')

  const variants = {
    elevated: {
      bg: bgColor,
      shadow: `0 4px 6px -1px ${shadowColor}, 0 2px 4px -1px ${shadowColor}`,
      border: 'none',
    },
    outlined: {
      bg: bgColor,
      border: `1px solid ${borderColor}`,
      shadow: 'none',
    },
    glass: {
      bg: useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)'),
      backdropFilter: 'blur(10px)',
      border: `1px solid ${borderColor}`,
      shadow: `0 8px 32px ${shadowColor}`,
    },
  }

  return (
    <Box
      borderRadius="xl"
      p={6}
      {...variants[variant]}
      {...props}
    >
      {children}
    </Box>
  )
}
