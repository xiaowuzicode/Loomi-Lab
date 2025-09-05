# 🔒 主应用安全访问支付系统指南

## ⚠️ 重要安全声明

本文档提供安全的支付系统接入方案。所有生产环境配置均已加密保护，请联系系统管理员获取实际连接参数。

## 🎯 概述

配置完成后，您的主应用可以通过安全的加密配置访问支付系统的Redis和PostgreSQL数据库，实现数据共享和实时通信。

## 🔌 安全连接配置

### 第一步：获取加密配置
联系系统管理员获取：
- 配置加密密钥 (`CONFIG_ENCRYPTION_KEY`)
- 加密的数据库配置 (`PAYMENT_DB_ENCRYPTED`)
- 加密的Redis配置 (`REDIS_CONFIG_ENCRYPTED`)

### 第二步：环境变量设置
```bash
# 配置加密密钥
export CONFIG_ENCRYPTION_KEY=your-encryption-key

# 加密的数据库配置
export PAYMENT_DB_ENCRYPTED=encrypted-db-config

# 加密的Redis配置  
export REDIS_CONFIG_ENCRYPTED=encrypted-redis-config
```

## 💻 主应用安全连接代码示例

### Python 安全连接示例

#### 1. 安装依赖
```bash
pip install psycopg2-binary redis cryptography python-dotenv
```

#### 2. 配置解密模块
```python
import os
import json
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class SecureConfigManager:
    """安全配置管理器"""
    
    def __init__(self):
        self.encryption_key = os.getenv('CONFIG_ENCRYPTION_KEY')
        if not self.encryption_key:
            raise ValueError("CONFIG_ENCRYPTION_KEY environment variable is required")
    
    def _get_fernet_key(self, salt: bytes) -> bytes:
        """从密钥派生Fernet密钥"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(self.encryption_key.encode()))
    
    def decrypt_config(self, encrypted_config: str) -> dict:
        """解密配置"""
        try:
            # 解析加密格式: salt:encrypted_data
            parts = encrypted_config.split(':')
            if len(parts) != 2:
                raise ValueError("Invalid encrypted config format")
            
            salt = base64.b64decode(parts[0])
            encrypted_data = base64.b64decode(parts[1])
            
            # 解密
            fernet = Fernet(self._get_fernet_key(salt))
            decrypted = fernet.decrypt(encrypted_data)
            
            return json.loads(decrypted.decode())
        except Exception as e:
            raise RuntimeError(f"Config decryption failed: {e}")
    
    def get_database_config(self) -> dict:
        """获取数据库配置"""
        encrypted = os.getenv('PAYMENT_DB_ENCRYPTED')
        if not encrypted:
            raise ValueError("PAYMENT_DB_ENCRYPTED environment variable is required")
        return self.decrypt_config(encrypted)
    
    def get_redis_config(self) -> dict:
        """获取Redis配置"""
        encrypted = os.getenv('REDIS_CONFIG_ENCRYPTED')
        if not encrypted:
            raise ValueError("REDIS_CONFIG_ENCRYPTED environment variable is required")
        return self.decrypt_config(encrypted)
```

#### 3. 安全数据库连接
```python
import psycopg2
from psycopg2.extras import RealDictCursor
import redis

class SecureDatabaseManager:
    """安全数据库管理器"""
    
    def __init__(self):
        self.config_manager = SecureConfigManager()
        self.db_config = None
        self.redis_config = None
        self._db_conn = None
        self._redis_client = None
    
    def get_db_connection(self):
        """获取安全的数据库连接"""
        try:
            if not self.db_config:
                self.db_config = self.config_manager.get_database_config()
            
            if not self._db_conn or self._db_conn.closed:
                self._db_conn = psycopg2.connect(**self.db_config)
            
            return self._db_conn
        except Exception as e:
            raise RuntimeError(f"Database connection failed: {e}")
    
    def get_redis_client(self):
        """获取安全的Redis连接"""
        try:
            if not self.redis_config:
                self.redis_config = self.config_manager.get_redis_config()
            
            if not self._redis_client:
                self._redis_client = redis.Redis(**self.redis_config)
            
            return self._redis_client
        except Exception as e:
            raise RuntimeError(f"Redis connection failed: {e}")
    
    def query_payments(self, status=None, limit=10):
        """安全查询支付订单"""
        conn = self.get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            if status:
                cursor.execute(
                    "SELECT * FROM payment_orders WHERE status = %s ORDER BY created_at DESC LIMIT %s",
                    (status, limit)
                )
            else:
                cursor.execute(
                    "SELECT * FROM payment_orders ORDER BY created_at DESC LIMIT %s",
                    (limit,)
                )
            
            return cursor.fetchall()
        finally:
            cursor.close()
```

#### 4. 使用示例
```python
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 创建安全数据库管理器
db_manager = SecureDatabaseManager()

# 查询支付订单
try:
    payments = db_manager.query_payments(status='succeeded', limit=10)
    print(f"Found {len(payments)} successful payments")
    
    for payment in payments:
        print(f"Order {payment['merchant_order_id']}: {payment['amount']/100:.2f} {payment['currency']}")
        
except Exception as e:
    print(f"Error: {e}")

# Redis 缓存操作
try:
    redis_client = db_manager.get_redis_client()
    redis_client.set('test_key', 'Hello from main app!')
    result = redis_client.get('test_key')
    print(f"Redis test: {result.decode()}")
    
except Exception as e:
    print(f"Redis Error: {e}")
```

### Node.js 安全连接示例

#### 1. 安装依赖
```bash
npm install pg redis crypto dotenv
```

#### 2. 安全配置管理
```javascript
const crypto = require('crypto');
require('dotenv').config();

class SecureConfigManager {
  constructor() {
    this.encryptionKey = process.env.CONFIG_ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      throw new Error('CONFIG_ENCRYPTION_KEY environment variable is required');
    }
  }

  decryptConfig(encryptedConfig) {
    try {
      const parts = encryptedConfig.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted config format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = crypto.scryptSync(this.encryptionKey, 'loomi-salt', 32);

      const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Config decryption failed: ${error.message}`);
    }
  }

  getDatabaseConfig() {
    const encrypted = process.env.PAYMENT_DB_ENCRYPTED;
    if (!encrypted) {
      throw new Error('PAYMENT_DB_ENCRYPTED environment variable is required');
    }
    return this.decryptConfig(encrypted);
  }
}

module.exports = { SecureConfigManager };
```

## 🛡️ 安全最佳实践

### 1. 环境隔离
```bash
# 开发环境
CONFIG_ENCRYPTION_KEY=dev-key-32-chars-long
PAYMENT_DB_ENCRYPTED=dev-encrypted-config

# 生产环境
CONFIG_ENCRYPTION_KEY=prod-key-32-chars-long
PAYMENT_DB_ENCRYPTED=prod-encrypted-config
```

### 2. 连接池配置
```python
# 数据库连接池
DB_POOL_CONFIG = {
    'minconn': 1,
    'maxconn': 20,
    'host': '[from encrypted config]',
    'port': '[from encrypted config]',
    # ... other secure configs
}
```

### 3. 错误处理
```python
def safe_db_operation():
    try:
        # 数据库操作
        return result
    except psycopg2.OperationalError as e:
        logging.error(f"Database connection error: {e}")
        # 实施重连机制
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        # 记录但不暴露敏感信息
```

## 🔧 配置获取流程

### 第一步：联系管理员
- 请求访问支付系统数据库
- 获取配置加密密钥
- 获取加密的连接配置

### 第二步：环境配置
- 在主应用服务器设置环境变量
- 验证配置解密功能
- 测试数据库连接

### 第三步：部署验证
- 验证数据查询功能
- 检查连接池性能
- 监控连接状态

## 📚 相关文档

- [SECURITY_CONFIG_GUIDE.md](../../../SECURITY_CONFIG_GUIDE.md) - 完整安全配置指南
- [PAYMENT_INTEGRATION_README.md](../../../PAYMENT_INTEGRATION_README.md) - 支付系统集成说明

## ❓ 获取帮助

如需获取实际的生产环境配置或遇到技术问题，请联系：
- 系统管理员
- 开发团队负责人
- 通过内部工单系统提交请求

⚠️ **重要提醒**: 永远不要在代码、文档或日志中暴露真实的生产环境配置！