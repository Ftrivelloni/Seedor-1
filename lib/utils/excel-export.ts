import * as XLSX from 'xlsx'

export interface ExcelExportConfig {
  data: any[]
  filename: string
  sheetName?: string
  headers?: { [key: string]: string }
}

/**
 * Export data to Excel file with customizable options
 * @param config Configuration object for the export
 */
export function exportToExcel(config: ExcelExportConfig): void {
  const { data, filename, sheetName = 'Datos', headers } = config

  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  try {
    // Transform data if headers mapping is provided
    let exportData = data
    if (headers) {
      exportData = data.map(item => {
        const transformedItem: any = {}
        Object.keys(headers).forEach(key => {
          transformedItem[headers[key]] = item[key]
        })
        return transformedItem
      })
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Auto-size columns
    const columnWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(
        key.length,
        ...exportData.map(row => String(row[key] || '').length)
      )
    }))
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generate filename with timestamp if not provided
    const timestamp = new Date().toISOString().slice(0, 10)
    const finalFilename = filename.includes(timestamp) ? filename : `${filename}-${timestamp}.xlsx`

    // Write and download the file
    XLSX.writeFile(workbook, finalFilename)

  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Failed to export data to Excel')
  }
}

/**
 * Export multiple sheets to a single Excel file
 * @param sheets Array of sheet configurations
 * @param filename Filename for the Excel file
 */
export function exportMultipleSheetsToExcel(
  sheets: Array<{
    data: any[]
    sheetName: string
    headers?: { [key: string]: string }
  }>,
  filename: string
): void {
  if (!sheets || sheets.length === 0) {
    console.warn('No sheets to export')
    return
  }

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    sheets.forEach(({ data, sheetName, headers }) => {
      if (data && data.length > 0) {
        // Transform data if headers mapping is provided
        let exportData = data
        if (headers) {
          exportData = data.map(item => {
            const transformedItem: any = {}
            Object.keys(headers).forEach(key => {
              transformedItem[headers[key]] = item[key]
            })
            return transformedItem
          })
        }

        // Convert data to worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData)

        // Auto-size columns
        const columnWidths = Object.keys(exportData[0] || {}).map(key => ({
          wch: Math.max(
            key.length,
            ...exportData.map(row => String(row[key] || '').length)
          )
        }))
        worksheet['!cols'] = columnWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      }
    })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10)
    const finalFilename = filename.includes(timestamp) ? filename : `${filename}-${timestamp}.xlsx`

    // Write and download the file
    XLSX.writeFile(workbook, finalFilename)

  } catch (error) {
    console.error('Error exporting multiple sheets to Excel:', error)
    throw new Error('Failed to export data to Excel')
  }
}

// Utility function to format date for Excel
export function formatDateForExcel(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Utility function to format currency for Excel
export function formatCurrencyForExcel(amount: number): string {
  if (typeof amount !== 'number') return ''
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}