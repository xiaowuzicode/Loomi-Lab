-- =====================================
-- 创建导入历史表 - Supabase Migration
-- =====================================

-- 创建导入历史表
CREATE TABLE IF NOT EXISTS public.lab_import_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 基础信息
    collection_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('json', 'csv', 'txt', 'pdf')),
    file_size BIGINT NOT NULL,
    
    -- 导入状态
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('success', 'failed', 'processing')),
    imported_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- 字段映射（JSON格式）
    field_mappings JSONB,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- 其他元数据
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_lab_import_history_collection ON public.lab_import_history(collection_name);
CREATE INDEX IF NOT EXISTS idx_lab_import_history_status ON public.lab_import_history(status);
CREATE INDEX IF NOT EXISTS idx_lab_import_history_created_at ON public.lab_import_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_import_history_file_type ON public.lab_import_history(file_type);

-- 为JSON字段创建GIN索引（如果需要复杂JSON查询）
CREATE INDEX IF NOT EXISTS idx_lab_import_history_field_mappings ON public.lab_import_history USING GIN(field_mappings);
CREATE INDEX IF NOT EXISTS idx_lab_import_history_metadata ON public.lab_import_history USING GIN(metadata);

-- 添加表注释
COMMENT ON TABLE public.lab_import_history IS '文件导入历史记录表，用于跟踪知识库数据导入操作';
COMMENT ON COLUMN public.lab_import_history.collection_name IS '目标集合/知识库名称';
COMMENT ON COLUMN public.lab_import_history.file_name IS '上传的文件名';
COMMENT ON COLUMN public.lab_import_history.file_type IS '文件类型：json, csv, txt, pdf';
COMMENT ON COLUMN public.lab_import_history.file_size IS '文件大小（字节）';
COMMENT ON COLUMN public.lab_import_history.status IS '导入状态：success, failed, processing';
COMMENT ON COLUMN public.lab_import_history.imported_count IS '成功导入的记录数量';
COMMENT ON COLUMN public.lab_import_history.error_message IS '导入失败时的错误信息';
COMMENT ON COLUMN public.lab_import_history.field_mappings IS '字段映射配置（JSON格式）';
COMMENT ON COLUMN public.lab_import_history.metadata IS '其他元数据信息';

-- 创建函数：自动更新completed_at字段（使用更具体的命名）
CREATE OR REPLACE FUNCTION update_lab_import_history_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- 当状态从processing变为success或failed时，自动设置completed_at
    IF OLD.status = 'processing' AND NEW.status IN ('success', 'failed') THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（使用更具体的命名避免冲突）
DROP TRIGGER IF EXISTS trigger_lab_import_history_update_completed_at ON public.lab_import_history;
CREATE TRIGGER trigger_lab_import_history_update_completed_at
    BEFORE UPDATE ON public.lab_import_history
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_import_history_completed_at();

-- 表已创建，准备接收真实的导入历史数据

-- 设置RLS（Row Level Security）策略（如果需要）
-- ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- 创建视图：最近的导入历史（最近30天）
CREATE OR REPLACE VIEW public.lab_recent_import_history AS
SELECT 
    *,
    CASE 
        WHEN completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (completed_at - created_at))::INTEGER
        ELSE NULL 
    END as duration_seconds
FROM public.lab_import_history
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

COMMENT ON VIEW public.lab_recent_import_history IS '最近30天的导入历史记录，包含处理持续时间';

-- 创建统计视图：按集合分组的导入统计
CREATE OR REPLACE VIEW public.lab_import_stats_by_collection AS
SELECT 
    collection_name,
    COUNT(*) as total_imports,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_imports,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_imports,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_imports,
    SUM(CASE WHEN status = 'success' THEN imported_count ELSE 0 END) as total_imported_records,
    AVG(file_size) as avg_file_size,
    MAX(created_at) as last_import_at
FROM public.lab_import_history
GROUP BY collection_name
ORDER BY total_imports DESC;

COMMENT ON VIEW public.lab_import_stats_by_collection IS '按知识库分组的导入统计信息';

-- 完成提示
SELECT 'Import history table and related objects created successfully!' as result;
