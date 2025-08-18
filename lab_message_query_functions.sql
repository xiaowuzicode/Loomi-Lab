-- 用户消息查询相关函数 (lab_ 前缀)
-- 这些函数用于查询 public.projects 表和相关的聊天消息数据

-- 1. 查询某个用户的所有项目
CREATE OR REPLACE FUNCTION lab_query_user_projects(
  user_id_param UUID,
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  user_id UUID,
  conversation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_background JSONB,
  config JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.user_id,
    p.conversation_id,
    p.created_at,
    p.updated_at,
    p.user_background,
    p.config
  FROM public.projects p
  WHERE p.user_id = user_id_param
    AND (start_date IS NULL OR p.created_at >= start_date::timestamp)
    AND (end_date IS NULL OR p.created_at <= (end_date::timestamp + interval '1 day'))
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. 查询某个用户的特定会话项目
CREATE OR REPLACE FUNCTION lab_query_user_conversation(
  user_id_param UUID,
  conversation_id_param TEXT,
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  user_id UUID,
  conversation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_background JSONB,
  config JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.user_id,
    p.conversation_id,
    p.created_at,
    p.updated_at,
    p.user_background,
    p.config
  FROM public.projects p
  WHERE p.user_id = user_id_param
    AND p.conversation_id = conversation_id_param
    AND (start_date IS NULL OR p.created_at >= start_date::timestamp)
    AND (end_date IS NULL OR p.created_at <= (end_date::timestamp + interval '1 day'))
  ORDER BY p.created_at DESC;
END;
$$;

-- 3. 查询某个项目的信息 (通过project_id作为会话ID)
CREATE OR REPLACE FUNCTION lab_query_project_by_id(
  project_id_param TEXT,
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  user_id UUID,
  conversation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_background JSONB,
  config JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.user_id,
    p.conversation_id,
    p.created_at,
    p.updated_at,
    p.user_background,
    p.config
  FROM public.projects p
  WHERE p.id::text = project_id_param
    AND (start_date IS NULL OR p.created_at >= start_date::timestamp)
    AND (end_date IS NULL OR p.created_at <= (end_date::timestamp + interval '1 day'))
  ORDER BY p.created_at DESC;
END;
$$;

-- 3.1 查询特定用户的特定项目
CREATE OR REPLACE FUNCTION lab_query_user_project_by_id(
  user_id_param UUID,
  project_id_param TEXT,
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  user_id UUID,
  conversation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_background JSONB,
  config JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.user_id,
    p.conversation_id,
    p.created_at,
    p.updated_at,
    p.user_background,
    p.config
  FROM public.projects p
  WHERE p.user_id = user_id_param
    AND p.id::text = project_id_param
    AND (start_date IS NULL OR p.created_at >= start_date::timestamp)
    AND (end_date IS NULL OR p.created_at <= (end_date::timestamp + interval '1 day'))
  ORDER BY p.created_at DESC;
END;
$$;

-- 4. 按时间范围查询所有项目
CREATE OR REPLACE FUNCTION lab_query_projects_by_date(
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  user_id UUID,
  conversation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_background JSONB,
  config JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.user_id,
    p.conversation_id,
    p.created_at,
    p.updated_at,
    p.user_background,
    p.config
  FROM public.projects p
  WHERE (start_date IS NULL OR p.created_at >= start_date::timestamp)
    AND (end_date IS NULL OR p.created_at <= (end_date::timestamp + interval '1 day'))
  ORDER BY p.created_at DESC
  LIMIT 5000; -- 限制最多返回5000条记录
END;
$$;

-- 5. 查询所有不重复的项目标题 (用户提到的查询全部功能)
CREATE OR REPLACE FUNCTION lab_get_all_project_titles()
RETURNS TABLE(
  title TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.title
  FROM public.projects p
  ORDER BY p.title
  LIMIT 5000;
END;
$$;

-- 6. 获取某个项目的聊天消息 (辅助函数)
CREATE OR REPLACE FUNCTION lab_get_project_chat_messages(
  project_id_param UUID
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  project_id UUID,
  role TEXT,
  metadata JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.content,
    cm.created_at,
    cm.updated_at,
    cm.project_id,
    cm.role,
    cm.metadata
  FROM public.chat_messages cm
  WHERE cm.project_id = project_id_param
  ORDER BY cm.created_at ASC;
END;
$$;

-- 为函数添加权限和注释
COMMENT ON FUNCTION lab_query_user_projects IS '查询某个用户的所有项目';
COMMENT ON FUNCTION lab_query_user_conversation IS '查询某个用户的特定会话项目（通过conversation_id字段）';
COMMENT ON FUNCTION lab_query_project_by_id IS '通过项目ID查询项目信息（会话ID就是项目ID）';
COMMENT ON FUNCTION lab_query_user_project_by_id IS '查询特定用户的特定项目（会话ID就是项目ID）';
COMMENT ON FUNCTION lab_query_projects_by_date IS '按时间范围查询所有项目';
COMMENT ON FUNCTION lab_get_all_project_titles IS '获取所有不重复的项目标题';
COMMENT ON FUNCTION lab_get_project_chat_messages IS '获取某个项目的聊天消息';
