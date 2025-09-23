// src/lib/excel-import.ts
// Utility to read Excel files and extract PC/NPC data for folders/rosters
import * as XLSX from 'xlsx';

export interface ExcelCharacter {
  id: string;
  kind: 'PC' | 'NPC' | 'Monster';
  name: string;
  defense: number;
  threat?: number;
  tier: 1|2|3|4;
  status?: 'available' | 'unavailable' | 'dead' | 'hidden';
  updatedAt: string;
}

export function parseExcelCharacters(file: ArrayBuffer): ExcelCharacter[] {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map((row: any) => ({
    id: row.id || row.ID || '',
    kind: row.kind || row.Kind || 'NPC',
    name: row.name || row.Name || '',
    defense: Number(row.defense || row.Defense || 0),
    threat: row.threat ? Number(row.threat) : undefined,
    tier: Number(row.tier || row.Tier || 1) as 1|2|3|4,
    status: row.status || row.Status,
    updatedAt: row.updatedAt || row.UpdatedAt || new Date().toISOString(),
  }));
}
