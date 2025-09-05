# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Loomi-Lab 是一个基于 Next.js 14 的全栈后台管理平台，专为管理面向社媒的多智能体系统而设计。采用现代化的玻璃形态设计风格，深色主题优先，科技蓝/深邃紫配色方案。

## 核心技术架构

### 技术栈
- **前端**: Next.js 14 (App Router), React 18, TypeScript
- **UI框架**: Chakra UI + Tailwind CSS
- **状态管理**: Zustand + React Query (@tanstack/react-query)
- **动画**: Framer Motion
- **图表**: Recharts
- **数据库**: Supabase (PostgreSQL)
- **缓存**: Redis (阿里云)
- **向量数据库**: Milvus (多环境支持：本地/托管/阿里云)
- **API**: OpenAI兼容接口 (支持Claude模型)

### 项目结构
```
app/
├── api/           # API Routes (Next.js App Router)
├── dashboard/     # 统计仪表板
├── users/         # 用户管理
├── payments/      # 支付管理
├── prompts/       # 提示词管理
├── knowledge-base-v2/ # 知识库管理
├── content-library/   # 内容库管理
├── strategy-library/  # 策略库管理
└── xiaohongshu/   # 小红书管理

components/
├── ui/            # 基础UI组件
├── layout/        # 布局组件
├── modals/        # 模态框组件
└── [feature]/     # 功能特定组件

lib/
├── db.ts          # Supabase数据库客户端
├── milvus.ts      # Milvus向量数据库服务
├── redis.ts       # Redis缓存服务
├── auth.ts        # 认证工具
└── utils.ts       # 通用工具函数
```

## 开发命令

### 开发环境
```bash
npm run dev          # 启动开发服务器 (localhost:3000)
```

### 代码质量
```bash
npm run lint         # ESLint 检查
npm run lint:fix     # 自动修复 ESLint 问题
npm run type-check   # TypeScript 类型检查
```

### 构建部署
```bash
npm run build        # 生产构建
npm start           # 启动生产服务器
```

## 数据库架构

### Supabase 表结构
- `users` - 用户信息 (通过RPC函数访问 auth.users)
- `payments` - 支付记录
- `prompts` - 提示词管理
- `content_items` - 内容库条目
- `xiaohongshu_accounts` - 小红书账号管理
- `xiaohongshu_posts` - 小红书发布内容
- `system_configs` - 系统配置

### 重要SQL函数
项目使用自定义PostgreSQL函数实现复杂查询：
- `lab_search_users()` - 用户搜索
- `lab_get_user_stats_summary()` - 用户统计摘要
- `lab_get_daily_new_users_count()` - 每日新增用户
- 查看 `*.sql` 文件了解完整函数定义

### 数据访问模式
- 使用 `lib/supabase.ts` 中的 `UserStorage` 和 `PaymentStorage` 类
- API Routes 使用 `supabaseServiceRole` 绕过RLS权限
- 前端组件使用 `supabase` 客户端实例

## Milvus向量数据库

### 环境配置
支持三种Milvus环境（通过 `MILVUS_DEFAULT_ENV` 控制）：
- `local` - 本地Docker部署
- `hosted` - Zilliz Cloud托管服务  
- `aliyun` - 阿里云服务

### 核心功能
- 向量化内容检索 (RAG)
- 小红书内容向量化存储
- 多环境无缝切换
- 自动连接重试机制

## API架构

### 认证系统
- JWT基础认证 (`lib/auth.ts`)
- 路由保护中间件
- 用户角色管理 (admin/user)

### API路由规范
```
/api/auth/*        # 认证相关
/api/dashboard/*   # 仪表板数据
/api/users/*       # 用户管理
/api/payments/*    # 支付管理
/api/prompts/*     # 提示词管理
/api/knowledge-base/* # 知识库管理
/api/content-library/* # 内容库管理
```

## 样式与UI设计

### 设计系统
- **主色调**: 科技蓝 (#3b82f6) 到深邃紫渐变
- **设计风格**: 玻璃形态 (Glassmorphism)
- **暗色主题**: 默认深色模式，支持亮色切换
- **动画**: Framer Motion提供微交互反馈

### Tailwind配置
- 扩展颜色调色板 (primary, success, warning, danger, dark)
- 自定义字体 (Inter)
- 动画关键帧 (fadeIn, slideUp)

### 组件规范
- 所有UI组件位于 `components/ui/`
- 功能组件按模块分类 (`components/[feature]/`)
- 使用Chakra UI基础组件 + Tailwind工具类

## 开发规范

### 导入规范
- 所有相对导入改为绝对导入 (使用 `@/` 前缀)
- tsconfig.json已配置路径映射

### 代码风格
- 使用TypeScript严格模式
- 函数组件优先，使用React Hooks
- 遵循ESLint配置规则

### 环境变量
参考 `env.example` 配置必需的环境变量：
- Supabase配置 (URL, Keys)
- Milvus多环境配置
- Redis缓存配置
- OpenAI API配置

## 部署说明

### Next.js配置
- App Router模式，使用服务端组件
- 根路径重定向到 `/dashboard`
- 实验性功能启用外部包支持 (`pg`, `redis`, `bcrypt`)

### Docker化
项目支持完整Docker化部署：
- 多阶段构建
- 容器化数据库连接
- 生产环境优化

## 特殊注意事项

### 用户管理
由于Supabase RLS限制，用户数据访问通过RPC函数实现，不能直接操作 `auth.users` 表。

### Milvus连接
向量数据库连接可能不稳定，代码中包含重试机制和降级处理。

### Redis缓存
使用阿里云Redis，注意连接池管理和错误处理。

### 图片代理
实现了图片代理服务 (`/api/image-proxy`) 处理跨域图片访问。

## 测试与调试

### 调试工具
- 多个调试API端点 (`/api/debug-*`)
- 数据库诊断 (`/api/diagnosis`)
- Redis状态检查

### 常见问题
- 数据库连接问题：检查Supabase配置和网络
- Milvus连接失败：验证环境变量和网络可达性  
- 图片加载问题：使用图片代理服务

## 业务功能模块

### 核心功能
1. **统计仪表板** - 实时数据监控和可视化
2. **用户管理** - 完整的用户生命周期管理
3. **支付管理** - 订单追踪和财务统计
4. **AI资产管理** - 知识库、提示词、策略管理
5. **小红书自动化** - 账号矩阵和内容发布
6. **系统配置** - 灵活的元数据配置

### 数据流
- 用户交互 → React组件 → API Routes → Supabase/Redis/Milvus
- 实时数据通过React Query缓存和同步
- 向量检索通过Milvus RAG系统实现