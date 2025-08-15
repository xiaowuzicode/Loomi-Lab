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
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tag,
  Tooltip,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  RiSearchLine,
  RiMoneyDollarCircleLine,
  RiMoreLine,
  RiEyeLine,
  RiDownloadLine,
  RiRefreshLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiTimeLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'

const MotionBox = motion(Box)

interface Payment {
  id: string
  user_id: string
  user_email: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  payment_method: string
  created_at: string
  updated_at: string
  description?: string
  transaction_id?: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 模拟数据
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockPayments: Payment[] = [
        {
          id: 'pay_001',
          user_id: '1',
          user_email: 'john@example.com',
          amount: 99.00,
          currency: 'CNY',
          status: 'completed',
          payment_method: '微信支付',
          created_at: '2024-01-20T10:30:00Z',
          updated_at: '2024-01-20T10:31:00Z',
          description: 'AI文案生成服务 - 月度套餐',
          transaction_id: 'wx_123456789',
        },
        {
          id: 'pay_002',
          user_id: '2',
          user_email: 'jane@example.com',
          amount: 299.00,
          currency: 'CNY',
          status: 'pending',
          payment_method: '支付宝',
          created_at: '2024-01-20T14:15:00Z',
          updated_at: '2024-01-20T14:15:00Z',
          description: 'AI智能回复服务 - 季度套餐',
          transaction_id: 'alipay_987654321',
        },
        {
          id: 'pay_003',
          user_id: '3',
          user_email: 'bob@example.com',
          amount: 199.00,
          currency: 'CNY',
          status: 'failed',
          payment_method: '银行卡',
          created_at: '2024-01-19T16:45:00Z',
          updated_at: '2024-01-19T16:46:00Z',
          description: '内容优化服务 - 月度套餐',
          transaction_id: 'bank_456789123',
        },
        {
          id: 'pay_004',
          user_id: '1',
          user_email: 'john@example.com',
          amount: 599.00,
          currency: 'CNY',
          status: 'completed',
          payment_method: '微信支付',
          created_at: '2024-01-18T09:20:00Z',
          updated_at: '2024-01-18T09:21:00Z',
          description: 'AI全套服务 - 年度套餐',
          transaction_id: 'wx_789123456',
        },
      ]
      
      setPayments(mockPayments)
      setLoading(false)
    }

    fetchPayments()
  }, [])

  // 过滤支付记录
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== 'all') {
      const paymentDate = new Date(payment.created_at)
      const now = new Date()
      const diffTime = now.getTime() - paymentDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      switch (dateFilter) {
        case 'today':
          matchesDate = diffDays <= 1
          break
        case 'week':
          matchesDate = diffDays <= 7
          break
        case 'month':
          matchesDate = diffDays <= 30
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const handleExportPayments = () => {
    toast({
      title: '导出成功',
      description: '支付数据已导出为 CSV 文件',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const getStatusBadge = (status: Payment['status']) => {
    const statusConfig = {
      completed: { color: 'green', label: '已完成', icon: RiCheckLine },
      pending: { color: 'yellow', label: '处理中', icon: RiTimeLine },
      failed: { color: 'red', label: '失败', icon: RiCloseLine },
      cancelled: { color: 'gray', label: '已取消', icon: RiCloseLine },
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency === 'CNY' ? 'CNY' : 'USD',
    }).format(amount)
  }

  // 计算统计数据
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const todayRevenue = payments
    .filter(p => {
      const today = new Date().toDateString()
      const paymentDate = new Date(p.created_at).toDateString()
      return p.status === 'completed' && paymentDate === today
    })
    .reduce((sum, p) => sum + p.amount, 0)

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
              💳 支付管理
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理订单支付，监控收入情况和交易状态
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
              title="总收入"
              value={totalRevenue}
              format="currency"
              icon={RiMoneyDollarCircleLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="今日收入"
              value={todayRevenue}
              format="currency"
              icon={RiCalendarLine}
              iconColor="blue.400"
              loading={loading}
            />
            <StatCard
              title="成功订单"
              value={payments.filter(p => p.status === 'completed').length}
              icon={RiCheckLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="待处理订单"
              value={payments.filter(p => p.status === 'pending').length}
              icon={RiTimeLine}
              iconColor="yellow.400"
              loading={loading}
            />
          </HStack>
        </MotionBox>

        {/* 搜索和筛选 */}
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
                  placeholder="搜索用户邮箱、交易号或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Select maxW="150px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">全部状态</option>
                <option value="completed">已完成</option>
                <option value="pending">处理中</option>
                <option value="failed">失败</option>
                <option value="cancelled">已取消</option>
              </Select>

              <Select maxW="150px" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">全部时间</option>
                <option value="today">今天</option>
                <option value="week">最近7天</option>
                <option value="month">最近30天</option>
              </Select>

              <Button
                leftIcon={<RiRefreshLine />}
                onClick={() => window.location.reload()}
                variant="outline"
              >
                刷新
              </Button>

              <Button
                leftIcon={<RiDownloadLine />}
                onClick={handleExportPayments}
                colorScheme="primary"
              >
                导出数据
              </Button>
            </HStack>
          </Card>
        </MotionBox>

        {/* 支付列表 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="semibold">
                支付记录 ({filteredPayments.length})
              </Text>
              
              {loading ? (
                <VStack spacing={3}>
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} height="60px" borderRadius="md" />
                  ))}
                </VStack>
              ) : filteredPayments.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  没有找到符合条件的支付记录
                </Alert>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>订单信息</Th>
                        <Th>用户</Th>
                        <Th>金额</Th>
                        <Th>支付方式</Th>
                        <Th>状态</Th>
                        <Th>创建时间</Th>
                        <Th>操作</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredPayments.map((payment) => (
                        <Tr key={payment.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium" fontSize="sm">
                                {payment.id}
                              </Text>
                              <Text fontSize="xs" color="gray.500" noOfLines={2}>
                                {payment.description}
                              </Text>
                              {payment.transaction_id && (
                                <Tag size="sm" variant="outline">
                                  {payment.transaction_id}
                                </Tag>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <Text fontSize="sm">{payment.user_email}</Text>
                          </Td>
                          <Td>
                            <Text fontWeight="semibold" color="green.500">
                              {formatCurrency(payment.amount, payment.currency)}
                            </Text>
                          </Td>
                          <Td>
                            <Tag colorScheme="blue" size="sm">
                              {payment.payment_method}
                            </Tag>
                          </Td>
                          <Td>
                            {getStatusBadge(payment.status)}
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {formatDate(payment.created_at)}
                            </Text>
                          </Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<RiMoreLine />}
                                variant="ghost"
                                size="sm"
                              />
                              <MenuList>
                                <MenuItem icon={<RiEyeLine />}>
                                  查看详情
                                </MenuItem>
                                <MenuItem icon={<RiDownloadLine />}>
                                  下载凭证
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </VStack>
          </Card>
        </MotionBox>
      </VStack>
    </PageLayout>
  )
}
