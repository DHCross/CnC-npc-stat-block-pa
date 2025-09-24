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

export interface ProcessedNPC {
  name: string;
  original: string;
  converted: string;
  validation: ValidationResult;
}

export type CorrectionConfidence = 'high' | 'medium' | 'low';

export interface CorrectionFix {
  category: string;
  description: string;
  originalText: string;
  correctedText: string;
  confidence: CorrectionConfidence;
}

export interface AutoCorrectionOptions {
  enableDictionarySuggestions?: boolean;
}

interface ParsedNPC {
  name: string;
  fields: Record<string, string>;
  notes: string[];
  original: string;
}

interface Dictionaries {
  spells: Set<string>;
  items: Set<string>;
  monsters: Set<string>;
}

const dictionaries: Dictionaries = {
  spells: new Set<string>(),
  items: new Set<string>(),
  monsters: new Set<string>(),
};

const FIELD_ORDER = [
  'Disposition',
  'Race & Class',
  'Hit Points (HP)',
  'Armor Class (AC)',
  'Primary attributes',
  'Equipment',
  'Spells',
  'Mount',
  'Gear',
  'Special Abilities',
  'Vision',
  'Background',
];

const VALIDATION_RULES: Array<{
  field: string;
  weight: number;
  type: WarningType;
  message: string;
  suggestion?: string;
}> = [
  {
    field: 'Disposition',
    weight: 25,
    type: 'error',
    message: 'Add a Disposition line using noun-form alignment (e.g., law/good).',
    suggestion: 'Replace "Alignment" with "Disposition" and use noun forms (law/good, chaos/evil, etc.).',
  },
  {
    field: 'Race & Class',
    weight: 20,
    type: 'error',
    message: 'Include Race & Class details (e.g., human, 5th level fighter).',
  },
  {
    field: 'Hit Points (HP)',
    weight: 15,
    type: 'warning',
    message: 'Hit Points (HP) missing. Provide either a total or dice expression.',
  },
  {
    field: 'Armor Class (AC)',
    weight: 10,
    type: 'warning',
    message: 'Armor Class (AC) missing. Include base AC and modifiers when possible.',
  },
  {
    field: 'Primary attributes',
    weight: 10,
    type: 'info',
    message: 'Primary attributes (Prime) help with quick reference.',
  },
  {
    field: 'Equipment',
    weight: 10,
    type: 'info',
    message: 'Listing notable equipment helps with conversion fidelity.',
  },
];

export function processDump(input: string): ProcessedNPC[] {
  return processDumpWithValidation(input);
}

export function processDumpWithValidation(input: string): ProcessedNPC[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const blocks = splitIntoBlocks(trimmed);
  return blocks.map((block) => {
    const parsed = parseBlock(block);
    const converted = formatToNarrative(parsed);
    const validation = buildValidation(parsed);

    return {
      name: parsed.name,
      original: parsed.original,
      converted,
      validation,
    } satisfies ProcessedNPC;
  });
}

export function generateNPCTemplate(): string {
  return [
    '**Sir Elric the Resolute**',
    '',
    'Disposition: law/good',
    'Race & Class: human, 7th level paladin',
    'Hit Points (HP): 52',
    'Armor Class (AC): 18 (+7 plate, +2 shield, -1 Dex)',
    'Primary attributes: strength, charisma',
    'Equipment: +1 greatsword, plate mail, large steel shield, holy symbol',
    'Spells: protection from evil, detect evil',
    'Mount: heavy war horse',
    'Background: Veteran of the Redwall campaign and sworn guardian of the High Chapel.',
  ].join('\n');
}

export function generateBatchTemplate(): string {
  return [
    generateNPCTemplate(),
    '',
    '**Captain Mirella of the Ember Watch**',
    '',
    'Disposition: neutral/good',
    'Race & Class: dwarf, 6th level fighter',
    'Hit Points (HP): 47',
    'Armor Class (AC): 17 (+6 chain, +2 shield, -1 Dex)',
    'Primary attributes: constitution, strength',
    'Equipment: war hammer, shield engraved with the Ember sigil, potion of heroism',
    'Special Abilities: dwarf resilience, ember watch tactics',
    'Background: Commands the Ember Watch, protecting the emberforged vaults beneath the citadel.',
  ].join('\n');
}

export function generateAutoCorrectionFixes(
  input: string,
  options: AutoCorrectionOptions = {},
): CorrectionFix[] {
  const fixes: CorrectionFix[] = [];
  const { enableDictionarySuggestions = true } = options;

  const alignmentRegex = /(Alignment\s*:\s*)([^\n]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = alignmentRegex.exec(input)) !== null) {
    const originalText = match[0];
    const normalizedDisposition = normalizeDisposition(match[2]);
    fixes.push({
      category: 'terminology',
      description: 'Convert Alignment to Disposition with noun-form alignment.',
      originalText,
      correctedText: `Disposition: ${normalizedDisposition}`,
      confidence: 'high',
    });
  }

  const primeRegex = /(Prime Attributes?\s*:\s*)([^\n]+)/gi;
  while ((match = primeRegex.exec(input)) !== null) {
    fixes.push({
      category: 'terminology',
      description: 'Use "Primary attributes" instead of "Prime Attributes".',
      originalText: match[0],
      correctedText: `Primary attributes: ${match[2]}`,
      confidence: 'high',
    });
  }

  const levelRegex = /(\d+)(st|nd|rd|th) level/gi;
  while ((match = levelRegex.exec(input)) !== null) {
    const originalText = match[0];
    const superscriptLevel = toSuperscript(match[1]) + ' level';
    fixes.push({
      category: 'formatting',
      description: 'Convert level ordinal suffix to superscript form.',
      originalText,
      correctedText: superscriptLevel,
      confidence: 'medium',
    });
  }

  const italicsRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const spells = dictionaries.spells;
  if (enableDictionarySuggestions && spells.size > 0) {
    let italicMatch: RegExpExecArray | null;
    while ((italicMatch = italicsRegex.exec(input)) !== null) {
      const candidate = italicMatch[1];
      if (spells.has(candidate) && !isAlreadyFormatted(input, candidate)) {
        fixes.push({
          category: 'spells',
          description: `Italicize known spell “${candidate}”.`,
          originalText: candidate,
          correctedText: `*${candidate}*`,
          confidence: 'medium',
        });
      }
    }
  }

  return dedupeFixes(fixes);
}

export function applyCorrectionFix(input: string, fix: CorrectionFix): string {
  if (!fix.originalText) {
    return input;
  }
  return input.replace(fix.originalText, fix.correctedText);
}

export function applyAllHighConfidenceFixes(
  input: string,
  options?: AutoCorrectionOptions,
): string {
  let working = input;
  const fixes = generateAutoCorrectionFixes(input, options).filter(
    (fix) => fix.confidence === 'high',
  );
  for (const fix of fixes) {
    working = applyCorrectionFix(working, fix);
  }
  return working;
}

export function convertToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`);
  return paragraphs.join('\n') || '<p></p>';
}

export function setDictionaries(dictUpdates: {
  spellsCsv?: string;
  itemsCsv?: string;
  monstersCsv?: string;
}): void {
  if (typeof dictUpdates.spellsCsv === 'string') {
    dictionaries.spells = parseCsvToSet(dictUpdates.spellsCsv);
  }
  if (typeof dictUpdates.itemsCsv === 'string') {
    dictionaries.items = parseCsvToSet(dictUpdates.itemsCsv);
  }
  if (typeof dictUpdates.monstersCsv === 'string') {
    dictionaries.monsters = parseCsvToSet(dictUpdates.monstersCsv);
  }
}

function splitIntoBlocks(input: string): string[] {
  const lines = input.split(/\r?\n/);
  const blocks: string[] = [];
  let current: string[] = [];

  const pushCurrent = () => {
    if (current.length > 0) {
      blocks.push(current.join('\n').trim());
      current = [];
    }
  };

  for (const line of lines) {
    const isNameLine = /^\s*\*\*[\w\s'\-:,]+\*\*\s*$/.test(line) || /^\s*\*\*/.test(line);
    if (isNameLine && current.length > 0) {
      pushCurrent();
    }
    current.push(line);
  }

  pushCurrent();

  if (blocks.length === 0 && input.trim()) {
    return [input.trim()];
  }

  return blocks;
}

function parseBlock(block: string): ParsedNPC {
  const lines = block.split(/\r?\n/);
  const trimmedLines = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  const nameLine = trimmedLines[0] ?? 'Unnamed NPC';

  const fields: Record<string, string> = {};
  const notes: string[] = [];

  for (let i = 1; i < trimmedLines.length; i++) {
    const line = trimmedLines[i];
    const fieldMatch = /^([^:]+):\s*(.+)$/.exec(line);
    if (fieldMatch) {
      const label = normalizeFieldLabel(fieldMatch[1]);
      const value = fieldMatch[2].trim();
      fields[label] = value;
    } else {
      notes.push(line);
    }
  }

  return {
    name: stripMarkdown(nameLine),
    fields,
    notes,
    original: block,
  };
}

function formatToNarrative(parsed: ParsedNPC): string {
  const buffer: string[] = [];
  const formattedName = parsed.name.startsWith('**') ? parsed.name : `**${parsed.name.replace(/\*\*/g, '')}**`;
  buffer.push(formattedName);

  const orderedFields = FIELD_ORDER.filter((field) => parsed.fields[field]);
  const unordered = Object.keys(parsed.fields)
    .filter((field) => !FIELD_ORDER.includes(field))
    .sort();

  for (const field of orderedFields) {
    buffer.push(`${field}: ${formatFieldValue(field, parsed.fields[field])}`);
  }

  for (const field of unordered) {
    buffer.push(`${field}: ${parsed.fields[field]}`);
  }

  if (parsed.notes.length > 0) {
    buffer.push(...parsed.notes);
  }

  return buffer.join('\n');
}

function buildValidation(parsed: ParsedNPC): ValidationResult {
  const warnings: ValidationWarning[] = [];
  let score = 100;

  for (const rule of VALIDATION_RULES) {
    if (!parsed.fields[rule.field]) {
      warnings.push({
        type: rule.type,
        category: rule.field,
        message: rule.message,
        suggestion: rule.suggestion,
      });
      score -= rule.weight;
    }
  }

  if (!/^\*\*.+\*\*$/.test(parsed.original.split(/\r?\n/)[0]?.trim() ?? '')) {
    warnings.push({
      type: 'warning',
      category: 'Name Formatting',
      message: 'NPC name should be bolded with **double asterisks**.',
      suggestion: 'Wrap the NPC name in **double asterisks** to match the style guide.',
    });
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    warnings,
    complianceScore: score,
  };
}

function normalizeFieldLabel(label: string): string {
  const normalized = label.trim().toLowerCase();
  const mapping: Record<string, string> = {
    'race & class': 'Race & Class',
    'race and class': 'Race & Class',
    'hit points (hp)': 'Hit Points (HP)',
    'hit points': 'Hit Points (HP)',
    'hp': 'Hit Points (HP)',
    'armor class (ac)': 'Armor Class (AC)',
    'armor class': 'Armor Class (AC)',
    'ac': 'Armor Class (AC)',
    'primary attributes': 'Primary attributes',
    'prime attributes': 'Primary attributes',
    'prime attribute': 'Primary attributes',
    'equipment': 'Equipment',
    'gear': 'Gear',
    'spells': 'Spells',
    'mount': 'Mount',
    'special abilities': 'Special Abilities',
    'vision': 'Vision',
    'background': 'Background',
    'disposition': 'Disposition',
    'alignment': 'Disposition',
  };
  return mapping[normalized] ?? capitalize(label.trim());
}

function formatFieldValue(field: string, value: string): string {
  if (field === 'Disposition') {
    return normalizeDisposition(value);
  }
  return value;
}

function normalizeDisposition(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const mapping: Record<string, string> = {
    'lawful good': 'law/good',
    'lawful neutral': 'law/neutral',
    'lawful evil': 'law/evil',
    'neutral good': 'neutral/good',
    'true neutral': 'neutral/neutral',
    'neutral': 'neutral/neutral',
    'neutral evil': 'neutral/evil',
    'chaotic good': 'chaos/good',
    'chaotic neutral': 'chaos/neutral',
    'chaotic evil': 'chaos/evil',
  };
  return mapping[trimmed] ?? value.trim();
}

function capitalize(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function stripMarkdown(value: string): string {
  return value.replace(/^\*\*/g, '').replace(/\*\*$/g, '').trim();
}

function parseCsvToSet(csv: string): Set<string> {
  const set = new Set<string>();
  csv
    .split(/\r?\n/)
    .map((line) => line.split(',')[0]?.trim())
    .filter((line): line is string => Boolean(line))
    .forEach((entry) => set.add(entry));
  return set;
}

function toSuperscript(value: string): string {
  const superscriptMap: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return value
    .split('')
    .map((char) => superscriptMap[char] ?? char)
    .join('');
}

function isAlreadyFormatted(input: string, candidate: string): boolean {
  const regex = new RegExp(`\\*${escapeRegex(candidate)}\\*`);
  return regex.test(input);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

function dedupeFixes(fixes: CorrectionFix[]): CorrectionFix[] {
  const seen = new Map<string, CorrectionFix>();
  for (const fix of fixes) {
    const key = `${fix.originalText}__${fix.correctedText}`;
    if (!seen.has(key)) {
      seen.set(key, fix);
    }
  }
  return Array.from(seen.values());
}
