import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ApiResponse } from '@/types'
import { generateQueryEmbedding, isValidUuid } from '@/lib/posts-embedding'

interface VectorSearchRequestBody {
  userId?: string
  query?: string
  topK?: number
  minScore?: number
}

function sanitizeTopK(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 3
  const parsed = Math.floor(raw)
  return Math.min(Math.max(parsed, 1), 10)
}

function sanitizeMinScore(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0
  if (raw < 0) return 0
  if (raw > 1) return 1
  return raw
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as VectorSearchRequestBody
    const { userId, query, topK, minScore } = body || {}

    if (!isValidUuid(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'query 不能为空' }, { status: 400 })
    }

    const limit = sanitizeTopK(topK)
    const threshold = sanitizeMinScore(minScore)

    const queryEmbedding = await generateQueryEmbedding(query)

    const { data, error } = await supabaseServiceRole.rpc('book_search_posts_by_embedding', {
      input_user_id: userId,
      query_embedding: queryEmbedding,
      match_count: limit,
      match_threshold: threshold,
    })

    if (error) {
      console.error('帖子向量检索失败:', error)
      return NextResponse.json<ApiResponse>({ success: false, error: '向量检索执行失败' }, { status: 500 })
    }

    const results = (data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      content_type: row.content_type,
      content: row.content,
      author: row.author,
      tags: Array.isArray(row.tags) ? row.tags : [],
      score: typeof row.score === 'number' ? row.score : 0,
    }))

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        query,
        results,
      },
    })
  } catch (error) {
    console.error('POST /api/posts-library/vector-search 失败:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
