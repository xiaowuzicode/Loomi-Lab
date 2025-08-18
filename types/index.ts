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

// 提示词相关
export interface Prompt {
  id: string
  name: string
  description: string
  category: 'system' | 'user' | 'assistant'
  template: string
  variables: string[]
  usage: number
  createdAt: Date
  updatedAt: Date
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
