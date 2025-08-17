import { createClient } from 'redis'

// Redis客户端配置
const redisConfig = {
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
  password: process.env.REDIS_PASSWORD,
  database: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
}

// 优先使用REDIS_URL，如果没有则使用分别的配置
const getRedisConfig = () => {
  if (redisConfig.url) {
    return {
      url: redisConfig.url,
      socket: {
        connectTimeout: 10000,
        commandTimeout: 10000,
      },
      retry: {
        delay: (retries) => Math.min(retries * 100, 1000),
        retries: 5,
      },
    }
  } else if (redisConfig.host) {
    return {
      socket: {
        host: redisConfig.host,
        port: redisConfig.port || 6379,
        connectTimeout: 10000,
        commandTimeout: 10000,
      },
      password: redisConfig.password,
      database: redisConfig.database || 0,
      retry: {
        delay: (retries) => Math.min(retries * 100, 1000),
        retries: 5,
      },
    }
  } else {
    // 降级到本地Redis（开发环境）
    return {
      url: 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        commandTimeout: 5000,
      },
      retry: {
        delay: (retries) => Math.min(retries * 50, 500),
        retries: 3,
      },
    }
  }
}

// 显示使用的Redis配置（用于调试）
const finalConfig = getRedisConfig()
console.log('Redis配置信息:', {
  url: redisConfig.url ? '已设置' : '未设置',
  host: redisConfig.host || '未设置',
  port: redisConfig.port || '默认6379',
  hasPassword: !!redisConfig.password,
  database: redisConfig.database || '默认0',
  configType: redisConfig.url ? 'URL方式' : redisConfig.host ? '分别配置' : '本地默认'
})

// 导出Redis配置函数，支持自定义数据库
export { getRedisConfig }

// 创建指定数据库的Redis客户端
export function createRedisClient(database?: number) {
  const baseConfig = getRedisConfig()
  
  // 如果指定了数据库，需要修改配置
  if (database !== undefined) {
    if (baseConfig.url) {
      // URL方式需要解析并修改数据库
      const url = new URL(baseConfig.url)
      url.pathname = `/${database}`
      return createClient({
        ...baseConfig,
        url: url.toString()
      })
    } else {
      // 分别配置方式直接设置database
      return createClient({
        ...baseConfig,
        database: database
      })
    }
  }
  
  return createClient(baseConfig)
}

export const redis = createClient(finalConfig)

redis.on('error', (err) => {
  console.error('Redis Client Error:', err)
  console.error('当前Redis配置:', finalConfig)
})

redis.on('connect', () => {
  console.log('✅ Redis Client Connected')
  console.log('连接信息:', redisConfig.url || `${redisConfig.host}:${redisConfig.port}`)
})

redis.on('ready', () => {
  console.log('✅ Redis Client Ready')
})

// 初始化Redis连接
let isConnected = false

export async function initRedis() {
  if (!isConnected) {
    try {
      await redis.connect()
      isConnected = true
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }
  return redis
}

// 安全地执行Redis命令，带有错误处理和重试机制
export async function safeRedisCommand<T>(
  command: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    // 确保Redis已连接
    if (!isConnected) {
      await initRedis()
    }
    return await command()
  } catch (error) {
    // 只在调试模式下输出详细错误，减少日志噪音
    if (process.env.NODE_ENV === 'development') {
      console.warn('Redis command failed (using fallback):', (error as Error).message)
    }
    return fallback !== undefined ? fallback : null
  }
}

// 关闭Redis连接
export async function closeRedis() {
  if (isConnected) {
    await redis.quit()
    isConnected = false
  }
}

// 格式化日期为 YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 格式化月份为 YYYY-MM
export function formatMonth(date: Date): string {
  return date.toISOString().slice(0, 7)
}

// 获取日期范围
export function getDateRange(days: number): string[] {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(formatDate(date))
  }
  return dates
}

// 获取月份范围
export function getMonthRange(months: number): string[] {
  const monthList: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    monthList.push(formatMonth(date))
  }
  return monthList
}
