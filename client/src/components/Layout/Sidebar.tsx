import { useLocation, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  VStack,
  Text,
  Link,
  Icon,
  Flex,
  useColorModeValue,
  Divider,
  Badge,
} from '@chakra-ui/react'
import {
  MdDashboard,
  MdPeople,
  MdPayment,
  MdPsychology,
  MdLibraryBooks,
  MdEdit,
  MdPhotoLibrary,
  MdSettings,
  MdAutoAwesome,
} from 'react-icons/md'

interface NavItem {
  label: string
  path: string
  icon: any
  badge?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: '统计分析',
    path: '/dashboard',
    icon: MdDashboard,
  },
  {
    label: '用户管理',
    path: '/users',
    icon: MdPeople,
  },
  {
    label: '支付管理',
    path: '/payments',
    icon: MdPayment,
  },
  {
    label: '知识库管理',
    path: '/knowledge-base',
    icon: MdPsychology,
    badge: 'AI',
  },
  {
    label: '爆文库管理',
    path: '/content-library',
    icon: MdLibraryBooks,
  },
  {
    label: '提示词管理',
    path: '/prompts',
    icon: MdEdit,
    badge: 'AI',
  },
  {
    label: '小红书管理',
    path: '/xiaohongshu',
    icon: MdPhotoLibrary,
    badge: 'Hot',
  },
  {
    label: '系统配置',
    path: '/system-config',
    icon: MdSettings,
  },
]

export function Sidebar() {
  const location = useLocation()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const activeColor = useColorModeValue('primary.500', 'primary.300')
  const activeBg = useColorModeValue('primary.50', 'primary.900')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  return (
    <Box
      h="100vh"
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      overflowY="auto"
      className="scrollbar-thin"
    >
      {/* Logo区域 */}
      <Flex
        align="center"
        justify="center"
        h="72px"
        px={6}
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <Flex align="center" gap={3}>
          <Icon as={MdAutoAwesome} boxSize={8} color="primary.500" />
          <Box>
            <Text fontSize="xl" fontWeight="bold" color={activeColor}>
              Loomi-Lab
            </Text>
            <Text fontSize="xs" color={textColor} opacity={0.7}>
              多智能体管理平台
            </Text>
          </Box>
        </Flex>
      </Flex>

      {/* 导航菜单 */}
      <VStack spacing={1} p={4} align="stretch">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              as={RouterLink}
              to={item.path}
              _hover={{ textDecoration: 'none' }}
            >
              <Flex
                align="center"
                px={4}
                py={3}
                borderRadius="lg"
                bg={isActive ? activeBg : 'transparent'}
                color={isActive ? activeColor : textColor}
                _hover={{
                  bg: isActive ? activeBg : hoverBg,
                }}
                transition="all 0.2s"
                position="relative"
              >
                <Icon as={item.icon} boxSize={5} mr={3} />
                <Text fontSize="sm" fontWeight={isActive ? 'semibold' : 'medium'}>
                  {item.label}
                </Text>
                
                {item.badge && (
                  <Badge
                    ml="auto"
                    size="sm"
                    colorScheme={item.badge === 'AI' ? 'purple' : 'red'}
                    variant="subtle"
                  >
                    {item.badge}
                  </Badge>
                )}
                
                {isActive && (
                  <Box
                    position="absolute"
                    left={0}
                    top="50%"
                    transform="translateY(-50%)"
                    w="3px"
                    h="20px"
                    bg={activeColor}
                    borderRadius="0 2px 2px 0"
                  />
                )}
              </Flex>
            </Link>
          )
        })}
      </VStack>

      <Divider mx={4} />

      {/* 底部信息 */}
      <Box p={4} mt="auto">
        <Text fontSize="xs" color={textColor} opacity={0.6} textAlign="center">
          版本 v1.0.0
        </Text>
        <Text fontSize="xs" color={textColor} opacity={0.4} textAlign="center" mt={1}>
          © 2024 BlueFocus
        </Text>
      </Box>
    </Box>
  )
}
