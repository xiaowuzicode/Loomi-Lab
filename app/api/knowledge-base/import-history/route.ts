import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 文件导入历史记录API - 使用Supabase存储
 */

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ImportRecord {
  id?: string
  collection_name: string
  file_name: string
  file_type: 'csv' | 'json' | 'txt' | 'pdf'
  file_size: number
  status: 'success' | 'failed' | 'processing'
  imported_count: number
  error_message?: string
  field_mappings?: Record<string, string>
  created_at?: string
  completed_at?: string
  metadata?: Record<string, any>
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const collectionName = searchParams.get('collection')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // 构建查询
    let query = supabase
      .from('lab_import_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    // 如果指定了知识库名称，只返回该知识库的历史
    if (collectionName) {
      query = query.eq('collection_name', collectionName)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase查询错误:', error)
      return NextResponse.json({
        success: false,
        error: '获取导入历史失败'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: data || []
    })
    
  } catch (error) {
    console.error('获取导入历史失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取导入历史失败'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      collectionName, 
      fileName, 
      fileType, 
      fileSize, 
      status, 
      importedCount = 0,
      errorMessage,
      fieldMappings,
      metadata = {}
    } = body
    
    const newRecord: Omit<ImportRecord, 'id' | 'created_at' | 'completed_at'> = {
      collection_name: collectionName,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      status,
      imported_count: importedCount,
      error_message: errorMessage,
      field_mappings: fieldMappings,
      metadata
    }
    
    const { data, error } = await supabase
      .from('lab_import_history')
      .insert([newRecord])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase插入错误:', error)
      return NextResponse.json({
        success: false,
        error: '添加导入记录失败'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('添加导入记录失败:', error)
    return NextResponse.json({
      success: false,
      error: '添加导入记录失败'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, importedCount, errorMessage, metadata } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '请提供记录ID'
      }, { status: 400 })
    }
    
    // 准备更新数据
    const updateData: Partial<ImportRecord> = {}
    
    if (status !== undefined) updateData.status = status
    if (importedCount !== undefined) updateData.imported_count = importedCount
    if (errorMessage !== undefined) updateData.error_message = errorMessage
    if (metadata !== undefined) updateData.metadata = metadata
    
    const { data, error } = await supabase
      .from('lab_import_history')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase更新错误:', error)
      return NextResponse.json({
        success: false,
        error: error.code === 'PGRST116' ? '找不到指定的导入记录' : '更新导入记录失败'
      }, { status: error.code === 'PGRST116' ? 404 : 500 })
    }
    
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('更新导入记录失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新导入记录失败'
    }, { status: 500 })
  }
}
