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
const HP_RE = /\b(?:HP|Hit\s*Points)\s*[:\-]?\s*(\d+)\b/i;
const AC_RE = /\bAC\s*[:\-]?\s*([\d\/]+)\b/i;
const RCL_RE = /\b(?:(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s*level\s+([a-z-]+)\s+([a-z-]+)s?|(human|elf|dwarf|halfling|gnome|orc|goblin),\s*(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s*level\s+([a-z-]+)s?)\b/i;
const DISPOSITION_RE = /\b(disposition|alignment)\s*[:\-]?\s*([a-z\s]+(?:\/[a-z\s]+)?)\b/i;
const MOUNT_TYPE_RE = /\b(heavy|light)?\s*war\s*horse\b/i;
const LEADING_BONUS_RE = /\+(\d+)\s+([a-z\s]+(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;

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

  return { title, body, parentheticals };
}

export function extractParentheticalData(parenthetical: string): ParentheticalData {
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
    // Handle two formats: "2nd level human fighters" or "human, 2nd level fighter"
    if (rclMatch[1]) {
      // Format: "2nd level human fighters" - groups [1]=level, [2]=race, [3]=class
      const level = rclMatch[1];
      const race = rclMatch[2];
      const charClass = rclMatch[3].replace(/s$/, ''); // Remove plural 's'
      data.raceClass = `${race}, ${level}${getSuperscriptOrdinal(level)} level ${charClass}`;
      data.level = level;
    } else if (rclMatch[4] && rclMatch[5]) {
      // Format: "human, 2nd level fighter" - groups [4]=race, [5]=level, [6]=class
      const race = rclMatch[4];
      const level = rclMatch[5];
      const charClass = rclMatch[6] ? rclMatch[6].replace(/s$/, '') : 'fighter'; // Remove plural 's', default to fighter
      data.raceClass = `${race}, ${level}${getSuperscriptOrdinal(level)} level ${charClass}`;
      data.level = level;
    }
  }

  // Also try to extract from prose that includes leading pronouns like "these 2nd level human fighters"
  if (!data.raceClass) {
    const proseMatch = /(?:these|this|the)\s+(\d+)(?:st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)?\s+level\s+([a-z-]+)\s+([a-z-]+)s?/i.exec(parenthetical);
    if (proseMatch) {
      const level = proseMatch[1];
      const race = proseMatch[2];
      const charClass = proseMatch[3].replace(/s$/, ''); // Remove plural 's'
      data.raceClass = `${race}, ${level}${getSuperscriptOrdinal(level)} level ${charClass}`;
      data.level = level;
      console.log('DEBUG: Prose match found:', { level, race, charClass, raceClass: data.raceClass });
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
  let attrMatch = /(?:primary\s+attributes?|prime\s+attributes?|PA)\s*[:\-]?\s*([^.;,]+)/i.exec(parenthetical);
  if (!attrMatch) {
    // Try without "primary/prime/PA" qualifier
    attrMatch = /(?:his|their|its)\s+(?:primary\s+)?attributes?\s+are\s+([^.;,]+)/i.exec(parenthetical);
  }
  if (!attrMatch) {
    // Try simple patterns like "STR, DEX, CON" or "strength, dexterity"
    attrMatch = /\b((?:str|dex|con|int|wis|cha|strength|dexterity|constitution|intelligence|wisdom|charisma)(?:[,\s]+(?:str|dex|con|int|wis|cha|strength|dexterity|constitution|intelligence|wisdom|charisma))*)\b/i.exec(parenthetical);
  }
  if (attrMatch) {
    data.attributes = attrMatch[1].trim();
  }

  // Extract equipment
  const equipMatch = /(?:EQ|equipment|carries?|wields?|they\s+wear|wears?)\s*[:\-]?\s*([^.;]+)/i.exec(parenthetical);
  if (equipMatch) {
    data.equipment = equipMatch[1].trim();
  }

  // Extract mount data
  if (MOUNT_TYPE_RE.test(parenthetical)) {
    // Simple mount detection - more sophisticated extraction needed
    data.mountData = parenthetical;
  }

  // Extract coins with multiple pattern variations
  let coinMatch = /(\d+)[-–](\d+)\s*(?:gp|gold|GP)/i.exec(parenthetical);
  if (coinMatch) {
    data.coins = `${coinMatch[1]}–${coinMatch[2]} gold in coin`;
  } else {
    // Try simpler patterns like "carries 10gp" or "has 5gp, 3sp"
    const simpleCoins = /(?:carries?|has?|with)\s+([^.;,]*(?:gp|sp|cp|pp|gold|silver|copper|platinum)[^.;,]*)/i.exec(parenthetical);
    if (simpleCoins) {
      let coins = simpleCoins[1];
      // Convert abbreviations
      coins = coins.replace(/(\d+)\s*gp\b/gi, '$1 gold in coin');
      coins = coins.replace(/(\d+)\s*sp\b/gi, '$1 silver in coin');
      coins = coins.replace(/(\d+)\s*cp\b/gi, '$1 copper in coin');
      coins = coins.replace(/(\d+)\s*pp\b/gi, '$1 platinum in coin');
      data.coins = coins.trim();
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
    'neutral': 'neutral/neutral',
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
    // For units with physical attributes, expand to narrative phrasing per Jeremy's mandate
    return 'strength, dexterity, constitution';
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
  result = result.replace(/\b(?:a\s+|an\s+)?shield(?!\s*\+)(?!\s+\w)/gi, 'medium steel shield');

  // Handle buckler and pavis separately (they don't need size qualifiers)
  result = result.replace(/\b(?:wooden|steel|iron)\s+(buckler|pavis)/gi, '$1');

  return result;
}

export function repositionMagicItemBonuses(equipment: string): string {
  return equipment.replace(LEADING_BONUS_RE, (match, bonus, item) => {
    return `${item} +${bonus}`;
  });
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
  normalized = normalized.replace(/\b(wear|wearing|worn|has on|dons?)\b\s+/gi, 'wears ');

  // Normalize weapon/gear verbs to "carries" (for weapons, tools, items)
  normalized = normalized.replace(/\b(carry|carrying|bears?|bearing|holds?|holding|wields?|wielding)\b\s+/gi, 'carries ');

  // Handle "and carry" constructions properly
  normalized = normalized.replace(/\band\s+carries?/gi, 'and carries');

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
  const mountAcMatch = /(?:war\s*horse[^.]*?AC\s*([\d\/]+))/i.exec(parenthetical);
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
    let cleaned = parenthetical
      .replace(/[,;\s]*(?:heavy|light)?\s*war\s*horse[^.;,]*/gi, '')
      .replace(/[,;\s]*(?:hoof|hooves)[^.;,]*/gi, '')
      .replace(/[,;\s]+$/, ''); // Clean trailing punctuation

    return { cleanedParenthetical: cleaned, mountBlock };
  }

  return { cleanedParenthetical: parenthetical };
}

export function buildCanonicalParenthetical(data: ParentheticalData, isUnit: boolean): string {
  const parts: string[] = [];

  // Build vital stats
  const vitalParts: string[] = [];
  if (data.hp) vitalParts.push(`HP ${data.hp}`);
  if (data.ac) vitalParts.push(`AC ${data.ac}`);
  if (data.disposition) vitalParts.push(`disposition ${data.disposition}`);

  if (vitalParts.length > 0) {
    let descriptor = '';

    if (data.raceClass) {
      if (isUnit) {
        // For units: "These 2ⁿᵈ level human fighters'"
        descriptor = `These ${data.raceClass}`;
      } else {
        // For individuals: "This human, 4th level fighter"
        descriptor = `This ${data.raceClass}`;
      }
    } else {
      // Fallback for unknown creatures
      descriptor = isUnit ? 'These creatures' : 'This creature';
    }

    parts.push(`${descriptor}'s vital stats are ${vitalParts.join(', ')}`);
  }

  // Add PA physical for units, expanded attributes for individuals
  if (data.attributes) {
    const normalizedAttrs = normalizeAttributes(data.attributes, isUnit);
    if (isUnit) {
      // For units, PA physical should be on same line as vital stats
      if (parts.length > 0) {
        parts[0] += `, ${normalizedAttrs}`;
      } else {
        parts.push(normalizedAttrs);
      }
    } else {
      // For individuals, add as separate clause
      const possessive = 'his';
      parts.push(`${possessive} primary attributes are ${normalizedAttrs}`);
    }
  }


  // Add equipment
  if (data.equipment) {
    let equipment = data.equipment;
    equipment = canonicalizeShields(equipment);
    equipment = repositionMagicItemBonuses(equipment);
    equipment = normalizeEquipmentVerbs(equipment);
    equipment = deduplicateEquipment(equipment);

    // Add magic item mechanics to equipment
    const equipmentParts = equipment.split(',').map(part => part.trim());
    const processedEquipment = equipmentParts.map(part => {
      // Check if it's a magic item and add mechanics
      if (/\+\d+|staff of|sword of|ring of|robe of|cloak of|boots of|gauntlets of|helm of|bracers of|pectoral of/i.test(part)) {
        return addMagicItemMechanics(part);
      }
      return part;
    }).join(', ');

    // Jeremy's mandate: consistent equipment verbs per entity type
    const wearVerb = isUnit ? 'wear' : 'wears';
    const carryVerb = isUnit ? 'carry' : 'carries';

    // Process equipment with proper verb forms
    if (processedEquipment.includes('wears ') || processedEquipment.includes('carries ')) {
      // Equipment already has embedded verbs, normalize them
      let normalized = processedEquipment.replace(/\bwears\b/g, wearVerb);
      normalized = normalized.replace(/\bcarries\b/g, carryVerb);
      normalized = normalized.replace(/\bcarry\b/g, carryVerb);
      parts.push(normalized);
    } else {
      // No embedded verbs, add appropriate verb
      parts.push(`${wearVerb} ${processedEquipment}`);
    }
  }

  // Add coins
  if (data.coins) {
    const carryVerb = isUnit ? 'carry' : 'carries';
    parts.push(`and ${carryVerb} ${data.coins}`);
  }

  return parts.join(', ') + '.';
}

export function formatMountBlock(mountBlock: MountBlock): string {
  const parts: string[] = [];
  if (mountBlock.level) parts.push(`Level ${mountBlock.level}`);
  if (mountBlock.hp) parts.push(`HP ${mountBlock.hp}`);
  if (mountBlock.ac) parts.push(`AC ${mountBlock.ac}`);
  if (mountBlock.disposition) parts.push(`disposition ${mountBlock.disposition}`);
  if (mountBlock.attacks) parts.push(`It attacks with ${mountBlock.attacks}`);
  if (mountBlock.equipment) parts.push(`It wears ${mountBlock.equipment}`);

  const vitalStats = parts.length > 0
    ? `This creature's vital stats are ${parts.join(', ')}.`
    : `This creature's vital stats are unavailable.`;

  return `**${mountBlock.name.charAt(0).toUpperCase() + mountBlock.name.slice(1)} (mount)** *(${vitalStats})*`;
}