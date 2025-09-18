# 用户记忆（book_user_memory）管理 PRD

## 1. 目标与范围
- 目标：提供“查看用户记忆”侧边栏 Tab，后端实现完整 CRUD；前端管理平台仅做“查”（列表/详情/搜索/筛选），UI风格与“帖子库/备忘录”一致。
- 范围：表 `book_user_memory` 的数据读写；前端仅读取展示，不提供写操作入口。

## 2. 数据模型
表结构见《database_struct.md》节 book_user_memory。

关键字段与约束：
- id(uuid, pk)
- user_id(uuid, not null)：归属用户
- memory(jsonb, null)：任意键值对，允许添加任意字段和值
- memory_name(text, not null)：该条记忆的命名（用于列表展示与搜索）
- level(text, null)：取值 `user` | `project`
- is_deleted(boolean, default false)
- created_at/updated_at

字段规则：
- memory：为 JSON 对象，形如 `{ "人设": "测试人设", "背景": "测试背景", "...": "..." }`，可扩展字段。
- memory_name：1-100 字符，用于快速定位与展示。
- level：`user` 表示用户级记忆，`project` 表示项目级记忆

## 3. API 设计（后端需实现 CRUD）
Base URL：`/api/user-memory`
认证：与“帖子库”一致，不使用 JWT 校验。所有接口通过查询参数/请求体中的 `userId` 进行数据隔离与校验（UUID 校验 + 只操作 `user_id === userId` 的数据）。
响应统一：`{ success: boolean, data?: any, error?: string }`

### 3.1 列表查询（前端使用）
```
GET /api/user-memory?userId={uuid}&level={user|project?}&search={kw?}&page={1}&limit={20}
```
- 过滤：
  - userId 必填（UUID）
  - level 可选（user|project）
  - search 可选，对 `memory_name` 与 `memory` 中所有字符串值做模糊匹配（优先 ILIKE，必要时仅对 memory_name 搜索）
- 排序：按 `updated_at` 降序
- 返回（精简列表项，用于左侧列表/树）：
```
{
  "success": true,
  "data": {
    "items": [
      { "id": "...", "memory_name": "...", "level": "user", "updated_at": "..." }
    ],
    "total": 123,
    "page": 1,
    "limit": 20,
    "totalPages": 7
  }
}
```

### 3.2 获取详情（前端使用）
```
GET /api/user-memory?id={uuid}&userId={uuid}
```
返回：整条记录，包含 memory 全量 JSON。
```
{
  "success": true,
  "data": {
    "id": "...",
    "user_id": "...",
    "memory_name": "...",
    "level": "user",
    "memory": { "人设": "测试人设", "背景": "测试背景" },
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### 3.3 创建（后端实现，前端当前不暴露入口）
```
POST /api/user-memory
Body: {
  "userId": "{uuid}",
  "memory_name": "名称(1-100)",
  "level": "user|project",
  "memory": { ... 任意键值对 ... }
}
```
校验：
- userId 必填 UUID
- memory_name 1-100 字符
- level 枚举 user|project（可为空则存 null）
- memory 必须为对象(JSON)

返回：新建记录的 `id/created_at/updated_at`。

### 3.4 更新（后端实现，前端当前不暴露入口）
```
PUT /api/user-memory
Body: {
  "userId": "{uuid}",
  "id": "{uuid}",
  "action": "rename|update-json|update-level",
  // rename
  "memory_name": "新名称",
  // update-json（整体覆盖或增量合并二选一，见实现约定）
  "memory": { ... },
  // update-level
  "level": "user|project|null"
}
```
返回：更新后的关键字段（id、memory_name、level、updated_at）。

更新策略约定：
- `update-json` 默认整体覆盖；可支持 `merge=true` 查询参数时进行浅合并（实现可选，但需在 PRD 标注）。

### 3.5 删除（后端实现，前端当前不暴露入口）
```
DELETE /api/user-memory
Body: { "userId": "{uuid}", "ids": ["{uuid}"] }
```
行为：软删除（`is_deleted=true`），返回 `{ deletedIds: [...] }`。

## 4. 前端页面（仅查）
入口：侧边栏新增 Tab「查看用户记忆」，点击进入路由 `/user-memory`（或在既有“备忘录/帖子库”页内新增一个 Tab）。

布局：与“帖子库/备忘录”一致的双栏结构，左侧顶部提供“级别筛选”下拉框。
```
左侧：
  - 顶部：用户UUID输入框 + 加载按钮（与现有页面一致）
  - 顶部其下：级别下拉框（全部 / 项目级别 / 用户级别）
  - 列表：显示 memory_name（按 updated_at desc），可搜索（search）；级别筛选由该下拉框生效
右侧：
  - 详情预览：显示 memory_name、level、memory(JSON) 的可读视图（Key-Value 列表/折叠卡片）
  - 空态：提示“点击左侧记忆以查看详情”
```

交互：
- 搜索：300ms 防抖；初期可仅对 memory_name 搜索，若实现成本允许可对 memory 的字符串值做 ILIKE。
- 分页：与列表一致（页码、每页20默认，最大100）。
- 仅查：不提供前端新增/编辑/删除按钮；保留后端接口以供自动化/脚本写入。

样式：
- 复用“帖子库/备忘录”卡片与列表样式（保持一致性）。
- 详情区的 JSON 展示为易读的 Key-Value 表或折叠面板，不展示原始 JSON 字符串。

### 4.1 页面结构与组件
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 查看用户记忆（与既有标题风格一致）                      │
├─────────────────────────────────────────────────────────────────┤
│ Toolbar: [用户UUID输入] [加载]  [搜索框]  [Level筛选: all/user/project] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐ │
│  │  LeftPanel          │  │          RightPanel                 │ │
│  │  - 列表（虚拟滚动）  │  │  - 详情卡片（Key-Value）            │ │
│  │  - 分页器            │  │  - JSON 折叠视图（可展开/复制）      │ │
│  │                      │  │                                     │ │
│  └─────────────────────┘  └─────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

组件清单与Props（TypeScript 伪定义）：
```ts
// Toolbar
interface MemoryToolbarProps {
  userId: string
  search: string
  loading: boolean
  onUserIdChange: (v: string) => void
  onLoad: () => void
  onSearchChange: (v: string) => void
}

// 列表（左）
interface MemoryListProps {
  items: { id: string; memory_name: string; level: 'user' | 'project' | null; updated_at: string }[]
  page: number
  limit: number
  total: number
  loading: boolean
  selectedId?: string
  level: 'all' | 'user' | 'project'
  onLevelChange: (v: 'all' | 'user' | 'project') => void
  onSelect: (id: string) => void
  onPageChange: (p: number) => void
}

// 详情（右）
interface MemoryDetailProps {
  loading: boolean
  data?: {
    id: string
    memory_name: string
    level: 'user' | 'project' | null
    memory: Record<string, any>
    created_at: string
    updated_at: string
  }
}
```

视觉与交互要点：
- 左侧顶部：
  - 下拉“级别筛选”：默认“全部”，选项为“全部/项目级别/用户级别”，分别对应 `all/project/user`；改变后立即触发列表刷新。
- 列表项：主标题为 `memory_name`，副标题为 `level` 徽标 + 更新时间（相对时间）。
- 搜索为空且无数据时显示空态插画与“请先输入用户UUID并加载”。
- 详情：
  - 顶部标题区：`memory_name` + `level` 徽标 + 更新时间。
  - 内容区：
    - Key-Value 卡片：将 `memory` 的第一层键值渲染为两列栅格；长文本自动折行；数组/对象以“可展开”块显示。
    - 提供“复制JSON”按钮（复制格式化后的 JSON 文本）。
- 深色主题：沿用全局主题色，保证与“帖子库/备忘录”一致的色阶、阴影与交互反馈。

### 4.2 状态管理（建议）
可选实现：基于 React Query + 本地 state（或 Zustand）。

查询契约：
- 列表 key：`['user-memory','list',{ userId, level, search, page, limit }]`
- 详情 key：`['user-memory','detail', id, userId]`

骨架与占位：
- 左侧列表 skeleton 行数=8；右侧详情 skeleton 为卡片占位（标题条 + 多行）。

### 4.3 无障碍与性能
- 列表支持键盘上下选择；Enter 进入详情。
- 大列表使用虚拟滚动（如 Chakra 的虚拟列表或 react-window）。
- JSON 渲染对大对象做懒展开，避免一次性渲染过多节点。

## 5. 错误与边界
- 未认证/无权限：401/403，前端跳转登录或提示。
- 无数据：显示空态插画与引导文案。
- 大 JSON：若 memory 字段过大（> 256KB），后端可限制并返回 400；前端仅查不受影响。

## 6. 性能与索引
- 列表查询仅返回必要字段（id、memory_name、level、updated_at）。
- 使用索引：`idx_book_user_memory_user_id`、`idx_book_user_memory_memory_gin`（JSONB）与 `idx_book_user_memory_is_deleted`。
- 搜索优先对 memory_name；对 memory 的全字段模糊检索规模大时需评估成本。

## 7. 权限
- 以 `userId` 进行数据隔离；管理员策略与现有模块保持一致（如需管理员查看全量，沿用既有判断）。
- 写操作（Create/Update/Delete）仅对后端开放；前端本期不提供入口。

## 8. 快速参考
请求模板：
```
// 列表
GET /api/user-memory?userId=${uuid}&level=user&search=kw&page=1&limit=20

// 详情
GET /api/user-memory?id=${id}&userId=${uuid}

// 创建（后端可用）
POST { userId, memory_name, level, memory }

// 更新（后端可用）
PUT  { userId, id, action: 'rename'|'update-json'|'update-level', ...payload }

// 删除（后端可用）
DELETE { userId, ids: [id1, id2] }
```


