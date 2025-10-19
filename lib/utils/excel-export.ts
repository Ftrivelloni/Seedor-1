"use client";

import ExcelJS from 'exceljs';

export interface ExcelExportConfig {
  data: Record<string, unknown>[];
  filename: string;
  sheetName?: string;
  headers?: { [key: string]: string };
}

/**
 * Export data to Excel file with customizable options
 * @param config Configuration object for the export
 */
export function exportToExcel(config: ExcelExportConfig): void {
  const { data, filename, sheetName = 'Datos', headers } = config;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Transform data if headers mapping is provided
    let exportData = data;
    if (headers) {
      exportData = data.map(item => {
        const transformedItem: Record<string, unknown> = {};
        Object.keys(headers).forEach(key => {
          transformedItem[headers[key]] = item[key];
        });
        return transformedItem;
      });
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add a worksheet
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Add headers
    if (exportData.length > 0) {
      const headerRow = Object.keys(exportData[0]);
      worksheet.addRow(headerRow);
      
      // Style the header row
      const headerRowObj = worksheet.getRow(1);
      headerRowObj.font = { bold: true };
      headerRowObj.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add data rows
      exportData.forEach(dataRow => {
        worksheet.addRow(Object.values(dataRow));
      });
      
      // Auto-fit columns
      const columns = worksheet.columns;
      if (columns) {
        columns.forEach((column) => {
          if (column) {
            let maxLength = 0;
            if (column.eachCell) {
              column.eachCell({ includeEmpty: true }, (cell) => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                  maxLength = columnLength;
                }
              });
            }
            column.width = maxLength < 10 ? 10 : maxLength + 2;
          }
        });
      }
    }

    // Generate filename with timestamp if not provided
    const timestamp = new Date().toISOString().slice(0, 10);
    const finalFilename = filename.includes(timestamp) ? filename : `${filename}-${timestamp}.xlsx`;

    // Write the file
    workbook.xlsx.writeBuffer()
      .then(buffer => {
        // Create a blob from the buffer
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Create an object URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        
        // Trigger the download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('Excel file created successfully');
      })
      .catch((error) => {
        console.error('Error writing Excel file:', error);
        throw error;
      });

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
}

/**
 * Export multiple sheets to a single Excel file
 * @param sheets Array of sheet configurations
 * @param filename Filename for the Excel file
 */
export function exportMultipleSheetsToExcel(
  sheets: Array<{
    data: Record<string, unknown>[];
    sheetName: string;
    headers?: { [key: string]: string };
  }>,
  filename: string
): void {
  if (!sheets || sheets.length === 0) {
    console.warn('No sheets to export');
    return;
  }

  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    sheets.forEach(({ data, sheetName, headers }) => {
      if (data && data.length > 0) {
        // Transform data if headers mapping is provided
        let exportData = data;
        if (headers) {
          exportData = data.map(item => {
            const transformedItem: Record<string, unknown> = {};
            Object.keys(headers).forEach(key => {
              transformedItem[headers[key]] = item[key];
            });
            return transformedItem;
          });
        }

        // Add a worksheet
        const worksheet = workbook.addWorksheet(sheetName);
        
        // Add headers
        if (exportData.length > 0) {
          const headerRow = Object.keys(exportData[0]);
          worksheet.addRow(headerRow);
          
          // Style the header row
          const headerRowObj = worksheet.getRow(1);
          headerRowObj.font = { bold: true };
          headerRowObj.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          
          // Add data rows
          exportData.forEach(dataRow => {
            worksheet.addRow(Object.values(dataRow));
          });
          
          // Auto-fit columns
          const columns = worksheet.columns;
          if (columns) {
            columns.forEach((column) => {
              if (column && typeof column.eachCell === 'function') {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                  const columnLength = cell.value ? cell.value.toString().length : 10;
                  if (columnLength > maxLength) {
                    maxLength = columnLength;
                  }
                });
                column.width = maxLength < 10 ? 10 : maxLength + 2;
              }
            });
          }
        }
      }
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const finalFilename = filename.includes(timestamp) ? filename : `${filename}-${timestamp}.xlsx`;

    // Write the file
    workbook.xlsx.writeBuffer()
      .then(buffer => {
        // Create a blob from the buffer
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Create an object URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        
        // Trigger the download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('Excel file with multiple sheets created successfully');
      })
      .catch((error) => {
        console.error('Error writing Excel file:', error);
        throw error;
      });

  } catch (error) {
    console.error('Error exporting multiple sheets to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
}

/**
 * Format a date for Excel display
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDateForExcel(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Format a currency value for Excel display
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export function formatCurrencyForExcel(amount: number): string {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
}
