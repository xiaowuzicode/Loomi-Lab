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
  app_id: string
  merchant_order_id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  order_type: 'payment' | 'recharge'
  amount: number
  currency: string
  payment_gateway: string
  gateway_transaction_id?: string
  extra_data?: any
  created_at: string
  updated_at: string
}

interface RefundOrder {
  id: string
  app_id: string
  payment_order_id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  refund_amount: number
  currency: string
  reason?: string
  gateway_refund_id?: string
  merchant_order_id: string
  original_amount: number
  gateway_transaction_id: string
  order_type: string
  payment_gateway: string
  created_at: string
  updated_at: string
}

interface PaymentStats {
  total_revenue: number
  today_revenue: number
  total_orders: number
  completed_orders: number
  pending_orders: number
  failed_orders: number
  total_refunds?: number
  total_refund_orders?: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [refunds, setRefunds] = useState<RefundOrder[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    total_revenue: 0,
    today_revenue: 0,
    total_orders: 0,
    completed_orders: 0,
    pending_orders: 0,
    failed_orders: 0,
    total_refunds: 0,
    total_refund_orders: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [appIdFilter, setAppIdFilter] = useState('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState('all')
  const [currentTab, setCurrentTab] = useState('payments') // 'payments' | 'refunds'
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 获取支付数据
  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // 构建查询参数
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (appIdFilter !== 'all') params.append('app_id', appIdFilter)
      if (orderTypeFilter !== 'all') params.append('order_type', orderTypeFilter)
      if (searchTerm) params.append('search_term', searchTerm)
      
      // 时间筛选
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }
        
        if (startDate.getTime() > 0) {
          params.append('start_date', startDate.toISOString())
          params.append('end_date', now.toISOString())
        }
      }
      
      const response = await fetch(`/api/payments?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setPayments(result.data || [])
        setStats(result.stats || stats)
      } else {
        throw new Error(result.error || '获取数据失败')
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: '获取支付数据失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取退款数据
  const fetchRefunds = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (appIdFilter !== 'all') params.append('app_id', appIdFilter)
      if (searchTerm) params.append('search_term', searchTerm)
      
      // 时间筛选
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }
        
        if (startDate.getTime() > 0) {
          params.append('start_date', startDate.toISOString())
          params.append('end_date', now.toISOString())
        }
      }
      
      const response = await fetch(`/api/refunds?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setRefunds(result.data || [])
        // 更新退款统计数据
        if (result.stats) {
          setStats(prev => ({
            ...prev,
            total_refunds: result.stats.total_refunds || 0,
            total_refund_orders: result.stats.total_refund_orders || 0
          }))
        }
      } else {
        throw new Error(result.error || '获取退款数据失败')
      }
    } catch (error) {
      console.error('Error fetching refunds:', error)
      toast({
        title: '获取退款数据失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentTab === 'payments') {
      fetchPayments()
    } else {
      fetchRefunds()
    }
  }, [statusFilter, dateFilter, appIdFilter, orderTypeFilter, searchTerm, currentTab])

  // 数据已在API层过滤，这里直接使用
  const filteredPayments = payments
  const filteredRefunds = refunds

  const handleExportData = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (appIdFilter !== 'all') params.append('app_id', appIdFilter)
      if (orderTypeFilter !== 'all' && currentTab === 'payments') params.append('order_type', orderTypeFilter)
      if (searchTerm) params.append('search_term', searchTerm)
      
      // 时间筛选
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }
        
        if (startDate.getTime() > 0) {
          params.append('start_date', startDate.toISOString())
          params.append('end_date', now.toISOString())
        }
      }

      const exportUrl = currentTab === 'payments' 
        ? `/api/payments/export?${params.toString()}`
        : `/api/refunds/export?${params.toString()}`

      // 创建下载链接
      const link = document.createElement('a')
      link.href = exportUrl
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: '导出成功',
        description: `${currentTab === 'payments' ? '支付' : '退款'}数据已导出为 CSV 文件`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: '导出失败',
        description: '导出数据时发生错误，请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      succeeded: { color: 'green', label: '已完成', icon: RiCheckLine },
      pending: { color: 'yellow', label: '待处理', icon: RiTimeLine },
      processing: { color: 'blue', label: '处理中', icon: RiTimeLine },
      failed: { color: 'red', label: '失败', icon: RiCloseLine },
    }
    
    const config = statusConfig[status] || { color: 'gray', label: status, icon: RiTimeLine }
    return (
      <Badge colorScheme={config.color} variant="subtle">
        <HStack spacing={1}>
          <Box as={config.icon} />
          <Text>{config.label}</Text>
        </HStack>
      </Badge>
    )
  }

  const getOrderTypeBadge = (orderType: string) => {
    const typeConfig: Record<string, { color: string; label: string }> = {
      payment: { color: 'purple', label: '支付' },
      recharge: { color: 'green', label: '充值' },
    }
    
    const config = typeConfig[orderType] || { color: 'gray', label: orderType }
    return (
      <Tag colorScheme={config.color} size="sm">
        {config.label}
      </Tag>
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

  // 统计数据来自API
  const totalRevenue = stats.total_revenue / 100 // 从分转换为元
  const todayRevenue = stats.today_revenue / 100

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
              value={stats.completed_orders}
              icon={RiCheckLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="待处理订单"
              value={stats.pending_orders}
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
              {/* 切换标签 */}
              <HStack spacing={0}>
                <Button
                  size="sm"
                  variant={currentTab === 'payments' ? 'solid' : 'ghost'}
                  colorScheme="primary"
                  onClick={() => setCurrentTab('payments')}
                  borderRadius="md"
                >
                  支付订单
                </Button>
                <Button
                  size="sm"
                  variant={currentTab === 'refunds' ? 'solid' : 'ghost'}
                  colorScheme="primary"
                  onClick={() => setCurrentTab('refunds')}
                  borderRadius="md"
                >
                  退款订单
                </Button>
              </HStack>

              <InputGroup maxW="400px">
                <InputLeftElement>
                  <RiSearchLine color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder={currentTab === 'payments' ? "搜索商户订单号、交易号..." : "搜索商户订单号、退款原因..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Select maxW="120px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">全部状态</option>
                <option value="succeeded">已完成</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="failed">失败</option>
              </Select>

              {currentTab === 'payments' && (
                <Select maxW="120px" value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)}>
                  <option value="all">全部类型</option>
                  <option value="payment">支付</option>
                  <option value="recharge">充值</option>
                </Select>
              )}

              <Select maxW="120px" value={appIdFilter} onChange={(e) => setAppIdFilter(e.target.value)}>
                <option value="all">全部应用</option>
                <option value="ai_project_alpha">AI项目Alpha</option>
                <option value="ai_project_beta">AI项目Beta</option>
              </Select>

              <Select maxW="120px" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
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
                onClick={handleExportData}
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
                {currentTab === 'payments' ? '支付记录' : '退款记录'} ({currentTab === 'payments' ? filteredPayments.length : filteredRefunds.length})
              </Text>
              
              {loading ? (
                <VStack spacing={3}>
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} height="60px" borderRadius="md" />
                  ))}
                </VStack>
              ) : currentTab === 'payments' ? (
                filteredPayments.length === 0 ? (
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
                          <Th>应用ID</Th>
                          <Th>金额</Th>
                          <Th>类型</Th>
                          <Th>支付网关</Th>
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
                                <Text fontWeight="medium" fontSize="sm" color="primary.500">
                                  {payment.merchant_order_id}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  ID: {payment.id.slice(0, 8)}...
                                </Text>
                                {payment.gateway_transaction_id && (
                                  <Tag size="sm" variant="outline">
                                    {payment.gateway_transaction_id}
                                  </Tag>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontFamily="mono">
                                {payment.app_id}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontWeight="semibold" color="green.500">
                                {formatCurrency(payment.amount / 100, payment.currency)}
                              </Text>
                            </Td>
                            <Td>
                              {getOrderTypeBadge(payment.order_type)}
                            </Td>
                            <Td>
                              <Tag colorScheme="blue" size="sm">
                                {payment.payment_gateway}
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
                                    导出记录
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )
              ) : (
                filteredRefunds.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    没有找到符合条件的退款记录
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>退款信息</Th>
                          <Th>原订单</Th>
                          <Th>应用ID</Th>
                          <Th>退款金额</Th>
                          <Th>退款原因</Th>
                          <Th>状态</Th>
                          <Th>创建时间</Th>
                          <Th>操作</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredRefunds.map((refund) => (
                          <Tr key={refund.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium" fontSize="sm" color="red.500">
                                  {refund.id.slice(0, 12)}...
                                </Text>
                                {refund.gateway_refund_id && (
                                  <Tag size="sm" variant="outline" colorScheme="red">
                                    {refund.gateway_refund_id}
                                  </Tag>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color="primary.500">
                                  {refund.merchant_order_id}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  原金额: {formatCurrency(refund.original_amount / 100, refund.currency)}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontFamily="mono">
                                {refund.app_id}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontWeight="semibold" color="red.500">
                                -{formatCurrency(refund.refund_amount / 100, refund.currency)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" noOfLines={2}>
                                {refund.reason || '无'}
                              </Text>
                            </Td>
                            <Td>
                              {getStatusBadge(refund.status)}
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {formatDate(refund.created_at)}
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
                                    导出记录
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )
              )}
            </VStack>
          </Card>
        </MotionBox>
      </VStack>
    </PageLayout>
  )
}
