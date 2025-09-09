'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Tooltip,
  Badge,
  Divider,
} from '@chakra-ui/react'
// import { motion, AnimatePresence } from 'framer-motion' // 暂时移除动画
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  RiDashboardLine,
  RiUser3Line,
  RiWallet3Line,
  RiBrainLine,
  RiBookOpenLine,
  RiQuillPenLine,
  RiSettings3Line,
  RiInstagramLine,
  RiSparklingFill,
  RiMessageLine,
  RiLightbulbLine,
  RiDatabase2Line,
} from 'react-icons/ri'

// const Box = Box // 暂时移除动画
// const HStack = HStack // 暂时移除动画

interface NavItem {
  label: string
  href: string
  icon: any
  badge?: string | number
  color?: string
}

// 格式化数字显示 - 根据用户要求显示实际数字而不是K简化
const formatUserCount = (count: number): string => {
  return count.toString()
}

// 生成导航项的函数，支持动态badge
const getNavItems = (userCount: number): NavItem[] => [
  {
    label: '统计分析',
    href: '/dashboard',
    icon: RiDashboardLine,
    color: 'blue.400',
  },
  {
    label: '用户管理',
    href: '/users',
    icon: RiUser3Line,
    badge: userCount > 0 ? formatUserCount(userCount) : undefined,
    color: 'green.400',
  },
  {
    label: '支付管理',
    href: '/payments',
    icon: RiWallet3Line,
    color: 'yellow.400',
  },
  {
    label: '知识库管理',
    href: '/knowledge-base-v2',
    icon: RiBrainLine,
    color: 'purple.400',
  },
  {
    label: '策略库',
    href: '/strategy-library',
    icon: RiLightbulbLine,
    color: 'indigo.400',
  },
  {
    label: '爆文库管理',
    href: '/content-library',
    icon: RiBookOpenLine,
    badge: 'HOT',
    color: 'red.400',
  },
  {
    label: '提示词管理',
    href: '/prompts',
    icon: RiQuillPenLine,
    color: 'cyan.400',
  },
  {
    label: '自定义字段管理',
    href: '/custom-fields',
    icon: RiDatabase2Line,
    color: 'teal.400',
  },
  {
    label: '用户消息查询',
    href: '/message-query',
    icon: RiMessageLine,
    color: 'orange.400',
  },
  {
    label: '小红书管理',
    href: '/xiaohongshu',
    icon: RiInstagramLine,
    color: 'pink.400',
  },
  {
    label: '元数据配置',
    href: '/system-config',
    icon: RiSettings3Line,
    color: 'gray.400',
  },
]

interface SidebarProps {
  isCollapsed?: boolean
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const bgColor = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  // 用户数量状态
  const [userCount, setUserCount] = useState(0)
  
  // 获取用户统计数据
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetch('/api/users?action=stats')
        const result = await response.json()
        
        if (result.success && result.data) {
          setUserCount(result.data.totalUsers || 0)
        }
      } catch (error) {
        console.error('获取用户统计失败:', error)
      }
    }
    
    fetchUserStats()
  }, [])
  
  // 动态生成导航项
  const navItems = getNavItems(userCount)

  return (
    <Box
      as="aside"
      w={isCollapsed ? '16' : '64'}
      h="100vh"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      position="fixed"
      left={0}
      top={0}
      zIndex={10}
      overflow="hidden"
    >
      <VStack spacing={0} align="stretch" h="full">
        {/* Logo */}
        <Box
          p={6}
          borderBottom="1px"
          borderColor={borderColor}
        >
          <HStack spacing={3}>
            <Box
            >
              <Icon
                as={RiSparklingFill}
                boxSize={8}
                color="primary.500"
                filter="drop-shadow(0 0 10px currentColor)"
              />
            </Box>
            
              {!isCollapsed && (
                <Box
                >
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    bgGradient="linear(to-r, primary.400, purple.400)"
                    bgClip="text"
                  >
                    Loomi-Lab
                  </Text>
                </Box>
              )}
            
          </HStack>
        </Box>

        {/* Navigation */}
        <VStack spacing={2} p={4} flex={1} align="stretch">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const activeColor = useColorModeValue('primary.500', 'primary.400')
            const hoverBg = useColorModeValue('gray.100', 'gray.800')
            const activeBg = useColorModeValue('primary.50', 'primary.900')

            return (
              <Box
                key={item.href}
              >
                <Tooltip
                  label={item.label}
                  placement="right"
                  isDisabled={!isCollapsed}
                >
                  <Box
                    as={Link}
                    href={item.href}
                    display="block"
                  >
                    <HStack
                      spacing={3}
                      p={3}
                      borderRadius="lg"
                      cursor="pointer"
                      bg={isActive ? activeBg : 'transparent'}
                      color={isActive ? activeColor : 'inherit'}
                      _hover={{
                        bg: isActive ? activeBg : hoverBg,
                      }}
                      position="relative"
                      overflow="hidden"
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <Box
                          position="absolute"
                          left={0}
                          top={0}
                          bottom={0}
                          w="3px"
                          bg={activeColor}
                          borderRadius="full"

                        />
                      )}

                      <Icon
                        as={item.icon}
                        boxSize={5}
                        color={isActive ? activeColor : item.color}
                        filter={isActive ? 'drop-shadow(0 0 8px currentColor)' : 'none'}
                      />

                      
                        {!isCollapsed && (
                          <Box
                            flex={1}
                          >
                            <HStack justify="space-between" w="full">
                              <Text
                                fontSize="sm"
                                fontWeight={isActive ? 'semibold' : 'medium'}
                              >
                                {item.label}
                              </Text>
                              {item.badge && (
                                <Badge
                                  size="sm"
                                  colorScheme={item.badge === 'HOT' ? 'red' : 'gray'}
                                  variant="subtle"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </HStack>
                          </Box>
                        )}
                      
                    </HStack>
                  </Box>
                </Tooltip>
              </Box>
            )
          })}
        </VStack>

        {/* Footer */}
        <Box
          p={4}
          borderTop="1px"
          borderColor={borderColor}
        >
          
            {!isCollapsed && (
              <Box
              >
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  © 2024 BlueFocus Team
                </Text>
              </Box>
            )}
          
        </Box>
      </VStack>
    </Box>
  )
}
