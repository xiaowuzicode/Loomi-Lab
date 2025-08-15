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
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
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
} from 'react-icons/ri'

const MotionBox = motion(Box)
const MotionHStack = motion(HStack)

interface NavItem {
  label: string
  href: string
  icon: any
  badge?: string | number
  color?: string
}

const navItems: NavItem[] = [
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
    badge: '1.2K',
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
    href: '/knowledge-base',
    icon: RiBrainLine,
    color: 'purple.400',
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

  return (
    <MotionBox
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
      transition={{ duration: 0.3 }}
      overflow="hidden"
    >
      <VStack spacing={0} align="stretch" h="full">
        {/* Logo */}
        <MotionBox
          p={6}
          borderBottom="1px"
          borderColor={borderColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <HStack spacing={3}>
            <MotionBox
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Icon
                as={RiSparklingFill}
                boxSize={8}
                color="primary.500"
                filter="drop-shadow(0 0 10px currentColor)"
              />
            </MotionBox>
            <AnimatePresence>
              {!isCollapsed && (
                <MotionBox
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    bgGradient="linear(to-r, primary.400, purple.400)"
                    bgClip="text"
                  >
                    Loomi-Lab
                  </Text>
                </MotionBox>
              )}
            </AnimatePresence>
          </HStack>
        </MotionBox>

        {/* Navigation */}
        <VStack spacing={2} p={4} flex={1} align="stretch">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            const activeColor = useColorModeValue('primary.500', 'primary.400')
            const hoverBg = useColorModeValue('gray.100', 'gray.800')
            const activeBg = useColorModeValue('primary.50', 'primary.900')

            return (
              <MotionBox
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Tooltip
                  label={item.label}
                  placement="right"
                  isDisabled={!isCollapsed}
                >
                  <MotionBox
                    as={Link}
                    href={item.href}
                    display="block"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MotionHStack
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
                        <MotionBox
                          position="absolute"
                          left={0}
                          top={0}
                          bottom={0}
                          w="3px"
                          bg={activeColor}
                          borderRadius="full"
                          layoutId="activeIndicator"
                        />
                      )}

                      <Icon
                        as={item.icon}
                        boxSize={5}
                        color={isActive ? activeColor : item.color}
                        filter={isActive ? 'drop-shadow(0 0 8px currentColor)' : 'none'}
                      />

                      <AnimatePresence>
                        {!isCollapsed && (
                          <MotionBox
                            flex={1}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
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
                          </MotionBox>
                        )}
                      </AnimatePresence>
                    </MotionHStack>
                  </MotionBox>
                </Tooltip>
              </MotionBox>
            )
          })}
        </VStack>

        {/* Footer */}
        <MotionBox
          p={4}
          borderTop="1px"
          borderColor={borderColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence>
            {!isCollapsed && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  © 2024 BlueFocus Team
                </Text>
              </MotionBox>
            )}
          </AnimatePresence>
        </MotionBox>
      </VStack>
    </MotionBox>
  )
}
