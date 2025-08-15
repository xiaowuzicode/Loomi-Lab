'use client'

import { Box, Flex, useColorModeValue } from '@chakra-ui/react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const MotionBox = motion(Box)

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const bgGradient = useColorModeValue(
    'linear(to-br, gray.50, blue.50)',
    'linear(to-br, gray.900, purple.900)'
  )

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <Flex minH="100vh" bg={bgGradient}>
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Main content */}
      <MotionBox
        flex={1}
        ml={isSidebarCollapsed ? '16' : '64'}
        transition={{ duration: 0.3 }}
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Header onToggleSidebar={handleToggleSidebar} />

        {/* Page content */}
        <MotionBox
          flex={1}
          p={6}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {children}
        </MotionBox>
      </MotionBox>
    </Flex>
  )
}
