import { registerAs } from '@nestjs/config';

export const AppConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'loomi-lab-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },

  // Milvus 向量数据库配置
  milvus: {
    host: process.env.MILVUS_HOST || 'localhost',
    port: parseInt(process.env.MILVUS_PORT, 10) || 19530,
  },

  // 小红书 API 配置
  xiaohongshu: {
    apiUrl: process.env.XIAOHONGSHU_API_URL || 'https://api.xiaohongshu.com',
    appId: process.env.XIAOHONGSHU_APP_ID || '',
    appSecret: process.env.XIAOHONGSHU_APP_SECRET || '',
  },
}));
