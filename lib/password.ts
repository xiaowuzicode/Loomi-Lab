// 密码验证相关函数 - 仅在服务端 API 路由中使用
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 简单的明文密码验证（用于管理员账户）
export function verifyPlainPassword(inputPassword: string, actualPassword: string): boolean {
  return inputPassword === actualPassword
}