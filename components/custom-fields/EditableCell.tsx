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
  useColorModeValue,
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import { RiCheckLine, RiCloseLine, RiEditLine } from 'react-icons/ri'

interface EditableCellProps {
  value: string
  originalValue: string
  onValueChange: (newValue: string) => void
  isTitle?: boolean
  placeholder?: string
  disabled?: boolean
  minRows?: number
  autoFocus?: boolean
  isPending?: boolean  // 是否有未保存的更改
}

export function EditableCell({
  value = '',
  originalValue,
  onValueChange,
  isTitle = false,
  placeholder = '点击编辑...',
  disabled = false,
  minRows = 2,
  autoFocus = false,
  isPending = false
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(autoFocus)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 颜色主题
  const inputTextColor = useColorModeValue('gray.800', 'white')
  const inputBgColor = useColorModeValue('white', 'gray.700')
  const hoverBgColor = useColorModeValue('gray.100', 'whiteAlpha.100')
  const textColor = useColorModeValue('gray.800', 'white')

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(value)
  }

  const handleFinishEdit = () => {
    const newValue = editValue.trim()
    if (newValue !== originalValue) {
      onValueChange(newValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isTitle || e.ctrlKey || e.metaKey) {
        e.preventDefault()
        handleFinishEdit()
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
      <Box w="full">
        {isTitle ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
            size="sm"
            placeholder={placeholder}
            color={inputTextColor}
            bg={inputBgColor}
            border="1px solid"
            borderColor="blue.300"
          />
        ) : (
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
            size="sm"
            rows={minRows}
            resize="vertical"
            placeholder={placeholder}
            color={inputTextColor}
            bg={inputBgColor}
            border="1px solid"
            borderColor="blue.300"
          />
        )}
      </Box>
    )
  }

  return (
    <Box
      onClick={handleEdit}
      cursor={disabled ? 'default' : 'pointer'}
      p={2}
      borderRadius="md"
      _hover={{ bg: disabled ? 'transparent' : hoverBgColor }}
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
          color={isPending ? "orange.500" : textColor}
          fontStyle={isPending ? "italic" : "normal"}
          position="relative"
          _after={isPending ? {
            content: '"*"',
            color: "orange.500",
            fontSize: "xs",
            position: "absolute",
            top: "-2px",
            right: "-8px"
          } : {}}
        >
          {value}
        </Text>
      ) : (
        <Text
          fontSize="sm"
          color={useColorModeValue('gray.500', 'gray.400')}
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