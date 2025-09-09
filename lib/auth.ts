import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import type { AuthUser } from '@/types'

// 使用密码哈希作为JWT密钥的一部分，确保密码修改后Token失效
const getJWTSecret = () => {
  const baseSecret = process.env.JWT_SECRET || 'your-secret-key'
  const adminPassword = process.env.ADMIN_PASSWORD || ''
  // 结合基础密钥和管理员密码生成最终的JWT密钥
  // 这样当管理员密码变更时，所有现有Token都会失效
  return `${baseSecret}_${adminPassword}`
}

// 移除了 bcrypt 相关的常量，密码验证将在 API 路由中处理

// JWT 相关函数
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    getJWTSecret(),
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): (AuthUser & { userId: string }) | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as AuthUser
    return {
      ...decoded,
      userId: decoded.id // 确保有userId字段用于API权限控制
    }
  } catch (error) {
    // Token验证失败（包括密码变更导致的失效）
    return null
  }
}

// 密码相关函数 - 移到单独的服务端模块
// 这些函数将在 API 路由中使用，不在中间件中调用

// 从请求中获取用户信息
export function getUserFromRequest(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}

// 权限检查
export function hasPermission(user: AuthUser, requiredRole: string): boolean {
  const roleHierarchy = {
    viewer: 1,
    operator: 2,
    admin: 3,
  }

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userLevel >= requiredLevel
}
