import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as YAML from 'yaml'
import { AgentInfo } from '@/types'

// Agent配置映射
const AGENT_CONFIG = {
  // action_prompts.yaml 中的agents
  resonant_prompt: { description: '深思品味词语背后的情绪联想', category: '分析研究' },
  persona_prompt: { description: '分析受众群体和社会现状', category: '分析研究' },
  hitpoint_prompt: { description: '制定可执行的内容策略报告', category: '策略规划' },
  knowledge_prompt: { description: '提供客观专业的知识内容', category: '内容创作' },
  xhs_post_prompt: { description: '创作小红书爆款内容', category: '内容创作' },
  wechat_article_prompt: { description: '创作深度长文章', category: '内容创作' },
  tiktok_script_prompt: { description: '创作抖音口播稿', category: '内容创作' },
  brand_analysis_prompt: { description: '分析品牌优劣势和认知', category: '分析研究' },
  content_analysis_prompt: { description: '拆解社媒内容质量和技巧', category: '分析研究' },
  websearch_prompt: { description: '获取最新实时信息', category: '信息收集' },
  facts_prompt: { description: '整理搜索结果为信息块', category: '信息收集' },
  
  // 独立文件中的agents
  concierge_prompt: { description: 'Loomi的需求理解和任务传递', category: '系统管理' },
  orchestrator_prompt: { description: '内容创作流水线调度路由', category: '系统管理' },
  reflection_prompt: { description: '评估和标注Action产出质量', category: '质量控制' }
}

// 读取并解析YAML文件
async function readYamlFile(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return YAML.parse(content)
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error)
    throw error
  }
}

// 写入YAML文件（保持格式）
async function writeYamlFile(filePath: string, data: any): Promise<void> {
  try {
    const yamlContent = YAML.stringify(data, {
      indent: 2,
      lineWidth: 0,
      minContentWidth: 0,
      doubleQuotedAsJSON: false,
    })
    await fs.writeFile(filePath, yamlContent, 'utf8')
  } catch (error) {
    console.error(`写入文件失败: ${filePath}`, error)
    throw error
  }
}

// 获取目录下的所有agent信息
async function loadAgentsFromDirectory(dirPath: string): Promise<AgentInfo[]> {
  const agents: AgentInfo[] = []
  
  try {
    // 检查目录是否存在
    await fs.access(dirPath)
    
    // 读取action_prompts.yaml
    const actionPromptsPath = path.join(dirPath, 'action_prompts.yaml')
    try {
      const actionPrompts = await readYamlFile(actionPromptsPath)
      
      for (const [key, value] of Object.entries(actionPrompts)) {
        if (typeof value === 'string' && AGENT_CONFIG[key as keyof typeof AGENT_CONFIG]) {
          const config = AGENT_CONFIG[key as keyof typeof AGENT_CONFIG]
          agents.push({
            id: key,
            name: key,
            description: config.description,
            prompt: value as string,
            file: 'action_prompts.yaml',
            syncStatus: 'synced',
            lastModified: new Date().toISOString(),
            category: config.category
          })
        }
      }
    } catch (error) {
      console.error('读取action_prompts.yaml失败:', error)
    }
    
    // 读取concierge.yaml
    const conciergePath = path.join(dirPath, 'concierge.yaml')
    try {
      const conciergeData = await readYamlFile(conciergePath)
      if (conciergeData.concierge_prompt) {
        const config = AGENT_CONFIG.concierge_prompt
        agents.push({
          id: 'concierge_prompt',
          name: 'concierge_prompt',
          description: config.description,
          prompt: conciergeData.concierge_prompt,
          file: 'concierge.yaml',
          syncStatus: 'synced',
          lastModified: new Date().toISOString(),
          category: config.category
        })
      }
    } catch (error) {
      console.error('读取concierge.yaml失败:', error)
    }
    
    // 读取orchestrator.yaml
    const orchestratorPath = path.join(dirPath, 'orchestrator.yaml')
    try {
      const orchestratorData = await readYamlFile(orchestratorPath)
      
      if (orchestratorData.orchestrator_prompt) {
        const config = AGENT_CONFIG.orchestrator_prompt
        agents.push({
          id: 'orchestrator_prompt',
          name: 'orchestrator_prompt',
          description: config.description,
          prompt: orchestratorData.orchestrator_prompt,
          file: 'orchestrator.yaml',
          syncStatus: 'synced',
          lastModified: new Date().toISOString(),
          category: config.category
        })
      }
      
      if (orchestratorData.reflection_prompt) {
        const config = AGENT_CONFIG.reflection_prompt
        agents.push({
          id: 'reflection_prompt',
          name: 'reflection_prompt',
          description: config.description,
          prompt: orchestratorData.reflection_prompt,
          file: 'orchestrator.yaml',
          syncStatus: 'synced',
          lastModified: new Date().toISOString(),
          category: config.category
        })
      }
    } catch (error) {
      console.error('读取orchestrator.yaml失败:', error)
    }
    
  } catch (error) {
    throw new Error(`目录不存在或无法访问: ${dirPath}`)
  }
  
  return agents
}

// 更新单个agent的prompt到文件
async function updateAgentPrompt(dirPath: string, agentId: string, newPrompt: string): Promise<void> {
  const config = AGENT_CONFIG[agentId as keyof typeof AGENT_CONFIG]
  if (!config) {
    throw new Error(`未知的agent ID: ${agentId}`)
  }
  
  // 确定文件路径和更新方式
  if (agentId === 'concierge_prompt') {
    const filePath = path.join(dirPath, 'concierge.yaml')
    const data = await readYamlFile(filePath)
    data.concierge_prompt = newPrompt
    await writeYamlFile(filePath, data)
    
  } else if (agentId === 'orchestrator_prompt' || agentId === 'reflection_prompt') {
    const filePath = path.join(dirPath, 'orchestrator.yaml')
    const data = await readYamlFile(filePath)
    data[agentId] = newPrompt
    await writeYamlFile(filePath, data)
    
  } else {
    // action_prompts.yaml 中的agent
    const filePath = path.join(dirPath, 'action_prompts.yaml')
    const data = await readYamlFile(filePath)
    data[agentId] = newPrompt
    await writeYamlFile(filePath, data)
  }
}

// GET - 获取指定目录下的所有agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const directoryPath = searchParams.get('path') || '/Users/jiawei/project/blueplan-research/prompts/loomi'
    const agentId = searchParams.get('agentId')
    
    if (agentId) {
      // 获取单个agent的详细信息
      const agents = await loadAgentsFromDirectory(directoryPath)
      const agent = agents.find(a => a.id === agentId)
      
      if (!agent) {
        return NextResponse.json({
          success: false,
          error: `Agent ${agentId} 不存在`
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        data: agent
      })
    }
    
    // 获取所有agents
    const agents = await loadAgentsFromDirectory(directoryPath)
    
    return NextResponse.json({
      success: true,
      data: {
        path: directoryPath,
        agents,
        totalCount: agents.length
      }
    })
    
  } catch (error) {
    console.error('获取agents失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取agents失败'
    }, { status: 500 })
  }
}

// PUT - 更新单个agent的prompt
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: directoryPath, agentId, prompt } = body
    
    if (!directoryPath || !agentId || !prompt) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数: path, agentId, prompt'
      }, { status: 400 })
    }
    
    await updateAgentPrompt(directoryPath, agentId, prompt)
    
    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} 更新成功`
    })
    
  } catch (error) {
    console.error('更新agent失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新agent失败'
    }, { status: 500 })
  }
}

// POST - 批量更新多个agents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: directoryPath, updates } = body
    
    if (!directoryPath || !updates || !Array.isArray(updates)) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数: path, updates (array)'
      }, { status: 400 })
    }
    
    const results: { agentId: string; success: boolean; error?: string }[] = []
    
    for (const update of updates) {
      try {
        await updateAgentPrompt(directoryPath, update.agentId, update.prompt)
        results.push({ agentId: update.agentId, success: true })
      } catch (error) {
        results.push({
          agentId: update.agentId,
          success: false,
          error: error instanceof Error ? error.message : '更新失败'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    return NextResponse.json({
      success: failureCount === 0,
      message: `批量更新完成: ${successCount} 成功, ${failureCount} 失败`,
      results
    })
    
  } catch (error) {
    console.error('批量更新失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '批量更新失败'
    }, { status: 500 })
  }
}