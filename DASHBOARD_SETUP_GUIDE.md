# Dashboard 统计页面部署指南

本指南将帮助您设置Dashboard统计页面的真实数据源，包括Redis和数据库函数配置。

## 📋 前置要求

- **Redis服务器**: 用于存储访问统计和Token统计数据
- **Supabase数据库**: 用于存储用户数据和执行统计函数
- **环境配置**: 正确配置环境变量

## 🚀 快速开始

### 1. 环境变量配置

复制 `env.example` 到 `.env.local` 并更新以下配置：

```bash
# Redis 配置（二选一）

# 方式1: 使用Redis URL（推荐）
REDIS_URL=redis://username:password@your-redis-host:6379/0
# 或者对于没有密码的Redis
REDIS_URL=redis://your-redis-host:6379/0

# 方式2: 分别配置各个参数
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. 数据库函数依赖

系统使用以下现有的数据库函数：

- `get_daily_new_users_count(target_date TEXT)` - 获取每日新增用户数量
- `get_user_retention_count(target_date TEXT, days_back INTEGER)` - 获取用户留存数量

这些函数应该已经在您的数据库中存在。如果没有，请确保已正确部署相关的数据库函数。

**验证函数是否存在**：

```sql
-- 在Supabase SQL编辑器中执行以下查询来验证函数
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_daily_new_users_count', 'get_user_retention_count');
```

如果函数不存在，请参考项目中其他 `.sql` 文件或联系团队获取函数定义。

### 3. Redis数据结构

Dashboard系统依赖以下Redis Key结构：

#### 访问统计
```redis
novachat:access:total                          # 总访问次数
novachat:access:daily:2024-01-15              # 每日访问次数
novachat:access:users:2024-01-15              # 每日独立用户Set
novachat:access:daily_user:2024-01-15:user123 # 用户每日访问次数
```

#### Token统计
```redis
token_stats:daily:2024-01-15                  # 每日Token消耗
token_stats:monthly:2024-01                   # 每月Token消耗  
user_stats:detailed:user123:2024-01-15        # 用户详细统计(Hash)
token_accumulator:user123:session456          # 会话Token累加器(Hash)
```

### 4. 启动应用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000/dashboard` 查看统计页面。

## 📊 统计指标说明

### 主要指标卡片

| 指标名称 | 数据源 | 说明 |
|---------|-------|------|
| 总访问次数 | Redis: `novachat:access:total` | 系统启动以来的累计访问次数 |
| 今日活跃用户 | Redis: `novachat:access:users:{date}` | 当日有访问记录的独立用户数 |
| 今日新增用户 | DB函数: `lab_get_daily_new_users_count` | 当日注册的新用户数量 |
| Token消耗 | Redis: `token_stats:daily:{date}` | 当日总Token消耗量 |

### 图表数据

- **访问趋势图**: 最近7天和6个月的访问统计
- **Token消耗图**: 每日和月度Token消耗趋势
- **活跃用户列表**: 最近3天访问次数最多的用户
- **Token排行榜**: 今日Token消耗排行前3名

## 🔧 故障排除

### Redis连接问题

如果遇到Redis连接错误：

#### 1. 测试Redis连接

访问测试接口验证Redis配置：

```bash
# 启动应用后访问
curl http://localhost:3000/api/test-redis
```

或在浏览器中直接访问 `http://localhost:3000/api/test-redis`

#### 2. 检查环境变量

确保 `.env.local` 文件中的Redis配置正确：

```bash
# 检查当前配置（在项目根目录）
cat .env.local | grep REDIS
```

#### 3. 验证Redis服务

如果您有Redis CLI访问权限：

```bash
# 使用redis-cli连接测试
redis-cli -h your-redis-host -p 6379 -a your-password ping

# 检查Redis配置
redis-cli -h your-redis-host -p 6379 -a your-password config get "*"
```

#### 4. 常见错误解决

- **ECONNREFUSED**: Redis服务器地址或端口错误
- **Auth failed**: Redis密码错误
- **Connection timeout**: 网络连接问题或防火墙阻挡

### 数据库函数问题

如果数据库函数调用失败：

```sql
-- 检查函数是否存在
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_daily_new_users_count', 'get_user_retention_count');

-- 检查权限
SELECT grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name = 'get_daily_new_users_count';
```

### API响应错误

检查浏览器控制台和服务器日志：

```bash
# 开发模式查看详细错误
npm run dev

# 检查API响应
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Content-Type: application/json"
```

## 📈 数据填充

如果您的系统是新部署的，可能没有历史数据。您可以：

1. **等待自然积累**: 随着用户使用系统，数据会自动积累
2. **导入测试数据**: 使用Redis命令手动添加测试数据
3. **运行数据迁移**: 如果有旧系统数据，编写迁移脚本

### 添加测试数据示例

```bash
# 设置总访问次数
redis-cli SET novachat:access:total 1000

# 设置今日访问次数
redis-cli SET novachat:access:daily:2024-01-15 150

# 添加今日用户
redis-cli SADD novachat:access:users:2024-01-15 user1 user2 user3

# 设置Token统计
redis-cli SET token_stats:daily:2024-01-15 50000
```

## 🛡️ 安全注意事项

1. **环境变量**: 确保生产环境中的敏感信息已正确配置
2. **Redis访问控制**: 在生产环境中启用Redis密码认证
3. **API权限**: 确保只有授权用户可以访问统计API
4. **数据库权限**: 检查数据库函数的执行权限

## 📞 支持与反馈

如果在部署过程中遇到问题，请：

1. 检查本文档的故障排除部分
2. 查看项目的GitHub Issues
3. 联系开发团队获取技术支持

---

*最后更新: 2024年1月*  
*维护团队: BlueFocus Team*
