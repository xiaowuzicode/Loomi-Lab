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
  Text,
  Box,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  HStack,
  Badge,
  Divider,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Icon,
  Switch,
} from '@chakra-ui/react'
import {
  RiUploadLine,
  RiFileExcelLine,
  RiCheckLine,
  RiErrorWarningLine,
} from 'react-icons/ri'
import { useState, useRef } from 'react'
import { parseExcelFile } from '@/lib/excel-utils'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: {
    fields: string[]
    data: any[]
    tableName: string
    type?: string
    readme?: string
    exampleData?: string
    visibility?: boolean
    isPublic?: boolean
    appCode?: string
    amount?: number
  }) => Promise<void>
  type?: string
  loading?: boolean
}

export function ImportModal({ 
  isOpen, 
  onClose, 
  onImport, 
  type,
  loading = false 
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [tableName, setTableName] = useState('')
  const [typeInput, setTypeInput] = useState(type || '')
  const [readme, setReadme] = useState('')
  const [exampleData, setExampleData] = useState('')
  const [visibility, setVisibility] = useState(true)
  const [isPublic, setIsPublic] = useState(false)
  const [appCode, setAppCode] = useState('loomi')
  const [amount, setAmount] = useState<number>(0)
  const [parseResult, setParseResult] = useState<{
    fields: string[]
    data: any[]
    rowCount: number
  } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  
  // 颜色主题
  const sampleBgColor = useColorModeValue('gray.50', 'gray.700')
  const sampleBorderColor = useColorModeValue('gray.200', 'gray.600')
  const infoBgColor = useColorModeValue('blue.50', 'blue.900')
  const infoTextColor = useColorModeValue('blue.800', 'blue.200')
  const fileBgColor = useColorModeValue('gray.50', 'gray.600')
  const fileHoverBgColor = useColorModeValue('gray.100', 'gray.500')
  const fileSelectedBgColor = useColorModeValue('green.50', 'green.800')
  const fileSelectedHoverBgColor = useColorModeValue('green.100', 'green.700')
  const fileBorderColor = useColorModeValue('gray.300', 'gray.500')
  const fileSelectedBorderColor = useColorModeValue('green.300', 'green.500')

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // 验证文件类型
    if (!selectedFile.name.toLowerCase().endsWith('.xlsx') && !selectedFile.name.toLowerCase().endsWith('.xls')) {
      toast({
        title: '文件格式错误',
        description: '请选择Excel文件（.xlsx或.xls格式）',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setFile(selectedFile)
    setErrors([])
    setIsProcessing(true)

    try {
      const result = await parseExcelFile(selectedFile)
      setParseResult(result)
      
      // 自动填入表名（基于文件名）
      if (!tableName) {
        const nameWithoutExt = selectedFile.name.replace(/\.(xlsx|xls)$/i, '')
        setTableName(nameWithoutExt)
      }
      
      toast({
        title: '文件解析成功',
        description: `找到 ${result.rowCount} 行数据，${result.fields.length} 个字段`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件解析失败'
      setErrors([errorMessage])
      setParseResult(null)
      toast({
        title: '文件解析失败',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!parseResult || !tableName.trim()) {
      toast({
        title: '信息不完整',
        description: '请选择文件并填写表名',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await onImport({
        fields: parseResult.fields,
        data: parseResult.data,
        tableName: tableName.trim(),
        type: typeInput.trim(),
        readme: readme.trim(),
        exampleData: exampleData.trim(),
        visibility,
        isPublic,
        appCode: appCode.trim(),
        amount: Number(amount) || 0
      })
      handleClose()
    } catch (error) {
      // 错误处理由父组件完成
    }
  }

  const handleClose = () => {
    setFile(null)
    setTableName('')
    setParseResult(null)
    setErrors([])
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const modalTitle = '导入数据表'
  const tablePlaceholder = '请输入表格名称'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {modalTitle}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* 文件选择 */}
            <FormControl>
              <FormLabel>选择Excel文件</FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                display="none"
              />
              <Box
                p={4}
                border="2px dashed"
                borderColor={file ? fileSelectedBorderColor : fileBorderColor}
                borderRadius="md"
                textAlign="center"
                cursor="pointer"
                bg={file ? fileSelectedBgColor : fileBgColor}
                _hover={{ bg: file ? fileSelectedHoverBgColor : fileHoverBgColor }}
                onClick={() => fileInputRef.current?.click()}
              >
                {isProcessing ? (
                  <VStack spacing={2}>
                    <Icon as={RiUploadLine} boxSize={6} color="blue.500" />
                    <Text fontSize="sm" color="blue.500">正在解析文件...</Text>
                  </VStack>
                ) : file ? (
                  <VStack spacing={2}>
                    <Icon as={RiFileExcelLine} boxSize={6} color="green.500" />
                    <Text fontSize="sm" fontWeight="medium" color="green.600">
                      {file.name}
                    </Text>
                    <Text fontSize="xs" color={useColorModeValue("green.600", "green.400")}>
                      点击重新选择文件
                    </Text>
                  </VStack>
                ) : (
                  <VStack spacing={2}>
                    <Icon as={RiUploadLine} boxSize={6} color={useColorModeValue("gray.400", "gray.500")} />
                    <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.300")}>
                      点击选择Excel文件或拖拽文件到此处
                    </Text>
                    <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>
                      支持 .xlsx 和 .xls 格式
                    </Text>
                  </VStack>
                )}
              </Box>
            </FormControl>

            {/* 表名输入 */}
            <FormControl isRequired>
              <FormLabel>表格名称</FormLabel>
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder={tablePlaceholder}
              />
            </FormControl>

            {/* 额外参数（与新建表一致） */}
            <FormControl>
              <FormLabel>类型</FormLabel>
              <Input
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value)}
                placeholder="请输入类型（可留空）"
              />
            </FormControl>

            <FormControl>
              <FormLabel>📖 表格说明</FormLabel>
              <Input
                value={readme}
                onChange={(e) => setReadme(e.target.value)}
                placeholder="可填写表格说明"
              />
            </FormControl>

            <FormControl>
              <FormLabel>💡 示例数据</FormLabel>
              <Input
                value={exampleData}
                onChange={(e) => setExampleData(e.target.value)}
                placeholder="可填写示例数据说明"
              />
            </FormControl>

            <HStack spacing={6}>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>👁️ 可见性</FormLabel>
                <Switch isChecked={visibility} onChange={(e) => setVisibility(e.target.checked)} />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>🌐 公开性</FormLabel>
                <Switch isChecked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              </FormControl>
            </HStack>

            <HStack spacing={6}>
              <FormControl>
                <FormLabel>应用代码</FormLabel>
                <Input value={appCode} onChange={(e) => setAppCode(e.target.value)} placeholder="loomi" />
              </FormControl>
              <FormControl>
                <FormLabel>金额 (元)</FormLabel>
                <Input type="number" min="0" step="0.01" value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} placeholder="0" />
              </FormControl>
            </HStack>

            {/* 解析结果展示 */}
            {parseResult && (
              <Box>
                <Text fontWeight="semibold" mb={3}>📊 数据预览</Text>
                <VStack spacing={3} align="stretch">
                  <HStack>
                    <Badge colorScheme="blue">数据行数: {parseResult.rowCount}</Badge>
                    <Badge colorScheme="green">字段数量: {parseResult.fields.length}</Badge>
                  </HStack>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>字段列表：</Text>
                    <List spacing={1}>
                      {parseResult.fields.map((field, index) => (
                        <ListItem key={index} fontSize="sm">
                          <ListIcon as={RiCheckLine} color="green.500" />
                      {field}
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {parseResult.data.length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>数据示例（前3行）：</Text>
                      <Box 
                        bg={sampleBgColor} 
                        borderWidth="1px" 
                        borderColor={sampleBorderColor} 
                        borderRadius="md" 
                        maxH="300px" 
                        overflowY="auto"
                      >
                        <TableContainer>
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th fontSize="xs" py={2}>行号</Th>
                                {parseResult.fields.map(field => (
                                  <Th key={field} fontSize="xs" py={2} maxW="120px">
                                {field}
                                  </Th>
                                ))}
                              </Tr>
                            </Thead>
                            <Tbody>
                              {parseResult.data.slice(0, 3).map((row, index) => (
                                <Tr key={index}>
                                  <Td fontSize="xs" py={2} fontWeight="medium">
                                    {index + 1}
                                  </Td>
                                  {parseResult.fields.map(field => (
                                    <Td key={field} fontSize="xs" py={2} maxW="120px">
                                      <Text noOfLines={2} title={row[field] || '(空)'}>
                                        {row[field] || (
                                          <Text as="span" color="gray.400" fontStyle="italic">
                                            (空)
                                          </Text>
                                        )}
                                      </Text>
                                    </Td>
                                  ))}
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Box>
                  )}
                  
                  {parseResult.data.length === 0 && (
                    <Alert status="warning">
                      <AlertIcon />
                      <AlertDescription>
                        Excel文件中没有找到有效的数据行，请检查文件内容。
                      </AlertDescription>
                    </Alert>
                  )}
                </VStack>
              </Box>
            )}

            {/* 错误信息 */}
            {errors.length > 0 && (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>
                  <VStack align="start" spacing={1}>
                    {errors.map((error, index) => (
                      <Text key={index}>{error}</Text>
                    ))}
                  </VStack>
                </AlertDescription>
              </Alert>
            )}

            {/* 说明信息 */}
            <Box bg={infoBgColor} p={4} borderRadius="md">
              <HStack mb={2}>
                <Icon as={RiFileExcelLine} color={infoTextColor} />
                <Text fontWeight="semibold" color={infoTextColor}>导入说明</Text>
              </HStack>
              <List spacing={1} fontSize="sm" color={infoTextColor}>
                <ListItem>• Excel文件第一行必须是字段名（表头）</ListItem>
                <ListItem>• 建议包含"标题"字段（缺失时系统会自动补充空列）</ListItem>
                <ListItem>• 序号将自动生成，无需在Excel中包含</ListItem>
                <ListItem>• 空行将被自动跳过</ListItem>
                <ListItem>• 支持 .xlsx 和 .xls 格式</ListItem>
              </List>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            取消
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleImport}
            isDisabled={!parseResult || !tableName.trim()}
            isLoading={loading}
            loadingText="导入中..."
          >
            导入数据
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
