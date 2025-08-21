'use client'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Flex,
  IconButton,
  Skeleton,
  Alert,
  AlertIcon,
  Tooltip,
  Grid,
  GridItem,
  Image,
  Divider,
  useColorModeValue,
  useToast,
  Select,
  InputGroup,
  InputLeftElement,
  Input,
} from '@chakra-ui/react'
import {
  RiFileTextLine,
  RiDownload2Line,
  RiImageLine,
  RiVideoLine,
  RiFileLine,
  RiFileZipLine,
  RiFilePdfLine,
  RiFileExcelLine,
  RiFileWordLine,
  RiSearchLine,
  RiCalendarLine,
  RiHardDrive2Line,
  RiEyeLine,
  RiArrowLeftLine,
  RiArrowRightLine,
} from 'react-icons/ri'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

// 文件类型定义
interface UploadedFile {
  id: string
  file_id: string
  user_id: string
  session_id: string
  original_filename: string
  file_type: string
  file_size: number
  mime_type: string
  description: string
  upload_mode: string
  oss_url: string
  oss_object_name: string
  oss_bucket_name: string
  gemini_file_uri: string | null
  gemini_file_name: string | null
  processing_status: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface UserFilesModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
}

export function UserFilesModal({ isOpen, onClose, userId, userName }: UserFilesModalProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  // 获取用户文件列表
  const fetchUserFiles = async (page = 1) => {
    if (!userId) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/users/${userId}/files?${params}`)
      const result = await response.json()

      if (result.success) {
        setFiles(result.data.files || [])
        setPagination(result.data.pagination)
      } else {
        toast({
          title: '获取文件列表失败',
          description: result.error || '请稍后重试',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('获取文件列表失败:', error)
      toast({
        title: '网络错误',
        description: '请检查网络连接后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取文件类型图标
  const getFileIcon = (mimeType: string, fileType: string) => {
    const type = mimeType.toLowerCase()
    const ext = fileType.toLowerCase()

    if (type.startsWith('image/')) return RiImageLine
    if (type.startsWith('video/')) return RiVideoLine
    if (type.includes('pdf') || ext === '.pdf') return RiFilePdfLine
    if (type.includes('zip') || type.includes('rar') || ext.includes('zip')) return RiFileZipLine
    if (type.includes('excel') || ext.includes('xls') || ext.includes('xlsx')) return RiFileExcelLine
    if (type.includes('word') || ext.includes('doc') || ext.includes('docx')) return RiFileWordLine
    if (type.startsWith('text/')) return RiFileTextLine
    
    return RiFileLine
  }

  // 获取文件类型颜色
  const getFileTypeColor = (mimeType: string, fileType: string) => {
    const type = mimeType.toLowerCase()
    const ext = fileType.toLowerCase()

    if (type.startsWith('image/')) return 'green'
    if (type.startsWith('video/')) return 'purple'
    if (type.includes('pdf') || ext === '.pdf') return 'red'
    if (type.includes('zip') || type.includes('rar')) return 'orange'
    if (type.includes('excel') || ext.includes('xls')) return 'blue'
    if (type.includes('word') || ext.includes('doc')) return 'blue'
    if (type.startsWith('text/')) return 'gray'
    
    return 'gray'
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 下载文件
  const downloadFile = (file: UploadedFile) => {
    if (!file.oss_url) {
      toast({
        title: '下载失败',
        description: '文件下载链接不可用',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 创建下载链接
    const link = document.createElement('a')
    link.href = file.oss_url
    link.download = file.original_filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: '开始下载',
      description: `正在下载 "${file.original_filename}"`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  // 预览文件（仅图片）
  const previewFile = (file: UploadedFile) => {
    if (file.mime_type.startsWith('image/') && file.oss_url) {
      window.open(file.oss_url, '_blank', 'noopener,noreferrer')
    }
  }

  // 过滤文件
  const filteredFiles = files.filter(file => 
    file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 组件挂载时获取文件列表
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserFiles(1)
    }
  }, [isOpen, userId, sortBy, sortOrder])

  // 分页处理
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchUserFiles(newPage)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="80vh">
        <ModalHeader>
          <HStack spacing={3}>
            <RiHardDrive2Line size={24} />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold">
                {userName} 的上传文件
              </Text>
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                共 {pagination.total} 个文件
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* 搜索和排序控制 */}
            <HStack spacing={4} wrap="wrap">
              <InputGroup maxW="300px" flex="1">
                <InputLeftElement>
                  <RiSearchLine color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="搜索文件名或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Select maxW="150px" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="created_at">上传时间</option>
                <option value="original_filename">文件名</option>
                <option value="file_size">文件大小</option>
              </Select>
              
              <Select maxW="100px" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </Select>
            </HStack>

            {/* 文件列表 */}
            {loading ? (
              <VStack spacing={3}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height="80px" borderRadius="lg" />
                ))}
              </VStack>
            ) : filteredFiles.length === 0 ? (
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                {searchTerm ? '没有找到匹配的文件' : '该用户暂未上传任何文件'}
              </Alert>
            ) : (
              <VStack spacing={2} align="stretch">
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.mime_type, file.file_type)
                  const typeColor = getFileTypeColor(file.mime_type, file.file_type)
                  const isImage = file.mime_type.startsWith('image/')
                  
                  return (
                    <MotionBox
                      key={file.id}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Box
                        p={4}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="lg"
                        bg={bgColor}
                        _hover={{ bg: hoverBg }}
                        cursor="pointer"
                        onClick={() => isImage && previewFile(file)}
                      >
                        <Grid templateColumns="auto 1fr auto auto" gap={4} alignItems="center">
                          <GridItem>
                            <HStack spacing={3}>
                              <FileIcon size={32} color={`var(--chakra-colors-${typeColor}-500)`} />
                              {isImage && file.oss_url && (
                                <Box position="relative">
                                  <Image
                                    src={file.oss_url}
                                    alt={file.original_filename}
                                    boxSize="40px"
                                    objectFit="cover"
                                    borderRadius="md"
                                    fallback={<Box boxSize="40px" bg="gray.200" borderRadius="md" />}
                                  />
                                  <Tooltip label="点击预览">
                                    <Box
                                      position="absolute"
                                      top="0"
                                      right="0"
                                      bg="blackAlpha.700"
                                      color="white"
                                      borderRadius="full"
                                      p="2px"
                                    >
                                      <RiEyeLine size={12} />
                                    </Box>
                                  </Tooltip>
                                </Box>
                              )}
                            </HStack>
                          </GridItem>
                          
                          <GridItem>
                            <VStack align="start" spacing={1}>
                              <HStack spacing={2}>
                                <Text fontWeight="semibold" fontSize="md">
                                  {file.original_filename}
                                </Text>
                                <Badge colorScheme={typeColor} variant="subtle">
                                  {file.file_type || file.mime_type.split('/')[1]?.toUpperCase()}
                                </Badge>
                                {file.processing_status && (
                                  <Badge 
                                    colorScheme={file.processing_status === 'uploaded' ? 'green' : 'orange'}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {file.processing_status}
                                  </Badge>
                                )}
                              </HStack>
                              
                              <HStack spacing={4} fontSize="sm" color="gray.500">
                                <HStack spacing={1}>
                                  <RiHardDrive2Line size={14} />
                                  <Text>{formatFileSize(file.file_size)}</Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <RiCalendarLine size={14} />
                                  <Text>{formatDate(file.created_at)}</Text>
                                </HStack>
                              </HStack>
                              
                              {file.description && (
                                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                  {file.description}
                                </Text>
                              )}
                            </VStack>
                          </GridItem>
                          
                          <GridItem>
                            <HStack spacing={2}>
                              {isImage && file.oss_url && (
                                <Tooltip label="预览图片">
                                  <IconButton
                                    icon={<RiEyeLine />}
                                    aria-label="预览图片"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      previewFile(file)
                                    }}
                                  />
                                </Tooltip>
                              )}
                              <Tooltip label="下载文件">
                                <IconButton
                                  icon={<RiDownload2Line />}
                                  aria-label="下载文件"
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    downloadFile(file)
                                  }}
                                />
                              </Tooltip>
                            </HStack>
                          </GridItem>
                        </Grid>
                      </Box>
                    </MotionBox>
                  )
                })}
              </VStack>
            )}

            {/* 分页控制 */}
            {pagination.totalPages > 1 && (
              <Box pt={4}>
                <Divider mb={4} />
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    显示 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} 
                    ，共 {pagination.total} 个文件
                  </Text>
                  
                  <HStack spacing={2}>
                    <IconButton
                      icon={<RiArrowLeftLine />}
                      aria-label="上一页"
                      size="sm"
                      variant="ghost"
                      isDisabled={!pagination.hasPrev}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    />
                    
                    <HStack spacing={1}>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum = i + 1
                        if (pagination.totalPages > 5) {
                          if (pagination.page > 3) {
                            pageNum = pagination.page - 2 + i
                          }
                          if (pagination.page > pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i
                          }
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={pagination.page === pageNum ? 'solid' : 'ghost'}
                            colorScheme={pagination.page === pageNum ? 'blue' : 'gray'}
                            onClick={() => handlePageChange(pageNum)}
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
                      isDisabled={!pagination.hasNext}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    />
                  </HStack>
                </HStack>
              </Box>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button onClick={onClose}>关闭</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}