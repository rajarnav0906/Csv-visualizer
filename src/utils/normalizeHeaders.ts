// src/utils/normalizeHeaders.ts
export function normalizeRows(rawRows: any[], mapping: Record<string, string>): any[] {
  if (!rawRows || !rawRows.length) return [];
  
  return rawRows.map(row => {
    const newRow: any = {};
    for (const key in row) {
      if (row.hasOwnProperty(key)) {
        const mapped = mapping[key];
        if (mapped && mapped !== 'Unknown') {
          newRow[mapped] = row[key];
        } else if (!mapped) {
          // Keep original if no mapping
          newRow[key] = row[key];
        }
      }
    }
    return newRow;
  });
}

export function applyFixesToRows(
  rows: any[], 
  fixes: Array<{ rowIndex: number; changes: Record<string, any> }>
): any[] {
  const newRows = [...rows];
  fixes.forEach(fix => {
    if (fix.rowIndex >= 0 && fix.rowIndex < newRows.length) {
      newRows[fix.rowIndex] = {
        ...newRows[fix.rowIndex],
        ...fix.changes
      };
    }
  });
  return newRows;
}