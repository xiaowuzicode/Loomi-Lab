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
  RiHeartFill,
  RiShareLine,
  RiFireLine,
  RiLineChartLine,
  RiUploadLine,
  RiDownloadLine,
  RiMessageLine,
  RiStarLine,
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { SmartImage } from '@/components/ui/SmartImage'
import { ImportModal } from '@/components/content-library/ImportModal'
import { useContentLibrary } from '@/hooks/useContentLibrary'
import type { ContentItem } from '@/types'

const MotionBox = motion(Box)

export default function ContentLibraryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [exportFormat, setExportFormat] = useState<'original' | 'xiaohongshu'>('original')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure()
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure()
  const toast = useToast()

  // 使用内容库钩子
  const {
    contents,
    stats,
    loading,
    importLoading,
    vectorizing,
    vectorProgress,
    totalCount,
    totalPages,
    createContent,
    updateContent,
    deleteContent,
    importContents,
    downloadTemplate,
    exportData,
    vectorizePending,
  } = useContentLibrary({
    page: currentPage,
    limit: 20, // 每页20条
    search: searchTerm,
    category: categoryFilter,
    platform: platformFilter,
    status: statusFilter,
    sortBy: 'published_at', // 按发布时间排序
    sortOrder: 'desc', // 倒序
  })

  // 获取所有可用标签
  const allTags = Array.from(new Set(contents.flatMap(content => content.tags || [])))

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, platformFilter, statusFilter])

  // 过滤内容 (本地标签筛选)
  const filteredContents = contents.filter(content => {
    if (selectedTags.length === 0) return true
    return selectedTags.every(tag => (content.tags || []).includes(tag))
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

  const handleDeleteContent = async (contentId: string) => {
    try {
      await deleteContent(contentId)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag))
    } else {
      setSelectedTags(prev => [...prev, tag])
    }
  }

  // 处理数据导出
  const handleExportData = async () => {
    const currentFilters = {
      category: categoryFilter,
      platform: platformFilter,
      status: statusFilter,
      search: searchTerm
    }
    
    await exportData(exportFormat, currentFilters, 1000)
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

  // 获取热门程度标签
  const getHotCategoryBadge = (hotCategory?: string | null) => {
    const config = {
      viral: { color: 'red', label: '🔥 爆文' },
      trending: { color: 'orange', label: '📈 热门' },
      normal: { color: 'gray', label: '📝 普通' },
    }
    
    const category = (hotCategory || 'normal') as keyof typeof config
    const badgeConfig = config[category]
    return (
      <Badge colorScheme={badgeConfig.color} variant="subtle" fontSize="xs">
        {badgeConfig.label}
      </Badge>
    )
  }

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
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
            <StatCard
              title="内容总数"
              value={stats?.overview?.total_content || 0}
              icon={RiBookOpenLine}
              iconColor="blue.400"
              loading={loading}
            />
            <StatCard
              title="总浏览量"
              value={formatNumber(stats?.overview?.total_views || 0)}
              icon={RiEyeLine}
              iconColor="green.400"
              loading={loading}
            />
            <StatCard
              title="总点赞数"
              value={formatNumber(stats?.overview?.total_likes || 0)}
              icon={RiHeartLine}
              iconColor="red.400"
              loading={loading}
            />
            <StatCard
              title="总评论数"
              value={formatNumber(stats?.overview?.total_comments || 0)}
              icon={RiMessageLine}
              iconColor="purple.400"
              loading={loading}
            />
            <StatCard
              title="总收藏数"
              value={formatNumber(stats?.overview?.total_favorites || 0)}
              icon={RiStarLine}
              iconColor="yellow.400"
              loading={loading}
            />
            <StatCard
              title="平均互动率"
              value={(stats?.overview?.avg_engagement_rate || 0).toFixed(1)}
              suffix="%"
              icon={RiLineChartLine}
              iconColor="orange.400"
              loading={loading}
            />
            <StatCard
              title="已向量化数"
              value={stats?.overview?.vectorized_success || 0}
              icon={RiFireLine}
              iconColor="green.500"
              loading={loading}
            />
            <StatCard
              title="未向量化数"
              value={stats?.overview?.vectorized_pending || 0}
              icon={RiFireLine}
              iconColor="yellow.500"
              loading={loading}
            />
            <StatCard
              title="向量失败数"
              value={stats?.overview?.vectorized_failed || 0}
              icon={RiFireLine}
              iconColor="red.500"
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
            <VStack spacing={4} align="stretch">
              <HStack spacing={4} flexWrap="wrap">
                <InputGroup maxW="400px">
                  <InputLeftElement>
                    <RiSearchLine color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="搜索标题、内容、作者..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <Select maxW="150px" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">全部分类</option>
                  <option value="汽车">汽车</option>
                  <option value="美妆">美妆</option>
                  <option value="穿搭">穿搭</option>
                  <option value="美食">美食</option>
                  <option value="母婴">母婴</option>
                  <option value="宠物">宠物</option>
                  <option value="职场">职场</option>
                  <option value="理财">理财</option>
                  <option value="情感">情感</option>
                  <option value="摄影">摄影</option>
                  <option value="读书">读书</option>
                  <option value="生活">生活</option>
                  <option value="旅游">旅游</option>
                  <option value="健身">健身</option>
                  <option value="教育">教育</option>
                  <option value="科技">科技</option>
                  <option value="娱乐">娱乐</option>
                  <option value="家居">家居</option>
                </Select>

                <Select maxW="150px" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
                  <option value="all">全部平台</option>
                  <option value="小红书">小红书</option>
                  <option value="抖音">抖音</option>
                  <option value="微博">微博</option>
                  <option value="B站">B站</option>
                  <option value="Instagram">Instagram</option>
                </Select>

                <Select maxW="120px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">全部状态</option>
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                  <option value="archived">已归档</option>
                </Select>

                <Button
                  leftIcon={<RiUploadLine />}
                  onClick={onImportOpen}
                  colorScheme="green"
                  variant="outline"
                >
                  导入数据
                </Button>

                <HStack spacing={2}>
                  <Select 
                    maxW="180px" 
                    value={exportFormat} 
                    onChange={(e) => setExportFormat(e.target.value as 'original' | 'xiaohongshu')}
                    size="md"
                  >
                    <option value="original">爆文库格式</option>
                    <option value="xiaohongshu">小红书向量格式</option>
                  </Select>
                  <Button
                    leftIcon={<RiDownloadLine />}
                    onClick={handleExportData}
                    colorScheme="blue"
                    variant="outline"
                  >
                    导出数据
                  </Button>
                  <Button
                    leftIcon={<RiFireLine />}
                    colorScheme="orange"
                    variant="solid"
                    isLoading={vectorizing}
                    loadingText={`向量化中 ${vectorProgress.processed}/${vectorProgress.total || '...'} `}
                    onClick={() => vectorizePending('hosted')}
                    isDisabled={vectorizing}
                  >
                    向量化未处理
                  </Button>
                </HStack>

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
                      {/* 封面图 - 使用图片数组的第一张 */}
                      {content.images_urls && content.images_urls.length > 0 ? (
                        <SmartImage
                          src={content.images_urls[0]}
                          alt={content.title}
                          borderRadius="md"
                          w="full"
                          h="150px"
                          objectFit="cover"
                          fallbackText="📷 图片加载失败"
                        />
                      ) : (
                        <Box
                          w="full"
                          h="150px"
                          bg="gray.100"
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="gray.400" fontSize="sm">
                            📷 暂无封面图
                          </Text>
                        </Box>
                      )}

                      <Flex justify="space-between" w="full" align="start">
                        <VStack align="start" spacing={2} flex={1}>
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme="blue" variant="subtle">
                              {content.category}
                            </Badge>
                            <Badge colorScheme="purple" variant="subtle">
                              {content.platform}
                            </Badge>
                            {getStatusBadge(content.status)}
                            {getHotCategoryBadge(content.hot_category)}
                          </HStack>
                          
                          <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                            {content.title}
                          </Text>
                          
                          {content.author && (
                            <Text color="gray.400" fontSize="xs">
                              @{content.author}
                            </Text>
                          )}
                          
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
                      <Grid templateColumns="repeat(5, 1fr)" gap={2} w="full">
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">浏览</Text>
                          <HStack spacing={1}>
                            <RiEyeLine size="12px" color="gray.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {formatNumber(content.views_count)}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">点赞</Text>
                          <HStack spacing={1}>
                            <RiHeartLine size="12px" color="red.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {formatNumber(content.likes_count)}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">评论</Text>
                          <HStack spacing={1}>
                            <RiMessageLine size="12px" color="purple.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {formatNumber(content.comments_count)}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">收藏</Text>
                          <HStack spacing={1}>
                            <RiStarLine size="12px" color="yellow.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {formatNumber(content.favorites_count)}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.400">互动率</Text>
                          <HStack spacing={1}>
                            <RiFireLine size="12px" color="orange.400" />
                            <Text fontSize="xs" fontWeight="semibold">
                              {content.engagement_rate.toFixed(1)}%
                            </Text>
                          </HStack>
                        </VStack>
                      </Grid>

                      <HStack justify="space-between" w="full">
                        <Text fontSize="xs" color="gray.400">
                          创建: {formatDate(content.created_at)}
                        </Text>
                        {content.published_at && (
                          <Text fontSize="xs" color="gray.400">
                            发布: {formatDate(content.published_at)}
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                  </Card>
                </MotionBox>
              ))}
            </Grid>
          )}
          
          {/* 分页组件 */}
          {totalPages > 1 && (
            <HStack justify="center" spacing={2} mt={8}>
              <Button
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                isDisabled={currentPage === 1}
                leftIcon={<Text>‹</Text>}
              >
                上一页
              </Button>
              
              {/* 页码按钮 */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? 'solid' : 'outline'}
                    colorScheme={currentPage === pageNum ? 'blue' : 'gray'}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                isDisabled={currentPage === totalPages}
                rightIcon={<Text>›</Text>}
              >
                下一页
              </Button>
            </HStack>
          )}
          
          {/* 分页信息 */}
          {totalCount > 0 && (
            <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
              共 {totalCount} 条内容，第 {currentPage} / {totalPages} 页
            </Text>
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
                    <option value="汽车">汽车</option>
                    <option value="美妆">美妆</option>
                    <option value="穿搭">穿搭</option>
                    <option value="美食">美食</option>
                    <option value="母婴">母婴</option>
                    <option value="宠物">宠物</option>
                    <option value="职场">职场</option>
                    <option value="理财">理财</option>
                    <option value="情感">情感</option>
                    <option value="摄影">摄影</option>
                    <option value="读书">读书</option>
                    <option value="生活">生活</option>
                    <option value="旅游">旅游</option>
                    <option value="健身">健身</option>
                    <option value="教育">教育</option>
                    <option value="科技">科技</option>
                    <option value="娱乐">娱乐</option>
                    <option value="家居">家居</option>
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
                
                {selectedContent.author && (
                  <Text color="gray.500" fontSize="md">
                    作者: @{selectedContent.author}
                  </Text>
                )}
                
                {selectedContent.images_urls && selectedContent.images_urls.length > 0 && (
                  <SmartImage
                    src={selectedContent.images_urls[0]}
                    alt={selectedContent.title}
                    borderRadius="md"
                    maxH="200px"
                    objectFit="cover"
                    fallbackText="📷 图片加载失败"
                  />
                )}
                
                {selectedContent.description && (
                  <Text color="gray.600" fontSize="md" fontStyle="italic">
                    {selectedContent.description}
                  </Text>
                )}
                
                <Text whiteSpace="pre-wrap" lineHeight="1.6">
                  {selectedContent.content}
                </Text>
                
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>标签:</Text>
                  <Wrap>
                    {selectedContent.tags?.map(tag => (
                      <WrapItem key={tag}>
                        <Tag size="sm" colorScheme="blue" variant="subtle">
                          {tag}
                        </Tag>
                      </WrapItem>
                    )) || []}
                  </Wrap>
                </Box>
                
                {selectedContent.keywords && selectedContent.keywords.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>关键词:</Text>
                    <Wrap>
                      {selectedContent.keywords.map(keyword => (
                        <WrapItem key={keyword}>
                          <Tag size="sm" colorScheme="green" variant="outline">
                            {keyword}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                )}
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">数据统计</Text>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">浏览量: {formatNumber(selectedContent.views_count)}</Text>
                      <Text fontSize="sm">点赞数: {formatNumber(selectedContent.likes_count)}</Text>
                      <Text fontSize="sm">评论数: {formatNumber(selectedContent.comments_count)}</Text>
                      <Text fontSize="sm">收藏数: {formatNumber(selectedContent.favorites_count)}</Text>
                      <Text fontSize="sm">分享数: {formatNumber(selectedContent.shares_count)}</Text>
                      <Text fontSize="sm">互动率: {selectedContent.engagement_rate.toFixed(1)}%</Text>
                    </VStack>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">时间信息</Text>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">创建时间: {formatDate(selectedContent.created_at)}</Text>
                      <Text fontSize="sm">更新时间: {formatDate(selectedContent.updated_at)}</Text>
                      {selectedContent.published_at && (
                        <Text fontSize="sm">发布时间: {formatDate(selectedContent.published_at)}</Text>
                      )}
                    </VStack>
                  </VStack>
                </Grid>

                {selectedContent.top_comments && selectedContent.top_comments.length > 0 && (
                  <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={3} color="blue.600">
                      💬 热门评论
                    </Text>
                    <VStack align="start" spacing={3}>
                      {selectedContent.top_comments.slice(0, 5).map((comment, index) => (
                        <Box 
                          key={index} 
                          p={4} 
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="lg" 
                          w="full"
                          shadow="sm"
                          _hover={{ shadow: "md", transform: "translateY(-1px)" }}
                          transition="all 0.2s"
                        >
                          <HStack justify="space-between" mb={2}>
                            <HStack spacing={2}>
                              <Box
                                w={6}
                                h={6}
                                borderRadius="full"
                                bg="blue.500"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Text color="white" fontSize="xs" fontWeight="bold">
                                  {comment.author?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                              </Box>
                              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                                {comment.author || '匿名用户'}
                              </Text>
                            </HStack>
                            <HStack spacing={1} color="red.500">
                              <RiHeartFill size="14px" />
                              <Text fontSize="sm" fontWeight="semibold">{comment.likes || 0}</Text>
                            </HStack>
                          </HStack>
                          <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                            {comment.content || '暂无评论内容'}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
                
                {/* 如果没有评论，显示提示 */}
                {(!selectedContent.top_comments || selectedContent.top_comments.length === 0) && (
                  <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={3} color="blue.600">
                      💬 热门评论
                    </Text>
                    <Box 
                      p={6} 
                      bg="gray.50"
                      border="2px dashed"
                      borderColor="gray.300"
                      borderRadius="lg" 
                      textAlign="center"
                    >
                      <Text fontSize="sm" color="gray.500">
                        暂无评论数据
                      </Text>
                    </Box>
                  </Box>
                )}

                {selectedContent.source_url && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      原文链接: 
                      <Text as="a" href={selectedContent.source_url} target="_blank" color="blue.500" ml={1}>
                        查看原文
                      </Text>
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>关闭</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 导入数据模态框 */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        onImport={importContents}
        onDownloadTemplate={downloadTemplate}
        isLoading={importLoading}
      />
    </PageLayout>
  )
}
