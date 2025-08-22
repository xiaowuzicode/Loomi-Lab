import { useState, useEffect, useCallback } from 'react'
import { AgentInfo, PromptDirectory, AgentUpdate, BatchUpdateRequest, PromptManagerState } from '@/types'

export function usePrompts() {
  const [state, setState] = useState<PromptManagerState>({
    directoryPath: '/Users/jiawei/project/blueplan-research/prompts/loomi',
    agents: [],
    localEdits: {},
    loading: false,
    error: null,
    lastSyncCheck: null
  })

  // 加载指定目录的agents
  const loadAgents = useCallback(async (path?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const targetPath = path || state.directoryPath
      const response = await fetch(`/api/prompts?path=${encodeURIComponent(targetPath)}`)
      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          directoryPath: targetPath,
          agents: result.data.agents,
          loading: false,
          lastSyncCheck: new Date()
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载失败'
      }))
    }
  }, [state.directoryPath])

  // 更新目录路径
  const updateDirectoryPath = useCallback((newPath: string) => {
    setState(prev => ({ ...prev, directoryPath: newPath }))
  }, [])

  // 刷新agents数据
  const refreshAgents = useCallback(() => {
    loadAgents()
  }, [loadAgents])

  // 本地编辑agent prompt
  const editAgentLocally = useCallback((agentId: string, newPrompt: string) => {
    setState(prev => ({
      ...prev,
      localEdits: {
        ...prev.localEdits,
        [agentId]: newPrompt
      },
      agents: prev.agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, syncStatus: 'modified' as const }
          : agent
      )
    }))
  }, [])

  // 获取agent当前显示的prompt（本地编辑优先）
  const getAgentPrompt = useCallback((agentId: string): string => {
    const localEdit = state.localEdits[agentId]
    if (localEdit !== undefined) {
      return localEdit
    }
    const agent = state.agents.find(a => a.id === agentId)
    return agent?.prompt || ''
  }, [state.localEdits, state.agents])

  // 保存单个agent到文件
  const saveAgent = useCallback(async (agentId: string) => {
    const prompt = state.localEdits[agentId]
    if (!prompt) return
    
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: state.directoryPath,
          agentId,
          prompt
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          localEdits: {
            ...prev.localEdits,
            [agentId]: undefined
          },
          agents: prev.agents.map(agent => 
            agent.id === agentId 
              ? { ...agent, prompt, syncStatus: 'synced' as const, lastModified: new Date().toISOString() }
              : agent
          )
        }))
        
        // 清理undefined值
        setState(prev => {
          const newLocalEdits = { ...prev.localEdits }
          delete newLocalEdits[agentId]
          return { ...prev, localEdits: newLocalEdits }
        })
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '保存失败'
      }))
    }
  }, [state.directoryPath, state.localEdits])

  // 批量保存所有修改
  const saveAllModified = useCallback(async () => {
    const updates: AgentUpdate[] = Object.entries(state.localEdits)
      .filter(([_, prompt]) => prompt !== undefined)
      .map(([agentId, prompt]) => ({ agentId, prompt: prompt as string }))
    
    if (updates.length === 0) return
    
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: state.directoryPath,
          updates
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          localEdits: {},
          agents: prev.agents.map(agent => {
            const update = updates.find(u => u.agentId === agent.id)
            if (update) {
              return {
                ...agent,
                prompt: update.prompt,
                syncStatus: 'synced' as const,
                lastModified: new Date().toISOString()
              }
            }
            return agent
          })
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '批量保存失败'
      }))
    }
  }, [state.directoryPath, state.localEdits])

  // 放弃所有本地修改
  const discardAllChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      localEdits: {},
      agents: prev.agents.map(agent => ({
        ...agent,
        syncStatus: 'synced' as const
      }))
    }))
  }, [])

  // 放弃单个agent的修改
  const discardAgentChanges = useCallback((agentId: string) => {
    setState(prev => {
      const newLocalEdits = { ...prev.localEdits }
      delete newLocalEdits[agentId]
      
      return {
        ...prev,
        localEdits: newLocalEdits,
        agents: prev.agents.map(agent => 
          agent.id === agentId 
            ? { ...agent, syncStatus: 'synced' as const }
            : agent
        )
      }
    })
  }, [])

  // 检查是否有未保存的修改
  const hasUnsavedChanges = Object.values(state.localEdits).some(prompt => prompt !== undefined)

  // 获取修改的agent数量
  const modifiedCount = Object.values(state.localEdits).filter(prompt => prompt !== undefined).length

  // 初始加载
  useEffect(() => {
    loadAgents()
  }, []) // 只在组件挂载时执行一次

  return {
    // 状态
    ...state,
    hasUnsavedChanges,
    modifiedCount,
    
    // 操作方法
    loadAgents,
    refreshAgents,
    updateDirectoryPath,
    editAgentLocally,
    getAgentPrompt,
    saveAgent,
    saveAllModified,
    discardAllChanges,
    discardAgentChanges
  }
}