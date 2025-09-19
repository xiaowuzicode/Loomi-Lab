import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ApiResponse } from '@/types'
import {
  POST_VECTORIZE_DEFAULT_CONCURRENCY,
  POST_VECTORIZE_MAX_BATCH,
  POST_VECTORIZE_MAX_CONCURRENCY,
  generatePostEmbedding,
  isValidUuid,
  processWithConcurrency,
} from '@/lib/posts-embedding'

interface VectorizeRequestBody {
  userId?: string
  ids?: string[]
  concurrency?: number
}

interface VectorizeResultItem {
  id: string
  status: 'success' | 'failed' | 'skipped' | 'not_found'
  error?: string
}

function sanitizeConcurrency(raw: unknown): number {
  if (typeof raw !== 'number') {
    return POST_VECTORIZE_DEFAULT_CONCURRENCY
  }
  if (!Number.isFinite(raw)) {
    return POST_VECTORIZE_DEFAULT_CONCURRENCY
  }
  const parsed = Math.floor(raw)
  const clamped = Math.min(Math.max(parsed, 1), POST_VECTORIZE_MAX_CONCURRENCY)
  return clamped
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch (e) {
    return '未知错误'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as VectorizeRequestBody
    const { userId, ids, concurrency } = body || {}

    if (!isValidUuid(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }

    let concurrencyLimit = sanitizeConcurrency(concurrency)
    if (!Number.isFinite(concurrencyLimit) || concurrencyLimit <= 0) {
      concurrencyLimit = POST_VECTORIZE_DEFAULT_CONCURRENCY
    }

    const results: VectorizeResultItem[] = []
    const targetRecords: Array<{ id: string; title: string | null; content: string | null }> = []

    if (Array.isArray(ids)) {
      const uniqueIds = Array.from(new Set(ids.filter(id => typeof id === 'string')))
      if (uniqueIds.length === 0) {
        return NextResponse.json<ApiResponse>({ success: false, error: 'ids 至少包含 1 个有效字符串' }, { status: 400 })
      }

      const invalidIds = uniqueIds.filter(id => !isValidUuid(id))
      if (invalidIds.length > 0) {
        return NextResponse.json<ApiResponse>({ success: false, error: `存在无效的 id：${invalidIds.join(', ')}` }, { status: 400 })
      }

      const { data, error } = await supabaseServiceRole
        .from('knowledge_base')
        .select('id,user_id,title,content,embedding')
        .in('id', uniqueIds)
        .eq('user_id', userId)

      if (error) {
        console.error('批量向量化查询帖子失败:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: '查询帖子失败' }, { status: 500 })
      }

      const records = data ?? []
      const recordMap = new Map(records.map(record => [record.id, record]))

      uniqueIds.forEach(id => {
        const record = recordMap.get(id)
        if (!record) {
          results.push({ id, status: 'not_found', error: '记录不存在或不属于该用户' })
          return
        }
        if (record.embedding) {
          results.push({ id, status: 'skipped', error: '已存在向量，跳过' })
          return
        }
        targetRecords.push({ id: record.id, title: record.title, content: record.content })
      })
    } else {
      const { data, error } = await supabaseServiceRole
        .from('knowledge_base')
        .select('id,title,content')
        .eq('user_id', userId)
        .is('embedding', null)
        .order('updated_at', { ascending: false })
        .limit(POST_VECTORIZE_MAX_BATCH)

      if (error) {
        console.error('自动检索待向量化帖子失败:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: '查询待向量化帖子失败' }, { status: 500 })
      }

      (data ?? []).forEach(record => {
        targetRecords.push({ id: record.id, title: record.title, content: record.content })
      })
    }

    if (targetRecords.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          processed: 0,
          succeeded: 0,
          failed: 0,
          results,
        },
        message: '暂无待向量化的帖子',
      })
    }

    let processed = 0
    let succeeded = 0
    let failed = 0

    await processWithConcurrency(targetRecords, concurrencyLimit, async record => {
      try {
        const embedding = await generatePostEmbedding(record.title, record.content)
        const { error } = await supabaseServiceRole
          .from('knowledge_base')
          .update({ embedding })
          .eq('id', record.id)
          .eq('user_id', userId)
          .select('id')
          .single()

        if (error) {
          throw error
        }

        succeeded += 1
        results.push({ id: record.id, status: 'success' })
      } catch (error) {
        failed += 1
        const message = extractErrorMessage(error)
        console.error(`帖子 ${record.id} 向量化失败:`, message)
        results.push({ id: record.id, status: 'failed', error: message })
      } finally {
        processed += 1
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        processed,
        succeeded,
        failed,
        results,
      },
      message: '向量化完成',
    })
  } catch (error) {
    console.error('POST /api/posts-library/vectorization 失败:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
