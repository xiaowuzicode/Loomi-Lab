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
  Text,
  Input,
  FormControl,
  FormLabel,
  Switch,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Progress,
  List,
  ListItem,
  ListIcon,
  Divider,
  HStack,
  useToast,
} from '@chakra-ui/react'
import { useState, useRef } from 'react'
import { RiUploadLine, RiDownloadLine, RiCheckLine, RiCloseLine, RiAlertLine } from 'react-icons/ri'
import type { ContentImportRequest, ContentImportResult } from '@/types'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: ContentImportRequest) => Promise<ContentImportResult>
  onDownloadTemplate: () => void
  isLoading: boolean
}

export function ImportModal({ 
  isOpen, 
  onClose, 
  onImport, 
  onDownloadTemplate, 
  isLoading 
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [overrideExisting, setOverrideExisting] = useState(false)
  const [importResult, setImportResult] = useState<ContentImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        toast({
          title: '文件格式错误',
          description: '请选择JSON格式的文件',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: '请选择文件',
        description: '请先选择要导入的JSON文件',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setImporting(true)
      
      // 读取文件内容
      const fileContent = await file.text()
      let importData

      try {
        importData = JSON.parse(fileContent)
      } catch (error) {
        throw new Error('JSON文件格式错误，请检查文件内容')
      }

      // 确保是数组格式
      if (!Array.isArray(importData)) {
        throw new Error('导入数据必须是数组格式')
      }

      // 执行导入
      const result = await onImport({
        items: importData,
        override_existing: overrideExisting
      })

      setImportResult(result)

    } catch (error) {
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setImportResult(null)
    setOverrideExisting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const getStatusIcon = (success: boolean) => {
    return success ? RiCheckLine : RiCloseLine
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'green.500' : 'red.500'
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="80vh">
        <ModalHeader>导入爆文数据</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* 下载模板 */}
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>使用说明</AlertTitle>
                <AlertDescription>
                  1. 先下载导入模板了解数据格式
                  <br />
                  2. 按照模板格式准备您的数据
                  <br />
                  3. 上传JSON文件进行批量导入
                </AlertDescription>
              </Box>
            </Alert>

            <Button
              leftIcon={<RiDownloadLine />}
              onClick={onDownloadTemplate}
              variant="outline"
              colorScheme="blue"
            >
              下载导入模板
            </Button>

            <Divider />

            {/* 文件上传 */}
            <FormControl>
              <FormLabel>选择导入文件</FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                p={1}
              />
              {file && (
                <Text fontSize="sm" color="green.500" mt={2}>
                  已选择文件: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </Text>
              )}
            </FormControl>

            {/* 导入选项 */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="override-existing" mb="0" fontSize="sm">
                覆盖已存在的内容（相同标题和平台）
              </FormLabel>
              <Switch
                id="override-existing"
                isChecked={overrideExisting}
                onChange={(e) => setOverrideExisting(e.target.checked)}
                colorScheme="orange"
              />
            </FormControl>

            {/* 导入进度 */}
            {importing && (
              <Box>
                <Text fontSize="sm" mb={2}>正在导入数据...</Text>
                <Progress size="sm" isIndeterminate colorScheme="blue" />
              </Box>
            )}

            {/* 导入结果 */}
            {importResult && (
              <Box>
                <Alert 
                  status={importResult.success > 0 ? 'success' : 'error'} 
                  borderRadius="md"
                  mb={4}
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle>导入完成</AlertTitle>
                    <AlertDescription>
                      共 {importResult.total} 条数据，
                      成功 {importResult.success} 条，
                      失败 {importResult.failed} 条
                    </AlertDescription>
                  </Box>
                </Alert>

                {/* 成功导入的项目 */}
                {importResult.imported_items.length > 0 && (
                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="green.600" mb={2}>
                      成功导入的内容:
                    </Text>
                    <List spacing={1} maxH="120px" overflowY="auto">
                      {importResult.imported_items.map((item, index) => (
                        <ListItem key={index} fontSize="sm">
                          <ListIcon
                            as={RiCheckLine}
                            color="green.500"
                            w={3}
                            h={3}
                          />
                          {item}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* 错误信息 */}
                {importResult.errors.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="red.600" mb={2}>
                      导入错误:
                    </Text>
                    <List spacing={1} maxH="120px" overflowY="auto">
                      {importResult.errors.map((error, index) => (
                        <ListItem key={index} fontSize="sm">
                          <ListIcon
                            as={RiAlertLine}
                            color="red.500"
                            w={3}
                            h={3}
                          />
                          {error}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              {importResult ? '关闭' : '取消'}
            </Button>
            {!importResult && (
              <Button
                colorScheme="blue"
                onClick={handleImport}
                isLoading={importing}
                loadingText="导入中..."
                leftIcon={<RiUploadLine />}
                isDisabled={!file}
              >
                开始导入
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
