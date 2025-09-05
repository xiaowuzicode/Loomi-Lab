# 支付系统集成说明

## 概述

本项目已成功集成了独立的支付系统数据库，支持查看真实的支付订单和退款订单数据。

## 已实现功能

### ✅ 核心功能
- [x] 支付订单查询和管理
- [x] 退款订单查询和管理
- [x] 实时统计数据展示
- [x] 多条件筛选支持
- [x] 数据导出功能（CSV格式）
- [x] 响应式界面设计

### ✅ 筛选功能
- [x] 按状态筛选（待处理、处理中、已完成、失败）
- [x] 按应用ID筛选
- [x] 按订单类型筛选（支付、充值）
- [x] 按时间范围筛选（今天、最近7天、最近30天）
- [x] 关键词搜索（订单号、交易号、退款原因等）

### ✅ 数据展示
- [x] 支付订单详细信息
- [x] 退款订单详细信息
- [x] 收入统计数据
- [x] 订单状态统计
- [x] 分页支持

## 数据库配置

### ⚠️ 安全配置说明
为确保数据库连接安全，现已采用加密配置方案。请参考 [SECURITY_CONFIG_GUIDE.md](./SECURITY_CONFIG_GUIDE.md) 了解详细的安全配置流程。

### 连接信息
```
主机: [已加密保护]
端口: [已加密保护]
数据库: [已加密保护]
用户名: [已加密保护]
密码: [已加密保护]
```

### 环境变量配置
在 `.env.local` 文件中添加以下配置：

```env
# 配置加密密钥
CONFIG_ENCRYPTION_KEY=your-generated-encryption-key

# 支付数据库配置 (生产环境使用加密配置)
PAYMENT_DB_ENCRYPTED=your-encrypted-database-config

# 开发环境备用配置 (仅限本地开发)
PAYMENT_DB_HOST=localhost
PAYMENT_DB_PORT=5432
PAYMENT_DB_NAME=loomi_pay_dev
PAYMENT_DB_USER=dev_user
PAYMENT_DB_PASSWORD=dev_password

# 数据库连接池配置
PAYMENT_DB_MAX_CONNECTIONS=20
PAYMENT_DB_IDLE_TIMEOUT_MS=30000
PAYMENT_DB_CONNECTION_TIMEOUT_MS=2000
```

## 文件结构

```
├── lib/
│   └── payment-db.ts          # 支付数据库连接和查询类
├── app/
│   ├── api/
│   │   ├── payments/
│   │   │   ├── route.ts       # 支付订单查询API
│   │   │   └── export/
│   │   │       └── route.ts   # 支付数据导出API
│   │   └── refunds/
│   │       ├── route.ts       # 退款订单查询API
│   │       └── export/
│   │           └── route.ts   # 退款数据导出API
│   └── payments/
│       └── page.tsx           # 支付管理页面
```

## 数据表结构

### payment_orders（支付订单表）
```sql
- id: UUID (主键)
- app_id: VARCHAR(100) (应用标识)
- merchant_order_id: VARCHAR(255) (商户订单号)
- status: VARCHAR(50) (状态: pending, processing, succeeded, failed)
- order_type: VARCHAR(50) (订单类型: payment, recharge)
- amount: BIGINT (金额，单位为分)
- currency: VARCHAR(10) (货币类型)
- payment_gateway: VARCHAR(50) (支付网关)
- gateway_transaction_id: VARCHAR(255) (网关交易号)
- extra_data: JSONB (扩展数据)
- created_at: TIMESTAMPTZ (创建时间)
- updated_at: TIMESTAMPTZ (更新时间)
```

### refund_orders（退款订单表）
```sql
- id: UUID (主键)
- app_id: VARCHAR(100) (应用标识)
- payment_order_id: UUID (关联支付订单ID)
- status: VARCHAR(50) (状态: pending, processing, succeeded, failed)
- amount: BIGINT (退款金额，单位为分)
- currency: VARCHAR(10) (货币类型)
- reason: TEXT (退款原因)
- gateway_refund_id: VARCHAR(255) (网关退款号)
- extra_data: JSONB (扩展数据)
- created_at: TIMESTAMPTZ (创建时间)
- updated_at: TIMESTAMPTZ (更新时间)
```

## API 接口

### 支付订单查询 API
```
GET /api/payments
```

**查询参数：**
- `app_id`: 应用ID
- `status`: 订单状态
- `order_type`: 订单类型
- `start_date`: 开始时间
- `end_date`: 结束时间
- `search_term`: 搜索关键词
- `page`: 页码（默认1）
- `limit`: 每页数量（默认50）

### 退款订单查询 API
```
GET /api/refunds
```

**查询参数：**
- `app_id`: 应用ID
- `status`: 退款状态
- `start_date`: 开始时间
- `end_date`: 结束时间
- `search_term`: 搜索关键词
- `page`: 页码（默认1）
- `limit`: 每页数量（默认50）

### 数据导出 API
```
GET /api/payments/export  # 导出支付数据
GET /api/refunds/export   # 导出退款数据
```

## 使用方法

1. **访问支付管理页面**
   ```
   http://localhost:3000/payments
   ```

2. **筛选数据**
   - 使用页面顶部的筛选控件
   - 支持多种筛选条件组合
   - 实时搜索功能

3. **查看统计信息**
   - 总收入、今日收入
   - 订单数量统计
   - 实时更新

4. **导出数据**
   - 点击"导出数据"按钮
   - 根据当前筛选条件导出
   - CSV格式下载

5. **切换视图**
   - 支付订单/退款订单标签切换
   - 不同数据源独立筛选

## 技术特性

- **数据库连接池**: 优化性能，避免连接泄露
- **SQL注入防护**: 使用参数化查询
- **分页支持**: 大数据量处理
- **错误处理**: 完善的错误捕获和提示
- **响应式设计**: 适配不同屏幕尺寸
- **实时筛选**: 即时数据更新
- **数据导出**: CSV格式下载

## 注意事项

1. **数据安全**: 数据库连接信息请妥善保管
2. **网络访问**: 确保服务器能访问支付数据库
3. **权限控制**: 生产环境请配置适当的访问控制
4. **性能监控**: 大数据量时注意查询性能
5. **错误日志**: 关注服务器日志，及时处理异常

## 后续优化建议

1. **缓存机制**: 对统计数据添加Redis缓存
2. **分页优化**: 实现虚拟滚动或无限加载
3. **权限控制**: 添加用户权限验证
4. **审计日志**: 记录数据访问和操作日志
5. **监控告警**: 添加数据库连接和查询监控

## 故障排查

### 常见问题

1. **连接数据库失败**
   - 检查网络连接
   - 验证数据库配置
   - 确认防火墙设置

2. **查询超时**
   - 检查数据量大小
   - 优化查询条件
   - 考虑添加索引

3. **导出失败**
   - 检查服务器磁盘空间
   - 验证数据格式
   - 查看错误日志

### 日志查看
```bash
# 查看API错误日志
tail -f app.log

# 查看数据库连接状态
grep "payment database" app.log
```

## 联系支持

如有问题，请联系开发团队或查看相关文档：
- 支付系统文档: `/docs/independent-payment-system.md`
- API文档: `/docs/api-reference.md`
- 数据库文档: `/docs/database-schema.md`
