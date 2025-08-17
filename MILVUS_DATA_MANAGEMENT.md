# 📊 Milvus 向量数据管理指南

## 🗂️ 数据删除方式总览

在Milvus向量数据库中，我们提供了4种不同级别的数据删除方式：

### 1. 🗑️ 删除整个知识库（Collection）
**作用**: 完全删除整个知识库，包括数据和结构
**适用场景**: 不再需要该知识库时
**特点**: 不可恢复，彻底删除

```typescript
// 前端调用
const { deleteKnowledgeBase } = useMilvus()
await deleteKnowledgeBase('lab_xiaohongshu_posts')

// API调用
DELETE /api/knowledge-base?collection=lab_xiaohongshu_posts&action=drop
```

### 2. 🧹 清空知识库数据
**作用**: 删除所有数据但保留集合结构
**适用场景**: 需要重新导入数据，但保留集合配置
**特点**: 保留集合schema，可以继续添加新数据

```typescript
// 前端调用
const { clearKnowledgeBase } = useMilvus()
await clearKnowledgeBase('lab_xiaohongshu_posts')

// API调用
DELETE /api/knowledge-base?collection=lab_xiaohongshu_posts&action=clear
```

### 3. 🎯 删除指定记录
**作用**: 删除特定ID的记录
**适用场景**: 删除错误或不需要的特定文档
**特点**: 精确删除，需要知道具体的文档ID

```typescript
// 前端调用
const { deleteEntities } = useMilvus()
await deleteEntities('lab_xiaohongshu_posts', ['doc_001', 'doc_002'])

// API调用
DELETE /api/knowledge-base?collection=lab_xiaohongshu_posts&action=entities
Body: { "ids": ["doc_001", "doc_002"] }
```

### 4. 📝 条件删除记录
**作用**: 根据表达式删除符合条件的记录
**适用场景**: 批量删除符合特定条件的数据
**特点**: 支持复杂查询条件，批量操作

```typescript
// 前端调用
const { deleteByCondition } = useMilvus()

// 删除特定作者的所有内容
await deleteByCondition('lab_xiaohongshu_posts', 'source like "某个作者%"')

// 删除点赞数低于100的内容
await deleteByCondition('lab_xiaohongshu_posts', 'likes < 100')

// API调用
DELETE /api/knowledge-base?collection=lab_xiaohongshu_posts&action=expression
Body: { "expression": "source like '某个作者%'" }
```

## 🔍 常用删除表达式

### 字符串字段条件
```sql
-- 包含特定内容
source like "%民宿%"

-- 精确匹配
source == "旅行达人小雨"

-- 不等于
source != "test_data"
```

### 数值字段条件
```sql
-- 数值比较
likes > 1000
favorites < 500
comments >= 100

-- 范围查询
likes between 100 and 1000
```

### 时间字段条件
```sql
-- 时间比较（需要时间戳格式）
created_at > 1640995200  -- 2022-01-01之后

-- 组合条件
created_at > 1640995200 and likes > 500
```

### 复合条件
```sql
-- AND条件
likes > 1000 and favorites > 500

-- OR条件  
likes > 2000 or favorites > 1000

-- 复杂组合
(likes > 1000 and favorites > 500) or comments > 200
```

## ⚠️ 删除操作注意事项

### 1. 数据备份
- **删除前备份**: 特别是批量删除前，建议先备份数据
- **测试环境**: 先在测试环境验证删除逻辑
- **分步执行**: 大量数据删除时，建议分批进行

### 2. 性能考量
- **批量删除**: 一次删除大量数据可能影响性能
- **索引重建**: 删除大量数据后，索引可能需要重建
- **内存使用**: 删除操作会占用额外内存

### 3. 一致性保证
- **事务性**: Milvus删除操作是事务性的
- **最终一致**: 删除可能不会立即生效（几秒内）
- **查询影响**: 删除期间查询结果可能不准确

## 🛠️ 在知识库管理页面中的使用

### 设置标签页的危险区域
在 `/knowledge-base-v2` 页面的"设置"标签页中，我们提供了可视化的删除操作：

1. **重建索引** - 优化搜索性能
2. **清空知识库** - 删除所有数据但保留结构  
3. **删除知识库** - 完全删除整个知识库

### 数据管理标签页
- **查看文档列表** - 可以选择特定文档进行删除
- **导入历史** - 查看导入记录，可以删除特定批次的数据

## 📋 删除操作最佳实践

### 1. 渐进式删除策略
```
1. 先用条件查询确认要删除的数据
2. 小批量测试删除
3. 确认无误后批量执行
4. 监控删除进度和系统状态
```

### 2. 数据清理流程
```
日常清理: 删除重复、错误数据
定期清理: 删除过期、低质量数据  
重构清理: 重新设计schema时清空重建
```

### 3. 错误恢复预案
```
备份策略: 定期备份重要数据
回滚机制: 保留删除前的数据快照
监控告警: 设置删除操作的监控
```

## 🚀 实战示例

假设你要清理 `lab_xiaohongshu_posts` 中的测试数据：

```typescript
// 1. 删除点赞数为0的测试数据
await deleteByCondition('lab_xiaohongshu_posts', 'likes == 0')

// 2. 删除标题包含"测试"的数据
await deleteByCondition('lab_xiaohongshu_posts', 'source like "%测试%"')

// 3. 删除特定日期前的数据
await deleteByCondition('lab_xiaohongshu_posts', 'created_at < 1640995200')

// 4. 如果需要完全重新开始
await clearKnowledgeBase('lab_xiaohongshu_posts')
```

## ❓ 常见问题

### Q: 删除后能恢复吗？
A: Milvus删除是不可逆的，建议删除前备份重要数据

### Q: 删除很慢怎么办？
A: 可以分批删除，或在低峰期进行大批量删除

### Q: 删除后查询还能找到数据？
A: 可能有几秒延迟，Milvus保证最终一致性

### Q: 如何删除重复数据？
A: 可以通过相似度搜索找到重复项，然后删除多余的记录

通过这些删除功能，你可以灵活管理Milvus中的向量数据，保持数据库的整洁和高效运行。
