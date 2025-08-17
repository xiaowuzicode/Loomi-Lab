/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    serverComponentsExternalPackages: ['pg', 'redis', 'bcrypt'],
  },
  
  // 环境变量配置
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },

  // API 路由配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // 静态文件优化
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // 开发环境跨域配置
  allowedDevOrigins: ['127.0.0.1'],

  // 编译配置
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
