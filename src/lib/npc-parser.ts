// --- Flexible helpers for robust parsing ---

export function findName(text: string): string {
  // bold heading or first line
  const m = text.match(/\*\*([^*]+)\*\*/);
  if (m) {
    return m[1].trim();
  }
  return text.trim().split('\n')[0];
}

export function parseRaceClassLevel(text: string): { race: string; level: string; charClass: string } {
  // Look for "Race & Class: human, 16th level cleric" format first
  let m = text.match(/Race & Class:\s*(\w+),\s*(\d{1,2})(?:st|nd|rd|th)?\s*level\s*(\w+)/i);
  
  if (!m) {
    // Fallback to general patterns like "16th level cleric" or "human, 16th level cleric"
    m = text.match(/(?:(\w+),\s*)?(\d{1,2})(?:st|nd|rd|th)?\s*level\s*(\w+)/i);
    if (m) {
      const [, possibleRace, level, charClass] = m;
      const race = possibleRace || 'human'; // Default to human if race not specified
      return { race: race.toLowerCase(), level, charClass: charClass.toLowerCase() };
    }
  } else {
    const [, race, level, charClass] = m;
    return { race: race.toLowerCase(), level, charClass: charClass.toLowerCase() };
  }
  
  return { race: 'human', level: '1', charClass: 'unknown' };
}

export function findDisposition(text: string): string {
  const m = text.match(/(?:Disposition|Alignment)[^:]*[:\-]\s*([\w/]+)/i);
  return m ? m[1].toLowerCase() : 'unknown';
}

export function findHpAc(text: string): [string, string] {
  const hp = text.match(/HP.*?(\d+)/i) || text.match(/Hit Points.*?(\d+)/i);
  const ac = text.match(/AC.*?([0-9/]+)/i) || text.match(/Armor Class.*?([0-9/]+)/i);
  return [hp ? hp[1] : '?', ac ? ac[1] : '?'];
}

export function findPrimes(text: string): string {
  const m = text.match(/Prime.*?([A-Za-z, ]+)/i);
  return m ? m[1].trim() : '?';
}

export function findEquipment(text: string): string {
  // First try to find italicized items (*item*)
  let eq = text.match(/\*([^*]+)\*/g);
  
  if (!eq) {
    // Look for Equipment: line
    const m = text.match(/(?:Equipment|EQ)[^:]*[:\-]\s*([^\n]+)/i);
    if (m) {
      const equipmentLine = m[1].trim();
      eq = equipmentLine.split(',').map(e => e.trim());
    }
  } else {
    // Remove asterisks from italicized items
    eq = eq.map(item => item.replace(/\*/g, '').trim());
  }
  
  if (eq && eq.length > 0) {
    // Auto-italicize magic items (items with +/- bonuses or obvious magic names)
    const italicizedEq = eq.map(item => {
      const trimmed = item.trim();
      if (!trimmed) return '';
      
      // Check if item has magical indicators
      const hasMagicalBonus = /[+-]\d+/.test(trimmed);
      const hasMagicalKeywords = /\b(?:staff of|wand of|ring of|cloak of|boots of|gauntlets of|helm of|amulet of|potion of|scroll of|sword of|armor of|shield of|pectoral of|circlet of|bracers of|rod of|orb of|crystal of|robe of|girdle of|belt of|bag of|deck of|carpet of|broom of|pearl of|gem of|stone of|crown of|diadem of|scepter of|medallion of|talisman of|charm of|phylactery of|periapt of|scarab of|ioun|vorpal|holy|unholy|blessed|cursed|enchanted|magical|mystic|arcane|divine|eldritch)\b/i.test(trimmed);
      
      if (hasMagicalBonus || hasMagicalKeywords) {
        return `*${trimmed}*`;
      }
      return trimmed;
    }).filter(item => item.length > 0);
    
    return italicizedEq.join(', ');
  }
  return 'none';
}

export function findSpells(text: string): string {
  // match both "0–6" and "0-level: 6"
  const slots = text.match(/(\d+)(?:st|nd|rd|th)?(?:–|[- ]level[:\-])\s*(\d+)/gi);
  return slots ? slots.map(slot => {
    const parts = slot.match(/(\d+)(?:st|nd|rd|th)?(?:–|[- ]level[:\-])\s*(\d+)/i);
    return parts ? `${parts[1]}:${parts[2]}` : slot;
  }).join(', ') : '?';
}

export function findMount(text: string): string {
  if (text.match(/war horse/i)) {
    return 'rides a heavy war horse';
  }
  if (text.match(/mount.*?:\s*none/i)) {
    return 'no mount';
  }
  return 'mount unknown';
}

function getOrdinalSuffix(level: string): string {
  const num = parseInt(level);
  if (num >= 11 && num <= 13) return 'ᵗʰ';
  
  const lastDigit = num % 10;
  switch (lastDigit) {
    case 1: return 'ˢᵗ';
    case 2: return 'ⁿᵈ';
    case 3: return 'ʳᵈ';
    default: return 'ᵗʰ';
  }
}

function getPrimaryAttributesText(primes: string): string {
  if (!primes || primes === '?') return '';
  
  // Clean up the attributes and make them lowercase
  const attributes = primes.split(',').map(attr => attr.trim().toLowerCase());
  
  if (attributes.length === 1) {
    return `His primary attribute is ${attributes[0]}`;
  } else if (attributes.length === 2) {
    return `His primary attributes are ${attributes.join(' and ')}`;
  } else {
    const lastAttr = attributes.pop();
    return `His primary attributes are ${attributes.join(', ')}, and ${lastAttr}`;
  }
}

function getEquipmentText(equipment: string): string {
  if (!equipment || equipment === 'none') return '';
  
  // Split the equipment and properly format it
  const items = equipment.split(',').map(item => item.trim()).filter(item => item);
  
  if (items.length === 0) return '';
  if (items.length === 1) return `He carries ${items[0]}`;
  if (items.length === 2) return `He carries ${items[0]} and ${items[1]}`;
  
  // For multiple items, use proper comma formatting
  const lastItem = items.pop();
  return `He carries ${items.join(', ')}, and ${lastItem}`;
}

function getSpellsText(spells: string): string {
  if (!spells || spells === '?') return '';
  
  // Convert "0:6, 1:6, 2:5" format to "0–6, 1st–6, 2nd–5" format
  const spellLevels = spells.split(',').map(spell => {
    const parts = spell.trim().split(':');
    if (parts.length === 2) {
      const level = parts[0].trim();
      const count = parts[1].trim();
      
      if (level === '0') {
        return `0–${count}`;
      } else {
        const ordinal = getSpellLevelOrdinal(level);
        return `${ordinal}–${count}`;
      }
    }
    return spell.trim();
  });
  
  return `He can cast the following number of spells per day: ${spellLevels.join(', ')}`;
}

function getSpellLevelOrdinal(level: string): string {
  const num = parseInt(level);
  switch (num) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    default: return `${num}th`;
  }
}

function findMountDetails(text: string): string | null {
  // Check if there's mount information
  if (!text.match(/(?:mount|horse|rides)/i)) {
    return null;
  }
  
  // For now, return a basic warhorse template if a mount is mentioned
  if (text.match(/(?:war horse|heavy war horse)/i)) {
    return `He rides a warhorse with the following statistics:\n\nWarhorse (This creature's vital stats are Level 4(1d10), HP 35, AC 19, disposition neutral. It makes two hoof attacks for 1d4 damage each, or one overbearing attack. The horse is outfitted with chainmail barding.)`;
  }
  
  return null;
}

// --- Main function ---

export function collapseNPCEntry(longText: string): string {
  const name = findName(longText);
  const { race, level, charClass } = parseRaceClassLevel(longText);
  const disposition = findDisposition(longText);
  const [hp, ac] = findHpAc(longText);
  const primes = findPrimes(longText);
  const equipment = findEquipment(longText);
  const spells = findSpells(longText);
  const mountInfo = findMountDetails(longText);

  // Build the narrative sentence following the Victor Oldham format
  let result = `${name} (This ${level}${getOrdinalSuffix(level)} level ${race} ${charClass}'s vital stats are HP ${hp}, AC ${ac}, disposition ${disposition}.`;
  
  if (primes && primes !== '?') {
    result += ` ${getPrimaryAttributesText(primes)}.`;
  }
  
  if (equipment && equipment !== 'none') {
    result += ` ${getEquipmentText(equipment)}.`;
  }
  
  if (spells && spells !== '?') {
    result += ` ${getSpellsText(spells)}.`;
  }
  
  result += ')';
  
  // Add mount information if present
  if (mountInfo) {
    result += `\n\n${mountInfo}`;
  }
  
  return result;
}

// --- Batch processor ---
export function processDump(dump: string): string[] {
  // Clean the input text - process exactly what the user provided
  const cleanedDump = dump.trim();
  
  // Return empty if no input
  if (!cleanedDump) {
    return [];
  }
  
  // Skip if it's clearly code or non-NPC content
  if (isCodeContent(cleanedDump)) {
    return [];
  }
  
  // Check if it has NPC indicators
  if (!hasNPCIndicators(cleanedDump)) {
    return [];
  }
  
  // Process as single NPC - no auto-splitting
  try {
    const result = collapseNPCEntry(cleanedDump);
    return [result];
  } catch (error) {
    console.error('Error processing NPC:', error);
    return [];
  }
}

function isCodeContent(text: string): boolean {
  // Skip blocks that look like code or comments
  return text.startsWith('#') || 
         text.startsWith('def ') || 
         text.startsWith('import ') ||
         text.startsWith('from ') ||
         text.includes('def ') ||
         text.includes('return ') ||
         /^\s*[\w_]+\s*=/.test(text) ||
         text.includes('"""') ||
         text.includes("'''") ||
         text.includes('```') ||
         /^\s*\/\//.test(text) || // JavaScript comments
         /^\s*\/\*/.test(text);   // CSS/JS block comments
}

function hasNPCIndicators(text: string): boolean {
  // Must have some indication it's an NPC stat block
  const hasName = /\*\*[^*]+\*\*/.test(text); // Bold name
  const hasStatBlock = /(?:Race & Class|Disposition|Hit Points|Armor Class|Prime Attributes|Equipment)/i.test(text);
  const hasLevelClass = /\d+(?:st|nd|rd|th)?\s*level\s+\w+/i.test(text);
  const hasHPAC = /(?:HP|AC)\s*[:=]\s*\d+/i.test(text) || /Hit Points.*?\d+/i.test(text) || /Armor Class.*?\d+/i.test(text);
  
  // Require either a bold name with some stats, OR a good combination of stat block indicators
  return (hasName && (hasStatBlock || hasLevelClass || hasHPAC)) || 
         (hasStatBlock && hasLevelClass && hasHPAC);
}

export function generateNPCTemplate(): string {
  return `**NPC Name, Full Honorific and Office (if applicable)**
*   **Formal Address:** [This section provides the character's formal title for address, e.g., "His Supernal Devotion"].
*   **Disposition:** [Describes the character's basic worldview and moral outlook, replacing "alignment." It should be formatted as nouns, such as "law/good," "chaos/evil," or a single word like "neutral."].
*   **Race:** [The character's race (e.g., human, elf, dwarf).].
*   **Level and Class:** [The character's level and class, with the race listed first (e.g., "human, **1^st^ level fighter**"). Character levels should use superscript outside of italicized stat blocks and be bolded.].
*   **Vital Statistics:**
    *   **Hit Points (HP):** [The total sum of the character's hit points. For classed NPCs, this is a sum rather than a dice equation.].
    *   **Armor Class (AC):** [The character's Armor Class, typically presented as base/magical AC (e.g., 13/22).].
*   **Prime Attributes (PA):** [Lists the character's prime attributes, spelled out in the *Player's Handbook* order: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma.].
*   **Significant Attributes (Optional):** [Any attribute score over 12 or below 9, noted here if applicable.]
*   **Equipment (EQ):** [Lists all equipment. Magic items, including their numerical bonuses, are **italicized** (e.g., a *longsword +1*). A brief mechanical explanation should be included for any magic item not obvious or found in a core rulebook.].
*   **Spells:** [For spellcasters, this lists the number of spells available per spell level in a numeric spread (e.g., "0-level: X, 1st-level: X, 2nd-level: X..."). Individual spell names are generally *not* listed unless they are absolutely essential to a specific encounter's design, otherwise, the Castle Keeper determines them.].

**Mount Name (if applicable)**
*   **Vital Statistics:** [The mount's Hit Dice (HD), Hit Points (HP), and Armor Class (AC) (e.g., HD 4d10, HP 35, AC 19).].
*   **Disposition:** [The mount's basic worldview and moral outlook (e.g., neutral).].
*   **Primary Attributes (PA):** [The mount's primary attributes, spelled out (e.g., strength, constitution, dexterity).].
*   **Attacks:** [Describes the mount's attacks, including damage (e.g., "two hoof attacks for 1–4 damage each, or one overbearing attack"). Standardized terminology like "overbearing attack" is used.].
*   **Equipment:** [Any equipment the mount is outfitted with (e.g., chain mail barding).].

**Role/Background (Optional, but recommended for detailed NPCs)**
*   [Provides narrative context, such as the character's residence, their role in society, their influence over civic matters, and their income. Coinage should be spelled out (e.g., "gold," "silver") rather than abbreviated.].`;
}