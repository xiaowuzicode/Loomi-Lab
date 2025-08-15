import {
  Flex,
  Box,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  useColorMode,
  useColorModeValue,
  Badge,
  HStack,
} from '@chakra-ui/react'
import {
  MdSun,
  MdMoon,
  MdNotifications,
  MdSettings,
  MdExitToApp,
  MdPerson,
} from 'react-icons/md'

import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const { user, logout } = useAuth()
  const { colorMode, toggleColorMode } = useColorMode()
  
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red'
      case 'operator':
        return 'blue'
      case 'analyst':
        return 'green'
      case 'content_manager':
        return 'purple'
      default:
        return 'gray'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员'
      case 'operator':
        return '运营者'
      case 'analyst':
        return '分析师'
      case 'content_manager':
        return '内容管理员'
      default:
        return role
    }
  }

  return (
    <Flex
      h="100%"
      align="center"
      justify="space-between"
      px={6}
    >
      {/* 左侧 - 页面标题 */}
      <Box>
        <Text fontSize="lg" fontWeight="semibold" color={textColor}>
          欢迎回来，{user?.username}
        </Text>
        <Text fontSize="sm" color={textColor} opacity={0.7}>
          今天是 {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </Text>
      </Box>

      {/* 右侧 - 工具栏 */}
      <HStack spacing={3}>
        {/* 主题切换 */}
        <IconButton
          aria-label="切换主题"
          icon={colorMode === 'light' ? <MdMoon /> : <MdSun />}
          variant="ghost"
          size="md"
          onClick={toggleColorMode}
        />

        {/* 通知 */}
        <IconButton
          aria-label="通知"
          icon={<MdNotifications />}
          variant="ghost"
          size="md"
          position="relative"
        />

        {/* 用户菜单 */}
        <Menu>
          <MenuButton>
            <Flex align="center" gap={3} cursor="pointer">
              <Box textAlign="right">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  {user?.username}
                </Text>
                <Badge
                  size="sm"
                  colorScheme={getRoleBadgeColor(user?.role || '')}
                  variant="subtle"
                >
                  {getRoleLabel(user?.role || '')}
                </Badge>
              </Box>
              <Avatar
                size="sm"
                name={user?.username}
                bg="primary.500"
                color="white"
              />
            </Flex>
          </MenuButton>
          
          <MenuList>
            <MenuItem icon={<MdPerson />}>
              个人资料
            </MenuItem>
            <MenuItem icon={<MdSettings />}>
              账户设置
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={<MdExitToApp />}
              onClick={logout}
              color="red.500"
            >
              退出登录
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  )
}
