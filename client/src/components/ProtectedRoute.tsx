import { Navigate, useLocation } from 'react-router-dom'
import { Box, Spinner, Center, Text, VStack } from '@chakra-ui/react'

import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="primary.500" thickness="4px" />
          <Text color="gray.500">正在验证身份...</Text>
        </VStack>
      </Center>
    )
  }

  if (!isAuthenticated) {
    // 保存当前路径，登录后可以重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
