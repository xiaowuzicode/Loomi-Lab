import { Outlet } from 'react-router-dom'
import { Box, Flex, useColorModeValue } from '@chakra-ui/react'

import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  const sidebarWidth = '280px'
  const headerHeight = '72px'
  
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const contentBg = useColorModeValue('white', 'gray.800')

  return (
    <Flex minH="100vh" bg={bgColor}>
      {/* 侧边栏 */}
      <Box
        w={sidebarWidth}
        position="fixed"
        left={0}
        top={0}
        h="100vh"
        zIndex={1000}
      >
        <Sidebar />
      </Box>

      {/* 主内容区域 */}
      <Box
        flex={1}
        ml={sidebarWidth}
        minH="100vh"
      >
        {/* 顶部导航栏 */}
        <Box
          position="fixed"
          top={0}
          right={0}
          left={sidebarWidth}
          h={headerHeight}
          zIndex={999}
          bg={contentBg}
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="blur(10px)"
        >
          <Header />
        </Box>

        {/* 页面内容 */}
        <Box
          pt={headerHeight}
          p={6}
          minH={`calc(100vh - ${headerHeight})`}
        >
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}
