import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    email: string
    username: string
    password: string
    role?: string
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/profile'),
  
  logout: () => api.post('/auth/logout'),
}

// 用户管理API
export const usersApi = {
  getUsers: (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }) => api.get('/users', { params }),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  createUser: (userData: any) => api.post('/users', userData),
  
  updateUser: (id: string, userData: any) => api.patch(`/users/${id}`, userData),
  
  updateUserStatus: (id: string, status: string) =>
    api.patch(`/users/${id}/status`, { status }),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  
  getUserStats: () => api.get('/users/stats'),
}

// 支付管理API
export const paymentsApi = {
  getPayments: (params?: {
    page?: number
    limit?: number
    status?: string
    userId?: string
    startDate?: string
    endDate?: string
  }) => api.get('/payments', { params }),
  
  getPayment: (id: string) => api.get(`/payments/${id}`),
  
  createPayment: (paymentData: any) => api.post('/payments', paymentData),
  
  updatePayment: (id: string, paymentData: any) =>
    api.patch(`/payments/${id}`, paymentData),
  
  getPaymentStats: () => api.get('/payments/stats'),
}

// 仪表板API
export const dashboardApi = {
  getOverviewStats: () => api.get('/dashboard/overview'),
  
  getUserActivityTrend: (days?: number) =>
    api.get('/dashboard/user-activity-trend', { params: { days } }),
  
  getTokenConsumptionStats: () => api.get('/dashboard/token-consumption'),
  
  getRevenueAnalysis: (months?: number) =>
    api.get('/dashboard/revenue-analysis', { params: { months } }),
}

// 知识库API
export const knowledgeBaseApi = {
  getKnowledgeBases: (params?: {
    page?: number
    limit?: number
    type?: string
    status?: string
  }) => api.get('/knowledge-base', { params }),
  
  getKnowledgeBase: (id: string) => api.get(`/knowledge-base/${id}`),
  
  createKnowledgeBase: (data: any) => api.post('/knowledge-base', data),
  
  updateKnowledgeBase: (id: string, data: any) =>
    api.patch(`/knowledge-base/${id}`, data),
  
  deleteKnowledgeBase: (id: string) => api.delete(`/knowledge-base/${id}`),
  
  testRAG: (id: string, query: string) =>
    api.post(`/knowledge-base/${id}/test-rag`, { query }),
}

// 其他模块API (暂时返回模拟数据)
export const contentLibraryApi = {
  getContentLibrary: () => api.get('/content-library'),
}

export const promptsApi = {
  getPrompts: () => api.get('/prompts'),
}

export const xiaohongshuApi = {
  getXiaohongshuAccounts: () => api.get('/xiaohongshu'),
}

export const systemConfigApi = {
  getSystemConfig: () => api.get('/system-config'),
}

export default api
