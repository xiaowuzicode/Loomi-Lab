# 🔐 Loomi-Lab 安全配置管理指南

本指南说明如何安全地管理项目中的敏感配置信息，包括数据库连接等关键配置。

## 🚨 安全问题说明

### 已修复的安全风险
项目中之前存在明文数据库配置，包括：
- 数据库主机、端口、用户名、密码直接写在代码中
- 文档中包含真实的生产配置信息
- 缺乏配置加密和安全管理机制

### 修复方案
现已实施完整的配置加密方案，确保敏感信息安全。

## 🛡️ 配置加密系统

### 核心组件
1. **`lib/encryption.ts`** - 配置加密核心类
2. **`scripts/encrypt-config.js`** - 配置加密工具
3. **环境变量管理** - 分层配置管理

### 加密特性
- **AES-256-GCM** 加密算法
- **认证标签验证** 防止数据篡改  
- **随机初始化向量** 每次加密都不同
- **密钥派生** 基于环境变量安全派生密钥

## 📋 使用步骤

### 1. 生成加密密钥

```bash
# 运行加密工具
node scripts/encrypt-config.js

# 选择 "1: 生成密钥"
# 复制生成的密钥到环境变量
```

### 2. 设置环境变量

```bash
# 设置加密密钥
export CONFIG_ENCRYPTION_KEY=your-generated-key-here
```

### 3. 加密数据库配置

```bash
# 使用专门的支付配置加密
node scripts/encrypt-config.js --payment

# 或使用通用配置加密
node scripts/encrypt-config.js
# 选择 "2: 加密配置"
```

### 4. 配置环境变量

```bash
# 生产环境 - 使用加密配置
export PAYMENT_DB_ENCRYPTED=your-encrypted-config-here

# 开发环境 - 使用明文配置
export PAYMENT_DB_HOST=localhost
export PAYMENT_DB_USER=dev_user
export PAYMENT_DB_PASSWORD=dev_password
```

## 🔧 配置格式说明

### 数据库配置JSON格式
```json
{
  "host": "your-database-host",
  "port": 5432,
  "database": "your-database-name", 
  "user": "your-username",
  "password": "your-password",
  "max": 20,
  "idleTimeoutMillis": 30000,
  "connectionTimeoutMillis": 2000
}
```

### 环境变量优先级
1. **PAYMENT_DB_ENCRYPTED** - 加密配置（生产推荐）
2. **PAYMENT_DB_HOST** 等 - 明文配置（开发环境）

## 🚀 部署最佳实践

### 开发环境
```bash
# 使用明文配置便于调试
PAYMENT_DB_HOST=localhost
PAYMENT_DB_PORT=5432
PAYMENT_DB_NAME=loomi_pay_dev
PAYMENT_DB_USER=dev_user
PAYMENT_DB_PASSWORD=dev_password
```

### 生产环境
```bash
# 只使用加密配置
CONFIG_ENCRYPTION_KEY=your-production-key
PAYMENT_DB_ENCRYPTED=encrypted-production-config
```

### Docker 部署
```dockerfile
# 在 Dockerfile 或 docker-compose.yml 中
ENV CONFIG_ENCRYPTION_KEY=${CONFIG_ENCRYPTION_KEY}
ENV PAYMENT_DB_ENCRYPTED=${PAYMENT_DB_ENCRYPTED}
```

### Kubernetes 部署
```yaml
# 使用 Secret 管理敏感配置
apiVersion: v1
kind: Secret
metadata:
  name: loomi-config
data:
  CONFIG_ENCRYPTION_KEY: base64-encoded-key
  PAYMENT_DB_ENCRYPTED: base64-encoded-config
```

## 🔍 验证配置

### 测试解密
```bash
node scripts/encrypt-config.js
# 选择 "3: 解密配置" 验证配置正确性
```

### 检查环境变量
```javascript
// 在代码中验证
import { SecureConfig } from './lib/encryption'

try {
  const config = SecureConfig.getDatabaseConfig('PAYMENT_DB')
  console.log('✅ 数据库配置解密成功')
} catch (error) {
  console.error('❌ 配置解密失败:', error.message)
}
```

## 🛠️ 故障排除

### 常见问题

#### 1. 加密密钥缺失
```
Error: CONFIG_ENCRYPTION_KEY environment variable is required
```
**解决**: 设置 `CONFIG_ENCRYPTION_KEY` 环境变量

#### 2. 配置格式错误  
```
Error: Invalid encrypted config format
```
**解决**: 检查加密配置格式，重新生成

#### 3. 解密失败
```  
Error: Config decryption failed
```
**解决**: 验证密钥正确性，检查配置完整性

### 配置迁移

#### 从明文配置迁移
1. 备份现有配置
2. 使用加密工具生成加密配置
3. 更新环境变量
4. 测试应用启动
5. 删除明文配置

## 🔒 安全建议

### 密钥管理
- 🔑 使用强随机密钥（32字节/256位）
- 🚫 不要在代码中硬编码密钥
- 📱 生产和开发使用不同密钥
- 🔄 定期轮换加密密钥

### 配置管理
- 🛡️ 生产环境只使用加密配置
- 📝 审核所有配置文件和文档
- 🗑️ 删除已暴露的明文配置
- 🔍 定期检查配置安全性

### 部署安全
- 🌐 使用安全的密钥分发机制
- 📊 监控配置访问日志
- 🚨 配置泄露时立即更换
- 🔐 限制配置访问权限

## 📚 相关文件

- `lib/encryption.ts` - 加密核心实现
- `lib/payment-db.ts` - 安全数据库连接
- `scripts/encrypt-config.js` - 配置加密工具
- `env.example` - 环境变量示例
- `CLAUDE.md` - 项目整体文档