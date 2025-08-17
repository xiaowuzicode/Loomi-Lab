# 🚀 Loomi-Lab | 智能体管理平台

基于 **Next.js 14** 的现代化全栈后台管理平台，专为管理面向社媒的多智能体系统而设计。

## ✨ 特性

### 🎨 现代化设计
- **深色主题优先**：科技蓝/深邃紫配色方案
- **玻璃形态设计**：毛玻璃效果与精致阴影
- **流畅微交互**：Framer Motion 动画与过渡效果
- **响应式布局**：完美适配桌面端和移动端

### 📊 数据驱动
- **实时统计看板**：用户、收入、Token 消耗等核心指标
- **交互式图表**：基于 Recharts 的美观数据可视化
- **智能分析**：趋势分析与增长率计算

### 🛠️ 技术栈
- **前端框架**：Next.js 14 (App Router)
- **UI 组件库**：Chakra UI + Tailwind CSS
- **动画库**：Framer Motion
- **图表库**：Recharts
- **状态管理**：Zustand + React Query
- **数据库**：Supabase (PostgreSQL)
- **缓存**：Redis (可选)
- **向量数据库**：Milvus (可选)

## 🏗️ 项目结构

```
Loomi-Lab/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (后端逻辑)
│   │   ├── auth/          # 认证相关 API
│   │   ├── dashboard/     # 仪表板 API
│   │   └── ...
│   ├── dashboard/         # 仪表板页面
│   ├── login/            # 登录页面
│   ├── users/            # 用户管理页面
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── providers.tsx     # 全局 Providers
├── components/            # 可复用组件
│   ├── ui/               # UI 基础组件
│   │   ├── Card.tsx      # 卡片组件
│   │   ├── StatCard.tsx  # 统计卡片
│   │   ├── AnimatedChart.tsx # 动画图表
│   │   └── GlowingButton.tsx # 发光按钮
│   └── layout/           # 布局组件
│       ├── Header.tsx    # 顶部导航
│       ├── Sidebar.tsx   # 侧边栏
│       └── PageLayout.tsx # 页面布局
├── lib/                  # 工具库
│   ├── auth.ts          # 认证工具
│   ├── db.ts            # 数据库连接
│   ├── theme.ts         # Chakra UI 主题
│   └── utils.ts         # 通用工具函数
├── types/               # TypeScript 类型定义
└── public/             # 静态资源
```

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd Loomi-Lab
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
cp env.local.example .env.local
# 编辑 .env.local 文件，填入你的配置
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📱 页面功能

### 🏠 仪表板 (`/dashboard`)
- **核心指标卡片**：总用户数、活跃用户、总收入、Token 消耗
- **趋势图表**：用户增长、收入趋势、Token 消耗统计
- **实时数据**：热门功能、平台状态、最新动态

### 👥 用户管理 (`/users`)
- 用户列表与搜索
- 用户详情与编辑
- 权限管理

### 💳 支付管理 (`/payments`)
- 订单列表与筛选
- 支付状态跟踪
- 财务报表

### 🧠 知识库管理 (`/knowledge-base-v2`)
- 向量库管理
- RAG 召回测试
- 文档上传与处理

### 📚 爆文库管理 (`/content-library`)
- 内容分类与标签
- 性能分析
- 内容推荐

### ✍️ 提示词管理 (`/prompts`)
- 提示词模板
- 变量管理
- 使用统计

### 📱 小红书管理 (`/xiaohongshu`)
- 账号矩阵管理
- 内容发布器
- 定时任务日历

### ⚙️ 系统配置 (`/system-config`)
- 系统参数配置
- 元数据管理

## 🎨 设计系统

### 色彩方案
- **主色调**：科技蓝 (#3b82f6)
- **辅助色**：深邃紫 (#8b5cf6)
- **成功色**：活性绿 (#22c55e)
- **警告色**：警告橙 (#f59e0b)
- **危险色**：危险红 (#ef4444)

### 组件特性
- **玻璃形态**：毛玻璃背景与模糊效果
- **发光效果**：按钮与图标的霓虹发光
- **流畅动画**：页面切换与组件交互动效
- **智能阴影**：根据主题自动调整的阴影效果

## 🔧 开发指南

### 添加新页面
1. 在 `app/` 目录下创建新的路由文件夹
2. 创建 `page.tsx` 文件
3. 在 `components/layout/Sidebar.tsx` 中添加导航项

### 创建新组件
1. 在 `components/ui/` 或 `components/layout/` 中创建组件文件
2. 使用 TypeScript 定义 Props 接口
3. 遵循现有的设计系统和动画模式

### API 路由
1. 在 `app/api/` 目录下创建路由文件
2. 使用 Next.js 13+ 的新 API 路由格式
3. 实现认证中间件保护敏感接口

## 📦 构建部署

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

### Docker 部署
```bash
# 构建镜像
docker build -t loomi-lab .

# 运行容器
docker run -p 3000:3000 loomi-lab
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 团队

由 **BlueFocus Team** 精心打造 ❤️

---

**🌟 如果这个项目对你有帮助，请给我们一个 Star！**