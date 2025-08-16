-- 管理平台专用函数 - 避免与线上系统冲突
-- 这些是管理平台的新函数，使用不同的命名

-- 1. 管理平台：根据用户ID获取用户信息
CREATE OR REPLACE FUNCTION admin_get_user_by_id(user_id_param UUID)
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

-- 2. 管理平台：根据邮箱获取用户信息
CREATE OR REPLACE FUNCTION admin_get_user_by_email(email_param TEXT)
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

-- 授权给 service_role
GRANT EXECUTE ON FUNCTION admin_get_user_by_id(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION admin_get_user_by_email(TEXT) TO service_role;

-- 添加注释
COMMENT ON FUNCTION admin_get_user_by_id(UUID) IS '管理平台：根据用户ID获取用户信息';
COMMENT ON FUNCTION admin_get_user_by_email(TEXT) IS '管理平台：根据邮箱获取用户信息';
