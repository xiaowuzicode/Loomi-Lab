# 主应用访问支付系统数据库指南

## 🎯 概述

配置完成后，您的主应用（运行在另一台机器上）可以直接访问支付系统的Redis和PostgreSQL数据库，实现数据共享和实时通信。

## 🔌 连接信息

假设支付系统部署在阿里云服务器IP为 `47.237.167.117`

### PostgreSQL 连接信息
```
主机: 47.237.167.117
端口: 15432
数据库: loomi_pay
用户名: loomi_user
密码: loomi_pass_2024
```

### Redis 连接信息
```
主机: 47.237.167.117
端口: 16379
数据库: 0 (默认)
密码: 无 (可选配置)
```

## 💻 主应用连接代码示例

### Python 连接示例

#### PostgreSQL 连接 (使用 psycopg2)
```python
import psycopg2
from psycopg2.extras import RealDictCursor

# 数据库连接配置
DB_CONFIG = {
    'host': '47.237.167.117',
    'port': 15432,
    'database': 'loomi_pay',
    'user': 'loomi_user',
    'password': 'loomi_pass_2024'
}

def get_db_connection():
    """获取数据库连接"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return None

# 使用示例
def query_payment_orders(app_id):
    """查询支付订单"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM payment_orders 
                WHERE app_id = %s 
                ORDER BY created_at DESC
            """, (app_id,))
            return cur.fetchall()
    except Exception as e:
        print(f"查询失败: {e}")
        return []
    finally:
        conn.close()
```

#### SQLAlchemy 连接 (推荐)
```python
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 数据库连接URL
DATABASE_URL = "postgresql://loomi_user:loomi_pass_2024@your_aliyun_server_ip:15432/loomi_pay"

# 创建引擎
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_payment_status(merchant_order_id, app_id):
    """获取支付状态"""
    session = SessionLocal()
    try:
        result = session.execute(text("""
            SELECT status, amount, created_at, updated_at 
            FROM payment_orders 
            WHERE merchant_order_id = :order_id AND app_id = :app_id
        """), {
            'order_id': merchant_order_id,
            'app_id': app_id
        })
        return result.fetchone()
    finally:
        session.close()
```

#### Redis 连接 (使用 redis-py)
```python
import redis
import json

# Redis连接配置
REDIS_CONFIG = {
    'host': '47.237.167.117',
    'port': 16379,
    'db': 0,
    'decode_responses': True
}

def get_redis_client():
    """获取Redis客户端"""
    try:
        client = redis.Redis(**REDIS_CONFIG)
        # 测试连接
        client.ping()
        return client
    except Exception as e:
        print(f"Redis连接失败: {e}")
        return None

# 使用示例
def listen_payment_results(app_id):
    """监听支付结果"""
    client = get_redis_client()
    if not client:
        return
    
    try:
        # 创建消费者组
        try:
            client.xgroup_create('payment_results', f'{app_id}_consumers', id='0', mkstream=True)
        except redis.exceptions.ResponseError:
            pass  # 组已存在
        
        # 消费消息
        while True:
            messages = client.xreadgroup(
                f'{app_id}_consumers',
                f'{app_id}_consumer_1',
                {'payment_results': '>'},
                count=1,
                block=1000
            )
            
            for stream, msgs in messages:
                for msg_id, fields in msgs:
                    # 处理支付结果
                    if fields.get('app_id') == app_id:
                        print(f"收到支付结果: {fields}")
                        # 确认消息
                        client.xack('payment_results', f'{app_id}_consumers', msg_id)
                    
    except KeyboardInterrupt:
        print("停止监听")
```

### Node.js 连接示例

#### PostgreSQL 连接 (使用 pg)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: '47.237.167.117',
  port: 15432,
  database: 'loomi_pay',
  user: 'loomi_user',
  password: 'loomi_pass_2024',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function getPaymentStatus(merchantOrderId, appId) {
  try {
    const result = await pool.query(
      'SELECT status, amount, created_at FROM payment_orders WHERE merchant_order_id = $1 AND app_id = $2',
      [merchantOrderId, appId]
    );
    return result.rows[0];
  } catch (err) {
    console.error('查询失败:', err);
    return null;
  }
}
```

#### Redis 连接 (使用 ioredis)
```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: '47.237.167.117',
  port: 16379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

async function listenPaymentResults(appId) {
  try {
    // 创建消费者组
    await redis.xgroup('CREATE', 'payment_results', `${appId}_consumers`, '0', 'MKSTREAM');
  } catch (err) {
    // 组已存在，忽略错误
  }
  
  while (true) {
    try {
      const results = await redis.xreadgroup(
        'GROUP', `${appId}_consumers`, `${appId}_consumer_1`,
        'COUNT', 1,
        'BLOCK', 1000,
        'STREAMS', 'payment_results', '>'
      );
      
      if (results.length > 0) {
        const [stream, messages] = results[0];
        for (const [id, fields] of messages) {
          const data = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }
          
          if (data.app_id === appId) {
            console.log('收到支付结果:', data);
            // 确认消息
            await redis.xack('payment_results', `${appId}_consumers`, id);
          }
        }
      }
    } catch (err) {
      console.error('监听错误:', err);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## 🔐 安全配置建议

### 1. 防火墙配置
```bash
# 在阿里云服务器上，只允许主应用服务器IP访问
sudo ufw allow from your_main_app_server_ip to any port 15432
sudo ufw allow from your_main_app_server_ip to any port 16379

# 或使用iptables
sudo iptables -A INPUT -p tcp -s your_main_app_server_ip --dport 15432 -j ACCEPT
sudo iptables -A INPUT -p tcp -s your_main_app_server_ip --dport 16379 -j ACCEPT
```

### 2. Redis密码保护 (可选)
如需增强安全性，可在 `redis.conf` 中启用密码：
```bash
# 取消注释并设置密码
requirepass your_strong_redis_password
```

对应的连接代码需要添加密码：
```python
# Python
redis.Redis(host='your_server_ip', port=16379, password='your_strong_redis_password')

# Node.js
new Redis({ host: 'your_server_ip', port: 16379, password: 'your_strong_redis_password' })
```

### 3. PostgreSQL访问控制
可以在 `postgresql.conf` 中限制特定IP访问，或配置 `pg_hba.conf`。

## 🚀 部署和测试

### 1. 部署支付系统
```bash
cd /root/blueproject/loomi-pay
docker-compose -f docker-compose.prod.yml up -d
```

### 2. 测试外部连接
```bash
# 从主应用服务器测试PostgreSQL连接
psql -h your_aliyun_server_ip -p 15432 -U loomi_user -d loomi_pay

# 从主应用服务器测试Redis连接
redis-cli -h your_aliyun_server_ip -p 16379 ping
```

### 3. 验证服务状态
```bash
# 在支付服务器上检查端口监听
netstat -tlnp | grep -E "(15432|16379)"

# 检查容器状态
docker-compose -f docker-compose.prod.yml ps
```

## 📊 数据表结构

主要数据表供主应用查询：

### payment_orders (支付订单表)
```sql
-- 主要字段
id                  UUID PRIMARY KEY
app_id              VARCHAR(50)      -- 应用标识
merchant_order_id   VARCHAR(100)     -- 商户订单号
amount              INTEGER          -- 金额(分)
status              VARCHAR(20)      -- 状态
lakala_order_id     VARCHAR(100)     -- 拉卡拉订单号
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### refund_orders (退款订单表)
```sql
-- 主要字段  
id                  UUID PRIMARY KEY
app_id              VARCHAR(50)
payment_order_id    UUID             -- 关联支付订单
amount              INTEGER          -- 退款金额
status              VARCHAR(20)      -- 退款状态
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

## 🔍 常见查询示例

```sql
-- 查询应用的所有支付订单
SELECT * FROM payment_orders WHERE app_id = 'your_app_id' ORDER BY created_at DESC;

-- 查询特定订单状态
SELECT status, amount, lakala_order_id FROM payment_orders 
WHERE merchant_order_id = 'ORDER_123' AND app_id = 'your_app_id';

-- 查询今日支付统计
SELECT COUNT(*), SUM(amount) FROM payment_orders 
WHERE app_id = 'your_app_id' 
AND DATE(created_at) = CURRENT_DATE 
AND status = 'paid';

-- 查询退款记录
SELECT r.*, p.merchant_order_id FROM refund_orders r
JOIN payment_orders p ON r.payment_order_id = p.id
WHERE r.app_id = 'your_app_id';
```

现在您的主应用就可以完全访问支付系统的数据库了！🎉
