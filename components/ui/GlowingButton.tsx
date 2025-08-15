'use client'

import { Button, ButtonProps, useColorModeValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionButton = motion(Button)

interface GlowingButtonProps extends ButtonProps {
  glowColor?: string
  intensity?: 'low' | 'medium' | 'high'
}

export function GlowingButton({ 
  glowColor,
  intensity = 'medium',
  children,
  ...props 
}: GlowingButtonProps) {
  const defaultGlowColor = useColorModeValue('#3b82f6', '#60a5fa')
  const finalGlowColor = glowColor || defaultGlowColor

  const intensityMap = {
    low: '0 0 10px',
    medium: '0 0 20px',
    high: '0 0 30px',
  }

  return (
    <MotionButton
      position="relative"
      overflow="hidden"
      bg={useColorModeValue('primary.500', 'primary.600')}
      color="white"
      _hover={{
        bg: useColorModeValue('primary.600', 'primary.700'),
      }}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 'inherit',
        boxShadow: `${intensityMap[intensity]} ${finalGlowColor}`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      sx={{
        '&:hover::before': {
          opacity: 0.6,
        },
      }}
      {...props}
    >
      <motion.span
        initial={{ opacity: 0.8 }}
        whileHover={{ opacity: 1 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {children}
      </motion.span>
    </MotionButton>
  )
}
