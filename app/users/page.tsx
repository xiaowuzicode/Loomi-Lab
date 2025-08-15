'use client'

import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  VStack,
  useColorModeValue,
  Badge,
  Avatar,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Switch,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Tooltip,
  Stack,
  Divider,
  ButtonGroup,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  RiSearchLine,
  RiUserLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiShieldUserLine,
  RiUserForbidLine,
  RiDownloadLine,
  RiRefreshLine,
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiMailLine,
  RiPhoneLine,
  RiCalendarLine,
  RiEyeLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'

const MotionBox = motion(Box)

interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  status: 'active' | 'inactive' | 'banned'
  role: 'admin' | 'user' | 'moderator'
  subscription: 'free' | 'premium' | 'enterprise'
  last_login: string
  created_at: string
  total_usage: number
  monthly_usage: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure()
  const toast = useToast()

  const USERS_PER_PAGE = 12

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 模拟数据
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUsers: User[] = [
        {
          id: 'user_001',
          name: '张三',
          email: 'john@example.com',
          phone: '+86 138****8888',
          avatar: '',
          status: 'active',
          role: 'admin',
          subscription: 'enterprise',
          last_login: '2024-01-20T15:30:00Z',
          created_at: '2024-01-15T10:30:00Z',
          total_usage: 15420,
          monthly_usage: 2340,
        },
        {
          id: 'user_002',
          name: '李四',
          email: 'jane@example.com',
          phone: '+86 139****9999',
          avatar: '',
          status: 'banned',
          role: 'user',
          subscription: 'premium',
          last_login: '2024-01-18T12:20:00Z',
          created_at: '2024-01-10T08:20:00Z',
          total_usage: 8750,
          monthly_usage: 1200,
        },
        {
          id: 'user_003',
          name: '王五',
          email: 'bob@example.com',
          phone: '+86 137****7777',
          avatar: '',
          status: 'active',
          role: 'user',
          subscription: 'free',
          last_login: '2024-01-19T09:15:00Z',
          created_at: '2024-01-05T14:45:00Z',
          total_usage: 3200,
          monthly_usage: 450,
        },
        {
          id: 'user_004',
          name: '赵六',
          email: 'alice@example.com',
          phone: '+86 136****6666',
          avatar: '',
          status: 'inactive',
          role: 'moderator',
          subscription: 'premium',
          last_login: '2024-01-15T16:30:00Z',
          created_at: '2024-01-01T12:00:00Z',
          total_usage: 12500,
          monthly_usage: 800,
        },
        // 添加更多用户数据以测试分页
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `user_${String(i + 5).padStart(3, '0')}`,
          name: `用户${i + 5}`,
          email: `user${i + 5}@example.com`,
          phone: `+86 135****${String(1000 + i).slice(-4)}`,
          avatar: '',
          status: ['active', 'inactive', 'banned'][i % 3] as User['status'],
          role: ['user', 'moderator', 'admin'][i % 3] as User['role'],
          subscription: ['free', 'premium', 'enterprise'][i % 3] as User['subscription'],
          last_login: new Date(2024, 0, 20 - i, 10 + i % 12).toISOString(),
          created_at: new Date(2024, 0, 1 + i, 8 + i % 16).toISOString(),
          total_usage: Math.floor(Math.random() * 20000),
          monthly_usage: Math.floor(Math.random() * 3000),
        })),
      ]
      
      setUsers(mockUsers)
      setLoading(false)
    }

    fetchUsers()
  }, [])

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesStatus && matchesRole
  })

  // 分页
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  const startIndex = (currentPage - 1) * USERS_PER_PAGE
  const currentUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE)

  const handleCreateUser = () => {
    setSelectedUser(null)
    onOpen()
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    onOpen()
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    onViewOpen()
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId))
    toast({
      title: '用户已删除',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleBanUser = (userId: string) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, status: user.status === 'banned' ? 'active' : 'banned' } : user
    ))
    toast({
      title: '用户状态已更新',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const getStatusBadge = (status: User['status']) => {
    const statusConfig = {
      active: { color: 'green', label: '正常' },
      inactive: { color: 'gray', label: '未激活' },
      banned: { color: 'red', label: '已封禁' },
    }
    
    const config = statusConfig[status]
    return (
      <Badge colorScheme={config.color} variant="subtle">
        {config.label}
      </Badge>
    )
  }

  const getRoleBadge = (role: User['role']) => {
    const roleConfig = {
      admin: { color: 'purple', label: '管理员' },
      moderator: { color: 'blue', label: '协调员' },
      user: { color: 'gray', label: '普通用户' },
    }
    
    const config = roleConfig[role]
    return (
      <Badge colorScheme={config.color} variant="outline">
        {config.label}
      </Badge>
    )
  }

  const getSubscriptionBadge = (subscription: User['subscription']) => {
    const subConfig = {
      free: { color: 'gray', label: '免费版' },
      premium: { color: 'blue', label: '高级版' },
      enterprise: { color: 'purple', label: '企业版' },
    }
    
    const config = subConfig[subscription]
    return (
      <Badge colorScheme={config.color}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num)
  }

  // 计算统计数据
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length
  const premiumUsers = users.filter(u => u.subscription !== 'free').length
  const totalUsage = users.reduce((sum, user) => sum + user.total_usage, 0)

  return (
    <PageLayout>
      <VStack spacing={6} align="stretch">
        {/* 页面标题 */}
        <MotionBox
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VStack align="start" spacing={2}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              bgGradient="linear(to-r, primary.400, purple.400)"
              bgClip="text"
            >
              👥 用户管理
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理平台用户信息、权限和订阅状态
            </Text>
          </VStack>
        </MotionBox>

        {/* 统计卡片 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
            <StatCard
              title="用户总数"
              value={totalUsers}
              icon={RiUserLine}
              iconColor="blue.400"
              loading={loading}
            />
            <StatCard
              title="活跃用户"
              value={activeUsers}
              icon={RiShieldUserLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="付费用户"
              value={premiumUsers}
              icon={RiUserLine}
              iconColor="purple.400"
              loading={loading}
            />
            <StatCard
              title="总使用量"
              value={formatNumber(totalUsage)}
              icon={RiUserLine}
              iconColor="orange.400"
              loading={loading}
            />
          </Grid>
        </MotionBox>

        {/* 搜索和筛选 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <VStack spacing={4}>
              <HStack spacing={4} w="full" flexWrap="wrap">
                <InputGroup maxW="400px" flex="1">
                  <InputLeftElement>
                    <RiSearchLine color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="搜索用户邮箱、姓名或手机号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <Select maxW="150px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">全部状态</option>
                  <option value="active">正常</option>
                  <option value="inactive">未激活</option>
                  <option value="banned">已封禁</option>
                </Select>

                <Select maxW="150px" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">全部角色</option>
                  <option value="admin">管理员</option>
                  <option value="moderator">协调员</option>
                  <option value="user">普通用户</option>
                </Select>

                <Button
                  leftIcon={<RiAddLine />}
                  onClick={handleCreateUser}
                  colorScheme="primary"
                >
                  新建用户
                </Button>

                <ButtonGroup size="sm">
                  <Tooltip label="刷新数据">
                    <IconButton
                      icon={<RiRefreshLine />}
                      aria-label="刷新"
                      variant="ghost"
                    />
                  </Tooltip>
                  <Tooltip label="导出数据">
                    <IconButton
                      icon={<RiDownloadLine />}
                      aria-label="导出"
                      variant="ghost"
                    />
                  </Tooltip>
                </ButtonGroup>
              </HStack>
            </VStack>
          </Card>
        </MotionBox>

        {/* 用户网格 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {loading ? (
            <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={6}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} height="280px" borderRadius="xl" />
              ))}
            </Grid>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <Alert status="info">
                <AlertIcon />
                没有找到符合条件的用户
              </Alert>
            </Card>
          ) : (
            <>
              <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={6}>
                {currentUsers.map((user) => (
                  <MotionBox
                    key={user.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card hover>
                      <VStack spacing={4}>
                        {/* 用户头像和基本信息 */}
                        <HStack spacing={4} w="full">
                          <Avatar
                            name={user.name}
                            src={user.avatar}
                            size="lg"
                            bg="primary.500"
                          />
                          <VStack align="start" spacing={1} flex="1">
                            <HStack>
                              <Text fontWeight="bold" fontSize="lg">
                                {user.name}
                              </Text>
                              {getStatusBadge(user.status)}
                            </HStack>
                            <HStack spacing={2}>
                              {getRoleBadge(user.role)}
                              {getSubscriptionBadge(user.subscription)}
                            </HStack>
                          </VStack>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<RiMoreLine />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem
                                icon={<RiEyeLine />}
                                onClick={() => handleViewUser(user)}
                              >
                                查看详情
                              </MenuItem>
                              <MenuItem
                                icon={<RiEditLine />}
                                onClick={() => handleEditUser(user)}
                              >
                                编辑用户
                              </MenuItem>
                              <MenuItem
                                icon={<RiUserForbidLine />}
                                onClick={() => handleBanUser(user.id)}
                                color={user.status === 'banned' ? 'green.500' : 'orange.500'}
                              >
                                {user.status === 'banned' ? '解除封禁' : '封禁用户'}
                              </MenuItem>
                              <MenuItem
                                icon={<RiDeleteBinLine />}
                                color="red.500"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                删除用户
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>

                        <Divider />

                        {/* 联系信息 */}
                        <VStack spacing={2} w="full" align="start">
                          <HStack spacing={2}>
                            <RiMailLine color="gray.500" />
                            <Text fontSize="sm" color="gray.600">
                              {user.email}
                            </Text>
                          </HStack>
                          <HStack spacing={2}>
                            <RiPhoneLine color="gray.500" />
                            <Text fontSize="sm" color="gray.600">
                              {user.phone}
                            </Text>
                          </HStack>
                          <HStack spacing={2}>
                            <RiCalendarLine color="gray.500" />
                            <Text fontSize="sm" color="gray.600">
                              注册: {formatDate(user.created_at)}
                            </Text>
                          </HStack>
                        </VStack>

                        {/* 使用统计 */}
                        <Box w="full">
                          <Grid templateColumns="1fr 1fr" gap={4}>
                            <VStack spacing={1}>
                              <Text fontSize="lg" fontWeight="bold" color="primary.500">
                                {formatNumber(user.total_usage)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                总使用量
                              </Text>
                            </VStack>
                            <VStack spacing={1}>
                              <Text fontSize="lg" fontWeight="bold" color="green.500">
                                {formatNumber(user.monthly_usage)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                月使用量
                              </Text>
                            </VStack>
                          </Grid>
                        </Box>
                      </VStack>
                    </Card>
                  </MotionBox>
                ))}
              </Grid>

              {/* 分页 */}
              {totalPages > 1 && (
                <Card>
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.500">
                      显示 {startIndex + 1}-{Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length)} 
                      ，共 {filteredUsers.length} 个用户
                    </Text>
                    
                    <HStack spacing={2}>
                      <IconButton
                        icon={<RiArrowLeftLine />}
                        aria-label="上一页"
                        size="sm"
                        variant="ghost"
                        isDisabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      />
                      
                      <HStack spacing={1}>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = i + 1
                          if (totalPages > 5) {
                            if (currentPage > 3) {
                              pageNum = currentPage - 2 + i
                            }
                            if (currentPage > totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            }
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={currentPage === pageNum ? 'solid' : 'ghost'}
                              colorScheme={currentPage === pageNum ? 'primary' : 'gray'}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </HStack>
                      
                      <IconButton
                        icon={<RiArrowRightLine />}
                        aria-label="下一页"
                        size="sm"
                        variant="ghost"
                        isDisabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      />
                    </HStack>
                  </HStack>
                </Card>
              )}
            </>
          )}
        </MotionBox>
      </VStack>

      {/* 创建/编辑用户模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedUser ? '编辑用户' : '新建用户'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack w="full">
                <FormControl>
                  <FormLabel>姓名</FormLabel>
                  <Input 
                    placeholder="请输入用户姓名"
                    defaultValue={selectedUser?.name || ''}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>角色</FormLabel>
                  <Select defaultValue={selectedUser?.role || 'user'}>
                    <option value="user">普通用户</option>
                    <option value="moderator">协调员</option>
                    <option value="admin">管理员</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>邮箱</FormLabel>
                <Input 
                  type="email"
                  placeholder="请输入邮箱地址"
                  defaultValue={selectedUser?.email || ''}
                />
              </FormControl>

              <FormControl>
                <FormLabel>手机号</FormLabel>
                <Input 
                  placeholder="请输入手机号"
                  defaultValue={selectedUser?.phone || ''}
                />
              </FormControl>

              <HStack w="full">
                <FormControl>
                  <FormLabel>订阅类型</FormLabel>
                  <Select defaultValue={selectedUser?.subscription || 'free'}>
                    <option value="free">免费版</option>
                    <option value="premium">高级版</option>
                    <option value="enterprise">企业版</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">激活状态</FormLabel>
                  <Switch 
                    defaultChecked={selectedUser?.status === 'active'}
                    colorScheme="green"
                  />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button colorScheme="primary" onClick={() => {
              toast({
                title: selectedUser ? '用户信息已更新' : '用户创建成功',
                status: 'success',
                duration: 3000,
                isClosable: true,
              })
              onClose()
            }}>
              {selectedUser ? '保存' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 用户详情模态框 */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>用户详情</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <VStack spacing={6} align="stretch">
                <HStack spacing={4}>
                  <Avatar
                    name={selectedUser.name}
                    src={selectedUser.avatar}
                    size="xl"
                    bg="primary.500"
                  />
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Text fontSize="2xl" fontWeight="bold">
                        {selectedUser.name}
                      </Text>
                      {getStatusBadge(selectedUser.status)}
                    </HStack>
                    <HStack spacing={3}>
                      {getRoleBadge(selectedUser.role)}
                      {getSubscriptionBadge(selectedUser.subscription)}
                    </HStack>
                  </VStack>
                </HStack>

                <Grid templateColumns="1fr 1fr" gap={6}>
                  <VStack align="start" spacing={3}>
                    <Text fontSize="lg" fontWeight="semibold">基本信息</Text>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Text fontWeight="medium" minW="80px">邮箱:</Text>
                        <Text>{selectedUser.email}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="medium" minW="80px">手机:</Text>
                        <Text>{selectedUser.phone}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="medium" minW="80px">注册时间:</Text>
                        <Text>{formatDate(selectedUser.created_at)}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="medium" minW="80px">最后登录:</Text>
                        <Text>{formatDate(selectedUser.last_login)}</Text>
                      </HStack>
                    </VStack>
                  </VStack>

                  <VStack align="start" spacing={3}>
                    <Text fontSize="lg" fontWeight="semibold">使用统计</Text>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Text fontWeight="medium" minW="80px">总使用量:</Text>
                        <Text color="primary.500" fontWeight="bold">
                          {formatNumber(selectedUser.total_usage)}
                        </Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="medium" minW="80px">月使用量:</Text>
                        <Text color="green.500" fontWeight="bold">
                          {formatNumber(selectedUser.monthly_usage)}
                        </Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </Grid>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>关闭</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageLayout>
  )
}
