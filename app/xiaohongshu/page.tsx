'use client'

import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  useColorModeValue,
  Badge,
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
  Textarea,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  Avatar,
  Switch,
  Progress,
  Divider,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  RiSearchLine,
  RiUserLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiAddLine,
  RiEyeLine,
  RiSendPlaneLine,
  RiCalendarLine,
  RiTimeLine,
  RiCheckLine,
  RiCloseLine,
  RiPauseLine,
  RiPlayLine,
  RiHeartLine,
  RiShareLine,
  RiImageLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'

const MotionBox = motion(Box)

interface XiaohongshuAccount {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  followers_count: number
  following_count: number
  posts_count: number
  status: 'active' | 'suspended' | 'inactive'
  is_verified: boolean
  created_at: string
  last_post_at?: string
}

interface ScheduledPost {
  id: string
  account_id: string
  account_name: string
  title: string
  content: string
  images: string[]
  scheduled_time: string
  status: 'pending' | 'published' | 'failed' | 'cancelled'
  created_at: string
}

export default function XiaohongshuPage() {
  const [accounts, setAccounts] = useState<XiaohongshuAccount[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState<XiaohongshuAccount | null>(null)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const { isOpen: isAccountOpen, onOpen: onAccountOpen, onClose: onAccountClose } = useDisclosure()
  const { isOpen: isPostOpen, onOpen: onPostOpen, onClose: onPostClose } = useDisclosure()
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 模拟数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockAccounts: XiaohongshuAccount[] = [
        {
          id: 'acc_001',
          username: 'fashionista_lily',
          display_name: '时尚达人Lily',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
          followers_count: 25600,
          following_count: 1200,
          posts_count: 156,
          status: 'active',
          is_verified: true,
          created_at: '2024-01-15T10:30:00Z',
          last_post_at: '2024-01-20T14:30:00Z',
        },
        {
          id: 'acc_002',
          username: 'beauty_queen88',
          display_name: '美妆小仙女',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          followers_count: 18900,
          following_count: 890,
          posts_count: 203,
          status: 'active',
          is_verified: false,
          created_at: '2024-01-10T08:20:00Z',
          last_post_at: '2024-01-19T16:45:00Z',
        },
        {
          id: 'acc_003',
          username: 'lifestyle_guru',
          display_name: '生活方式博主',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          followers_count: 8750,
          following_count: 450,
          posts_count: 89,
          status: 'inactive',
          is_verified: false,
          created_at: '2024-01-05T14:15:00Z',
          last_post_at: '2024-01-12T10:20:00Z',
        },
      ]

      const mockScheduledPosts: ScheduledPost[] = [
        {
          id: 'post_001',
          account_id: 'acc_001',
          account_name: '时尚达人Lily',
          title: '春季穿搭指南 | 温柔系女孩必备',
          content: '春天来了，分享几个超实用的春季穿搭技巧✨\n\n1️⃣ 针织开衫 + 半身裙\n2️⃣ 白T恤 + 牛仔裤\n3️⃣ 连衣裙 + 小外套\n\n每一套都超级显气质，姐妹们赶紧get起来！',
          images: [
            'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop',
          ],
          scheduled_time: '2024-01-22T20:00:00Z',
          status: 'pending',
          created_at: '2024-01-20T10:30:00Z',
        },
        {
          id: 'post_002',
          account_id: 'acc_002',
          account_name: '美妆小仙女',
          title: '平价好用的护肤品推荐',
          content: '今天给大家推荐几款平价又好用的护肤品💕\n\n🧴 洁面：xx氨基酸洁面\n🧴 爽肤水：xx玻尿酸水\n🧴 面霜：xx保湿霜\n\n学生党也能轻松负担！',
          images: [
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=400&fit=crop',
          ],
          scheduled_time: '2024-01-21T19:30:00Z',
          status: 'published',
          created_at: '2024-01-19T15:20:00Z',
        },
        {
          id: 'post_003',
          account_id: 'acc_001',
          account_name: '时尚达人Lily',
          title: '居家好物分享',
          content: '分享一些提升幸福感的居家好物🏠\n\n✨ 香薰蜡烛\n✨ 懒人沙发\n✨ 收纳盒\n\n让你的家变得更温馨舒适～',
          images: [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=400&fit=crop',
          ],
          scheduled_time: '2024-01-23T21:00:00Z',
          status: 'failed',
          created_at: '2024-01-18T09:15:00Z',
        },
      ]
      
      setAccounts(mockAccounts)
      setScheduledPosts(mockScheduledPosts)
      setLoading(false)
    }

    fetchData()
  }, [])

  // 过滤账号
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateAccount = () => {
    setSelectedAccount(null)
    onAccountOpen()
  }

  const handleEditAccount = (account: XiaohongshuAccount) => {
    setSelectedAccount(account)
    onAccountOpen()
  }

  const handleCreatePost = () => {
    setSelectedPost(null)
    onPostOpen()
  }

  const handleEditPost = (post: ScheduledPost) => {
    setSelectedPost(post)
    onPostOpen()
  }

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(account => account.id !== accountId))
    toast({
      title: '账号已删除',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleDeletePost = (postId: string) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== postId))
    toast({
      title: '定时发布已删除',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const getAccountStatusBadge = (status: XiaohongshuAccount['status']) => {
    const statusConfig = {
      active: { color: 'green', label: '正常' },
      suspended: { color: 'red', label: '已封禁' },
      inactive: { color: 'gray', label: '未激活' },
    }
    
    const config = statusConfig[status]
    return (
      <Badge colorScheme={config.color} variant="subtle">
        {config.label}
      </Badge>
    )
  }

  const getPostStatusBadge = (status: ScheduledPost['status']) => {
    const statusConfig = {
      pending: { color: 'yellow', label: '待发布', icon: RiTimeLine },
      published: { color: 'green', label: '已发布', icon: RiCheckLine },
      failed: { color: 'red', label: '发布失败', icon: RiCloseLine },
      cancelled: { color: 'gray', label: '已取消', icon: RiPauseLine },
    }
    
    const config = statusConfig[status]
    return (
      <Badge colorScheme={config.color} variant="subtle">
        <HStack spacing={1}>
          <Box as={config.icon} />
          <Text>{config.label}</Text>
        </HStack>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w'
    }
    return new Intl.NumberFormat('zh-CN').format(num)
  }

  // 计算统计数据
  const totalFollowers = accounts.reduce((sum, account) => sum + account.followers_count, 0)
  const activeAccounts = accounts.filter(acc => acc.status === 'active').length
  const pendingPosts = scheduledPosts.filter(post => post.status === 'pending').length

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
              📱 小红书管理
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理小红书账号矩阵，自动化内容发布和定时任务
            </Text>
          </VStack>
        </MotionBox>

        {/* 统计卡片 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <HStack spacing={6} flexWrap="wrap">
            <StatCard
              title="管理账号"
              value={accounts.length}
              icon={RiUserLine}
              iconColor="blue.400"
              loading={loading}
            />
            <StatCard
              title="活跃账号"
              value={activeAccounts}
              icon={RiCheckLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="总粉丝数"
              value={formatNumber(totalFollowers)}
              icon={RiHeartLine}
              iconColor="red.400"
              loading={loading}
            />
            <StatCard
              title="待发布内容"
              value={pendingPosts}
              icon={RiTimeLine}
              iconColor="yellow.400"
              loading={loading}
            />
          </HStack>
        </MotionBox>

        <Tabs variant="enclosed" colorScheme="primary">
          <TabList>
            <Tab>账号管理</Tab>
            <Tab>内容发布</Tab>
            <Tab>定时任务</Tab>
          </TabList>

          <TabPanels>
            {/* 账号管理面板 */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6} align="stretch">
                {/* 搜索和操作 */}
                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <HStack spacing={4} flexWrap="wrap">
                      <InputGroup maxW="400px">
                        <InputLeftElement>
                          <RiSearchLine color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="搜索账号用户名或昵称..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                      
                      <Select maxW="150px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">全部状态</option>
                        <option value="active">正常</option>
                        <option value="suspended">已封禁</option>
                        <option value="inactive">未激活</option>
                      </Select>

                      <Button
                        leftIcon={<RiAddLine />}
                        onClick={handleCreateAccount}
                        colorScheme="primary"
                      >
                        绑定账号
                      </Button>
                    </HStack>
                  </Card>
                </MotionBox>

                {/* 账号列表 */}
                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {loading ? (
                    <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} height="250px" borderRadius="xl" />
                      ))}
                    </Grid>
                  ) : filteredAccounts.length === 0 ? (
                    <Card>
                      <Alert status="info">
                        <AlertIcon />
                        没有找到符合条件的账号
                      </Alert>
                    </Card>
                  ) : (
                    <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                      {filteredAccounts.map((account) => (
                        <MotionBox
                          key={account.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card hover>
                            <VStack align="start" spacing={4}>
                              <Flex justify="space-between" w="full" align="start">
                                <HStack spacing={3}>
                                  <Avatar
                                    size="lg"
                                    name={account.display_name}
                                    src={account.avatar_url}
                                  />
                                  <VStack align="start" spacing={1}>
                                    <HStack>
                                      <Text fontWeight="bold" fontSize="md">
                                        {account.display_name}
                                      </Text>
                                      {account.is_verified && (
                                        <Badge colorScheme="blue" variant="solid" size="sm">
                                          认证
                                        </Badge>
                                      )}
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500">
                                      @{account.username}
                                    </Text>
                                    {getAccountStatusBadge(account.status)}
                                  </VStack>
                                </HStack>

                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<RiMoreLine />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem
                                      icon={<RiEditLine />}
                                      onClick={() => handleEditAccount(account)}
                                    >
                                      编辑账号
                                    </MenuItem>
                                    <MenuItem
                                      icon={<RiSendPlaneLine />}
                                      onClick={handleCreatePost}
                                    >
                                      创建发布
                                    </MenuItem>
                                    <MenuItem
                                      icon={<RiDeleteBinLine />}
                                      color="red.500"
                                      onClick={() => handleDeleteAccount(account.id)}
                                    >
                                      删除账号
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Flex>

                              <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                                <VStack align="center" spacing={1}>
                                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                                    {formatNumber(account.followers_count)}
                                  </Text>
                                  <Text fontSize="xs" color="gray.400">粉丝</Text>
                                </VStack>
                                <VStack align="center" spacing={1}>
                                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                                    {formatNumber(account.following_count)}
                                  </Text>
                                  <Text fontSize="xs" color="gray.400">关注</Text>
                                </VStack>
                                <VStack align="center" spacing={1}>
                                  <Text fontSize="lg" fontWeight="bold" color="purple.500">
                                    {formatNumber(account.posts_count)}
                                  </Text>
                                  <Text fontSize="xs" color="gray.400">作品</Text>
                                </VStack>
                              </Grid>

                              <VStack align="start" spacing={1} w="full">
                                <Text fontSize="xs" color="gray.400">
                                  绑定时间: {formatDate(account.created_at)}
                                </Text>
                                {account.last_post_at && (
                                  <Text fontSize="xs" color="gray.400">
                                    最后发布: {formatDate(account.last_post_at)}
                                  </Text>
                                )}
                              </VStack>
                            </VStack>
                          </Card>
                        </MotionBox>
                      ))}
                    </Grid>
                  )}
                </MotionBox>
              </VStack>
            </TabPanel>

            {/* 内容发布面板 */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6} align="stretch">
                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <HStack justify="space-between">
                      <Text fontSize="lg" fontWeight="semibold">内容发布管理</Text>
                      <Button
                        leftIcon={<RiAddLine />}
                        onClick={handleCreatePost}
                        colorScheme="primary"
                      >
                        新建发布
                      </Button>
                    </HStack>
                  </Card>
                </MotionBox>

                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {loading ? (
                    <VStack spacing={4}>
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} height="200px" borderRadius="xl" w="full" />
                      ))}
                    </VStack>
                  ) : scheduledPosts.length === 0 ? (
                    <Card>
                      <Alert status="info">
                        <AlertIcon />
                        暂无发布内容
                      </Alert>
                    </Card>
                  ) : (
                    <VStack spacing={4}>
                      {scheduledPosts.map((post) => (
                        <MotionBox
                          key={post.id}
                          whileHover={{ scale: 1.01 }}
                          w="full"
                        >
                          <Card hover>
                            <Grid templateColumns="auto 1fr auto" gap={4} alignItems="start">
                              {/* 图片预览 */}
                              <Box>
                                {post.images.length > 0 && (
                                  <Image
                                    src={post.images[0]}
                                    alt={post.title}
                                    borderRadius="md"
                                    w="80px"
                                    h="80px"
                                    objectFit="cover"
                                  />
                                )}
                              </Box>

                              {/* 内容信息 */}
                              <VStack align="start" spacing={2}>
                                <HStack>
                                  <Text fontWeight="bold" fontSize="md">
                                    {post.title}
                                  </Text>
                                  {getPostStatusBadge(post.status)}
                                </HStack>
                                <Text fontSize="sm" color="gray.500">
                                  账号: {post.account_name}
                                </Text>
                                <Text fontSize="sm" color="gray.600" noOfLines={3}>
                                  {post.content}
                                </Text>
                                <HStack spacing={4}>
                                  <Text fontSize="xs" color="gray.400">
                                    定时发布: {formatDate(post.scheduled_time)}
                                  </Text>
                                  <Text fontSize="xs" color="gray.400">
                                    创建时间: {formatDate(post.created_at)}
                                  </Text>
                                </HStack>
                              </VStack>

                              {/* 操作按钮 */}
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
                                    onClick={() => handleEditPost(post)}
                                  >
                                    查看详情
                                  </MenuItem>
                                  <MenuItem
                                    icon={<RiEditLine />}
                                    onClick={() => handleEditPost(post)}
                                  >
                                    编辑内容
                                  </MenuItem>
                                  {post.status === 'pending' && (
                                    <MenuItem
                                      icon={<RiPlayLine />}
                                      color="green.500"
                                    >
                                      立即发布
                                    </MenuItem>
                                  )}
                                  <MenuItem
                                    icon={<RiDeleteBinLine />}
                                    color="red.500"
                                    onClick={() => handleDeletePost(post.id)}
                                  >
                                    删除发布
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Grid>
                          </Card>
                        </MotionBox>
                      ))}
                    </VStack>
                  )}
                </MotionBox>
              </VStack>
            </TabPanel>

            {/* 定时任务面板 */}
            <TabPanel p={0} pt={6}>
              <MotionBox
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <VStack spacing={6} align="stretch">
                    <Text fontSize="lg" fontWeight="semibold">定时发布日历</Text>
                    
                    <Alert status="info">
                      <AlertIcon />
                      定时发布功能正在开发中，敬请期待！
                    </Alert>

                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <VStack align="start" spacing={4}>
                          <Text fontSize="md" fontWeight="semibold">今日任务</Text>
                          <VStack spacing={3} align="stretch">
                            {scheduledPosts
                              .filter(post => {
                                const today = new Date().toDateString()
                                const postDate = new Date(post.scheduled_time).toDateString()
                                return postDate === today
                              })
                              .map(post => (
                                <Box
                                  key={post.id}
                                  p={3}
                                  borderWidth="1px"
                                  borderColor={borderColor}
                                  borderRadius="md"
                                  bg={bgColor}
                                >
                                  <VStack align="start" spacing={2}>
                                    <HStack justify="space-between" w="full">
                                      <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                                        {post.title}
                                      </Text>
                                      {getPostStatusBadge(post.status)}
                                    </HStack>
                                    <Text fontSize="xs" color="gray.500">
                                      {post.account_name} · {new Date(post.scheduled_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                  </VStack>
                                </Box>
                              ))}
                            {scheduledPosts.filter(post => {
                              const today = new Date().toDateString()
                              const postDate = new Date(post.scheduled_time).toDateString()
                              return postDate === today
                            }).length === 0 && (
                              <Text fontSize="sm" color="gray.400" textAlign="center">
                                今日无发布任务
                              </Text>
                            )}
                          </VStack>
                        </VStack>
                      </GridItem>

                      <GridItem>
                        <VStack align="start" spacing={4}>
                          <Text fontSize="md" fontWeight="semibold">任务统计</Text>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="sm">待发布</Text>
                              <Badge colorScheme="yellow">
                                {scheduledPosts.filter(p => p.status === 'pending').length}
                              </Badge>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="sm">已发布</Text>
                              <Badge colorScheme="green">
                                {scheduledPosts.filter(p => p.status === 'published').length}
                              </Badge>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="sm">发布失败</Text>
                              <Badge colorScheme="red">
                                {scheduledPosts.filter(p => p.status === 'failed').length}
                              </Badge>
                            </HStack>
                          </VStack>
                        </VStack>
                      </GridItem>
                    </Grid>
                  </VStack>
                </Card>
              </MotionBox>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* 绑定/编辑账号模态框 */}
      <Modal isOpen={isAccountOpen} onClose={onAccountClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedAccount ? '编辑账号' : '绑定账号'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>用户名</FormLabel>
                <Input 
                  placeholder="请输入小红书用户名"
                  defaultValue={selectedAccount?.username || ''}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>昵称</FormLabel>
                <Input 
                  placeholder="请输入显示昵称"
                  defaultValue={selectedAccount?.display_name || ''}
                />
              </FormControl>

              <FormControl>
                <FormLabel>头像URL</FormLabel>
                <Input 
                  placeholder="请输入头像链接"
                  defaultValue={selectedAccount?.avatar_url || ''}
                />
              </FormControl>

              <HStack w="full">
                <FormControl>
                  <FormLabel>状态</FormLabel>
                  <Select defaultValue={selectedAccount?.status || 'active'}>
                    <option value="active">正常</option>
                    <option value="suspended">已封禁</option>
                    <option value="inactive">未激活</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">认证账号</FormLabel>
                  <Switch 
                    defaultChecked={selectedAccount?.is_verified || false}
                    colorScheme="blue"
                  />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAccountClose}>
              取消
            </Button>
            <Button colorScheme="primary" onClick={() => {
              toast({
                title: selectedAccount ? '账号信息已更新' : '账号绑定成功',
                status: 'success',
                duration: 3000,
                isClosable: true,
              })
              onAccountClose()
            }}>
              {selectedAccount ? '保存' : '绑定'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 创建/编辑发布内容模态框 */}
      <Modal isOpen={isPostOpen} onClose={onPostClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            {selectedPost ? '编辑发布内容' : '创建发布内容'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <VStack spacing={4}>
              <HStack w="full">
                <FormControl>
                  <FormLabel>发布账号</FormLabel>
                  <Select defaultValue={selectedPost?.account_id || ''}>
                    {accounts.filter(acc => acc.status === 'active').map(account => (
                      <option key={account.id} value={account.id}>
                        {account.display_name} (@{account.username})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>发布时间</FormLabel>
                  <Input 
                    type="datetime-local"
                    defaultValue={selectedPost?.scheduled_time ? 
                      new Date(selectedPost.scheduled_time).toISOString().slice(0, 16) : ''
                    }
                  />
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>标题</FormLabel>
                <Input 
                  placeholder="请输入内容标题"
                  defaultValue={selectedPost?.title || ''}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>内容</FormLabel>
                <Textarea 
                  placeholder="请输入发布内容"
                  defaultValue={selectedPost?.content || ''}
                  rows={8}
                />
              </FormControl>

              <FormControl>
                <FormLabel>图片 (可选)</FormLabel>
                <VStack align="start" spacing={2}>
                  <Button
                    leftIcon={<RiImageLine />}
                    variant="outline"
                    size="sm"
                  >
                    上传图片
                  </Button>
                  {selectedPost?.images && selectedPost.images.length > 0 && (
                    <HStack spacing={2}>
                      {selectedPost.images.map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`Image ${index + 1}`}
                          w="60px"
                          h="60px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                      ))}
                    </HStack>
                  )}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPostClose}>
              取消
            </Button>
            <Button colorScheme="primary" onClick={() => {
              toast({
                title: selectedPost ? '发布内容已更新' : '发布内容已创建',
                status: 'success',
                duration: 3000,
                isClosable: true,
              })
              onPostClose()
            }}>
              {selectedPost ? '保存' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageLayout>
  )
}
