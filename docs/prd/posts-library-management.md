# 帖子库（Posts Library）PRD —— 前端页面与交互规范

## 1. 目标与范围
- 目标：提供“帖子库”管理界面，基于用户 `userId` 展示“帖子”类型文件夹树与其下帖子，右侧预览帖子详情。
- 范围：仅定义页面结构、组件、交互流程、状态与边界；不定义/约束后端接口与参数。

## 2. 页面信息
- 路由：`/posts-library`
- 标题：帖子库
- 受众：内部运营/管理用户（桌面端优先，≥1200px）

## 3. 布局与区域
```
┌─────────────────────────────────────────────────────────────────┐
│ Header：帖子库  [userId 输入] [加载] [搜索框]                    │
├─────────────────────────────────────────────────────────────────┤
│ 左侧：文件夹树（type=帖子） + 节点下帖子列表（懒加载）            │
│  - 根含“未分组”虚拟节点（fold_id = null）                       │
│ 右侧：帖子详情预览                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 Header（工具区）
- 组件：
  - `Input(userId)`：必填，粘贴 UUID。
  - `Button(加载)`：点击后加载文件夹树与根级帖子（未分组）。
  - `Input(搜索)`：防抖 300ms，针对“当前选中文件夹范围内的帖子列表”生效。
- 反馈：加载中禁用按钮；错误 Toast；空态文案。

### 3.2 左侧面板（树 + 帖子列表）
- 文件夹树节点（FolderNode）
  - 展开/折叠：点击文件夹名或“▶/▼”。
  - 选中态：高亮名称；展开时在其下展示帖子列表。
  - 层级缩进：16px/级；悬停显示背景高亮。
- 帖子叶子（PostItem）
  - 显示：图标 + `title`（单行省略）+ 更新时间（可选灰字）。
  - 点击：在右侧加载详情；高亮当前选中的帖子。
- 数据加载策略：
  - 第一次点击“加载”后，立即加载“未分组”帖子的前 50 条（可配置）。
  - 展开某文件夹时，若未加载过其帖子则触发一次加载；已加载则直接展示。
  - 列表有数据或处于加载中时才显示对应占位块；无数据不显示空位。
- 空态：
  - 未加载：提示“输入用户ID并点击‘加载’”。
  - 无文件夹：提示“暂无文件夹”；但仍可显示“未分组”帖子。
  - 某文件夹下无帖子：在该节点下显示灰字“无帖子”。

### 3.3 右侧面板（帖子详情）
- 结构：
  - 标题：`meta.title || title`
  - 作者：头像 + 名称（优先取 `meta.author.name`；否则 `author` 文本）
  - 标签：`meta.tags`（Chip 列）
  - 互动：`meta.interactions`（点赞/收藏/评论）
  - 发布信息：`meta.publishTime` / `created_at` / `updated_at`
  - 媒体：`meta.mediaList`（图片九宫格/视频）
  - 正文：`meta.content || content`
  - 评论：`meta.comments`（列表）
- 加载：骨架屏（标题 1 行 + 8 行文本 + 媒体占位）。
- 空态：提示“点击左侧帖子以查看内容”。

## 4. 组件规范（前端）

### 4.1 类型（前端）
```ts
interface FolderNode { fold_id: string; fold_name: string; children: FolderNode[]; expanded?: boolean }
interface PostListItem { id: string; title: string; fold_id: string | null; updated_at: string }
interface PostDetail {
  id: string; title: string; content: string; fold_id: string | null;
  author?: string | { name?: string; avatar?: string };
  tags?: string[]; url?: string; created_at?: string; updated_at?: string;
  meta?: {
    tags?: string[];
    title?: string;
    author?: { name?: string; avatar?: string } | string;
    content?: string;
    comments?: Array<{ time?: string; likes?: string; author?: string; content?: string; location?: string }>;
    mediaList?: Array<{ url: string; type: 'image' | 'video' }>;
    extractedAt?: string;
    publishTime?: string;
    interactions?: { likes?: string; collects?: string; comments?: string };
  }
}
```

### 4.2 组件与交互
- FolderTree
  - Props：`folders: FolderNode[]`、`expanded: Set<string>`、`selectedFolderId?: string`、回调 `onToggle(id)`、`onSelect(id)`。
  - 行为：切换展开状态时触发懒加载；选中后高亮并滚动可见。
- PostList (per folder)
  - Props：`items: PostListItem[]`、`loading: boolean`、`selectedPostId?: string`、回调 `onSelect(id)`。
  - 行为：点击触发详情加载；显示骨架屏；无数据不渲染块。
- PostPreview
  - Props：`detail?: PostDetail`、`loading: boolean`。
  - 行为：加载时骨架；未选择时空态；渲染 meta 优先、字段回退规则明确。

## 5. 交互流程

### 5.1 首次加载
1) 用户输入 `userId` → 点击“加载”。
2) 左侧渲染“帖子”文件夹树；同时请求“未分组”帖子列表（limit=50）。
3) 若有数据，默认不选中帖子（右侧显示空态）；用户点击后再加载详情。

### 5.2 展开文件夹
1) 用户展开某 `FolderNode`。
2) 若该文件夹的帖子未加载 → 显示局部骨架 → 拉取数据 → 渲染 `PostListItem`。
3) 已加载情况下再次展开/折叠为本地 UI 行为，不重复请求。

### 5.3 查看详情
1) 点击某 `PostListItem` → 高亮项，右侧显示骨架。
2) 详情加载完成 → 渲染标题/作者/标签/互动/媒体/正文/评论。

### 5.4 搜索
1) 在搜索框输入关键字（防抖 300ms）。
2) 针对“当前选中文件夹范围”过滤帖子列表。
3) 结果为空时显示“无匹配帖子”。

## 6. UI/视觉规范
- 缩进：树每级 16px；叶子与文件夹同一网格对齐。
- 图标：文件夹 `RiFolder2Line`，帖子 `RiFileTextLine`（或 `RiStickyNoteLine`）。
- 颜色：遵循现有深色主题（灰 700 悬停、蓝 300 选中）。
- 骨架：树行高 18–20px；详情 8 行文本占位；媒体 3×3 方块占位。
- 字体：标题 16–18px；正文 14px；辅助 12px。

## 7. 状态与错误
- 全局：`loading`、`error`（Toast）
- 左侧：`expanded: Set<string>`、`selectedFolderId`、`selectedPostId`、`postsLoadingByFolder: Record<id, boolean>`、`postsByFolder: Record<id|'ROOT', PostListItem[]>`
- 右侧：`detailLoading`、`detail: PostDetail | null`
- 空态：输入用户ID提示/无文件夹/无帖子/未选择帖子/搜索无结果

## 8. 性能与可用性
- 懒加载与分页；虚拟滚动（当单文件夹帖子>200条时启用）。
- 防抖搜索；避免在同一文件夹展开/折叠时重复请求。
- 状态持久化（可选）：仅持久化 UI 偏好（展开集合/最近选择）。

## 9. 边界与异常
- 无效 `userId`：保留页面，提示错误，不保留旧数据。
- 文件夹树为空：仍允许显示“未分组”帖子块。
- 详情缺失字段：严格按回退策略渲染；不报错中断。

## 10. 验收要点（前端）
- 输入 `userId` 点击“加载”后能看到“帖子”文件夹树与“未分组”帖子。
- 展开任意文件夹后出现其帖子列表；再次展开不重复加载。
- 点击帖子能在右侧看到完整详情（含媒体/评论）。
- 搜索只作用于当前文件夹范围；清空搜索恢复列表。
- 空态/骨架/错误提示完整，视觉与“备忘录”一致性良好。
