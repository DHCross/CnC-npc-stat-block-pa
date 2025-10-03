// Enhanced NPC Parser with Jeremy's normalization rules
// Implements parenthetical extraction, mount handling, shield canonicalization, etc.

export interface ParentheticalData {
  hp?: string;
  ac?: string;
  disposition?: string;
  raceClass?: string;
  level?: string;
  attributes?: string;
  significantAttributes?: string;
  secondarySkills?: string;
  equipment?: string;
  formationDetails?: string;
  spells?: string;
  mountData?: string;
  coins?: string;
  jewelry?: string;
  originalPronoun?: string; // Track original "these", "this", etc. to avoid duplication
  raw: string;
}

export interface ParsedTitleAndBody {
  title: string;
  body: string;
  parentheticals: string[];
}

import { addMagicItemMechanics, applyNameMappings } from './name-mappings';

export interface MountBlock {
  name: string;
  level?: string;
  hp?: string;
  ac?: string;
  disposition?: string;
  attacks?: string;
  equipment?: string;
  raw: string;
}

function numberToWords(num: number): string {
  if (!Number.isFinite(num) || num < 0) {
    return num.toString();
  }

  const units = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (num < 10) {
    return units[num];
  }

  if (num < 20) {
    return teens[num - 10];
  }

  if (num < 100) {
    const tensValue = Math.floor(num / 10);
    const remainder = num % 10;
    return remainder === 0 ? tens[tensValue] : `${tens[tensValue]}-${units[remainder]}`;
  }

  if (num < 1000) {
    const hundredsValue = Math.floor(num / 100);
    const remainder = num % 100;
    const remainderText = remainder === 0 ? '' : ` ${numberToWords(remainder)}`;
    return `${units[hundredsValue]} hundred${remainderText}`;
  }

  if (num < 10000) {
    const thousandsValue = Math.floor(num / 1000);
    const remainder = num % 1000;
    const remainderText = remainder === 0 ? '' : ` ${numberToWords(remainder)}`;
    return `${units[thousandsValue]} thousand${remainderText}`;
  }

  return num.toString();
}

function canonicalizeCoinsText(coins: string): string {
  if (!coins) {
    return coins;
  }

  let normalized = coins.trim();

  normalized = normalized.replace(/\s*[-–]\s*/g, '–');
  normalized = normalized.replace(/(\d)(pp|gp|sp|cp)\b/gi, '$1 $2');
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

// Helper function to get superscript ordinal
function getSuperscriptOrdinal(num: string): string {
  const n = parseInt(num);
  if (n === 0) return 'ˢᵗ'; // Zero uses ˢᵗ (0ˢᵗ level spells)
  if (n % 10 === 1 && n % 100 !== 11) return 'ˢᵗ';
  if (n % 10 === 2 && n % 100 !== 12) return 'ⁿᵈ';
  if (n % 10 === 3 && n % 100 !== 13) return 'ʳᵈ';
  return 'ᵗʰ';
}

// Core regex patterns based on Jeremy's specifications
// This regex handles nested parentheses by matching balanced parentheses
const PAREN_RE = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
const HP_RE = /\b(?:HP|Hit\s*Points)\s*[:-]?\s*(\d+)\b/i;
const AC_RE = /\bAC\s*[:-]?\s*([\d/]+)\b/i;

const RCL_RE = /\b(?:(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s*level\s+([a-z-]+)\s+([a-z-]+)s?|(human|elf|dwarf|halfling|gnome|orc|goblin),\s*(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s*level\s+([a-z-]+)s?)\b/i;

const DISPOSITION_RE = /\b(disposition|alignment)\s*[:‑]?\s*([a-z\s]+(?:\/[a-z\s]+)?)\b/i;
const MOUNT_TYPE_RE = /\b(heavy|light)?\s*war\s*horse\b/i;
const LEADING_BONUS_RE = /\+(\d+)\s+((?:\w+\s+)*(?:longsword|sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;

// Unit detection patterns
const UNIT_PATTERNS = [
  /\bx\s*(\d{1,3})\b/i,
  /\b(men-at-arms|militia|warriors|halflings|bowmen|guards|sergeants|fighters|troops)\b/i
];

export function splitTitleAndBody(text: string): ParsedTitleAndBody {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { title: '', body: '', parentheticals: [] };
  }

  // For single-line input, extract title before first parenthetical
  if (lines.length === 1) {
    const line = lines[0];
    const firstParenMatch = line.match(/^([^(]+?)\s*\(/);
    const title = firstParenMatch ? firstParenMatch[1].trim() : line;
    const body = '';

    // Extract all top-level parentheticals
    const parentheticals: string[] = [];
    let match;
    PAREN_RE.lastIndex = 0;
    while ((match = PAREN_RE.exec(text)) !== null) {
      parentheticals.push(match[1]);
    }

    // Fallback: if no balanced parentheticals found but we have an opening paren,
    // extract everything after the first opening parenthesis as an unclosed parenthetical
    if (parentheticals.length === 0 && firstParenMatch) {
      const openParenIndex = text.indexOf('(');
      if (openParenIndex !== -1) {
        const remaining = text.substring(openParenIndex + 1);
        if (remaining.trim()) {
          parentheticals.push(remaining.trim());
        }
      }
    }

    return { title, body, parentheticals };
  }

  const title = lines[0];
  const body = lines.slice(1).join('\n');

  // Extract all top-level parentheticals
  const parentheticals: string[] = [];
  let match;
  PAREN_RE.lastIndex = 0;
  while ((match = PAREN_RE.exec(text)) !== null) {
    parentheticals.push(match[1]);
  }

  // Fallback: if no balanced parentheticals found but we have an opening paren,
  // extract everything after the first opening parenthesis as an unclosed parenthetical
  if (parentheticals.length === 0) {
    const openParenIndex = text.indexOf('(');
    if (openParenIndex !== -1) {
      const remaining = text.substring(openParenIndex + 1);
      if (remaining.trim()) {
        parentheticals.push(remaining.trim());
      }
    }
  }

  return { title, body, parentheticals };
}

export function extractParentheticalData(parenthetical: string, isUnit: boolean = false, title?: string): ParentheticalData {
  const data: ParentheticalData = { raw: parenthetical };

  // Extract HP
  const hpMatch = HP_RE.exec(parenthetical);
  if (hpMatch) {
    data.hp = hpMatch[1];
  }

  // Extract AC
  const acMatch = AC_RE.exec(parenthetical);
  if (acMatch) {
    data.ac = acMatch[1];
  }

  // Extract disposition with multiple pattern variations
  let dispositionMatch = DISPOSITION_RE.exec(parenthetical);
  if (!dispositionMatch) {
    // Try more liberal patterns
    dispositionMatch = /\b(lawful\s+good|lawful\s+neutral|lawful\s+evil|neutral\s+good|true\s+neutral|neutral\s+evil|chaotic\s+good|chaotic\s+neutral|chaotic\s+evil|lawful|neutral|chaotic|good|evil)\b/i.exec(parenthetical);
    if (dispositionMatch) {
      data.disposition = normalizeDisposition(dispositionMatch[1]);
    }
  } else {
    data.disposition = normalizeDisposition(dispositionMatch[2]);
  }

  // Extract Level with dice notation for non-classed creatures (e.g., "Level 1(d6)")
  const levelDiceMatch = /\bLevel\s+(\d+\([^)]+\))/i.exec(parenthetical);
  if (levelDiceMatch) {
    data.level = levelDiceMatch[1];
  }

  // Extract race/class/level
  const rclMatch = RCL_RE.exec(parenthetical);
  if (rclMatch) {
    // Check if this appears to be a unit by looking for plural pronouns
    const isUnitContext = /\b(these|those)\b/i.test(parenthetical);

    // Handle two formats: "2nd level human fighters" or "human, 2nd level fighter"
    if (rclMatch[1]) {
      // Format: "2nd level human fighters" - groups [1]=level, [2]=race, [3]=class
      const level = rclMatch[1];
      const race = rclMatch[2];
      let charClass = rclMatch[3];
      // For units, preserve plural; for individuals, use singular
      if (!isUnitContext && charClass.endsWith('s')) {
        charClass = charClass.replace(/s$/, ''); // Remove plural 's' for individuals
      }
      // Preserve original ordinal format
      const ordinalMatch = rclMatch[0].match(/(\d+)(st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)/);
      let ordinal = ordinalMatch ? ordinalMatch[2] : 'th';
      if (ordinal === 'st' || ordinal === 'nd' || ordinal === 'rd' || ordinal === 'th') {
        ordinal = getSuperscriptOrdinal(level);
      }
      data.raceClass = `${race}, ${level}${ordinal} level ${charClass}`;
      data.level = level;
      if (isUnitContext) data.originalPronoun = 'these';
    } else if (rclMatch[4] && rclMatch[5]) {
      // Format: "human, 2nd level fighter" - groups [4]=race, [5]=level, [6]=class
      const race = rclMatch[4];
      const level = rclMatch[5];
      let charClass = rclMatch[6] ? rclMatch[6] : 'fighter';
      // For units, preserve plural; for individuals, use singular
      if (!isUnitContext && charClass.endsWith('s')) {
        charClass = charClass.replace(/s$/, ''); // Remove plural 's' for individuals
      }
      // Preserve original ordinal format
      const ordinalMatch = rclMatch[0].match(/(\d+)(st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)/);
      let ordinal = ordinalMatch ? ordinalMatch[2] : 'th';
      if (ordinal === 'st' || ordinal === 'nd' || ordinal === 'rd' || ordinal === 'th') {
        ordinal = getSuperscriptOrdinal(level);
      }
      data.raceClass = `${race}, ${level}${ordinal} level ${charClass}`;
      data.level = level;
      if (isUnitContext) data.originalPronoun = 'these';
    }
  }

  // Also try to extract from prose that includes leading pronouns like "these 2nd level human fighters"
  if (!data.raceClass) {
    const proseMatch = /(?:these|this|the)\s+(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s+level\s+([a-z-]+)\s+([a-z-]+)s?/i.exec(parenthetical);
    if (proseMatch) {
      const level = proseMatch[1];
      const race = proseMatch[2];
      const charClass = proseMatch[3].replace(/s$/, ''); // Remove plural 's'
      // Normalize ordinal to superscript format from prose match
      const ordinalMatch = proseMatch[0].match(/(\d+)(st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)/);
      let ordinal = ordinalMatch ? ordinalMatch[2] : 'th';
      // Convert regular ordinals to superscript for consistency
      if (ordinal === 'st' || ordinal === 'nd' || ordinal === 'rd' || ordinal === 'th') {
        ordinal = getSuperscriptOrdinal(level);
      }
      data.raceClass = `${race}, ${level}${ordinal} level ${charClass}`;
      data.level = level;
    }
  }

  // Try to extract from comma-separated format like "human, fighter, 1st level"
  if (!data.raceClass) {
    const commaSeparatedMatch = /\b([a-z]+),\s*([a-z]+),\s*(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s*level\b/i.exec(parenthetical);
    if (commaSeparatedMatch) {
      const race = commaSeparatedMatch[1];
      let charClass = commaSeparatedMatch[2];
      const level = commaSeparatedMatch[3];

      // For units, make class plural
      const isUnitContext = /\bx\d+\b/i.test(parenthetical) || isUnit || (title && /\bx\d+\b/i.test(title));
      if (isUnitContext && !charClass.endsWith('s')) {
        charClass = pluralizeClassNameLocal(charClass);
      }

      // Convert to superscript ordinal
      const ordinal = getSuperscriptOrdinal(level);
      data.raceClass = `${race}, ${level}${ordinal} level ${charClass}`;
      data.level = level;
      if (isUnitContext) data.originalPronoun = 'these';
    }
  }

  // Try to extract from format like "He is a neutral evil, human, 4th/5th level fighter/assassin"
  if (!data.raceClass) {
    const heIsPattern = /(he|she|it)\s+is\s+a\s+(.+?),\s*([a-z-]+),\s*([0-9/thndrdst]+)\s+level\s+([a-z/-]+)/i.exec(parenthetical);
    if (heIsPattern) {
      const pronoun = heIsPattern[1].toLowerCase();
      const disposition = heIsPattern[2];
      const race = heIsPattern[3];
      const level = heIsPattern[4];
      const charClass = heIsPattern[5]; // Could be fighter/assassin
      data.raceClass = `${race}, ${level} level ${charClass}`;
      data.level = level;
      data.originalPronoun = pronoun;
      data.disposition = normalizeDisposition(disposition);
    }
  }

  // Try to extract from format like "These are chaotic good, human, 2nd level fighters"
  if (!data.raceClass) {
    const complexProseMatch = /(these|this|the)\s+are\s+(chaotic\s+good|chaotic\s+evil|chaotic\s+neutral|lawful\s+good|lawful\s+evil|lawful\s+neutral|neutral\s+good|neutral\s+evil|neutral),\s*([a-z-]+),\s*(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s+level\s+([a-z-]+)s?/i.exec(parenthetical);
    if (complexProseMatch) {
      const originalPronoun = complexProseMatch[1];
      const disposition = complexProseMatch[2];
      const race = complexProseMatch[3];
      const level = complexProseMatch[4];
      let charClass = complexProseMatch[5]; // Keep as-is for now, handle pluralization in output
      // For units, ensure class name is plural
      if (originalPronoun.toLowerCase() === 'these' && !charClass.endsWith('s')) {
        charClass = pluralizeClassNameLocal(charClass);
      }
      // Normalize ordinal to superscript format
      const ordinalMatch = complexProseMatch[0].match(/(\d+)(st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)/);
      let ordinal = ordinalMatch ? ordinalMatch[2] : 'th';
      if (ordinal === 'st' || ordinal === 'nd' || ordinal === 'rd' || ordinal === 'th') {
        ordinal = getSuperscriptOrdinal(level);
      }
      data.raceClass = `${race}, ${level}${ordinal} level ${charClass}`;
      data.level = level;
      data.originalPronoun = originalPronoun.toLowerCase(); // Store the original pronoun
      data.disposition = normalizeDisposition(disposition); // Extract and normalize disposition
    }
  }

  // Try to extract HD format like "these HD 1(d6) human militia"
  if (!data.raceClass) {
    const hdMatch = /(?:these|this|the)\s+HD\s+\d+\([^)]+\)\s+([a-z-]+)\s+([a-z-]+)s?/i.exec(parenthetical);
    if (hdMatch) {
      const race = hdMatch[1];
      const charClass = hdMatch[2].replace(/s$/, ''); // Remove plural 's'
      data.raceClass = `${race} ${charClass}`;
    }
  }

  // Extract attributes with multiple pattern variations
  // Try more specific patterns first
  let attrMatch = /(?:their|his|its)\s+prime\s+attributes\s+are:\s*([^.]+?)(?:\.|$)/i.exec(parenthetical);
  if (!attrMatch) {
    // Try "prime attributes are: str, con, dex" format
    attrMatch = /(?:prime\s+attributes?\s+are|attributes?\s+are)[:\s]*([^.;]+?)(?:\.|,\s*(?:he|they|she|it)\s+(?:wear|carry|wield|have)|They|$)/i.exec(parenthetical);
  }
  if (!attrMatch) {
    // Try without "primary/prime/PA" qualifier - stop at equipment indicators
    attrMatch = /(?:his|their|its)\s+(?:primary\s+)?attributes?\s+are\s+((?:strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)(?:,?\s*(?:and\s+)?(?:strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha))*)/i.exec(parenthetical);
  }
  if (!attrMatch) {
    // Try "primes are" format
    attrMatch = /(?:his|their|its)\s+primes?\s+are[:\s]*([^.;,]+)/i.exec(parenthetical);
  }
  if (!attrMatch) {
    // Try general PA/primary/prime format
    attrMatch = /(?:primary\s+attributes?|prime\s+attributes?|PA)\s*[:-]?\s*([^.;,]+)/i.exec(parenthetical);
  }
  if (!attrMatch) {
    // Try simple patterns like "STR, DEX, CON" or "strength, dexterity"
    attrMatch = /\b((?:str|dex|con|int|wis|cha|strength|dexterity|constitution|intelligence|wisdom|charisma)(?:[,\s]+(?:str|dex|con|int|wis|cha|strength|dexterity|constitution|intelligence|wisdom|charisma))*)\b/i.exec(parenthetical);
  }
  if (attrMatch) {
    data.attributes = attrMatch[1].trim();
  }

  // Extract equipment - preserve verb structure when possible, including conditional equipment
  const equipMatch = /(?:EQ|equipment)[\s:-]+([^.;]+)/i.exec(parenthetical);
  if (equipMatch) {
    data.equipment = equipMatch[1].trim();
  } else {
    // Extract equipment from the full text, capturing everything in one pass
    let fullEquipment = '';

    // Find all equipment mentions starting from "they wear" or "they carry"
    const fullEquipMatch = /(?:they\s+wear|wears?)\s+([^.]+?)(?:\.\s*they\s+carry\s+([^.]+?))?(?:\.\s*they\s+carry\s+([^.]+?))?(?:\.|$)/i.exec(parenthetical);
    if (fullEquipMatch) {
      const wornItems = fullEquipMatch[1]?.trim();
      const carriedItems1 = fullEquipMatch[2]?.trim();
      const carriedItems2 = fullEquipMatch[3]?.trim();

      const equipParts: string[] = [];
      if (wornItems) equipParts.push(wornItems);
      if (carriedItems1) equipParts.push(carriedItems1);
      if (carriedItems2) equipParts.push(carriedItems2);

      fullEquipment = equipParts.join(', ');
    } else {
      // Fallback: try to capture any equipment patterns
      const fallbackMatch = /(?:they\s+wear|wears?|they\s+carry|carries?|wields?)\s+([^.]+?)(?:\.|$)/i.exec(parenthetical);
      if (fallbackMatch) {
        fullEquipment = fallbackMatch[1].trim();
      }
    }

    if (fullEquipment && !fullEquipment.match(/^\s*(and|carries?|a|,)*\s*$/i)) {
      // Clean up equipment by removing coin references
      fullEquipment = fullEquipment.replace(/,?\s*and\s+carry\s+\d+[–-]\d+\s*(?:gp|gold|silver|copper|platinum)(?:\s+in\s+coin)?/gi, '');
      fullEquipment = fullEquipment.replace(/,?\s*\d+[–-]\d+\s*(?:gp|gold|silver|copper|platinum)(?:\s+in\s+coin)?/gi, '');
      fullEquipment = fullEquipment.trim().replace(/,\s*$/, '');
      if (fullEquipment) {
        data.equipment = fullEquipment;
      }
    }
  }

  // Extract mount data
  if (MOUNT_TYPE_RE.test(parenthetical)) {
    // Simple mount detection - more sophisticated extraction needed
    data.mountData = parenthetical;
  }

  // Add default disposition and coins for military units if not specified
  if (isUnit) {
    // Check if this is a military unit based on common military terms (check both parenthetical and title)
    const militaryTerms = /\b(men-at-arms|guards|militia|troops|soldiers|fighters|warriors|bowmen|crossbowmen|halberdiers|sergeants|knights|cavalry|infantry)\b/i;
    const isMilitaryUnit = militaryTerms.test(parenthetical) || (title && militaryTerms.test(title));

    if (isMilitaryUnit && !data.disposition) {
      data.disposition = 'neutral/good';
    }

    // Add default coins for military units based on level
    if (isMilitaryUnit && !data.coins && data.level) {
      const level = parseInt(data.level);
      if (level === 1) {
        data.coins = '1–6 gp';
      } else if (level <= 3) {
        data.coins = `${level}–${level * 6} gp`;
      }
    }
  }

  // Extract coins with multiple pattern variations
  const coinMatch = /(\d+)[-–](\d+)\s*(?:gp|gold|GP)/i.exec(parenthetical);
  if (coinMatch) {
    data.coins = `${coinMatch[1]}–${coinMatch[2]} gp`;
  }

  // Extract significant attributes with values
  const sigAttrMatch = /(?:significant|specific)\s+attributes\s+are\s+([^.]+?)(?:\.|$)/i.exec(parenthetical);
  if (sigAttrMatch) {
    data.significantAttributes = sigAttrMatch[1].trim();
  }

  // Extract secondary skills
  const skillMatch = /(?:secondary\s+skill|skills?)\s+(?:is|are|of)[:\s]*([^.]+?)(?:\.|$)/i.exec(parenthetical);
  if (skillMatch) {
    data.secondarySkills = skillMatch[1].trim();
  }

  // Extract spells
  const spellMatch = /(?:can\s+cast|spells?\s+per\s+day|number\s+of.*?spells?\s+per\s+day)[:\s]*([^.]+?)(?:\.|$)/i.exec(parenthetical);
  if (spellMatch) {
    data.spells = spellMatch[1].trim();
  }

  // Formation details are now captured as part of equipment context, not separately

  // Extract jewelry separately from coins - do this BEFORE the general currency extraction
  const jewelryMatch = /(\d+)\s*gold\s+worth\s+of\s+jewelry/i.exec(parenthetical);
  if (jewelryMatch) {
    data.jewelry = `${jewelryMatch[1]} gold worth of jewelry`;
  }

  // Now extract coins, but exclude jewelry values
  if (!coinMatch) {
    // Extract all currency mentions from parenthetical, but exclude jewelry
    const currencyPattern = /(\d+)\s*(gp|sp|cp|pp|gold|silver|copper|platinum)(?!\s+worth\s+of\s+jewelry)\b/gi;
    const currencies: string[] = [];
    let match;
    while ((match = currencyPattern.exec(parenthetical)) !== null) {
      const amount = match[1];
      const type = match[2].toLowerCase();

      switch (type) {
        case 'gp':
        case 'gold':
          currencies.push(`${amount} gp`);
          break;
        case 'sp':
        case 'silver':
          currencies.push(`${amount} sp`);
          break;
        case 'cp':
        case 'copper':
          currencies.push(`${amount} cp`);
          break;
        case 'pp':
        case 'platinum':
          currencies.push(`${amount} pp`);
          break;
      }
    }

    if (currencies.length > 0) {
      data.coins = currencies.join(', ');
    }
  }

  return data;
}

export function isUnitHeading(title: string): boolean {
  return UNIT_PATTERNS.some(pattern => pattern.test(title));
}

export function normalizeDisposition(disposition: string): string {
  const trimmed = disposition.trim().toLowerCase();
  const mapping: Record<string, string> = {
    'lawful good': 'law/good',
    'lawful neutral': 'law/neutral',
    'lawful evil': 'law/evil',
    'neutral good': 'neutral/good',
    'true neutral': 'neutral',
    'neutral': 'neutral',
    'neutral/neutral': 'neutral',
    'neutral evil': 'neutral/evil',
    'chaotic good': 'chaos/good',
    'chaotic neutral': 'chaos/neutral',
    'chaotic evil': 'chaos/evil',
    'lawful': 'law/neutral',
    'chaotic': 'chaos/neutral'
  };
  return mapping[trimmed] ?? disposition.trim();
}

const ATTRIBUTE_ABBREVIATIONS: Record<string, string> = {
  'str': 'strength',
  'int': 'intelligence',
  'wis': 'wisdom',
  'dex': 'dexterity',
  'con': 'constitution',
  'cha': 'charisma'
};

const PHB_ATTRIBUTE_ORDER = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const PHYSICAL_ATTRIBUTE_SET = new Set(['strength', 'dexterity', 'constitution']);
const MENTAL_ATTRIBUTE_SET = new Set(['intelligence', 'wisdom', 'charisma']);

// C&C Character Class Prime Attributes
const CLASS_PRIME_ATTRIBUTES: Record<string, string[]> = {
  'fighter': ['strength', 'dexterity', 'constitution'],
  'barbarian': ['strength', 'dexterity', 'constitution'],
  'knight': ['strength', 'constitution'],
  'ranger': ['strength', 'dexterity', 'wisdom'],
  'assassin': ['strength', 'dexterity', 'intelligence'],
  'monk': ['strength', 'dexterity', 'wisdom'],
  'rogue': ['dexterity'],
  'thief': ['dexterity'],
  'bard': ['dexterity', 'charisma'],
  'cleric': ['wisdom'],
  'druid': ['wisdom'],
  'paladin': ['wisdom', 'charisma'],
  'wizard': ['intelligence'],
  'mage': ['intelligence'],
  'illusionist': ['intelligence']
};

interface AttributeToken {
  name: string;
  score?: number;
  rawScore?: string;
}

export interface NormalizeAttributeOptions {
  isUnit?: boolean;
  raceClassText?: string;
  levelText?: string;
}

export interface NormalizedAttributesResult {
  type: 'list' | 'prime' | 'none';
  value?: string;
}

function parseAttributeTokens(attributes: string): AttributeToken[] {
  const tokens: AttributeToken[] = [];
  if (!attributes) return tokens;

  const normalizedInput = attributes.replace(/[–—-]/g, ' ');
  const pattern = /(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)(?:\s*(?:[:=]|is|was)?\s*\(?([0-9]{1,2}(?:\/[0-9]{2})?)\)?)?/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalizedInput)) !== null) {
    const rawName = match[1].toLowerCase();
    const canonical = ATTRIBUTE_ABBREVIATIONS[rawName] || rawName;

    let score: number | undefined;
    let rawScore: string | undefined;
    if (match[2]) {
      rawScore = match[2];
      const sanitized = rawScore.replace(/[^0-9/]/g, '');
      const [base] = sanitized.split('/');
      const parsedScore = parseInt(base, 10);
      if (!Number.isNaN(parsedScore)) {
        score = parsedScore;
      }
    }

    tokens.push({ name: canonical, score, rawScore });
  }

  return tokens;
}

function determinePrimeType(attributes: string, tokens: AttributeToken[]): 'physical' | 'mental' | undefined {
  const lowered = attributes.toLowerCase();
  if (/\bphysical\b/.test(lowered)) {
    return 'physical';
  }
  if (/\bmental\b/.test(lowered)) {
    return 'mental';
  }

  const uniqueNames = new Set(tokens.map(token => token.name));
  const hasPhysical = Array.from(uniqueNames).some(name => PHYSICAL_ATTRIBUTE_SET.has(name));
  const hasMental = Array.from(uniqueNames).some(name => MENTAL_ATTRIBUTE_SET.has(name));

  if (hasPhysical && !hasMental) return 'physical';
  if (hasMental && !hasPhysical) return 'mental';
  return undefined;
}

function extractClassInfo(raceClassText?: string, levelText?: string): { className?: string; level?: number; hasClassLevels: boolean } {
  let className: string | undefined;
  let level: number | undefined;

  if (raceClassText) {
    const levelMatch = raceClassText.match(/(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s+level\s+([a-z-]+)/i);
    if (levelMatch) {
      level = parseInt(levelMatch[1], 10);
      className = levelMatch[2].toLowerCase().replace(/s$/, '');
    } else {
      const simpleMatch = raceClassText.match(/([a-z-]+)\s+([a-z-]+)$/i);
      if (simpleMatch) {
        className = simpleMatch[2].toLowerCase().replace(/s$/, '');
      }
    }
  }

  if (levelText && level === undefined) {
    const parsed = parseInt(levelText, 10);
    if (!Number.isNaN(parsed)) {
      level = parsed;
    }
  }

  const hasClassLevels = Boolean(className && level !== undefined);
  return { className, level, hasClassLevels };
}

export function normalizeAttributes(attributes: string, options: NormalizeAttributeOptions = {}): NormalizedAttributesResult {
  const { isUnit = false, raceClassText, levelText } = options;
  if (!attributes || !attributes.trim()) {
    return { type: 'none' };
  }

  const tokens = parseAttributeTokens(attributes);
  const primeType = determinePrimeType(attributes, tokens);

  // Check for class levels FIRST, before checking isUnit
  const classInfo = extractClassInfo(raceClassText, levelText);

  // If they have a character class, list individual attributes
  if (classInfo.hasClassLevels) {
    // Check if we have any actual attribute scores
    const hasScores = tokens.some(token => token.score !== undefined);

    // If no scores provided, but we have a prime type (physical/mental), use that
    if (!hasScores && primeType) {
      return { type: 'prime', value: primeType };
    }

    // If attributes are listed without scores (like "str, dex, int"), list them all
    if (!hasScores && tokens.length > 0) {
      const validAttributes = tokens.filter(token =>
        token.name && PHB_ATTRIBUTE_ORDER.includes(token.name)
      );

      if (validAttributes.length > 0) {
        const sorted = validAttributes
          .map(token => token.name)
          .sort((a, b) => PHB_ATTRIBUTE_ORDER.indexOf(a) - PHB_ATTRIBUTE_ORDER.indexOf(b));

        return {
          type: 'list',
          value: sorted.join(', ')
        };
      }
    }

    // We have scores, so list individual attributes
    const qualifyingAttributes = new Set<string>();

    tokens.forEach(token => {
      if (!token.name || !PHB_ATTRIBUTE_ORDER.includes(token.name)) {
        return;
      }
      if (token.score === undefined) {
        return;
      }
      // Include attribute if it has a modifier (score <= 8 or >= 13)
      if (token.score <= 8 || token.score >= 13) {
        qualifyingAttributes.add(token.name);
      }
    });

    // For classed NPCs, include their prime attributes
    if (classInfo.className) {
      const primes = CLASS_PRIME_ATTRIBUTES[classInfo.className.toLowerCase()];
      if (primes) {
        const tokenNames = new Set(tokens.map(token => token.name));
        primes.forEach(prime => {
          if (tokenNames.has(prime)) {
            qualifyingAttributes.add(prime);
          }
        });
      }
    }

    // If we have qualifying attributes, list them individually
    if (qualifyingAttributes.size > 0) {
      const sorted = Array.from(qualifyingAttributes).sort(
        (a, b) => PHB_ATTRIBUTE_ORDER.indexOf(a) - PHB_ATTRIBUTE_ORDER.indexOf(b)
      );

      return {
        type: 'list',
        value: sorted.join(', ')
      };
    }

    // Classed NPCs with no qualifying attributes: no output
    return { type: 'none' };
  }

  // No character class: use physical/mental designation
  return { type: 'prime', value: primeType ?? 'physical' };
}

export function canonicalizeShields(equipment: string): string {
  // Jeremy's mandate: explicit shield type (size + material) per editorial standards
  let result = equipment;

  // First pass: Handle bonus shields - preserve material if specified
  result = result.replace(/\+(\d+)\s+(wooden|steel|iron)?\s*shield/gi, (match, bonus, material) => {
    const mat = material || 'steel';
    return `medium ${mat} shield +${bonus}`;
  });

  // Second pass: Handle material-only shields (add size) - but not if size already present
  result = result.replace(/\b(wooden|steel|iron)\s+shield(?:s)?(?!\s*\+)/gi, (match, material, offset, string) => {
    // Don't add "medium" if a size word already precedes this
    const before = string.substring(Math.max(0, offset - 15), offset);
    if (/\b(medium|large|small)\s*$/i.test(before)) {
      return match; // Already has size, keep as-is
    }
    return match.replace(new RegExp(`\\b${material}\\s+shield`, 'i'), `medium ${material} shield`);
  });

  // Third pass: Handle bare "shield" (add both size and material)
  result = result.replace(/\b(?:a\s+|an\s+)?shield\b(?!\s*\+)/gi, (match, offset, string) => {
    // Don't replace if already has size+material prefix
    const before = string.substring(Math.max(0, offset - 25), offset);
    if (/\b(medium|large|small)\s+(wooden|steel|iron)\s*$/i.test(before)) {
      return match;
    }
    return 'medium steel shield';
  });

  // Handle buckler and pavis separately (they don't need size qualifiers)
  result = result.replace(/\b(?:wooden|steel|iron)\s+(buckler|pavis)/gi, '$1');

  return result;
}

export function repositionMagicItemBonuses(equipment: string): string {
  // Handle bonuses that appear after verbs: "carries +1 sword" → "carries sword +1"
  let result = equipment.replace(/(wears?|carries?|wields?)\s+\+(\d+)\s+((?:\w+\s+)*(?:longsword|sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi,
    (match, verb, bonus, item) => {
      return `${verb} ${item} +${bonus}`;
    });

  // Handle traditional pattern: "+1 sword" → "sword +1"
  result = result.replace(LEADING_BONUS_RE, (match, bonus, item) => {
    return `${item} +${bonus}`;
  });

  return result;
}

export function deduplicateEquipment(equipment: string): string {
  const items = equipment.split(/,\s*/).map(item => item.trim());
  const unique = [...new Set(items)];
  return unique.join(', ');
}

export function normalizeEquipmentVerbs(equipment: string): string {
  // Jeremy's mandate: "wears" for armor/barding, "carries" for weapons/gear
  let normalized = equipment;

  // Normalize armor verbs to "wears" (for armor, barding, clothing)
  normalized = normalized.replace(/\b(wears?|wearing|worn|has on|dons?)\b\s+/gi, 'wears ');

  // Normalize weapon/gear verbs to "carry" (for weapons, tools, items)
  normalized = normalized.replace(/\b(carries?|carrying|bears?|bearing|holds?|holding|wields?|wielding)\b\s+/gi, 'carry ');

  // Handle "and carry" constructions properly
  normalized = normalized.replace(/\band\s+carry/gi, 'and carry');

  return normalized;
}

export function extractMountFromParenthetical(parenthetical: string): {
  cleanedParenthetical: string;
  mountBlock?: MountBlock
} {
  // Simple mount extraction - detect war horse references
  if (!MOUNT_TYPE_RE.test(parenthetical)) {
    return { cleanedParenthetical: parenthetical };
  }

  // Extract mount-related data
  const mountHpMatch = /(?:war\s*horse[^.]*?HP\s*(\d+))/i.exec(parenthetical);
  const mountAcMatch = /(?:war\s*horse[^.]*?AC\s*([\d/]+))/i.exec(parenthetical);
  const mountAttackMatch = /((?:hoof|hooves)[^.]*)/i.exec(parenthetical);

  if (mountHpMatch || mountAcMatch || mountAttackMatch) {
    const mountBlock: MountBlock = {
      name: 'warhorse',
      hp: mountHpMatch?.[1],
      ac: mountAcMatch?.[1],
      disposition: 'neutral',
      attacks: mountAttackMatch?.[1],
      raw: parenthetical
    };

    // Remove mount data from parenthetical
    const cleaned = parenthetical
      .replace(/[,;\s]*(?:heavy|light)?\s*war\s*horse[^.;,]*/gi, '')
      .replace(/[,;\s]*(?:hoof|hooves)[^.;,]*/gi, '')
      .replace(/[,;\s]+$/, ''); // Clean trailing punctuation

    return { cleanedParenthetical: cleaned, mountBlock };
  }

  return { cleanedParenthetical: parenthetical };
}


function pluralizeClassNameLocal(name: string): string {
  const lower = name.trim().toLowerCase();
  const irregulars: Record<string, string> = {
    'thief': 'thieves',
    'archer': 'archers',
    'fighter': 'fighters',
    'cleric': 'clerics',
    'paladin': 'paladins',
    'ranger': 'rangers',
    'wizard': 'wizards',
    'warlock': 'warlocks',
    'druid': 'druids',
    'bard': 'bards',
    'monk': 'monks',
    'rogue': 'rogues',
    'assassin': 'assassins',
    'knight': 'knights',
    'magic-user': 'magic-users'
  };

  if (irregulars[lower]) {
    return irregulars[lower];
  }

  if (lower.endsWith('man')) {
    return `${lower.slice(0, -3)}men`;
  }

  if (lower.endsWith('y')) {
    return `${lower.slice(0, -1)}ies`;
  }

  if (lower.endsWith('s')) {
    return lower;
  }

  return `${lower}s`;
}

function pluralizeEquipmentItem(item: string): string {
  // Handle magic items with mechanics - preserve the mechanics part
  const mechanicsMatch = item.match(/^(.+?)(\s*\([^)]+\))$/);
  if (mechanicsMatch) {
    const baseItem = mechanicsMatch[1];
    const mechanics = mechanicsMatch[2];
    return pluralizeEquipmentItem(baseItem) + mechanics;
  }

  // Handle italicized magic items
  const italicsMatch = item.match(/^\*(.+)\*$/);
  if (italicsMatch) {
    return `*${pluralizeEquipmentItem(italicsMatch[1])}*`;
  }

  const trimmed = item.trim().toLowerCase();

  // Equipment-specific irregulars
  const equipmentIrregulars: Record<string, string> = {
    'chain shirt': 'chain shirts',
    'chain mail': 'chain mail', // uncountable
    'plate mail': 'plate mail', // uncountable
    'full plate mail': 'full plate mail', // uncountable
    'leather armor': 'leather armor', // uncountable
    'scale armor': 'scale armor', // uncountable
    'banded armor': 'banded armor', // uncountable
    'medium steel shield': 'medium steel shields',
    'large steel shield': 'large steel shields',
    'small steel shield': 'small steel shields',
    'wooden shield': 'wooden shields',
    'shield': 'shields',
    'broadsword': 'broadswords',
    'longsword': 'longswords',
    'dagger': 'daggers',
    'bow': 'bows',
    'crossbow': 'crossbows',
    'mace': 'maces',
    'staff': 'staves',
    'rod': 'rods',
    'wand': 'wands'
  };

  if (equipmentIrregulars[trimmed]) {
    return equipmentIrregulars[trimmed];
  }

  // General pluralization rules
  if (trimmed.endsWith('s') || trimmed.endsWith('mail')) {
    return item; // Already plural or uncountable
  }

  if (trimmed.endsWith('y')) {
    return item.slice(0, -1) + 'ies';
  }

  if (trimmed.endsWith('f')) {
    return item.slice(0, -1) + 'ves';
  }

  if (trimmed.endsWith('fe')) {
    return item.slice(0, -2) + 'ves';
  }

  return item + 's';
}

function extractUnitNounFromTitle(title?: string): string | undefined {
  if (!title) return undefined;

  // First try specific unit types
  const specificMatch = title.toLowerCase().match(/(men-at-arms|militia|warriors|bowmen|guards|sergeants|fighters|troops)/);
  if (specificMatch) {
    return specificMatch[1];
  }

  // Then try to extract race/creature names from the title (before "x##")
  // e.g., "Halflings x14" -> "halflings", "Goblin Marauders x8" -> "goblin marauders"
  const unitQuantityMatch = title.match(/^([A-Za-z\s-]+?)\s+x\d+/);
  if (unitQuantityMatch) {
    return unitQuantityMatch[1].toLowerCase().trim();
  }

  return undefined;
}

function buildDescriptorFromData(data: ParentheticalData, isUnit: boolean, title?: string): string {
  const subject = isUnit ? 'These' : 'This';
  let race: string | undefined;
  let level: string | undefined;
  let charClass: string | undefined;

  if (data.raceClass) {
    // Try matching full format: "human, 4th/5th level fighter/assassin" or "human, 2ⁿᵈ level fighters"
  const match = data.raceClass.match(/([a-z-]+),\s*([0-9/thndrdstⁿᵈˢᵗʳᵈᵗʰ]+)\s+level\s+([a-z/-]+)/i);
    if (match) {
      race = match[1].toLowerCase();
      level = match[2];
      charClass = match[3].toLowerCase();
    } else {
  const simpleMatch = data.raceClass.match(/([a-z-]+)\s+([a-z/-]+)/i);
      if (simpleMatch) {
        race = simpleMatch[1].toLowerCase();
        charClass = simpleMatch[2].toLowerCase();
      }
    }
  }

  const unitNoun = extractUnitNounFromTitle(title);

  if (isUnit) {
    if (race && level && charClass) {
      // If level already has ordinal markers (regular or superscript), don't add more
      const hasOrdinal = /\d+(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)/.test(level);
      const ordinal = hasOrdinal ? level : `${level}${getSuperscriptOrdinal(level)}`;
      return `${subject} ${ordinal} level ${race} ${pluralizeClassNameLocal(charClass)}`.replace(/\s+/g, ' ').trim();
    }

    if (race && charClass) {
      return `${subject} ${race} ${pluralizeClassNameLocal(charClass)}`.replace(/\s+/g, ' ').trim();
    }

    if (race && unitNoun) {
      return `${subject} ${race} ${unitNoun}`.replace(/\s+/g, ' ').trim();
    }

    if (unitNoun) {
      return `${subject} ${unitNoun}`.replace(/\s+/g, ' ').trim();
    }

    if (race) {
      return `${subject} ${race} troops`.replace(/\s+/g, ' ').trim();
    }
  } else {
    if (race && level && charClass) {
      // If level already has ordinal markers (regular or superscript), don't add more
      const hasOrdinal = /\d+(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)/.test(level);
      const ordinal = hasOrdinal ? level : `${level}${getSuperscriptOrdinal(level)}`;
      return `${subject} ${ordinal} level ${race} ${charClass}`.replace(/\s+/g, ' ').trim();
    }

    if (race && charClass) {
      return `${subject} ${race} ${charClass}`.replace(/\s+/g, ' ').trim();
    }

    if (race) {
      return `${subject} ${race} character`.replace(/\s+/g, ' ').trim();
    }
  }

  if (data.raceClass) {
    return `${subject} ${data.raceClass}`.replace(/\s+/g, ' ').trim();
  }

  return isUnit ? `${subject} creatures` : `${subject} creature`;
}

// Helper function to convert coins to "# in coin" format or preserve multi-currency
function formatCoinsForTreasure(coins: string): string {
  if (!coins) return '';

  // If already in "# in coin" format, return as-is
  if (/in coin/i.test(coins)) {
    return coins;
  }

  // Check if multiple currency types (gp, sp, cp, pp)
  const currencyMatches = coins.match(/\d+\s*(?:gp|sp|cp|pp)/gi);
  if (currencyMatches && currencyMatches.length > 1) {
    // Multiple currencies: just normalize spacing
    return canonicalizeCoinsText(coins);
  }

  // Single currency: convert to "# in coin" format
  const match = coins.match(/(\d+(?:[–-]\d+)?)\s*(?:gp|gold)/i);
  if (match) {
    return `${match[1]} in coin`;
  }

  // Fallback: just use the normalized text
  return canonicalizeCoinsText(coins);
}

// Helper function to format jewelry with word-number conversion
function formatJewelryForTreasure(jewelry: string): string {
  if (!jewelry) return '';

  return jewelry.replace(/(\d+)\s*gold\s+worth\s+of\s+jewelry/i, (_, amount) => {
    const wordAmount = numberToWords(parseInt(amount));
    return `${wordAmount} in jewelry`;
  });
}

// Helper function to add superscript ordinals to spell levels
function formatSpellLevels(spellText: string): string {
  // Convert "0–4, 1–5, 2–4" to "0ˢᵗ–4, 1ˢᵗ–5, 2ⁿᵈ–4"
  return spellText.replace(/(\d+)(–\d+)/g, (match, level, rest) => {
    const ordinal = getSuperscriptOrdinal(level);
    return `${level}${ordinal}${rest}`;
  });
}

export function buildCanonicalParenthetical(data: ParentheticalData, isUnit: boolean, omitRace: boolean = false, useSuperscriptOrdinals: boolean = true, title?: string): string {
  const parts: string[] = [];
  const subjectPronoun = isUnit ? 'they' : 'he';
  const wearVerb = isUnit ? 'wear' : 'wears';
  const carryVerb = isUnit ? 'carry' : 'carries';
  const coinsText = data.coins ? canonicalizeCoinsText(data.coins) : undefined;
  let coinsIncludedInWeapons = false;

  // Build vital stats
  const vitalParts: string[] = [];

  // Determine if this is a non-classed creature (for Level field)
  const hasClassLevels = data.raceClass && /\d+(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s+level/i.test(data.raceClass);

  // Add Level for non-classed creatures
  if (data.level && !hasClassLevels) {
    vitalParts.push(`Level ${data.level}`);
  }

  if (data.hp) vitalParts.push(`HP ${data.hp}`);
  if (data.ac) vitalParts.push(`AC ${data.ac}`);
  if (data.disposition) {
    const normalizedDisposition = normalizeDisposition(data.disposition);
    vitalParts.push(`disposition ${normalizedDisposition.toLowerCase()}`);
  }

  if (vitalParts.length > 0) {
    let descriptorData = { ...data };

    if (data.raceClass) {
      let raceClassText = data.raceClass;

      // Convert regular ordinals to superscript for output consistency if requested
      if (useSuperscriptOrdinals) {
        // Skip conversion if this is multiclass notation (contains slash)
        if (!/\//.test(raceClassText)) {
          raceClassText = raceClassText.replace(/(\d+)(st|nd|rd|th)(\s+level)/g, (match, level, ordinal, levelText) => {
            const superscriptOrdinal = getSuperscriptOrdinal(level);
            return `${level}${superscriptOrdinal}${levelText}`;
          });
        }
      }

      if (omitRace) {
        // Extract just the class and level for canonical format
        const classLevelMatch = raceClassText.match(/(\d+(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s+level\s+[a-z-]+s?)/i);
        raceClassText = classLevelMatch ? classLevelMatch[0] : raceClassText;
      }

      descriptorData = { ...descriptorData, raceClass: raceClassText };
    }

    const descriptor = buildDescriptorFromData(descriptorData, isUnit, title);
    const possessive = formatPossessiveDescriptor(descriptor, isUnit);
    parts.push(`${possessive} vital stats are ${vitalParts.join(', ')}`);
  }

  // Add primary attributes
  if (data.attributes) {
    const normalizedAttrs = normalizeAttributes(data.attributes, {
      isUnit,
      raceClassText: data.raceClass,
      levelText: data.level
    });

    if (normalizedAttrs.type === 'list' && normalizedAttrs.value) {
      const possessive = isUnit ? 'Their' : 'His';
      parts.push(`${possessive} primary attributes are ${normalizedAttrs.value}`);
    } else if (normalizedAttrs.type === 'prime' && normalizedAttrs.value) {
      // For non-classed creatures and units, capitalize pronoun as it starts a new sentence
      const pronoun = isUnit ? 'Their' : (hasClassLevels ? 'His' : 'Their');
      parts.push(`${pronoun} primary attributes are ${normalizedAttrs.value}`);
    }
  }

  // Add equipment
  let hasWeapons = false;
  let hasArmor = false;

  if (data.equipment) {
    let equipment = data.equipment;
    equipment = canonicalizeShields(equipment);
    equipment = repositionMagicItemBonuses(equipment);
    equipment = deduplicateEquipment(equipment);

    // Split equipment into armor/clothing (wear) and weapons/items (carry)
    // Handle both comma and "and" separators
    const equipmentParts = equipment
      .split(/[,]/)
      .flatMap(part => part.split(/\s+and\s+/))
      .map(part => part.trim())
      .filter(Boolean);
    const armorItems: string[] = [];
    const weaponItems: string[] = [];

    equipmentParts.forEach(part => {
      // Skip coin references - they'll be handled separately in the coins section
      if (/\b\d+[–-]\d+\s*(?:gp|sp|cp|pp|gold|silver|copper|platinum)|\b\d+\s*(?:gp|sp|cp|pp|gold|silver|copper|platinum)\b/i.test(part)) {
        return;
      }

      // Process magic items
      let processedPart = applyNameMappings(part);

      if (/\+\d+|staff of|sword of|ring of|robe of|cloak of|boots of|gauntlets of|helm of|bracers of|pectoral of/i.test(processedPart)) {
        processedPart = addMagicItemMechanics(processedPart);
      }

      processedPart = processedPart.replace(/^(?:and\s+)?(?:they|he|she|it)\s+/i, '');
      processedPart = processedPart.replace(/^(?:and\s+)?(?:wears|wear|carries|carry)\s+/i, '');

      // For units, pluralize items (do this before italicization)
      if (isUnit) {
        processedPart = pluralizeEquipmentItem(processedPart);
      }

      // Only italicize magical items, not mundane equipment
      // Magical items have: +X bonuses, "of" construction, or are already processed with mechanics
      const isMagicalItem = /\+\d+|—|staff of|sword of|ring of|robe of|cloak of|boots of|gauntlets of|helm of|bracers of|pectoral of|wand of|bow of|dagger of|mace of|axe of/i.test(processedPart);
      if (isMagicalItem) {
        processedPart = `*${processedPart}*`;
      }

      // Categorize items
      if (/\b(shirt|shirts|mail|armor|armors|robe|robes|cloak|cloaks|boots|gauntlets|helm|helms|bracers|leather|leathers|leather\s+armor|chain\s+mail|plate\s+mail|scale\s+mail|banded\s+mail)\b/i.test(processedPart)) {
        armorItems.push(processedPart);
      } else {
        weaponItems.push(processedPart);
      }
    });

    hasWeapons = weaponItems.length > 0;
    hasArmor = armorItems.length > 0;

    // Build equipment sentences
    const capitalizedPronoun = isUnit ? 'They' : 'He';
    const equipmentSentences: string[] = [];
    if (armorItems.length > 0) {
      // Build armor list with Oxford comma
      let armorList = '';
      if (armorItems.length === 1) {
        armorList = armorItems[0];
      } else if (armorItems.length === 2) {
        armorList = `${armorItems[0]} and ${armorItems[1]}`;
      } else {
        // Multiple items: use Oxford comma
        const allButLast = armorItems.slice(0, -1);
        const last = armorItems[armorItems.length - 1];
        armorList = `${allButLast.join(', ')}, and ${last}`;
      }
      equipmentSentences.push(`${capitalizedPronoun} ${wearVerb} ${armorList}`);
    }
    if (weaponItems.length > 0) {
      // Build weapon list with proper conjunctions
      let weaponList = '';
      if (weaponItems.length === 1) {
        weaponList = weaponItems[0];
      } else if (weaponItems.length === 2) {
        weaponList = `${weaponItems[0]} and ${weaponItems[1]}`;
      } else {
        // Multiple items: use Oxford comma
        const allButLast = weaponItems.slice(0, -1);
        const last = weaponItems[weaponItems.length - 1];
        weaponList = `${allButLast.join(', ')}, and ${last}`;
      }

      // Add coins with proper conjunction
      if (coinsText) {
        const formattedCoins = formatCoinsForTreasure(coinsText);
        weaponList += `, and ${formattedCoins}`;
        coinsIncludedInWeapons = true;
      }

      equipmentSentences.push(`${armorItems.length > 0 ? `and ${carryVerb}` : `${capitalizedPronoun} ${carryVerb}`} ${weaponList}`);
    }

    if (equipmentSentences.length > 0) {
      parts.push(equipmentSentences.join(' '));
    }
  }

  // Add secondary skills (comes before significant attributes per template)
  if (data.secondarySkills) {
    const possessive = isUnit ? 'Their' : 'His';
    parts.push(`${possessive} secondary skill is ${data.secondarySkills}`);
  }

  // Add significant attributes
  if (data.significantAttributes) {
    const possessive = isUnit ? 'Their' : 'His';
    parts.push(`${possessive} significant attributes are ${data.significantAttributes}`);
  }

  // Add spells
  if (data.spells) {
    const pronounSubject = isUnit ? 'They' : 'He';
    let spellText = data.spells;
    // Clean up the spell text if it starts with unnecessary words
    spellText = spellText.replace(/^(?:the\s+following\s+number\s+of\s+|following\s+)?(cleric\s+|wizard\s+|magic.user\s+)?spells?\s+per\s+day:\s*/i, '');
    // Add superscript ordinals to spell levels
    spellText = formatSpellLevels(spellText);
    parts.push(`${pronounSubject} can cast the following number of spells per day: ${spellText}`);
  }

  // Formation details are now included within equipment descriptions

  // Handle jewelry and coins together when no weapons present
  const jewelryText = data.jewelry ? formatJewelryForTreasure(data.jewelry) : undefined;
  const formattedCoinsText = data.coins ? formatCoinsForTreasure(data.coins) : undefined;
  const capitalizedPronoun = isUnit ? 'They' : 'He';

  // Merge jewelry and coins into single carry clause when no weapons
  if (jewelryText && formattedCoinsText && !hasWeapons && !coinsIncludedInWeapons) {
    // Both jewelry and coins: combine into single sentence
    const prefix = hasArmor || hasWeapons ? capitalizedPronoun : capitalizedPronoun;
    parts.push(`${prefix} ${carryVerb} ${formattedCoinsText} and ${jewelryText}`);
  } else if (jewelryText) {
    // Only jewelry
    const prefix = hasWeapons || hasArmor ? capitalizedPronoun : capitalizedPronoun;
    parts.push(`${prefix} ${carryVerb} ${jewelryText}`);
  } else if (formattedCoinsText && !hasWeapons && !coinsIncludedInWeapons) {
    // Only coins (no weapons, coins not already included)
    const prefix = hasArmor || hasWeapons ? capitalizedPronoun : capitalizedPronoun;
    parts.push(`${prefix} ${carryVerb} ${formattedCoinsText}`);
  }

  if (parts.length === 0) {
    return '';
  }

  // Join parts with periods between sentences (per template structure)
  // Each major section becomes its own sentence
  const sentences: string[] = [];
  let currentSentence: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Check if this part starts with a capital letter (new sentence)
    const startsWithCapital = /^[A-Z]/.test(part);

    if (startsWithCapital && currentSentence.length > 0) {
      // Finish previous sentence and start new one
      sentences.push(currentSentence.join(', '));
      currentSentence = [part];
    } else if (startsWithCapital) {
      // First part or continuing after a completed sentence
      currentSentence.push(part);
    } else {
      // Part of current sentence
      currentSentence.push(part);
    }
  }

  // Add final sentence
  if (currentSentence.length > 0) {
    sentences.push(currentSentence.join(', '));
  }

  // Join sentences with periods
  const result = sentences.join('. ');
  return result.endsWith('.') ? result : result + '.';
}

function formatPossessiveDescriptor(descriptor: string, isPlural: boolean): string {
  const trimmed = descriptor.trim();
  const apostrophe = '’';

  if (!trimmed) {
    return isPlural ? `These creatures${apostrophe}` : `This creature${apostrophe}s`;
  }

  const lowerTrimmed = trimmed.toLowerCase();
  if (isPlural) {
    return lowerTrimmed.endsWith('s') ? `${trimmed}${apostrophe}` : `${trimmed}${apostrophe}s`;
  }

  return `${trimmed}${apostrophe}s`;
}

export function formatMountBlock(mountBlock: MountBlock): string {
  const parts: string[] = [];
  if (mountBlock.level) parts.push(`Level ${mountBlock.level}`);
  if (mountBlock.hp) parts.push(`HP ${mountBlock.hp}`);
  if (mountBlock.ac) parts.push(`AC ${mountBlock.ac}`);
  if (mountBlock.disposition) {
    const normalizedDisposition = normalizeDisposition(mountBlock.disposition);
    parts.push(`disposition ${normalizedDisposition}`);
  }
  if (mountBlock.attacks) parts.push(`It attacks with ${mountBlock.attacks}`);
  if (mountBlock.equipment) parts.push(`It wears ${mountBlock.equipment}`);

  const apostrophe = '’';
  const vitalStats = parts.length > 0
    ? `This creature${apostrophe}s vital stats are ${parts.join(', ')}.`
    : `This creature${apostrophe}s vital stats are unavailable.`;

  return `**${mountBlock.name.charAt(0).toUpperCase() + mountBlock.name.slice(1)} (mount)** *(${vitalStats})*`;
}
