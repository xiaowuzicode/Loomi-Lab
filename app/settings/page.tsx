'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Avatar,
  IconButton,
  useToast,
  SimpleGrid,
  Alert,
  AlertIcon,
  Textarea,
  Select,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  RiSettingsLine,
  RiUserLine,
  RiLockPasswordLine,
  RiNotificationLine,
  RiPaletteLine,
  RiShieldLine,
  RiEditLine,
  RiSaveLine,
  RiCameraLine,
} from 'react-icons/ri'
import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

const MotionBox = motion(Box)

interface ProfileFormData {
  username: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  bio: string
  timezone: string
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const toast = useToast()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    bio: '',
    timezone: 'Asia/Shanghai',
  })

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    twoFactorAuth: false,
    loginAlerts: true,
  })

  if (isLoading) {
    return (
      <PageLayout>
        <Box p={6}>
          <Text>加载中...</Text>
        </Box>
      </PageLayout>
    )
  }

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const handleInputChange = (field: keyof ProfileFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSettingChange = (setting: keyof typeof settings) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      [setting]: e.target.checked
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast({
      title: '设置已保存',
      description: '您的账户设置已成功更新',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
    
    setIsSaving(false)
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    if (!formData.currentPassword) {
      toast({
        title: '密码不能为空',
        description: '请输入当前密码',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!formData.newPassword) {
      toast({
        title: '新密码不能为空',
        description: '请输入新密码',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: '密码不一致',
        description: '新密码与确认密码不匹配',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 模拟密码修改过程
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast({
      title: '密码已更新',
      description: '您的密码已成功修改，下次登录时请使用新密码',
      status: 'success',
      duration: 5000,
      isClosable: true,
    })
    
    // 清空密码字段
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }))
    
    setIsSaving(false)
  }

  return (
    <PageLayout>
      <VStack spacing={6} align="stretch" p={6}>
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
              ⚙️ 账户设置
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理您的账户偏好设置和安全选项
            </Text>
          </VStack>
        </MotionBox>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* 基本信息设置 */}
          <MotionBox
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <RiUserLine />
                    <Text fontSize="lg" fontWeight="semibold">
                      基本信息
                    </Text>
                  </HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={isEditing ? <RiSaveLine /> : <RiEditLine />}
                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                    isLoading={isSaving}
                    loadingText="保存中"
                  >
                    {isEditing ? '保存' : '编辑'}
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  {/* 头像设置 */}
                  <HStack spacing={4} w="full">
                    <Avatar
                      size="lg"
                      name={user.username}
                      src="/images/loomi-icon.svg"
                      bg="primary.500"
                      color="white"
                    />
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">头像</Text>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RiCameraLine />}
                        isDisabled={!isEditing}
                      >
                        更换头像
                      </Button>
                    </VStack>
                  </HStack>

                  <Divider />

                  <FormControl>
                    <FormLabel>用户名</FormLabel>
                    <Input
                      value={formData.username}
                      onChange={handleInputChange('username')}
                      isDisabled={!isEditing}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>邮箱</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      isDisabled={!isEditing}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>个人简介</FormLabel>
                    <Textarea
                      value={formData.bio}
                      onChange={handleInputChange('bio')}
                      placeholder="写点什么介绍自己..."
                      isDisabled={!isEditing}
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>时区</FormLabel>
                    <Select
                      value={formData.timezone}
                      onChange={handleInputChange('timezone')}
                      isDisabled={!isEditing}
                    >
                      <option value="Asia/Shanghai">中国标准时间 (GMT+8)</option>
                      <option value="Asia/Tokyo">日本标准时间 (GMT+9)</option>
                      <option value="America/New_York">美国东部时间 (GMT-5)</option>
                      <option value="Europe/London">格林威治时间 (GMT+0)</option>
                    </Select>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>

          {/* 安全设置 */}
          <MotionBox
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <VStack spacing={6}>
              {/* 密码修改 */}
              <Card w="full">
                <CardHeader>
                  <HStack spacing={3}>
                    <RiLockPasswordLine />
                    <Text fontSize="lg" fontWeight="semibold">
                      密码修改
                    </Text>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>当前密码</FormLabel>
                      <Input
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange('currentPassword')}
                        placeholder="输入当前密码"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>新密码</FormLabel>
                      <Input
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange('newPassword')}
                        placeholder="输入新密码"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>确认新密码</FormLabel>
                      <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange('confirmPassword')}
                        placeholder="再次输入新密码"
                      />
                    </FormControl>

                    <Button
                      w="full"
                      colorScheme="primary"
                      onClick={handlePasswordChange}
                      isLoading={isSaving}
                      loadingText="修改中"
                    >
                      修改密码
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* 安全选项 */}
              <Card w="full">
                <CardHeader>
                  <HStack spacing={3}>
                    <RiShieldLine />
                    <Text fontSize="lg" fontWeight="semibold">
                      安全选项
                    </Text>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <HStack justify="space-between" w="full">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">双因子认证</Text>
                        <Text fontSize="sm" color="gray.500">
                          增强账户安全性
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={settings.twoFactorAuth}
                        onChange={handleSettingChange('twoFactorAuth')}
                        colorScheme="primary"
                      />
                    </HStack>

                    <HStack justify="space-between" w="full">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">登录提醒</Text>
                        <Text fontSize="sm" color="gray.500">
                          异常登录时发送通知
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={settings.loginAlerts}
                        onChange={handleSettingChange('loginAlerts')}
                        colorScheme="primary"
                      />
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </MotionBox>

          {/* 通知设置 */}
          <MotionBox
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <HStack spacing={3}>
                  <RiNotificationLine />
                  <Text fontSize="lg" fontWeight="semibold">
                    通知偏好
                  </Text>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <HStack justify="space-between" w="full">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">邮件通知</Text>
                      <Text fontSize="sm" color="gray.500">
                        接收系统邮件通知
                      </Text>
                    </VStack>
                    <Switch
                      isChecked={settings.emailNotifications}
                      onChange={handleSettingChange('emailNotifications')}
                      colorScheme="primary"
                    />
                  </HStack>

                  <HStack justify="space-between" w="full">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">推送通知</Text>
                      <Text fontSize="sm" color="gray.500">
                        接收浏览器推送通知
                      </Text>
                    </VStack>
                    <Switch
                      isChecked={settings.pushNotifications}
                      onChange={handleSettingChange('pushNotifications')}
                      colorScheme="primary"
                    />
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>

          {/* 账户状态 */}
          <MotionBox
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <HStack spacing={3}>
                  <RiShieldLine />
                  <Text fontSize="lg" fontWeight="semibold">
                    账户状态
                  </Text>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack spacing={3}>
                    <Text fontWeight="medium">角色:</Text>
                    <Badge colorScheme="purple" variant="subtle">
                      超级管理员
                    </Badge>
                  </HStack>
                  
                  <HStack spacing={3}>
                    <Text fontWeight="medium">状态:</Text>
                    <Badge colorScheme="green" variant="subtle">
                      正常
                    </Badge>
                  </HStack>

                  <HStack spacing={3}>
                    <Text fontWeight="medium">上次登录:</Text>
                    <Text color="gray.600">2024-01-20 14:30:25</Text>
                  </HStack>

                  <Alert status="info" mt={4}>
                    <AlertIcon />
                    您拥有系统最高管理权限，请妥善保管账户信息。
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>
        </SimpleGrid>
      </VStack>
    </PageLayout>
  )
}
