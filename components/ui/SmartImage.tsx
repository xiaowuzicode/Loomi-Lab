'use client'

import { useState } from 'react'
import { Image, ImageProps, Box, Text } from '@chakra-ui/react'
import { getSmartImageUrls } from '@/lib/image-utils'

interface SmartImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string
  alt: string
  fallbackText?: string
}

/**
 * 智能图片组件
 * 自动处理图片加载失败，支持代理URL降级
 */
export function SmartImage({ 
  src, 
  alt, 
  fallbackText = '📷 图片加载失败',
  ...props 
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState('')
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // 获取智能URL配置
  const { primary, fallback, needsProxy } = getSmartImageUrls(src)

  // 初始化src
  if (!currentSrc && primary) {
    setCurrentSrc(primary)
  }

  const handleError = () => {
    if (fallback && currentSrc !== fallback) {
      // 尝试使用代理URL
      console.log(`图片加载失败，尝试代理: ${src}`)
      setCurrentSrc(fallback)
      setHasError(false)
    } else {
      // 所有方法都失败了
      setHasError(true)
    }
  }

  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
  }

  // 如果没有src或加载失败，显示fallback
  if (!src || hasError) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.100"
        borderRadius="md"
        {...props}
      >
        <Text color="gray.400" fontSize="sm">
          {fallbackText}
        </Text>
      </Box>
    )
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
      style={{
        ...props.style,
        opacity: isLoaded ? 1 : 0.8,
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
  )
}
