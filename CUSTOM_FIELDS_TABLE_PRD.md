# 自定义字段表格化改造 - 技术规格

## 核心变更

### 数据结构升级
**旧结构**: 单条记录存储，每个CustomFieldRecord包含一个扩展字段对象
**新结构**: 表格数据存储，每个CustomFieldRecord包含一个数据行数组

## 数据结构设计

### 数据库变更
`extended_field` 字段类型：`JSONB NOT NULL DEFAULT '[]'`

### 数据格式
```json
[
  {
    "id": 1,
    "标题": "探索Supabase的强大功能",
    "正文": "Supabase是一个优秀的开源Firebase替代品...",
    "分类": "技术",
    "热度": "95"
  },
  {
    "id": 2, 
    "标题": "前端开发最佳实践",
    "正文": "在现代前端开发中...",
    "分类": "开发",
    "热度": "87"
  }
]
```

### 约束规则
- `id`: 自增整数，行唯一标识
- `标题`: 固定字段，不可删除
- 字段值: 统一字符串类型
- 结构一致性: 所有行对象字段结构相同

## UI组件详细设计

### 页面整体布局
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                Header Navigation                                         │
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│   📁 分类导航   │                           主内容区域                                    │
│              │                                                                         │
│  🧠 洞察 (5)  │  ┌─ 数据表工具栏 ──────────────────────────────────────────────┐         │
│  💖 钩子 (3)  │  │ [新建表] [字段管理] [导入] [导出] [搜索框] [刷新]          │         │
│  ⚡ 情绪 (2)  │  └─────────────────────────────────────────────────────────┘         │
│              │                                                                         │
│              │  ┌─ 数据表格区域 ──────────────────────────────────────────────┐         │
│              │  │ ☑ │ ID │  标题    │  正文     │  分类  │  热度  │   操作   │         │
│              │  │ ☑ │ 1  │ 标题1    │ 内容1...  │ 技术   │  95   │ [编辑][删] │         │
│              │  │ ☑ │ 2  │ 标题2    │ 内容2...  │ 开发   │  87   │ [编辑][删] │         │
│              │  │ ☑ │ 3  │ 标题3    │ 内容3...  │ AI     │  92   │ [编辑][删] │         │
│              │  │ + │    │ [添加新行...]                                     │         │
│              │  └─────────────────────────────────────────────────────────┘         │
│              │                                                                         │
│              │  ┌─ 批量操作栏 ──────────────────────────────────────────────┐         │
│              │  │ 已选择 3 行  [批量编辑] [批量删除] [导出选中]              │         │
│              │  └─────────────────────────────────────────────────────────┘         │
│              │                                                                         │
│              │  📄 分页：第1页/共5页 (120条记录)  [上一页] [下一页]                    │
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

### 核心UI组件设计

#### 1. 数据表工具栏 (`TableToolbar`)
```tsx
<HStack spacing={4} mb={4} justify="space-between">
  <HStack spacing={3}>
    <Button leftIcon={<RiAddLine />} colorScheme="blue" onClick={handleCreateTable}>
      新建表
    </Button>
    <Button leftIcon={<RiSettings3Line />} variant="outline" onClick={handleFieldManager}>
      字段管理
    </Button>
    <Menu>
      <MenuButton as={Button} rightIcon={<RiMoreLine />} variant="outline">
        更多操作
      </MenuButton>
      <MenuList>
        <MenuItem icon={<RiUploadLine />}>导入数据</MenuItem>
        <MenuItem icon={<RiDownloadLine />}>导出数据</MenuItem>
        <MenuItem icon={<RiFileExcelLine />}>导出为Excel</MenuItem>
      </MenuList>
    </Menu>
  </HStack>
  
  <HStack spacing={3}>
    <InputGroup w="300px">
      <InputLeftElement><RiSearchLine /></InputLeftElement>
      <Input placeholder="搜索表格数据..." />
    </InputGroup>
    <IconButton icon={<RiRefreshLine />} onClick={handleRefresh} />
  </HStack>
</HStack>
```

#### 2. 数据表格组件 (`DataTable`)
```tsx
<TableContainer>
  <Table variant="simple" size="md">
    {/* 表头 */}
    <Thead bg="gray.50">
      <Tr>
        <Th w="40px">
          <Checkbox 
            isChecked={allSelected} 
            onChange={handleSelectAll}
          />
        </Th>
        <Th w="60px">ID</Th>
        {/* 动态生成字段表头 */}
        {tableFields.map(field => (
          <Th key={field} minW="120px">
            <HStack spacing={1}>
              <Text>{field}</Text>
              {field !== '标题' && (
                <Menu>
                  <MenuButton as={IconButton} icon={<RiMoreLine />} size="xs" />
                  <MenuList>
                    <MenuItem onClick={() => handleSortField(field)}>排序</MenuItem>
                    <MenuItem onClick={() => handleFilterField(field)}>筛选</MenuItem>
                    <MenuItem onClick={() => handleRenameField(field)}>重命名</MenuItem>
                    <MenuItem onClick={() => handleDeleteField(field)}>删除字段</MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </Th>
        ))}
        <Th w="120px">操作</Th>
      </Tr>
    </Thead>
    
    {/* 表身 */}
    <Tbody>
      {tableData.map((row, index) => (
        <TableRow 
          key={row.id} 
          row={row} 
          isSelected={selectedRows.includes(row.id)}
          onSelect={handleRowSelect}
          onEdit={handleRowEdit}
          onDelete={handleRowDelete}
        />
      ))}
      
      {/* 添加新行 */}
      <Tr bg="gray.25" _hover={{ bg: "gray.50" }}>
        <Td>
          <Icon as={RiAddLine} color="gray.400" />
        </Td>
        <Td colSpan={tableFields.length + 2}>
          <Button 
            variant="ghost" 
            leftIcon={<RiAddLine />}
            onClick={handleAddRow}
            w="full"
            justifyContent="flex-start"
          >
            添加新行...
          </Button>
        </Td>
      </Tr>
    </Tbody>
  </Table>
</TableContainer>
```

#### 3. 表格行组件 (`TableRow`)
```tsx
<Tr 
  bg={isSelected ? "blue.50" : "white"} 
  _hover={{ bg: isSelected ? "blue.100" : "gray.50" }}
>
  <Td>
    <Checkbox isChecked={isSelected} onChange={() => onSelect(row.id)} />
  </Td>
  <Td>
    <Badge variant="outline">{row.id}</Badge>
  </Td>
  
  {/* 动态生成字段单元格 */}
  {tableFields.map(field => (
    <Td key={field}>
      <EditableCell
        value={row[field]}
        onSave={(newValue) => handleUpdateCell(row.id, field, newValue)}
        isTitle={field === '标题'}
      />
    </Td>
  ))}
  
  <Td>
    <HStack spacing={1}>
      <IconButton 
        icon={<RiEditLine />} 
        size="sm" 
        variant="ghost"
        onClick={() => onEdit(row)}
      />
      <IconButton 
        icon={<RiDeleteBinLine />} 
        size="sm" 
        variant="ghost" 
        colorScheme="red"
        onClick={() => onDelete(row.id)}
      />
      <IconButton 
        icon={<RiFileCopyLine />} 
        size="sm" 
        variant="ghost"
        onClick={() => handleDuplicateRow(row)}
      />
    </HStack>
  </Td>
</Tr>
```

#### 4. 可编辑单元格 (`EditableCell`)
```tsx
<Box position="relative" w="full">
  {isEditing ? (
    <HStack spacing={2}>
      {isTitle ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          size="sm"
          autoFocus
        />
      ) : (
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          size="sm"
          rows={2}
          resize="none"
          autoFocus
        />
      )}
      <IconButton icon={<RiCheckLine />} size="xs" onClick={handleSave} />
      <IconButton icon={<RiCloseLine />} size="xs" onClick={handleCancel} />
    </HStack>
  ) : (
    <Box
      onClick={handleEdit}
      cursor="pointer"
      p={2}
      borderRadius="md"
      _hover={{ bg: "gray.100" }}
      minH="40px"
    >
      <Text noOfLines={2} fontSize="sm">
        {value || '点击编辑...'}
      </Text>
    </Box>
  )}
</Box>
```

#### 5. 字段管理器模态框 (`FieldManagerModal`)
```tsx
<Modal isOpen={isOpen} onClose={onClose} size="xl">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>字段结构管理</ModalHeader>
    <ModalBody>
      <Alert status="warning" mb={4}>
        <AlertIcon />
        字段操作将影响该表的所有数据行，请谨慎操作
      </Alert>
      
      <VStack spacing={4} align="stretch">
        {/* 必填字段 */}
        <Box>
          <Text fontWeight="semibold" mb={2}>必填字段</Text>
          <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
            <HStack>
              <Icon as={RiLockLine} color="gray.500" />
              <Text>标题</Text>
              <Badge colorScheme="red" size="sm">必填</Badge>
            </HStack>
            <Text fontSize="sm" color="gray.500">不可删除</Text>
          </HStack>
        </Box>
        
        {/* 可编辑字段 */}
        <Box>
          <Text fontWeight="semibold" mb={2}>自定义字段</Text>
          <VStack spacing={2}>
            {editableFields.map((field, index) => (
              <HStack key={field} justify="space-between" p={3} border="1px" borderColor="gray.200" borderRadius="md">
                <HStack>
                  <Icon as={RiDragMove2Line} color="gray.400" />
                  <Input 
                    value={field} 
                    onChange={(e) => handleRenameField(index, e.target.value)}
                    size="sm"
                    variant="flushed"
                  />
                </HStack>
                <HStack>
                  <IconButton 
                    icon={<RiDeleteBinLine />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteField(field)}
                  />
                </HStack>
              </HStack>
            ))}
          </VStack>
        </Box>
        
        {/* 添加新字段 */}
        <Box>
          <HStack spacing={3}>
            <Input 
              placeholder="输入新字段名称"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
            />
            <Button 
              leftIcon={<RiAddLine />}
              onClick={handleAddField}
              disabled={!newFieldName.trim()}
            >
              添加字段
            </Button>
          </HStack>
        </Box>
      </VStack>
    </ModalBody>
    
    <ModalFooter>
      <Button variant="ghost" mr={3} onClick={onClose}>取消</Button>
      <Button colorScheme="blue" onClick={handleSaveFields}>保存更改</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

#### 6. 批量操作栏 (`BatchOperationBar`)
```tsx
<Fade in={selectedRows.length > 0}>
  <Box
    position="sticky"
    bottom={0}
    bg="blue.50"
    border="1px"
    borderColor="blue.200"
    borderRadius="md"
    p={4}
    mx={4}
    mb={4}
  >
    <HStack justify="space-between">
      <HStack spacing={4}>
        <Text fontWeight="semibold">
          已选择 {selectedRows.length} 行
        </Text>
        <Button size="sm" variant="outline" onClick={handleClearSelection}>
          取消选择
        </Button>
      </HStack>
      
      <HStack spacing={2}>
        <Button 
          size="sm" 
          leftIcon={<RiEditLine />}
          onClick={handleBatchEdit}
        >
          批量编辑
        </Button>
        <Button 
          size="sm" 
          leftIcon={<RiDownloadLine />}
          onClick={handleExportSelected}
        >
          导出选中
        </Button>
        <Button 
          size="sm" 
          leftIcon={<RiDeleteBinLine />}
          colorScheme="red"
          onClick={handleBatchDelete}
        >
          批量删除
        </Button>
      </HStack>
    </HStack>
  </Box>
</Fade>
```

### 交互流程设计

#### 字段管理流程
1. 点击"字段管理"按钮 → 打开字段管理器模态框
2. 添加字段：输入字段名 → 点击添加 → 所有行自动添加该字段（默认空值）
3. 删除字段：点击字段删除按钮 → 二次确认 → 所有行删除该字段
4. 重命名字段：直接编辑字段名 → 所有行的字段名同步更新

#### 行数据编辑流程
1. **行内编辑**：双击单元格 → 进入编辑模式 → 输入数据 → 回车或点击保存
2. **添加新行**：点击"添加新行" → 自动创建空行（ID自增） → 填写数据
3. **删除行**：点击行操作删除按钮 → 确认删除 → 从数据中移除该行

#### 批量操作流程
1. **选择行**：点击行复选框选择多行
2. **批量编辑**：选中行 → 点击批量编辑 → 统一修改某字段值
3. **批量删除**：选中行 → 点击批量删除 → 确认后删除所有选中行

### 响应式设计
- **桌面端**: 完整表格展示，支持水平滚动
- **平板端**: 隐藏部分非关键列，保留核心字段
- **移动端**: 切换为卡片堆叠模式，每行数据显示为一张卡片

## API接口变更

### 新增字段操作接口
```typescript
PUT /api/custom-fields/{id}/fields
{
  action: 'add' | 'remove' | 'rename',
  fieldName: string,
  newFieldName?: string
}
```

### 新增行操作接口  
```typescript
POST /api/custom-fields/{id}/rows
{ data: Record<string, any> }

PUT /api/custom-fields/{id}/rows/{rowId}
{ updates: Record<string, any> }

DELETE /api/custom-fields/{id}/rows/{rowId}
```

## 核心处理逻辑

### 字段操作
```typescript
// 添加字段：所有行同步添加
const addFieldToTable = (extendedField: any[], newFieldName: string) => {
  return extendedField.map(row => ({ ...row, [newFieldName]: '' }))
}

// 删除字段：所有行同步删除
const removeFieldFromTable = (extendedField: any[], fieldName: string) => {
  return extendedField.map(row => {
    const { [fieldName]: removed, ...rest } = row
    return rest
  })
}
```

### 行操作
```typescript
// 添加行：自动分配ID
const addRowToTable = (extendedField: any[], newRowData: Record<string, any>) => {
  const maxId = Math.max(0, ...extendedField.map(row => row.id || 0))
  return [...extendedField, { id: maxId + 1, ...newRowData }]
}

// 更新行：按ID更新
const updateRowInTable = (extendedField: any[], rowId: number, updates: Record<string, any>) => {
  return extendedField.map(row => 
    row.id === rowId ? { ...row, ...updates } : row
  )
}
```

## 数据迁移处理

### 现有数据兼容
现有单条记录数据需要转换为数组格式：
```typescript
// 旧格式
{ key: 'title', label: '标题', value: '内容', required: true }

// 新格式  
[{ id: 1, 标题: '内容', 正文: '' }]
```

### 迁移逻辑
```typescript
const migrateOldData = (oldExtendedField: CustomField[]) => {
  const newData = { id: 1 }
  oldExtendedField.forEach(field => {
    newData[field.label] = field.value
  })
  return [newData]
}
```

## 实现要点

1. **表头生成**: 基于 `extendedField[0]` 的keys生成表头
2. **字段操作**: 影响数组中所有对象
3. **行操作**: 只影响数组中指定ID的对象
4. **ID管理**: 自动递增，确保唯一性
5. **必填字段**: `标题` 字段不可删除
