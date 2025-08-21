import { NextRequest, NextResponse } from 'next/server'
import { TABLES } from '@/lib/db'
import { supabaseServiceRole } from '@/lib/supabase'

// 上传文件接口类型定义
interface UploadedFile {
  id: string
  file_id: string
  user_id: string
  session_id: string
  original_filename: string
  file_type: string
  file_size: number
  mime_type: string
  description: string
  upload_mode: string
  oss_url: string
  oss_object_name: string
  oss_bucket_name: string
  gemini_file_uri: string | null
  gemini_file_name: string | null
  processing_status: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const { searchParams } = new URL(request.url)
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
    // 排序参数
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '用户ID不能为空'
      }, { status: 400 })
    }

    // 查询用户上传的文件总数
    const { count: totalCount, error: countError } = await supabaseServiceRole
      .from(TABLES.UPLOADED_FILES)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('获取文件总数失败:', countError)
      return NextResponse.json({
        success: false,
        error: '获取文件总数失败'
      }, { status: 500 })
    }

    // 查询用户上传的文件列表
    const { data: files, error } = await supabaseServiceRole
      .from(TABLES.UPLOADED_FILES)
      .select('*')
      .eq('user_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取文件列表失败:', error)
      return NextResponse.json({
        success: false,
        error: '获取文件列表失败'
      }, { status: 500 })
    }
    
    // 格式化文件数据
    const formattedFiles = files.map((file: any): UploadedFile => {
      // 处理文件大小（确保是数字类型）
      const fileSize = typeof file.file_size === 'string' 
        ? parseInt(file.file_size) || 0 
        : file.file_size || 0


      return {
        id: file.id || `file_${Math.random()}`,
        file_id: file.file_id || '',
        user_id: file.user_id || userId,
        session_id: file.session_id || '',
        original_filename: file.original_filename || '未知文件名',
        file_type: file.file_type || '',
        file_size: fileSize,
        mime_type: file.mime_type || 'application/octet-stream',
        description: file.description || '',
        upload_mode: file.upload_mode || '',
        oss_url: file.oss_url || '',
        oss_object_name: file.oss_object_name || '',
        oss_bucket_name: file.oss_bucket_name || '',
        gemini_file_uri: file.gemini_file_uri || null,
        gemini_file_name: file.gemini_file_name || null,
        processing_status: file.processing_status || 'unknown',
        metadata: typeof file.metadata === 'string' 
          ? (file.metadata ? JSON.parse(file.metadata) : {}) 
          : file.metadata || {},
        created_at: file.created_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString()
      }
    })

    // 计算分页信息
    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        files: formattedFiles,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}