# Supabase 集成说明

## 概述

本项目已集成 Supabase 作为后端数据库服务，基于您提供的 `user_storage.py` 创建了对应的 TypeScript 实现。

## 文件结构

```
lib/
├── supabase.ts          # Supabase 客户端和数据服务类
hooks/
├── useSupabaseData.ts   # React Hooks for 数据获取
app/api/
├── users/route.ts       # 用户相关 API 路由
├── payments/route.ts    # 支付相关 API 路由
```

## 环境变量配置

复制 `env.local.example` 到 `.env.local` 并填入您的 Supabase 配置：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## 数据服务类

### UserStorage 类

对应 Python 版本的 `UserStorage` 类，提供以下方法：

- `getUserById(userId: string)` - 根据用户ID查询用户信息
- `checkUserExists(userId: string)` - 检查用户是否存在  
- `getUserByEmail(email: string)` - 根据邮箱查询用户信息
- `getUsersByIds(userIds: string[])` - 批量查询用户信息
- `getDailyNewUsersCount(targetDate?: string)` - 获取指定日期的新增用户数量
- `getUserRetentionCount(daysBack: number, targetDate?: string)` - 获取用户留存数量
- `getUserStatisticsSummary(targetDate?: string)` - 获取用户统计汇总信息

### PaymentStorage 类

提供支付相关的数据查询：

- `getPayments(filters?)` - 获取支付记录（支持状态、用户、时间范围过滤）
- `getPaymentStats()` - 获取支付统计信息

## API 路由

### 用户 API (`/api/users`)

**GET 请求参数：**
- `id` - 用户ID
- `email` - 用户邮箱  
- `action=stats` - 获取用户统计信息

**POST 请求：**
- Body: `{ userIds: string[] }` - 批量查询用户

### 支付 API (`/api/payments`)

**GET 请求参数：**
- `status` - 支付状态过滤
- `userId` - 用户ID过滤
- `startDate` / `endDate` - 时间范围过滤
- `action=stats` - 获取支付统计信息

## React Hooks

### useUserData()

```typescript
const { 
  users, 
  userStats, 
  loading, 
  error,
  fetchUserById,
  fetchUserByEmail, 
  fetchUsersByIds,
  fetchUserStats 
} = useUserData()
```

### usePaymentData()

```typescript
const {
  payments,
  paymentStats, 
  loading,
  error,
  fetchPayments,
  fetchPaymentStats
} = usePaymentData()
```

### useSupabaseQuery()

通用数据获取 Hook：

```typescript
const { data, loading, error, refetch } = useSupabaseQuery<T>(
  '/api/users?action=stats',
  {
    enabled: true,
    onSuccess: (data) => console.log(data),
    onError: (error) => console.error(error)
  }
)
```

## 使用示例

### 在组件中获取用户数据

```typescript
import { useUserData } from '@/hooks/useSupabaseData'

export default function UserComponent() {
  const { fetchUserById, loading, error } = useUserData()
  
  const handleGetUser = async () => {
    const user = await fetchUserById('user-123')
    if (user) {
      console.log('用户信息:', user)
    }
  }
  
  return (
    <div>
      <button onClick={handleGetUser} disabled={loading}>
        {loading ? '加载中...' : '获取用户'}
      </button>
      {error && <p>错误: {error}</p>}
    </div>
  )
}
```

### 在页面中获取统计数据

```typescript
import { useSupabaseQuery } from '@/hooks/useSupabaseData'

export default function DashboardPage() {
  const { data: userStats, loading } = useSupabaseQuery<any>(
    '/api/users?action=stats'
  )
  
  const { data: paymentStats } = useSupabaseQuery<any>(
    '/api/payments?action=stats'
  )
  
  return (
    <div>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <div>
          <p>新增用户: {userStats?.daily_new_users}</p>
          <p>总收入: {paymentStats?.total_revenue}</p>
        </div>
      )}
    </div>
  )
}
```

## 数据库函数依赖

项目依赖以下 Supabase 数据库函数（需要在 Supabase 中创建）：

1. `search_users_with_auth(search_term, result_limit)` - 搜索用户
2. `get_daily_new_users_count(target_date)` - 获取新增用户数量
3. `get_user_retention_count(target_date, days_back)` - 获取用户留存数量
4. `get_payment_statistics()` - 获取支付统计信息

## 错误处理

所有数据服务都包含完整的错误处理：

- 自动重试机制
- 友好的错误提示
- Toast 通知集成
- 回退到模拟数据（开发环境）

## 注意事项

1. 确保 Supabase 项目已正确配置 RLS（行级安全）策略
2. 服务角色密钥仅用于服务端 API 路由
3. 前端使用匿名密钥，通过 API 路由访问数据
4. 所有敏感数据查询都在服务端进行
5. 开发环境下，如果 Supabase 未配置，系统会自动回退到模拟数据

## 扩展

要添加新的数据服务，请：

1. 在 `lib/supabase.ts` 中创建新的服务类
2. 在 `app/api/` 下创建对应的路由文件  
3. 在 `hooks/useSupabaseData.ts` 中添加对应的 Hook
4. 更新环境变量配置（如需要）

这样就完成了从 Python 到 TypeScript 的 Supabase 集成迁移！
