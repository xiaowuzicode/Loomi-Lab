'use client'

import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  useColorModeValue,
  useColorMode,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  RiSearchLine,
  RiBellLine,
  RiMoonLine,
  RiSunLine,
  RiMenuLine,
  RiUserLine,
  RiSettingsLine,
  RiLogoutBoxLine,
  RiFullscreenLine,
} from 'react-icons/ri'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

interface HeaderProps {
  onToggleSidebar?: () => void
  userName?: string
  userAvatar?: string
  userRole?: string
}

export function Header({
  onToggleSidebar,
  userName = 'Admin User',
  userAvatar,
  userRole = 'administrator',
}: HeaderProps) {
  const { colorMode, toggleColorMode } = useColorMode()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const searchBg = useColorModeValue('gray.50', 'gray.700')

  const notifications = [
    { id: 1, title: '新用户注册', time: '2分钟前', unread: true },
    { id: 2, title: '系统更新完成', time: '1小时前', unread: true },
    { id: 3, title: '数据备份成功', time: '3小时前', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <MotionBox
      as="header"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={5}
      backdropFilter="blur(10px)"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Flex justify="space-between" align="center">
        {/* Left section */}
        <HStack spacing={4}>
          <IconButton
            aria-label="Toggle sidebar"
            icon={<RiMenuLine />}
            variant="ghost"
            onClick={onToggleSidebar}
            size="sm"
          />

          {/* Search */}
          <InputGroup maxW="400px" display={{ base: 'none', md: 'block' }}>
            <InputLeftElement>
              <RiSearchLine color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="搜索用户、订单、内容..."
              bg={searchBg}
              border="none"
              _focus={{
                bg: useColorModeValue('white', 'gray.600'),
                shadow: 'md',
              }}
            />
          </InputGroup>
        </HStack>

        {/* Right section */}
        <HStack spacing={4}>
          {/* Notifications */}
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Notifications"
              icon={<RiBellLine />}
              variant="ghost"
              position="relative"
            >
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="0"
                  right="0"
                  colorScheme="red"
                  borderRadius="full"
                  fontSize="xs"
                  minW="18px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {unreadCount}
                </Badge>
              )}
            </MenuButton>
            <MenuList>
              <Text px={3} py={2} fontSize="sm" fontWeight="semibold">
                通知中心
              </Text>
              <MenuDivider />
              {notifications.map((notification) => (
                <MenuItem key={notification.id} py={3}>
                  <VStack align="start" spacing={1}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" fontWeight="medium">
                        {notification.title}
                      </Text>
                      {notification.unread && (
                        <Box w={2} h={2} bg="blue.400" borderRadius="full" />
                      )}
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {notification.time}
                    </Text>
                  </VStack>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Theme toggle */}
          <IconButton
            aria-label="Toggle theme"
            icon={colorMode === 'light' ? <RiMoonLine /> : <RiSunLine />}
            variant="ghost"
            onClick={toggleColorMode}
          />

          {/* Fullscreen */}
          <IconButton
            aria-label="Fullscreen"
            icon={<RiFullscreenLine />}
            variant="ghost"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen()
              } else {
                document.documentElement.requestFullscreen()
              }
            }}
          />

          {/* User menu */}
          <Menu>
            <MenuButton>
              <MotionFlex
                align="center"
                cursor="pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HStack spacing={3}>
                  <VStack spacing={0} align="end" display={{ base: 'none', md: 'flex' }}>
                    <Text fontSize="sm" fontWeight="medium">
                      {userName}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {userRole}
                    </Text>
                  </VStack>
                  <Avatar
                    size="sm"
                    name={userName}
                    src={userAvatar}
                    bg="primary.500"
                    color="white"
                  />
                </HStack>
              </MotionFlex>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<RiUserLine />}>
                个人资料
              </MenuItem>
              <MenuItem icon={<RiSettingsLine />}>
                账户设置
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<RiLogoutBoxLine />} color="red.500">
                退出登录
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </MotionBox>
  )
}
