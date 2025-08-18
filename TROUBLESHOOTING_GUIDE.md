# 小红书数据导入故障排查指南

## 问题症状
- 小红书数据导入失败
- 显示"数据插入失败"错误
- 导入过程中断或超时

## 快速诊断

### 1. 使用内置诊断工具
1. 打开知识库管理页面 (`/knowledge-base-v2`)
2. 点击右上角的设置图标 ⚙️
3. 选择"系统诊断"
4. 查看诊断报告，根据建议进行修复

### 2. 常见问题及解决方案

#### A. Milvus连接问题

**症状**: 连接测试失败，显示连接超时或认证失败

**解决方案**:
1. **本地环境**:
   ```bash
   # 检查Docker容器是否运行
   docker ps | grep milvus
   
   # 如果没有运行，启动Milvus
   docker-compose up -d milvus-standalone
   ```

2. **托管环境**:
   - 检查 `MILVUS_HOSTED_URL` 和 `MILVUS_HOSTED_TOKEN` 是否正确
   - 确认网络连接正常
   - 验证token是否过期

3. **配置检查**:
   ```env
   # .env.local 文件配置示例
   MILVUS_ENDPOINT=http://localhost:19530  # 注意需要http://前缀
   MILVUS_DATABASE=default
   ```

#### B. OpenAI API配置问题

**症状**: 向量化失败，显示embedding错误

**解决方案**:
1. 确认API Key配置:
   ```env
   OPENAI_API_KEY=your-api-key-here
   OPENAI_BASE_URL=https://api.openai.com/v1  # 或自定义地址
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   ```

2. 测试API连接:
   ```bash
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

#### C. 数据格式问题

**症状**: JSON解析失败，数据验证错误

**解决方案**:
1. **JSON格式要求**:
   ```json
   {
     "data": [
       {
         "title": "帖子标题",
         "content": "帖子内容",
         "author": "作者",
         "likes": 100,
         "tags": ["标签1", "标签2"]
       }
     ]
   }
   ```

2. **字段映射**:
   - `title`: 必需，帖子标题
   - `content`: 必需，帖子内容  
   - `author`: 可选，作者名称
   - `likes`: 可选，点赞数
   - `tags`: 可选，标签数组

3. **文件大小限制**: 最大10MB

#### D. 权限问题

**症状**: 集合创建失败，写入权限不足

**解决方案**:
1. 检查Milvus用户权限
2. 确认集合名称符合规范（字母开头，只包含字母数字下划线）
3. 本地环境确认Milvus配置无认证限制

## 详细排查步骤

### 步骤1: 环境验证
```bash
# 检查环境变量
echo $MILVUS_ENDPOINT
echo $OPENAI_API_KEY

# 检查网络连接
curl -v $MILVUS_ENDPOINT/health
```

### 步骤2: 数据验证
1. 确认JSON格式正确
2. 验证必需字段存在
3. 检查数据大小

### 步骤3: 逐步测试
1. 先测试连接
2. 再测试集合创建
3. 最后测试数据插入

## 常见错误码

| 错误码 | 含义 | 解决方案 |
|-------|------|----------|
| UNAUTHENTICATED | 认证失败 | 检查token配置 |
| COLLECTION_NOT_EXIST | 集合不存在 | 先创建集合 |
| DIMENSION_NOT_MATCH | 向量维度不匹配 | 确认使用1536维度 |
| INVALID_JSON | JSON格式错误 | 检查JSON语法 |

## 获取帮助

如果以上步骤无法解决问题：

1. **查看详细日志**:
   - 打开浏览器开发者工具
   - 查看Console和Network标签页
   - 记录错误信息

2. **导出诊断报告**:
   - 运行系统诊断
   - 截图诊断结果
   - 提供给技术支持

3. **联系技术支持**:
   - 提供错误详情
   - 包含诊断报告
   - 说明数据格式和大小

## 预防措施

1. **定期检查**:
   - 每周运行系统诊断
   - 监控API配额使用情况
   - 备份重要数据

2. **最佳实践**:
   - 数据导入前先验证格式
   - 大文件分批导入
   - 保持系统组件更新

3. **监控告警**:
   - 设置连接监控
   - 配置错误告警
   - 定期健康检查
