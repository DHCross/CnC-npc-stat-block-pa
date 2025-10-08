import type { ParsedNPC, ValidationResult, ValidationWarning, WarningType } from './stat-block-types';
import {
  buildSubjectDescriptor,
  normalizeDisposition,
  toPossessiveSubject,
  toSuperscript,
} from './stat-block-helpers';

export type { ParsedNPC, ValidationResult, ValidationWarning, WarningType } from './stat-block-types';

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

import { MAGIC_ITEM_MAPPINGS, addMagicItemMechanics } from './name-mappings';
import type { ParentheticalData } from './enhanced-parser';
import {
  splitTitleAndBody,
  extractParentheticalData,
  isUnitHeading,
  canonicalizeShields,
  repositionMagicItemBonuses,
  deduplicateEquipment,
  normalizeEquipmentVerbs,
  extractMountFromParenthetical,
  buildCanonicalParenthetical,
  formatMountBlock as formatEnhancedMountBlock,
  normalizeAttributes,
  MountBlock,
  canonicalizeMountBlock,
  lookupCanonicalMount,
  buildMountBridgeSentence,
  findEquipment,
} from './enhanced-parser';
import {
  isBasicMonster,
  formatToMonsterNarrative,
  buildMonsterValidation
} from './monster-formatter';
import { parseMonsterBlock } from './monster-parser';

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

const escapeForPattern = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const KNOWN_RACES = [
  'human',
  'elf',
  'dwarf',
  'halfling',
  'gnome',
  'half-elf',
  'half-orc',
  'orc',
  'hobgoblin',
  'goblin',
  'kobold',
  'gnoll',
  'bugbear',
  'lizardman',
  'ogre',
  'troll',
  'dragonborn',
  'tiefling',
  'aasimar',
  'drow',
  'duergar',
  'svirfneblin',
  'githyanki',
  'githzerai',
];

const KNOWN_CLASSES = [
  'fighter',
  'cleric',
  'wizard',
  'magic-user',
  'paladin',
  'ranger',
  'thief',
  'rogue',
  'assassin',
  'illusionist',
  'druid',
  'monk',
  'bard',
  'cavalier',
  'barbarian',
  'knight',
  'sorcerer',
  'warlock',
  'witch',
  'shaman',
  'priest',
  'priestess',
  'acolyte',
  'mage',
];

const RACE_PATTERN = new RegExp(`\\b(${KNOWN_RACES.map(escapeForPattern).join('|')})\\b`, 'i');
const CLASS_PATTERN = new RegExp(`\\b(${KNOWN_CLASSES.map(escapeForPattern).join('|')})s?\\b`, 'i');
const LEVEL_PATTERN = /\b\d+(?:st|nd|rd|th)?\s+level\b/i;
const GENDER_PATTERN = /\b(male|female)\b/i;

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

export function processDumpWithValidation(
  input: string,
  useEnhancedParser: boolean = false,
  formatterMode?: 'enhanced' | 'npc' | 'monster'
): ProcessedNPC[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const blocks = splitIntoBlocks(trimmed);
  return blocks.map((block) => {
    const npcParsed = useEnhancedParser ? parseBlockEnhanced(block) : parseBlock(block);
    const monsterParsed = formatterMode === 'npc' ? undefined : parseMonsterBlock(block);

    let finalParsed: ParsedNPC = npcParsed;
    let converted: string;
    let validation: ValidationResult;

    if (formatterMode === 'monster') {
      finalParsed = monsterParsed ?? parseMonsterBlock(block);
      converted = formatToMonsterNarrative(finalParsed);
      validation = buildMonsterValidation(finalParsed);
    } else if (formatterMode === 'npc') {
      converted = useEnhancedParser ? formatToEnhancedNarrative(npcParsed, block) : formatToNarrative(npcParsed);
      validation = buildValidation(npcParsed);
    } else {
      const candidateMonster = monsterParsed ?? parseMonsterBlock(block);
      if (isBasicMonster(candidateMonster)) {
        finalParsed = candidateMonster;
        converted = formatToMonsterNarrative(finalParsed);
        validation = buildMonsterValidation(finalParsed);
      } else {
        converted = useEnhancedParser ? formatToEnhancedNarrative(npcParsed, block) : formatToNarrative(npcParsed);
        validation = buildValidation(npcParsed);
      }
    }

    return {
      name: finalParsed.name,
      original: finalParsed.original,
      converted,
      validation,
    } satisfies ProcessedNPC;
  });
}

export function processDumpEnhanced(input: string): ProcessedNPC[] {
  return processDumpWithValidation(input, true);
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
    // Check for already formatted names (**Name**) or potential NPC names starting with titles
    const isNameLine =
      /^\s*\*\*[\w\s'\-:,]+\*\*\s*$/.test(line) ||
      /^\s*\*\*/.test(line) ||
      /^\s*(Sir|Lady|Lord|Dame|Master|Mistress|Captain|Commander|General|Admiral|Duke|Duchess|Count|Countess|Baron|Baroness|Knight|Ser)\s+[\w\s'\-:,]+\.?\s*$/.test(line);

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

function parseBlockEnhanced(block: string): ParsedNPC {
  // Use enhanced parsing approach
  const { title, parentheticals } = splitTitleAndBody(block);
  const isUnit = isUnitHeading(title);

  const fields: Record<string, string> = {};
  let mountBlock: string | undefined;

  // Process first parenthetical (main NPC data)
    if (parentheticals.length > 0) {

    // Extract mount if present and clean parenthetical
    const { cleanedParenthetical, mountBlock: extractedMount } = extractMountFromParenthetical(parentheticals[0]);

    if (extractedMount) {
      mountBlock = formatEnhancedMountBlock(extractedMount);
    }

    // Re-extract data from cleaned parenthetical
      const cleanedData = extractParentheticalData(cleanedParenthetical, isUnit, title);

    // Map extracted data to fields
    if (cleanedData.hp) fields['Hit Points (HP)'] = cleanedData.hp;
    if (cleanedData.ac) fields['Armor Class (AC)'] = cleanedData.ac;
    if (cleanedData.disposition) fields['Disposition'] = cleanedData.disposition;
    if (cleanedData.raceClass) fields['Race & Class'] = cleanedData.raceClass;

    if (cleanedData.attributes) {
      const normalized = normalizeAttributes(cleanedData.attributes, {
        isUnit,
        raceClassText: cleanedData.raceClass,
        levelText: cleanedData.level
      });
      if (normalized.type !== 'none' && normalized.value) {
        fields['Primary attributes'] = normalized.value;
      }
    }

    if (cleanedData.equipment) {
      let equipment = cleanedData.equipment;
      equipment = canonicalizeShields(equipment);
      equipment = repositionMagicItemBonuses(equipment);
      equipment = normalizeEquipmentVerbs(equipment);
      equipment = deduplicateEquipment(equipment);
      fields['Equipment'] = equipment;
    }

    if (cleanedData.coins) {
      // Add coins to equipment or create separate field
      if (fields['Equipment']) {
        fields['Equipment'] += `, ${cleanedData.coins}`;
      } else {
        fields['Equipment'] = cleanedData.coins;
      }
    }
  }

  // Add mount to fields if extracted
  if (mountBlock) {
    fields['Mount'] = mountBlock;
  }

  return {
    name: sanitizeName(title),
    fields,
    notes: [], // Enhanced parser focuses on parenthetical data
    original: block
  };
}

function parseBlock(block: string): ParsedNPC {
  // Pre-process block to handle single-line formats
  let processedBlock = block;
  if (block.split('\n').length < 3) {
    const fieldKeywords = [
      'Disposition',
      'Race & Class',
      'Hit Points \\(HP\\)',
      'Armor Class \\(AC\\)',
      'Primary attributes',
      'Equipment',
      'Spells',
      'Mount',
    ];
    const regex = new RegExp(`\\b(${fieldKeywords.join('|')}):`, 'g');
    processedBlock = processedBlock.replace(regex, '\n$1:');
  }

  const lines = processedBlock.split(/\r?\n/);
  const trimmedLines = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  let nameLine = trimmedLines[0] ?? 'Unnamed NPC';

  // Extract only the name part before parenthetical data for unit rosters
  const nameMatch = nameLine.match(/^([^(]+?)(\s*\([^)]+\).*)?$/);
  if (nameMatch) {
    nameLine = nameMatch[1].trim();
  }

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

  // Extract equipment from unit roster format like "EQ scale mail, shield, mace and dagger"
  if (!fields['Equipment']) {
    const unitEQMatch = block.match(/\bEQ\s+(.+?)(?:\)|$)/i);
    if (unitEQMatch) {
      const equipment = unitEQMatch[1].trim().replace(/\s+and\s+/g, ', ');
      fields['Equipment'] = equipment;
    }
  }

  // Extract mount from prose like "He rides a heavy war horse"
  const mountMatch = originalText.match(/rides\s+a\s+([^.]+)/i);
  if (mountMatch && !fields['Mount']) {
    fields['Mount'] = mountMatch[1];
  }

  // Extract race & class from parenthetical like "(He is a chaotic good, human, 8th level cleric..."
  if (!fields['Race & Class']) {
    const raceClassMatch = block.match(/he\s+is\s+a\s+(?:(?:neutral|lawful|chaotic)\s+(?:good|evil|neutral)|neutral|lawful|chaotic|good|evil),?\s*([^,]+),\s*(\d+(?:st|nd|rd|th)?)\s*level\s+([^.]+)/i);
    if (raceClassMatch) {
      const race = raceClassMatch[1].trim();
      const level = raceClassMatch[2];
      const charClass = raceClassMatch[3].trim();
      fields['Race & Class'] = `${race}, ${level} level ${charClass}`;
    }
  }

  // Extract race & class from unit roster format like "(human, fighter, 2nd level, HP 14, AC 15...)"
  if (!fields['Race & Class']) {
    const unitRosterMatch = block.match(/\(([^,]+),\s*([^,]+),\s*(\d+(?:st|nd|rd|th|ᵗʰ|ˢᵗ|ⁿᵈ|ʳᵈ)?)\s*level/i);
    if (unitRosterMatch) {
      const race = unitRosterMatch[1].trim();
      const charClass = unitRosterMatch[2].trim();
      const level = unitRosterMatch[3];
      fields['Race & Class'] = `${race}, ${level} level ${charClass}`;
    }
  }

  // Extract race & class from unit roster format like "(2nd level fighters, ...)" - assume human
  if (!fields['Race & Class']) {
    const simpleUnitMatch = block.match(/\((\d+(?:st|nd|rd|th)?)\s*level\s+([^,]+)/i);
    if (simpleUnitMatch) {
      const level = simpleUnitMatch[1];
      const charClass = simpleUnitMatch[2].trim();
      fields['Race & Class'] = `human, ${level} level ${charClass}`;
    }
  }

  // Extract primary attributes from parenthetical like "His prime attributes are: str, con, dex"
  if (!fields['Primary attributes']) {
    const primeAttrsMatch = block.match(/(?:his|her|their)\s+prime\s+attributes?\s+(?:are|is)[:;\s]*([^.]+)/i);
    if (primeAttrsMatch) {
      const attrs = primeAttrsMatch[1].trim().replace(/[,\s]+/g, ', ');
      fields['Primary attributes'] = attrs;
    }
  }

  // Extract primary attributes from unit roster format like "PA physical" or "PA str, con, dex"
  if (!fields['Primary attributes']) {
    const unitPAMatch = block.match(/\bPA\s+([^,]+?)(?:\s*,\s*(?:EQ|HD|HP|AC|\d|[A-Z]{2})|\.|\))/i);
    if (unitPAMatch) {
      const attrs = unitPAMatch[1].trim();
      // Expand "physical" to the three physical attributes
      if (attrs.toLowerCase() === 'physical') {
        fields['Primary attributes'] = 'strength, dexterity, constitution';
      } else {
        fields['Primary attributes'] = attrs.replace(/[,\s]+/g, ', ');
      }
    }
  }

  // Extract HP from unit roster format like "HP 14"
  if (!fields['Hit Points (HP)']) {
    const unitHPMatch = block.match(/\bHP\s+(\d+)/i);
    if (unitHPMatch) {
      fields['Hit Points (HP)'] = unitHPMatch[1];
    }
  }

  // Extract AC from unit roster format like "AC 16" or inline format "MOVE: ... AC: 13"
  if (!fields['Armor Class (AC)']) {
    const unitACMatch = block.match(/\bAC\s*:?\s*(\d+)/i);
    if (unitACMatch) {
      fields['Armor Class (AC)'] = unitACMatch[1];
    }
  }

  // Extract equipment from unit roster format like "EQ banded mail, shield, longsword"
  if (!fields['Equipment']) {
    const unitEQMatch = block.match(/\bEQ\s+([^.]+?)(?:\.\s*[a-z]+\s+[a-z]+\s*:|\.|\))/i);
    if (unitEQMatch) {
      fields['Equipment'] = unitEQMatch[1].trim();
    }
  }

  // Extract secondary skills from parenthetical like "His secondary skill is: leadership"
  const secondarySkillMatch = block.match(/(?:his|her|their)\s+secondary\s+skills?\s+(?:are|is)[:;\s]*([^.]+)/i);
  if (secondarySkillMatch && !fields['Secondary Skills']) {
    fields['Secondary Skills'] = secondarySkillMatch[1].trim();
  }

  // Extract mount data from unit roster format like "light war horse: HD 3d10, HP 17, AC 12 with two hoof attacks..."
  if (!fields['Mount']) {
    const mountMatch = block.match(/(light war horse|heavy war horse|war horse|warhorse|giant goat|[a-z\s]*horse|[a-z\s]*mount):\s*([^.]+(?:\.[^.]*attack[^.]*)?)/i);
    if (mountMatch) {
      const mountName = mountMatch[1].trim();
      const mountData = mountMatch[2].trim();

      // Create a canonical mount entry following the rules
      let mountBlock = `**${mountName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} (mount)** `;

      // Extract mount stats
      const hdMatch = mountData.match(/HD\s*(\d+d\d+)/i);
      const hpMatch = mountData.match(/HP\s*(\d+)/i);
      const acMatch = mountData.match(/AC\s*(\d+)/i);
      const attackMatch = mountData.match(/(with\s+[^.]+attack[^.]*)/i);

      const mountStats: string[] = [];
      if (hdMatch) mountStats.push(`HD ${hdMatch[1]}`);
      if (hpMatch) mountStats.push(`HP ${hpMatch[1]}`);
      if (acMatch) mountStats.push(`AC ${acMatch[1]}`);
      mountStats.push('disposition neutral');

      let attackText = '';
      if (attackMatch) {
        attackText = `. It attacks ${attackMatch[1].replace(/^with\s+/i, 'with ')}`;
      }

      const mountSubject = buildSubjectDescriptor({
        isPlural: false,
        fallback: 'creature',
      });
      const mountPossessive = toPossessiveSubject(mountSubject, false);
      mountBlock += `*(${mountPossessive} vital stats are ${mountStats.join(', ')}${attackText})*`;
      fields['Mount'] = formatMountBlockFromString(mountBlock);
    }
  }

  // Extract spell slots from parenthetical like "He can cast the following number of spells: 0-5, 1st-5, 2nd-4, 3rd-2, 4th-1"
  if (!fields['Spells']) {
    const spellSlotsMatch = block.match(/he\s+can\s+cast\s+the\s+following\s+number\s+of\s+spells:\s*([^.]+)/i);
    if (spellSlotsMatch) {
      let slots = spellSlotsMatch[1].trim();
      // Replace cantrips first
      slots = slots.replace(/0-(\d+)/g, 'cantrips: $1');
      // Replace ordinal spell levels with proper format
      slots = slots.replace(/(\d+)(st|nd|rd|th)-(\d+)/gi, '$1$2 level: $3');
      fields['Spells'] = slots;
    }
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

  // Post-process monster-specific fields
  if (fields['ALIGNMENT'] && !fields['Disposition']) {
    fields['Disposition'] = normalizeDisposition(fields['ALIGNMENT']);
  }

  // Convert HD to Level format for monsters
  if (fields['HD'] && !fields['Hit Points (HP)']) {
    const hdMatch = fields['HD'].match(/(\d+)\s*\(([^)]+)\)/);
    if (hdMatch) {
      fields['Level'] = `${hdMatch[1]}(${hdMatch[2]})`;
    }
  }

  return {
    name: sanitizeName(nameLine),
    fields,
    notes,
    original: block,
  };
}

// isBasicMonster and formatToMonsterNarrative moved to monster-formatter.ts

  function resolveMountPronoun(
    data: ParentheticalData | undefined,
    canonicalParenthetical: string,
    isUnit: boolean,
  ): 'He' | 'She' | 'They' {
    const explicitPronounMatch = canonicalParenthetical.match(/\b(He|She|They)\s+(?:wear|carry|carries|can|wields|rides|ride)\b/);
    if (explicitPronounMatch) {
      return explicitPronounMatch[1] as 'He' | 'She' | 'They';
    }

    const originalPronoun = data?.originalPronoun?.toLowerCase();
    if (originalPronoun) {
      if (['she', 'her'].includes(originalPronoun)) return 'She';
      if (['they', 'their', 'these', 'those'].includes(originalPronoun)) return 'They';
      if (['he', 'his', 'this'].includes(originalPronoun)) return 'He';
    }

    return isUnit ? 'They' : 'He';
  }

  function formatToEnhancedNarrative(parsed: ParsedNPC, originalBlock: string): string {
    // If the enhanced parser returns no fields, it's likely because the stat block
    // is not in the expected parenthetical format. In this case, we fall back to the
    // standard parser and formatter to handle line-by-line formats gracefully.
    if (Object.keys(parsed.fields).length === 0 && !isUnitHeading(parsed.name)) {
      const fallbackParsed = parseBlock(originalBlock);
      return formatToNarrative(fallbackParsed);
    }

    // Use enhanced parser formatting
    const { title, parentheticals } = splitTitleAndBody(originalBlock);
    const isUnit = isUnitHeading(title);

    let name = parsed.name.trim();
    if (!name.startsWith('**')) {
      name = `**${name.replace(/\*\*/g, '').trim()}**`;
    }

    let result = name;
    let mountBlock: MountBlock | undefined;
    let parentheticalData: ParentheticalData | undefined;
    let canonicalParenthetical = '';

    if (parentheticals.length > 0) {
      // Extract mount first (Jeremy's mandate: separate mounts into dedicated blocks)
      const { cleanedParenthetical, mountBlock: extractedMount } = extractMountFromParenthetical(parentheticals[0]);
      mountBlock = extractedMount ? canonicalizeMountBlock(extractedMount) : undefined;

      // Process the cleaned parenthetical (mount data removed)
      parentheticalData = extractParentheticalData(cleanedParenthetical, isUnit, title);
      canonicalParenthetical = buildCanonicalParenthetical(parentheticalData, isUnit, false, true, title);

      // Only add parenthetical if it contains meaningful content (not just a period or empty)
      if (canonicalParenthetical && canonicalParenthetical.trim().length > 1 && canonicalParenthetical.trim() !== '.') {
        result = `${name} *(${canonicalParenthetical})*`;
      }
    }

    // Add separated mount block per Jeremy's editorial mandate
    if (mountBlock) {
      const pronoun = resolveMountPronoun(parentheticalData, canonicalParenthetical, isUnit);
      const mountSentence = buildMountBridgeSentence(mountBlock.name, pronoun);
      if (!result.includes(mountSentence)) {
        result += `\n\n${mountSentence}`;
      }

      const formattedMount = formatEnhancedMountBlock(mountBlock);
      if (!result.includes(formattedMount)) {
        result += `\n\n${formattedMount}`;
      }
    }

    return result;
  }

function formatToNarrative(parsed: ParsedNPC): string {
  // Check if this is a Basic Monster
  if (isBasicMonster(parsed)) {
    return formatToMonsterNarrative(parsed);
  }

  // Extract name and format with proper bolding
  let name = parsed.name;
  if (!name.startsWith('**')) name = `**${name.replace(/\*\*/g, '')}**`;

  // Check if this is a unit with quantity (e.g., "Sergeants x6")
  const unitMatch = name.match(/\*\*([^*]+?)\s*x(\d+)\*\*/);
  const isPlural = unitMatch !== null;

  // Add default disposition for military units if missing
  if (!parsed.fields['Disposition'] && isPlural) {
    parsed.fields['Disposition'] = 'neutral/neutral';
  }

  // Build the condensed stat block content
  const sentences: string[] = [];

  const raceClassRaw = parsed.fields['Race & Class'];
  const { race, level, charClass } = raceClassRaw
    ? parseRaceClassLevel(raceClassRaw)
    : { race: '', level: '', charClass: '' };

  // Primary attributes in lowercase PHB order
  const primaryAttrs = parsed.fields['Primary attributes'];
  const possessivePronoun = 'Their';
  const subjectPronoun = 'They';

  if (primaryAttrs) {
    const formattedAttrs = formatPrimaryAttributes(primaryAttrs);
    sentences.push(`${possessivePronoun} primary attributes are ${formattedAttrs}.`);
  }

  // Secondary skills
  const secondarySkills = parsed.fields['Secondary Skills'];
  if (secondarySkills) {
    const skillPlural = isPlural ? 'skills are' : 'skill is';
    sentences.push(`${possessivePronoun} secondary ${skillPlural} ${secondarySkills}.`);
  }

  // Vital stats: HP, AC, disposition
  const hp = parsed.fields['Hit Points (HP)'];
  const ac = parsed.fields['Armor Class (AC)'];
  const disposition = parsed.fields['Disposition'];

  const leadingFragments: string[] = [];
  if (!charClass) {
    const explicitLevel = parsed.fields['Level']?.trim();
    const hdStat = parsed.fields['HD']?.trim();
    const levelValue = explicitLevel || hdStat;
    if (levelValue) {
      const levelFragment = formatLevelFragment(levelValue);
      if (levelFragment) {
        leadingFragments.push(levelFragment);
      }
    }
  }

  const vitalStatement = buildVitalStatsSentence({
    isPlural,
    race,
    level,
    charClass,
    fallbackDescriptor: raceClassRaw,
    hp,
    ac,
    disposition: disposition ? normalizeDisposition(disposition) : undefined,
    leadingFragments,
  });

  if (vitalStatement) {
    sentences.unshift(vitalStatement);
  }

  // Equipment
  const equipment = parsed.fields['Equipment'];
  if (equipment) {
    const processedEquip = findEquipment(equipment);
    const carryVerb = 'carry';
    sentences.push(`${subjectPronoun} ${carryVerb} ${processedEquip}.`);
  }

  // Spells
  const spells = parsed.fields['Spells'];
  if (spells) {
    sentences.push(`${subjectPronoun} can cast ${spells}.`);
  }

  // Mount - render as separate block following canonical rules
  const mount = parsed.fields['Mount'];
  let mountBlock = '';
  if (mount) {
    // Mount is already formatted as a complete canonical block from extraction
    mountBlock = `\n\n${formatMountBlockFromString(mount)}`;
  }

  const parenthetical = sentences.length > 0 ? ` *(${sentences.join(' ')})*` : '';
  return `${name}${parenthetical}${mountBlock}`;
}

// MONSTER_VALIDATION_RULES moved to monster-formatter.ts

function buildValidation(parsed: ParsedNPC): ValidationResult {
  const isMonster = isBasicMonster(parsed);

  // Delegate monster validation to monster-formatter module
  if (isMonster) {
    return buildMonsterValidation(parsed);
  }

  // NPC validation logic
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

  // Check name formatting for NPCs
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
    'hd': 'HD',
    'level': 'Level',
    'move': 'Move',
    'attacks': 'Attacks',
    'special': 'Special Abilities',
    'saves': 'Saves',
    'int': 'Intelligence',
    'intelligence': 'Intelligence',
    'type': 'Type',
    'treasure': 'Treasure',
    'xp': 'XP',
  };
  return mapping[normalized] ?? capitalize(label.trim());
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

function containsRace(segment: string): boolean {
  return RACE_PATTERN.test(segment);
}

function containsClass(segment: string): boolean {
  return CLASS_PATTERN.test(segment);
}

function containsLevel(segment: string): boolean {
  return LEVEL_PATTERN.test(segment);
}

function containsGender(segment: string): boolean {
  return GENDER_PATTERN.test(segment);
}

function sanitizeName(rawName: string): string {
  const baseName = stripMarkdown(rawName);
  let name = baseName.replace(/\s+/g, ' ').trim();

  const isDescriptorSegment = (segment: string, allowRaceOnly: boolean): boolean => {
    const trimmed = segment.trim();
    if (!trimmed) {
      return false;
    }

    const hasRace = containsRace(trimmed);
    const hasClass = containsClass(trimmed);
    const hasLevel = containsLevel(trimmed);
    const hasGender = containsGender(trimmed);

    if (hasLevel && (hasClass || hasRace || hasGender)) {
      return true;
    }

    if (hasClass && (hasRace || hasLevel || hasGender)) {
      return true;
    }

    if (hasRace && (allowRaceOnly || hasClass || hasLevel || hasGender)) {
      return true;
    }

    return false;
  };

  const removeDescriptorAfterSeparator = (): boolean => {
    const match = name.match(/^(.*?)([,;:–—-]\s*)([^,;:–—-]+)$/);
    if (!match) {
      return false;
    }

    const prefix = match[1];
    const candidate = match[3].trim();
    if (isDescriptorSegment(candidate, true)) {
      name = prefix.trim();
      return true;
    }

    return false;
  };

  const removeTrailingDescriptorWords = (): boolean => {
    const words = name.split(/\s+/);
    if (words.length < 3) {
      return false;
    }

    const segmentLengths = [4, 3, 2];
    for (const length of segmentLengths) {
      if (words.length <= length) {
        continue;
      }

      const candidateWords = words.slice(-length).join(' ');
      if (isDescriptorSegment(candidateWords, false)) {
        name = words.slice(0, -length).join(' ').trim();
        return true;
      }
    }

    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    if (removeDescriptorAfterSeparator()) {
      changed = true;
      continue;
    }

    if (removeTrailingDescriptorWords()) {
      changed = true;
    }
  }

  name = name.trim();
  return name.length > 0 ? name : baseName.trim();
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

interface VitalStatsOptions {
  isPlural: boolean;
  race?: string;
  level?: string;
  charClass?: string;
  fallbackDescriptor?: string | null;
  hp?: string | null;
  ac?: string | null;
  disposition?: string | null;
  leadingFragments?: string[];
}

function formatLevelFragment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^level\b/i.test(trimmed)) {
    return trimmed.replace(/^level\b/i, 'Level').replace(/\s+/g, ' ').trim();
  }

  return `Level ${trimmed}`;
}

function buildVitalStatsSentence(options: VitalStatsOptions): string | null {
  const hp = options.hp?.trim();
  const ac = options.ac?.trim();
  const disposition = options.disposition?.trim();

  const fragments = (options.leadingFragments ?? [])
    .map(fragment => fragment.trim())
    .filter(Boolean);
  if (hp) fragments.push(`HP ${hp}`);
  if (ac) fragments.push(`AC ${ac}`);
  if (disposition) fragments.push(`disposition ${disposition}`);

  if (fragments.length === 0) {
    return null;
  }

  const subject = buildSubjectDescriptor({
    isPlural: options.isPlural,
    race: options.race,
    level: options.level,
    charClass: options.charClass,
    fallback: options.fallbackDescriptor ?? undefined,
  });
  const possessiveSubject = toPossessiveSubject(subject, options.isPlural);

  return `${possessiveSubject} vital stats are ${fragments.join(', ')}.`;
}

function formatMountBlockFromString(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const pronounNormalized = trimmed
    .replace(/this creature['’]s/gi, 'This creature’s')
    .replace(/this character['’]s/gi, 'This character’s');
  if (/^\*\*.+\*\*/.test(pronounNormalized)) {
    return pronounNormalized;
  }
  if (/This creature['’]s vital stats are/i.test(pronounNormalized)) {
    return pronounNormalized;
  }

  const canonicalMount = lookupCanonicalMount(pronounNormalized);
  if (canonicalMount) {
    return formatEnhancedMountBlock(canonicalMount);
  }

  const nameWithoutTrailingPeriod = pronounNormalized.replace(/[.\s]+$/, '');
  const mountName = capitalize(nameWithoutTrailingPeriod);
  const subject = buildSubjectDescriptor({ isPlural: false, fallback: 'creature' });
  const possessiveSubject = toPossessiveSubject(subject, false);

  return `**${mountName} (mount)** *(${possessiveSubject} vital stats are unavailable.)*`;
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
  const basePass = processDumpWithValidation(input, false, 'npc');
  if (basePass.length === 0) {
    return input.trim();
  }

  let intermediate = basePass[0].converted;
  const mountBlockMatch = intermediate.match(/\r?\n\r?\n(\*\*[^*]+ \(mount\)\*\* \*\([^]*?\)\*)/);
  const mountBlock = mountBlockMatch ? mountBlockMatch[1].trim() : '';

  // Reorder race/class phrasing so that level precedes race ("This 5ᵗʰ level human fighter")
  intermediate = intermediate.replace(
    /(This|These)\s+([a-z-]+)\s+(\d+[^\s]*)\s+level\s+([a-z/-]+)([’']s)/gi,
    (_, pronoun, race, level, charClass, possessive) =>
      `${pronoun} ${level} level ${race} ${charClass}${possessive}`,
  );

  // Encourage enhanced parser spell extraction by standardizing the lead-in phrase
  intermediate = intermediate.replace(
    /(They|He|She) can cast ([^.]+)\./i,
    (_, pronoun, list) => `${pronoun} can cast the following number of spells per day: ${list}.`,
  );

  const enhancedPass = processDumpWithValidation(intermediate, true, 'npc');
  if (enhancedPass.length === 0) {
    return intermediate.trim();
  }

  let final = enhancedPass[0].converted.trim();
  const nameMatch = final.match(/^(\*\*[^*]+?\*\*)(.*)$/s);
  if (nameMatch) {
    const [, name, rest] = nameMatch;
    const normalizedRest = rest.replace(/^\s*\*+/, ' *');
    const normalizedName = name.replace(/\s+\*\*$/, '**');
    final = `${normalizedName}${normalizedRest}`;
  }
  final = final.replace(/ \*\s*\*\(/g, ' *(');
  final = final.replace(/\*\(([^)]*)\)\*/g, (_, inner) => `*(${inner.replace(/\*\*/g, '*')})*`);


  if (mountBlock) {
    const mountNameMatch = mountBlock.match(/\*\*([^*]+?) \(mount\)\*\*/i);
    const mountName = mountNameMatch ? mountNameMatch[1] : '';
    const canonicalMount = mountName ? lookupCanonicalMount(mountName) : undefined;
    const resolvedMountName = canonicalMount ? canonicalMount.name : mountName;
    const canonicalMountBlock = canonicalMount
      ? formatEnhancedMountBlock(canonicalMount)
      : mountBlock;

    const pronounMatch = final.match(/\*\([^)]*\.\s+(He|She|They)\b/);
    const pronoun = (pronounMatch ? pronounMatch[1] : 'He') as 'He' | 'She' | 'They';

    if (resolvedMountName) {
      const mountSentence = buildMountBridgeSentence(resolvedMountName, pronoun);
      if (!final.includes(mountSentence)) {
        final = `${final}\n\n${mountSentence}`;
      }
    }

    if (!final.includes(canonicalMountBlock)) {
      final = `${final}\n\n${canonicalMountBlock}`;
    }
  }

  return final;
}


export function formatPrimaryAttributes(attributes: string): string {
  // PHB canonical order: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma
  const phbOrder = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

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
  const normalized = mount.trim();
  const article = /^[aeiou]/i.test(normalized) ? 'an' : 'a';
  const mountName = normalized.replace(/war\s+horse/gi, 'warhorse');
  return `rides ${article} ${mountName} in battle.`;
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
