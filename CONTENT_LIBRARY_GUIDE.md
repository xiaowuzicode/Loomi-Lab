# 爆文库管理系统设计文档

## 概述

本系统为 Loomi-Lab 项目设计了完整的爆文库管理功能，包括数据库设计、API接口、前端界面和数据导入功能。

## 1. 数据库设计

### 主表结构：`content_library`

**基础字段：**
- `id` - 主键 (UUID)
- `title` - 标题 (必填)
- `content` - 内容正文 (必填)
- `description` - 内容摘要
- `author` - 作者
- `source_url` - 原文链接

**分类和平台：**
- `category` - 分类 (必填：穿搭、美妆、居家、健康等)
- `platform` - 平台 (必填：小红书、抖音、微博等)
- `hot_category` - 热门程度 (viral/trending/normal)
- `status` - 状态 (published/draft/archived)

**媒体资源：**
- `thumbnail_url` - 封面图片URL
- `images_urls` - 图片URL数组 (JSONB)
- `video_url` - 视频URL

**数据统计：**
- `views_count` - 浏览量
- `likes_count` - 点赞数
- `shares_count` - 分享数
- `comments_count` - 评论数
- `favorites_count` - 收藏数
- `engagement_rate` - 互动率 (%)

**评论和标签：**
- `top_comments` - 前5个热门评论 (JSONB)
- `tags` - 标签数组 (JSONB)
- `keywords` - 关键词数组 (JSONB)

**时间字段：**
- `published_at` - 发布时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 数据库特性

- 完整的索引策略 (分类、平台、状态、时间等)
- 全文搜索索引 (中文支持)
- GIN索引用于JSON字段查询
- 自动更新触发器
- 统计视图 `content_library_stats`

## 2. API接口设计

### 内容管理 API (`/api/content-library`)

**GET** - 获取内容列表
- 支持分页 (`page`, `limit`)
- 支持筛选 (`category`, `platform`, `status`)
- 支持搜索 (`search`)
- 支持排序 (`sortBy`, `sortOrder`)

**POST** - 创建新内容
- 验证必填字段
- 自动数据清理和格式化

**PUT** - 更新内容
- 支持部分更新
- 数据验证和范围检查

**DELETE** - 删除内容
- 根据ID删除

### 导入功能 API (`/api/content-library/import`)

**GET** - 下载导入模板
- 返回JSON格式模板文件
- 包含示例数据

**POST** - 批量导入数据
- 支持JSON格式数据导入
- 数据验证和错误处理
- 重复内容检测
- 详细的导入结果报告

### 统计 API (`/api/content-library/stats`)

**GET** - 获取统计数据
- 总体统计数据
- 按分类/平台统计
- 热门程度统计
- 最近7天趋势数据

## 3. 前端界面功能

### 主页面特性

**统计仪表板：**
- 内容总数
- 总浏览量
- 总点赞数
- 总评论数
- 总收藏数
- 平均互动率

**搜索和筛选：**
- 全文搜索 (标题、内容、作者)
- 分类筛选
- 平台筛选
- 状态筛选
- 标签筛选

**内容展示：**
- 卡片式布局
- 热门程度标识
- 完整数据统计
- 多媒体预览
- 操作菜单

**功能按钮：**
- 新建内容
- 导入数据
- 查看详情
- 编辑内容
- 删除内容

### 导入功能

**ImportModal 组件：**
- 模板下载功能
- 文件上传验证
- 导入选项配置
- 进度显示
- 详细结果报告

**导入流程：**
1. 下载模板了解格式
2. 准备JSON数据文件
3. 选择是否覆盖已存在内容
4. 上传并开始导入
5. 查看导入结果

## 4. 技术实现

### 后端技术栈
- **Next.js API Routes** - API接口
- **Supabase** - 数据库和认证
- **TypeScript** - 类型安全

### 前端技术栈
- **React + TypeScript** - 组件开发
- **Chakra UI** - UI组件库
- **Framer Motion** - 动画效果
- **Custom Hooks** - 状态管理

### 数据管理
- **useContentLibrary Hook** - 统一数据管理
- **实时数据同步** - 自动刷新
- **错误处理** - 友好的错误提示
- **Loading状态** - 用户体验优化

## 5. 使用指南

### 1. 数据库初始化
```sql
-- 执行建表语句
\i create_content_library_table.sql
```

### 2. 数据导入
1. 访问爆文库管理页面
2. 点击"导入数据"按钮
3. 先下载导入模板
4. 按照模板格式准备数据
5. 上传JSON文件进行导入

### 3. 内容管理
- **新建内容**：点击"新建内容"按钮
- **搜索内容**：使用搜索框和筛选条件
- **查看详情**：点击内容卡片的"更多"菜单
- **编辑内容**：在菜单中选择"编辑内容"
- **删除内容**：在菜单中选择"删除内容"

## 6. 数据模板格式

```json
[
  {
    "title": "内容标题",
    "content": "内容正文",
    "description": "内容摘要",
    "author": "作者名称",
    "source_url": "原文链接",
    "category": "分类名称",
    "platform": "平台名称",
    "hot_category": "viral|trending|normal",
    "status": "published|draft|archived",
    "thumbnail_url": "封面图片URL",
    "images_urls": ["图片URL1", "图片URL2"],
    "video_url": "视频URL",
    "views_count": 0,
    "likes_count": 0,
    "shares_count": 0,
    "comments_count": 0,
    "favorites_count": 0,
    "engagement_rate": 0.0,
    "top_comments": [
      {
        "author": "评论者",
        "content": "评论内容",
        "likes": 0
      }
    ],
    "tags": ["标签1", "标签2"],
    "keywords": ["关键词1", "关键词2"],
    "published_at": "2024-01-01T00:00:00Z"
  }
]
```

## 7. 文件结构

```
project/
├── create_content_library_table.sql     # 数据库建表语句
├── app/api/content-library/
│   ├── route.ts                          # 内容CRUD API
│   ├── import/route.ts                   # 导入功能API
│   └── stats/route.ts                    # 统计数据API
├── hooks/useContentLibrary.ts            # 内容库管理钩子
├── components/content-library/
│   └── ImportModal.tsx                   # 导入模态框组件
├── app/content-library/page.tsx          # 主页面组件
└── types/index.ts                        # TypeScript类型定义
```

## 8. 特性亮点

- **完整的数据模型** - 涵盖爆文分析的所有维度
- **灵活的搜索筛选** - 多维度内容发现
- **批量导入功能** - 高效的数据录入
- **实时统计仪表板** - 数据可视化展示
- **响应式设计** - 适配各种屏幕尺寸
- **TypeScript支持** - 类型安全的开发体验
- **错误处理机制** - 用户友好的错误提示
- **性能优化** - 分页、索引、缓存等优化策略

这个系统为 Loomi-Lab 提供了完整的爆文内容管理解决方案，支持从数据导入到内容分析的全流程操作。
