import OpenAI from 'openai'

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DEFAULT_EMBEDDING_DIMENSION = Number(process.env.POSTS_EMBED_DIMENSION || 1536)
const RAW_TITLE_WEIGHT = Number.isFinite(Number(process.env.POSTS_EMBED_TITLE_WEIGHT))
  ? Number(process.env.POSTS_EMBED_TITLE_WEIGHT)
  : 0.7
const RAW_CONTENT_WEIGHT = Number.isFinite(Number(process.env.POSTS_EMBED_CONTENT_WEIGHT))
  ? Number(process.env.POSTS_EMBED_CONTENT_WEIGHT)
  : 0.3
const TOTAL_WEIGHT = RAW_TITLE_WEIGHT + RAW_CONTENT_WEIGHT
const TITLE_WEIGHT = TOTAL_WEIGHT > 0 ? RAW_TITLE_WEIGHT / TOTAL_WEIGHT : 0.7
const CONTENT_WEIGHT = TOTAL_WEIGHT > 0 ? RAW_CONTENT_WEIGHT / TOTAL_WEIGHT : 0.3

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'

const openaiApiKey = process.env.OPENAI_API_KEY
const openaiClient = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    })
  : null

function validateOpenAI() {
  if (!openaiClient) {
    throw new Error('OPENAI_API_KEY 未配置，无法生成帖子向量')
  }
}

async function embedText(text: string): Promise<number[]> {
  validateOpenAI()
  const sanitized = text?.trim() ?? ''
  const input = sanitized || ' '
  const response = await openaiClient!.embeddings.create({
    model: EMBEDDING_MODEL,
    input: input.length > 8000 ? input.slice(0, 8000) : input,
  })
  return response.data[0].embedding
}

function ensureDimension(vector: number[] | undefined, fallbackDimension: number): number[] {
  if (Array.isArray(vector) && vector.length > 0) {
    return vector
  }
  return new Array(fallbackDimension).fill(0)
}

function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  if (!norm || Number.isNaN(norm) || norm === 0) {
    return vector
  }
  return vector.map(val => val / norm)
}

export async function generatePostEmbedding(title?: string | null, content?: string | null): Promise<number[]> {
  const titleText = title?.trim() ?? ''
  const contentText = content?.trim() ?? ''

  if (!titleText && !contentText) {
    return new Array(DEFAULT_EMBEDDING_DIMENSION).fill(0)
  }

  const [rawTitleEmbedding, rawContentEmbedding] = await Promise.all([
    titleText ? embedText(titleText) : Promise.resolve<number[]>([]),
    contentText ? embedText(contentText) : Promise.resolve<number[]>([]),
  ])

  const titleEmbedding = ensureDimension(rawTitleEmbedding, rawContentEmbedding.length || DEFAULT_EMBEDDING_DIMENSION)
  const contentEmbedding = ensureDimension(rawContentEmbedding, titleEmbedding.length || DEFAULT_EMBEDDING_DIMENSION)
  const dimension = Math.max(titleEmbedding.length, contentEmbedding.length, DEFAULT_EMBEDDING_DIMENSION)
  const combined: number[] = []

  for (let i = 0; i < dimension; i += 1) {
    const titleVal = titleEmbedding[i] ?? 0
    const contentVal = contentEmbedding[i] ?? 0
    combined[i] = TITLE_WEIGHT * titleVal + CONTENT_WEIGHT * contentVal
  }

  return normalizeVector(combined)
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return generatePostEmbedding(query, undefined)
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && uuidV4Regex.test(value)
}

export function parsePagination(rawPage: string | null, rawLimit: string | null, defaultLimit = 50, maxLimit = 200) {
  const page = Math.max(parseInt(rawPage ?? '1', 10) || 1, 1)
  const limitRaw = parseInt(rawLimit ?? String(defaultLimit), 10) || defaultLimit
  const limit = Math.min(Math.max(limitRaw, 1), maxLimit)
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export async function processWithConcurrency<T>(items: T[], limit: number, handler: (item: T, index: number) => Promise<void>) {
  if (items.length === 0) return
  const max = Math.max(1, Math.min(limit, items.length))
  let cursor = 0

  const worker = async () => {
    while (true) {
      const currentIndex = cursor
      cursor += 1
      if (currentIndex >= items.length) break
      await handler(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: max }, worker))
}

export const POST_VECTORIZE_DEFAULT_CONCURRENCY = Number(process.env.POSTS_VECTORIZE_DEFAULT_CONCURRENCY || 5)
export const POST_VECTORIZE_MAX_CONCURRENCY = Number(process.env.POSTS_VECTORIZE_MAX_CONCURRENCY || 10)
export const POST_VECTORIZE_MAX_BATCH = Number(process.env.POSTS_VECTORIZE_MAX_BATCH || 200)

export { uuidV4Regex }
