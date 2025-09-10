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
    const excelData: ExcelData[] = dataToExport.map((row, index) => {
      const excelRow: ExcelData = {}
      
      // 添加序号
      excelRow['序号'] = index + 1
      
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
    const columnWidths = [
      { wpx: 60 },  // 序号列
      ...tableData.tableFields.map(field => ({
        wpx: field === '标题' ? 200 : field === '正文' ? 300 : 120
      }))
    ]
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
      const excelData: ExcelData[] = table.extendedField.map((row, index) => {
        const excelRow: ExcelData = {}
        excelRow['序号'] = index + 1
        
        table.tableFields.forEach(field => {
          excelRow[field] = row[field] || ''
        })
        
        return excelRow
      })

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      
      // 设置列宽
      const columnWidths = [
        { wpx: 60 },  // 序号列
        ...table.tableFields.map(field => ({
          wpx: field === '标题' ? 200 : field === '正文' ? 300 : 120
        }))
      ]
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
