# Posts Library 向量化功能技术方案（草案）

## 范围
- 新增的 3 个接口：
  1. `GET /api/posts-library/vectorization/pending`
  2. `POST /api/posts-library/vectorization`
  3. `POST /api/posts-library/vector-search`
- 目标是在现有 Next.js + Supabase 架构下，实现帖子向量化、查询与相似度检索能力，复用策略库的 OpenAI/Milvus 依赖。

## 数据基础
- `knowledge_base.embedding`：`vector` 类型（1536 维，cosine 索引 `knowledge_base_embedding_idx` 已创建）。
- 依赖 `OPENAI_API_KEY`、`OPENAI_EMBEDDING_MODEL`（默认 `text-embedding-3-small`）。
- 加权规则：先分别计算 `Emb(title)`、`Emb(content)`，再按 `0.7` 与 `0.3` 做线性组合并归一化，写回 `embedding` 列。

## 实现要点

### 1. 待向量化帖子查询
- **参数校验**：沿用现有 `/api/posts-library` 的 `userId` UUID 校验与分页逻辑（`Math.max`/`Math.min` 限制页码与条数）。
- **查询**：`supabaseServiceRole.from('knowledge_base')`，过滤条件 `eq('user_id', userId).is('embedding', null)`；按 `created_at` 或 `updated_at` 倒序，便于优先处理最新内容。
- **字段**：仅返回 `id`, `created_at`, `updated_at`，供前端呈现与批量任务定位；向量化任务在后台按 `id` 再次读取完整文本内容。
- **统计**：同一个查询实例使用 `select('id', { count: 'exact', head: true })` 获取总数，方便分页。

### 2. 批量向量化
- **入口参数**：`userId` 必填，`ids` 可选；未提供 `ids` 时先查库取所有 `embedding` 为空的记录（需限制单次批量数，例如 200 条以内）。`concurrency` 限制并发（默认 5，最大 10）。
- **数据拉取**：使用 `supabaseServiceRole` 单次批量取回目标记录（`in('id', ids)`），对缺失/跨用户数据直接跳过并标记失败。
- **并行执行**：引入轻量并发控制（如 `p-limit` 或自定义信号量）逐条调用 OpenAI 接口。
- **向量计算**：
  1. `titleEmbedding = openaiEmbedding(title)`，为空时可使用空字符串；
  2. `contentEmbedding = openaiEmbedding(content)`，为空文本返回 0 向量；
  3. `combined = normalize(0.7 * titleEmbedding + 0.3 * contentEmbedding)`（需逐元素相加后做 L2 归一化）。
- **写回**：调用 Supabase `update({ embedding: combined })`，同时清理可能存在的错误标记；失败时写 `meta_data` 中的错误信息或记录在响应数组。
- **结果聚合**：统计总处理数/成功数/失败数，返回每条记录的状态与错误原因。
- **重试策略**：对于 OpenAI 报错（429/5xx）可在代码中增加指数退避重试一次；若仍失败，纳入失败数组，保留待后续手动触发。

### 3. 相似度检索
- **参数校验**：`userId`（UUID）、`query`（非空字符串）、`topK`（1–10）、`minScore`（0–1 之间）。
- **查询向量**：调用与向量化相同的 embedding 模型（本场景只有 query 字符串，不做加权）。若 query 超长，可截断至 8k tokens。
- **数据库检索**：
  - 使用 Supabase 的 SQL/RPC（可新增一个 SQL 函数），执行 `SELECT ... FROM knowledge_base WHERE user_id = :userId AND embedding IS NOT NULL ORDER BY embedding <#> :query LIMIT :topK`；`<#>` 对应 cosine 距离运算符。
  - 过滤 `score >= minScore`（score = 1 - cosine similarity，可以在 SQL 中计算）。
- **返回字段**：`id,user_id,title,content_type,content,author,tags,score`，其中 `score` = 余弦相似度（0–1，越大越相似）。
- **回退方案**：若向量列为空或未开启 pgvector，可检测后返回错误提示。

## 复用与封装建议
- 抽象一个 `generatePostEmbedding(title, content)` 工具函数，封装权重、空值处理与归一化逻辑，供批量向量化与未来实时写入复用。
- 公共的 `validateUserId`, `fetchUserPostsByIds` 可提取到 `lib/posts.ts`（若未来会扩展更多操作）。
