# Chunk 12

### src/lib/full-document-pipeline.ts

```typescript
import { processDumpWithValidation, type ValidationWarning } from './npc-parser';
import { sanitizeCanonicalText, normalizeUnicodeSuperscripts } from './enhanced-parser';
import { isRankedNamedEntity, determinePossessivePronoun } from './stat-block-helpers';
import type {
  CreatureEntry,
  ParsedCreature,
  DocumentStats,
  AnomalyFlag,
  BatchValidationReport,
  DocumentAnalysisResult,
  ExportConfig,
} from '@/types/document-pipeline';

/**
 * Extracts creature entries from markdown document
 * Expects format: ### N. Creature Name
 */
export function extractCreatureEntries(markdown: string): CreatureEntry[] {
  const entries: CreatureEntry[] = [];
  
  // Match numbered creature headers like "### 1. Ape, carnivorous" or "### 1. **Batrachianoid*:** _"
  const headerRegex = /^###\s+(\d+)\.\s+(.+?)$/gm;
  
  const matches = Array.from(markdown.matchAll(headerRegex));
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    const entryNumber = parseInt(match[1], 10);
    const creatureName = match[2]
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*:/g, '')  // Remove asterisk colons
      .replace(/_/g, '')    // Remove underscores
      .trim();
    
    const startPos = match.index || 0;
    const endPos = nextMatch ? (nextMatch.index || markdown.length) : markdown.length;
    
    const rawMarkdown = markdown.slice(startPos, endPos).trim();
    
    entries.push({
      rawMarkdown,
      entryNumber,
      creatureName,
      position: { start: startPos, end: endPos },
    });
  }
  
  return entries;
}

/**
 * Parses a single creature entry using the existing NPC parser
 */
export function parseCreatureBlock(entry: CreatureEntry, formatterMode: 'monster' | 'enhanced' = 'monster'): ParsedCreature | null {
  try {
    // Use existing parser (enhanced mode, 'monster' formatter for bestiary entries).
    // Pass the full rawMarkdown so that title-based heuristics in the
    // monster parser can detect named entities (Hub-Gub, Ember Raventree)
    // and apply Rule-of-Rank suppression of HD when HP is present.
    const parsed = processDumpWithValidation(entry.rawMarkdown, true, formatterMode);
    
    if (parsed.length === 0) {
      return null;
    }
    
    // Take the first parsed result
    const processedNPC = parsed[0];

    // Sanitize converted strings to remove any leftover artifacts that
    // may have been produced earlier in the pipeline or persisted in mocks.
    // This is defensive: parsers should not append diagnostic messages to
    // converted output, but older mock data may contain the phrase.
      if (processedNPC.converted) {
        processedNPC.converted = sanitizeConvertedString(processedNPC.converted);
        // Apply additional canonical cleanup for obvious grammar/pluralization typos
        processedNPC.converted = sanitizeCanonicalText(processedNPC.converted);
        // Normalize Unicode superscripts to plain-text ordinals per Canonicalizer mandate
        processedNPC.converted = normalizeUnicodeSuperscripts(processedNPC.converted);
        // If this is a named/ranked entity, enforce Rule-of-Rank long-form attributes
        // by replacing any leftover 'significant attributes' clause with the PHB long-form.
        if (isRankedNamedEntity(entry.creatureName)) {
          const pronoun = determinePossessivePronoun(processedNPC.original, processedNPC.canonicalData?.notes?.[0], false, entry.creatureName) || 'His';
          processedNPC.converted = processedNPC.converted.replace(/(His|Her|Their|Their|Its) significant attributes are [^.]+\./i, `${pronoun} primary attributes are strength, dexterity, constitution, intelligence, wisdom, and charisma.`);
          // Remove the shorter 'primary attributes are physical' shorthand when the
          // Rule-of-Rank long-form attribute list has been inserted for readability.
          processedNPC.converted = processedNPC.converted.replace(/(His|Her|Their|Their|Its) primary attributes are physical\./i, '');
          // Normalize ordinal superscripts into plain '12 level' for named entities
          // Replace common ordinals and odd unicode superscripts followed by 'level'
          processedNPC.converted = processedNPC.converted.replace(/(\d+)(?:\s*[^\s\d]{1,3})?\s*level/gi, '$1 level');
          // If the converted string includes 'Level' without a numeric context, try
          // to find the original number from raw markdown and insert it (fix for
          // cases where ordinals were stripped during parsing, e.g., "This 12ᵗʰ
          // level cleric or’s vital stats...").
          if (/\bLevel(?!\s*\d)/i.test(processedNPC.converted)) {
            const m = entry.rawMarkdown.match(/(\d+)(?:st|nd|rd|th|[^\s\d]{1,3})?\s*level/i);
            if (m) {
              processedNPC.converted = processedNPC.converted.replace(/\bLevel\b/i, `${m[1]} level`);
            }
          }
        }
    }
    
    // Extract creature type from name (e.g., "Goblin, raider" -> "Goblin")
    const creatureType = extractCreatureType(entry.creatureName);
    
    return {
      ...processedNPC,
      entryNumber: entry.entryNumber,
      creatureType,
      rawMarkdown: entry.rawMarkdown,
    };
  } catch (error) {
    console.error(`Failed to parse creature entry ${entry.entryNumber}: ${entry.creatureName}`, error);
    return null;
  }
}

/**
 * Removes the leftover "(This creature's vital stats are unavailable.)" artifact
 * (and variants) from converted text. We support both curly and straight
 * apostrophes and up to one set of surrounding Markdown asterisks.
 */
export function sanitizeConvertedString(text: string): string {
  if (!text) return text;

  // Match variants like "*(This creature’s vital stats are unavailable.)*"
  // or plain "(This creature's vital stats are unavailable.)" with either
  // curly (’) or straight (') apostrophes.
  const artifactRegex = /\*?\(This creature[’']s vital stats are unavailable\.\)\*?/gi;

  // Remove the artifact and collapse duplicate whitespace/newlines.
  let cleaned = text.replace(artifactRegex, '');

  // Replace multiple spaces/newlines with a single space where appropriate
  // and trim edges.
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  cleaned = cleaned.replace(/\n{2,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Extracts the base creature type from a creature name
 * e.g., "Goblin, raider" -> "Goblin"
 * e.g., "Ape, carnivorous" -> "Ape"
 */
function extractCreatureType(name: string): string {
  // Remove parentheticals
  const withoutParens = name.replace(/\([^)]*\)/g, '').trim();
  
  // Take everything before the first comma or 'x' marker
  const beforeComma = withoutParens.split(/,|x\d+/)[0].trim();
  
  return beforeComma;
}

/**
 * Generates statistics from parsed creatures
 */
export function generateDocumentStatistics(creatures: ParsedCreature[]): DocumentStats {
  const creatureTypeFreq = new Map<string, number>();
  const dispositionFreq = new Map<string, number>();
  const equipmentFreq = new Map<string, number>();
  const spellFreq = new Map<string, number>();
  
  const acValues: number[] = [];
  const hpValues: number[] = [];
  
  for (const creature of creatures) {
    // Creature type frequency
    const type = creature.creatureType;
    creatureTypeFreq.set(type, (creatureTypeFreq.get(type) || 0) + 1);
    
    // Disposition frequency (extract from converted text)
    const dispositionMatch = creature.converted.match(/Disposition:\s*([^\n]+)/i);
    if (dispositionMatch) {
      const disp = dispositionMatch[1].trim();
      dispositionFreq.set(disp, (dispositionFreq.get(disp) || 0) + 1);
    }
    
    // Extract AC
    const acMatch = creature.converted.match(/AC[:\s]+(\d+)/i);
    if (acMatch) {
      acValues.push(parseInt(acMatch[1], 10));
    }
    
    // Extract HP
    const hpMatch = creature.converted.match(/HP[:\s]+(\d+)/i);
    if (hpMatch) {
      hpValues.push(parseInt(hpMatch[1], 10));
    }
    
    // Extract equipment (basic frequency count)
    const equipmentMatch = creature.converted.match(/Equipment:\s*([^\n]+)/i);
    if (equipmentMatch) {
      const items = equipmentMatch[1].split(',');
      for (const item of items) {
        const trimmed = item.trim().toLowerCase();
        if (trimmed) {
          equipmentFreq.set(trimmed, (equipmentFreq.get(trimmed) || 0) + 1);
        }
      }
    }
    
    // Extract spells (basic frequency count)
    const spellMatch = creature.converted.match(/Spells:\s*([^\n]+)/i);
    if (spellMatch) {
      spellFreq.set('has_spells', (spellFreq.get('has_spells') || 0) + 1);
    }
  }
  
  // Calculate statistics
  const acSorted = [...acValues].sort((a, b) => a - b);
  const hpSorted = [...hpValues].sort((a, b) => a - b);
  
  const calculateStats = (values: number[]) => {
    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0 };
    }
    
    const min = values[0];
    const max = values[values.length - 1];
    const mean = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    const median = values[Math.floor(values.length / 2)];
    
    return { min, max, mean, median };
  };
  
  // Simple XP estimation (placeholder - would need proper CR calculation)
  const totalEstimatedXP = creatures.length * 100; // Placeholder
  const avgCREstimate = 1; // Placeholder
  
  return {
    totalCreatures: creatures.length,
    creatureTypeFrequency: creatureTypeFreq,
    dispositionFrequency: dispositionFreq,
    acRange: calculateStats(acSorted),
    hpRange: calculateStats(hpSorted),
    equipmentFrequency: equipmentFreq,
    spellFrequency: spellFreq,
    encounterBalance: {
      totalEstimatedXP,
      avgCREstimate,
    },
  };
}

/**
 * Detects statistical anomalies in the document
 */
export function detectAnomalies(creatures: ParsedCreature[], _stats: DocumentStats): AnomalyFlag[] {
  const anomalies: AnomalyFlag[] = [];
  
  // Detect AC outliers
  const acValues: Array<{ value: number; entry: number }> = [];
  for (const creature of creatures) {
    const acMatch = creature.converted.match(/AC[:\s]+(\d+)/i);
    if (acMatch) {
      acValues.push({
        value: parseInt(acMatch[1], 10),
        entry: creature.entryNumber,
      });
    }
  }
  
  const highAC = acValues.filter(ac => ac.value > 20);
  const lowAC = acValues.filter(ac => ac.value < 10);
  
  if (highAC.length > 0) {
    anomalies.push({
      type: 'outlier',
      severity: 'low',
      message: `${highAC.length} creature(s) with unusually high AC (>20)`,
      affectedEntries: highAC.map(ac => ac.entry),
    });
  }
  
  if (lowAC.length > 0) {
    anomalies.push({
      type: 'outlier',
      severity: 'low',
      message: `${lowAC.length} creature(s) with unusually low AC (<10)`,
      affectedEntries: lowAC.map(ac => ac.entry),
    });
  }
  
  // Detect duplicate creature names
  const nameMap = new Map<string, number[]>();
  for (const creature of creatures) {
    const name = creature.creatureType.toLowerCase();
    if (!nameMap.has(name)) {
      nameMap.set(name, []);
    }
    nameMap.get(name)!.push(creature.entryNumber);
  }
  
  for (const [name, entries] of nameMap.entries()) {
    if (entries.length > 10) {
      anomalies.push({
        type: 'inconsistency',
        severity: 'low',
        message: `Creature type "${name}" appears ${entries.length} times - verify stat consistency`,
        affectedEntries: entries,
      });
    }
  }
  
  return anomalies;
}

/**
 * Validates the entire document batch
 */
export function validateDocumentBatch(creatures: ParsedCreature[]): BatchValidationReport {
  const perCreatureScores: number[] = [];
  const crossEntryIssues: ValidationWarning[] = [];
  let totalIssues = 0;
  let criticalIssues = 0;
  
  // Collect per-creature validation scores
  for (const creature of creatures) {
    perCreatureScores.push(creature.validation.complianceScore);
    totalIssues += creature.validation.warnings.length;
    criticalIssues += creature.validation.warnings.filter(w => w.type === 'error').length;
  }
  
  // Calculate average compliance
  const totalValidationScore = perCreatureScores.length > 0
    ? Math.round(perCreatureScores.reduce((sum, score) => sum + score, 0) / perCreatureScores.length)
    : 0;
  
  // Generate statistics for anomaly detection
  const stats = generateDocumentStatistics(creatures);
  const anomalies = detectAnomalies(creatures, stats);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (totalValidationScore < 70) {
    recommendations.push('Overall compliance is below 70% - consider using auto-correction features');
  }
  
  if (criticalIssues > 0) {
    recommendations.push(`${criticalIssues} critical errors detected - review these before publication`);
  }
  
  if (anomalies.length > 0) {
    recommendations.push(`${anomalies.length} statistical anomalies detected - review for consistency`);
  }
  
  return {
    totalValidationScore,
    perCreatureScores,
    crossEntryIssues,
    statisticalAnomalies: anomalies,
    recommendations,
    totalIssues,
    criticalIssues,
  };
}

/**
 * Main pipeline: analyzes a full document
 */
export function analyzeFullDocument(
  markdown: string,
  documentName: string = 'Untitled Document',
  formatterMode: 'monster' | 'enhanced' = 'monster'
): DocumentAnalysisResult {
  // Step 1: Extract creature entries
  const entries = extractCreatureEntries(markdown);
  
  // Step 2: Parse each entry
  const creatures: ParsedCreature[] = [];
  for (const entry of entries) {
    const parsed = parseCreatureBlock(entry, formatterMode);
    if (parsed) {
      creatures.push(parsed);
    }
  }
  
  // Step 3: Generate statistics
  const stats = generateDocumentStatistics(creatures);
  
  // Step 4: Validate batch
  const validationReport = validateDocumentBatch(creatures);
  
  // Step 5: Calculate success rate
  const successRate = entries.length > 0
    ? Math.round((creatures.length / entries.length) * 100)
    : 0;
  
  return {
    creatures,
    stats,
    validationReport,
    metadata: {
      documentName,
      totalEntries: entries.length,
      processingDate: new Date().toISOString(),
      successRate,
    },
  };
}

/**
 * Exports creatures in the specified format
 */
export function exportCreatures(
  result: DocumentAnalysisResult,
  config: ExportConfig
): string {
  const { creatures, stats, validationReport, metadata } = result;
  const { format, includeValidation, includeStatistics } = config;
  
  switch (format) {
    case 'markdown':
      return exportAsMarkdown(creatures, stats, validationReport, metadata, includeValidation, includeStatistics);
    
    case 'csv':
      return exportAsCSV(creatures);
    
    case 'json':
      return JSON.stringify(result, null, 2);
    
    case 'html':
      return exportAsHTML(creatures, stats, validationReport, metadata, includeValidation, includeStatistics);
    
    default:
      return exportAsMarkdown(creatures, stats, validationReport, metadata, includeValidation, includeStatistics);
  }
}

/**
 * Export as Markdown
 */
function exportAsMarkdown(
  creatures: ParsedCreature[],
  stats: DocumentStats,
  validationReport: BatchValidationReport,
  metadata: { documentName: string; totalEntries: number; processingDate: string; successRate: number },
  includeValidation: boolean,
  includeStatistics: boolean
): string {
  let output = `# ${metadata.documentName}\n\n`;
  output += `*Processed: ${new Date(metadata.processingDate).toLocaleDateString()}*\n\n`;
  output += `---\n\n`;
  
  if (includeStatistics) {
    output += `## Document Statistics\n\n`;
    output += `- **Total Creatures**: ${stats.totalCreatures}\n`;
    output += `- **Success Rate**: ${metadata.successRate}%\n`;
    output += `- **AC Range**: ${stats.acRange.min}-${stats.acRange.max} (avg: ${stats.acRange.mean})\n`;
    output += `- **HP Range**: ${stats.hpRange.min}-${stats.hpRange.max} (avg: ${stats.hpRange.mean})\n\n`;
    
    output += `### Creature Types\n\n`;
    const sortedTypes = mapEntries(stats.creatureTypeFrequency)
      .sort((a, b) => b[1] - a[1]);
    for (const [type, count] of sortedTypes) {
      output += `- ${type}: ${count}\n`;
    }
    output += `\n`;
  }
  
  if (includeValidation) {
    output += `## Validation Report\n\n`;
    output += `- **Overall Compliance**: ${validationReport.totalValidationScore}%\n`;
    output += `- **Total Issues**: ${validationReport.totalIssues}\n`;
    output += `- **Critical Issues**: ${validationReport.criticalIssues}\n\n`;
    
    if (validationReport.recommendations.length > 0) {
      output += `### Recommendations\n\n`;
      for (const rec of validationReport.recommendations) {
        output += `- ${rec}\n`;
      }
      output += `\n`;
    }
  }
  
  output += `## Creatures\n\n`;
  
  for (const creature of creatures) {
    output += `### ${creature.entryNumber}. ${creature.creatureType}\n\n`;
    output += `${creature.converted}\n\n`;
    
    if (includeValidation && creature.validation.warnings.length > 0) {
      output += `**Validation Issues**: ${creature.validation.warnings.length}\n\n`;
    }
    
    output += `---\n\n`;
  }
  
  return output;
}

function mapEntries(mapLike: any): [string, number][] {
  if (!mapLike) return [];
  if (typeof mapLike.entries === 'function') return Array.from(mapLike.entries());
  if (typeof mapLike === 'object') return Object.entries(mapLike);
  return [];
}

/**
 * Export as CSV
 */
function exportAsCSV(creatures: ParsedCreature[]): string {
  const headers = ['Entry', 'Name', 'Type', 'HP', 'AC', 'Disposition', 'Compliance %'];
  const rows: string[][] = [headers];
  
  for (const creature of creatures) {
    const hpMatch = creature.converted.match(/HP[:\s]+(\d+)/i);
    const acMatch = creature.converted.match(/AC[:\s]+(\d+)/i);
    const dispMatch = creature.converted.match(/Disposition:\s*([^\n]+)/i);
    
    rows.push([
      creature.entryNumber.toString(),
      `"${creature.creatureType}"`,
      `"${creature.creatureType}"`,
      hpMatch ? hpMatch[1] : '',
      acMatch ? acMatch[1] : '',
      dispMatch ? `"${dispMatch[1].trim()}"` : '',
      creature.validation.complianceScore.toString(),
    ]);
  }
  
  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Export as HTML
 */
function exportAsHTML(
  creatures: ParsedCreature[],
  stats: DocumentStats,
  validationReport: BatchValidationReport,
  metadata: { documentName: string; totalEntries: number; processingDate: string; successRate: number },
  includeValidation: boolean,
  includeStatistics: boolean
): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${metadata.documentName}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1, h2, h3 { color: #333; }
    .stats { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .creature { border-left: 4px solid #007bff; padding-left: 16px; margin: 20px 0; }
    .compliance { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .compliance-high { background: #d4edda; color: #155724; }
    .compliance-medium { background: #fff3cd; color: #856404; }
    .compliance-low { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>${metadata.documentName}</h1>
  <p><em>Processed: ${new Date(metadata.processingDate).toLocaleDateString()}</em></p>
`;
  
  if (includeStatistics) {
    html += `  <div class="stats">
    <h2>Statistics</h2>
    <p><strong>Total Creatures:</strong> ${stats.totalCreatures}</p>
    <p><strong>Success Rate:</strong> ${metadata.successRate}%</p>
    <p><strong>AC Range:</strong> ${stats.acRange.min}-${stats.acRange.max} (avg: ${stats.acRange.mean})</p>
    <p><strong>HP Range:</strong> ${stats.hpRange.min}-${stats.hpRange.max} (avg: ${stats.hpRange.mean})</p>
  </div>
`;
  }
  
  if (includeValidation) {
    html += `  <div class="stats">
    <h2>Validation Report</h2>
    <p><strong>Overall Compliance:</strong> ${validationReport.totalValidationScore}%</p>
    <p><strong>Total Issues:</strong> ${validationReport.totalIssues}</p>
    <p><strong>Critical Issues:</strong> ${validationReport.criticalIssues}</p>
  </div>
`;
  }
  
  html += `  <h2>Creatures</h2>\n`;
  
  for (const creature of creatures) {
    const complianceClass = creature.validation.complianceScore >= 90
      ? 'compliance-high'
      : creature.validation.complianceScore >= 70
        ? 'compliance-medium'
        : 'compliance-low';
    
    html += `  <div class="creature">
    <h3>${creature.entryNumber}. ${creature.creatureType} <span class="compliance ${complianceClass}">${creature.validation.complianceScore}%</span></h3>
    <p>${creature.converted.replace(/\n/g, '<br>')}</p>
  </div>
`;
  }
  
  html += `</body>
</html>`;
  
  return html;
}

```

### src/lib/excel-import.ts

```typescript
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

```

