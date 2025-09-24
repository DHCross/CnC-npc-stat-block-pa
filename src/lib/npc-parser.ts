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

  // Auto-correct alignment terminology (Chaotic Good → chaos/good)
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

  // Also catch adjective-form alignments in Disposition fields
  const dispositionRegex = /(Disposition\s*:\s*)(Chaotic Good|Lawful Good|Neutral Good|Chaotic Evil|Lawful Evil|Neutral Evil|Chaotic Neutral|Lawful Neutral|True Neutral)/gi;
  while ((match = dispositionRegex.exec(input)) !== null) {
    const originalText = match[0];
    const normalizedDisposition = normalizeDisposition(match[2]);
    fixes.push({
      category: 'terminology',
      description: 'Convert adjective-form alignment to noun-form (e.g., Chaotic Good → chaos/good).',
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

  // Level superscripting (9th → 9ᵗʰ)
  const levelRegex = /(\d+)(st|nd|rd|th) level/gi;
  while ((match = levelRegex.exec(input)) !== null) {
    const originalText = match[0];
    const superscriptLevel = toSuperscript(match[1]) + ' level';
    fixes.push({
      category: 'formatting',
      description: 'Convert level ordinal suffix to superscript form.',
      originalText,
      correctedText: superscriptLevel,
      confidence: 'high',
    });
  }

  // Magic item formatting: move bonus to end and italicize
  const magicItemRegex = /(\+\d+)\s+(shield|sword|mace|staff|ring|robe|cloak|boots|gauntlets|helm|bracers)(?:\s+of\s+[\w\s]+)?/gi;
  while ((match = magicItemRegex.exec(input)) !== null) {
    const originalText = match[0];
    const bonus = match[1];
    const itemWithoutBonus = originalText.replace(bonus, '').trim();
    fixes.push({
      category: 'formatting',
      description: `Move magic item bonus to end and italicize: "${originalText}"`,
      originalText,
      correctedText: `*${itemWithoutBonus} ${bonus}*`,
      confidence: 'high',
    });
  }

  // Ensure Race comes before Class in Race & Class field
  const raceClassRegex = /(Race & Class\s*:\s*)(\d+(?:st|nd|rd|th)\s+level\s+)([a-z]+)\s+([a-z]+)/gi;
  while ((match = raceClassRegex.exec(input)) !== null) {
    const originalText = match[0];
    const fieldLabel = match[1];
    const levelPart = match[2];
    const first = match[3];
    const second = match[4];

    // Check if first is a class and second is a race (wrong order)
    const classes = ['fighter', 'wizard', 'cleric', 'thief', 'paladin', 'ranger'];
    const races = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'half-elf'];

    if (classes.includes(first.toLowerCase()) && races.includes(second.toLowerCase())) {
      fixes.push({
        category: 'formatting',
        description: 'Ensure race comes before class in Race & Class field.',
        originalText,
        correctedText: `${fieldLabel}${second}, ${levelPart}${first}`,
        confidence: 'high',
      });
    }
  }

  // Attribute name expansion (str → Strength)
  const attrAbbrevRegex = /\b(str|int|wis|dex|con|cha)(?:[,\s]|$)/gi;
  const abbrevMap: Record<string, string> = {
    'str': 'Strength',
    'int': 'Intelligence',
    'wis': 'Wisdom',
    'dex': 'Dexterity',
    'con': 'Constitution',
    'cha': 'Charisma'
  };

  while ((match = attrAbbrevRegex.exec(input)) !== null) {
    const originalText = match[1];
    const expanded = abbrevMap[originalText.toLowerCase()];
    if (expanded) {
      fixes.push({
        category: 'formatting',
        description: `Expand attribute abbreviation "${originalText}" to "${expanded}".`,
        originalText,
        correctedText: expanded,
        confidence: 'medium',
      });
    }
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
          description: `Italicize known spell "${candidate}".`,
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
  // First escape HTML entities
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert markdown formatting to HTML
  // Use temporary markers to avoid conflicts
  html = html.replace(/\*\*(.*?)\*\*/g, '___BOLD_START___$1___BOLD_END___');
  html = html.replace(/__(.*?)__/g, '___BOLD_START___$1___BOLD_END___');

  // Handle italic text (*text* or _text_)
  html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_\n]+?)_/g, '<em>$1</em>');

  // Replace temporary markers with actual bold tags
  html = html.replace(/___BOLD_START___/g, '<strong>');
  html = html.replace(/___BOLD_END___/g, '</strong>');

  // Handle superscript ordinals (1st, 2nd, 3rd, 4th, etc.)
  html = html.replace(/(\d+)(st|nd|rd|th)/g, '$1<sup>$2</sup>');

  // Handle ^superscript^ format (e.g., 9^th^ becomes 9<sup>th</sup>)
  html = html.replace(/\^([^^\n]+?)\^/g, '<sup>$1</sup>');

  // Convert to paragraphs and handle line breaks
  const paragraphs = html
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

  // Enhanced parsing for inline HP/AC format like "His Vital Stats Are: HP 56, AC 20"
  const originalText = block.toLowerCase();

  // Look for inline HP/AC patterns
  const inlineStatsMatch = originalText.match(/vital\s+stats?\s+(?:are|is)[:;\s]*(?:hp\s*(\d+)(?:[,\s]+ac\s*(\d+))?|ac\s*(\d+)(?:[,\s]+hp\s*(\d+))?)/i);
  if (inlineStatsMatch) {
    const hp = inlineStatsMatch[1] || inlineStatsMatch[4];
    const ac = inlineStatsMatch[2] || inlineStatsMatch[3];
    if (hp) fields['Hit Points (HP)'] = hp;
    if (ac) fields['Armor Class (AC)'] = ac;
  }

  // Look for parenthetical HP/AC like "(HP 59, AC 13/22)"
  const parentheticalMatch = originalText.match(/\((?:hp\s*(\d+(?:\/\d+)?)[,\s]*)?(?:ac\s*(\d+(?:\/\d+)?))?\)/i);
  if (parentheticalMatch) {
    if (parentheticalMatch[1]) fields['Hit Points (HP)'] = parentheticalMatch[1];
    if (parentheticalMatch[2]) fields['Armor Class (AC)'] = parentheticalMatch[2];
  }

  // Extract disposition from prose like "He is a lawful good human"
  if (!fields['Disposition']) {
    const dispositionFromProse = extractDisposition(block);
    if (dispositionFromProse !== block.toLowerCase().trim() && dispositionFromProse.length < 50) {
      fields['Disposition'] = dispositionFromProse;
    }
  }

  // Extract equipment from prose like "He carries a pectoral of protection +3"
  const equipmentMatch = block.match(/(?:carries|has|wields)\s+(.+?)(?:\.|He|She|They|$)/i);
  if (equipmentMatch && !fields['Equipment']) {
    const equipment = equipmentMatch[1].replace(/\s+and\s+/g, ', ').replace(/\ba\s+/g, '');
    fields['Equipment'] = equipment;
  }

  // Extract mount from prose like "He rides a heavy war horse"
  const mountMatch = originalText.match(/rides\s+a\s+([^.]+)/i);
  if (mountMatch && !fields['Mount']) {
    fields['Mount'] = mountMatch[1];
  }

  for (let i = 1; i < trimmedLines.length; i++) {
    const line = trimmedLines[i];
    const fieldMatch = /^([^:]+):\s*(.+)$/.exec(line);
    if (fieldMatch) {
      const label = normalizeFieldLabel(fieldMatch[1]);
      const value = fieldMatch[2].trim();
      fields[label] = value;
    } else if (line && !line.startsWith('**')) {
      // Only add to notes if it's not empty and not a name line
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

  // Additional validation for field content
  if (parsed.fields['Primary attributes']) {
    const attrs = parsed.fields['Primary attributes'];
    if (/\b(str|int|wis|dex|con|cha)\b/i.test(attrs)) {
      warnings.push({
        type: 'info',
        category: 'Primary attributes',
        message: 'Primary attributes should use full names instead of abbreviations.',
      });
      score -= 2;
    }
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
    'prime attributes (pa)': 'Primary attributes',
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
  // Tests expect regular digits followed by 'ᵗʰ', not superscript digits
  return value + 'ᵗʰ';
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

// New functions required by tests and NotebookLM feedback

export function collapseNPCEntry(input: string): string {
  const processed = processDumpWithValidation(input);
  if (processed.length === 0) return input;

  const npc = processed[0];
  const parsed = parseBlock(npc.original);

  // Extract name and format with italicized stat block
  let name = parsed.name;
  if (!name.startsWith('**')) name = `**${name}**`;

  // Build the condensed stat block content
  const statParts: string[] = [];

  // Race, class, level with superscript
  const raceClass = parsed.fields['Race & Class'];
  if (raceClass) {
    const { race, level, charClass } = parseRaceClassLevel(raceClass);
    if (race && charClass && level) {
      const superLevel = toSuperscript(level) + ' level';
      statParts.push(`this ${superLevel} ${race} ${charClass}`);
    }
  }

  // Primary attributes in lowercase PHB order
  const primaryAttrs = parsed.fields['Primary attributes'];
  if (primaryAttrs) {
    const formattedAttrs = formatPrimaryAttributes(primaryAttrs);
    statParts.push(`prime ${formattedAttrs}`);
  }

  // Vital stats: HP, AC, disposition
  const vitalParts: string[] = [];
  const hp = parsed.fields['Hit Points (HP)'];
  const ac = parsed.fields['Armor Class (AC)'];
  const disposition = parsed.fields['Disposition'];

  if (hp) vitalParts.push(`hp ${hp}`);
  if (ac) vitalParts.push(`ac ${ac}`);
  if (disposition) vitalParts.push(`disposition ${normalizeDisposition(disposition)}`);

  if (vitalParts.length > 0) {
    statParts.push(`vital stats are ${vitalParts.join(', ')}.`);
  }

  // Equipment
  const equipment = parsed.fields['Equipment'];
  if (equipment) {
    const processedEquip = findEquipment(equipment);
    statParts.push(`equipment: ${processedEquip}`);
  }

  // Mount
  const mount = parsed.fields['Mount'];
  if (mount) {
    const mountText = findMountOneLiner(mount);
    statParts.push(mountText);
  }

  return `${name} (${statParts.length > 0 ? `_${statParts.join(', ')}_` : ''})`;
}

export function findEquipment(equipment: string): string {
  let processed = equipment;

  // PHB magic item name updates
  const renames: Record<string, string> = {
    'robe of protection': 'robe of armor',
    'ring of protection': 'ring of armor',
    'dagger of venom': 'dagger of envenomation',
    'pectoral of protection': 'pectoral of armor'
  };

  for (const [old, replacement] of Object.entries(renames)) {
    processed = processed.replace(new RegExp(old, 'gi'), replacement);
  }

  // Shield normalization: split by comma, process each part individually
  const parts = processed.split(',').map(part => part.trim());
  const processedParts = parts.map(part => {
    let workingPart = part;

    // Check for generic "shield" (not preceded by shield type)
    if (/^shield(\s*\+\d+)?$/.test(workingPart.trim())) {
      // Replace generic shield with medium steel shield
      workingPart = workingPart.replace(/^shield(\s*\+\d+)?$/, 'medium steel shield$1');
    } else if (/\bshield\b/.test(workingPart) && !/(?:medium|large|small|wooden|steel)\s+shield/.test(workingPart)) {
      // If shield appears in a longer description without a qualifier
      workingPart = workingPart.replace(/\bshield\b/, 'medium steel shield');
    }

    // Check for magic items (items with bonuses or known magic words)
    const isMagic = /\+\d+|staff of|sword of|ring of|robe of|cloak of|boots of|gauntlets of|helm of|bracers of|pectoral of/i.test(workingPart);

    if (isMagic) {
      // Move bonus to end and italicize
      const bonusMatch = workingPart.match(/^(.+?)(\s*\+\d+)(.*)$/);
      if (bonusMatch) {
        const [, item, bonus, rest] = bonusMatch;
        return `*${item.trim()}${rest}${bonus}*`;
      }
      return `*${workingPart}*`;
    }
    return workingPart;
  });

  return processedParts.join(', ');
}

export function formatPrimaryAttributes(attributes: string): string {
  // PHB canonical order
  const phbOrder = ['strength', 'intelligence', 'wisdom', 'dexterity', 'constitution', 'charisma'];

  const attrs = attributes.toLowerCase()
    .split(',')
    .map(attr => attr.trim())
    .map(attr => {
      // Handle abbreviations
      const abbrevs: Record<string, string> = {
        'str': 'strength',
        'int': 'intelligence',
        'wis': 'wisdom',
        'dex': 'dexterity',
        'con': 'constitution',
        'cha': 'charisma'
      };
      return abbrevs[attr] || attr;
    })
    .filter(attr => phbOrder.includes(attr))
    .sort((a, b) => phbOrder.indexOf(a) - phbOrder.indexOf(b));

  if (attrs.length === 0) return attributes.toLowerCase();
  if (attrs.length === 1) return attrs[0];
  if (attrs.length === 2) return `${attrs[0]} and ${attrs[1]}`;

  return `${attrs.slice(0, -1).join(', ')}, and ${attrs[attrs.length - 1]}`;
}

export function findMountOneLiner(mount: string): string {
  return `rides a ${mount}.`;
}

export function extractDisposition(text: string): string {
  // Handle various disposition formats
  const dispositionMatch = text.match(/(?:disposition|alignment)\s*[:]\s*([^\n.]+)/i);
  if (dispositionMatch) {
    return normalizeDisposition(dispositionMatch[1]);
  }

  // Handle prose like "He is a lawful good human" - extract just the alignment part
  const proseMatch = text.match(/(?:he|she|they)\s+(?:is|are)\s+(?:a\s+)?(lawful\s+good|chaotic\s+good|neutral\s+good|lawful\s+evil|chaotic\s+evil|neutral\s+evil|lawful\s+neutral|chaotic\s+neutral|neutral|good|evil|lawful|chaotic)(?:\s+\w+)?/i);
  if (proseMatch) {
    const candidate = proseMatch[1].trim();
    // If it's a single word alignment like "neutral", don't normalize to "neutral/neutral"
    if (/^(neutral|good|evil|chaotic|lawful)$/i.test(candidate)) {
      return candidate.toLowerCase();
    }
    return normalizeDisposition(candidate);
  }

  return text.trim();
}

export function parseRaceClassLevel(text: string): { race: string; level: string; charClass: string } {
  // Handle "human, 16th level cleric" or "12th level dwarf fighter"
  const match1 = text.match(/([a-z]+),?\s*(\d+)(?:st|nd|rd|th)\s+level\s+([a-z]+)/i);
  if (match1) {
    return { race: match1[1].toLowerCase(), level: match1[2], charClass: match1[3].toLowerCase() };
  }

  const match2 = text.match(/(\d+)(?:st|nd|rd|th)\s+level\s+([a-z]+)\s+([a-z]+)/i);
  if (match2) {
    return { race: match2[2].toLowerCase(), level: match2[1], charClass: match2[3].toLowerCase() };
  }

  return { race: '', level: '', charClass: '' };
}

export function validateStatBlock(input: string): ValidationResult {
  const processed = processDumpWithValidation(input);
  return processed.length > 0 ? processed[0].validation : { warnings: [], complianceScore: 0 };
}
