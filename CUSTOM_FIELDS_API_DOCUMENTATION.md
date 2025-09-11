# 自定义字段管理系统 API 文档

## 功能概述

自定义字段管理系统是一个灵活的数据表格管理平台，支持动态创建和管理表格、字段和数据行。系统采用三层架构设计：
- **表格级别**：管理整个数据表格的基本信息
- **字段级别**：管理表格的列结构（字段定义）
- **行级别**：管理表格的数据行内容

## 数据结构

### 表格记录结构 (CustomFieldRecord)
```typescript
interface CustomFieldRecord {
  id: string              // 表格唯一标识符 (UUID)
  userId: string          // 所属用户ID (UUID)
  createdUserId: string   // 创建者用户ID (UUID)
  createdUserName: string // 创建者用户名
  appCode: string         // 应用代码
  type: string           // 表格类型：'洞察'|'钩子'|'情绪'
  tableName: string      // 表格名称
  extendedField: TableRow[] // 表格数据行
  tableFields: string[]   // 字段名列表
  amount: number         // 金额（元）
  postIds: string[]      // 关联的帖子ID
  visibility: boolean    // 可见性
  isPublic: boolean      // 是否公开
  exampleData?: string   // 示例数据
  readme: string         // 描述信息
  isDeleted: boolean     // 是否已删除（软删除）
  createdAt: string      // 创建时间
  updatedAt: string      // 更新时间
}
```

### 表格行结构 (TableRow)
```typescript
interface TableRow {
  id: number             // 行ID
  [fieldName: string]: any // 动态字段值
}
```

---

## API 接口详情

### 基础配置
- **Base URL**: `/api/custom-fields`
- **认证方式**: 用户ID参数传递
- **数据格式**: JSON

### 用户身份识别

所有API接口通过请求参数或请求体中的用户信息进行身份识别：

| 参数 | 类型 | 传递方式 | 必填 | 说明 |
|------|------|----------|------|------|
| `userId` | string (UUID) | 查询参数/请求体 | ✅ | 用户唯一标识符 |
| `id` | string (UUID) | 查询参数/请求体 | 视情况 | 表格唯一标识符 |
| `createdUserId` | string (UUID) | 请求体 | 创建时必填 | 创建者用户ID |

#### 权限控制
- **数据隔离**: 基于userId进行数据隔离，用户只能访问自己的数据
- **访问权限**: 创建者对表格拥有完全权限，其他用户根据可见性设置访问
- **前端验证**: 前端负责用户身份验证，后端基于传入的userId进行数据筛选

---

## 1. 表格管理接口

### 1.1 获取表格列表
**GET** `/api/custom-fields`

获取分页的表格列表，支持多种筛选和搜索条件。

#### 查询参数
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `userId` | string | ✅ | - | 用户ID (UUID)，用于数据隔离 |
| `action` | string | 否 | `list` | 操作类型，可选值：`list`、`stats` |
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 10 | 每页数量 |
| `search` | string | 否 | - | 搜索关键词（搜索标题和描述） |
| `userSearch` | string | 否 | - | 用户搜索（用户名或UUID） |
| `type` | string | 否 | `all` | 表格类型筛选：`all`、`洞察`、`钩子`、`情绪` |
| `appCode` | string | 否 | - | 应用代码筛选 |
| `amountMin` | number | 否 | - | 最小金额（元） |
| `amountMax` | number | 否 | - | 最大金额（元） |
| `dateFrom` | string | 否 | - | 开始日期（ISO格式） |
| `dateTo` | string | 否 | - | 结束日期（ISO格式） |
| `visibility` | boolean | 否 | - | 可见性筛选 |
| `isPublic` | boolean | 否 | - | 公开性筛选 |
| `sortBy` | string | 否 | `created_at` | 排序字段 |
| `sortOrder` | string | 否 | `desc` | 排序方向：`asc`、`desc` |

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1234",
      "tableName": "用户反馈表",
      "type": "洞察",
      "tableFields": ["标题", "正文", "分类"],
      "extendedField": [
        {"id": 1, "标题": "功能建议", "正文": "希望增加导出功能", "分类": "功能"}
      ],
      "createdUserName": "管理员",
      "createdAt": "2023-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 1.2 获取统计信息
**GET** `/api/custom-fields?action=stats&userId={userId}`

获取指定用户的各类型表格统计数量。

#### 查询参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，用于数据隔离 |
| `action` | string | ✅ | 固定值：`stats` |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "洞察": 15,
    "钩子": 8,
    "情绪": 12,
    "总计": 35
  }
}
```

### 1.3 获取单个表格详情
**GET** `/api/custom-fields?id={tableId}&userId={userId}`

根据表格ID获取详细信息。

#### 查询参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 表格唯一标识符 (UUID) |
| `userId` | string | ✅ | 用户ID (UUID)，用于权限验证 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "tableName": "用户反馈表",
    "type": "洞察",
    "appCode": "loomi",
    "tableFields": ["标题", "正文", "分类", "状态"],
    "extendedField": [
      {"id": 1, "标题": "功能建议", "正文": "希望增加导出功能", "分类": "功能", "状态": "待处理"},
      {"id": 2, "标题": "界面优化", "正文": "按钮太小", "分类": "UI", "状态": "已完成"}
    ],
    "amount": 0,
    "readme": "收集用户反馈信息",
    "visibility": true,
    "isPublic": false,
    "createdAt": "2023-12-01T10:00:00Z"
  }
}
```

### 1.4 创建新表格
**POST** `/api/custom-fields`

创建一个新的数据表格。

#### 请求体
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "createdUserId": "123e4567-e89b-12d3-a456-426614174000",
  "appCode": "loomi",
  "type": "洞察",
  "tableName": "新建表格",
  "extendedField": [
    {"key": "title", "label": "标题", "value": "", "required": true}
  ],
  "amount": 0,
  "readme": "表格描述信息",
  "exampleData": "示例数据说明",
  "visibility": true,
  "isPublic": false
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，表格所属用户 |
| `createdUserId` | string | ✅ | 创建者用户ID (UUID) |
| `appCode` | string | 是 | 应用代码 |
| `type` | string | 是 | 表格类型：`洞察`、`钩子`、`情绪` |
| `tableName` | string | 是 | 表格名称（至少2个字符） |
| `extendedField` | array | 是 | 初始字段定义 |
| `amount` | number | 否 | 金额（元），默认0 |
| `readme` | string | 是 | 表格描述 |
| `exampleData` | string | 否 | 示例数据 |
| `visibility` | boolean | 否 | 可见性，默认true |
| `isPublic` | boolean | 否 | 是否公开，默认false |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid-5678",
    "tableName": "新建表格",
    "type": "洞察",
    "tableFields": ["标题"],
    "extendedField": [{"id": 1, "标题": ""}]
  },
  "message": "创建成功"
}
```

### 1.5 更新表格
**PUT** `/api/custom-fields`

更新现有表格的基本信息。

#### 请求体（userId和id为必填，其他字段可选）
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "id": "456e7890-e12b-34c5-d678-567890123456",
  "appCode": "loomi",
  "extendedField": [...],
  "amount": 100,
  "readme": "更新后的描述",
  "exampleData": "更新的示例",
  "visibility": false,
  "isPublic": true
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，用于权限验证 |
| `id` | string | ✅ | 表格唯一标识符 (UUID) |
| 其他字段 | - | 否 | 要更新的字段，参考创建接口 |

#### 响应示例
```json
{
  "success": true,
  "data": { /* 更新后的表格信息 */ },
  "message": "更新成功"
}
```

### 1.6 删除表格
**DELETE** `/api/custom-fields`

软删除表格（标记为已删除，不会物理删除）。

#### 请求体
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "id": "456e7890-e12b-34c5-d678-567890123456"
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，用于权限验证 |
| `id` | string | ✅ | 表格唯一标识符 (UUID) |

#### 响应示例
```json
{
  "success": true,
  "data": { /* 删除后的表格信息 */ },
  "message": "删除成功"
}
```

---

## 2. 字段管理接口

### 2.1 字段操作
**PUT** `/api/custom-fields/fields`

对表格字段进行添加、删除或重命名操作。

#### 请求体
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "id": "456e7890-e12b-34c5-d678-567890123456",
  "action": "add",
  "fieldName": "新字段名",
  "newFieldName": "重命名后的字段名"
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，用于权限验证 |
| `id` | string | ✅ | 表格唯一标识符 (UUID) |
| `action` | string | ✅ | 操作类型：`add`（添加）、`remove`（删除）、`rename`（重命名） |
| `fieldName` | string | ✅ | 目标字段名 |
| `newFieldName` | string | 条件 | 重命名操作时的新字段名（仅rename操作需要） |

#### 操作说明
- **添加字段**: 在表格末尾添加新字段，所有现有行的该字段值初始化为空字符串
- **删除字段**: 从所有行中移除指定字段（标题字段受保护，不可删除）
- **重命名字段**: 修改字段名（标题字段受保护，不可重命名）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "tableFields": ["标题", "正文", "新字段名"],
    "extendedField": [
      {"id": 1, "标题": "测试", "正文": "内容", "新字段名": ""},
      {"id": 2, "标题": "示例", "正文": "文本", "新字段名": ""}
    ]
  },
  "message": "字段添加成功"
}
```

---

## 3. 行数据管理接口

### 3.1 添加数据行
**POST** `/api/custom-fields/rows`

向指定表格添加新的数据行。

#### 请求体
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "id": "456e7890-e12b-34c5-d678-567890123456",
  "rowData": {
    "标题": "新行标题",
    "正文": "新行内容",
    "分类": "示例"
  }
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，用于权限验证 |
| `id` | string | ✅ | 表格唯一标识符 (UUID) |
| `rowData` | object | 否 | 行数据，键为字段名，值为字段值 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "extendedField": [
      {"id": 1, "标题": "现有行", "正文": "现有内容"},
      {"id": 2, "标题": "新行标题", "正文": "新行内容", "分类": "示例"}
    ]
  },
  "message": "添加行成功"
}
```

### 3.2 更新数据行
**PUT** `/api/custom-fields/rows`

更新指定行的数据。

#### 请求体
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "id": "456e7890-e12b-34c5-d678-567890123456",
  "rowId": 1,
  "action": "update",
  "rowData": {
    "标题": "更新后的标题",
    "正文": "更新后的内容"
  }
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，用于权限验证 |
| `id` | string | ✅ | 表格唯一标识符 (UUID) |
| `rowId` | number | ✅ | 行ID |
| `action` | string | 否 | 操作类型：`update`（更新）、`duplicate`（复制），默认`update` |
| `rowData` | object | 否 | 要更新的字段数据 |

#### 响应示例
```json
{
  "success": true,
  "data": { /* 更新后的表格数据 */ },
  "message": "更新成功"
}
```

### 3.3 复制数据行
**PUT** `/api/custom-fields/rows`

复制指定行，创建一个新行。

#### 请求体
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "id": "456e7890-e12b-34c5-d678-567890123456",
  "rowId": 1,
  "action": "duplicate"
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，用于权限验证 |
| `id` | string | ✅ | 表格唯一标识符 (UUID) |
| `rowId` | number | ✅ | 要复制的行ID |
| `action` | string | ✅ | 固定值：`duplicate` |

#### 响应示例
```json
{
  "success": true,
  "data": { /* 包含新复制行的表格数据 */ },
  "message": "复制成功"
}
```

### 3.4 删除数据行
**DELETE** `/api/custom-fields/rows`

删除指定的数据行。

#### 请求体
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "id": "456e7890-e12b-34c5-d678-567890123456",
  "rowId": 1
}
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID (UUID)，用于权限验证 |
| `id` | string | ✅ | 表格唯一标识符 (UUID) |
| `rowId` | number | ✅ | 要删除的行ID |

#### 响应示例
```json
{
  "success": true,
  "data": { /* 删除行后的表格数据 */ },
  "message": "删除行成功"
}
```

---

## 错误处理

### 标准错误响应格式
```json
{
  "success": false,
  "error": "错误描述信息"
}
```

### 常见错误代码
| HTTP状态码 | 说明 | 示例场景 |
|------------|------|----------|
| 400 | 请求参数错误 | 缺少必填字段、参数格式错误 |
| 401 | 未授权访问 | 缺少认证Token或Token无效 |
| 404 | 资源不存在 | 表格ID不存在、行ID不存在 |
| 500 | 服务器内部错误 | 数据库连接错误、系统异常 |

### 错误示例
```json
{
  "success": false,
  "error": "缺少必填字段"
}
```

---

## 使用示例

### 创建一个完整的工作流程

#### 1. 创建表格
```javascript
const userId = "123e4567-e89b-12d3-a456-426614174000";
const createdUserId = "123e4567-e89b-12d3-a456-426614174000";

const response = await fetch('/api/custom-fields', {
  method: 'POST',
  body: JSON.stringify({
    userId: userId,
    createdUserId: createdUserId,
    appCode: 'loomi',
    type: '洞察',
    tableName: '客户反馈收集表',
    extendedField: [
      {key: 'title', label: '标题', value: '', required: true}
    ],
    readme: '用于收集客户反馈意见',
    visibility: true,
    isPublic: false
  })
});

const createResult = await response.json();
const tableId = createResult.data.id; // 获取创建的表格ID
```

#### 2. 添加字段
```javascript
const addFieldResponse = await fetch('/api/custom-fields/fields', {
  method: 'PUT',
  body: JSON.stringify({
    userId: userId,
    id: tableId,
    action: 'add',
    fieldName: '优先级'
  })
});
```

#### 3. 添加数据行
```javascript
const addRowResponse = await fetch('/api/custom-fields/rows', {
  method: 'POST',
  body: JSON.stringify({
    userId: userId,
    id: tableId,
    rowData: {
      '标题': '界面优化建议',
      '优先级': '高'
    }
  })
});
```


---

## 注意事项

### 🔐 用户身份和权限
1. **用户标识**: 所有接口都需要在请求参数或请求体中传递有效的userId
2. **UUID格式**: userId和id必须使用标准UUID格式
3. **数据隔离**: 基于userId进行数据隔离，用户只能访问自己的数据
4. **权限控制**: 创建者对表格拥有完全权限，其他用户根据可见性设置访问
5. **前端验证**: 前端负责用户身份验证，确保传递正确的用户ID

### 💾 数据处理
6. **软删除**: 表格删除采用软删除机制，数据不会被物理删除
7. **字段保护**: "标题"字段受到特殊保护，不能被删除或重命名
8. **数据格式**: 扩展字段支持新旧两种格式的自动转换
9. **金额单位**: 前端传递的金额单位为元，后端存储时自动转换为分

### 🚀 性能优化  
10. **分页限制**: 列表查询支持分页，建议合理设置分页大小以提高性能

### 🎯 当前系统特点
11. **用户驱动**: 基于用户ID进行数据隔离和权限控制
12. **前端集成**: 设计为前端友好的API，支持直接传递用户参数
13. **数据安全**: 通过请求参数验证确保用户只能访问自己的数据

### 🛠️ 开发建议
14. **错误处理**: 请求失败时检查HTTP状态码和响应中的error字段
15. **参数验证**: 确保所有UUID格式的参数符合标准格式
16. **数据校验**: 前端应对用户输入进行基础校验，后端会进行完整的数据验证

---

## 📋 快速参考

### 标准请求参数模板
```javascript
// 用户身份参数（根据接口类型选择传递方式）
const userParams = {
  userId: "123e4567-e89b-12d3-a456-426614174000",  // 必须：用户ID
  id: "456e7890-e12b-34c5-d678-567890123456",      // 视情况：表格ID
  createdUserId: "123e4567-e89b-12d3-a456-426614174000"  // 创建时：创建者ID
}

// GET请求 - 通过查询参数传递
const queryParams = new URLSearchParams(userParams).toString();
const response = await fetch(`/api/custom-fields?${queryParams}`);

// POST/PUT/DELETE请求 - 通过请求体传递
const response = await fetch('/api/custom-fields', {
  method: 'POST',
  body: JSON.stringify({
    ...userParams,
    // 其他业务参数
  })
});
```

### UUID生成示例
```javascript
// 生成标准UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const userId = generateUUID(); // "123e4567-e89b-12d3-a456-426614174000"
```
