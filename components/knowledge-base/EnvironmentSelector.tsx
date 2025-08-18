'use client'

import {
  HStack,
  Select,
  Text,
  Badge,
  Tooltip,
  useColorModeValue,
  Icon,
  Box,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { RiServerLine, RiCloudLine, RiComputerLine, RiWifiLine } from 'react-icons/ri'
import type { MilvusEnvironment } from '@/lib/milvus'

interface EnvironmentInfo {
  environment: MilvusEnvironment
  address: string
  database: string
  hasToken: boolean
  name: string
}

interface EnvironmentSelectorProps {
  value: MilvusEnvironment
  onChange: (env: MilvusEnvironment) => Promise<void>
  onEnvironmentsLoaded?: (envs: EnvironmentInfo[]) => void
}

const environmentIcons = {
  local: RiComputerLine,
  hosted: RiCloudLine,
  aliyun: RiServerLine,
}

const environmentColors = {
  local: 'green',
  hosted: 'blue', 
  aliyun: 'purple',
}

export function EnvironmentSelector({ 
  value, 
  onChange, 
  onEnvironmentsLoaded 
}: EnvironmentSelectorProps) {
  const [environments, setEnvironments] = useState<EnvironmentInfo[]>([])
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)

  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bgColor = useColorModeValue('white', 'gray.800')

  // 获取环境信息
  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        const response = await fetch('/api/knowledge-base?action=environments')
        const result = await response.json()
        
        if (result.success && result.data) {
          setEnvironments(result.data.environments.map((env: any) => env.info))
          onEnvironmentsLoaded?.(result.data.environments.map((env: any) => env.info))
          
          // 检查所有环境的连接状态
          checkAllEnvironments(result.data.environments.map((env: any) => env.env))
        }
      } catch (error) {
        console.error('获取环境信息失败:', error)
      }
    }

    fetchEnvironments()
  }, [onEnvironmentsLoaded])

  // 检查环境连接状态
  const checkAllEnvironments = async (envs: MilvusEnvironment[]) => {
    setLoading(true)
    const statusMap: Record<string, boolean> = {}
    
    // 并行检查所有环境
    await Promise.all(
      envs.map(async (env) => {
        try {
          const response = await fetch(`/api/knowledge-base?action=health&env=${env}`)
          const result = await response.json()
          statusMap[env] = result.success && result.data?.connected
        } catch (error) {
          console.error(`检查 ${env} 环境失败:`, error)
          statusMap[env] = false
        }
      })
    )
    
    setConnectionStatus(statusMap)
    setLoading(false)
  }

  // 获取环境显示信息
  const getEnvironmentInfo = (env: MilvusEnvironment) => {
    return environments.find(e => e.environment === env)
  }

  // 获取连接状态徽章
  const getConnectionBadge = (env: MilvusEnvironment) => {
    const connected = connectionStatus[env]
    
    if (loading) {
      return <Badge size="sm" colorScheme="gray">检查中</Badge>
    }
    
    return (
      <Badge 
        size="sm" 
        colorScheme={connected ? 'green' : 'red'}
      >
        {connected ? '已连接' : '未连接'}
      </Badge>
    )
  }

  return (
    <HStack spacing={3} align="center">
      <HStack spacing={2}>
        <Icon as={RiWifiLine} boxSize={4} color="gray.500" />
        <Text fontSize="sm" fontWeight="medium" color="gray.600">
          环境:
        </Text>
      </HStack>
      
      <HStack spacing={2} align="center">
        <Select
          value={value}
          onChange={async (e) => {
            const newEnv = e.target.value as MilvusEnvironment
            if (newEnv !== value) {
              setSwitching(true)
              try {
                await onChange(newEnv)
              } finally {
                setSwitching(false)
              }
            }
          }}
          size="sm"
          width="160px"
          bg={bgColor}
          borderColor={borderColor}
          disabled={switching}
          _focus={{
            borderColor: environmentColors[value] + '.400',
            boxShadow: `0 0 0 1px var(--chakra-colors-${environmentColors[value]}-400)`,
          }}
        >
          {environments.map((env) => (
            <option key={env.environment} value={env.environment}>
              {env.name}
            </option>
          ))}
        </Select>

        {/* 环境图标 */}
        <Tooltip
          label={`${getEnvironmentInfo(value)?.name || value} - ${getEnvironmentInfo(value)?.address || '未配置'}`}
          placement="bottom"
        >
          <Box>
            <Icon
              as={environmentIcons[value]}
              boxSize={4}
              color={`${environmentColors[value]}.500`}
            />
          </Box>
        </Tooltip>

        {/* 连接状态 */}
        <Tooltip
          label={switching ? '正在切换环境...' : `连接状态: ${connectionStatus[value] ? '正常' : '断开'}`}
          placement="bottom"
        >
          <Box>
            {switching ? (
              <Badge size="sm" colorScheme="blue">
                切换中...
              </Badge>
            ) : (
              getConnectionBadge(value)
            )}
          </Box>
        </Tooltip>
      </HStack>
    </HStack>
  )
}
