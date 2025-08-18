-- 爆文库管理数据表
CREATE TABLE IF NOT EXISTS lab_content_library (
    -- 基础字段
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL CHECK (length(trim(title)) > 0), -- 确保标题非空
    content TEXT NOT NULL CHECK (length(trim(content)) > 0), -- 确保内容非空
    description TEXT, -- 内容摘要/描述
    author VARCHAR(100), -- 作者
    source_url TEXT CHECK (source_url ~ '^https?://'), -- 确保URL格式正确
    
    -- 分类和平台
    category VARCHAR(50) NOT NULL CHECK (length(trim(category)) > 0), -- 分类：穿搭、美妆、居家、健康等
    platform VARCHAR(50) NOT NULL CHECK (length(trim(platform)) > 0), -- 平台：小红书、抖音、微博等
    hot_category VARCHAR(20) CHECK (hot_category IN ('viral', 'trending', 'normal')), -- 热门分类：爆文、热门、普通
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')), -- 状态
    
    -- 媒体资源
    thumbnail_url TEXT CHECK (thumbnail_url IS NULL OR thumbnail_url ~ '^https?://'), -- 封面图片URL
    images_urls JSONB DEFAULT '[]' CHECK (jsonb_typeof(images_urls) = 'array'), -- 图片URL数组
    video_url TEXT CHECK (video_url IS NULL OR video_url ~ '^https?://'), -- 视频URL
    
    -- 数据统计 (使用BIGINT支持大数值，DECIMAL精度更高)
    views_count BIGINT DEFAULT 0 CHECK (views_count >= 0), -- 浏览量
    likes_count BIGINT DEFAULT 0 CHECK (likes_count >= 0), -- 点赞数
    shares_count BIGINT DEFAULT 0 CHECK (shares_count >= 0), -- 分享数
    comments_count BIGINT DEFAULT 0 CHECK (comments_count >= 0), -- 评论数
    favorites_count BIGINT DEFAULT 0 CHECK (favorites_count >= 0), -- 收藏数
    engagement_rate DECIMAL(7,4) DEFAULT 0.0000 CHECK (engagement_rate >= 0 AND engagement_rate <= 100), -- 互动率 (%)，支持更高精度
    
    -- 评论数据
    top_comments JSONB DEFAULT '[]' CHECK (jsonb_typeof(top_comments) = 'array'), -- 前5个热门评论
    
    -- 标签和关键词
    tags JSONB DEFAULT '[]' CHECK (jsonb_typeof(tags) = 'array'), -- 标签数组
    keywords JSONB DEFAULT '[]' CHECK (jsonb_typeof(keywords) = 'array'), -- 关键词数组
    
    -- 时间字段
    published_at TIMESTAMP WITH TIME ZONE CHECK (published_at IS NULL OR published_at <= CURRENT_TIMESTAMP), -- 发布时间不能是未来
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- 确保更新时间不早于创建时间
    CONSTRAINT lab_content_library_time_check CHECK (updated_at >= created_at),
    -- 如果已发布，则必须有发布时间
    CONSTRAINT lab_content_library_publish_check CHECK (
        (status = 'published' AND published_at IS NOT NULL) OR 
        (status IN ('draft', 'archived'))
    )
);

-- 核心索引（基础筛选和排序）
CREATE INDEX IF NOT EXISTS idx_lab_content_library_category ON lab_content_library(category);
CREATE INDEX IF NOT EXISTS idx_lab_content_library_platform ON lab_content_library(platform);
CREATE INDEX IF NOT EXISTS idx_lab_content_library_status ON lab_content_library(status);
CREATE INDEX IF NOT EXISTS idx_lab_content_library_hot_category ON lab_content_library(hot_category);

-- 时间索引（最常用的排序字段）
CREATE INDEX IF NOT EXISTS idx_lab_content_library_created_at ON lab_content_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_content_library_published_at ON lab_content_library(published_at DESC);

-- 数据统计索引（用于热门排序）
CREATE INDEX IF NOT EXISTS idx_lab_content_library_likes_count ON lab_content_library(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_lab_content_library_views_count ON lab_content_library(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_lab_content_library_engagement_rate ON lab_content_library(engagement_rate DESC);

-- 最重要的复合索引（覆盖最常见的查询组合）
CREATE INDEX IF NOT EXISTS idx_lab_content_library_status_created ON lab_content_library(status, created_at DESC);

-- 搜索索引（使用通用配置，兼容Supabase）
CREATE INDEX IF NOT EXISTS idx_lab_content_library_title_search ON lab_content_library USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_lab_content_library_content_search ON lab_content_library USING GIN(to_tsvector('english', content));

-- JSON 字段索引（标签查询）
CREATE INDEX IF NOT EXISTS idx_lab_content_library_tags ON lab_content_library USING GIN(tags);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lab_content_library_updated_at 
    BEFORE UPDATE ON lab_content_library 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建基础统计视图（简化版）
CREATE OR REPLACE VIEW lab_content_library_stats AS
SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'published') as published_count,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
    COUNT(*) FILTER (WHERE hot_category = 'viral') as viral_count,
    COUNT(*) FILTER (WHERE hot_category = 'trending') as trending_count,
    ROUND(AVG(engagement_rate), 2) as avg_engagement_rate,
    SUM(views_count) as total_views,
    SUM(likes_count) as total_likes,
    SUM(comments_count) as total_comments,
    SUM(favorites_count) as total_favorites
FROM lab_content_library;

-- 实用函数：自动判断热门程度
CREATE OR REPLACE FUNCTION auto_determine_hot_category(
    p_engagement_rate DECIMAL,
    p_likes_count BIGINT,
    p_views_count BIGINT
) RETURNS VARCHAR AS $$
BEGIN
    -- 爆文标准：互动率>15% 或 点赞数>10000 或 浏览量>1000000
    IF p_engagement_rate > 15 OR p_likes_count > 10000 OR p_views_count > 1000000 THEN
        RETURN 'viral';
    -- 热门标准：互动率>8% 或 点赞数>3000 或 浏览量>300000
    ELSIF p_engagement_rate > 8 OR p_likes_count > 3000 OR p_views_count > 300000 THEN
        RETURN 'trending';
    ELSE
        RETURN 'normal';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 触发器：自动设置热门分类
CREATE OR REPLACE FUNCTION auto_set_hot_category()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果没有手动设置热门分类，则自动计算
    IF NEW.hot_category IS NULL THEN
        NEW.hot_category := auto_determine_hot_category(
            NEW.engagement_rate,
            NEW.likes_count,
            NEW.views_count
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_auto_set_hot_category_trigger
    BEFORE INSERT OR UPDATE ON lab_content_library
    FOR EACH ROW EXECUTE FUNCTION auto_set_hot_category();

-- 简化的实用函数
CREATE OR REPLACE FUNCTION lab_cleanup_old_drafts(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM lab_content_library 
    WHERE status = 'draft' 
    AND created_at < CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL
    AND updated_at < CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab_check_data_quality()
RETURNS TABLE(
    check_name TEXT,
    issue_count BIGINT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT 'missing_title_content'::TEXT, COUNT(*), '标题或内容为空'::TEXT
    FROM lab_content_library WHERE length(trim(title)) = 0 OR length(trim(content)) = 0;
    
    RETURN QUERY SELECT 'invalid_urls'::TEXT, COUNT(*), '包含无效URL'::TEXT
    FROM lab_content_library WHERE (source_url IS NOT NULL AND source_url !~ '^https?://')
       OR (thumbnail_url IS NOT NULL AND thumbnail_url !~ '^https?://');
    
    RETURN QUERY SELECT 'abnormal_engagement'::TEXT, COUNT(*), '互动率异常'::TEXT
    FROM lab_content_library WHERE engagement_rate > 100 OR engagement_rate < 0;
    
    RETURN QUERY SELECT 'published_without_date'::TEXT, COUNT(*), '已发布但缺少发布时间'::TEXT
    FROM lab_content_library WHERE status = 'published' AND published_at IS NULL;
END;
$$ LANGUAGE plpgsql;



-- 添加表注释（文档说明）
COMMENT ON TABLE lab_content_library IS '爆文库管理主表 - 存储所有内容相关数据，包括统计信息、媒体资源和分析数据';
COMMENT ON COLUMN lab_content_library.id IS '唯一标识符，使用UUID格式';
COMMENT ON COLUMN lab_content_library.title IS '内容标题，最大500字符，不能为空';
COMMENT ON COLUMN lab_content_library.content IS '内容正文，不限长度，不能为空';
COMMENT ON COLUMN lab_content_library.hot_category IS '热门程度分类：viral(爆文), trending(热门), normal(普通)';
COMMENT ON COLUMN lab_content_library.engagement_rate IS '互动率百分比，精确到小数点后4位，范围0-100';
COMMENT ON COLUMN lab_content_library.top_comments IS 'JSON格式存储的热门评论数据，最多5条';
COMMENT ON COLUMN lab_content_library.tags IS 'JSON数组格式的标签列表';
COMMENT ON COLUMN lab_content_library.keywords IS 'JSON数组格式的关键词列表';

-- ===========================================
-- 🔒 行级安全策略 (admin权限控制 + 服务角色绕过)
-- ===========================================

-- 启用 RLS
ALTER TABLE lab_content_library ENABLE ROW LEVEL SECURITY;

-- 严格策略：只有admin角色可以访问数据
CREATE POLICY "lab_admin_only_access" ON lab_content_library
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = auth.users.id
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 注意：API路由使用服务角色密钥，可以绕过RLS策略
-- 前端用户必须有admin权限才能直接访问数据

-- 注意：视图不支持RLS，通过底层表的RLS自动保护
-- 由于lab_content_library表已启用RLS，基于它的视图会自动继承权限控制

-- ===========================================
-- 🔑 设置admin权限
-- ===========================================

/*
简化的安全策略：只有admin用户可以完全访问爆文库数据

📝 设置admin角色（在Supabase中执行）：
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your_email@example.com';

🔒 权限说明：
- ✅ admin用户：前端可直接访问所有数据（增删改查）
- ✅ 服务角色：API路由绕过RLS，可执行所有操作
- ❌ 普通用户：前端无法直接访问数据，只能通过API
- ❌ 匿名用户：无法访问任何数据

API架构：
- 前端 → API路由（服务角色）→ 数据库（绕过RLS）
- admin前端 → 直接访问数据库（通过RLS验证）
*/

-- 性能优化建议注释
/*
建议的定期维护操作：

1. 重建索引（每月）：
   REINDEX TABLE lab_content_library;

2. 更新表统计信息（每周）：
   ANALYZE lab_content_library;

3. 清理过期草稿（每月）：
   SELECT lab_cleanup_old_drafts(90);

4. 数据质量检查（每周）：
   SELECT * FROM lab_check_data_quality();

5. 查看基础统计：
   SELECT * FROM lab_content_library_stats;

6. 查询热门内容（直接SQL）：
   SELECT * FROM lab_content_library 
   WHERE hot_category = 'viral' 
   ORDER BY engagement_rate DESC LIMIT 10;
*/
