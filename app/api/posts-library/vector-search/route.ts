import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase'
import type { ApiResponse } from '@/types'
import { generateQueryEmbedding, isValidUuid } from '@/lib/posts-embedding'

interface VectorSearchRequestBody {
  userId?: string
  query?: string
  topK?: number
  minScore?: number
  foldId?: string | null
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
    const { userId, query, topK, minScore, foldId } = body || {}

    if (!isValidUuid(userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId 缺失或格式无效' }, { status: 400 })
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'query 不能为空' }, { status: 400 })
    }

    const limit = sanitizeTopK(topK)
    const threshold = sanitizeMinScore(minScore)

    // 解析多层查询：按 '->' 分隔，最多3层，去掉空段
    const queries: string[] = String(query)
      .split('->')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3)

    // 兼容只传单层
    if (queries.length === 0) {
      queries.push(String(query).trim())
    }

    // 计算每层保留数量（逐层翻倍：k, 2k, 4k ... 直至最终层为 k）
    const keepSizes: number[] = (() => {
      const L = queries.length
      const k = limit
      if (L === 1) return [k]
      const sizes: number[] = new Array(L)
      // 第一层保留 2^(L-1) * k，第二层 2^(L-2) * k ... 最终层 k
      for (let i = 0; i < L - 1; i += 1) sizes[i] = Math.pow(2, (L - 1) - i) * k
      sizes[L - 1] = k
      return sizes
    })()

    // 生成每层的查询向量（并行）
    const queryEmbeddings: number[][] = await Promise.all(
      queries.map(q => generateQueryEmbedding(q))
    )

    // 解析 foldId：支持 uuid / 'null' / 'none' / 不传
    let parsedFold: string | null | undefined = undefined
    if (typeof foldId !== 'undefined') {
      const raw = String(foldId).trim()
      if (!raw) {
        parsedFold = undefined
      } else if (raw.toLowerCase() === 'null' || raw.toLowerCase() === 'none') {
        parsedFold = null
      } else if (isValidUuid(raw)) {
        parsedFold = raw
      } else {
        return NextResponse.json<ApiResponse>({ success: false, error: 'foldId 无效' }, { status: 400 })
      }
    }

    // 第一层：按用户做语义检索，过采样以便后续折叠与过滤
    const firstTarget = keepSizes[0]
    const oversample = Math.min(Math.max(firstTarget * 2, limit * 5), 400)

    const { data, error } = await supabaseServiceRole.rpc('book_search_posts_by_embedding', {
      input_user_id: userId,
      query_embedding: queryEmbeddings[0],
      match_count: oversample,
      match_threshold: threshold,
    })

    if (error) {
      console.error('帖子向量检索失败:', error)
      return NextResponse.json<ApiResponse>({ success: false, error: '向量检索执行失败' }, { status: 500 })
    }

    let rawResults = (data ?? []).map((row: any) => ({
      id: row.id as string,
      user_id: row.user_id,
      title: row.title,
      content_type: row.content_type,
      content: row.content,
      author: row.author,
      tags: Array.isArray(row.tags) ? row.tags : [],
      score: typeof row.score === 'number' ? row.score : 0,
    }))

    if (typeof parsedFold !== 'undefined') {
      const ids = rawResults.map((r: { id: string }) => r.id)
      if (ids.length > 0) {
        const { data: foldRows, error: foldErr } = await supabaseServiceRole
          .from('knowledge_base')
          .select('id,fold_id')
          .in('id', ids)
          .eq('user_id', userId)

        const foldMap = new Map<string, string | null>((foldRows || []).map((r: { id: string; fold_id: string | null }) => [r.id, r.fold_id]))
        rawResults = rawResults.filter((r: { id: string }) => {
          const f = foldMap.get(r.id)
          if (parsedFold === null) return f === null
          // parsedFold 为 uuid
          return f === parsedFold
        })
      } else {
        rawResults = []
      }
    }

    // 第一层保留
    let layerCandidates: Array<{
      id: string
      user_id: string
      title: string
      content_type: string
      content: string
      author: string
      tags: string[]
      score: number
    }> = rawResults.slice(0, keepSizes[0])

    // 若只有一层，直接返回前 k 条
    if (queries.length === 1) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { query, results: layerCandidates.slice(0, limit) },
      })
    }

    // 预取候选的向量，用于后续层重排
    const candidateIds: string[] = layerCandidates.map((c: { id: string }) => c.id)
    const { data: embedRows, error: embedErr } = await supabaseServiceRole
      .from('knowledge_base')
      .select('id,embedding')
      .in('id', candidateIds)
      .eq('user_id', userId)
    if (embedErr) {
      console.error('向量检索重排查询向量失败:', embedErr)
      return NextResponse.json<ApiResponse>({ success: false, error: '向量检索重排失败' }, { status: 500 })
    }
    // 兼容不同返回类型的 embedding（number[] / Float32Array / string）
    const toVector = (raw: any): number[] | null => {
      if (!raw) return null
      if (Array.isArray(raw)) return (raw as any[]).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n))
      if (typeof raw === 'object' && typeof (raw as any).length === 'number') {
        try {
          return Array.from(raw as any).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n))
        } catch { /* noop */ }
      }
      if (typeof raw === 'string') {
        const s = raw.trim()
        // 尝试 JSON 数组
        if (s.startsWith('[') && s.endsWith(']')) {
          try {
            const arr = JSON.parse(s)
            if (Array.isArray(arr)) {
              const v = arr.map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n))
              if (v.length > 0) return v
            }
          } catch { /* noop */ }
        }
        // 尝试 pg 数组风格 "{1,2,3}"
        if (s.startsWith('{') && s.endsWith('}')) {
          const body = s.slice(1, -1)
          const v = body.split(',').map(x => Number(x.trim())).filter(n => Number.isFinite(n))
          if (v.length > 0) return v
        }
      }
      return null
    }

    const embedMap = new Map<string, number[]>()
    for (const r of (embedRows || []) as Array<{ id: string; embedding: any }>) {
      const vec = toVector(r.embedding)
      if (vec && vec.length > 0) embedMap.set(r.id, vec)
    }

    // 重排函数（计算与给定查询向量的余弦相似度，向量已归一化，使用点积）
    const rerankByEmbedding = (
      candidates: typeof layerCandidates,
      queryVec: number[],
      keep: number
    ) => {
      const scored = candidates
        .map((c: { id: string } & any) => {
          const v = embedMap.get(c.id)
          if (!v || !Array.isArray(v) || v.length === 0) {
            return { c, s: -1 }
          }
          const len = Math.min(v.length, queryVec.length)
          let s = 0
          for (let i = 0; i < len; i += 1) s += (v[i] || 0) * (queryVec[i] || 0)
          return { c, s }
        })
        .sort((a, b) => b.s - a.s)
        .slice(0, keep)
      return scored.map(x => ({ ...x.c, score: x.s }))
    }

    // 第二层
    if (queries.length >= 2) {
      layerCandidates = rerankByEmbedding(layerCandidates, queryEmbeddings[1], keepSizes[1])
    }

    // 第三层
    if (queries.length >= 3) {
      layerCandidates = rerankByEmbedding(layerCandidates, queryEmbeddings[2], keepSizes[2])
    }

    const results = layerCandidates.slice(0, limit)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { query, results },
    })
  } catch (error) {
    console.error('POST /api/posts-library/vector-search 失败:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
