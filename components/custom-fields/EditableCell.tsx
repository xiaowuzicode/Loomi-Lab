'use client'

import {
  Box,
  Input,
  Textarea,
  Text,
  HStack,
  IconButton,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import { RiCheckLine, RiCloseLine, RiEditLine } from 'react-icons/ri'

interface EditableCellProps {
  value: string
  onSave: (newValue: string) => Promise<void> | void
  isTitle?: boolean
  placeholder?: string
  disabled?: boolean
  minRows?: number
  autoFocus?: boolean
}

export function EditableCell({
  value = '',
  onSave,
  isTitle = false,
  placeholder = '点击编辑...',
  disabled = false,
  minRows = 2,
  autoFocus = false
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(autoFocus)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toast = useToast()

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(value)
  }

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(editValue.trim())
      setIsEditing(false)
      toast({
        title: '保存成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('保存失败:', error)
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setEditValue(value) // 恢复原值
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isTitle || e.ctrlKey || e.metaKey) {
        e.preventDefault()
        handleSave()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  // 自动聚焦
  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        if (isTitle && inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        } else if (!isTitle && textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.select()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isEditing, isTitle])

  if (isEditing) {
    return (
      <HStack spacing={2} w="full">
        {isTitle ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            size="sm"
            disabled={isLoading}
            placeholder={placeholder}
          />
        ) : (
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            size="sm"
            rows={minRows}
            resize="vertical"
            disabled={isLoading}
            placeholder={placeholder}
          />
        )}
        <HStack spacing={1} flexShrink={0}>
          <IconButton
            icon={<RiCheckLine />}
            size="xs"
            colorScheme="green"
            onClick={handleSave}
            isLoading={isLoading}
            aria-label="保存"
          />
          <IconButton
            icon={<RiCloseLine />}
            size="xs"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="取消"
          />
        </HStack>
      </HStack>
    )
  }

  return (
    <Box
      onClick={handleEdit}
      cursor={disabled ? 'default' : 'pointer'}
      p={2}
      borderRadius="md"
      _hover={{ bg: disabled ? 'transparent' : 'gray.100' }}
      minH={isTitle ? '32px' : '60px'}
      display="flex"
      alignItems={isTitle ? 'center' : 'flex-start'}
      position="relative"
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          handleEdit()
        }
      }}
    >
      {value ? (
        <Text
          fontSize="sm"
          noOfLines={isTitle ? 1 : 3}
          wordBreak="break-word"
          w="full"
        >
          {value}
        </Text>
      ) : (
        <Text
          fontSize="sm"
          color="gray.500"
          fontStyle="italic"
          w="full"
        >
          {placeholder}
        </Text>
      )}
      
      {!disabled && !isTitle && (
        <IconButton
          icon={<RiEditLine />}
          size="xs"
          variant="ghost"
          position="absolute"
          top={1}
          right={1}
          opacity={0}
          _groupHover={{ opacity: 1 }}
          aria-label="编辑"
          onClick={(e) => {
            e.stopPropagation()
            handleEdit()
          }}
        />
      )}
    </Box>
  )
}