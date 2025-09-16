'use client'

import {
  Box,
  Flex,
  HStack,
  VStack,
  Heading,
  Button,
  Input,
  Text,
  useToast,
  Divider,
  Skeleton,
  Card,
  CardBody,
  List,
  ListItem,
  Icon,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { RiFolder2Line, RiStickyNoteLine } from 'react-icons/ri'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { PluggableList } from 'unified'
const markdownPlugins: PluggableList = [remarkGfm]

interface FolderNode {
  fold_id: string
  fold_name: string
  children: FolderNode[]
  expanded?: boolean
}

interface NoteListItem {
  id: string
  note_name: string
  fold_id: string | null
  updated_at: string
}

export default function MemoFoldersPage() {
  const toast = useToast()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 笔记数据：根级和各文件夹下的笔记（惰性加载）
  const [rootNotes, setRootNotes] = useState<NoteListItem[]>([])
  const [notesByFolder, setNotesByFolder] = useState<Record<string, NoteListItem[]>>({})
  const [notesLoading, setNotesLoading] = useState<Record<string, boolean>>({})

  // 详情：选中笔记后在右侧展示
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [noteDetail, setNoteDetail] = useState<{ id: string; note_name: string; note: string; updated_at: string } | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadFolders = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/memo-folders?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (data.success) {
        setFolders(data.data?.folders || [])
        setSelectedNoteId(null)
        setNoteDetail(null)
        // 初次加载根级笔记
        await loadNotesFor(null)
      } else {
        throw new Error(data.error || '加载失败')
      }
    } catch (e) {
      toast({ title: '加载失败', description: e instanceof Error ? e.message : '未知错误', status: 'error' })
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 初次进入不自动加载，避免误用管理员ID；手动点击加载
  }, [])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    // 展开时惰性加载该文件夹下的笔记
    ensureNotesLoaded(id)
  }

  // 加载指定文件夹（或根级）的笔记
  const loadNotesFor = async (foldId: string | null) => {
    if (!userId) return
    const key = foldId ?? 'ROOT'
    setNotesLoading(prev => ({ ...prev, [key]: true }))
    try {
      const url = `/api/memo-notes?userId=${encodeURIComponent(userId)}${foldId === null ? '&foldId=null' : foldId ? `&foldId=${encodeURIComponent(foldId)}` : ''}&page=1&limit=50`
      const res = await fetch(url)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '加载失败')
      const items: NoteListItem[] = data.data?.items || []
      if (foldId === null) setRootNotes(items)
      else setNotesByFolder(prev => ({ ...prev, [foldId]: items }))
    } catch (e) {
      toast({ title: '加载笔记失败', description: e instanceof Error ? e.message : '未知错误', status: 'error' })
      if (foldId === null) setRootNotes([])
      else setNotesByFolder(prev => ({ ...prev, [foldId!]: [] }))
    } finally {
      setNotesLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const ensureNotesLoaded = (foldId: string) => {
    if (notesByFolder[foldId] !== undefined) return
    loadNotesFor(foldId)
  }

  // 点击笔记加载详情
  const loadNoteDetail = async (id: string) => {
    if (!id || !userId) return
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/memo-notes?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '加载失败')
      setNoteDetail({ id: data.data.id, note_name: data.data.note_name, note: data.data.note || '', updated_at: data.data.updated_at })
    } catch (e) {
      toast({ title: '加载笔记详情失败', description: e instanceof Error ? e.message : '未知错误', status: 'error' })
      setNoteDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const renderNodes = (nodes: FolderNode[], level: number): JSX.Element[] => {
    const rows: JSX.Element[] = []
    for (const n of nodes) {
      const hasChildren = (n.children && n.children.length > 0)
      const open = expanded.has(n.fold_id)
      rows.push(
        <Box
          key={n.fold_id}
          px={1}
          py={1}
          pl={`${level * 14}px`}
          borderRadius="md"
          _hover={{ bg: 'gray.700' }}
          cursor="pointer"
          onClick={() => { setSelectedId(n.fold_id); toggle(n.fold_id) }}
        >
          <HStack spacing={2}>
            <Box onClick={(e) => { e.stopPropagation(); toggle(n.fold_id) }}>
              {hasChildren || true ? <Chevron open={open} /> : <Box as="span" w="16px" />}
            </Box>
            <HStack>
              <Icon as={RiFolder2Line} color={selectedId === n.fold_id ? 'blue.300' : 'gray.300'} />
              <Box as="span" color={selectedId === n.fold_id ? 'blue.300' : undefined}>{n.fold_name}</Box>
            </HStack>
          </HStack>
        </Box>
      )
      if (open) {
        // 先渲染子文件夹
        if (hasChildren) {
          rows.push(...renderNodes(n.children, level + 1))
        }
        // 再渲染该文件夹下的笔记（无笔记时不显示占位）
        const loadingKey = notesLoading[n.fold_id]
        const folderNotes = notesByFolder[n.fold_id]
        if (loadingKey || (folderNotes && folderNotes.length > 0)) {
          rows.push(
            <Box key={`${n.fold_id}__notes`} pl={`${(level + 1) * 14}px`}>
              {loadingKey ? (
                <VStack align="stretch" spacing={1}>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} height="18px" />
                  ))}
                </VStack>
              ) : (
                <List spacing={1}>
                  {(folderNotes || []).map(note => (
                    <ListItem
                      key={note.id}
                      px={1}
                      py={1}
                      borderRadius="md"
                      _hover={{ bg: 'gray.700' }}
                      cursor="pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedNoteId(note.id); loadNoteDetail(note.id) }}
                    >
                      <HStack spacing={2}>
                        <Icon as={RiStickyNoteLine} color={selectedNoteId === note.id ? 'blue.300' : 'gray.300'} />
                        <Text color={selectedNoteId === note.id ? 'blue.300' : undefined} noOfLines={1}> {note.note_name || '(未命名)'} </Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )
        }
      }
    }
    return rows
  }

  return (
    <PageLayout>
      <VStack align="stretch" spacing={4}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="md">备忘录文件夹管理</Heading>
          <HStack>
            <Input
              size="sm"
              w="420px"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="输入用户ID（UUID），仅加载该用户文件夹"
            />
            <Button size="sm" colorScheme="blue" onClick={loadFolders} isLoading={loading} isDisabled={!userId}>
              加载
            </Button>
          </HStack>
        </HStack>
        <Divider />

        {/* Main content */}
        <Flex gap={4} minH="520px">
          {/* Left: Tree with root notes + folders */}
          <Box w="320px">
            <Card h="full">
              <CardBody>
                <HStack justify="space-between" mb={3}>
                  <Text fontWeight="semibold">文件夹树</Text>
                </HStack>
                {loading ? (
                  <VStack align="stretch" spacing={2}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} height="20px" />
                    ))}
                  </VStack>
                ) : folders.length === 0 ? (
                  <Text color="gray.500">暂无数据，点击右上角“加载”获取文件夹结构。</Text>
                ) : (
                  <VStack align="stretch" spacing={1}>
                    {/* 根级笔记（不显示标题；无笔记时不显示占位） */}
                    {(notesLoading['ROOT'] || rootNotes.length > 0) && (
                      <Box>
                        {notesLoading['ROOT'] ? (
                          <VStack align="stretch" spacing={1}>
                            {Array.from({ length: 2 }).map((_, i) => (
                              <Skeleton key={i} height="18px" />
                            ))}
                          </VStack>
                        ) : (
                          <List spacing={1}>
                            {rootNotes.map(note => (
                              <ListItem
                                key={note.id}
                                px={1}
                                py={1}
                                borderRadius="md"
                                _hover={{ bg: 'gray.700' }}
                                cursor="pointer"
                                onClick={() => { setSelectedNoteId(note.id); loadNoteDetail(note.id) }}
                              >
                                <HStack spacing={2}>
                                  <Icon as={RiStickyNoteLine} color={selectedNoteId === note.id ? 'blue.300' : 'gray.300'} />
                                  <Text color={selectedNoteId === note.id ? 'blue.300' : undefined} noOfLines={1}>{note.note_name || '(未命名)'}</Text>
                                </HStack>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    )}

                    {/* 文件夹树 */}
                    {renderNodes(folders, 0)}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </Box>

          {/* Right: Note detail preview */}
          <Box flex={1}>
            <Card h="full">
              <CardBody>
                <Text fontWeight="semibold" mb={2}>笔记预览</Text>
                {loadingDetail ? (
                  <VStack align="stretch" spacing={2}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} height="16px" />
                    ))}
                  </VStack>
                ) : selectedNoteId && noteDetail ? (
                  <VStack align="stretch" spacing={3}>
                    <Heading size="sm">{noteDetail.note_name || '(未命名)'}</Heading>
                    <Text fontSize="sm" color="gray.500">更新于 {new Date(noteDetail.updated_at).toLocaleString()}</Text>
                    <Box mt={2} className="markdown-body">
                      <ReactMarkdown remarkPlugins={markdownPlugins}>{noteDetail.note || ''}</ReactMarkdown>
                    </Box>
                  </VStack>
                ) : (
                  <Text color="gray.500">点击左侧笔记以查看内容。</Text>
                )}
              </CardBody>
            </Card>
          </Box>
        </Flex>
      </VStack>
    </PageLayout>
  )
}

function Chevron({ open }: { open: boolean }) {
  return <Box as="span" display="inline-block" w="16px">{open ? '▼' : '▶'}</Box>
}
