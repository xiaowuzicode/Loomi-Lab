-- Loomi Lab 管理平台专用函数 - 避免与线上系统冲突
-- 所有函数都使用 lab_ 前缀

-- 1. Lab平台：搜索用户（支持分页和搜索）
CREATE OR REPLACE FUNCTION lab_search_users(
    search_term TEXT DEFAULT '',
    result_limit INTEGER DEFAULT 50,
    result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR(255),
    phone TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    phone_confirmed_at TIMESTAMPTZ,
    banned_until TIMESTAMPTZ,
    raw_user_meta_data JSONB,
    raw_app_meta_data JSONB,
    is_super_admin BOOLEAN,
    deleted_at TIMESTAMPTZ,
    display_name TEXT,
    avatar_url TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        u.phone,
        u.created_at,
        u.updated_at,
        u.last_sign_in_at,
        u.email_confirmed_at,
        u.phone_confirmed_at,
        u.banned_until,
        u.raw_user_meta_data,
        u.raw_app_meta_data,
        u.is_super_admin,
        u.deleted_at,
        COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as display_name,
        COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') as avatar_url
    FROM auth.users u
    WHERE 
        u.deleted_at IS NULL
        AND (
            search_term = '' 
            OR u.email ILIKE '%' || search_term || '%'
            OR u.phone ILIKE '%' || search_term || '%'
            OR u.id::text = search_term
        )
    ORDER BY u.created_at DESC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- 2. Lab平台：获取用户总数
CREATE OR REPLACE FUNCTION lab_get_total_users()
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
    WHERE deleted_at IS NULL;
    
    RETURN COALESCE(user_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 3. Lab平台：根据用户ID获取用户信息
CREATE OR REPLACE FUNCTION lab_get_user_by_id(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    phone TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    phone_confirmed_at TIMESTAMPTZ,
    banned_until TIMESTAMPTZ,
    raw_user_meta_data JSONB,
    raw_app_meta_data JSONB,
    is_super_admin BOOLEAN,
    deleted_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.phone,
        u.created_at,
        u.updated_at,
        u.last_sign_in_at,
        u.email_confirmed_at,
        u.phone_confirmed_at,
        u.banned_until,
        u.raw_user_meta_data,
        u.raw_app_meta_data,
        u.is_super_admin,
        u.deleted_at
    FROM auth.users u
    WHERE u.id = user_id_param AND u.deleted_at IS NULL;
END;
$$;

-- 4. Lab平台：根据邮箱获取用户信息
CREATE OR REPLACE FUNCTION lab_get_user_by_email(email_param TEXT)
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    phone TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    phone_confirmed_at TIMESTAMPTZ,
    banned_until TIMESTAMPTZ,
    raw_user_meta_data JSONB,
    raw_app_meta_data JSONB,
    is_super_admin BOOLEAN,
    deleted_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.phone,
        u.created_at,
        u.updated_at,
        u.last_sign_in_at,
        u.email_confirmed_at,
        u.phone_confirmed_at,
        u.banned_until,
        u.raw_user_meta_data,
        u.raw_app_meta_data,
        u.is_super_admin,
        u.deleted_at
    FROM auth.users u
    WHERE LOWER(u.email) = LOWER(email_param) AND u.deleted_at IS NULL;
END;
$$;

-- 5. Lab平台：检查用户是否存在
CREATE OR REPLACE FUNCTION lab_check_user_exists(user_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = user_id_param AND deleted_at IS NULL
    ) INTO user_exists;
    
    RETURN user_exists;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- 授权给 service_role
GRANT EXECUTE ON FUNCTION lab_search_users(TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_total_users() TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_user_by_id(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION lab_get_user_by_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION lab_check_user_exists(UUID) TO service_role;

-- 添加注释
COMMENT ON FUNCTION lab_search_users(TEXT, INTEGER, INTEGER) IS 'Loomi Lab：搜索用户信息，支持邮箱、手机号、用户ID搜索';
COMMENT ON FUNCTION lab_get_total_users() IS 'Loomi Lab：获取用户总数';
COMMENT ON FUNCTION lab_get_user_by_id(UUID) IS 'Loomi Lab：根据用户ID获取用户信息';
COMMENT ON FUNCTION lab_get_user_by_email(TEXT) IS 'Loomi Lab：根据邮箱获取用户信息';
COMMENT ON FUNCTION lab_check_user_exists(UUID) IS 'Loomi Lab：检查用户是否存在';
