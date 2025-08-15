import { MilvusClient, DataType, ErrorCode } from '@zilliz/milvus2-sdk-node'

// Milvus 连接配置
const MILVUS_CONFIG = {
  address: process.env.MILVUS_ENDPOINT || 'https://in03-224856a9de916a8.api.gcp-us-west1.zillizcloud.com',
  username: process.env.MILVUS_USERNAME || 'db_224856a9de916a8',
  password: process.env.MILVUS_PASSWORD || 'Cg4{%Flpa,++a~<w',
  database: process.env.MILVUS_DATABASE || 'default',
}

export class MilvusService {
  private client: MilvusClient
  private isConnected: boolean = false

  constructor() {
    this.client = new MilvusClient(MILVUS_CONFIG)
  }

  /**
   * 连接到 Milvus 数据库
   */
  async connect(): Promise<boolean> {
    try {
      const res = await this.client.checkHealth()
      if (res.isHealthy) {
        this.isConnected = true
        console.log('✅ Milvus 连接成功')
        return true
      }
      console.error('❌ Milvus 健康检查失败')
      return false
    } catch (error) {
      console.error('❌ Milvus 连接失败:', error)
      return false
    }
  }

  /**
   * 创建知识库集合
   */
  async createKnowledgeBaseCollection(collectionName: string, dimension: number = 1536): Promise<boolean> {
    try {
      // 检查集合是否已存在
      const hasCollection = await this.client.hasCollection({
        collection_name: collectionName,
      })

      if (hasCollection.value) {
        console.log(`📚 集合 ${collectionName} 已存在`)
        return true
      }

      // 创建集合
      const createRes = await this.client.createCollection({
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
            max_length: 2000,
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
        const indexRes = await this.client.createIndex({
          collection_name: collectionName,
          field_name: 'vector',
          index_type: 'IVF_FLAT',
          metric_type: 'IP', // 内积相似度
          params: { nlist: 1024 },
        })

        if (indexRes.error_code === ErrorCode.SUCCESS) {
          // 加载集合到内存
          await this.client.loadCollection({
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

      const insertRes = await this.client.insert({
        collection_name: collectionName,
        data: data,
      })

      if (insertRes.status.error_code === ErrorCode.SUCCESS) {
        // 刷新数据到持久化存储
        await this.client.flush({
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
      const searchRes = await this.client.search({
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
      const statsRes = await this.client.getCollectionStatistics({
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
      const res = await this.client.showCollections()
      if (res.status.error_code === ErrorCode.SUCCESS) {
        return res.collection_names
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
      const res = await this.client.dropCollection({
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

// 创建全局 Milvus 服务实例
export const milvusService = new MilvusService()

// 文档处理工具类
export class DocumentProcessor {
  /**
   * 模拟文本向量化（实际项目中应该调用 OpenAI Embedding API）
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    // 这里应该调用真实的 Embedding API，比如 OpenAI
    // 目前返回模拟的向量数据
    const dimension = 1536 // OpenAI text-embedding-ada-002 的维度
    const vector = Array.from({ length: dimension }, () => Math.random() - 0.5)
    
    // 归一化向量
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return vector.map(val => val / norm)
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
