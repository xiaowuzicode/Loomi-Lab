# 📋 自定义字段管理

## 📖 产品概述

### 功能概述
自定义字段管理系统，支持三种业务类型（洞察、钩子、情绪）的数据创建、编辑、删除和查询，包含动态字段管理、权限控制、软删除等功能。

---

## 🎯 功能需求

### 1. 页面布局设计

#### 1.1 整体布局
```
┌─────────────────────────────────────────────────────────────┐
│                    顶部导航栏                                │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   左侧导航   │                主内容区域                   │
│   (文件夹)   │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

#### 1.2 左侧导航结构
```
📁 自定义数据管理
  ├── 🧠 洞察 (12)
  ├── 🪝 钩子 (8)
  └── 💫 情绪 (15)
```

- **展示方式**: 文件夹图标 + 类型名称 + 数据条数
- **交互效果**: 悬停高亮，选中状态明显标识
- **默认状态**: 选中"洞察"文件夹

### 2. 主内容区域功能

#### 2.1 顶部操作栏
```
┌─────────────────────────────────────────────────────────────┐
│  📋 洞察数据管理                                    ➕ 新建  │
├─────────────────────────────────────────────────────────────┤
│  🔍 [搜索框]  📅 [时间筛选]  💰 [金额筛选]  🔄 刷新        │
└─────────────────────────────────────────────────────────────┘
```

**功能说明**:
- **页面标题**: 动态显示当前选中的类型
- **新建按钮**: 主要操作按钮，醒目样式
- **搜索功能**: 支持标题和内容模糊搜索
- **筛选功能**: 时间范围、金额范围筛选
- **刷新按钮**: 手动刷新数据

#### 2.2 数据列表展示

**卡片式布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  📄 探索Supabase的强大功能              💰 ¥199.99  ⚙️ 操作 │
├─────────────────────────────────────────────────────────────┤
│  📝 Supabase是一个优秀的开源Firebase替代品...             │
│  👤 创建者: 张三  |  📱 APP: MARKETING_APP_01  |  🕒 2025-09-09 │
└─────────────────────────────────────────────────────────────┘
```

**字段显示优先级**:
1. **主要信息**: 从 extended_field 中提取 title (标题，必填)、金额、操作按钮
2. **次要信息**: 从 readme 字段获取正文内容 (截取前50字预览)
3. **元数据**: created_user_id (创建者)、app_code、created_at、visibility/is_public状态
4. **扩展信息**: extended_field 中的其他自定义字段 (全部为text类型)

**交互功能**:
- **点击卡片**: 进入详情页
- **悬停效果**: 卡片轻微上浮 + 阴影加深
- **操作按钮**: 编辑、复制、删除

#### 2.3 分页组件
- **位置**: 列表底部
- **样式**: 与项目整体风格一致
- **功能**: 页码切换、每页条数设置(10/20/50)

### 3. 新建/编辑功能

#### 3.1 弹窗设计
- **类型**: Modal 弹窗
- **尺寸**: 中等大小 (600px 宽度)
- **样式**: 玻璃形态效果，与项目风格一致

#### 3.2 表单结构

```
┌─────────────────────────────────────────────────────────────┐
│                      新建洞察数据                           │
├─────────────────────────────────────────────────────────────┤
│  基础信息                                                   │
│  ├── 应用代码: [MARKETING_APP_01] (可选择)                │
│  ├── 金额: [¥   ] (支持小数，自动转换)                    │
│  ├── 📖 说明文档 (必填)                                   │
│  │   [多行文本框]                                         │
│  ├── 💡 示例数据 (可选)                                   │
│  │   [文本框]                                             │
│  └── ⚙️ 权限设置                                          │
│      ├── 👁️ 可见性: [开关] (默认开启)                   │
│      └── 🌐 公开性: [开关] (默认关闭)                   │
│                                                           │
│  扩展字段                                                   │
│  ├── 📝 标题 (必填)                                       │
│  │   [输入框]                                             │
│  ├── 📄 正文 (可选，可删除)                               │
│  │   [文本域] [🗑️删除]                                    │
│  └── ➕ 添加自定义字段 (文本类型)                          │
│                                                           │
│  [取消]                                    [保存] [保存并新建] │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3 扩展字段管理

**预设字段**:
- **标题**: 必填字段，不可删除
- **正文**: 可选字段，可以删除

**自定义字段特性**:
- **字段类型**: 目前统一为文本类型 (后续可扩展)
- **字段名称**: 用户自定义 (key 和 label)
- **字段值**: 文本输入框
- **必填设置**: 默认为可选

**字段操作**:
- **添加字段**: 点击"添加自定义字段"按钮
- **删除字段**: 字段右侧删除按钮 (标题不可删除)
- **排序字段**: 拖拽排序功能 (v1.0暂不实现)
- **字段验证**: 基础文本验证

#### 3.4 表单验证规则

**必填字段验证**:
- 应用代码: 必填，格式验证
- 说明文档 (readme): 必填，最少10字符
- 标题 (extended_field): 必填，最少2字符

**可选字段验证**:
- 金额: 非负数，最多2位小数
- 示例数据: 最大500字符
- 正文 (extended_field): 可选，最大1000字符
- 自定义字段: 文本验证，最大255字符

**高级验证**:
- 扩展字段名唯一性检查 (key不能重复)
- 特殊字符过滤 (防止XSS)
- 权限设置逻辑验证

---

## 🎨 用户界面设计

### 设计要求
- **风格一致**: 遵循 Loomi-Lab 现有设计系统
- **图标标识**: 洞察(🧠)、钩子(🪝)、情绪(💫)  
- **响应式**: 适配桌面和移动端
- **交互流畅**: 卡片悬停效果、按钮反馈

---

## 💾 数据库设计

### 1. 数据库表结构

#### 1.1 book_user_custom_fields 表定义

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 记录的唯一ID | PRIMARY KEY, 自动生成 |
| user_id | UUID | 数据所属的用户ID | NOT NULL, 外键 |
| created_user_id | UUID | 创建这条记录的用户ID | NOT NULL, 外键 |
| app_code | TEXT | 所属应用的代码，如 'MARKETING_APP_01' | NOT NULL |
| type | ENUM | 业务类型：'洞察', '钩子', '情绪' | NOT NULL |
| extended_field | JSONB | 自定义字段数组 | NOT NULL, 默认 '[]' |
| amount | BIGINT | 金额，以分为单位存储 | NOT NULL, 默认 0 |
| post_ids | UUID[] | 关联的文章ID列表 | 默认 '{}' |
| visibility | BOOLEAN | 可见性，true 为可见 | NOT NULL, 默认 true |
| is_public | BOOLEAN | 是否公开，true 为公开 | NOT NULL, 默认 false |
| example_data | TEXT | 示例数据（可选） | 可为空 |
| readme | TEXT | 说明文档（必填） | NOT NULL |
| is_deleted | BOOLEAN | 软删除标记，true 为已删除 | NOT NULL, 默认 false |
| created_at | TIMESTAMPTZ | 创建时间 | NOT NULL, 默认 NOW() |
| updated_at | TIMESTAMPTZ | 最后更新时间 | NOT NULL, 默认 NOW() |

#### 1.2 字段说明
- **id**: 使用UUID作为主键，自动生成
- **user_id**: 关联用户表，数据权限控制基础
- **created_user_id**: 记录创建者，用于权限验证
- **app_code**: 应用标识，支持多应用数据隔离
- **type**: 业务类型枚举，支持三种类型
- **extended_field**: JSONB格式存储自定义字段，默认包含title(必填)和content(选填)
- **amount**: 金额以分为单位存储，避免浮点精度问题
- **post_ids**: 关联文章ID数组，为后续功能预留
- **visibility**: 可见性控制，false时对其他用户不可见
- **is_public**: 公开性控制，true时所有用户可查看
- **example_data**: 可选的示例数据说明，帮助用户理解
- **readme**: 必填的说明文档，显示为正文内容
- **is_deleted**: 软删除标记，支持数据恢复

#### 1.3 现有数据库表说明

> **📝 注意**: `book_user_custom_fields` 表已在数据库中存在，无需创建。

**表结构验证SQL** (可用于确认表结构):
```sql
-- 查看表结构
\d book_user_custom_fields;

-- 查看表索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'book_user_custom_fields';

-- 查看表约束
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'book_user_custom_fields'::regclass;
```

**推荐的额外索引** (如果尚未创建):
```sql
-- 如果这些索引不存在，可以添加以提升查询性能
CREATE INDEX IF NOT EXISTS idx_custom_fields_user_type 
    ON book_user_custom_fields (user_id, type, is_deleted);
CREATE INDEX IF NOT EXISTS idx_custom_fields_app_code 
    ON book_user_custom_fields (app_code, is_deleted);
CREATE INDEX IF NOT EXISTS idx_custom_fields_created_at 
    ON book_user_custom_fields (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_fields_visibility 
    ON book_user_custom_fields (visibility, is_public, is_deleted);

-- JSONB字段索引 (根据查询需求可选添加)
CREATE INDEX IF NOT EXISTS idx_custom_fields_extended_title 
    ON book_user_custom_fields USING GIN ((extended_field -> 'title'));
```

#### 1.4 软删除策略
- **删除操作**: 只设置 `is_deleted = true`，不物理删除数据
- **查询策略**: 所有查询都要添加 `WHERE is_deleted = false` 条件
- **恢复机制**: 管理员可以将 `is_deleted` 设为 `false` 来恢复数据
- **清理策略**: 定期清理超过90天的软删除数据（可选）

### 2. 数据模型

#### 2.1 前端数据结构
```typescript
interface CustomFieldRecord {
  id: string
  userId: string
  createdUserId: string
  appCode: string
  type: '洞察' | '钩子' | '情绪'
  extendedField: CustomField[]
  amount: number // 前端显示的实际金额 (元)
  postIds: string[]
  visibility: boolean
  isPublic: boolean
  exampleData?: string
  readme: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

interface CustomField {
  key: string
  label: string
  value: string // 目前统一为字符串类型
  type?: 'text' // 目前只支持文本类型
  required?: boolean
}
```

#### 2.2 表单数据结构
```typescript
interface CustomFieldForm {
  appCode: string
  amount: number
  readme: string
  exampleData?: string
  visibility: boolean
  isPublic: boolean
  extendedField: CustomField[]
}

interface CustomFieldInput {
  key: string
  label: string
  value: string
  removable: boolean // 是否可删除 (标题不可删除)
}
```

### 2. 数据验证

#### 2.1 前端验证
- **实时验证**: 用户输入时即时反馈
- **提交验证**: 表单提交前完整检查
- **格式验证**: 特殊字段格式要求

#### 2.2 后端验证
- **数据类型验证**: 严格的类型检查
- **业务规则验证**: 自定义业务逻辑
- **安全验证**: SQL注入、XSS防护

### 3. 金额处理逻辑

#### 3.1 前端处理
```
用户输入: 199.99 (元)
↓ 
显示: ¥199.99
↓
提交前处理: 199.99 * 100 = 19999 (分)
```

#### 3.2 后端处理  
```
接收: 19999 (分)
↓
存储: amount = 19999
↓
返回: amount / 100 = 199.99 (元)
```

---

## 🔌 API 设计

### 1. API 路由规划

#### 1.1 RESTful API 设计
```
GET    /api/custom-fields                    # 获取列表 (自动过滤 is_deleted=false)
POST   /api/custom-fields                    # 创建记录  
GET    /api/custom-fields/[id]              # 获取详情 (验证 is_deleted=false)
PUT    /api/custom-fields/[id]              # 更新记录 (验证 is_deleted=false)
DELETE /api/custom-fields/[id]              # 软删除记录 (设置 is_deleted=true)
GET    /api/custom-fields/stats             # 获取统计 (只统计未删除数据)
```

#### 1.2 查询过滤规则
**所有查询操作都必须包含软删除过滤条件**:
```sql
WHERE is_deleted = false
```

**示例SQL查询**:
```sql
-- 获取列表
SELECT * FROM book_user_custom_fields 
WHERE user_id = $1 AND type = $2 AND is_deleted = false
ORDER BY created_at DESC;

-- 获取详情  
SELECT * FROM book_user_custom_fields 
WHERE id = $1 AND is_deleted = false;

-- 软删除
UPDATE book_user_custom_fields 
SET is_deleted = true, updated_at = NOW() 
WHERE id = $1 AND is_deleted = false;
```

#### 1.3 查询参数设计
```typescript
interface ListQueryParams {
  type?: '洞察' | '钩子' | '情绪'
  page?: number
  limit?: number
  search?: string // 搜索title和readme字段
  appCode?: string
  amountMin?: number
  amountMax?: number
  dateFrom?: string
  dateTo?: string
  visibility?: boolean
  isPublic?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

### 2. API 请求/响应格式

#### 2.1 获取列表 API
**请求**:
```
GET /api/custom-fields?type=洞察&page=1&limit=10&search=Supabase
```

**响应**:
```json
{
  "success": true,
  "data": {
    "records": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    },
    "stats": {
      "totalAmount": 1999900,
      "avgAmount": 79996
    }
  }
}
```

#### 2.2 创建记录 API
**请求**:
```json
{
  "appCode": "MARKETING_APP_01",
  "type": "洞察",
  "amount": 19999,
  "readme": "这是一个必填的说明文档，用于解释此项数据。",
  "exampleData": "这是一个可选的示例数据说明。",
  "visibility": true,
  "isPublic": false,
  "extendedField": [
    {
      "key": "title",
      "label": "标题", 
      "value": "探索Supabase的强大功能"
    },
    {
      "key": "content",
      "label": "正文",
      "value": "详细的内容描述..."
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
    "message": "创建成功"
  }
}
```

### 3. 错误处理

#### 3.1 错误响应格式
```json
{
  "success": false,
  "error": "参数验证失败",
  "details": {
    "field": "amount",
    "message": "金额不能为负数"
  },
  "code": "VALIDATION_ERROR"
}
```

#### 3.2 错误代码定义
- `VALIDATION_ERROR`: 参数验证失败
- `NOT_FOUND`: 记录不存在
- `DUPLICATE_FIELD`: 字段重复
- `PERMISSION_DENIED`: 权限不足
- `SERVER_ERROR`: 服务器内部错误

---

## 📱 功能交互流程

### 1. 查看数据流程
```
用户进入页面 
→ 默认选中"洞察"文件夹
→ 加载洞察类型数据列表
→ 显示分页和统计信息
→ 用户可切换其他文件夹
→ 动态加载对应类型数据
```

### 2. 创建数据流程
```
点击"新建"按钮
→ 弹出创建表单Modal
→ 自动设置当前选中的类型
→ 用户填写基础信息和自定义字段
→ 实时表单验证
→ 提交数据 
→ 后端验证和保存
→ 返回结果
→ 更新列表数据
→ 关闭Modal
```

### 3. 编辑数据流程
```
点击记录卡片或编辑按钮
→ 获取记录详情数据
→ 弹出编辑表单Modal
→ 预填充现有数据
→ 用户修改字段值
→ 实时验证变更
→ 提交更新
→ 后端验证和保存
→ 返回更新结果
→ 刷新列表数据
```

### 4. 软删除数据流程
```
点击删除按钮
→ 显示确认对话框 ("此操作将标记数据为已删除")
→ 用户确认删除
→ 发送软删除请求 (PATCH /api/custom-fields/[id])
→ 后端执行: UPDATE ... SET is_deleted = true, updated_at = NOW()
→ 返回删除结果
→ 前端从列表中移除该记录 (视觉上删除)
→ 数据库中保留记录但标记为已删除
```

**删除确认对话框内容**:
```
⚠️ 确认删除数据
此操作将标记数据为已删除状态，管理员可以恢复。
数据标题: "探索Supabase的强大功能"
创建时间: 2025-09-09

[取消] [确认删除]
```

---

## 🔐 权限控制

### 1. 页面访问权限
- **admin**: 完整的增删查改权限
- **operator**: 查看和编辑权限，不能删除
- **viewer**: 仅查看权限

### 2. 数据权限控制
- **数据隔离**: 基于 visibility 和 is_public 字段控制访问权限
- **创建权限**: 记录创建者信息 (created_user_id)
- **操作权限**: 只有创建者和管理员可以修改/删除

### 3. 可见性权限规则
- **visibility = false**: 仅创建者和管理员可查看
- **visibility = true, is_public = false**: 同应用用户可查看
- **visibility = true, is_public = true**: 所有用户可查看
- **数据查询**: 自动根据用户权限过滤数据

### 4. 字段权限
- **敏感字段**: 金额字段需要特殊权限查看
- **系统字段**: id、创建时间等系统字段不可编辑
- **扩展字段**: 标题字段不可删除，其他字段可自由管理

---

## 🧪 核心测试要点

### 必测功能
- **CRUD操作**: 增删查改功能完整性
- **软删除**: is_deleted字段正确处理
- **权限控制**: visibility/is_public权限验证
- **字段验证**: 必填字段和格式验证
- **搜索筛选**: 多维度数据筛选
- **分页**: 大数据量分页加载

### 性能要求
- 数据加载响应时间 < 500ms
- 表单提交响应时间 < 1s
- 支持1000+记录流畅操作

---


## 📝 技术实现要点

### 1. 前端关键技术
- **动态表单**: React Hook Form + 自定义字段渲染
- **状态管理**: Zustand 管理页面状态
- **数据获取**: React Query 处理API请求
- **表单验证**: Yup schema 验证
- **UI组件**: Chakra UI + 自定义组件

### 2. 后端关键技术

#### 2.1 Supabase查询架构
参考项目现有的用户管理实现模式，采用**双客户端架构**：

```typescript
// 客户端实例 (权限受限)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端实例 (完整权限)
export const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

#### 2.2 自定义字段存储服务实现

```typescript
export class CustomFieldStorage {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 获取自定义字段列表（分页+筛选）
   */
  async getCustomFields(options: {
    page?: number
    limit?: number
    search?: string
    type?: string
    appCode?: string
    userId?: string
    visibility?: boolean
    isPublic?: boolean
  } = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        type = 'all', 
        appCode,
        userId,
        visibility,
        isPublic 
      } = options
      const offset = (page - 1) * limit

      // 构建基础查询
      let query = this.supabase
        .from('book_user_custom_fields')
        .select('*')
        .eq('is_deleted', false) // 软删除过滤

      // 用户权限过滤
      if (userId) {
        query = query.eq('user_id', userId)
      }

      // 类型筛选
      if (type !== 'all') {
        query = query.eq('type', type)
      }

      // 应用代码筛选
      if (appCode) {
        query = query.eq('app_code', appCode)
      }

      // 可见性筛选
      if (visibility !== undefined) {
        query = query.eq('visibility', visibility)
      }

      // 公开性筛选
      if (isPublic !== undefined) {
        query = query.eq('is_public', isPublic)
      }

      // 搜索功能 (搜索标题和readme字段)
      if (search && search.trim() !== '') {
        query = query.or(
          `readme.ilike.%${search}%,` +
          `extended_field->title->>value.ilike.%${search}%`
        )
      }

      // 分页和排序
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // 获取总数
      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / limit)

      return {
        records: data || [],
        total: totalCount,
        page,
        limit,
        totalPages
      }
    } catch (error) {
      console.error('获取自定义字段列表失败:', error)
      return {
        records: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 10,
        totalPages: 0
      }
    }
  }

  /**
   * 根据ID获取单条记录
   */
  async getCustomFieldById(id: string, userId?: string) {
    try {
      let query = this.supabase
        .from('book_user_custom_fields')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)

      // 权限控制: 只能查看自己的或公开的数据
      if (userId) {
        query = query.or(
          `user_id.eq.${userId},` +
          `and(visibility.eq.true,is_public.eq.true)`
        )
      }

      const { data, error } = await query.single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('获取自定义字段详情失败:', error)
      return null
    }
  }

  /**
   * 创建自定义字段记录
   */
  async createCustomField(record: {
    userId: string
    createdUserId: string
    appCode: string
    type: string
    extendedField: any[]
    amount: number
    readme: string
    exampleData?: string
    visibility: boolean
    isPublic: boolean
  }) {
    try {
      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .insert({
          user_id: record.userId,
          created_user_id: record.createdUserId,
          app_code: record.appCode,
          type: record.type,
          extended_field: record.extendedField,
          amount: record.amount, // 前端已转换为分
          readme: record.readme,
          example_data: record.exampleData,
          visibility: record.visibility,
          is_public: record.isPublic,
          post_ids: [], // 默认空数组
          is_deleted: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('创建自定义字段失败:', error)
      throw error
    }
  }

  /**
   * 更新自定义字段记录
   */
  async updateCustomField(
    id: string, 
    userId: string, 
    updates: Partial<{
      appCode: string
      extendedField: any[]
      amount: number
      readme: string
      exampleData: string
      visibility: boolean
      isPublic: boolean
    }>
  ) {
    try {
      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .update({
          app_code: updates.appCode,
          extended_field: updates.extendedField,
          amount: updates.amount,
          readme: updates.readme,
          example_data: updates.exampleData,
          visibility: updates.visibility,
          is_public: updates.isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId) // 权限控制: 只能更新自己的数据
        .eq('is_deleted', false)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('更新自定义字段失败:', error)
      throw error
    }
  }

  /**
   * 软删除自定义字段记录
   */
  async deleteCustomField(id: string, userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('book_user_custom_fields')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId) // 权限控制: 只能删除自己的数据
        .eq('is_deleted', false)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('删除自定义字段失败:', error)
      throw error
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(userId?: string) {
    try {
      const baseQuery = this.supabase
        .from('book_user_custom_fields')
        .select('type', { count: 'exact' })
        .eq('is_deleted', false)

      // 用户权限过滤
      if (userId) {
        baseQuery.eq('user_id', userId)
      }

      // 分别统计三种类型
      const [insightCount, hookCount, emotionCount] = await Promise.all([
        baseQuery.eq('type', '洞察'),
        baseQuery.eq('type', '钩子'),
        baseQuery.eq('type', '情绪')
      ])

      return {
        洞察: insightCount.count || 0,
        钩子: hookCount.count || 0,
        情绪: emotionCount.count || 0,
        总计: (insightCount.count || 0) + (hookCount.count || 0) + (emotionCount.count || 0)
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return {
        洞察: 0,
        钩子: 0,
        情绪: 0,
        总计: 0
      }
    }
  }
}

// 创建全局实例
export const customFieldStorage = new CustomFieldStorage(supabaseServiceRole)
```

#### 2.3 查询优化要点
- **索引利用**: 利用复合索引 `(user_id, type, is_deleted)` 提升查询性能
- **JSONB搜索**: 使用 GIN 索引支持 extended_field 字段的高效查询
- **软删除过滤**: 所有查询都包含 `is_deleted = false` 条件
- **权限过滤**: 在SQL层面实现数据访问控制
- **分页优化**: 使用 `range()` 方法实现高效分页

#### 2.4 错误处理模式
- **统一异常捕获**: try-catch 包装所有数据库操作
- **详细错误日志**: console.error 记录具体错误信息
- **优雅降级**: 查询失败时返回默认空数据结构
- **错误响应格式**: 标准化的API错误响应

#### 2.5 数据验证
- **服务端验证**: 在数据库层面进行类型和约束验证
- **业务规则验证**: 自定义验证逻辑 (金额范围、字段唯一性等)
- **权限验证**: JWT token 解析 + 用户角色检查
- **输入过滤**: 防止 SQL 注入和 XSS 攻击

### 3. 数据库设计要点
- **JSONB字段**: extended_field 使用JSONB存储
- **索引优化**: 为常用查询字段创建索引
- **软删除**: is_deleted 字段实现软删除
- **审计信息**: created_at/updated_at 自动维护

