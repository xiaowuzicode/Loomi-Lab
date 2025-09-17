// 可复用的文件夹树操作与校验工具

export interface FolderNode {
  fold_id: string
  fold_name: string
  children: FolderNode[]
  expanded?: boolean
}

export interface BookFoldRecord {
  id: string
  user_id: string
  fold_structure: FolderNode[]
  type?: string | null
  created_at?: string
  updated_at?: string
}

// 校验与工具
const MAX_NAME_LEN = 50
const MIN_NAME_LEN = 1
const MAX_DEPTH = 10

export function validateFolderName(name: string): boolean {
  const n = (name || '').trim()
  return n.length >= MIN_NAME_LEN && n.length <= MAX_NAME_LEN
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function cloneTree(structure: FolderNode[]): FolderNode[] {
  return structure.map(n => ({
    fold_id: n.fold_id,
    fold_name: n.fold_name,
    expanded: n.expanded,
    children: cloneTree(n.children || []),
  }))
}

// 计算节点子树高度（当前节点为深度1）
export function getSubtreeHeight(node: FolderNode): number {
  if (!node.children || node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(getSubtreeHeight))
}

// 计算整棵树的最大深度
export function getTreeDepth(structure: FolderNode[]): number {
  if (!structure || structure.length === 0) return 0
  return Math.max(...structure.map(getSubtreeHeight))
}

// 校验同级不重名
export function hasDuplicateName(siblings: FolderNode[], name: string, excludeId?: string): boolean {
  const target = (name || '').trim()
  return siblings.some(s => s.fold_name.trim() === target && s.fold_id !== excludeId)
}

// 在树中查找节点与其父层 children 引用
export function findNode(
  structure: FolderNode[],
  foldId: string,
  parent: FolderNode | null = null
): { node: FolderNode | null; parent: FolderNode | null } {
  for (const n of structure) {
    if (n.fold_id === foldId) return { node: n, parent }
    const res = findNode(n.children || [], foldId, n)
    if (res.node) return res
  }
  return { node: null, parent: null }
}

// 在树中删除指定节点，返回新树与被删除ID列表
export function deleteFolder(
  structure: FolderNode[],
  foldId: string
): { structure: FolderNode[]; deletedIds: string[] } {
  const deletedIds: string[] = []

  function dfs(nodes: FolderNode[]): FolderNode[] {
    const result: FolderNode[] = []
    for (const n of nodes) {
      if (n.fold_id === foldId) {
        // 收集被删除子树的所有ID
        collectIds(n)
        continue
      }
      const newChildren = dfs(n.children || [])
      result.push({ ...n, children: newChildren })
    }
    return result
  }

  function collectIds(node: FolderNode) {
    deletedIds.push(node.fold_id)
    for (const c of node.children || []) collectIds(c)
  }

  const newStructure = dfs(structure)
  return { structure: newStructure, deletedIds }
}

// 在树中插入新节点
export function insertFolder(
  structure: FolderNode[],
  newNode: FolderNode,
  parentId: string | null,
  position: number = 0,
  maxDepth: number = MAX_DEPTH
): FolderNode[] {
  const tree = cloneTree(structure)

  // 根级插入
  if (!parentId) {
    if (hasDuplicateName(tree, newNode.fold_name)) {
      throw new Error('同级文件夹名称不能重复')
    }
    const pos = clamp(position, 0, tree.length)
    tree.splice(pos, 0, { ...newNode, children: newNode.children || [] })
    if (getTreeDepth(tree) > maxDepth) {
      throw new Error(`超过最大嵌套层级 ${maxDepth}`)
    }
    return tree
  }

  // 插入到指定父节点
  const { node: parent } = findNode(tree, parentId)
  if (!parent) throw new Error('父文件夹不存在')

  parent.children = parent.children || []
  if (hasDuplicateName(parent.children, newNode.fold_name)) {
    throw new Error('同级文件夹名称不能重复')
  }

  const pos = clamp(position, 0, parent.children.length)
  parent.children.splice(pos, 0, { ...newNode, children: newNode.children || [] })

  if (getTreeDepth(tree) > maxDepth) {
    throw new Error(`超过最大嵌套层级 ${maxDepth}`)
  }
  return tree
}

// 重命名节点
export function renameFolder(
  structure: FolderNode[],
  foldId: string,
  newName: string
): FolderNode[] {
  const tree = cloneTree(structure)
  const { node, parent } = findNode(tree, foldId)
  if (!node) throw new Error('目标文件夹不存在')

  const siblings = parent ? parent.children || [] : tree
  if (hasDuplicateName(siblings, newName, foldId)) {
    throw new Error('同级文件夹名称不能重复')
  }

  node.fold_name = newName.trim()
  return tree
}

// 检查A是否是B的祖先
export function isAncestor(structure: FolderNode[], ancestorId: string, targetId: string): boolean {
  const { node: ancestor } = findNode(structure, ancestorId)
  if (!ancestor) return false
  function dfs(n: FolderNode): boolean {
    if (!n.children || n.children.length === 0) return false
    for (const c of n.children) {
      if (c.fold_id === targetId) return true
      if (dfs(c)) return true
    }
    return false
  }
  return dfs(ancestor)
}

// 移动节点
export function moveFolder(
  structure: FolderNode[],
  foldId: string,
  newParentId: string | null,
  position: number = 0,
  maxDepth: number = MAX_DEPTH
): FolderNode[] {
  if (newParentId === foldId) throw new Error('不能将文件夹移动到自身')
  if (newParentId && isAncestor(structure, foldId, newParentId)) {
    throw new Error('不能将文件夹移动到其子孙节点下')
  }

  // 提取目标子树
  const { structure: removed, deletedIds } = deleteFolder(structure, foldId)
  if (deletedIds.length === 0) throw new Error('目标文件夹不存在')

  // 从原树中取出该节点（第一项即为被移动节点）
  // 为了获得节点对象，先在原树找到它
  const { node: movingNode } = findNode(structure, foldId)
  if (!movingNode) throw new Error('目标文件夹不存在')

  // 在新位置插入该节点
  const inserted = insertFolder(removed, movingNode, newParentId, position, maxDepth)
  return inserted
}

// 批量替换（全量覆盖）
export function replaceStructure(structure: FolderNode[], maxDepth: number = MAX_DEPTH): FolderNode[] {
  // 基础校验：名称、层级、重名
  function validateLevel(nodes: FolderNode[], depth: number) {
    if (depth > maxDepth) throw new Error(`超过最大嵌套层级 ${maxDepth}`)
    const seen = new Set<string>()
    for (const n of nodes) {
      if (!validateFolderName(n.fold_name)) {
        throw new Error('文件夹名称不合法')
      }
      const key = n.fold_name.trim()
      if (seen.has(key)) throw new Error('同级文件夹名称不能重复')
      seen.add(key)
      validateLevel(n.children || [], depth + 1)
    }
  }
  validateLevel(structure || [], 1)
  // 用 cloneTree 归一化 children
  return cloneTree(structure || [])
}

export const Folders = {
  MAX_DEPTH,
  validateFolderName,
  hasDuplicateName,
  getTreeDepth,
  getSubtreeHeight,
  insertFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  replaceStructure,
}

