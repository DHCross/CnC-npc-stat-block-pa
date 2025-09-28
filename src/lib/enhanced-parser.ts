// Enhanced NPC Parser with Jeremy's normalization rules
// Implements parenthetical extraction, mount handling, shield canonicalization, etc.

export interface ParentheticalData {
  hp?: string;
  ac?: string;
  disposition?: string;
  raceClass?: string;
  level?: string;
  attributes?: string;
  equipment?: string;
  spells?: string;
  mountData?: string;
  coins?: string;
  originalPronoun?: string; // Track original "these", "this", etc. to avoid duplication
  raw: string;
}

export interface ParsedTitleAndBody {
  title: string;
  body: string;
  parentheticals: string[];
}

import { addMagicItemMechanics } from './name-mappings';

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

  normalized = normalized.replace(/(\d+)\s*[–-]\s*(\d+)/g, (_, start, end) => {
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    return `${numberToWords(startNum)} to ${numberToWords(endNum)}`;
  });

  normalized = normalized.replace(/\b(\d+)\b/g, (_, value) => numberToWords(parseInt(value, 10)));

  return normalized;
}

// Helper function to get superscript ordinal
function getSuperscriptOrdinal(num: string): string {
  const n = parseInt(num);
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

// Corrected shield/buckler regex from earlier bug fix
const BP_RE = /\b(?:(\+\s*\d+)\s*)?(?:an?\s+)?(?:(?:wooden|steel|iron)\s+)?(buckler|pavis|shield)(?:\s+shield)?(?:\s*(\+\s*\d+))?/gi;

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
    attrMatch = /(?:prime\s+attributes?\s+are|attributes?\s+are)[:\s]*([^.;]+?)(?:\.|They|$)/i.exec(parenthetical);
  }
  if (!attrMatch) {
    // Try without "primary/prime/PA" qualifier
    attrMatch = /(?:his|their|its)\s+(?:primary\s+)?attributes?\s+are\s+([^.;,]+)/i.exec(parenthetical);
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

  // Extract equipment - preserve verb structure when possible
  let equipMatch = /(?:EQ|equipment)[\s:-]+([^.;]+)/i.exec(parenthetical);
  if (equipMatch) {
    data.equipment = equipMatch[1].trim();
  } else {
    // Try to capture equipment items only (without verbs)
    equipMatch = /(?:they\s+wear|wears?|they\s+carry|carries?|wields?)\s+([^.]+?)(?:\.|\s*$)/i.exec(parenthetical);
    if (equipMatch) {
      data.equipment = equipMatch[1].trim();
    } else {
      // Try "have" verb pattern
      equipMatch = /(?:they\s+(?:each\s+)?have|has?)\s+([^.]+?)(?:\.|\s*$)/i.exec(parenthetical);
      if (equipMatch) {
        data.equipment = equipMatch[1].trim();
      } else {
        // Fallback: simple equipment list
        equipMatch = /(?:carries?|wields?|they\s+wear|wears?)\s*[:-]?\s*([^.]+?)(?:\.|\s*$)/i.exec(parenthetical);
        if (equipMatch) {
          data.equipment = equipMatch[1].trim();
        }
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
        data.coins = '1–6 gold in coin';
      } else if (level <= 3) {
        data.coins = `${level}–${level * 6} gold in coin`;
      }
    }
  }

  // Extract coins with multiple pattern variations
  const coinMatch = /(\d+)[-–](\d+)\s*(?:gp|gold|GP)/i.exec(parenthetical);
  if (coinMatch) {
    data.coins = `${coinMatch[1]}–${coinMatch[2]} gold in coin`;
  } else {
    // Extract all currency mentions from parenthetical
    const currencyPattern = /(\d+)\s*(gp|sp|cp|pp|gold|silver|copper|platinum)\b/gi;
    const currencies: string[] = [];
    let match;
    while ((match = currencyPattern.exec(parenthetical)) !== null) {
      const amount = match[1];
      const type = match[2].toLowerCase();

      switch (type) {
        case 'gp':
        case 'gold':
          currencies.push(`${amount} gold in coin`);
          break;
        case 'sp':
        case 'silver':
          currencies.push(`${amount} silver in coin`);
          break;
        case 'cp':
        case 'copper':
          currencies.push(`${amount} copper in coin`);
          break;
        case 'pp':
        case 'platinum':
          currencies.push(`${amount} platinum in coin`);
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
    'true neutral': 'neutral/neutral',
    'neutral': 'neutral',
    'neutral evil': 'neutral/evil',
    'chaotic good': 'chaos/good',
    'chaotic neutral': 'chaos/neutral',
    'chaotic evil': 'chaos/evil',
    'lawful': 'law/neutral',
    'chaotic': 'chaos/neutral'
  };
  return mapping[trimmed] ?? disposition.trim();
}

export function normalizeAttributes(attributes: string, isUnit: boolean): string {
  if (isUnit && /\b(str|dex|con|strength|dexterity|constitution|physical)\b/i.test(attributes)) {
    // For units with physical attributes, return just "physical"
    return 'physical';
  }

  // Expand abbreviations for individual NPCs
  const abbrevMap: Record<string, string> = {
    'str': 'strength',
    'int': 'intelligence',
    'wis': 'wisdom',
    'dex': 'dexterity',
    'con': 'constitution',
    'cha': 'charisma'
  };

  // Parse and normalize to PHB order per Jeremy's mandate
  const phbOrder = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

  const attrs = attributes.toLowerCase()
    .split(/[,\s]+/)
    .map(attr => abbrevMap[attr.trim()] || attr.trim())
    .filter(Boolean)
    .filter(attr => phbOrder.includes(attr))
    .sort((a, b) => phbOrder.indexOf(a) - phbOrder.indexOf(b));

  return attrs.join(', ');
}

export function canonicalizeShields(equipment: string): string {
  // Jeremy's mandate: explicit shield type (size + material) per editorial standards
  let result = equipment;

  // First pass: Handle bonus shields - preserve material if specified
  result = result.replace(/\+(\d+)\s+(wooden|steel|iron)?\s*shield/gi, (match, bonus, material) => {
    const mat = material || 'steel';
    return `medium ${mat} shield +${bonus}`;
  });

  // Second pass: Handle material-only shields (add size)
  result = result.replace(/\b(wooden|steel|iron)\s+shield(?!\s*\+)/gi, 'medium $1 shield');

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
  const match = title.toLowerCase().match(/(men-at-arms|militia|warriors|halflings|bowmen|guards|sergeants|fighters|troops)/);
  return match?.[1];
}

function buildDescriptorFromData(data: ParentheticalData, isUnit: boolean, title?: string): string {
  const subject = isUnit ? 'These' : 'This';
  let race: string | undefined;
  let level: string | undefined;
  let charClass: string | undefined;

  if (data.raceClass) {
    const match = data.raceClass.match(/([a-z-]+),\s*(\d+)(?:st|nd|rd|th|ˢᵗ|ⁿᵈ|ʳᵈ|ᵗʰ)?\s+level\s+([a-z-]+)/i);
    if (match) {
      race = match[1].toLowerCase();
      level = match[2];
      charClass = match[3].toLowerCase();
    } else {
      const simpleMatch = data.raceClass.match(/([a-z-]+)\s+([a-z-]+)/i);
      if (simpleMatch) {
        race = simpleMatch[1].toLowerCase();
        charClass = simpleMatch[2].toLowerCase();
      }
    }
  }

  const unitNoun = extractUnitNounFromTitle(title);

  if (isUnit) {
    if (race && level && charClass) {
      const ordinal = `${level}${getSuperscriptOrdinal(level)}`;
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
      const ordinal = `${level}${getSuperscriptOrdinal(level)}`;
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

export function buildCanonicalParenthetical(data: ParentheticalData, isUnit: boolean, omitRace: boolean = false, useSuperscriptOrdinals: boolean = true): string {
  const parts: string[] = [];
  const subjectPronoun = isUnit ? 'they' : 'he';
  const wearVerb = isUnit ? 'wear' : 'wears';
  const carryVerb = isUnit ? 'carry' : 'carries';
  const coinsText = data.coins ? canonicalizeCoinsText(data.coins) : undefined;
  let coinsIncludedInWeapons = false;

  // Build vital stats
  const vitalParts: string[] = [];
  if (data.hp) vitalParts.push(`HP ${data.hp}`);
  if (data.ac) vitalParts.push(`AC ${data.ac}`);
  if (data.disposition) vitalParts.push(`disposition ${data.disposition.toLowerCase()}`);

  if (vitalParts.length > 0) {
    let descriptorData = { ...data };

    if (data.raceClass) {
      let raceClassText = data.raceClass;

      // Convert regular ordinals to superscript for output consistency if requested
      if (useSuperscriptOrdinals) {
        raceClassText = raceClassText.replace(/(\d+)(st|nd|rd|th)(\s+level)/g, (match, level, ordinal, levelText) => {
          const superscriptOrdinal = getSuperscriptOrdinal(level);
          return `${level}${superscriptOrdinal}${levelText}`;
        });
      }

      if (omitRace) {
        // Extract just the class and level for canonical format
        const classLevelMatch = raceClassText.match(/(\d+(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s+level\s+[a-z-]+s?)/i);
        raceClassText = classLevelMatch ? classLevelMatch[0] : raceClassText;
      }

      descriptorData = { ...descriptorData, raceClass: raceClassText };
    }

    const descriptor = buildDescriptorFromData(descriptorData, isUnit);
    const possessive = formatPossessiveDescriptor(descriptor, isUnit);
    parts.push(`${possessive} vital stats are ${vitalParts.join(', ')}`);
  }

  // Add primary attributes
  if (data.attributes) {
    const normalizedAttrs = normalizeAttributes(data.attributes, isUnit);
    if (isUnit) {
      // For units, expand to full sentence
      parts.push(`their primary attributes are ${normalizedAttrs === 'PA physical' ? 'physical' : normalizedAttrs}`);
    } else {
      // For individuals, add as separate clause
      const possessive = 'his';
      parts.push(`${possessive} primary attributes are ${normalizedAttrs}`);
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
      // Process magic items
      let processedPart = part;
      if (/\+\d+|staff of|sword of|ring of|robe of|cloak of|boots of|gauntlets of|helm of|bracers of|pectoral of/i.test(part)) {
        processedPart = addMagicItemMechanics(part);
      }

      processedPart = processedPart.replace(/^(?:and\s+)?(?:they|he|she|it)\s+/i, '');
      processedPart = processedPart.replace(/^(?:and\s+)?(?:wears|wear|carries|carry)\s+/i, '');

      // For units, pluralize items
      if (isUnit) {
        processedPart = pluralizeEquipmentItem(processedPart);
      }

      // Categorize items
      if (/\b(shirt|shirts|mail|armor|armors|robe|robes|cloak|cloaks|boots|gauntlets|helm|helms|bracers|leather\s+armor|chain\s+mail|plate\s+mail|scale\s+mail|banded\s+mail)\b/i.test(processedPart)) {
        armorItems.push(processedPart);
      } else {
        weaponItems.push(processedPart);
      }
    });

    hasWeapons = weaponItems.length > 0;
    hasArmor = armorItems.length > 0;

    // Build equipment sentences
    const equipmentSentences: string[] = [];
    if (armorItems.length > 0) {
      equipmentSentences.push(`${subjectPronoun} ${wearVerb} ${armorItems.join(', ')}`);
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
        weaponList += `, and carry ${coinsText}`;
        coinsIncludedInWeapons = true;
      }

      equipmentSentences.push(`${armorItems.length > 0 ? 'and ' : `${subjectPronoun} `}${carryVerb} ${weaponList}`);
    }

    if (equipmentSentences.length > 0) {
      parts.push(equipmentSentences.join(' '));
    }
  }

  // Handle coins if no weapons (coins already added to weapons above)
  if (coinsText && !hasWeapons && !coinsIncludedInWeapons) {
    if (hasArmor) {
      // If only armor, create carry sentence for coins
      parts.push(`and ${carryVerb} ${coinsText}`);
    } else {
      // No equipment, just coins
      parts.push(`${subjectPronoun} ${carryVerb} ${coinsText}`);
    }
  }

  if (parts.length === 0) {
    return '';
  }

  // Smart joining: detect when we need periods between independent clauses
  const joinedParts: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const currentPart = parts[i];
    const nextPart = i < parts.length - 1 ? parts[i + 1] : null;

    // Check if current part is a complete sentence about attributes and next part starts with a pronoun
    const isAttributeSentence = currentPart.includes('primary attributes are');
    const nextStartsWithPronoun = nextPart && /^(he|she|they|it)\s/.test(nextPart);
    const isUnitAttributeSentence = currentPart.includes('their primary attributes are');

    if (isAttributeSentence && nextStartsWithPronoun && isUnitAttributeSentence) {
      // Add period after complete attribute sentence before independent equipment clause (units only)
      joinedParts.push(currentPart + '.');
    } else {
      joinedParts.push(currentPart);
    }
  }

  return `${joinedParts.join(', ')}.`;
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
  if (mountBlock.disposition) parts.push(`disposition ${mountBlock.disposition}`);
  if (mountBlock.attacks) parts.push(`It attacks with ${mountBlock.attacks}`);
  if (mountBlock.equipment) parts.push(`It wears ${mountBlock.equipment}`);

  const apostrophe = '’';
  const vitalStats = parts.length > 0
    ? `This creature${apostrophe}s vital stats are ${parts.join(', ')}.`
    : `This creature${apostrophe}s vital stats are unavailable.`;

  return `**${mountBlock.name.charAt(0).toUpperCase() + mountBlock.name.slice(1)} (mount)** *(${vitalStats})*`;
}
