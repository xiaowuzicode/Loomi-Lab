-- Loomi Lab 统计函数 - 用于管理平台统计数据
-- 所有函数都使用 lab_ 前缀避免冲突

-- 1. Lab平台：获取每日新增用户数量
CREATE OR REPLACE FUNCTION lab_get_daily_new_users_count(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO user_count
    FROM auth.users
    WHERE DATE(created_at) = target_date
    AND deleted_at IS NULL;
    
    RETURN COALESCE(user_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 2. Lab平台：获取用户留存数量（N天前注册，今天活跃的用户）
CREATE OR REPLACE FUNCTION lab_get_user_retention_count(target_date DATE DEFAULT CURRENT_DATE, days_back INTEGER DEFAULT 7)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    retention_count INTEGER;
    register_date DATE;
BEGIN
    register_date := target_date - INTERVAL '1 day' * days_back;
    
    -- 计算N天前注册，今天有登录记录的用户数
    SELECT COUNT(DISTINCT u.id)
    INTO retention_count
    FROM auth.users u
    WHERE DATE(u.created_at) = register_date
    AND u.deleted_at IS NULL
    AND u.last_sign_in_at IS NOT NULL
    AND DATE(u.last_sign_in_at) = target_date;
    
    RETURN COALESCE(retention_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 3. Lab平台：获取本月新增用户数量
CREATE OR REPLACE FUNCTION lab_get_monthly_new_users_count(target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    user_count INTEGER;
    month_start DATE;
    month_end DATE;
BEGIN
    month_start := DATE_TRUNC('month', target_month);
    month_end := month_start + INTERVAL '1 month' - INTERVAL '1 day';
    
    SELECT COUNT(*)
    INTO user_count
    FROM auth.users
    WHERE DATE(created_at) BETWEEN month_start AND month_end
    AND deleted_at IS NULL;
    
    RETURN COALESCE(user_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 4. Lab平台：获取活跃用户数量（最近N天有登录的用户）
CREATE OR REPLACE FUNCTION lab_get_active_users_count(days_back INTEGER DEFAULT 7)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    active_count INTEGER;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - INTERVAL '1 day' * days_back;
    
    SELECT COUNT(DISTINCT id)
    INTO active_count
    FROM auth.users
    WHERE last_sign_in_at IS NOT NULL
    AND DATE(last_sign_in_at) >= cutoff_date
    AND deleted_at IS NULL;
    
    RETURN COALESCE(active_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 5. Lab平台：获取用户统计摘要（一次性获取所有统计数据）
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
BEGIN
    RETURN QUERY
    SELECT 
        lab_get_total_users() as total_users,
        lab_get_active_users_count(7) as active_users,
        lab_get_daily_new_users_count(CURRENT_DATE) as daily_new_users,
        lab_get_monthly_new_users_count(CURRENT_DATE) as monthly_new_users;
END;
$$;

-- 授权给 service_role
GRANT EXECUTE ON FUNCTION lab_get_daily_new_users_count(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_user_retention_count(DATE, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_monthly_new_users_count(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_active_users_count(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_user_stats_summary() TO service_role;

-- 添加注释
COMMENT ON FUNCTION lab_get_daily_new_users_count(DATE) IS 'Loomi Lab：获取指定日期的新增用户数量';
COMMENT ON FUNCTION lab_get_user_retention_count(DATE, INTEGER) IS 'Loomi Lab：获取用户留存数量';
COMMENT ON FUNCTION lab_get_monthly_new_users_count(DATE) IS 'Loomi Lab：获取指定月份的新增用户数量';
COMMENT ON FUNCTION lab_get_active_users_count(INTEGER) IS 'Loomi Lab：获取最近N天的活跃用户数量';
COMMENT ON FUNCTION lab_get_user_stats_summary() IS 'Loomi Lab：获取用户统计摘要（所有统计数据）';
