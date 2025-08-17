'use client'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Code,
  Table,
  Tbody,
  Tr,
  Td,
  TableContainer,
  Skeleton,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Divider,
  Textarea,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { RiFileTextLine, RiDatabase2Line, RiTimeLineTime } from 'react-icons/ri'

interface Document {
  id: string | number
  title: string
  content: string
  full_content?: string
  source: string
  metadata: any
  created_at: string
  score?: number
}

interface Vector {
  id: string | number
  vector_id: string
  dimension: number
  vector_preview: number[]
  source: string
  title: string
  metadata: any
  created_at: string
  similarity_score?: number
}

interface DataViewModalProps {
  isOpen: boolean
  onClose: () => void
  collectionName: string
  viewType: 'documents' | 'vectors'
}

export function DataViewModal({ isOpen, onClose, collectionName, viewType }: DataViewModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [vectors, setVectors] = useState<Vector[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Document | Vector | null>(null)

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardBg = useColorModeValue('gray.50', 'gray.700')

  useEffect(() => {
    if (isOpen && collectionName) {
      fetchData()
    }
  }, [isOpen, collectionName, viewType])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    setDocuments([])
    setVectors([])
    setSelectedItem(null)

    try {
      const response = await fetch(`/api/milvus-data?action=${viewType}&collection=${collectionName}&limit=10`)
      const result = await response.json()

      if (result.success) {
        if (viewType === 'documents') {
          setDocuments(result.data.documents || [])
        } else {
          setVectors(result.data.vectors || [])
        }
      } else {
        setError(result.error || `获取${viewType === 'documents' ? '文档' : '向量'}数据失败`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN')
    } catch {
      return dateString
    }
  }

  const renderDocumentsList = () => (
    <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
      {documents.map((doc) => (
        <Box
          key={doc.id}
          p={4}
          bg={cardBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          cursor="pointer"
          onClick={() => setSelectedItem(doc)}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
        >
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                {doc.title}
              </Text>
              <Badge colorScheme={doc.score && doc.score > 0.5 ? 'green' : 'gray'} size="sm">
                ID: {doc.id}
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.500" noOfLines={3}>
              {doc.content}
            </Text>
            
            <HStack spacing={4} fontSize="xs" color="gray.400">
              <HStack>
                <RiFileTextLine />
                <Text>{doc.source}</Text>
              </HStack>
              <HStack>
                <RiTimeLineTime />
                <Text>{formatDate(doc.created_at)}</Text>
              </HStack>
              {doc.score && (
                <Badge colorScheme="blue" size="sm">
                  相似度: {(doc.score * 100).toFixed(1)}%
                </Badge>
              )}
            </HStack>
          </VStack>
        </Box>
      ))}
      
      {documents.length === 0 && !loading && (
        <Alert status="info">
          <AlertIcon />
          该集合暂无文档数据
        </Alert>
      )}
    </VStack>
  )

  const renderVectorsList = () => (
    <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
      {vectors.map((vector) => (
        <Box
          key={vector.id}
          p={4}
          bg={cardBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          cursor="pointer"
          onClick={() => setSelectedItem(vector)}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
        >
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontWeight="bold" fontSize="md">
                {vector.title}
              </Text>
              <Badge colorScheme="purple" size="sm">
                {vector.dimension}维
              </Badge>
            </HStack>
            
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                向量ID: <Code fontSize="xs">{vector.vector_id}</Code>
              </Text>
              <Text fontSize="sm" color="gray.500">
                来源: {vector.source}
              </Text>
            </HStack>
            
            <Box>
              <Text fontSize="xs" color="gray.400" mb={1}>向量预览 (前5维):</Text>
              <Code fontSize="xs" p={2} borderRadius="md" display="block">
                [{vector.vector_preview.map(v => v.toFixed(4)).join(', ')}...]
              </Code>
            </Box>
            
            <HStack spacing={4} fontSize="xs" color="gray.400">
              <HStack>
                <RiDatabase2Line />
                <Text>ID: {vector.id}</Text>
              </HStack>
              <HStack>
                <RiTimeLineTime />
                <Text>{formatDate(vector.created_at)}</Text>
              </HStack>
            </HStack>
          </VStack>
        </Box>
      ))}
      
      {vectors.length === 0 && !loading && (
        <Alert status="info">
          <AlertIcon />
          该集合暂无向量数据或向量数据不可直接查看
        </Alert>
      )}
    </VStack>
  )

  const renderDetailView = () => {
    if (!selectedItem) return null

    const isDocument = 'content' in selectedItem
    const item = selectedItem as Document | Vector

    return (
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">
          {isDocument ? '文档详情' : '向量详情'}
        </Text>
        
        <TableContainer>
          <Table size="sm" variant="simple">
            <Tbody>
              <Tr>
                <Td fontWeight="bold" w="120px">ID</Td>
                <Td><Code>{item.id}</Code></Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">标题</Td>
                <Td>{isDocument ? (item as Document).title : (item as Vector).title}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">来源</Td>
                <Td>{item.source}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">创建时间</Td>
                <Td>{formatDate(item.created_at)}</Td>
              </Tr>
              {isDocument && (
                <Tr>
                  <Td fontWeight="bold" verticalAlign="top">完整内容</Td>
                  <Td>
                    <Textarea 
                      value={(item as Document).full_content || (item as Document).content}
                      isReadOnly 
                      minH="120px"
                      resize="vertical"
                    />
                  </Td>
                </Tr>
              )}
              {!isDocument && (
                <>
                  <Tr>
                    <Td fontWeight="bold">向量ID</Td>
                    <Td><Code>{(item as Vector).vector_id}</Code></Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">维度</Td>
                    <Td>{(item as Vector).dimension}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold" verticalAlign="top">向量预览</Td>
                    <Td>
                      <Code fontSize="xs" display="block" p={2} whiteSpace="pre-wrap">
                        [{(item as Vector).vector_preview.map(v => v.toFixed(6)).join(',\n ')}...]
                      </Code>
                    </Td>
                  </Tr>
                </>
              )}
              <Tr>
                <Td fontWeight="bold" verticalAlign="top">元数据</Td>
                <Td>
                  <Code fontSize="xs" display="block" p={2} whiteSpace="pre-wrap">
                    {JSON.stringify(item.metadata, null, 2)}
                  </Code>
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>

        <Button size="sm" onClick={() => setSelectedItem(null)}>
          返回列表
        </Button>
      </VStack>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          {viewType === 'documents' ? '📄 文档列表' : '🔢 向量数据'} - {collectionName}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <VStack spacing={3}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height="80px" borderRadius="md" />
              ))}
            </VStack>
          ) : error ? (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          ) : selectedItem ? (
            renderDetailView()
          ) : (
            <>
              <Text fontSize="sm" color="gray.500" mb={4}>
                {viewType === 'documents' 
                  ? `显示 ${documents.length} 个文档 (点击查看详情)`
                  : `显示 ${vectors.length} 个向量 (点击查看详情)`
                }
              </Text>
              {viewType === 'documents' ? renderDocumentsList() : renderVectorsList()}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>关闭</Button>
          {!selectedItem && !loading && (
            <Button ml={2} onClick={fetchData} variant="outline">
              刷新
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
