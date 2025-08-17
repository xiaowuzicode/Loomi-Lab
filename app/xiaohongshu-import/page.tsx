'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { GlowingButton } from '@/components/ui/GlowingButton'
import { xiaohongshuMilvusService } from '@/lib/xiaohongshu-milvus'
import { FieldMappingModal } from '@/components/knowledge-base/FieldMappingModal'

export default function XiaohongshuImportPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [csvData, setCsvData] = useState<string>('')
  const [jsonData, setJsonData] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // 初始化集合
  const handleInitialize = async () => {
    setLoading(true)
    setResult('正在初始化小红书数据集合...')
    
    try {
      const success = await xiaohongshuMilvusService.initializeCollection()
      if (success) {
        setResult('✅ 小红书数据集合初始化成功！')
      } else {
        setResult('❌ 初始化失败，请检查Milvus连接')
      }
    } catch (error) {
      setResult(`❌ 初始化错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // CSV导入
  const handleCSVImport = async () => {
    if (!csvData.trim()) {
      setResult('❌ 请输入CSV数据')
      return
    }

    setLoading(true)
    setResult('正在导入CSV数据...')

    try {
      const success = await xiaohongshuMilvusService.importFromCSV(csvData)
      if (success) {
        setResult('✅ CSV数据导入成功！')
        setCsvData('')
      } else {
        setResult('❌ CSV导入失败')
      }
    } catch (error) {
      setResult(`❌ CSV导入错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // JSON导入
  const handleJSONImport = async () => {
    if (!jsonData.trim()) {
      setResult('❌ 请输入JSON数据')
      return
    }

    setLoading(true)
    setResult('正在导入JSON数据...')

    try {
      const success = await xiaohongshuMilvusService.importFromJSON(jsonData)
      if (success) {
        setResult('✅ JSON数据导入成功！')
        setJsonData('')
      } else {
        setResult('❌ JSON导入失败')
      }
    } catch (error) {
      setResult(`❌ JSON导入错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 搜索相似帖子
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResult('❌ 请输入搜索关键词')
      return
    }

    setLoading(true)
    setResult('正在搜索相似帖子...')

    try {
      const results = await xiaohongshuMilvusService.searchSimilarPosts(
        searchQuery,
        'both',
        5,
        0.3
      )
      
      setSearchResults(results)
      setResult(`🔍 找到 ${results.length} 个相似帖子`)
    } catch (error) {
      setResult(`❌ 搜索错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 获取统计信息
  const handleGetStats = async () => {
    setLoading(true)
    setResult('正在获取统计信息...')

    try {
      const stats = await xiaohongshuMilvusService.getStats()
      if (stats) {
        setResult(`📊 集合统计信息：
- 集合名称: ${stats.name}
- 数据条数: ${stats.row_count}
- 数据大小: ${stats.data_size}`)
      } else {
        setResult('❌ 无法获取统计信息')
      }
    } catch (error) {
      setResult(`❌ 获取统计信息错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        小红书数据导入与搜索
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 初始化和统计 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">集合管理</h2>
          <div className="space-y-4">
            <GlowingButton
              onClick={handleInitialize}
              disabled={loading}
              className="w-full"
            >
              初始化小红书集合
            </GlowingButton>
            
            <GlowingButton
              onClick={handleGetStats}
              disabled={loading}
              className="w-full"
              variant="secondary"
            >
              获取统计信息
            </GlowingButton>
          </div>
        </Card>

        {/* CSV导入 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">CSV数据导入</h2>
          <div className="space-y-4">
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="粘贴CSV数据，格式示例：
title,content,audio_url,cover_image_url,video_url,likes,favorites,comments
美食分享,今天做了好吃的蛋糕,,,http://video1.mp4,100,50,20
旅游攻略,北京三日游攻略,,,http://video2.mp4,200,80,30"
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
            />
            <GlowingButton
              onClick={handleCSVImport}
              disabled={loading || !csvData.trim()}
              className="w-full"
            >
              导入CSV数据
            </GlowingButton>
          </div>
        </Card>

        {/* JSON导入 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">JSON数据导入</h2>
          <div className="space-y-4">
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder='粘贴JSON数据，格式示例：
[
  {
    "title": "美食分享",
    "content": "今天做了好吃的蛋糕",
    "video_url": "http://video1.mp4",
    "likes": 100,
    "favorites": 50,
    "comments": 20
  }
]'
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
            />
            <GlowingButton
              onClick={handleJSONImport}
              disabled={loading || !jsonData.trim()}
              className="w-full"
            >
              导入JSON数据
            </GlowingButton>
          </div>
        </Card>

        {/* 搜索功能 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">相似内容搜索</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入搜索关键词，如：美食、旅游、化妆..."
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
            />
            <GlowingButton
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="w-full"
            >
              搜索相似帖子
            </GlowingButton>
          </div>
        </Card>
      </div>

      {/* 操作结果 */}
      {result && (
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold mb-2">操作结果</h3>
          <pre className="whitespace-pre-wrap text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded">
            {result}
          </pre>
        </Card>
      )}

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">搜索结果</h3>
          <div className="space-y-4">
            {searchResults.map((post, index) => (
              <div key={post.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-lg">{post.title}</h4>
                  <span className="text-sm text-gray-500">
                    相似度: {(post.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {post.content.substring(0, 200)}
                  {post.content.length > 200 && '...'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>👤 {post.author || '未知作者'}</span>
                  <span>❤️ {post.likes || 0}</span>
                  <span>⭐ {post.favorites || 0}</span>
                  <span>💬 {post.comments || 0}</span>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-2">
                    {post.tags.map((tag: string, tagIndex: number) => (
                      <span
                        key={tagIndex}
                        className="inline-block bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded mr-2"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold mb-4">使用说明</h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong>1. 初始化集合：</strong>
            首次使用前需要初始化Milvus集合结构
          </div>
          <div>
            <strong>2. CSV格式要求：</strong>
            包含title、content等字段，用逗号分隔
          </div>
          <div>
            <strong>3. JSON格式要求：</strong>
            数组格式，每个对象包含帖子信息
          </div>
          <div>
            <strong>4. 搜索功能：</strong>
            基于语义相似度搜索，支持中文关键词
          </div>
          <div>
            <strong>5. 向量化：</strong>
            {process.env.OPENAI_API_KEY ? '使用OpenAI Embedding API' : '使用模拟向量（请配置OPENAI_API_KEY）'}
          </div>
        </div>
      </Card>
    </div>
  )
}
