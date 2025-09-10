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
  Input,
  IconButton,
  Badge,
  Alert,
  AlertIcon,
  Box,
  Icon,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
} from '@chakra-ui/react'
import {
  RiLockLine,
  RiDragMove2Line,
  RiDeleteBinLine,
  RiAddLine,
  RiEditLine,
  RiSaveLine,
} from 'react-icons/ri'
import { useState, useRef, useEffect } from 'react'
import { FieldOperation } from '@/types'

interface FieldManagerModalProps {
  isOpen: boolean
  onClose: () => void
  fields: string[]
  onFieldOperation: (operation: FieldOperation) => Promise<void>
  loading?: boolean
}

export function FieldManagerModal({
  isOpen,
  onClose,
  fields = [],
  onFieldOperation,
  loading = false,
}: FieldManagerModalProps) {
  const [newFieldName, setNewFieldName] = useState('')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editFieldName, setEditFieldName] = useState('')
  const [pendingDeleteField, setPendingDeleteField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()
  
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const requiredFields = ['标题']
  const editableFields = fields.filter(field => !requiredFields.includes(field))

  const handleAddField = async () => {
    if (!newFieldName.trim()) {
      toast({
        title: '字段名不能为空',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (fields.includes(newFieldName.trim())) {
      toast({
        title: '字段名已存在',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onFieldOperation({
        action: 'add',
        fieldName: newFieldName.trim(),
      })
      setNewFieldName('')
      toast({
        title: '字段添加成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('添加字段失败:', error)
      toast({
        title: '添加字段失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRenameField = async (oldName: string) => {
    if (!editFieldName.trim() || editFieldName.trim() === oldName) {
      setEditingField(null)
      setEditFieldName('')
      return
    }

    if (fields.includes(editFieldName.trim())) {
      toast({
        title: '字段名已存在',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onFieldOperation({
        action: 'rename',
        fieldName: oldName,
        newFieldName: editFieldName.trim(),
      })
      setEditingField(null)
      setEditFieldName('')
      toast({
        title: '字段重命名成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('重命名字段失败:', error)
      toast({
        title: '重命名字段失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (fieldName: string) => {
    setPendingDeleteField(fieldName)
    onDeleteOpen()
  }

  const handleDeleteField = async () => {
    if (!pendingDeleteField) return

    setIsSubmitting(true)
    try {
      await onFieldOperation({
        action: 'remove',
        fieldName: pendingDeleteField,
      })
      onDeleteClose()
      setPendingDeleteField(null)
      toast({
        title: '字段删除成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('删除字段失败:', error)
      toast({
        title: '删除字段失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (fieldName: string) => {
    setEditingField(fieldName)
    setEditFieldName(fieldName)
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditFieldName('')
  }

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setNewFieldName('')
      setEditingField(null)
      setEditFieldName('')
      setPendingDeleteField(null)
    }
  }, [isOpen])

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>字段结构管理</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              字段操作将影响该表的所有数据行，请谨慎操作
            </Alert>

            <VStack spacing={6} align="stretch">
              {/* 必填字段 */}
              <Box>
                <Text fontWeight="semibold" mb={3}>
                  必填字段
                </Text>
                <VStack spacing={2}>
                  {requiredFields.map((field) => (
                    <HStack
                      key={field}
                      justify="space-between"
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      border="1px"
                      borderColor="gray.200"
                      w="full"
                    >
                      <HStack>
                        <Icon as={RiLockLine} color="gray.500" />
                        <Text fontWeight="medium">{field}</Text>
                        <Badge colorScheme="red" size="sm">
                          必填
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        不可删除
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              {/* 可编辑字段 */}
              <Box>
                <Text fontWeight="semibold" mb={3}>
                  自定义字段
                </Text>
                <VStack spacing={2}>
                  {editableFields.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={4}>
                      暂无自定义字段，点击下方添加
                    </Text>
                  ) : (
                    editableFields.map((field) => (
                      <HStack
                        key={field}
                        justify="space-between"
                        p={3}
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        w="full"
                        bg="white"
                      >
                        <HStack flex={1}>
                          <Icon as={RiDragMove2Line} color="gray.400" />
                          {editingField === field ? (
                            <HStack flex={1}>
                              <Input
                                value={editFieldName}
                                onChange={(e) => setEditFieldName(e.target.value)}
                                size="sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameField(field)
                                  } else if (e.key === 'Escape') {
                                    cancelEdit()
                                  }
                                }}
                                autoFocus
                              />
                              <IconButton
                                icon={<RiSaveLine />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleRenameField(field)}
                                isLoading={isSubmitting}
                                aria-label="保存"
                              />
                              <IconButton
                                icon={<RiDeleteBinLine />}
                                size="sm"
                                variant="ghost"
                                onClick={cancelEdit}
                                aria-label="取消"
                              />
                            </HStack>
                          ) : (
                            <Text flex={1} fontWeight="medium">
                              {field}
                            </Text>
                          )}
                        </HStack>
                        
                        {editingField !== field && (
                          <HStack spacing={1}>
                            <IconButton
                              icon={<RiEditLine />}
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(field)}
                              aria-label="编辑字段名"
                            />
                            <IconButton
                              icon={<RiDeleteBinLine />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteClick(field)}
                              aria-label="删除字段"
                            />
                          </HStack>
                        )}
                      </HStack>
                    ))
                  )}
                </VStack>
              </Box>

              {/* 添加新字段 */}
              <Box>
                <Text fontWeight="semibold" mb={3}>
                  添加新字段
                </Text>
                <HStack spacing={3}>
                  <Input
                    placeholder="输入新字段名称"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddField()
                      }
                    }}
                  />
                  <Button
                    leftIcon={<RiAddLine />}
                    onClick={handleAddField}
                    isDisabled={!newFieldName.trim()}
                    isLoading={isSubmitting}
                    colorScheme="blue"
                    flexShrink={0}
                  >
                    添加字段
                  </Button>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认对话框 */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>⚠️ 确认删除字段</AlertDialogHeader>
            <AlertDialogBody>
              删除字段 <strong>"{pendingDeleteField}"</strong> 将会：
              <br />
              • 从所有数据行中移除该字段
              <br />
              • 数据将无法恢复
              <br />
              <br />
              确定要继续吗？
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                取消
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteField}
                ml={3}
                isLoading={isSubmitting}
              >
                确认删除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}