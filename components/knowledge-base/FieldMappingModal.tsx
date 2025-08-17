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
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Alert,
  AlertIcon,
  Badge,
  Box,
  useColorModeValue,
  Code,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { RiCheckLine, RiAlertLine, RiDownloadLine } from 'react-icons/ri'

interface FieldMapping {
  sourceField: string
  targetField: string
  required: boolean
  dataType: 'text' | 'number' | 'date' | 'json'
  preview?: string
}

interface FieldMappingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (mappings: FieldMapping[]) => void
  fileData: {
    headers: string[]
    previewRows: any[]
    fileName: string
    fileType: 'csv' | 'json'
  } | null
  loading?: boolean
}

// 知识库标准字段定义
const STANDARD_FIELDS = [
  { 
    name: 'title', 
    label: '标题', 
    required: true, 
    dataType: 'text' as const,
    description: '文档标题或名称'
  },
  { 
    name: 'content', 
    label: '内容', 
    required: true, 
    dataType: 'text' as const,
    description: '文档主要内容'
  },
  { 
    name: 'author', 
    label: '作者', 
    required: false, 
    dataType: 'text' as const,
    description: '文档作者'
  },
  { 
    name: 'category', 
    label: '分类', 
    required: false, 
    dataType: 'text' as const,
    description: '文档分类标签'
  },
  { 
    name: 'tags', 
    label: '标签', 
    required: false, 
    dataType: 'json' as const,
    description: '文档标签（数组或逗号分隔）'
  },
  { 
    name: 'source_url', 
    label: '来源链接', 
    required: false, 
    dataType: 'text' as const,
    description: '原始链接地址'
  },
  { 
    name: 'created_date', 
    label: '创建日期', 
    required: false, 
    dataType: 'date' as const,
    description: '文档创建时间'
  },
  { 
    name: 'metadata', 
    label: '元数据', 
    required: false, 
    dataType: 'json' as const,
    description: '其他结构化数据'
  },
]

export function FieldMappingModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  fileData, 
  loading = false 
}: FieldMappingModalProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    if (fileData && isOpen) {
      initializeMappings()
    }
  }, [fileData, isOpen])

  const initializeMappings = () => {
    if (!fileData) return

    const initialMappings: FieldMapping[] = fileData.headers.map(header => {
      // 智能匹配常见字段名
      const normalizedHeader = header.toLowerCase().trim()
      let suggestedField = ''
      
      if (normalizedHeader.includes('title') || normalizedHeader.includes('标题')) {
        suggestedField = 'title'
      } else if (normalizedHeader.includes('content') || normalizedHeader.includes('内容') || normalizedHeader.includes('正文')) {
        suggestedField = 'content'
      } else if (normalizedHeader.includes('author') || normalizedHeader.includes('作者')) {
        suggestedField = 'author'
      } else if (normalizedHeader.includes('category') || normalizedHeader.includes('分类')) {
        suggestedField = 'category'
      } else if (normalizedHeader.includes('tag') || normalizedHeader.includes('标签')) {
        suggestedField = 'tags'
      } else if (normalizedHeader.includes('url') || normalizedHeader.includes('链接')) {
        suggestedField = 'source_url'
      } else if (normalizedHeader.includes('date') || normalizedHeader.includes('time') || normalizedHeader.includes('时间')) {
        suggestedField = 'created_date'
      }

      const targetFieldInfo = STANDARD_FIELDS.find(f => f.name === suggestedField)
      const preview = fileData.previewRows[0]?.[header]?.toString().substring(0, 50) || ''

      return {
        sourceField: header,
        targetField: suggestedField,
        required: targetFieldInfo?.required || false,
        dataType: targetFieldInfo?.dataType || 'text',
        preview
      }
    })

    setMappings(initialMappings)
    validateMappings(initialMappings)
  }

  const updateMapping = (sourceField: string, targetField: string) => {
    const newMappings = mappings.map(mapping => {
      if (mapping.sourceField === sourceField) {
        const targetFieldInfo = STANDARD_FIELDS.find(f => f.name === targetField)
        return {
          ...mapping,
          targetField,
          required: targetFieldInfo?.required || false,
          dataType: targetFieldInfo?.dataType || 'text'
        }
      }
      return mapping
    })
    
    setMappings(newMappings)
    validateMappings(newMappings)
  }

  const validateMappings = (mappings: FieldMapping[]) => {
    const errors: string[] = []
    
    // 检查必填字段
    const requiredFields = STANDARD_FIELDS.filter(f => f.required)
    const mappedTargetFields = mappings.filter(m => m.targetField).map(m => m.targetField)
    
    for (const requiredField of requiredFields) {
      if (!mappedTargetFields.includes(requiredField.name)) {
        errors.push(`必填字段 "${requiredField.label}" 未映射`)
      }
    }
    
    // 检查重复映射
    const targetFieldCounts = mappedTargetFields.reduce((acc, field) => {
      acc[field] = (acc[field] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    for (const [field, count] of Object.entries(targetFieldCounts)) {
      if (count > 1) {
        const fieldInfo = STANDARD_FIELDS.find(f => f.name === field)
        errors.push(`字段 "${fieldInfo?.label || field}" 被重复映射`)
      }
    }
    
    setErrors(errors)
  }

  const handleConfirm = () => {
    if (errors.length === 0) {
      onConfirm(mappings.filter(m => m.targetField))
    }
  }

  const downloadTemplate = () => {
    const template = STANDARD_FIELDS.map(field => ({
      字段名: field.name,
      中文名: field.label,
      是否必填: field.required ? '是' : '否',
      数据类型: field.dataType,
      说明: field.description,
      示例: getFieldExample(field.name)
    }))

    const csvContent = [
      Object.keys(template[0]).join(','),
      ...template.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '知识库导入模板.csv'
    link.click()
  }

  const getFieldExample = (fieldName: string): string => {
    const examples: Record<string, string> = {
      title: '人工智能发展趋势分析',
      content: '人工智能技术在近年来取得了突破性进展...',
      author: '张三',
      category: '技术分析',
      tags: 'AI,机器学习,深度学习',
      source_url: 'https://example.com/article/123',
      created_date: '2024-01-15',
      metadata: '{"priority": "high", "reviewed": true}'
    }
    return examples[fieldName] || ''
  }

  if (!fileData) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          字段映射配置 - {fileData.fileName}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* 文件信息 */}
            <Alert status="info">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text>
                  检测到 {fileData.fileType.toUpperCase()} 文件，包含 {fileData.headers.length} 个字段，{fileData.previewRows.length} 行预览数据
                </Text>
                <HStack>
                  <Button size="sm" leftIcon={<RiDownloadLine />} onClick={downloadTemplate}>
                    下载字段模板
                  </Button>
                </HStack>
              </VStack>
            </Alert>

            {/* 错误提示 */}
            {errors.length > 0 && (
              <Alert status="error">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">映射配置有误：</Text>
                  {errors.map((error, index) => (
                    <Text key={index} fontSize="sm">• {error}</Text>
                  ))}
                </VStack>
              </Alert>
            )}

            {/* 字段映射表格 */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                字段映射关系
              </Text>
              <TableContainer border="1px" borderColor={borderColor} borderRadius="lg">
                <Table size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th>源字段名</Th>
                      <Th>数据预览</Th>
                      <Th>映射到</Th>
                      <Th>字段说明</Th>
                      <Th>状态</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {mappings.map((mapping, index) => {
                      const targetFieldInfo = STANDARD_FIELDS.find(f => f.name === mapping.targetField)
                      const isValid = mapping.targetField && !errors.some(e => e.includes(targetFieldInfo?.label || ''))
                      
                      return (
                        <Tr key={index}>
                          <Td>
                            <Code fontSize="sm">{mapping.sourceField}</Code>
                          </Td>
                          <Td maxW="200px">
                            <Text fontSize="xs" color="gray.500" noOfLines={2}>
                              {mapping.preview || '-'}
                            </Text>
                          </Td>
                          <Td>
                            <Select
                              value={mapping.targetField}
                              onChange={(e) => updateMapping(mapping.sourceField, e.target.value)}
                              size="sm"
                              placeholder="选择目标字段"
                            >
                              {STANDARD_FIELDS.map(field => (
                                <option key={field.name} value={field.name}>
                                  {field.label} {field.required && '(必填)'}
                                </option>
                              ))}
                            </Select>
                          </Td>
                          <Td>
                            {targetFieldInfo && (
                              <VStack align="start" spacing={1}>
                                <Text fontSize="xs">{targetFieldInfo.description}</Text>
                                <HStack spacing={2}>
                                  <Badge size="sm" colorScheme={targetFieldInfo.required ? 'red' : 'gray'}>
                                    {targetFieldInfo.required ? '必填' : '可选'}
                                  </Badge>
                                  <Badge size="sm" colorScheme="blue">
                                    {targetFieldInfo.dataType}
                                  </Badge>
                                </HStack>
                              </VStack>
                            )}
                          </Td>
                          <Td>
                            {mapping.targetField ? (
                              isValid ? (
                                <Badge colorScheme="green" size="sm">
                                  <RiCheckLine style={{ marginRight: 4 }} />
                                  已配置
                                </Badge>
                              ) : (
                                <Badge colorScheme="red" size="sm">
                                  <RiAlertLine style={{ marginRight: 4 }} />
                                  有错误
                                </Badge>
                              )
                            ) : (
                              <Badge colorScheme="gray" size="sm">
                                未映射
                              </Badge>
                            )}
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            {/* 预览数据 */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3}>
                数据预览（前3行）
              </Text>
              <TableContainer border="1px" borderColor={borderColor} borderRadius="lg">
                <Table size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      {fileData.headers.map(header => (
                        <Th key={header} fontSize="xs">{header}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {fileData.previewRows.slice(0, 3).map((row, rowIndex) => (
                      <Tr key={rowIndex}>
                        {fileData.headers.map(header => (
                          <Td key={header} maxW="150px">
                            <Text fontSize="xs" noOfLines={2}>
                              {row[header]?.toString() || '-'}
                            </Text>
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            取消
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleConfirm}
            isLoading={loading}
            loadingText="导入中..."
            isDisabled={errors.length > 0}
          >
            确认导入 ({mappings.filter(m => m.targetField).length} 个字段)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
