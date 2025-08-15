import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, useColorModeValue } from '@chakra-ui/react'

import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'

// Pages
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { UsersPage } from './pages/users/UsersPage'
import { PaymentsPage } from './pages/payments/PaymentsPage'
import { KnowledgeBasePage } from './pages/knowledge-base/KnowledgeBasePage'
import { ContentLibraryPage } from './pages/content-library/ContentLibraryPage'
import { PromptsPage } from './pages/prompts/PromptsPage'
import { XiaohongshuPage } from './pages/xiaohongshu/XiaohongshuPage'
import { SystemConfigPage } from './pages/system-config/SystemConfigPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50)',
    'linear(to-br, gray.900, purple.900)'
  )

  return (
    <AuthProvider>
      <Box minH="100vh" bg={bgGradient}>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 受保护的路由 */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* 默认重定向到仪表板 */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* 核心页面 */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="content-library" element={<ContentLibraryPage />} />
            <Route path="prompts" element={<PromptsPage />} />
            <Route path="xiaohongshu" element={<XiaohongshuPage />} />
            <Route path="system-config" element={<SystemConfigPage />} />
          </Route>

          {/* 404 页面 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </AuthProvider>
  )
}

export default App
