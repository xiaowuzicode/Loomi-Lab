/**
 * Excel 导出工具函数
 * 注意: 需要先安装 xlsx 库: npm install xlsx @types/xlsx
 */

import { CustomFieldRecord, TableRow } from '@/types'

// 类型定义兼容处理
interface ExcelData {
  [key: string]: any
}

/**
 * 导出表格数据为Excel文件
 * @param tableData 表格数据
 * @param fileName 文件名（不含扩展名）
 */
export const exportToExcel = async (
  tableData: CustomFieldRecord,
  selectedData?: TableRow[],
  fileName?: string
) => {
  try {
    // 动态导入 xlsx 库
    const XLSX = await import('xlsx')

    // 确定要导出的数据
    const dataToExport = selectedData || tableData.extendedField
    
    if (!dataToExport || dataToExport.length === 0) {
      throw new Error('没有数据可以导出')
    }

    // 准备Excel数据
    const excelData: ExcelData[] = dataToExport.map((row) => {
      const excelRow: ExcelData = {}
      
      // 添加所有字段数据
      tableData.tableFields.forEach(field => {
        excelRow[field] = row[field] || ''
      })
      
      return excelRow
    })

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const columnWidths = tableData.tableFields.map(field => ({
      wpx: field === '标题' ? 200 : field === '正文' ? 300 : 120
    }))
    worksheet['!cols'] = columnWidths

    // 添加工作表到工作簿
    const sheetName = tableData.tableName || '数据表'
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // 生成文件名
    const defaultFileName = fileName || 
      `${tableData.tableName || tableData.type}_${new Date().toISOString().split('T')[0]}`
    
    // 导出Excel文件
    XLSX.writeFile(workbook, `${defaultFileName}.xlsx`)

    return {
      success: true,
      count: dataToExport.length,
      fileName: `${defaultFileName}.xlsx`
    }
  } catch (error) {
    console.error('Excel导出失败:', error)
    throw new Error(error instanceof Error ? error.message : '导出失败')
  }
}

/**
 * 创建Excel导出的数据统计信息
 */
export const createExcelSummary = (
  tableData: CustomFieldRecord,
  exportedCount: number
) => {
  return {
    表名: tableData.tableName,
    表类型: tableData.type,
    总数据量: tableData.extendedField.length,
    导出数量: exportedCount,
    导出时间: new Date().toLocaleString('zh-CN'),
    字段列表: tableData.tableFields.join(', ')
  }
}

/**
 * 批量导出多个表格为Excel文件（多个工作表）
 */
export const exportMultipleTablesToExcel = async (
  tables: CustomFieldRecord[],
  fileName?: string
) => {
  try {
    const XLSX = await import('xlsx')
    
    if (!tables || tables.length === 0) {
      throw new Error('没有表格数据可以导出')
    }

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    
    let totalCount = 0

    // 为每个表格创建一个工作表
    tables.forEach((table, tableIndex) => {
      if (!table.extendedField || table.extendedField.length === 0) {
        return // 跳过空表格
      }

      // 准备数据
      const excelData: ExcelData[] = table.extendedField.map((row) => {
        const excelRow: ExcelData = {}
        
        table.tableFields.forEach(field => {
          excelRow[field] = row[field] || ''
        })
        
        return excelRow
      })

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      
      // 设置列宽
      const columnWidths = table.tableFields.map(field => ({
        wpx: field === '标题' ? 200 : field === '正文' ? 300 : 120
      }))
      worksheet['!cols'] = columnWidths

      // 工作表名称（限制长度，避免Excel限制）
      let sheetName = table.tableName || `表格${tableIndex + 1}`
      if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 28) + '...'
      }

      // 添加到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      totalCount += table.extendedField.length
    })

    // 生成文件名
    const defaultFileName = fileName || 
      `批量导出_${new Date().toISOString().split('T')[0]}`
    
    // 导出Excel文件
    XLSX.writeFile(workbook, `${defaultFileName}.xlsx`)

    return {
      success: true,
      tableCount: tables.length,
      totalCount,
      fileName: `${defaultFileName}.xlsx`
    }
  } catch (error) {
    console.error('批量Excel导出失败:', error)
    throw new Error(error instanceof Error ? error.message : '批量导出失败')
  }
}

/**
 * 下载Excel导入模板
 */
export const downloadExcelTemplate = async (type: '洞察' | '钩子' | '情绪') => {
  try {
    const XLSX = await import('xlsx')
    
    // 默认字段（基础模板）
    const defaultFields = ['标题', '示例字段1', '示例字段2', '示例字段3']
    
    // 创建模板数据（示例行）
    const templateData = [
      {
        标题: '示例标题1',
        示例字段1: '这是示例字段1内容...',
        示例字段2: '示例字段2',
        示例字段3: '示例字段3'
      },
      {
        标题: '示例标题2', 
        示例字段1: '这是另一个示例...',
        示例字段2: '示例字段2',
        示例字段3: '示例字段3',
      }
    ]
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    
    // 设置列宽
    const columnWidths = defaultFields.map(field => ({
      wpx: field === '标题' ? 200 : field === '正文' ? 300 : 120
    }))
    worksheet['!cols'] = columnWidths
    
    // 添加工作表
    XLSX.utils.book_append_sheet(workbook, worksheet, `${type}数据模板`)
    
    // 下载文件
    const fileName = `${type}数据导入模板_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    return {
      success: true,
      fileName
    }
  } catch (error) {
    console.error('模板下载失败:', error)
    throw new Error(error instanceof Error ? error.message : '模板下载失败')
  }
}

/**
 * 解析Excel文件并返回数据
 */
export const parseExcelFile = async (file: File): Promise<{
  fields: string[]
  data: any[]
  rowCount: number
}> => {
  try {
    const XLSX = await import('xlsx')
    
    // 读取文件
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error('Excel文件中没有找到工作表')
    }
    
    const worksheet = workbook.Sheets[firstSheetName]
    
    // 转换为JSON数据
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('Excel文件中没有数据')
    }
    
    // 第一行作为字段名
    const fields = (jsonData[0] as string[]).filter(field => field && field.trim())
    
    if (fields.length === 0) {
      throw new Error('Excel文件中没有有效的字段名')
    }
    
    // 验证必需字段
    if (!fields.includes('标题')) {
      throw new Error('Excel文件必须包含"标题"字段')
    }
    
    // 处理数据行
    const dataRows = jsonData.slice(1).filter(row => {
      // 过滤空行
      return Array.isArray(row) && row.some(cell => cell !== undefined && cell !== null && cell !== '')
    })
    
    // 转换为对象格式
    const data = dataRows.map(row => {
      const rowData: any = {}
      fields.forEach((field, index) => {
        rowData[field] = (row as any[])[index] || ''
      })
      return rowData
    })
    
    return {
      fields,
      data,
      rowCount: data.length
    }
  } catch (error) {
    console.error('Excel解析失败:', error)
    throw new Error(error instanceof Error ? error.message : 'Excel解析失败')
  }
}

/**
 * 创建导入数据的表格记录
 */
export const createTableFromImport = (
  importData: { fields: string[], data: any[] },
  type: '洞察' | '钩子' | '情绪',
  tableName: string,
  userId: string
) => {
  // 确保标题字段在第一位
  const fields = ['标题', ...importData.fields.filter(field => field !== '标题')]
  
  // 转换数据格式，添加自动生成的ID
  const extendedField = importData.data.map((row, index) => ({
    id: index + 1,
    ...row
  }))
  
  return {
    userId,
    createdUserId: userId,
    appCode: 'loomi',
    type,
    tableName,
    amount: 0,
    readme: `从Excel导入的${type}数据表`,
    exampleData: '',
    visibility: true,
    isPublic: false,
    extendedField,
    tableFields: fields
  }
}
