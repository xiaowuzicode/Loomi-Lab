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
  Image,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  RiSearchLine,
  RiBookOpenLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiAddLine,
  RiEyeLine,
  RiHeartLine,
  RiShareLine,
  RiFireLine,
  RiLineChartLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'

const MotionBox = motion(Box)

interface ContentItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  platform: string
  engagement_rate: number
  likes: number
  shares: number
  views: number
  status: 'published' | 'draft' | 'archived'
  created_at: string
  updated_at: string
  thumbnail?: string
}

export default function ContentLibraryPage() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure()
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 模拟数据
  useEffect(() => {
    const fetchContents = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockContents: ContentItem[] = [
        {
          id: 'content_001',
          title: '秋季穿搭指南｜温柔系女孩必备单品',
          content: '秋天来了，又到了展现温柔系穿搭的季节～今天给大家分享几个超实用的秋季穿搭技巧，让你轻松变身温柔小仙女✨\n\n1️⃣ 针织开衫 + 半身裙\n温柔的针织开衫搭配飘逸的半身裙，既保暖又优雅...',
          category: '穿搭',
          tags: ['秋季穿搭', '温柔系', '针织开衫', '半身裙'],
          platform: '小红书',
          engagement_rate: 8.5,
          likes: 1250,
          shares: 89,
          views: 15600,
          status: 'published',
          created_at: '2024-01-20T10:30:00Z',
          updated_at: '2024-01-20T15:45:00Z',
          thumbnail: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=200&fit=crop',
        },
        {
          id: 'content_002',
          title: '护肤小白必看｜建立正确护肤步骤',
          content: '很多小仙女问我护肤的正确步骤是什么？今天就来详细分享一下基础护肤的完整流程～\n\n🧼 第一步：清洁\n选择温和的洁面产品，早晚各一次...',
          category: '美妆',
          tags: ['护肤', '护肤步骤', '护肤小白', '基础护肤'],
          platform: '小红书',
          engagement_rate: 12.3,
          likes: 2100,
          shares: 156,
          views: 18900,
          status: 'published',
          created_at: '2024-01-18T14:20:00Z',
          updated_at: '2024-01-18T16:30:00Z',
          thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=200&fit=crop',
        },
        {
          id: 'content_003',
          title: '居家好物推荐｜提升幸福感的小物件',
          content: '分享一些我最近入手的居家好物，每一样都超级实用，真的能让生活幸福感翻倍！💕\n\n🕯️ 香薰蜡烛\n点上一支香薰蜡烛，瞬间营造温馨氛围...',
          category: '居家',
          tags: ['居家好物', '生活好物', '幸福感', '居家装饰'],
          platform: '小红书',
          engagement_rate: 6.8,
          likes: 890,
          shares: 67,
          views: 12400,
          status: 'published',
          created_at: '2024-01-15T11:15:00Z',
          updated_at: '2024-01-15T12:20:00Z',
          thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
        },
        {
          id: 'content_004',
          title: '减脂期间这样吃｜营养师推荐食谱',
          content: '减脂不等于节食！今天分享几个营养师推荐的减脂食谱，既能满足营养需求，又能帮助健康减重～\n\n🥗 早餐：燕麦杯\n燕麦 + 酸奶 + 蓝莓...',
          category: '健康',
          tags: ['减脂', '健康饮食', '营养食谱', '减肥'],
          platform: '小红书',
          engagement_rate: 9.2,
          likes: 1680,
          shares: 124,
          views: 16800,
          status: 'draft',
          created_at: '2024-01-19T09:30:00Z',
          updated_at: '2024-01-19T10:45:00Z',
          thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=200&fit=crop',
        },
      ]
      
      setContents(mockContents)
      setLoading(false)
    }

    fetchContents()
  }, [])

  // 获取所有可用标签
  const allTags = Array.from(new Set(contents.flatMap(content => content.tags)))

  // 过滤内容
  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || content.category === categoryFilter
    const matchesPlatform = platformFilter === 'all' || content.platform === platformFilter
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => content.tags.includes(tag))
    
    return matchesSearch && matchesCategory && matchesPlatform && matchesTags
  })

  const handleCreateContent = () => {
    setSelectedContent(null)
    onOpen()
  }

  const handleEditContent = (content: ContentItem) => {
    setSelectedContent(content)
    onOpen()
  }

  const handleViewContent = (content: ContentItem) => {
    setSelectedContent(content)
    onViewOpen()
  }

  const handleDeleteContent = (contentId: string) => {
    setContents(prev => prev.filter(content => content.id !== contentId))
    toast({
      title: '内容已删除',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag))
    } else {
      setSelectedTags(prev => [...prev, tag])
    }
  }

  const getStatusBadge = (status: ContentItem['status']) => {
    const statusConfig = {
      published: { color: 'green', label: '已发布' },
      draft: { color: 'yellow', label: '草稿' },
      archived: { color: 'gray', label: '已归档' },
    }
    
    const config = statusConfig[status]
    return (
      <Badge colorScheme={config.color} variant="subtle">
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w'
    }
    return new Intl.NumberFormat('zh-CN').format(num)
  }

  // 计算统计数据
  const totalViews = contents.reduce((sum, content) => sum + content.views, 0)
  const totalLikes = contents.reduce((sum, content) => sum + content.likes, 0)
  const avgEngagement = contents.length > 0 ? 
    contents.reduce((sum, content) => sum + content.engagement_rate, 0) / contents.length : 0

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
              📚 爆文库管理
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理高质量内容素材，分析爆文数据和趋势
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
              title="内容总数"
              value={contents.length}
              icon={RiBookOpenLine}
              iconColor="blue.400"
              loading={loading}
            />
            <StatCard
              title="总浏览量"
              value={formatNumber(totalViews)}
              icon={RiEyeLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="总点赞数"
              value={formatNumber(totalLikes)}
              icon={RiHeartLine}
              iconColor="red.400"
              loading={loading}
            />
            <StatCard
              title="平均互动率"
              value={avgEngagement.toFixed(1)}
              suffix="%"
              icon={RiLineChartLine}
              iconColor="purple.400"
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
            <VStack spacing={4} align="stretch">
              <HStack spacing={4} flexWrap="wrap">
                <InputGroup maxW="400px">
                  <InputLeftElement>
                    <RiSearchLine color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="搜索标题、内容或标签..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <Select maxW="150px" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">全部分类</option>
                  <option value="穿搭">穿搭</option>
                  <option value="美妆">美妆</option>
                  <option value="居家">居家</option>
                  <option value="健康">健康</option>
                </Select>

                <Select maxW="150px" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
                  <option value="all">全部平台</option>
                  <option value="小红书">小红书</option>
                  <option value="抖音">抖音</option>
                  <option value="微博">微博</option>
                </Select>

                <Button
                  leftIcon={<RiAddLine />}
                  onClick={handleCreateContent}
                  colorScheme="primary"
                >
                  新建内容
                </Button>
              </HStack>

              {/* 标签筛选 */}
              {allTags.length > 0 && (
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>热门标签:</Text>
                  <Wrap>
                    {allTags.slice(0, 10).map(tag => (
                      <WrapItem key={tag}>
                        <Tag
                          size="sm"
                          variant={selectedTags.includes(tag) ? 'solid' : 'outline'}
                          colorScheme="primary"
                          cursor="pointer"
                          onClick={() => handleTagSelect(tag)}
                        >
                          <TagLabel>{tag}</TagLabel>
                          {selectedTags.includes(tag) && (
                            <TagCloseButton onClick={(e) => {
                              e.stopPropagation()
                              handleTagSelect(tag)
                            }} />
                          )}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
            </VStack>
          </Card>
        </MotionBox>

        {/* 内容列表 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {loading ? (
            <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} height="300px" borderRadius="xl" />
              ))}
            </Grid>
          ) : filteredContents.length === 0 ? (
            <Card>
              <Alert status="info">
                <AlertIcon />
                没有找到符合条件的内容
              </Alert>
            </Card>
          ) : (
            <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
              {filteredContents.map((content) => (
                <MotionBox
                  key={content.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card hover>
                    <VStack align="start" spacing={4}>
                      {/* 缩略图 */}
                      {content.thumbnail && (
                        <Image
                          src={content.thumbnail}
                          alt={content.title}
                          borderRadius="md"
                          w="full"
                          h="150px"
                          objectFit="cover"
                        />
                      )}

                      <Flex justify="space-between" w="full" align="start">
                        <VStack align="start" spacing={2} flex={1}>
                          <HStack>
                            <Badge colorScheme="blue" variant="subtle">
                              {content.category}
                            </Badge>
                            <Badge colorScheme="purple" variant="subtle">
                              {content.platform}
                            </Badge>
                            {getStatusBadge(content.status)}
                          </HStack>
                          <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                            {content.title}
                          </Text>
                          <Text color="gray.500" fontSize="sm" noOfLines={3}>
                            {content.content}
                          </Text>
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
                              onClick={() => handleViewContent(content)}
                            >
                              查看详情
                            </MenuItem>
                            <MenuItem
                              icon={<RiEditLine />}
                              onClick={() => handleEditContent(content)}
                            >
                              编辑内容
                            </MenuItem>
                            <MenuItem
                              icon={<RiDeleteBinLine />}
                              color="red.500"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              删除内容
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Flex>

                      {/* 标签 */}
                      <Wrap>
                        {content.tags.slice(0, 3).map(tag => (
                          <WrapItem key={tag}>
                            <Tag size="sm" variant="outline">
                              {tag}
                            </Tag>
                          </WrapItem>
                        ))}
                        {content.tags.length > 3 && (
                          <WrapItem>
                            <Tag size="sm" variant="outline" color="gray.400">
                              +{content.tags.length - 3}
                            </Tag>
                          </WrapItem>
                        )}
                      </Wrap>

                      {/* 数据统计 */}
                      <Grid templateColumns="repeat(4, 1fr)" gap={2} w="full">
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">浏览</Text>
                          <HStack spacing={1}>
                            <RiEyeLine size="12px" color="gray.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {formatNumber(content.views)}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">点赞</Text>
                          <HStack spacing={1}>
                            <RiHeartLine size="12px" color="red.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {formatNumber(content.likes)}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">分享</Text>
                          <HStack spacing={1}>
                            <RiShareLine size="12px" color="blue.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {formatNumber(content.shares)}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">互动率</Text>
                          <HStack spacing={1}>
                            <RiFireLine size="12px" color="orange.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {content.engagement_rate}%
                            </Text>
                          </HStack>
                        </VStack>
                      </Grid>

                      <Text fontSize="xs" color="gray.400">
                        更新时间: {formatDate(content.updated_at)}
                      </Text>
                    </VStack>
                  </Card>
                </MotionBox>
              ))}
            </Grid>
          )}
        </MotionBox>
      </VStack>

      {/* 创建/编辑内容模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedContent ? '编辑内容' : '新建内容'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>标题</FormLabel>
                <Input 
                  placeholder="请输入内容标题"
                  defaultValue={selectedContent?.title || ''}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>内容</FormLabel>
                <Textarea 
                  placeholder="请输入内容正文"
                  defaultValue={selectedContent?.content || ''}
                  rows={6}
                />
              </FormControl>

              <HStack w="full">
                <FormControl>
                  <FormLabel>分类</FormLabel>
                  <Select defaultValue={selectedContent?.category || ''}>
                    <option value="穿搭">穿搭</option>
                    <option value="美妆">美妆</option>
                    <option value="居家">居家</option>
                    <option value="健康">健康</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>平台</FormLabel>
                  <Select defaultValue={selectedContent?.platform || ''}>
                    <option value="小红书">小红书</option>
                    <option value="抖音">抖音</option>
                    <option value="微博">微博</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>标签 (用逗号分隔)</FormLabel>
                <Input 
                  placeholder="请输入标签，用逗号分隔"
                  defaultValue={selectedContent?.tags.join(', ') || ''}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button colorScheme="primary" onClick={() => {
              toast({
                title: selectedContent ? '内容已更新' : '内容已创建',
                status: 'success',
                duration: 3000,
                isClosable: true,
              })
              onClose()
            }}>
              {selectedContent ? '保存' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 查看内容详情模态框 */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>内容详情</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {selectedContent && (
              <VStack align="stretch" spacing={4}>
                <HStack>
                  <Badge colorScheme="blue">{selectedContent.category}</Badge>
                  <Badge colorScheme="purple">{selectedContent.platform}</Badge>
                  {getStatusBadge(selectedContent.status)}
                </HStack>
                
                <Text fontSize="xl" fontWeight="bold">
                  {selectedContent.title}
                </Text>
                
                {selectedContent.thumbnail && (
                  <Image
                    src={selectedContent.thumbnail}
                    alt={selectedContent.title}
                    borderRadius="md"
                    maxH="200px"
                    objectFit="cover"
                  />
                )}
                
                <Text whiteSpace="pre-wrap" lineHeight="1.6">
                  {selectedContent.content}
                </Text>
                
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>标签:</Text>
                  <Wrap>
                    {selectedContent.tags.map(tag => (
                      <WrapItem key={tag}>
                        <Tag size="sm" colorScheme="blue" variant="subtle">
                          {tag}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">数据统计</Text>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">浏览量: {formatNumber(selectedContent.views)}</Text>
                      <Text fontSize="sm">点赞数: {formatNumber(selectedContent.likes)}</Text>
                      <Text fontSize="sm">分享数: {formatNumber(selectedContent.shares)}</Text>
                      <Text fontSize="sm">互动率: {selectedContent.engagement_rate}%</Text>
                    </VStack>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">时间信息</Text>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">创建时间: {formatDate(selectedContent.created_at)}</Text>
                      <Text fontSize="sm">更新时间: {formatDate(selectedContent.updated_at)}</Text>
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
