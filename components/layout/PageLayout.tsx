'use client'

import { Box, Flex, useColorModeValue } from '@chakra-ui/react'
import { useState } from 'react'
// import { motion } from 'framer-motion' // 暂时移除动画
import { Header } from './Header'
import { Sidebar } from './Sidebar'

// const MotionBox = Box // 暂时移除动画

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
      <Box
        flex={1}
        ml={isSidebarCollapsed ? '16' : '64'}
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Header onToggleSidebar={handleToggleSidebar} />

        {/* Page content */}
        <Box
          flex={1}
          p={6}
        >
          {children}
        </Box>
      </Box>
    </Flex>
  )
}
