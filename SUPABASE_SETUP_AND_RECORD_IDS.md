# 🎯 Supabase设置 & Milvus记录ID查看指南

## ✅ **表名已更新为 `lab_` 前缀**

已将Supabase导入历史表名从 `import_history` 更新为 `lab_import_history`，保持与项目命名一致。

### 📋 **更新内容**
- **表名**: `public.import_history` → `public.lab_import_history`
- **索引名**: 所有索引都加上了 `lab_` 前缀
- **视图名**: 保持原名，但引用新表名
- **API代码**: 已同步更新表名引用

---

## 🤔 **关于数据库支持的问题**

### **导入历史功能是否必须用Supabase？**

**答案**: 不是必须的！你有3种选择：

#### **选择1: 使用Supabase数据库** ✅ **推荐**
- **优点**: 专业数据库，性能好，支持复杂查询，数据持久化
- **缺点**: 需要配置Supabase账户
- **状态**: 已完成，表名为 `lab_import_history`

#### **选择2: 使用本地文件存储** ✅ **简单**
- **优点**: 无需数据库，配置简单，数据存储在本地
- **缺点**: 性能有限，无法复杂查询，数据易丢失
- **状态**: 可以恢复到文件存储版本

#### **选择3: 不显示导入历史** ✅ **最简**
- **优点**: 无需额外配置，系统更简洁
- **缺点**: 无法查看上传历史记录
- **状态**: 隐藏UI中的导入历史部分

---

## 🔍 **如何查看Milvus记录ID**

### **方法1: 通过前端UI查看**

1. **访问知识库管理页面**:
   ```
   http://localhost:3000/knowledge-base-v2
   ```

2. **选择知识库 → RAG召回测试**:
   - 输入任意查询词（如："民宿"、"内容"）
   - 点击"开始搜索"
   - 在搜索结果中可以看到每条记录的详细信息

3. **查看记录信息**:
   - **记录ID**: 每个结果都显示唯一ID
   - **相似度分数**: 用于判断相关性
   - **内容预览**: 记录的具体内容
   - **元数据**: 包含标题、点赞数、收藏数等

### **方法2: 通过API直接查询**

```bash
# RAG搜索获取记录信息
curl -X POST "http://localhost:3000/api/knowledge-base/rag" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "lab_xiaohongshu_posts",
    "query": "民宿", 
    "topK": 10
  }'
```

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_001_timestamp",
      "content": "厦门鼓浪屿海景民宿...",
      "similarity": 0.85,
      "metadata": {
        "title": "厦门鼓浪屿海景民宿",
        "likes": 2856,
        "favorites": 1347,
        "comments": 289
      }
    }
  ]
}
```

### **方法3: 查看完整记录结构**

记录ID通常格式为: `{prefix}_{timestamp}_{random}`

**示例ID格式**:
- `doc_1703123456789_abc123`
- `post_1703123456789_def456`

---

## 🗑️ **删除记录的具体方法**

### **1. 删除指定ID的记录**
```javascript
// 前端调用
const { deleteEntities } = useMilvus()
await deleteEntities('lab_xiaohongshu_posts', ['doc_001', 'doc_002'])

// API调用
DELETE /api/knowledge-base?collection=lab_xiaohongshu_posts&action=entities
Body: { "ids": ["doc_001", "doc_002"] }
```

### **2. 条件删除记录**
```javascript
// 删除点赞数少于100的记录
DELETE /api/knowledge-base?collection=lab_xiaohongshu_posts&action=expression
Body: { "expression": "likes < 100" }

// 删除无评论的记录
Body: { "expression": "comments = 0" }

// 复合条件
Body: { "expression": "likes < 100 and comments < 10" }
```

### **3. 清空所有数据**
```javascript
// 删除所有数据但保留结构
DELETE /api/knowledge-base?collection=lab_xiaohongshu_posts&action=clear
```

### **4. 删除整个知识库**
```javascript
// 完全删除知识库
DELETE /api/knowledge-base?collection=lab_xiaohongshu_posts&action=drop
```

---

## 📊 **Supabase表结构**

如果选择使用Supabase，需要执行的表结构：

```sql
-- 新的表名: lab_import_history
CREATE TABLE IF NOT EXISTS public.lab_import_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    imported_count INTEGER DEFAULT 0,
    error_message TEXT,
    field_mappings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

---

## 🚀 **下一步操作建议**

### **如果选择Supabase方案**:
1. 在Supabase控制台执行 `create_import_history_table.sql`
2. 验证表创建成功
3. 测试导入历史功能

### **如果选择文件存储方案**:
1. 告诉我，我将恢复文件存储版本
2. 无需任何数据库配置
3. 数据存储在项目的 `data/` 目录

### **如果不需要导入历史**:
1. 告诉我，我将隐藏相关UI
2. 保留其他所有功能
3. 简化界面

---

## 🔧 **当前功能状态**

| 功能 | 状态 | 依赖 |
|------|------|------|
| 知识库管理 | ✅ 正常 | Milvus |
| 文件上传 | ✅ 正常 | Milvus |
| RAG搜索 | ✅ 正常 | Milvus + OpenAI |
| 记录删除 | ✅ 正常 | Milvus |
| 危险区域操作 | ✅ 正常 | Milvus |
| 导入历史显示 | ⚠️  需配置 | Supabase 或文件 |

## 💡 **推荐选择**

- **如果你已在使用Supabase** → 建议用Supabase方案
- **如果想要最简配置** → 建议用文件存储方案  
- **如果不关心历史记录** → 建议隐藏导入历史

**所有删除功能和记录查看都已完全可用，不依赖Supabase！** 🎉
