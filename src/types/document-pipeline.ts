import type { ProcessedNPC, ValidationWarning } from '@/lib/npc-parser';

/**
 * Represents a raw creature entry extracted from the document
 */
export interface CreatureEntry {
  rawMarkdown: string;
  entryNumber: number;
  creatureName: string;
  position: {
    start: number;
    end: number;
  };
}

/**
 * Extends ProcessedNPC with document-specific metadata
 */
export interface ParsedCreature extends ProcessedNPC {
  entryNumber: number;
  creatureType: string; // e.g., "Goblin", "Orc", "Ape"
  rawMarkdown: string;
  // Classification result is optional — added for Storybook/QA display
  classification?: {
    type: 'classed' | 'monster' | 'ambiguous';
    subtype?: string;
    confidence?: 'high' | 'medium' | 'low';
    reasoning?: string;
    warnings?: string[];
  } | null;
}

/**
 * Statistical summary of the entire document
 */
export interface DocumentStats {
  totalCreatures: number;
  creatureTypeFrequency: Map<string, number>;
  dispositionFrequency: Map<string, number>;
  acRange: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
  hpRange: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
  equipmentFrequency: Map<string, number>;
  spellFrequency: Map<string, number>;
  encounterBalance: {
    totalEstimatedXP: number;
    avgCREstimate: number;
  };
}

/**
 * Flags statistical anomalies for review
 */
export interface AnomalyFlag {
  type: 'outlier' | 'inconsistency' | 'missing';
  severity: 'high' | 'medium' | 'low';
  message: string;
  affectedEntries: number[];
}

/**
 * Batch validation report for entire document
 */
export interface BatchValidationReport {
  totalValidationScore: number;
  perCreatureScores: number[];
  crossEntryIssues: ValidationWarning[];
  statisticalAnomalies: AnomalyFlag[];
  recommendations: string[];
  totalIssues: number;
  criticalIssues: number;
}

/**
 * Complete document analysis result
 */
export interface DocumentAnalysisResult {
  creatures: ParsedCreature[];
  stats: DocumentStats;
  validationReport: BatchValidationReport;
  metadata: {
    documentName: string;
    totalEntries: number;
    processingDate: string;
    successRate: number; // percentage of successfully parsed entries
  };
}

/**
 * Export format options
 */
export type ExportFormat = 'markdown' | 'csv' | 'json' | 'html';

/**
 * Export configuration
 */
export interface ExportConfig {
  format: ExportFormat;
  includeValidation: boolean;
  includeStatistics: boolean;
  fileName?: string;
}
