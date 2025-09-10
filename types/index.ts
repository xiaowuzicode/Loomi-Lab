// 用户相关类型
export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  role: 'admin' | 'operator' | 'viewer'
  status: 'active' | 'inactive' | 'banned'
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  email: string
  username: string
  role: string
}

// 登录相关
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
}

// 仪表板数据
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  tokenConsumption: number
  userGrowth: number
  revenueGrowth: number
}

export interface ChartData {
  date: string
  value: number
  label?: string
}

// 支付相关
export interface Payment {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: 'alipay' | 'wechat' | 'card'
  description: string
  createdAt: Date
  updatedAt: Date
}

// 知识库相关
export interface KnowledgeBase {
  id: string
  name: string
  description: string
  type: 'persona' | 'domain' | 'general'
  status: 'active' | 'inactive' | 'building' | 'error'
  documentCount: number
  vectorCount: number
  createdAt: Date
  updatedAt: Date
}

// 内容库相关
export interface ContentItem {
  id: string
  title: string
  content: string
  description?: string
  author?: string
  source_url?: string
  
  // 分类和平台
  category: string
  platform: string
  hot_category?: 'viral' | 'trending' | 'normal' | null
  status: 'published' | 'draft' | 'archived'
  
  // 媒体资源
  thumbnail_url?: string
  images_urls: string[]
  video_url?: string
  
  // 数据统计
  views_count: number
  likes_count: number
  shares_count: number
  comments_count: number
  favorites_count: number
  engagement_rate: number
  
  // 评论数据
  top_comments: TopComment[]
  
  // 标签和关键词
  tags: string[]
  keywords: string[]
  
  // 时间字段
  published_at?: string
  created_at: string
  updated_at: string
}

export interface TopComment {
  id?: string
  author: string
  content: string
  likes: number
  created_at?: string
}

// 内容导入相关
export interface ContentImportItem {
  title: string
  content: string
  description?: string
  author?: string
  source_url?: string
  category: string
  platform: string
  hot_category?: 'viral' | 'trending' | 'normal'
  status?: 'published' | 'draft' | 'archived'
  thumbnail_url?: string
  images_urls?: string[]
  video_url?: string
  views_count?: number
  likes_count?: number
  shares_count?: number
  comments_count?: number
  favorites_count?: number
  engagement_rate?: number
  top_comments?: TopComment[]
  tags?: string[]
  keywords?: string[]
  published_at?: string
}

export interface ContentImportRequest {
  items: ContentImportItem[]
  override_existing?: boolean
}

export interface ContentImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
  imported_items: string[]
}

// 提示词管理 - 基于YAML文件的Agent管理
export interface AgentInfo {
  id: string
  name: string
  description: string
  prompt: string
  file: string
  syncStatus: 'synced' | 'modified' | 'error'
  lastModified: string
  category: string
}

export interface PromptDirectory {
  path: string
  agents: AgentInfo[]
  totalCount: number
}

export interface AgentUpdate {
  agentId: string
  prompt: string
}

export interface BatchUpdateRequest {
  path: string
  updates: AgentUpdate[]
}

export interface BatchUpdateResult {
  agentId: string
  success: boolean
  error?: string
}

export interface PromptManagerState {
  directoryPath: string
  agents: AgentInfo[]
  localEdits: Record<string, string | undefined> // agentId -> editedPrompt
  loading: boolean
  error: string | null
  lastSyncCheck: Date | null
}

// 小红书相关
export interface XiaohongshuAccount {
  id: string
  nickname: string
  userId: string
  followers: number
  status: 'active' | 'inactive' | 'banned'
  lastSync: Date
  createdAt: Date
}

export interface XiaohongshuPost {
  id: string
  accountId: string
  title: string
  content: string
  images: string[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledAt?: Date
  publishedAt?: Date
  performance?: {
    views: number
    likes: number
    comments: number
    shares: number
  }
  createdAt: Date
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 系统配置
export interface SystemConfig {
  id: string
  key: string
  value: string | number | boolean
  description: string
  category: string
  updatedAt: Date
}

// 自定义字段管理相关类型 - 表格化改造后

// 表格行数据类型
export interface TableRow {
  id: number // 行ID，自增
  [field: string]: any // 动态字段，如：标题、正文、分类等
}

// 旧版本字段定义（向后兼容）
export interface LegacyCustomField {
  key: string
  label: string
  value: string
  type?: 'text'
  required?: boolean
}

// 表格字段定义
export interface TableField {
  name: string // 字段名称
  label: string // 显示标签
  type: 'text' | 'textarea' | 'number' // 字段类型
  required: boolean // 是否必填
  sortable: boolean // 是否可排序
  deletable: boolean // 是否可删除
  width?: number // 列宽
}

// 更新后的自定义字段记录
export interface CustomFieldRecord {
  id: string
  userId: string
  createdUserId: string
  createdUserName: string // 创建者显示名称
  appCode: string
  type: '洞察' | '钩子' | '情绪'
  extendedField: TableRow[] // 改为表格行数据数组
  tableFields: string[] // 表格字段名列表（用于表头生成）
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

export interface CustomFieldForm {
  appCode: string
  amount: number
  readme: string
  exampleData?: string
  visibility: boolean
  isPublic: boolean
  extendedField: TableRow[]
  tableFields: string[]
}

// 表格操作相关类型
export interface TableRowUpdate {
  rowId: number
  updates: Record<string, any>
}

export interface FieldOperation {
  action: 'add' | 'remove' | 'rename'
  fieldName: string
  newFieldName?: string
}

export interface BatchOperation {
  action: 'edit' | 'delete' | 'export'
  rowIds: number[]
  updates?: Record<string, any>
}

// 向后兼容的输入类型
export interface CustomFieldInput {
  key: string
  label: string
  value: string
  removable: boolean // 是否可删除 (标题不可删除)
}

export interface CustomFieldStats {
  洞察: number
  钩子: number
  情绪: number
  总计: number
}

export interface CustomFieldListParams {
  page?: number
  limit?: number
  search?: string
  userSearch?: string
  type?: '洞察' | '钩子' | '情绪' | 'all'
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
