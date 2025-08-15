'use client'

import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Badge,
  Alert,
  AlertIcon,
  Skeleton,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { RiSearchLine, RiAddLine, RiQuillPenLine } from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'

const MotionBox = motion(Box)

interface Prompt {
  id: string
  name: string
  description: string
  category: string
  type: 'system' | 'user' | 'assistant'
  content: string
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 模拟数据加载
  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockPrompts: Prompt[] = [
        {
          id: 'prompt_001',
          name: '小红书文案生成',
          description: '生成符合小红书平台特色的种草文案，包含emoji和话题标签',
          category: '文案生成',
          type: 'system',
          content: '你是一个专业的小红书文案创作专家...',
          is_active: true,
          usage_count: 1250,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-20T15:45:00Z',
        },
        {
          id: 'prompt_002',
          name: '智能客服回复',
          description: '为用户咨询提供专业、友好的客服回复',
          category: '客服对话',
          type: 'system',
          content: '你是一个专业的客服助手...',
          is_active: true,
          usage_count: 890,
          created_at: '2024-01-12T08:20:00Z',
          updated_at: '2024-01-18T12:30:00Z',
        },
      ]
      
      setPrompts(mockPrompts)
      setLoading(false)
    }

    fetchPrompts()
  }, [])

  const filteredPrompts = prompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              ✍️ 提示词管理
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理 AI 提示词模板，优化生成效果和质量
            </Text>
          </VStack>
        </MotionBox>

        {/* 搜索和操作 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <HStack spacing={4} flexWrap="wrap">
              <InputGroup maxW="400px">
                <InputLeftElement>
                  <RiSearchLine color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="搜索提示词名称或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Button
                leftIcon={<RiAddLine />}
                colorScheme="primary"
              >
                新建提示词
              </Button>
            </HStack>
          </Card>
        </MotionBox>

        {/* 提示词列表 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {loading ? (
            <VStack spacing={4}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height="150px" borderRadius="xl" w="full" />
              ))}
            </VStack>
          ) : filteredPrompts.length === 0 ? (
            <Card>
              <Alert status="info">
                <AlertIcon />
                没有找到符合条件的提示词
              </Alert>
            </Card>
          ) : (
            <VStack spacing={4}>
              {filteredPrompts.map((prompt) => (
                <Card key={prompt.id} hover>
                  <VStack align="start" spacing={3}>
                    <HStack justify="space-between" w="full">
                      <HStack>
                        <Text fontWeight="bold" fontSize="lg">
                          {prompt.name}
                        </Text>
                        <Badge colorScheme="blue" variant="subtle">
                          {prompt.type}
                        </Badge>
                        <Badge colorScheme="gray" variant="outline">
                          {prompt.category}
                        </Badge>
                        <Badge colorScheme={prompt.is_active ? 'green' : 'gray'}>
                          {prompt.is_active ? '启用' : '禁用'}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        使用次数: {prompt.usage_count}
                      </Text>
                    </HStack>
                    <Text color="gray.600" fontSize="sm">
                      {prompt.description}
                    </Text>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </MotionBox>
      </VStack>
    </PageLayout>
  )
}
