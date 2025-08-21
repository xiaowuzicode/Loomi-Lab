import { milvusService, DocumentProcessor } from './milvus'
import OpenAI from 'openai'

// OpenAI客户端配置（如果未配置API Key则使用模拟向量）
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
}) : null

/**
 * 小红书数据结构定义
 */
export interface XiaohongshuPost {
  id?: string
  title: string
  content: string
  audio_url?: string
  cover_image_url?: string
  video_url?: string
  likes?: number
  favorites?: number
  comments?: number
  author?: string
  tags?: string[]
  publish_time?: string
  // 补充：统一爆文库格式后的可选字段
  top_comments?: Array<{ author: string; content: string; likes?: number }>
  // 兼容爆文库字段以便写入metadata
  images_urls?: string[]
  thumbnail_url?: string
  engagement_rate?: number
  source_url?: string
  platform?: string
  category?: string
  keywords?: string[]
}

/**
 * 向量化后的小红书数据
 */
interface ProcessedXiaohongshuPost {
  id: string
  title_vector: number[]
  content_vector: number[]
  metadata: any
  created_at: number
}

/**
 * 小红书数据处理服务
 */
export class XiaohongshuMilvusService {
  private collectionName: string
  private milvusService: any // MilvusService实例

  constructor(milvusService?: any, collectionName: string = 'lab_xiaohongshu_posts') {
    this.milvusService = milvusService || require('./milvus').milvusService
    this.collectionName = collectionName
  }

  /**
   * 初始化小红书集合
   */
  async initializeCollection(): Promise<boolean> {
    try {
      console.log(`🏗️ 开始初始化小红书集合: ${this.collectionName}`)
      
      // 检查连接
      const connected = await this.milvusService.connect()
      if (!connected) {
        console.error('❌ Milvus连接失败')
        return false
      }

      // 创建专用集合
      const success = await this.milvusService.createKnowledgeBaseCollection(
        this.collectionName,
        1536 // OpenAI text-embedding-ada-002 维度
      )

      if (success) {
        console.log(`✅ 小红书数据集合 ${this.collectionName} 初始化成功`)
      } else {
        console.error(`❌ 小红书数据集合 ${this.collectionName} 初始化失败`)
      }

      return success
    } catch (error) {
      console.error(`❌ 初始化小红书集合 ${this.collectionName} 异常:`, error)
      return false
    }
  }

  /**
   * 文本向量化
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length === 0) {
        // 返回零向量用于空文本
        return new Array(1536).fill(0)
      }

      // 如果有OpenAI API Key，使用真实的embedding
      if (openai) {
        const response = await openai.embeddings.create({
          model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002', // 从环境变量读取模型
          input: text.substring(0, 8000) // 限制文本长度
        })
        return response.data[0].embedding
      } else {
        // 使用模拟向量（开发测试用）
        console.warn('⚠️ 未配置OpenAI API Key，使用模拟向量进行测试')
        return await DocumentProcessor.generateEmbedding(text)
      }
    } catch (error) {
      console.error('❌ 文本向量化失败:', error)
      // 返回模拟向量作为fallback
      return await DocumentProcessor.generateEmbedding(text)
    }
  }

  /**
   * 数据预处理
   */
  private preprocessPost(post: XiaohongshuPost): XiaohongshuPost {
    return {
      id: post.id || `xhs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: post.title || '',
      content: post.content || '',
      audio_url: post.audio_url || '',
      cover_image_url: post.cover_image_url || '',
      video_url: post.video_url || '',
      likes: Math.max(0, post.likes || 0),
      favorites: Math.max(0, post.favorites || 0),
      comments: Math.max(0, post.comments || 0),
      author: post.author || '',
      tags: Array.isArray(post.tags) ? post.tags : [],
      publish_time: post.publish_time || new Date().toISOString(),
      top_comments: Array.isArray(post.top_comments) ? post.top_comments : [],
      images_urls: Array.isArray(post.images_urls) ? post.images_urls : [],
      thumbnail_url: post.thumbnail_url || '',
      engagement_rate: typeof post.engagement_rate === 'number' ? post.engagement_rate : undefined,
      source_url: post.source_url || '',
      platform: post.platform || '',
      category: post.category || '',
      keywords: Array.isArray(post.keywords) ? post.keywords : []
    }
  }

  /**
   * 处理单个帖子
   */
  async processPost(post: XiaohongshuPost): Promise<ProcessedXiaohongshuPost | null> {
    try {
      const cleanedPost = this.preprocessPost(post)

      // 生成向量：使用 标题+正文 作为主检索向量
      const combinedText = `${cleanedPost.title} ${cleanedPost.content}`.trim()
      const [combinedVector, contentVector] = await Promise.all([
        this.generateEmbedding(combinedText),
        this.generateEmbedding(cleanedPost.content)
      ])

      return {
        id: cleanedPost.id!,
        // 为了减少改动，沿用字段名，但含义更新为：标题+正文合并向量
        title_vector: combinedVector,
        content_vector: contentVector,
        metadata: {
          title: cleanedPost.title,
          content: cleanedPost.content,
          audio_url: cleanedPost.audio_url,
          cover_image_url: cleanedPost.cover_image_url,
          video_url: cleanedPost.video_url,
          likes: cleanedPost.likes,
          favorites: cleanedPost.favorites,
          comments: cleanedPost.comments,
          author: cleanedPost.author,
          tags: cleanedPost.tags,
          publish_time: cleanedPost.publish_time,
          // 召回时需要的扩展信息
          top_comments: cleanedPost.top_comments,
          images_urls: cleanedPost.images_urls,
          thumbnail_url: cleanedPost.thumbnail_url,
          engagement_rate: cleanedPost.engagement_rate,
          source_url: cleanedPost.source_url,
          platform: cleanedPost.platform,
          category: cleanedPost.category,
          keywords: cleanedPost.keywords
        },
        created_at: Date.now()
      }
    } catch (error) {
      console.error('❌ 处理帖子失败:', error)
      return null
    }
  }

  /**
   * 批量插入小红书数据
   */
  async insertPosts(posts: XiaohongshuPost[]): Promise<boolean> {
    try {
      console.log(`📝 开始处理 ${posts.length} 个小红书帖子...`)

      // 批量处理数据
      const processedPosts: ProcessedXiaohongshuPost[] = []
      const batchSize = 10 // 控制并发数

      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize)
        const batchPromises = batch.map(post => this.processPost(post))
        const batchResults = await Promise.all(batchPromises)

        // 过滤掉处理失败的数据
        const validResults = batchResults.filter(result => result !== null) as ProcessedXiaohongshuPost[]
        processedPosts.push(...validResults)

        console.log(`✅ 已处理 ${Math.min(i + batchSize, posts.length)}/${posts.length} 个帖子`)
      }

      if (processedPosts.length === 0) {
        console.warn('⚠️ 没有有效的数据可以插入')
        return false
      }

      // 转换为Milvus格式
      const milvusDocuments = processedPosts.map(post => ({
        id: post.id,
        vector: post.title_vector, // 使用标题向量作为主向量
        text: `${post.metadata.title} ${post.metadata.content}`, // 合并文本用于搜索
        source: 'xiaohongshu',
        metadata: {
          ...post.metadata,
          content_vector: post.content_vector // 内容向量存储在元数据中
        }
      }))

      // 插入到Milvus
      const success = await this.milvusService.insertDocuments(this.collectionName, milvusDocuments)

      if (success) {
        console.log(`🎉 成功插入 ${processedPosts.length} 个小红书帖子到向量数据库`)
      }

      return success
    } catch (error) {
      console.error('❌ 批量插入失败:', error)
      return false
    }
  }

  /**
   * 从CSV文件导入数据
   */
  async importFromCSV(csvData: string): Promise<boolean> {
    try {
      const lines = csvData.trim().split('\n')
      if (lines.length <= 1) {
        throw new Error('CSV文件为空或只有标题行')
      }

      // 解析CSV头部
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      console.log('📋 CSV字段:', headers)

      // 解析数据行
      const posts: XiaohongshuPost[] = []
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const post: any = {}

          headers.forEach((header, index) => {
            const value = values[index] || ''
            
            // 字段映射和类型转换
            switch (header.toLowerCase()) {
              case 'title':
              case '标题':
                post.title = value
                break
              case 'content':
              case '内容':
                post.content = value
                break
              case 'audio_url':
              case '音频链接':
                post.audio_url = value
                break
              case 'cover_image_url':
              case '封面图片':
                post.cover_image_url = value
                break
              case 'video_url':
              case '视频链接':
                post.video_url = value
                break
              case 'likes':
              case '点赞':
                post.likes = parseInt(value) || 0
                break
              case 'favorites':
              case '收藏':
                post.favorites = parseInt(value) || 0
                break
              case 'comments':
              case '评论':
                post.comments = parseInt(value) || 0
                break
              case 'author':
              case '作者':
                post.author = value
                break
              case 'tags':
              case '标签':
                post.tags = value ? value.split(';').filter(t => t.trim()) : []
                break
              case 'publish_time':
              case '发布时间':
                post.publish_time = value
                break
              default:
                // 其他字段存储在metadata中
                if (!post.metadata) post.metadata = {}
                post.metadata[header] = value
            }
          })

          if (post.title || post.content) {
            posts.push(post as XiaohongshuPost)
          }
        } catch (error) {
          console.warn(`⚠️ 跳过第${i+1}行数据，解析失败:`, error)
        }
      }

      console.log(`📊 从CSV解析出 ${posts.length} 个有效帖子`)

      if (posts.length === 0) {
        throw new Error('没有解析出有效的帖子数据')
      }

      // 批量插入
      return await this.insertPosts(posts)
    } catch (error) {
      console.error('❌ CSV导入失败:', error)
      return false
    }
  }

  /**
   * 从JSON文件导入数据
   */
  async importFromJSON(jsonData: string): Promise<{ success: boolean; importedCount: number; error?: string }> {
    try {
      const data = JSON.parse(jsonData)
      let posts: XiaohongshuPost[] = []

      if (Array.isArray(data)) {
        posts = this.normalizeToXHSPosts(data)
      } else if (data.posts && Array.isArray(data.posts)) {
        posts = this.normalizeToXHSPosts(data.posts)
      } else if (data.data && Array.isArray(data.data)) {
        posts = this.normalizeToXHSPosts(data.data)
      } else {
        throw new Error('JSON格式不正确，期望数组或包含posts/data字段的对象')
      }

      console.log(`📊 从JSON解析出 ${posts.length} 个帖子`)

      const success = await this.insertPosts(posts)
      return { 
        success, 
        importedCount: success ? posts.length : 0,
        error: success ? undefined : '数据插入失败'
      }
    } catch (error) {
      console.error('❌ JSON导入失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      return { success: false, importedCount: 0, error: errorMessage }
    }
  }

  /**
   * 将输入数组规范化为小红书向量格式（统一接受“爆文库格式”）
   * 爆文库格式字段示例：likes_count / favorites_count / comments_count / images_urls / thumbnail_url / top_comments / published_at 等
   */
  private normalizeToXHSPosts(arr: any[]): XiaohongshuPost[] {
    return arr
      .map((item: any) => {
        // 判断是否为爆文库格式（具备 likes_count 或 favorites_count 等字段）
        const isContentLibrary =
          item && (typeof item.likes_count === 'number' || typeof item.favorites_count === 'number' || typeof item.comments_count === 'number')

        if (isContentLibrary) {
          const cover = item.thumbnail_url || (Array.isArray(item.images_urls) && item.images_urls.length > 0 ? item.images_urls[0] : '')
          const post: XiaohongshuPost = {
            id: item.id,
            title: item.title || '',
            content: item.content || '',
            audio_url: '',
            cover_image_url: cover || '',
            video_url: item.video_url || '',
            likes: Math.max(0, item.likes_count || 0),
            favorites: Math.max(0, item.favorites_count || 0),
            comments: Math.max(0, item.comments_count || 0),
            author: item.author || '',
            tags: Array.isArray(item.tags) ? item.tags : [],
            publish_time: item.published_at || item.created_at,
            // 扩展信息，便于召回展示
            top_comments: Array.isArray(item.top_comments) ? item.top_comments : [],
            images_urls: Array.isArray(item.images_urls) ? item.images_urls : [],
            thumbnail_url: item.thumbnail_url || '',
            engagement_rate: typeof item.engagement_rate === 'number' ? item.engagement_rate : undefined,
            source_url: item.source_url || '',
            platform: item.platform || '',
            category: item.category || '',
            keywords: Array.isArray(item.keywords) ? item.keywords : []
          }
          return post
        }

        // 兼容原有小红书向量格式
        const post: XiaohongshuPost = {
          id: item.id,
          title: item.title || '',
          content: item.content || '',
          audio_url: item.audio_url || '',
          cover_image_url: item.cover_image_url || '',
          video_url: item.video_url || '',
          likes: Math.max(0, item.likes || 0),
          favorites: Math.max(0, item.favorites || 0),
          comments: Math.max(0, item.comments || 0),
          author: item.author || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          publish_time: item.publish_time || item.published_at || item.created_at,
          top_comments: Array.isArray(item.top_comments) ? item.top_comments : [],
        }
        return post
      })
      .filter((p: XiaohongshuPost) => (p.title && p.content))
  }

  /**
   * 搜索相似帖子
   */
  async searchSimilarPosts(
    query: string,
    searchType: 'title' | 'content' | 'both' = 'both',
    topK: number = 5,
    minScore: number = 0.5
  ) {
    try {
      // 与写入一致：对“标题+正文合并文本”策略，查询向量直接来源于查询文本
      const queryVector = await this.generateEmbedding(query)
      
      const results = await this.milvusService.searchSimilarDocuments(
        this.collectionName,
        queryVector,
        topK,
        minScore
      )

      return results.map((result: any) => ({
        id: result.id,
        score: result.score,
        title: result.metadata.title,
        content: result.metadata.content,
        author: result.metadata.author,
        likes: result.metadata.likes,
        favorites: result.metadata.favorites,
        comments: result.metadata.comments,
        tags: result.metadata.tags,
        audio_url: result.metadata.audio_url,
        cover_image_url: result.metadata.cover_image_url,
        video_url: result.metadata.video_url,
        publish_time: result.metadata.publish_time,
        top_comments: result.metadata.top_comments,
        images_urls: result.metadata.images_urls,
        thumbnail_url: result.metadata.thumbnail_url,
        engagement_rate: result.metadata.engagement_rate,
        source_url: result.metadata.source_url,
        platform: result.metadata.platform,
        category: result.metadata.category,
        keywords: result.metadata.keywords
      }))
    } catch (error) {
      console.error('❌ 搜索相似帖子失败:', error)
      return []
    }
  }

  /**
   * 获取集合统计信息
   */
  async getStats() {
    try {
      return await this.milvusService.getCollectionStats(this.collectionName)
    } catch (error) {
      console.error(`❌ 获取集合 ${this.collectionName} 统计信息失败:`, error)
      return null
    }
  }
}

// 导出全局实例（向后兼容）
export const xiaohongshuMilvusService = new XiaohongshuMilvusService(milvusService)
