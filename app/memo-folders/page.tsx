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
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'

interface FolderNode {
  fold_id: string
  fold_name: string
  children: FolderNode[]
  expanded?: boolean
}

export default function MemoFoldersPage() {
  const toast = useToast()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadFolders = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/memo-folders?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (data.success) {
        setFolders(data.data?.folders || [])
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
          onClick={() => { setSelectedId(n.fold_id); if (hasChildren) toggle(n.fold_id) }}
        >
          <HStack spacing={2}>
            <Box onClick={(e) => { e.stopPropagation(); if (hasChildren) toggle(n.fold_id) }}>
              {hasChildren ? <Chevron open={open} /> : <Box as="span" w="16px" />}
            </Box>
            <Box as="span" color={selectedId === n.fold_id ? 'blue.300' : undefined}>📁 {n.fold_name}</Box>
          </HStack>
        </Box>
      )
      if (hasChildren && open) {
        rows.push(...renderNodes(n.children, level + 1))
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
          {/* Left: Tree placeholder */}
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
                    {renderNodes(folders, 0)}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </Box>

          {/* Right: Details placeholder */}
          <Box flex={1}>
            <Card h="full">
              <CardBody>
                <Text fontWeight="semibold" mb={2}>详情面板</Text>
                {selectedId ? (
                  <Text color="gray.300">已选择：{selectedId}</Text>
                ) : (
                  <Text color="gray.500">此区域预留用于显示选中文件夹的详细信息与快捷操作。</Text>
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
