 /**
  * Escape and format a cell value for CSV
  * - Handles null/undefined as empty strings
  * - Escapes double quotes by doubling them
  * - Wraps all values in quotes for consistency
  * - Handles newlines and special characters
  */
 function formatCellValue(value: unknown): string {
   if (value === null || value === undefined) {
     return '""';
   }
   
   // Convert to string
   let stringValue = String(value);
   
   // Replace any internal double quotes with escaped double quotes
   stringValue = stringValue.replace(/"/g, '""');
   
   // Replace newlines with spaces to prevent row breaking
   stringValue = stringValue.replace(/[\r\n]+/g, ' ');
   
   // Trim whitespace
   stringValue = stringValue.trim();
   
   // Always wrap in double quotes for consistency
   return `"${stringValue}"`;
 }
 
 /**
  * Format a header name for better readability
  * - Converts camelCase to Title Case with spaces
  */
 function formatHeaderName(key: string): string {
   // Handle camelCase by adding spaces before capitals
   return key
     .replace(/([A-Z])/g, ' $1')
     .replace(/^./, str => str.toUpperCase())
     .trim();
 }
 
 export function exportToCSV<T extends object>(
   data: T[],
   filename: string,
   columns?: { key: keyof T; header: string }[]
 ) {
   if (data.length === 0) {
     return;
   }
 
   // Determine columns from first item if not provided
   const headers = columns 
     ? columns.map(c => c.header)
     : Object.keys(data[0]).map(formatHeaderName);
   
   const keys = columns
     ? columns.map(c => c.key)
     : Object.keys(data[0]) as (keyof T)[];
 
   // Build CSV content
   const csvRows: string[] = [];
   
   // Header row - each header in its own quoted column
   csvRows.push(headers.map(h => formatCellValue(h)).join(","));
   
   // Data rows - each value properly escaped and in its own column
   for (const row of data) {
     const values = keys.map(key => formatCellValue(row[key]));
     csvRows.push(values.join(","));
   }
   
   // Join rows with CRLF for better Excel compatibility
   const csvContent = csvRows.join("\r\n");
   
   // Add BOM (Byte Order Mark) for proper UTF-8 encoding in Excel
   const BOM = '\uFEFF';
   const contentWithBOM = BOM + csvContent;
   
   // Create and trigger download
   const blob = new Blob([contentWithBOM], { type: "text/csv;charset=utf-8;" });
   const link = document.createElement("a");
   const url = URL.createObjectURL(blob);
   
   link.setAttribute("href", url);
   link.setAttribute("download", `${filename}.csv`);
   link.style.visibility = "hidden";
   
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   
   URL.revokeObjectURL(url);
 }
