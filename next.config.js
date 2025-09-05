/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    serverComponentsExternalPackages: [
      'pg', 
      'redis', 
      'bcrypt', 
      '@mapbox/node-pre-gyp',
      'node-pre-gyp',
      'bcryptjs'
    ],
  },
  
  // Webpack 配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // 排除服务端模块避免客户端打包
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        os: false,
        path: false,
      }
      
      // 完全排除服务端模块
      config.externals = config.externals || []
      config.externals.push({
        '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
        'node-pre-gyp': 'commonjs node-pre-gyp',
        'bcrypt': 'commonjs bcrypt',
        'pg': 'commonjs pg',
        'redis': 'commonjs redis',
      })
    }
    
    // 忽略可能导致问题的文件
    config.module.rules.push(
      {
        test: /\.html$/,
        use: 'ignore-loader'
      },
      {
        test: /node_modules\/@mapbox\/node-pre-gyp\/lib\/.*\.html$/,
        use: 'ignore-loader'
      }
    )
    
    return config
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
