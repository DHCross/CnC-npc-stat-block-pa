export type WarningType = 'error' | 'warning' | 'info';

export interface ValidationWarning {
  type: WarningType;
  category: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  warnings: ValidationWarning[];
  complianceScore: number;
}

export interface ParsedStatBlock {
  name: string;
  fields: Record<string, string>;
  notes: string[];
  original: string;
}

export type ParsedNPC = ParsedStatBlock;
