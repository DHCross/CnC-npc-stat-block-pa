// src/lib/excel-import.ts
// Utility to read Excel files and extract PC/NPC data for folders/rosters
import * as XLSX from 'xlsx';

interface RawCharacterRow {
  id?: string;
  ID?: string;
  kind?: string;
  Kind?: string;
  name?: string;
  Name?: string;
  defense?: number | string;
  Defense?: number | string;
  threat?: number | string;
  Threat?: number | string;
  tier?: number | string;
  Tier?: number | string;
  status?: ExcelCharacter['status'];
  Status?: ExcelCharacter['status'];
  updatedAt?: string;
  UpdatedAt?: string;
}

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
  const rows = XLSX.utils.sheet_to_json<RawCharacterRow>(sheet);
  return rows.map((row) => ({
    id: row.id ?? row.ID ?? '',
    kind: (row.kind ?? row.Kind ?? 'NPC') as ExcelCharacter['kind'],
    name: row.name ?? row.Name ?? '',
    defense: Number(row.defense ?? row.Defense ?? 0),
    threat: row.threat !== undefined || row.Threat !== undefined ? Number(row.threat ?? row.Threat ?? 0) : undefined,
    tier: Number(row.tier ?? row.Tier ?? 1) as 1|2|3|4,
    status: row.status ?? row.Status,
    updatedAt: row.updatedAt ?? row.UpdatedAt ?? new Date().toISOString(),
  }));
}
