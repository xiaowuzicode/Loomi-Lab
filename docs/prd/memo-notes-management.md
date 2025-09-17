# 备忘录（Notes）管理功能 PRD

## 1. 功能概述

### 1.1 核心目标
实现备忘录（Notes）的增删查改能力，支持按文件夹进行组织与浏览；前端提供桌面端友好展示与基础编辑体验，后端实现完整的 CRUD 接口与数据校验。

### 1.2 场景边界
- ✅ 备忘录的创建、重命名、编辑内容、移动文件夹、删除（软删除）
- ✅ 列表与详情（Markdown 渲染预览）
- ✅ 基于文件夹（`fold_id`）的筛选与浏览
- ✅ 搜索/筛选与分页
- ✅ 与“文件夹管理”权限保持一致（不含默认管理员逻辑）
- ❌ 分享/协作/评论（后续版本）
- ❌ 富文本所见即所得（当前为 Markdown 编辑 + 预览）

### 1.3 设计原则
- 复用已定义的“文件夹管理”模块（树结构、权限策略、管理员 UUID）
- RESTful 风格 + 统一响应体（`ApiResponse<T>`）
- 最小但完整：前端展示、后端 CRUD 均可单独运行


## 2. 数据模型设计

### 2.1 目标表（book_notes）
参考《database_struct.md》中 `book_notes`：

```json
[
  { "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": "uuid_generate_v4()" },
  { "column_name": "user_id", "data_type": "uuid", "is_nullable": "NO" },
  { "column_name": "created_user_id", "data_type": "uuid", "is_nullable": "NO" },
  { "column_name": "fold_id", "data_type": "uuid", "is_nullable": "YES" },
  { "column_name": "post_ids", "data_type": "ARRAY", "is_nullable": "YES" },
  { "column_name": "is_deleted", "data_type": "boolean", "is_nullable": "NO", "column_default": "false" },
  { "column_name": "note_name", "data_type": "text", "is_nullable": "YES" },
  { "column_name": "note", "data_type": "text", "is_nullable": "YES" },
  { "column_name": "share_url", "data_type": "text", "is_nullable": "YES" },
  { "column_name": "source", "data_type": "text", "is_nullable": "YES" },
  { "column_name": "created_at", "data_type": "timestamptz", "is_nullable": "NO", "column_default": "now()" },
  { "column_name": "updated_at", "data_type": "timestamptz", "is_nullable": "NO", "column_default": "now()" }
]
```

### 2.2 关键字段与规则
- note_name：前端显示名称，长度 1–100；同一 `fold_id` 下可允许重名（不强制唯一）；支持模糊搜索
- note：Markdown 文本，最大建议 200KB（可在后端限制）
- fold_id：所属文件夹，`null` 表示未归档到任意文件夹
- is_deleted：软删除标记；列表默认过滤掉 `true`
- user_id/created_user_id：用户归属与创建者标识（权限判断使用）

### 2.3 类型定义（前端）
```ts
interface MemoNote {
  id: string
  userId: string
  createdUserId: string
  foldId: string | null
  noteName: string
  note: string // markdown
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}
```


## 3. 权限与身份

### 3.1 用户身份识别
与“文件夹管理”保持一致，通过请求参数或体中的 `userId` 识别身份：

| 参数 | 类型 | 传递方式 | 必填 | 说明 |
|------|------|----------|------|------|
| userId | string (UUID) | 查询参数/请求体 | ✅ | 用户唯一标识符 |

### 3.2 认证与授权
- 认证：沿用平台 JWT；后端在 API 侧从 `Authorization: Bearer` 中解析
- 授权：所有接口仅允许访问、操作 `user_id === userId` 的数据；不引入默认管理员逻辑


## 4. API 设计

### 4.1 基础
- Base URL：`/api/memo-notes`
- 方法与职责：
  - GET：列表/详情
  - POST：创建
  - PUT：更新（重命名、编辑内容、移动文件夹）
  - DELETE：删除（软删除，支持批量）

### 4.2 列表查询（按文件夹筛选；用于左侧树懒加载笔记）
```http
GET /api/memo-notes?userId={userId}&foldId={foldId?}&search={kw?}&page={1}&limit={20}
```

响应：
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "...", "note_name": "...", "fold_id": "...", "updated_at": "..." }
    ],
    "total": 123,
    "page": 1,
    "limit": 20,
    "totalPages": 7
  }
}
```

说明：
- 列表返回精简字段（用于树节点/简单列表），详情另行获取
- 过滤：`foldId`（可为空）、`search`（对 `note_name` 与 `note` 做 ILIKE 模糊）
- 自动排除 `is_deleted = true`
- 返回字段建议：`id`、`note_name`、`fold_id`、`updated_at`

### 4.3 获取详情
```http
GET /api/memo-notes?id={noteId}&userId={userId}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": "...",
    "user_id": "...",
    "created_user_id": "...",
    "fold_id": null,
    "note_name": "周报模版",
    "note": "# 标题...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### 4.4 创建
```http
POST /api/memo-notes
```
请求体：
```json
{
  "userId": "{uuid}",
  "note_name": "新的笔记",
  "note": "# Markdown 内容",
  "fold_id": null
}
```

校验：
- `note_name`：必填，1–100
- `note`：可为空字符串（允许先建壳）
- `fold_id`：可空，若非空需为合法 UUID

### 4.5 更新（重命名/内容/移动）
```http
PUT /api/memo-notes
```
请求体（三种 action）：
```json
// 1) 重命名
{ "userId": "{uuid}", "id": "{noteId}", "action": "rename", "note_name": "新名称" }

// 2) 编辑内容
{ "userId": "{uuid}", "id": "{noteId}", "action": "update-content", "note": "# 新的 Markdown" }

// 3) 移动文件夹
{ "userId": "{uuid}", "id": "{noteId}", "action": "move", "fold_id": "{uuid|null}" }
```

返回：`{ success: true, data: {...更新后的记录...} }`

### 4.6 删除（软删除）
```http
DELETE /api/memo-notes
```
请求体：
```json
{ "userId": "{uuid}", "ids": ["{noteId1}", "{noteId2}"] }
```

行为：
- 将 `is_deleted` 置为 `true`，并更新 `updated_at`
- 返回受影响 ID 列表：`{ success: true, data: { deletedIds: [...] } }`

### 4.7（已移除）帖子相关接口
当前管理界面仅涉及 `note_name` 与 `note` 展示与编辑，不提供帖子查询接口。


## 5. 前端页面设计（桌面端）

### 5.1 路由与布局
- 路由：`/memo-notes`
- 顶部工具区：用户 UUID 输入框 + 加载按钮（与“文件夹管理”一致），用于按 UUID 加载该用户文件夹与笔记
- 布局：笔记应显示在其所属“文件夹节点”下面（左侧树为“文件夹 + 笔记”的混合树），右侧为笔记编辑区。
```
┌─────────────────────────────────────────────────────────────────┐
│ Header：备忘录管理（用户UUID输入 / 搜索 / 新建笔记）               │
├─────────────────────────────────────────────────────────────────┤
│ 左侧：混合树（文件夹 + 笔记）       │ 右侧：笔记编辑区                 │
│  - 文件夹节点可展开/拖拽            │  - 仅显示并编辑:                │
│    · 展开后其下直接列出该文件夹内的  │    · note_name（标题输入框）     │
│      笔记（按更新时间排序）         │    · note（Markdown 编辑/预览）  │
│  - “未分组”虚拟根：fold_id=null     │  - 操作：保存、移动到其它文件夹   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 节点与详情
- 左侧树节点类型：
  - FolderNode：文件夹，只显示名称
  - NoteNode：笔记，显示 `note_name`
- 选择 NoteNode：右侧显示编辑区，仅包含 `note_name` 与 `note`
- 选择 FolderNode：右侧展示该文件夹的简要信息与“新建笔记”按钮
- 新建/编辑：使用右侧编辑区或模态框（字段：`note_name`、`note`；移动时额外选择 `fold_id`）

### 5.3 交互与校验
- 创建/重命名：输入框即时校验（长度、非法字符）
- 移动：选择文件夹（FolderPicker，来自文件夹树或下拉）
- 删除：二次确认 + 批量删除反馈
- 搜索：300ms 防抖，对 `note_name` 与 `note` 文本做模糊匹配


## 6. 状态管理（建议）

### 6.1 Store（Zustand）
```ts
interface MemoNotesStore {
  notes: MemoNote[]
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  foldId: string | null
  search: string

  fetchNotes: () => Promise<void>
  getDetail: (id: string) => Promise<MemoNote | null>
  createNote: (payload: { note_name: string; note: string; fold_id: string | null }) => Promise<void>
  renameNote: (id: string, name: string) => Promise<void>
  updateContent: (id: string, md: string) => Promise<void>
  moveNote: (id: string, foldId: string | null) => Promise<void>
  deleteNotes: (ids: string[]) => Promise<void>

  // 树懒加载
  loadNotesUnderFolder: (foldId: string | null) => Promise<void>

  setFold: (foldId: string | null) => void
  setSearch: (kw: string) => void
  setPage: (p: number) => void
}
```

### 6.2 持久化
- 仅持久化 UI 偏好（如当前 `foldId`、分页大小），不持久化数据集


## 7. 性能与索引
- 列表查询：分页 + 仅返回必要字段
- 索引利用：`idx_book_notes_user_id`、`idx_book_notes_fold_id`、`idx_book_notes_is_deleted`
- 搜索：`note_name` 与 `note` 的 ILIKE 模糊；规模化可扩展全文检索（后续）


## 8. 错误处理与反馈
- 统一响应：`{ success, data?, error? }`
- 校验错误：400 + 具体字段提示
- 权限错误：403（或 401 未认证）
- 删除/批处理：返回受影响条目 ID，便于前端同步


## 9. 与文件夹模块集成
- `fold_id` 与“文件夹管理”中的节点 ID 对应
- 左侧为“文件夹 + 笔记”的混合树：展开文件夹即加载其下笔记
- 选中笔记时右侧显示编辑区；选中文件夹显示新建入口和统计
- 移动操作通过选择新的 `fold_id` 实现


## 10. 开发里程碑
- Phase 1：后端 API（CRUD + 权限校验 + 基础分页/搜索）
- Phase 2：前端页面（列表/详情/编辑 + 与文件夹树联动）
- Phase 3：交互优化（防抖、批量删除、移动动画、Markdown 预览优化）
- Phase 4：E2E 与性能验证


## 11. 快速参考

### 11.1 标准请求参数模板
```js
const userId = "<输入框中的用户UUID>"

// GET 列表：/api/memo-notes?userId=${userId}&foldId=<当前展开文件夹或空>
// GET 详情：/api/memo-notes?id={noteId}&userId=${userId}
// POST：    { userId, note_name: 'xx', note: '# md', fold_id: null }
// PUT 重命名：{ userId, id, action: 'rename', note_name }
// PUT 内容：  { userId, id, action: 'update-content', note }
// PUT 移动：  { userId, id, action: 'move', fold_id }
// DELETE：   { userId, ids: [id1, id2] }
```

### 11.2 成功/失败响应示例
```json
// 成功
{ "success": true, "data": { "id": "..." }, "message": "操作成功" }

// 失败
{ "success": false, "error": "参数不合法" }
```


## 12. 注意事项
- 与“文件夹管理”权限逻辑完全一致，不引入默认管理员逻辑
- 软删除实现，避免误删；后续可提供恢复能力
- Markdown 大文本读写注意大小限制与 XSS 处理（`react-markdown` + 白名单）
- 后端更新 `updated_at`，前端按此排序显示最近编辑
- 列表不要回传完整 Markdown，节流网络与渲染开销


