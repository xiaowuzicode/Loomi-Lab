# Milvus 向量数据库集成文档

## 概述

本项目集成了 Zilliz Cloud (Milvus) 向量数据库，用于实现知识库管理和 RAG (Retrieval-Augmented Generation) 功能。

## 配置信息

### 数据库连接
- **服务提供商**: Zilliz Cloud
- **集群地址**: `https://in03-224856a9de916a8.api.gcp-us-west1.zillizcloud.com`
- **数据库名**: `db_224856a9de916a8`
- **用户名**: `db_224856a9de916a8`
- **密码**: `Cg4{%Flpa,++a~<w`

### 环境变量配置

在 `.env.local` 文件中添加以下配置：

```env
# Milvus Configuration (Zilliz Cloud)
MILVUS_ENDPOINT=https://in03-224856a9de916a8.api.gcp-us-west1.zillizcloud.com
MILVUS_USERNAME=db_224856a9de916a8
MILVUS_PASSWORD=Cg4{%Flpa,++a~<w
MILVUS_DATABASE=default
```

## 技术架构

### 1. 核心服务类 (`lib/milvus.ts`)

#### MilvusService
负责与 Milvus 数据库的基础交互：
- 连接管理
- 集合创建和管理
- 向量数据的插入和搜索
- 统计信息获取

#### DocumentProcessor
文档处理工具类：
- 文本分块处理
- 向量化（目前为模拟实现）
- 批量文档处理

#### RAGService
RAG 查询服务：
- 问题向量化
- 相似度搜索
- 上下文构建

### 2. API 路由 (`app/api/knowledge-base/route.ts`)

提供 RESTful API 接口：

#### GET 请求
- `?action=list` - 获取所有知识库集合
- `?action=stats&collection=<name>` - 获取特定集合统计
- `?action=health` - 检查连接状态

#### POST 请求
- `?action=create` - 创建新知识库
- `?action=add-document` - 添加文档到知识库
- `?action=query` - 执行 RAG 查询

#### DELETE 请求
- `?collection=<name>` - 删除指定集合

### 3. React Hooks (`hooks/useMilvus.ts`)

#### useMilvus Hook
提供前端组件与 Milvus 服务的交互：
- `fetchKnowledgeBases()` - 获取知识库列表
- `checkHealth()` - 检查连接状态
- `createKnowledgeBase(name, dimension)` - 创建知识库
- `addDocument(collection, text, source, metadata)` - 添加文档
- `ragQuery(collection, question, topK, minScore)` - RAG 查询
- `deleteKnowledgeBase(name)` - 删除知识库

#### useDocumentProcessor Hook
文档处理相关功能：
- `processFile(file)` - 处理单个文件
- `processFiles(files)` - 批量处理文件

## 使用方法

### 1. 创建知识库

```typescript
const { createKnowledgeBase } = useMilvus()

// 创建一个1536维的知识库（适用于 OpenAI text-embedding-ada-002）
await createKnowledgeBase('my_knowledge_base', 1536)
```

### 2. 添加文档

```typescript
const { addDocument } = useMilvus()

await addDocument(
  'my_knowledge_base',
  '这是文档内容...',
  'document.txt',
  { category: '技术文档', author: '张三' }
)
```

### 3. RAG 查询

```typescript
const { ragQuery } = useMilvus()

const result = await ragQuery(
  'my_knowledge_base',
  '如何使用向量数据库？',
  3,  // 返回top3结果
  0.5 // 最小相似度阈值
)

if (result) {
  console.log('查询结果:', result.sources)
}
```

### 4. 在页面中使用

```tsx
import { useMilvus } from '@/hooks/useMilvus'

export default function KnowledgeBasePage() {
  const {
    knowledgeBases,
    loading,
    error,
    fetchKnowledgeBases,
    createKnowledgeBase,
    addDocument,
    ragQuery
  } = useMilvus()

  useEffect(() => {
    fetchKnowledgeBases()
  }, [])

  // ... 组件逻辑
}
```

## 数据结构

### 集合 Schema
每个知识库集合包含以下字段：
- `id` (VarChar, Primary Key) - 文档唯一标识
- `vector` (FloatVector) - 文档向量表示
- `text` (VarChar) - 原始文本内容
- `source` (VarChar) - 文档来源
- `metadata` (VarChar) - 文档元数据 JSON
- `created_at` (Int64) - 创建时间戳

### 索引配置
- **索引类型**: IVF_FLAT
- **相似度度量**: IP (内积)
- **参数**: nlist=1024

## 测试页面

访问 `/test-milvus` 页面可以进行完整的功能测试：
1. 连接状态检查
2. 创建测试知识库
3. 添加测试文档
4. 执行 RAG 查询
5. 查看知识库列表

## 注意事项

### 1. 向量化实现
当前使用模拟向量数据，生产环境中需要集成真实的 Embedding API：
```typescript
// 需要替换 DocumentProcessor.generateEmbedding 方法
static async generateEmbedding(text: string): Promise<number[]> {
  // 调用 OpenAI Embedding API
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  })
  return response.data[0].embedding
}
```

### 2. 文件处理
当前仅支持简单的文本文件，需要扩展支持：
- PDF 文件解析
- Word 文档处理
- 网页内容提取
- 图片 OCR 识别

### 3. 性能优化
- 批量插入优化
- 连接池管理
- 缓存策略
- 异步处理

### 4. 安全性
- API 访问控制
- 数据加密
- 用户权限管理
- 敏感信息过滤

## 错误处理

常见错误及解决方案：

### 连接失败
- 检查网络连接
- 验证连接参数
- 确认 Zilliz Cloud 服务状态

### 集合不存在
- 先创建集合再进行操作
- 检查集合名称是否正确

### 向量维度不匹配
- 确保所有向量维度一致
- 检查 Embedding 模型配置

## 扩展功能

### 1. 多模态支持
- 图像向量化
- 音频处理
- 视频内容分析

### 2. 高级搜索
- 混合搜索（向量+关键词）
- 过滤条件支持
- 结果排序优化

### 3. 知识图谱
- 实体关系提取
- 图结构存储
- 关系推理

### 4. 实时更新
- 增量更新
- 版本控制
- 冲突解决

## 监控和运维

### 1. 性能监控
- 查询延迟统计
- 存储使用情况
- 连接状态监控

### 2. 日志管理
- 操作日志记录
- 错误日志分析
- 性能日志追踪

### 3. 备份恢复
- 数据备份策略
- 灾难恢复方案
- 版本回滚机制
