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

import { MAGIC_ITEM_MAPPINGS, SPELL_NAME_MAPPINGS, applyNameMappings } from './name-mappings';

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
  'Secondary Skills',
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

function parseBlock(block: string): ParsedNPC {
  const lines = block.split(/\r?\n/);
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

      const mountStats = [];
      if (hdMatch) mountStats.push(`HD ${hdMatch[1]}`);
      if (hpMatch) mountStats.push(`HP ${hpMatch[1]}`);
      if (acMatch) mountStats.push(`AC ${acMatch[1]}`);
      mountStats.push('disposition neutral');

      let attackText = '';
      if (attackMatch) {
        attackText = `. It attacks ${attackMatch[1].replace(/^with\s+/i, 'with ')}`;
      }

      mountBlock += `*(this creature's vital stats are ${mountStats.join(', ')}${attackText})*`;
      fields['Mount'] = mountBlock;
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
    name: stripMarkdown(nameLine),
    fields,
    notes,
    original: block,
  };
}

function isBasicMonster(parsed: ParsedNPC): boolean {
  // Check for monster-specific fields that indicate this is a Basic Monster, not a Classed NPC
  return !!(parsed.fields['HD'] ||
           parsed.fields['Level'] ||
           parsed.fields['TYPE'] ||
           parsed.fields['Type'] ||
           parsed.fields['TREASURE'] ||
           parsed.fields['Treasure'] ||
           parsed.fields['XP'] ||
           parsed.fields['SAVES'] ||
           parsed.fields['Saves'] ||
           parsed.fields['ALIGNMENT']);
}

function formatToMonsterNarrative(parsed: ParsedNPC): string {
  // Extract name and format with proper bolding
  let name = parsed.name;
  if (!name.startsWith('**')) name = `**${name.replace(/\*\*/g, '')}**`;

  const statParts: string[] = [];

  // Level/HD
  const level = parsed.fields['Level'] || parsed.fields['HD'];
  if (level) {
    statParts.push(`Level ${level}`);
  }

  // AC
  const ac = parsed.fields['Armor Class (AC)'] || parsed.fields['AC'];
  if (ac) {
    statParts.push(`AC ${ac}`);
  }

  // Disposition
  const disposition = parsed.fields['Disposition'];
  if (disposition) {
    statParts.push(`disposition ${normalizeDisposition(disposition)}`);
  }

  // Movement
  const move = parsed.fields['Move'] || parsed.fields['MOVE'];
  if (move) {
    statParts.push(`moves ${move.toLowerCase()}`);
  }

  // Attacks
  const attacks = parsed.fields['Attacks'] || parsed.fields['ATTACKS'];
  if (attacks) {
    statParts.push(`attacks with ${attacks}`);
  }

  // Saves
  const saves = parsed.fields['Saves'] || parsed.fields['SAVES'];
  if (saves) {
    const saveText = saves === 'P' ? 'Physical' : saves === 'M' ? 'Mental' : saves;
    statParts.push(`save category is ${saveText}`);
  }

  // Special abilities
  const special = parsed.fields['Special Abilities'] || parsed.fields['SPECIAL'];
  if (special) {
    statParts.push(`Special: ${special}`);
  }

  // Type
  const type = parsed.fields['Type'] || parsed.fields['TYPE'];
  if (type) {
    statParts.push(`Type: ${type}`);
  }

  // Treasure
  const treasure = parsed.fields['Treasure'] || parsed.fields['TREASURE'];
  if (treasure) {
    statParts.push(`Treasure: ${treasure}`);
  }

  // XP
  const xp = parsed.fields['XP'];
  if (xp) {
    statParts.push(`XP: ${xp}`);
  }

  return `${name} *(this creature's vital stats are ${statParts.join(', ')})*`;
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
  const statParts: string[] = [];

  // Race, class, level with superscript
  const raceClass = parsed.fields['Race & Class'];
  if (raceClass) {
    const { race, level, charClass } = parseRaceClassLevel(raceClass);
    if (race && charClass && level) {
      const superLevel = toSuperscript(level) + ' level';
      // Use plural form for units with quantities
      const pronounPart = isPlural ? `these ${superLevel} ${race} ${charClass}s` : `this ${superLevel} ${race} ${charClass}`;
      statParts.push(pronounPart);
    }
  }

  // Primary attributes in lowercase PHB order
  const primaryAttrs = parsed.fields['Primary attributes'];
  if (primaryAttrs) {
    const formattedAttrs = formatPrimaryAttributes(primaryAttrs);
    const possessivePronoun = isPlural ? 'their' : 'his';
    statParts.push(`${possessivePronoun} primary attributes are ${formattedAttrs}`);
  }

  // Secondary skills
  const secondarySkills = parsed.fields['Secondary Skills'];
  if (secondarySkills) {
    const possessivePronoun = isPlural ? 'their' : 'his';
    const skillPlural = isPlural ? 'skills are' : 'skill is';
    statParts.push(`${possessivePronoun} secondary ${skillPlural} ${secondarySkills}`);
  }

  // Vital stats: HP, AC, disposition
  const vitalParts: string[] = [];
  const hp = parsed.fields['Hit Points (HP)'];
  const ac = parsed.fields['Armor Class (AC)'];
  const disposition = parsed.fields['Disposition'];

  if (hp) vitalParts.push(`hit points ${hp}`);
  if (ac) vitalParts.push(`armor class ${ac}`);
  if (disposition) vitalParts.push(`disposition ${normalizeDisposition(disposition)}`);

  if (vitalParts.length > 0) {
    statParts.push(`vital stats are ${vitalParts.join(', ')}`);
  }

  // Equipment
  const equipment = parsed.fields['Equipment'];
  if (equipment) {
    const processedEquip = findEquipment(equipment);
    const carryVerb = isPlural ? 'carry' : 'carries';
    statParts.push(`${carryVerb} ${processedEquip}`);
  }

  // Spells
  const spells = parsed.fields['Spells'];
  if (spells) {
    const canCastVerb = isPlural ? 'can cast' : 'can cast';
    statParts.push(`${canCastVerb} ${spells}`);
  }

  // Mount - render as separate block following canonical rules
  const mount = parsed.fields['Mount'];
  let mountBlock = '';
  if (mount) {
    // Mount is already formatted as a complete canonical block from extraction
    mountBlock = `\n\n${mount}`;
  }

  return `${name}${statParts.length > 0 ? ` *(${statParts.join(', ')})*` : ''}${mountBlock}`;
}

const MONSTER_VALIDATION_RULES: Array<{
  field: string;
  weight: number;
  type: WarningType;
  message: string;
  suggestion?: string;
}> = [
  {
    field: 'HD',
    weight: 20,
    type: 'warning',
    message: 'Hit Dice (HD) missing for monster. Provide as Level X(dX) format.',
  },
  {
    field: 'Level',
    weight: 20,
    type: 'warning',
    message: 'Level missing for monster. Provide as Level X(dX) format.',
  },
  {
    field: 'Armor Class (AC)',
    weight: 15,
    type: 'warning',
    message: 'Armor Class (AC) missing. Include AC value.',
  },
];

function buildValidation(parsed: ParsedNPC): ValidationResult {
  const warnings: ValidationWarning[] = [];
  let score = 100;

  const isMonster = isBasicMonster(parsed);
  const rulesToUse = isMonster ? MONSTER_VALIDATION_RULES : VALIDATION_RULES;

  for (const rule of rulesToUse) {
    // For monsters, check if they have either HD or Level
    if (rule.field === 'HD' || rule.field === 'Level') {
      if (isMonster && !parsed.fields['HD'] && !parsed.fields['Level']) {
        // Only add one warning for missing HD/Level, not both
        if (rule.field === 'HD') {
          warnings.push({
            type: rule.type,
            category: 'Level/HD',
            message: 'Level or Hit Dice missing for monster. Provide as Level X(dX) format.',
            suggestion: rule.suggestion,
          });
          score -= rule.weight;
        }
      }
    } else if (!parsed.fields[rule.field]) {
      warnings.push({
        type: rule.type,
        category: rule.field,
        message: rule.message,
        suggestion: rule.suggestion,
      });
      score -= rule.weight;
    }
  }

  // Only check name formatting for NPCs, not Basic Monsters (monsters get auto-bolded by formatter)
  if (!isMonster && !/^\*\*.+\*\*$/.test(parsed.original.split(/\r?\n/)[0]?.trim() ?? '')) {
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
    statParts.push(`primary attributes are ${formattedAttrs}`);
  }

  // Secondary skills
  const secondarySkills = parsed.fields['Secondary Skills'];
  if (secondarySkills) {
    statParts.push(`secondary skill is ${secondarySkills}`);
  }

  // Vital stats: HP, AC, disposition
  const vitalParts: string[] = [];
  const hp = parsed.fields['Hit Points (HP)'];
  const ac = parsed.fields['Armor Class (AC)'];
  const disposition = parsed.fields['Disposition'];

  if (hp) vitalParts.push(`hit points ${hp}`);
  if (ac) vitalParts.push(`armor class ${ac}`);
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

  // Expand coinage abbreviations
  processed = processed.replace(/(\d+)\s*pp\b/gi, '$1 platinum');
  processed = processed.replace(/(\d+)\s*gp\b/gi, '$1 gold');
  processed = processed.replace(/(\d+)\s*sp\b/gi, '$1 silver');
  processed = processed.replace(/(\d+)\s*cp\b/gi, '$1 copper');

  // Apply comprehensive magic item name mappings
  for (const [old, replacement] of Object.entries(MAGIC_ITEM_MAPPINGS)) {
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
      // Handle bonus at end: "ring of armor +5"
      const bonusAtEndMatch = workingPart.match(/^(.+?)(\s*\+\d+)(.*)$/);
      if (bonusAtEndMatch) {
        const [, item, bonus, rest] = bonusAtEndMatch;
        return `*${item.trim()}${rest}${bonus}*`;
      }
      // Handle bonus at beginning: "+2 dagger"
      const bonusAtStartMatch = workingPart.match(/^(\+\d+)\s+(.+)$/);
      if (bonusAtStartMatch) {
        const [, bonus, item] = bonusAtStartMatch;
        return `*${item} ${bonus}*`;
      }
      return `*${workingPart}*`;
    }
    return workingPart;
  });

  return processedParts.join(', ');
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
