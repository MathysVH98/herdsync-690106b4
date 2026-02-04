export function exportToCSV<T extends Record<string, any>>(
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
    : Object.keys(data[0]);
  
  const keys = columns
    ? columns.map(c => c.key)
    : Object.keys(data[0]) as (keyof T)[];

  // Build CSV content
  const csvRows: string[] = [];
  
  // Header row
  csvRows.push(headers.map(h => `"${h}"`).join(","));
  
  // Data rows
  for (const row of data) {
    const values = keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) {
        return "";
      }
      // Escape quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvRows.push(values.join(","));
  }
  
  const csvContent = csvRows.join("\n");
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
