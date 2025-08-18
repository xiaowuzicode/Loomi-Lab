import { MilvusClient, DataType, ErrorCode } from '@zilliz/milvus2-sdk-node'

// Milvus环境类型
export type MilvusEnvironment = 'local' | 'hosted' | 'aliyun'

// 获取Milvus配置
function getMilvusConfig(env: MilvusEnvironment = 'local') {
  switch (env) {
    case 'hosted':
      // 托管服务配置（Zilliz Cloud）
      return {
        address: process.env.MILVUS_HOSTED_URL || '',
        token: process.env.MILVUS_HOSTED_TOKEN || '',
        database: process.env.MILVUS_HOSTED_DATABASE || 'default',
      }
    case 'aliyun':
      // 阿里云服务配置
      return {
        address: process.env.MILVUS_ALIYUN_URL || '',
        token: process.env.MILVUS_ALIYUN_TOKEN || '',
        database: process.env.MILVUS_ALIYUN_DATABASE || 'default',
      }
    default: // 'local'
      // 本地Docker配置
      return {
        address: process.env.MILVUS_ENDPOINT || 'http://127.0.0.1:19530',
        // 本地 Milvus 通常不需要认证，但可以配置token
        ...(process.env.MILVUS_USERNAME && process.env.MILVUS_PASSWORD ? {
          token: `${process.env.MILVUS_USERNAME}:${process.env.MILVUS_PASSWORD}`,
        } : {}),
        database: process.env.MILVUS_DATABASE || 'default',
      }
  }
}

// Milvus 功能开关 - 可以通过环境变量禁用
const MILVUS_ENABLED = process.env.MILVUS_ENABLED !== 'false'

export class MilvusService {
  private client: MilvusClient | null = null
  private isConnected: boolean = false
  private currentEnv: MilvusEnvironment
  private config: any

  constructor(env: MilvusEnvironment = 'local') {
    this.currentEnv = env
    this.config = getMilvusConfig(env)
    console.log(`🏗️ 创建 ${env} 环境的Milvus服务实例`)
    console.log(`⚙️ 配置信息:`, {
      environment: env,
      address: this.config.address,
      hasToken: !!this.config.token,
      database: this.config.database
    })
    // 延迟初始化，避免构建时加载 Milvus SDK
  }

  /**
   * 切换环境并重新连接
   */
  switchEnvironment(env: MilvusEnvironment): void {
    if (this.currentEnv !== env) {
      this.currentEnv = env
      this.config = getMilvusConfig(env)
      this.client = null // 重置客户端，下次使用时重新创建
      this.isConnected = false
      console.log(`🔄 已切换到 ${env === 'local' ? '本地' : '托管'} 环境`)
    }
  }

  /**
   * 获取当前环境
   */
  getCurrentEnvironment(): MilvusEnvironment {
    return this.currentEnv
  }

  private initClient() {
    if (!this.client) {
      this.client = new MilvusClient(this.config)
      console.log(`🔗 初始化 ${this.currentEnv === 'local' ? '本地' : '托管'} Milvus 客户端:`, this.config.address)
    }
    return this.client
  }

  /**
   * 连接到 Milvus 数据库
   */
  async connect(): Promise<boolean> {
    if (!MILVUS_ENABLED) {
      console.log('⚠️ Milvus 功能已禁用')
      return false
    }

    try {
      const client = this.initClient()
      const res = await client.checkHealth()
      if (res.isHealthy) {
        this.isConnected = true
        console.log(`✅ Milvus ${this.currentEnv === 'local' ? '本地' : '托管'} 环境连接成功`)
        return true
      }
      console.error(`❌ Milvus ${this.currentEnv === 'local' ? '本地' : '托管'} 环境健康检查失败`)
      return false
    } catch (error: any) {
      const errorMsg = error?.details || error?.message || error
      if (errorMsg.includes('cluster does not exist') || errorMsg.includes('UNAUTHENTICATED')) {
        console.warn(`⚠️ Milvus ${this.currentEnv === 'local' ? '本地' : '托管'} 环境集群不可用 - 功能将被禁用:`, errorMsg)
      } else {
        console.error(`❌ Milvus ${this.currentEnv === 'local' ? '本地' : '托管'} 环境连接失败:`, errorMsg)
      }
      this.isConnected = false
      return false
    }
  }

  /**
   * 创建知识库集合
   */
  async createKnowledgeBaseCollection(collectionName: string, dimension: number = 1536): Promise<boolean> {
    try {
      const client = this.initClient()
      // 检查集合是否已存在
      const hasCollection = await client.hasCollection({
        collection_name: collectionName,
      })

      if (hasCollection.value) {
        console.log(`📚 集合 ${collectionName} 已存在`)
        return true
      }

      // 创建集合
      const createRes = await client.createCollection({
        collection_name: collectionName,
        fields: [
          {
            name: 'id',
            description: '文档唯一标识',
            data_type: DataType.VarChar,
            max_length: 100,
            is_primary_key: true,
          },
          {
            name: 'vector',
            description: '文档向量表示',
            data_type: DataType.FloatVector,
            dim: dimension,
          },
          {
            name: 'text',
            description: '原始文本内容',
            data_type: DataType.VarChar,
            max_length: 65535,
          },
          {
            name: 'source',
            description: '文档来源',
            data_type: DataType.VarChar,
            max_length: 500,
          },
          {
            name: 'metadata',
            description: '文档元数据 JSON',
            data_type: DataType.VarChar,
            max_length: 65535, // 增加到最大varchar长度
          },
          {
            name: 'created_at',
            description: '创建时间戳',
            data_type: DataType.Int64,
          },
        ],
      })

      if (createRes.error_code === ErrorCode.SUCCESS) {
        // 创建索引
        const indexRes = await client.createIndex({
          collection_name: collectionName,
          field_name: 'vector',
          index_type: 'IVF_FLAT',
          metric_type: 'IP', // 内积相似度
          params: { nlist: 1024 },
        })

        if (indexRes.error_code === ErrorCode.SUCCESS) {
          // 加载集合到内存
          await client.loadCollection({
            collection_name: collectionName,
          })

          console.log(`✅ 知识库集合 ${collectionName} 创建成功`)
          return true
        }
      }

      console.error(`❌ 创建知识库集合失败: ${createRes.reason}`)
      return false
    } catch (error) {
      console.error('❌ 创建知识库集合异常:', error)
      return false
    }
  }

  /**
   * 插入文档向量
   */
  async insertDocuments(
    collectionName: string,
    documents: {
      id: string
      vector: number[]
      text: string
      source: string
      metadata?: any
    }[]
  ): Promise<boolean> {
    try {
      const data = documents.map(doc => ({
        id: doc.id,
        vector: doc.vector,
        text: doc.text,
        source: doc.source,
        metadata: JSON.stringify(doc.metadata || {}),
        created_at: Date.now(),
      }))

      const client = this.initClient()
      const insertRes = await client.insert({
        collection_name: collectionName,
        data: data,
      })

      if (insertRes.status.error_code === ErrorCode.SUCCESS) {
        // 刷新数据到持久化存储
        await client.flush({
          collection_names: [collectionName],
        })

        console.log(`✅ 成功插入 ${documents.length} 个文档到 ${collectionName}`)
        return true
      }

      console.error(`❌ 插入文档失败: ${insertRes.status.reason}`)
      return false
    } catch (error) {
      console.error('❌ 插入文档异常:', error)
      return false
    }
  }

  /**
   * 向量相似度搜索 (RAG 召回)
   */
  async searchSimilarDocuments(
    collectionName: string,
    queryVector: number[],
    topK: number = 5,
    minScore: number = 0.5
  ): Promise<{
    id: string
    text: string
    source: string
    metadata: any
    score: number
  }[]> {
    try {
      const client = this.initClient()
      const searchRes = await client.search({
        collection_name: collectionName,
        vector: queryVector,
        filter: '', // 可以添加过滤条件
        limit: topK,
        output_fields: ['text', 'source', 'metadata'],
        metric_type: 'IP',
        params: { nprobe: 10 },
      })

      if (searchRes.status.error_code === ErrorCode.SUCCESS) {
        const results = searchRes.results.map((result: any) => ({
          id: result.id,
          text: result.text,
          source: result.source,
          metadata: JSON.parse(result.metadata || '{}'),
          score: result.score,
        })).filter((result: any) => result.score >= minScore)

        console.log(`🔍 在 ${collectionName} 中找到 ${results.length} 个相似文档`)
        return results
      }

      console.error(`❌ 搜索失败: ${searchRes.status.reason}`)
      return []
    } catch (error) {
      console.error('❌ 搜索异常:', error)
      return []
    }
  }

  /**
   * 获取集合统计信息
   */
  async getCollectionStats(collectionName: string) {
    try {
      const client = this.initClient()
      const statsRes = await client.getCollectionStatistics({
        collection_name: collectionName,
      })

      if (statsRes.status.error_code === ErrorCode.SUCCESS) {
        const stats = statsRes.stats.reduce((acc: any, stat: any) => {
          acc[stat.key] = stat.value
          return acc
        }, {})

        return {
          name: collectionName,
          row_count: parseInt(stats.row_count || '0'),
          data_size: stats.data_size || '0',
        }
      }

      return null
    } catch (error) {
      console.error('❌ 获取集合统计异常:', error)
      return null
    }
  }

  /**
   * 列出所有集合
   */
  async listCollections(): Promise<string[]> {
    try {
      const client = this.initClient()
      const res = await client.showCollections()
      if (res.status.error_code === ErrorCode.SUCCESS) {
        return res.data?.map(collection => collection.name) || []
      }
      return []
    } catch (error) {
      console.error('❌ 列出集合异常:', error)
      return []
    }
  }

  /**
   * 删除集合
   */
  async dropCollection(collectionName: string): Promise<boolean> {
    try {
      const client = this.initClient()
      const res = await client.dropCollection({
        collection_name: collectionName,
      })

      if (res.error_code === ErrorCode.SUCCESS) {
        console.log(`✅ 成功删除集合 ${collectionName}`)
        return true
      }

      console.error(`❌ 删除集合失败: ${res.reason}`)
      return false
    } catch (error) {
      console.error('❌ 删除集合异常:', error)
      return false
    }
  }

  /**
   * 删除指定ID的记录
   */
  async deleteEntity(collectionName: string, ids: string[]): Promise<boolean> {
    try {
      const client = this.initClient()
      
      // 删除指定ID的实体 - 使用表达式方式
      const idsStr = ids.map(id => `"${id}"`).join(', ')
      const res = await client.deleteEntities({
        collection_name: collectionName,
        expr: `id in [${idsStr}]`
      })

      if ((res as any).status?.error_code === ErrorCode.SUCCESS) {
        console.log(`✅ 成功删除 ${ids.length} 条记录从集合 ${collectionName}`)
        return true
      }

      console.error(`❌ 删除记录失败: ${(res as any).status?.reason || 'Unknown error'}`)
      return false
    } catch (error) {
      console.error('❌ 删除记录异常:', error)
      return false
    }
  }

  /**
   * 根据表达式删除记录
   */
  async deleteByExpression(collectionName: string, expression: string): Promise<boolean> {
    try {
      const client = this.initClient()
      
      // 使用表达式删除实体
      const res = await client.deleteEntities({
        collection_name: collectionName,
        expr: expression
      })

      if ((res as any).status?.error_code === ErrorCode.SUCCESS) {
        console.log(`✅ 成功根据条件删除记录: ${expression}`)
        return true
      }

      console.error(`❌ 条件删除失败: ${(res as any).status?.reason || 'Unknown error'}`)
      return false
    } catch (error) {
      console.error('❌ 条件删除异常:', error)
      return false
    }
  }

  /**
   * 清空集合中的所有数据（保留集合结构）
   */
  async clearCollection(collectionName: string): Promise<boolean> {
    try {
      // 获取集合统计信息来确认是否有数据
      const stats = await this.getCollectionStats(collectionName)
      
      if (!stats || stats.row_count === 0) {
        console.log(`✅ 集合 ${collectionName} 已经是空的`)
        return true
      }

      // 方法1: 尝试使用通用的删除表达式
      // 对于字符串主键，尝试 id like "%"（匹配所有记录）
      let success = await this.deleteByExpression(collectionName, 'id like "%"')
      
      if (!success) {
        console.log('⚠️ 通用删除表达式失败，尝试 drop-recreate 方法')
        
        // 方法2: Drop 然后重新创建集合（更可靠）
        success = await this.recreateCollection(collectionName)
      }
      
      if (success) {
        // 验证清空是否成功
        const afterStats = await this.getCollectionStats(collectionName)
        if (!afterStats || afterStats.row_count === 0) {
          console.log(`✅ 集合 ${collectionName} 已成功清空`)
          return true
        } else {
          console.error(`❌ 清空验证失败，集合仍有 ${afterStats.row_count} 条记录`)
          return false
        }
      }
      
      return false
    } catch (error) {
      console.error('❌ 清空集合异常:', error)
      return false
    }
  }

  /**
   * 重新创建集合（drop + create）
   */
  private async recreateCollection(collectionName: string): Promise<boolean> {
    try {
      console.log(`🔄 开始重新创建集合: ${collectionName}`)
      
      // 1. 删除原集合
      const dropSuccess = await this.dropCollection(collectionName)
      if (!dropSuccess) {
        console.error('❌ 删除原集合失败')
        return false
      }
      
      // 2. 重新创建集合（使用默认参数）
      const createSuccess = await this.createKnowledgeBaseCollection(collectionName, 1536)
      if (createSuccess) {
        console.log(`✅ 集合 ${collectionName} 重新创建成功`)
        return true
      } else {
        console.error('❌ 重新创建集合失败')
        return false
      }
    } catch (error) {
      console.error('❌ 重新创建集合异常:', error)
      return false
    }
  }

  /**
   * 关闭连接
   */
  async disconnect(): Promise<void> {
    try {
      // Milvus SDK 会自动管理连接池，通常不需要手动关闭
      this.isConnected = false
      console.log('✅ Milvus 连接已关闭')
    } catch (error) {
      console.error('❌ 关闭 Milvus 连接异常:', error)
    }
  }

  /**
   * 检查连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

/**
 * 生成模拟向量（fallback方案）
 */
function generateMockEmbedding(text: string): number[] {
  const dimension = 1536
  const vector = Array.from({ length: dimension }, () => Math.random() - 0.5)
  
  // 归一化向量
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  return vector.map(val => val / norm)
}

// 创建全局 Milvus 服务实例（默认本地环境）
const defaultEnv = (process.env.MILVUS_DEFAULT_ENV as MilvusEnvironment) || 'local'
export const milvusService = new MilvusService(defaultEnv)

// Milvus环境管理工具
export class MilvusEnvironmentManager {
  // 创建指定环境的Milvus服务实例
  static createService(env: MilvusEnvironment): MilvusService {
    return new MilvusService(env)
  }
  
  // 获取环境配置信息
  static getEnvironmentInfo(env: MilvusEnvironment) {
    const config = getMilvusConfig(env)
    const envNames = {
      'local': '本地环境',
      'hosted': '托管环境', 
      'aliyun': '阿里云环境'
    }
    
    return {
      environment: env,
      address: config.address,
      database: config.database,
      hasToken: !!config.token,
      name: envNames[env]
    }
  }
  
  // 获取所有可用环境
  static getAvailableEnvironments(): { env: MilvusEnvironment, info: any }[] {
    return [
      { env: 'local', info: this.getEnvironmentInfo('local') },
      { env: 'hosted', info: this.getEnvironmentInfo('hosted') },
      { env: 'aliyun', info: this.getEnvironmentInfo('aliyun') }
    ]
  }
}

// 文档处理工具类
export class DocumentProcessor {
  /**
   * 真实文本向量化（使用OpenAI Embedding API）
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length === 0) {
        return new Array(1536).fill(0)
      }

      // 动态导入OpenAI（避免构建问题）
      const { OpenAI } = await import('openai')
      
      // 检查环境变量
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ 未配置OpenAI API Key，使用模拟向量')
        return generateMockEmbedding(text)
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      })

      const response = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
        input: text.substring(0, 8000) // 限制文本长度
      })

      return response.data[0].embedding

    } catch (error) {
      console.error('❌ OpenAI embedding失败，使用模拟向量:', error)
      return generateMockEmbedding(text)
    }
  }

  /**
   * 文本分块处理
   */
  static chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = []
    const sentences = text.split(/[.!?。！？]\s+/)
    
    let currentChunk = ''
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= chunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + sentence
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
        }
        currentChunk = sentence
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }
    
    return chunks.filter(chunk => chunk.length > 0)
  }

  /**
   * 批量处理文档
   */
  static async processDocument(
    text: string,
    source: string,
    metadata: any = {}
  ): Promise<{
    id: string
    vector: number[]
    text: string
    source: string
    metadata: any
  }[]> {
    const chunks = this.chunkText(text)
    const documents = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const vector = await this.generateEmbedding(chunk)
      
      documents.push({
        id: `${source}_chunk_${i}_${Date.now()}`,
        vector,
        text: chunk,
        source,
        metadata: {
          ...metadata,
          chunk_index: i,
          total_chunks: chunks.length,
          chunk_length: chunk.length,
        },
      })
    }
    
    return documents
  }
}

// RAG 查询工具
export class RAGService {
  constructor(private milvus: MilvusService) {}

  /**
   * 执行 RAG 查询
   */
  async query(
    collectionName: string,
    question: string,
    topK: number = 3,
    minScore: number = 0.5
  ) {
    try {
      // 1. 将问题向量化
      const queryVector = await DocumentProcessor.generateEmbedding(question)
      
      // 2. 在向量数据库中搜索相似文档
      const similarDocs = await this.milvus.searchSimilarDocuments(
        collectionName,
        queryVector,
        topK,
        minScore
      )
      
      // 3. 构建上下文
      const context = similarDocs.map(doc => doc.text).join('\n\n')
      
      return {
        question,
        context,
        sources: similarDocs.map(doc => ({
          source: doc.source,
          text: doc.text,
          score: doc.score,
          metadata: doc.metadata,
        })),
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('❌ RAG 查询异常:', error)
      throw error
    }
  }

  /**
   * 添加文档到知识库
   */
  async addDocument(
    collectionName: string,
    text: string,
    source: string,
    metadata: any = {}
  ): Promise<boolean> {
    try {
      const documents = await DocumentProcessor.processDocument(text, source, metadata)
      return await this.milvus.insertDocuments(collectionName, documents)
    } catch (error) {
      console.error('❌ 添加文档异常:', error)
      return false
    }
  }
}

// 创建全局 RAG 服务实例
export const ragService = new RAGService(milvusService)
