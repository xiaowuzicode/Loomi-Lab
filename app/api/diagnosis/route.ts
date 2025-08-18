import { NextRequest, NextResponse } from 'next/server'
import { MilvusEnvironmentManager, type MilvusEnvironment } from '@/lib/milvus'
import { XiaohongshuMilvusService } from '@/lib/xiaohongshu-milvus'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const environment = (searchParams.get('env') || 'local') as MilvusEnvironment
    
    console.log(`🔍 开始诊断 ${environment} 环境...`)
    
    const diagnosis = {
      environment,
      timestamp: new Date().toISOString(),
      tests: [] as any[],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    }
    
    // 1. 环境配置检查
    const envInfo = MilvusEnvironmentManager.getEnvironmentInfo(environment)
    diagnosis.tests.push({
      name: '环境配置检查',
      status: envInfo.address && envInfo.database ? 'passed' : 'failed',
      details: envInfo,
      recommendations: !envInfo.address ? ['请配置Milvus连接地址'] : []
    })
    
    // 2. Milvus连接测试
    const milvusService = MilvusEnvironmentManager.createService(environment)
    let connectionTest = {
      name: 'Milvus连接测试',
      status: 'failed' as 'passed' | 'failed' | 'warning',
      details: {},
      recommendations: [] as string[]
    }
    
    try {
      const connected = await milvusService.connect()
      if (connected) {
        connectionTest.status = 'passed'
        connectionTest.details = { message: '连接成功' }
      } else {
        connectionTest.details = { message: '连接失败' }
        connectionTest.recommendations.push('检查Milvus服务是否运行', '验证连接配置是否正确')
      }
    } catch (error) {
      connectionTest.details = { 
        error: error instanceof Error ? error.message : '未知连接错误'
      }
      connectionTest.recommendations.push(
        '检查网络连接',
        '验证Milvus服务地址和端口',
        '如果是托管服务，检查认证token是否正确'
      )
    }
    diagnosis.tests.push(connectionTest)
    
    // 3. OpenAI配置检查
    const openaiTest = {
      name: 'OpenAI配置检查',
      status: 'warning' as 'passed' | 'failed' | 'warning',
      details: {},
      recommendations: [] as string[]
    }
    
    if (process.env.OPENAI_API_KEY) {
      openaiTest.status = 'passed'
      openaiTest.details = { 
        hasApiKey: true,
        baseUrl: process.env.OPENAI_BASE_URL || '默认',
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002'
      }
    } else {
      openaiTest.details = { hasApiKey: false, message: '未配置OpenAI API Key，将使用模拟向量' }
      openaiTest.recommendations.push('配置OPENAI_API_KEY以使用真实向量化')
    }
    diagnosis.tests.push(openaiTest)
    
    // 4. 集合列表测试
    let collectionsTest = {
      name: '集合列表测试',
      status: 'failed' as 'passed' | 'failed' | 'warning',
      details: {},
      recommendations: [] as string[]
    }
    
    try {
      if (milvusService.getConnectionStatus()) {
        const collections = await milvusService.listCollections()
        collectionsTest.status = 'passed'
        collectionsTest.details = { 
          collections: collections,
          count: collections.length
        }
      } else {
        collectionsTest.details = { message: '连接未建立，跳过集合测试' }
        collectionsTest.recommendations.push('先解决连接问题')
      }
    } catch (error) {
      collectionsTest.details = { 
        error: error instanceof Error ? error.message : '获取集合列表失败'
      }
    }
    diagnosis.tests.push(collectionsTest)
    
    // 5. 小红书服务测试
    let xiaohongshuTest = {
      name: '小红书服务测试',
      status: 'failed' as 'passed' | 'failed' | 'warning',
      details: {},
      recommendations: [] as string[]
    }
    
    try {
      if (milvusService.getConnectionStatus()) {
        const xiaohongshuService = new XiaohongshuMilvusService(milvusService)
        const initSuccess = await xiaohongshuService.initializeCollection()
        
        if (initSuccess) {
          xiaohongshuTest.status = 'passed'
          xiaohongshuTest.details = { message: '小红书集合初始化成功' }
          
          // 获取统计信息
          const stats = await xiaohongshuService.getStats()
          if (stats) {
            xiaohongshuTest.details = { 
              ...xiaohongshuTest.details,
              stats: {
                name: stats.name,
                row_count: stats.row_count,
                data_size: stats.data_size
              }
            }
          }
        } else {
          xiaohongshuTest.details = { message: '小红书集合初始化失败' }
          xiaohongshuTest.recommendations.push('检查Milvus集合创建权限')
        }
      } else {
        xiaohongshuTest.details = { message: '连接未建立，跳过小红书服务测试' }
        xiaohongshuTest.recommendations.push('先解决连接问题')
      }
    } catch (error) {
      xiaohongshuTest.details = { 
        error: error instanceof Error ? error.message : '小红书服务测试失败'
      }
    }
    diagnosis.tests.push(xiaohongshuTest)
    
    // 计算汇总信息
    diagnosis.summary.total = diagnosis.tests.length
    diagnosis.tests.forEach(test => {
      switch (test.status) {
        case 'passed':
          diagnosis.summary.passed++
          break
        case 'failed':
          diagnosis.summary.failed++
          break
        case 'warning':
          diagnosis.summary.warnings++
          break
      }
    })
    
    // 总体建议
    const overallRecommendations = []
    if (diagnosis.summary.failed > 0) {
      overallRecommendations.push('存在失败的测试项，请根据具体建议进行修复')
    }
    if (diagnosis.summary.warnings > 0) {
      overallRecommendations.push('存在警告项，建议进行优化')
    }
    if (diagnosis.summary.failed === 0 && diagnosis.summary.warnings === 0) {
      overallRecommendations.push('所有测试通过，系统配置正常')
    }
    
    const result = {
      success: true,
      data: diagnosis,
      recommendations: overallRecommendations
    }
    
    console.log(`🎯 诊断完成: ${diagnosis.summary.passed}/${diagnosis.summary.total} 通过`)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ 诊断API异常:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '诊断过程中发生未知错误'
    }, { status: 500 })
  }
}
