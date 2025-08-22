'use client'

import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useColorModeValue,
  Badge,
  Alert,
  AlertIcon,
  Skeleton,
  Grid,
  useDisclosure,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import React from 'react'
import { 
  RiRefreshLine, 
  RiEditLine, 
  RiSaveLine, 
  RiCloseLine,
  RiFolderOpenLine,
  RiCheckLine,
  RiAlertLine,
  RiUploadLine,
  RiDownloadLine
} from 'react-icons/ri'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { usePrompts } from '@/hooks/usePrompts'
import { AgentInfo } from '@/types'

const MotionBox = motion(Box)

// Agent状态指示器组件
function StatusIndicator({ status }: { status: 'synced' | 'modified' | 'error' }) {
  const color = status === 'synced' ? 'green' : status === 'modified' ? 'yellow' : 'red'
  const icon = status === 'synced' ? RiCheckLine : status === 'modified' ? RiEditLine : RiAlertLine
  
  return (
    <Tooltip label={
      status === 'synced' ? '已同步' : 
      status === 'modified' ? '已修改' : 
      '错误'
    }>
      <Box 
        as={icon} 
        color={`${color}.400`} 
        fontSize="lg"
        cursor="pointer"
      />
    </Tooltip>
  )
}

// Agent卡片组件
function AgentCard({ 
  agent, 
  onEdit, 
  onSave, 
  onDiscard,
  prompt,
  isModified 
}: { 
  agent: AgentInfo
  onEdit: () => void
  onSave: () => void
  onDiscard: () => void
  prompt: string
  isModified: boolean
}) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.750')

  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      _hover={{ bg: hoverBg }}
      cursor="pointer"
      onClick={onEdit}
      position="relative"
      p={6}
    >
      <VStack align="start" spacing={3}>
        <HStack justify="space-between" w="full">
          <HStack spacing={3}>
            <Text fontWeight="bold" fontSize="lg">
              {agent.id}
            </Text>
            <Badge colorScheme="blue" variant="subtle">
              {agent.category}
            </Badge>
          </HStack>
          <HStack spacing={2}>
            {isModified && (
              <>
                <Tooltip label="保存">
                  <IconButton
                    icon={<RiSaveLine />}
                    size="sm"
                    colorScheme="green"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSave()
                    }}
                    aria-label="保存"
                  />
                </Tooltip>
                <Tooltip label="放弃修改">
                  <IconButton
                    icon={<RiCloseLine />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDiscard()
                    }}
                    aria-label="放弃修改"
                  />
                </Tooltip>
              </>
            )}
            <StatusIndicator status={agent.syncStatus} />
          </HStack>
        </HStack>
        
        <Text color="gray.600" fontSize="sm">
          {agent.description}
        </Text>
        
        <HStack spacing={4} fontSize="xs" color="gray.500">
          <Text>文件: {agent.file}</Text>
          <Text>修改: {new Date(agent.lastModified).toLocaleString()}</Text>
        </HStack>
        
        {/* 预览prompt前几行 */}
        <Box 
          w="full" 
          p={3} 
          bg={useColorModeValue('gray.50', 'gray.900')} 
          borderRadius="md"
          fontSize="xs"
          maxH="100px"
          overflow="hidden"
        >
          <Text isTruncated>
            {prompt.split('\n').slice(0, 3).join('\n')}
            {prompt.split('\n').length > 3 && '...'}
          </Text>
        </Box>
      </VStack>
    </Card>
  )
}

// Prompt编辑器Modal
function PromptEditorModal({ 
  isOpen, 
  onClose, 
  agent, 
  prompt, 
  onSave,
  onUpdate
}: {
  isOpen: boolean
  onClose: () => void
  agent: AgentInfo | null
  prompt: string
  onSave: (newPrompt: string) => void
  onUpdate: (agentId: string) => void
}) {
  const [editedPrompt, setEditedPrompt] = useState('')
  
  // 当Modal打开或agent/prompt变化时，更新编辑内容
  React.useEffect(() => {
    if (isOpen && prompt) {
      setEditedPrompt(prompt)
    }
  }, [isOpen, prompt])

  const handleSave = () => {
    onSave(editedPrompt)
  }

  const handleUpdate = async () => {
    if (agent) {
      try {
        onSave(editedPrompt) // 先保存到本地
        await onUpdate(agent.id) // 然后同步到文件
        onClose() // 更新完成后关闭Modal
      } catch (error) {
        // 更新失败时不关闭Modal，让用户可以重试
        console.error('更新到文件失败:', error)
      }
    }
  }

  const handleReset = () => {
    // 重置到原始文件内容
    if (agent) {
      setEditedPrompt(agent.prompt)
    }
  }

  if (!agent) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack>
              <Text>{agent.id}</Text>
              <Badge colorScheme="blue">{agent.category}</Badge>
              <StatusIndicator status={agent.syncStatus} />
            </HStack>
            <Text fontSize="sm" color="gray.500" fontWeight="normal">
              {agent.description}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">
                文件: {agent.file} | 最后修改: {new Date(agent.lastModified).toLocaleString()}
              </Text>
              <HStack spacing={2}>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleReset}
                >
                  重置
                </Button>
              </HStack>
            </HStack>
            
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="输入Agent的prompt..."
              rows={20}
              fontFamily="mono"
              fontSize="sm"
              resize="vertical"
            />
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              保存修改
            </Button>
            <Button colorScheme="green" onClick={handleUpdate}>
              更新到文件
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// 确认对话框
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "确认",
  colorScheme = "red"
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  colorScheme?: string
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>
            {message}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              取消
            </Button>
            <Button colorScheme={colorScheme} onClick={onConfirm} ml={3}>
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}

export default function PromptsPage() {
  const {
    directoryPath,
    agents,
    loading,
    error,
    hasUnsavedChanges,
    modifiedCount,
    loadAgents,
    refreshAgents,
    updateDirectoryPath,
    editAgentLocally,
    getAgentPrompt,
    saveAgent,
    saveAllModified,
    discardAllChanges,
    discardAgentChanges
  } = usePrompts()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [inputPath, setInputPath] = useState(directoryPath)
  const [editingAgent, setEditingAgent] = useState<AgentInfo | null>(null)
  
  const { isOpen: isEditorOpen, onOpen: onEditorOpen, onClose: onEditorClose } = useDisclosure()
  const { isOpen: isDiscardOpen, onOpen: onDiscardOpen, onClose: onDiscardClose } = useDisclosure()
  
  const toast = useToast()

  // 过滤agents
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 获取所有分类
  const categories = ['all', ...Array.from(new Set(agents.map(agent => agent.category)))]

  // 处理路径刷新
  const handlePathRefresh = () => {
    loadAgents(inputPath)
  }

  // 处理agent编辑
  const handleEditAgent = (agent: AgentInfo) => {
    setEditingAgent(agent)
    onEditorOpen()
  }

  // 处理prompt保存
  const handleSavePrompt = (newPrompt: string) => {
    if (editingAgent) {
      editAgentLocally(editingAgent.id, newPrompt)
      toast({
        title: '本地修改已保存',
        description: `${editingAgent.name} 的修改已保存到本地，点击"更新"同步到文件`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // 处理单个保存
  const handleSaveSingle = async (agentId: string) => {
    try {
      await saveAgent(agentId)
      toast({
        title: '更新成功',
        description: 'Agent已更新到文件',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '更新失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      throw error // 重新抛出错误，让Modal知道更新失败
    }
  }

  // 处理批量保存
  const handleSaveAll = async () => {
    try {
      await saveAllModified()
      toast({
        title: '批量保存成功',
        description: `${modifiedCount} 个Agent已更新到文件`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '批量保存失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // 处理放弃所有修改
  const handleDiscardAll = () => {
    discardAllChanges()
    onDiscardClose()
    toast({
      title: '已放弃所有修改',
      description: '所有本地修改已清除',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <PageLayout>
      <VStack spacing={6} align="stretch">
        {/* 页面标题 */}
        <MotionBox
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VStack align="start" spacing={2}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              bgGradient="linear(to-r, primary.400, purple.400)"
              bgClip="text"
            >
              ✍️ 提示词管理
            </Text>
            <Text color="gray.500" fontSize="lg">
              管理 YAML 文件中的 AI Agent 提示词，支持实时编辑和同步
            </Text>
          </VStack>
        </MotionBox>

        {/* 路径设置和操作栏 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <VStack spacing={4}>
              {/* 路径输入 */}
              <HStack w="full" spacing={3}>
                <InputGroup flex={1}>
                  <InputLeftElement>
                    <RiFolderOpenLine color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="YAML文件目录路径..."
                    value={inputPath}
                    onChange={(e) => setInputPath(e.target.value)}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={<RiRefreshLine />}
                      size="sm"
                      variant="ghost"
                      onClick={handlePathRefresh}
                      isLoading={loading}
                      aria-label="刷新"
                    />
                  </InputRightElement>
                </InputGroup>
              </HStack>

              {/* 搜索和筛选 */}
              <HStack w="full" spacing={4} flexWrap="wrap">
                <InputGroup maxW="400px">
                  <Input
                    placeholder="搜索Agent名称或描述..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <HStack spacing={2}>
                  {categories.map(category => (
                    <Button
                      key={category}
                      size="sm"
                      variant={selectedCategory === category ? 'solid' : 'outline'}
                      colorScheme={selectedCategory === category ? 'blue' : 'gray'}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? '全部' : category}
                    </Button>
                  ))}
                </HStack>
              </HStack>

              {/* 批量操作 */}
              {hasUnsavedChanges && (
                <HStack w="full" justify="space-between">
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      有 {modifiedCount} 个Agent存在未保存的修改
                    </Text>
                  </Alert>
                  
                  <HStack spacing={2}>
                    <Button
                      leftIcon={<RiUploadLine />}
                      colorScheme="green"
                      size="sm"
                      onClick={handleSaveAll}
                      isLoading={loading}
                    >
                      一键更新
                    </Button>
                    <Button
                      leftIcon={<RiCloseLine />}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={onDiscardOpen}
                    >
                      一键放弃
                    </Button>
                  </HStack>
                </HStack>
              )}
            </VStack>
          </Card>
        </MotionBox>

        {/* Agent列表 */}
        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {loading ? (
            <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={4}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} height="200px" borderRadius="xl" />
              ))}
            </Grid>
          ) : error ? (
            <Card>
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            </Card>
          ) : filteredAgents.length === 0 ? (
            <Card>
              <Alert status="info">
                <AlertIcon />
                {agents.length === 0 ? '没有找到任何Agent' : '没有找到符合条件的Agent'}
              </Alert>
            </Card>
          ) : (
            <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={4}>
              {filteredAgents.map((agent) => {
                const currentPrompt = getAgentPrompt(agent.id)
                const isModified = agent.syncStatus === 'modified'
                
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    prompt={currentPrompt}
                    isModified={isModified}
                    onEdit={() => handleEditAgent(agent)}
                    onSave={() => handleSaveSingle(agent.id)}
                    onDiscard={() => discardAgentChanges(agent.id)}
                  />
                )
              })}
            </Grid>
          )}
        </MotionBox>

        {/* 编辑器Modal */}
        <PromptEditorModal
          isOpen={isEditorOpen}
          onClose={onEditorClose}
          agent={editingAgent}
          prompt={editingAgent ? getAgentPrompt(editingAgent.id) : ''}
          onSave={handleSavePrompt}
          onUpdate={handleSaveSingle}
        />

        {/* 确认对话框 */}
        <ConfirmDialog
          isOpen={isDiscardOpen}
          onClose={onDiscardClose}
          onConfirm={handleDiscardAll}
          title="放弃所有修改"
          message={`确定要放弃所有 ${modifiedCount} 个Agent的本地修改吗？此操作不可撤销。`}
          confirmText="放弃修改"
          colorScheme="red"
        />
      </VStack>
    </PageLayout>
  )
}