'use client'

import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  VStack,
  useColorModeValue,
  Badge,
  Flex,
  FormControl,
  FormLabel,
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
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  RiSettings3Line,
  RiMoneyDollarCircleLine,
  RiSaveLine,
  RiRefreshLine,
  RiEditLine,
  RiDeleteBinLine,
  RiAddLine,
  RiDatabase2Line,
  RiShieldLine,
  RiNotificationLine,
  RiCheckLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'

const MotionBox = motion(Box)

interface SystemConfig {
  id: string
  category: string
  key: string
  label: string
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean' | 'select'
  options?: string[]
  description?: string
  is_sensitive?: boolean
  updated_at: string
}

interface PricingTier {
  id: string
  name: string
  description: string
  price: number
  currency: string
  features: string[]
  token_limit: number
  is_active: boolean
  sort_order: number
}

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 模拟数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockConfigs: SystemConfig[] = [
        // AI 配置
        {
          id: 'ai_001',
          category: 'AI配置',
          key: 'openai_api_key',
          label: 'OpenAI API Key',
          value: 'sk-*********************',
          type: 'string',
          description: 'OpenAI API 密钥，用于调用GPT模型',
          is_sensitive: true,
          updated_at: '2024-01-20T15:30:00Z',
        },
        {
          id: 'ai_002',
          category: 'AI配置',
          key: 'default_model',
          label: '默认模型',
          value: 'gpt-3.5-turbo',
          type: 'select',
          options: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
          description: '系统默认使用的AI模型',
          updated_at: '2024-01-18T10:20:00Z',
        },
        {
          id: 'ai_003',
          category: 'AI配置',
          key: 'max_tokens',
          label: '最大Token数',
          value: 2000,
          type: 'number',
          description: 'AI生成内容的最大Token限制',
          updated_at: '2024-01-15T14:45:00Z',
        },
        // 系统配置
        {
          id: 'sys_001',
          category: '系统配置',
          key: 'site_name',
          label: '站点名称',
          value: 'Loomi-Lab 智能体管理平台',
          type: 'string',
          description: '系统显示的站点名称',
          updated_at: '2024-01-20T09:15:00Z',
        },
        {
          id: 'sys_002',
          category: '系统配置',
          key: 'maintenance_mode',
          label: '维护模式',
          value: false,
          type: 'boolean',
          description: '启用后系统将进入维护模式',
          updated_at: '2024-01-19T16:30:00Z',
        },
        {
          id: 'sys_003',
          category: '系统配置',
          key: 'max_upload_size',
          label: '最大上传大小(MB)',
          value: 50,
          type: 'number',
          description: '文件上传的最大大小限制',
          updated_at: '2024-01-17T11:20:00Z',
        },
        // 通知配置
        {
          id: 'notify_001',
          category: '通知配置',
          key: 'email_notifications',
          label: '邮件通知',
          value: true,
          type: 'boolean',
          description: '启用系统邮件通知功能',
          updated_at: '2024-01-16T13:45:00Z',
        },
        {
          id: 'notify_002',
          category: '通知配置',
          key: 'smtp_host',
          label: 'SMTP服务器',
          value: 'smtp.gmail.com',
          type: 'string',
          description: '邮件发送服务器地址',
          updated_at: '2024-01-16T13:40:00Z',
        },
      ]

      const mockPricingTiers: PricingTier[] = [
        {
          id: 'tier_001',
          name: '基础版',
          description: '适合个人用户和小团队',
          price: 99,
          currency: 'CNY',
          features: ['AI文案生成', '基础模板', '月度报告', '邮件支持'],
          token_limit: 10000,
          is_active: true,
          sort_order: 1,
        },
        {
          id: 'tier_002',
          name: '专业版',
          description: '适合中小企业和专业团队',
          price: 299,
          currency: 'CNY',
          features: ['AI文案生成', '高级模板', '智能优化', '实时分析', '优先支持'],
          token_limit: 50000,
          is_active: true,
          sort_order: 2,
        },
        {
          id: 'tier_003',
          name: '企业版',
          description: '适合大型企业和机构',
          price: 999,
          currency: 'CNY',
          features: ['所有功能', '自定义模型', '专属客服', 'API访问', '数据导出'],
          token_limit: 200000,
          is_active: true,
          sort_order: 3,
        },
      ]
      
      setConfigs(mockConfigs)
      setPricingTiers(mockPricingTiers)
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleConfigChange = (configId: string, newValue: string | number | boolean) => {
    setConfigs(prev => prev.map(config => 
      config.id === configId 
        ? { ...config, value: newValue, updated_at: new Date().toISOString() }
        : config
    ))
  }

  const handleSaveConfigs = async () => {
    setSaving(true)
    // 模拟保存
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    
    toast({
      title: '配置已保存',
      description: '系统配置更新成功',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handlePricingChange = (tierId: string, field: string, value: any) => {
    setPricingTiers(prev => prev.map(tier =>
      tier.id === tierId ? { ...tier, [field]: value } : tier
    ))
  }

  const renderConfigInput = (config: SystemConfig) => {
    const commonProps = {
      size: 'sm',
      onChange: (e: any) => {
        const value = config.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
        handleConfigChange(config.id, value)
      }
    }

    switch (config.type) {
      case 'boolean':
        return (
          <Switch
            isChecked={config.value as boolean}
            onChange={(e) => handleConfigChange(config.id, e.target.checked)}
            colorScheme="primary"
          />
        )
      
      case 'number':
        return (
          <NumberInput
            value={config.value as number}
            onChange={(_, value) => handleConfigChange(config.id, value || 0)}
            size="sm"
            maxW="200px"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        )
      
      case 'select':
        return (
          <Select
            value={config.value as string}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            size="sm"
            maxW="200px"
          >
            {config.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        )
      
      default:
        return (
          <Input
            value={config.is_sensitive ? '••••••••••••••••••••' : config.value as string}
            type={config.is_sensitive ? 'password' : 'text'}
            maxW="300px"
            {...commonProps}
          />
        )
    }
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

  // 按类别分组配置
  const configsByCategory = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push(config)
    return acc
  }, {} as Record<string, SystemConfig[]>)

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
              ⚙️ 系统配置
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理系统参数、定价策略和元数据配置
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
              title="配置项总数"
              value={configs.length}
              icon={RiSettings3Line}
              iconColor="blue.400"
              loading={loading}
            />
            <StatCard
              title="定价方案"
              value={pricingTiers.filter(t => t.is_active).length}
              icon={RiMoneyDollarCircleLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="敏感配置"
              value={configs.filter(c => c.is_sensitive).length}
              icon={RiShieldLine}
              iconColor="red.400"
              loading={loading}
            />
            <StatCard
              title="系统状态"
              value="正常"
              icon={RiDatabase2Line}
              iconColor="green.400"
              loading={loading}
            />
          </HStack>
        </MotionBox>

        <Tabs variant="enclosed" colorScheme="primary">
          <TabList>
            <Tab>系统配置</Tab>
            <Tab>定价管理</Tab>
            <Tab>安全设置</Tab>
          </TabList>

          <TabPanels>
            {/* 系统配置面板 */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6} align="stretch">
                {/* 保存按钮 */}
                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <HStack justify="space-between">
                      <Text fontSize="lg" fontWeight="semibold">系统参数配置</Text>
                      <HStack>
                        <Button
                          leftIcon={<RiRefreshLine />}
                          onClick={() => window.location.reload()}
                          variant="outline"
                          size="sm"
                        >
                          重置
                        </Button>
                        <Button
                          leftIcon={<RiSaveLine />}
                          onClick={handleSaveConfigs}
                          isLoading={saving}
                          loadingText="保存中..."
                          colorScheme="primary"
                          size="sm"
                        >
                          保存配置
                        </Button>
                      </HStack>
                    </HStack>
                  </Card>
                </MotionBox>

                {/* 配置项列表 */}
                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {loading ? (
                    <VStack spacing={4}>
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} height="300px" borderRadius="xl" w="full" />
                      ))}
                    </VStack>
                  ) : (
                    <Grid templateColumns="1fr" gap={6}>
                      {Object.entries(configsByCategory).map(([category, categoryConfigs]) => (
                        <Card key={category} w="full" minH="400px">
                          <VStack align="stretch" spacing={4} h="full">
                            <HStack>
                              <Box
                                as={category === 'AI配置' ? RiSettings3Line : 
                                   category === '系统配置' ? RiDatabase2Line : RiNotificationLine}
                                color="primary.500"
                                boxSize={5}
                              />
                              <Text fontSize="lg" fontWeight="semibold">{category}</Text>
                            </HStack>
                            <Divider />
                            <VStack spacing={4} align="stretch">
                              {categoryConfigs.map((config) => (
                                <Grid
                                  key={config.id}
                                  templateColumns="1fr 2fr auto 150px"
                                  gap={4}
                                  alignItems="center"
                                >
                                  <VStack align="start" spacing={1}>
                                    <HStack>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {config.label}
                                      </Text>
                                      {config.is_sensitive && (
                                        <Badge colorScheme="red" size="sm">敏感</Badge>
                                      )}
                                    </HStack>
                                    <Text fontSize="xs" color="gray.500">
                                      {config.key}
                                    </Text>
                                  </VStack>
                                  
                                  <Text fontSize="sm" color="gray.600">
                                    {config.description}
                                  </Text>
                                  
                                  <Box>
                                    {renderConfigInput(config)}
                                  </Box>
                                  
                                  <Text fontSize="xs" color="gray.400">
                                    {formatDate(config.updated_at)}
                                  </Text>
                                </Grid>
                              ))}
                            </VStack>
                          </VStack>
                        </Card>
                      ))}
                    </Grid>
                  )}
                </MotionBox>
              </VStack>
            </TabPanel>

            {/* 定价管理面板 */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6} align="stretch">
                <MotionBox
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <HStack justify="space-between">
                      <Text fontSize="lg" fontWeight="semibold">定价方案管理</Text>
                      <Button
                        leftIcon={<RiAddLine />}
                        colorScheme="primary"
                        size="sm"
                      >
                        新增方案
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
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} height="400px" borderRadius="xl" />
                      ))}
                    </Grid>
                  ) : (
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                      {pricingTiers
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((tier) => (
                          <MotionBox
                            key={tier.id}
                            whileHover={{ scale: 1.02 }}
                          >
                            <Card hover>
                              <VStack align="stretch" spacing={4}>
                                <Flex justify="space-between" align="start">
                                  <VStack align="start" spacing={2}>
                                    <HStack>
                                      <Text fontSize="xl" fontWeight="bold">
                                        {tier.name}
                                      </Text>
                                      <Badge 
                                        colorScheme={tier.is_active ? 'green' : 'gray'}
                                        variant="subtle"
                                      >
                                        {tier.is_active ? '启用' : '禁用'}
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500">
                                      {tier.description}
                                    </Text>
                                  </VStack>
                                  
                                  <HStack>
                                    <Tooltip label="编辑方案">
                                      <IconButton
                                        icon={<RiEditLine />}
                                        size="sm"
                                        variant="ghost"
                                        aria-label="编辑"
                                      />
                                    </Tooltip>
                                    <Tooltip label="删除方案">
                                      <IconButton
                                        icon={<RiDeleteBinLine />}
                                        size="sm"
                                        variant="ghost"
                                        colorScheme="red"
                                        aria-label="删除"
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Flex>

                                <Divider />

                                <VStack align="stretch" spacing={3}>
                                  <HStack justify="center">
                                    <Text fontSize="3xl" fontWeight="bold" color="primary.500">
                                      {formatCurrency(tier.price, tier.currency)}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">/月</Text>
                                  </HStack>
                                  
                                  <HStack justify="center">
                                    <Text fontSize="sm" color="gray.500">
                                      Token限额: {tier.token_limit.toLocaleString()}
                                    </Text>
                                  </HStack>
                                </VStack>

                                <Divider />

                                <VStack align="stretch" spacing={2}>
                                  <Text fontSize="sm" fontWeight="semibold">功能特性:</Text>
                                  {tier.features.map((feature, index) => (
                                    <HStack key={index} spacing={2}>
                                      <Box as={RiCheckLine} color="green.500" boxSize={4} />
                                      <Text fontSize="sm">{feature}</Text>
                                    </HStack>
                                  ))}
                                </VStack>

                                <Divider />

                                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                  <FormLabel htmlFor={`tier-${tier.id}`} mb="0" fontSize="sm">
                                    启用方案
                                  </FormLabel>
                                  <Switch
                                    id={`tier-${tier.id}`}
                                    isChecked={tier.is_active}
                                    onChange={(e) => handlePricingChange(tier.id, 'is_active', e.target.checked)}
                                    colorScheme="green"
                                  />
                                </FormControl>
                              </VStack>
                            </Card>
                          </MotionBox>
                        ))}
                    </Grid>
                  )}
                </MotionBox>
              </VStack>
            </TabPanel>

            {/* 安全设置面板 */}
            <TabPanel p={0} pt={6}>
              <MotionBox
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <VStack spacing={6} align="stretch">
                    <HStack>
                      <Box as={RiShieldLine} color="red.500" boxSize={6} />
                      <Text fontSize="lg" fontWeight="semibold">安全设置</Text>
                    </HStack>
                    
                    <Alert status="warning">
                      <AlertIcon />
                      安全设置功能正在开发中，包括API密钥管理、访问控制、审计日志等功能。
                    </Alert>

                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <VStack align="start" spacing={4}>
                          <Text fontSize="md" fontWeight="semibold">API 安全</Text>
                          <VStack spacing={3} align="stretch">
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel mb="0" fontSize="sm">启用 API 密钥验证</FormLabel>
                              <Switch defaultChecked colorScheme="green" />
                            </FormControl>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel mb="0" fontSize="sm">启用 IP 白名单</FormLabel>
                              <Switch colorScheme="green" />
                            </FormControl>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel mb="0" fontSize="sm">启用请求限流</FormLabel>
                              <Switch defaultChecked colorScheme="green" />
                            </FormControl>
                          </VStack>
                        </VStack>
                      </GridItem>

                      <GridItem>
                        <VStack align="start" spacing={4}>
                          <Text fontSize="md" fontWeight="semibold">数据安全</Text>
                          <VStack spacing={3} align="stretch">
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel mb="0" fontSize="sm">数据加密存储</FormLabel>
                              <Switch defaultChecked colorScheme="green" />
                            </FormControl>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel mb="0" fontSize="sm">敏感数据脱敏</FormLabel>
                              <Switch defaultChecked colorScheme="green" />
                            </FormControl>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel mb="0" fontSize="sm">自动备份</FormLabel>
                              <Switch defaultChecked colorScheme="green" />
                            </FormControl>
                          </VStack>
                        </VStack>
                      </GridItem>
                    </Grid>

                    <Divider />

                    <VStack align="start" spacing={4}>
                      <Text fontSize="md" fontWeight="semibold">敏感配置项</Text>
                      <TableContainer w="full">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>配置项</Th>
                              <Th>类别</Th>
                              <Th>最后更新</Th>
                              <Th>操作</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {configs.filter(c => c.is_sensitive).map(config => (
                              <Tr key={config.id}>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontSize="sm" fontWeight="medium">
                                      {config.label}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {config.key}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <Badge colorScheme="blue" variant="subtle">
                                    {config.category}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="xs">
                                    {formatDate(config.updated_at)}
                                  </Text>
                                </Td>
                                <Td>
                                  <HStack>
                                    <Tooltip label="编辑">
                                      <IconButton
                                        icon={<RiEditLine />}
                                        size="xs"
                                        variant="ghost"
                                        aria-label="编辑"
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </VStack>
                  </VStack>
                </Card>
              </MotionBox>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </PageLayout>
  )
}
