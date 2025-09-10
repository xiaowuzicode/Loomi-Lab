/**
 * 数据迁移工具：旧格式字段定义 → 新格式表格数据
 * 用于平滑升级现有自定义字段数据
 */

import { LegacyCustomField, TableRow } from '@/types'

/**
 * 检测数据格式类型
 */
export function detectDataFormat(extendedField: any[]): 'legacy' | 'table' | 'empty' {
  if (!Array.isArray(extendedField) || extendedField.length === 0) {
    return 'empty'
  }

  const firstItem = extendedField[0]
  
  // 旧格式：包含 key, label, value 字段
  if (firstItem && 'key' in firstItem && 'label' in firstItem && 'value' in firstItem) {
    return 'legacy'
  }
  
  // 新格式：包含 id 字段
  if (firstItem && 'id' in firstItem) {
    return 'table'
  }
  
  return 'empty'
}

/**
 * 旧格式转新格式
 * 将 [{ key, label, value }] 转换为 [{ id, 字段1, 字段2 }]
 */
export function migrateLegacyToTable(
  legacyFields: LegacyCustomField[]
): { tableData: TableRow[], tableFields: string[] } {
  if (!legacyFields || legacyFields.length === 0) {
    return {
      tableData: [{ id: 1, 标题: '', 正文: '' }],
      tableFields: ['标题', '正文']
    }
  }

  // 创建新格式数据
  const newRow: TableRow = { id: 1 }
  const tableFields: string[] = []

  // 转换字段数据
  legacyFields.forEach(field => {
    const fieldName = field.label || field.key
    newRow[fieldName] = field.value || ''
    
    if (!tableFields.includes(fieldName)) {
      tableFields.push(fieldName)
    }
  })

  // 确保标题字段存在且在首位
  if (!tableFields.includes('标题')) {
    // 如果没有标题字段，使用第一个字段作为标题
    if (tableFields.length > 0) {
      const firstField = tableFields[0]
      tableFields[0] = '标题'
      newRow['标题'] = newRow[firstField] || ''
      delete newRow[firstField]
    } else {
      tableFields.push('标题')
      newRow['标题'] = ''
    }
  } else {
    // 确保标题字段在首位
    const titleIndex = tableFields.indexOf('标题')
    if (titleIndex > 0) {
      tableFields.splice(titleIndex, 1)
      tableFields.unshift('标题')
    }
  }

  return {
    tableData: [newRow],
    tableFields
  }
}

/**
 * 新格式转旧格式（向后兼容）
 */
export function migrateTableToLegacy(
  tableData: TableRow[],
  tableFields: string[]
): LegacyCustomField[] {
  if (!tableData || tableData.length === 0) {
    return [
      { key: 'title', label: '标题', value: '', required: true },
      { key: 'content', label: '正文', value: '', required: false }
    ]
  }

  const firstRow = tableData[0]
  const legacyFields: LegacyCustomField[] = []

  tableFields.forEach((field, index) => {
    legacyFields.push({
      key: field === '标题' ? 'title' : `field_${index}`,
      label: field,
      value: firstRow[field] || '',
      required: field === '标题'
    })
  })

  return legacyFields
}

/**
 * 批量迁移数据（用于数据库批量迁移）
 */
export interface MigrationResult {
  id: string
  original: any[]
  migrated: {
    tableData: TableRow[]
    tableFields: string[]
  }
  format: 'legacy' | 'table' | 'empty'
}

export function batchMigrateData(records: Array<{ id: string, extendedField: any[] }>): MigrationResult[] {
  return records.map(record => {
    const format = detectDataFormat(record.extendedField)
    let migrated: { tableData: TableRow[], tableFields: string[] }

    switch (format) {
      case 'legacy':
        migrated = migrateLegacyToTable(record.extendedField as LegacyCustomField[])
        break
      case 'table':
        // 已是新格式，提取字段列表
        const firstRow = record.extendedField[0]
        const tableFields = Object.keys(firstRow).filter(key => key !== 'id')
        migrated = {
          tableData: record.extendedField as TableRow[],
          tableFields: tableFields.includes('标题') 
            ? ['标题', ...tableFields.filter(f => f !== '标题')]
            : tableFields
        }
        break
      case 'empty':
      default:
        migrated = {
          tableData: [{ id: 1, 标题: '', 正文: '' }],
          tableFields: ['标题', '正文']
        }
        break
    }

    return {
      id: record.id,
      original: record.extendedField,
      migrated,
      format
    }
  })
}

/**
 * 验证迁移结果
 */
export function validateMigration(result: MigrationResult): boolean {
  try {
    // 检查表格数据
    if (!Array.isArray(result.migrated.tableData) || result.migrated.tableData.length === 0) {
      return false
    }

    // 检查字段列表
    if (!Array.isArray(result.migrated.tableFields) || result.migrated.tableFields.length === 0) {
      return false
    }

    // 检查必须包含标题字段
    if (!result.migrated.tableFields.includes('标题')) {
      return false
    }

    // 检查每行数据都有 id 字段
    for (const row of result.migrated.tableData) {
      if (!row.id || typeof row.id !== 'number') {
        return false
      }
    }

    // 检查数据完整性：每行都包含所有字段
    for (const row of result.migrated.tableData) {
      for (const field of result.migrated.tableFields) {
        if (!(field in row)) {
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Migration validation error:', error)
    return false
  }
}

/**
 * 生成迁移报告
 */
export interface MigrationReport {
  total: number
  legacy: number
  table: number
  empty: number
  successful: number
  failed: number
  errors: Array<{ id: string, error: string }>
}

export function generateMigrationReport(results: MigrationResult[]): MigrationReport {
  const report: MigrationReport = {
    total: results.length,
    legacy: 0,
    table: 0,
    empty: 0,
    successful: 0,
    failed: 0,
    errors: []
  }

  results.forEach(result => {
    // 统计格式分布
    switch (result.format) {
      case 'legacy':
        report.legacy++
        break
      case 'table':
        report.table++
        break
      case 'empty':
        report.empty++
        break
    }

    // 验证迁移结果
    if (validateMigration(result)) {
      report.successful++
    } else {
      report.failed++
      report.errors.push({
        id: result.id,
        error: '数据验证失败'
      })
    }
  })

  return report
}

/**
 * 数据迁移工具类
 */
export class DataMigrationTool {
  /**
   * 检查是否需要迁移
   */
  static needsMigration(extendedField: any[]): boolean {
    return detectDataFormat(extendedField) === 'legacy'
  }

  /**
   * 执行单条记录迁移
   */
  static migrateSingle(extendedField: any[]): { tableData: TableRow[], tableFields: string[] } {
    const format = detectDataFormat(extendedField)
    
    if (format === 'legacy') {
      return migrateLegacyToTable(extendedField as LegacyCustomField[])
    } else if (format === 'table') {
      const firstRow = extendedField[0]
      const tableFields = Object.keys(firstRow).filter(key => key !== 'id')
      return {
        tableData: extendedField as TableRow[],
        tableFields: tableFields.includes('标题') 
          ? ['标题', ...tableFields.filter(f => f !== '标题')]
          : tableFields
      }
    } else {
      return {
        tableData: [{ id: 1, 标题: '', 正文: '' }],
        tableFields: ['标题', '正文']
      }
    }
  }

  /**
   * 预览迁移效果
   */
  static previewMigration(extendedField: any[]): {
    before: any[]
    after: { tableData: TableRow[], tableFields: string[] }
    format: string
    needsMigration: boolean
  } {
    const format = detectDataFormat(extendedField)
    const needsMigration = format === 'legacy'
    const after = this.migrateSingle(extendedField)

    return {
      before: extendedField,
      after,
      format,
      needsMigration
    }
  }
}