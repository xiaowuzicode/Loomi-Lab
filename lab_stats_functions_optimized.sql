-- Loomi Lab 统计函数（优化版本）- 用于管理平台统计数据
-- 所有函数都使用 lab_ 前缀避免冲突
-- 优化了性能和安全性

-- 1. Lab平台：获取每日新增用户数量（优化版）
CREATE OR REPLACE FUNCTION lab_get_daily_new_users_count(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    user_count INTEGER;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    -- 使用时间范围查询，利用索引
    start_time := target_date::TIMESTAMPTZ;
    end_time := start_time + INTERVAL '1 day';
    
    SELECT COUNT(*)
    INTO user_count
    FROM auth.users
    WHERE created_at >= start_time 
    AND created_at < end_time
    AND deleted_at IS NULL;
    
    RETURN COALESCE(user_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 2. Lab平台：获取本月新增用户数量（优化版）
CREATE OR REPLACE FUNCTION lab_get_monthly_new_users_count(target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    user_count INTEGER;
    month_start TIMESTAMPTZ;
    month_end TIMESTAMPTZ;
BEGIN
    -- 使用时间范围查询，利用索引
    month_start := DATE_TRUNC('month', target_month)::TIMESTAMPTZ;
    month_end := month_start + INTERVAL '1 month';
    
    SELECT COUNT(*)
    INTO user_count
    FROM auth.users
    WHERE created_at >= month_start 
    AND created_at < month_end
    AND deleted_at IS NULL;
    
    RETURN COALESCE(user_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 3. Lab平台：获取活跃用户数量（最近N天有登录的用户）（优化版）
CREATE OR REPLACE FUNCTION lab_get_active_users_count(days_back INTEGER DEFAULT 7)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    active_count INTEGER;
    cutoff_time TIMESTAMPTZ;
BEGIN
    -- 使用时间范围查询，利用索引
    cutoff_time := (CURRENT_DATE - INTERVAL '1 day' * days_back)::TIMESTAMPTZ;
    
    SELECT COUNT(DISTINCT id)
    INTO active_count
    FROM auth.users
    WHERE last_sign_in_at IS NOT NULL
    AND last_sign_in_at >= cutoff_time
    AND deleted_at IS NULL;
    
    RETURN COALESCE(active_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 4. Lab平台：获取用户统计摘要（一次性获取所有统计数据）（优化版）
CREATE OR REPLACE FUNCTION lab_get_user_stats_summary()
RETURNS TABLE (
    total_users INTEGER,
    active_users INTEGER,
    daily_new_users INTEGER,
    monthly_new_users INTEGER
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    today_start TIMESTAMPTZ;
    today_end TIMESTAMPTZ;
    month_start TIMESTAMPTZ;
    month_end TIMESTAMPTZ;
    week_ago TIMESTAMPTZ;
    total_count INTEGER DEFAULT 0;
    active_count INTEGER DEFAULT 0;
    daily_count INTEGER DEFAULT 0;
    monthly_count INTEGER DEFAULT 0;
BEGIN
    -- 计算时间边界
    today_start := CURRENT_DATE::TIMESTAMPTZ;
    today_end := today_start + INTERVAL '1 day';
    month_start := DATE_TRUNC('month', CURRENT_DATE)::TIMESTAMPTZ;
    month_end := month_start + INTERVAL '1 month';
    week_ago := (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ;
    
    -- 一次查询获取所有统计数据（减少数据库访问）
    SELECT 
        COUNT(*) FILTER (WHERE deleted_at IS NULL),
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND last_sign_in_at IS NOT NULL AND last_sign_in_at >= week_ago),
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= today_start AND created_at < today_end),
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= month_start AND created_at < month_end)
    INTO total_count, active_count, daily_count, monthly_count
    FROM auth.users;
    
    RETURN QUERY
    SELECT 
        COALESCE(total_count, 0) as total_users,
        COALESCE(active_count, 0) as active_users,
        COALESCE(daily_count, 0) as daily_new_users,
        COALESCE(monthly_count, 0) as monthly_new_users;

EXCEPTION
    WHEN OTHERS THEN
        -- 发生错误时返回零值
        RETURN QUERY SELECT 0, 0, 0, 0;
END;
$$;

-- 5. Lab平台：获取用户留存数量（简化版，实际业务中可能需要更复杂的逻辑）
-- 这里暂时用7天活跃用户替代复杂的留存逻辑
CREATE OR REPLACE FUNCTION lab_get_user_retention_count(target_date DATE DEFAULT CURRENT_DATE, days_back INTEGER DEFAULT 7)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 简化实现：返回7天活跃用户数
    RETURN lab_get_active_users_count(days_back);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 创建索引建议（如果不存在的话）
-- 注意：这些索引可能已经存在，CREATE INDEX IF NOT EXISTS 是安全的
DO $$
BEGIN
    -- 检查并创建 created_at 索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'users_created_at_idx' AND n.nspname = 'auth'
    ) THEN
        CREATE INDEX CONCURRENTLY users_created_at_idx ON auth.users (created_at) WHERE deleted_at IS NULL;
    END IF;
    
    -- 检查并创建 last_sign_in_at 索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'users_last_sign_in_at_idx' AND n.nspname = 'auth'
    ) THEN
        CREATE INDEX CONCURRENTLY users_last_sign_in_at_idx ON auth.users (last_sign_in_at) WHERE deleted_at IS NULL;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- 索引创建失败不影响函数创建
        NULL;
END
$$;

-- 授权给 service_role
GRANT EXECUTE ON FUNCTION lab_get_daily_new_users_count(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_monthly_new_users_count(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_active_users_count(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_user_stats_summary() TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_user_retention_count(DATE, INTEGER) TO service_role;

-- 添加注释
COMMENT ON FUNCTION lab_get_daily_new_users_count(DATE) IS 'Loomi Lab：获取指定日期的新增用户数量（优化版本）';
COMMENT ON FUNCTION lab_get_monthly_new_users_count(DATE) IS 'Loomi Lab：获取指定月份的新增用户数量（优化版本）';
COMMENT ON FUNCTION lab_get_active_users_count(INTEGER) IS 'Loomi Lab：获取最近N天的活跃用户数量（优化版本）';
COMMENT ON FUNCTION lab_get_user_stats_summary() IS 'Loomi Lab：获取用户统计摘要（优化版本，一次查询获取所有数据）';
COMMENT ON FUNCTION lab_get_user_retention_count(DATE, INTEGER) IS 'Loomi Lab：获取用户留存数量（简化版本）';
