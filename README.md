# Loomi-Lab 🚀

> 基于 NestJS 的全栈后台管理平台，用于管理面向社媒的多智能体系统

## 📋 项目概述

Loomi-Lab 是一个强大、高效的后台管理系统，专门用于集中管理和监控面向社交媒体的多智能体系统。通过数据驱动运营，提升AI智能体的表现和商业价值。

### 🎯 核心功能

- **📊 统计分析看板** - DAU、新增用户、Token消耗、收入分析
- **👥 用户管理** - 用户生命周期管理、权限控制
- **💳 支付管理** - 订单财务追踪、支付状态管理  
- **🧠 知识库管理** - 人设向量库、RAG系统、文档管理
- **📚 爆文库管理** - 优质内容模板、关键词搜索
- **✍️ 提示词管理** - AI提示词优化、版本管理
- **📱 小红书管理** - 账号矩阵、定时发布、内容自动化
- **⚙️ 系统配置** - 参数配置、价格管理

## 🏗️ 技术架构

### 后端技术栈
- **框架**: NestJS (Node.js)
- **数据库**: Supabase (PostgreSQL)
- **缓存**: Redis
- **向量库**: Milvus
- **认证**: JWT + Passport

### 前端技术栈
- **框架**: React 18 + Vite
- **UI库**: Chakra UI + Tailwind CSS
- **状态管理**: Zustand + React Query
- **图表**: Recharts
- **表格**: TanStack Table

### 部署方案
- **容器化**: Docker + Docker Compose
- **架构**: 单体应用 (NestJS 同时提供 API 和静态文件服务)

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. 克隆项目
```bash
git clone <repository-url>
cd Loomi-Lab
```

### 2. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 3. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

### 4. 启动开发环境

#### 方式一：分别启动前后端
```bash
# 启动后端 (终端1)
npm run start:dev

# 启动前端 (终端2)  
npm run client:dev
```

#### 方式二：使用 Docker Compose
```bash
docker-compose up -d
```

### 5. 访问应用
- 前端应用: http://localhost:5173
- 后端API: http://localhost:3000/api
- API文档: http://localhost:3000/api-docs

## 📁 项目结构

```
Loomi-Lab/
├── src/                    # NestJS 后端源码
│   ├── modules/           # 业务模块
│   │   ├── auth/         # 认证模块
│   │   ├── users/        # 用户管理
│   │   ├── payments/     # 支付管理
│   │   ├── dashboard/    # 仪表板
│   │   └── ...
│   ├── common/           # 公共组件
│   ├── config/          # 配置文件
│   └── main.ts          # 应用入口
├── client/              # React 前端源码
│   ├── src/
│   │   ├── components/  # UI组件
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # API服务
│   │   └── contexts/    # React上下文
│   └── package.json
├── public/              # 静态文件目录
├── Dockerfile           # Docker构建文件
├── docker-compose.yml   # Docker编排文件
└── package.json         # 项目配置
```

## 🔧 开发指南

### 后端开发
```bash
# 启动开发服务器
npm run start:dev

# 构建项目
npm run build

# 运行测试
npm run test
```

### 前端开发
```bash
cd client

# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 📊 核心功能模块

### Epic 1: 平台基础与统计分析看板
- ✅ 核心指标总览 (DAU、新增用户、Token消耗、收入)
- ✅ 用户活跃度趋势图
- ✅ Token消耗分布分析
- ✅ 收入分析图表

### Epic 2: 用户与支付中心  
- 🔄 用户搜索与管理
- 🔄 支付订单追踪
- 🔄 财务报表导出

### Epic 3: AI核心资产管理
- 🔄 人设向量库管理
- 🔄 RAG召回测试
- 🔄 文档上传与处理

### Epic 4: 小红书自动化与内容管理
- 🔄 账号矩阵管理
- 🔄 定时发布日历
- 🔄 爆文库搜索应用

### Epic 5: 系统配置中心
- 🔄 Token计费配置
- 🔄 系统参数管理

## 🐳 Docker 部署

### 构建镜像
```bash
docker build -t loomi-lab .
```

### 使用 Docker Compose
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📝 API 文档

启动应用后访问 http://localhost:3000/api-docs 查看完整的 API 文档。

### 主要 API 端点

- `POST /api/auth/login` - 用户登录
- `GET /api/dashboard/overview` - 获取概览数据
- `GET /api/users` - 获取用户列表
- `GET /api/payments` - 获取支付记录
- `GET /api/knowledge-base` - 获取知识库列表

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 运行端到端测试
npm run test:e2e

# 生成测试覆盖率报告
npm run test:cov
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 团队

- **BlueFocus Team** - *项目开发* 

## 📞 联系我们

如有问题或建议，请通过以下方式联系我们：
- 邮箱: dev@bluefocus.com
- 项目地址: [GitHub](https://github.com/your-org/loomi-lab)

---

⭐ 如果这个项目对你有帮助，请给我们一个 Star！
