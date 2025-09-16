'use client'

import {
  Box,
  Flex,
  HStack,
  VStack,
  Heading,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useToast,
  Divider,
  Skeleton,
  List,
  ListItem,
  Icon,
  Card,
  CardBody,
  Image,
  Wrap,
  WrapItem,
  Tag,
  Stack,
  SkeletonText,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  RiFolder2Line,
  RiFileListLine,
  RiSearchLine,
  RiCalendarLine,
  RiUser3Line,
  RiImage2Line,
  RiExternalLinkLine,
} from 'react-icons/ri'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const markdownPlugins = [remarkGfm]
const FOLDER_TYPE = 'posts'

interface FolderNode {
  fold_id: string
  fold_name: string
  children: FolderNode[]
  expanded?: boolean
}

interface PostListItem {
  id: string
  title: string
  fold_id: string | null
  updated_at: string
}

interface PostMetaAuthor {
  name?: string
  avatar?: string
}

interface PostMeta {
  title?: string
  tags?: string[]
  author?: PostMetaAuthor | string
  content?: string
  comments?: Array<{ time?: string; likes?: string; author?: string; content?: string; location?: string }>
  mediaList?: Array<{ url: string; type?: string }>
  interactions?: { likes?: string; collects?: string; comments?: string }
  publishTime?: string
  extractedAt?: string
}

interface PostDetail {
  id: string
  title?: string
  content?: string
  fold_id: string | null
  meta: PostMeta
  created_at?: string
  updated_at?: string
  url?: string
}

const ROOT_KEY = 'ROOT'

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return value
  return time.toLocaleString('zh-CN', { hour12: false })
}

const resolveAuthor = (metaAuthor: PostMeta['author']): { name?: string; avatar?: string } => {
  if (!metaAuthor) return {}
  if (typeof metaAuthor === 'string') {
    return { name: metaAuthor }
  }
  return metaAuthor
}

const ensureMeta = (value: unknown): PostMeta => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as PostMeta
    } catch {
      return {}
    }
  }
  if (typeof value === 'object') return value as PostMeta
  return {}
}

export default function PostsLibraryPage() {
  const toast = useToast()
  const [userId, setUserId] = useState('')
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  const [rootPosts, setRootPosts] = useState<PostListItem[]>([])
  const [postsByFolder, setPostsByFolder] = useState<Record<string, PostListItem[]>>({})
  const [postsLoading, setPostsLoading] = useState<Record<string, boolean>>({})
  const [lastSearchByFolder, setLastSearchByFolder] = useState<Record<string, string>>({})

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [postDetail, setPostDetail] = useState<PostDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const activeFolderId = selectedFolderId
  const activeKey = activeFolderId ?? ROOT_KEY

  const resetState = () => {
    setFolders([])
    setExpanded(new Set())
    setSelectedFolderId(null)
    setRootPosts([])
    setPostsByFolder({})
    setPostsLoading({})
    setLastSearchByFolder({})
    setSelectedPostId(null)
    setPostDetail(null)
  }

  const loadFolders = async () => {
    if (!userId) return
    setLoadingFolders(true)
    try {
      const res = await fetch(`/api/memo-folders?userId=${encodeURIComponent(userId)}&type=${encodeURIComponent(FOLDER_TYPE)}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '加载失败')
      setFolders(Array.isArray(data.data?.folders) ? data.data.folders : [])
      setExpanded(new Set())
      setSelectedFolderId(null)
      setSearchTerm('')
      setDebouncedSearch('')
      setPostsByFolder({})
      setLastSearchByFolder({})
      await loadPostsFor(null, '')
    } catch (error) {
      toast({ title: '加载失败', description: error instanceof Error ? error.message : '未知错误', status: 'error' })
      resetState()
    } finally {
      setLoadingFolders(false)
    }
  }

  const loadPostsFor = async (folderId: string | null, search: string) => {
    if (!userId) return
    const key = folderId ?? ROOT_KEY
    setPostsLoading(prev => ({ ...prev, [key]: true }))
    try {
      const params = new URLSearchParams({ userId })
      if (folderId === null) {
        params.set('foldId', 'null')
      } else if (folderId) {
        params.set('foldId', folderId)
      }
      if (search) {
        params.set('search', search)
      }
      const res = await fetch(`/api/posts-library?${params.toString()}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '加载失败')
      const items: PostListItem[] = data.data?.items || []
      if (folderId === null) {
        setRootPosts(items)
      } else if (folderId) {
        setPostsByFolder(prev => ({ ...prev, [folderId]: items }))
      }
      setLastSearchByFolder(prev => ({ ...prev, [key]: search }))
    } catch (error) {
      toast({ title: '加载帖子失败', description: error instanceof Error ? error.message : '未知错误', status: 'error' })
      if (folderId === null) {
        setRootPosts([])
      } else if (folderId) {
        setPostsByFolder(prev => ({ ...prev, [folderId]: [] }))
      }
    } finally {
      setPostsLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const ensurePostsLoaded = (folderId: string | null) => {
    if (!userId) return
    const key = folderId ?? ROOT_KEY
    const alreadyLoaded = (folderId === null ? rootPosts : postsByFolder[folderId || ''])
    const cachedSearch = lastSearchByFolder[key]
    if (alreadyLoaded !== undefined && cachedSearch === debouncedSearch) return
    loadPostsFor(folderId, debouncedSearch)
  }

  useEffect(() => {
    if (!userId) return
    ensurePostsLoaded(activeFolderId ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const toggleFolder = (foldId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(foldId)) next.delete(foldId)
      else next.add(foldId)
      return next
    })
    setSelectedFolderId(foldId)
    ensurePostsLoaded(foldId)
  }

  const selectPost = async (postId: string) => {
    if (!postId || !userId) return
    setSelectedPostId(postId)
    setLoadingDetail(true)
    try {
      const params = new URLSearchParams({ id: postId, userId })
      const res = await fetch(`/api/posts-library?${params.toString()}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '加载失败')
      const detailData = data.data || {}
      const meta = ensureMeta(detailData.meta || detailData.meta_data)
      setPostDetail({
        id: detailData.id,
        title: detailData.title,
        content: detailData.content,
        fold_id: detailData.fold_id ?? null,
        meta,
        created_at: detailData.created_at,
        updated_at: detailData.updated_at,
        url: detailData.url,
      })
    } catch (error) {
      toast({ title: '加载帖子详情失败', description: error instanceof Error ? error.message : '未知错误', status: 'error' })
      setPostDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const renderPostList = (items: PostListItem[], folderId: string | null) => {
    const key = folderId ?? ROOT_KEY
    const loading = postsLoading[key]
    if (loading) {
      return (
        <VStack align="stretch" spacing={2} mt={2} pl={folderId ? '12px' : 0}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} height="18px" />
          ))}
        </VStack>
      )
    }
    if (!items || items.length === 0) {
      if (debouncedSearch) {
        return (
          <Text pl={folderId ? '12px' : 0} mt={2} fontSize="sm" color="gray.500">
            无匹配帖子
          </Text>
        )
      }
      return null
    }
    return (
      <List spacing={1} mt={2} pl={folderId ? '12px' : 0}>
        {items.map(item => (
          <ListItem
            key={item.id}
            px={2}
            py={1}
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: 'gray.700' }}
            bg={selectedPostId === item.id ? 'blue.900' : undefined}
            onClick={() => selectPost(item.id)}
          >
            <HStack spacing={2} align="center">
              <Icon as={RiFileListLine} color={selectedPostId === item.id ? 'blue.300' : 'gray.300'} />
              <Box flex="1" minW={0}>
                <Text fontSize="sm" noOfLines={1} color={selectedPostId === item.id ? 'blue.200' : 'gray.100'}>
                  {item.title || '(未命名)'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  更新于 {formatDateTime(item.updated_at)}
                </Text>
              </Box>
            </HStack>
          </ListItem>
        ))}
      </List>
    )
  }

  const renderFolderNodes = (nodes: FolderNode[], level: number): JSX.Element[] => {
    const rows: JSX.Element[] = []
    nodes.forEach(node => {
      const hasChildren = node.children && node.children.length > 0
      const open = expanded.has(node.fold_id)
      rows.push(
        <Box
          key={node.fold_id}
          pl={`${level * 16}px`}
          py={1}
          borderRadius="md"
          cursor="pointer"
          bg={selectedFolderId === node.fold_id ? 'blue.900' : undefined}
          _hover={{ bg: 'gray.700' }}
          onClick={() => {
            setSelectedFolderId(node.fold_id)
            ensurePostsLoaded(node.fold_id)
          }}
        >
          <HStack spacing={2}>
            <Box
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(node.fold_id)
              }}
            >
              <Text color="gray.400" fontSize="sm">
                {hasChildren || true ? (open ? '▼' : '▶') : ' '} 
              </Text>
            </Box>
            <HStack spacing={2}>
              <Icon as={RiFolder2Line} color={selectedFolderId === node.fold_id ? 'blue.300' : 'gray.300'} />
              <Text color={selectedFolderId === node.fold_id ? 'blue.200' : 'gray.100'} noOfLines={1}>
                {node.fold_name}
              </Text>
            </HStack>
          </HStack>
        </Box>
      )
      if (open) {
        if (hasChildren) {
          rows.push(...renderFolderNodes(node.children, level + 1))
        }
        rows.push(
          <Box key={`${node.fold_id}__posts`}>
            {renderPostList(postsByFolder[node.fold_id] || [], node.fold_id)}
          </Box>
        )
      }
    })
    return rows
  }

  const detailMeta = useMemo(() => {
    if (!postDetail) return null
    const meta = postDetail.meta || {}
    const fallbackTitle = postDetail.title || '(未命名)'
    const displayTitle = meta.title || fallbackTitle
    const displayContent = meta.content || postDetail.content || ''
    const author = resolveAuthor(meta.author)
    return { meta, displayTitle, displayContent, author }
  }, [postDetail])

  return (
    <PageLayout>
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <Heading size="md">帖子库</Heading>
          <HStack spacing={3} flexWrap="wrap">
            <Input
              size="sm"
              w={['full', '360px']}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="输入用户ID（UUID）"
            />
            <InputGroup size="sm" w={['full', '260px']}>
              <InputLeftElement pointerEvents="none">
                <Icon as={RiSearchLine} color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="搜索当前文件夹帖子"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                isDisabled={!userId}
              />
            </InputGroup>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={loadFolders}
              isLoading={loadingFolders}
              isDisabled={!userId}
            >
              加载
            </Button>
          </HStack>
        </HStack>

        <Divider />

        <Flex gap={4} minH="520px" align="stretch" flexDirection={['column', 'column', 'row']}> 
          <Box w={['100%', '100%', '320px']}>
            <Card h="full">
              <CardBody>
                {!userId ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    输入用户ID并点击“加载”以查看帖子结构
                  </Alert>
                ) : (
                  <VStack align="stretch" spacing={2} maxH="calc(100vh - 220px)" overflowY="auto">
                    {renderPostList(rootPosts, null)}
                    {folders.length === 0 ? (
                      <Text fontSize="sm" color="gray.500">
                        暂无文件夹
                      </Text>
                    ) : (
                      renderFolderNodes(folders, 0)
                    )}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </Box>

          <Box flex="1">
            <Card h="full">
              <CardBody>
                {!selectedPostId ? (
                  <Flex h="100%" align="center" justify="center">
                    <Text color="gray.500">点击左侧帖子以查看详情</Text>
                  </Flex>
                ) : loadingDetail || !detailMeta ? (
                  <SkeletonText noOfLines={10} spacing={3} />
                ) : (
                  <VStack align="stretch" spacing={5} maxH="calc(100vh - 220px)" overflowY="auto" pr={2}>
                    <VStack align="start" spacing={2}>
                      <Heading size="md" color="white">
                        {detailMeta.displayTitle}
                      </Heading>
                      <HStack spacing={4} color="gray.400" fontSize="sm">
                        <HStack spacing={1}>
                          <Icon as={RiUser3Line} />
                          <Text>{detailMeta.author.name || '未知作者'}</Text>
                        </HStack>
                        {detailMeta.author.avatar && (
                          <Image src={detailMeta.author.avatar} alt={detailMeta.author.name || ''} boxSize="24px" borderRadius="full" />
                        )}
                        <HStack spacing={1}>
                          <Icon as={RiCalendarLine} />
                          <Text>{detailMeta.meta.publishTime || formatDateTime(postDetail?.created_at)}</Text>
                        </HStack>
                      </HStack>
                      {postDetail?.url && (
                        <HStack color="blue.300" fontSize="sm">
                          <Icon as={RiExternalLinkLine} />
                          <Text as="a" href={postDetail.url} target="_blank" rel="noopener noreferrer">
                            查看原文
                          </Text>
                        </HStack>
                      )}
                    </VStack>

                    {detailMeta.meta.tags && detailMeta.meta.tags.length > 0 && (
                      <Wrap spacing={2}>
                        {detailMeta.meta.tags.map(tag => (
                          <WrapItem key={tag}>
                            <Tag colorScheme="purple">{tag}</Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    )}

                    {detailMeta.meta.interactions && (
                      <HStack spacing={6} fontSize="sm" color="gray.300">
                        <Text>点赞：{detailMeta.meta.interactions.likes || '-'}</Text>
                        <Text>收藏：{detailMeta.meta.interactions.collects || '-'}</Text>
                        <Text>评论：{detailMeta.meta.interactions.comments || '-'}</Text>
                      </HStack>
                    )}

                    {detailMeta.meta.mediaList && detailMeta.meta.mediaList.length > 0 && (
                      <VStack align="stretch" spacing={2}>
                        <HStack spacing={2} color="gray.400">
                          <Icon as={RiImage2Line} />
                          <Text fontSize="sm">媒体内容</Text>
                        </HStack>
                        <Wrap spacing={3}>
                          {detailMeta.meta.mediaList.map((media, index) => (
                            <WrapItem key={`${media.url}-${index}`}>
                              <Box maxW="160px">
                                <Image
                                  src={media.url}
                                  alt="media"
                                  borderRadius="md"
                                  objectFit="cover"
                                  maxH="120px"
                                  fallback={<Skeleton height="120px" width="160px" />}
                                />
                              </Box>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </VStack>
                    )}

                    <Box>
                      <Heading size="sm" mb={2}>正文</Heading>
                      {detailMeta.displayContent ? (
                        <Box className="post-markdown">
                          <ReactMarkdown remarkPlugins={markdownPlugins}>{detailMeta.displayContent}</ReactMarkdown>
                        </Box>
                      ) : (
                        <Text color="gray.500">暂无正文内容</Text>
                      )}
                    </Box>

                    {detailMeta.meta.comments && detailMeta.meta.comments.length > 0 && (
                      <Box>
                        <Heading size="sm" mb={2}>评论 ({detailMeta.meta.comments.length})</Heading>
                        <Stack spacing={3}>
                          {detailMeta.meta.comments.map((comment, idx) => (
                            <Box key={idx} p={3} borderRadius="md" bg="gray.800">
                              <HStack justify="space-between" fontSize="sm" color="gray.400">
                                <Text>{comment.author || '匿名'}</Text>
                                <Text>{comment.time || '-'}</Text>
                              </HStack>
                              <Text mt={2} color="gray.200">{comment.content || '-'}</Text>
                              {comment.likes && (
                                <Text mt={2} fontSize="xs" color="gray.500">点赞：{comment.likes}</Text>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Text fontSize="xs" color="gray.500">
                      最后更新：{formatDateTime(postDetail?.updated_at)}
                    </Text>
                  </VStack>
                )}
              </CardBody>
            </Card>
          </Box>
        </Flex>
      </VStack>
    </PageLayout>
  )
}
