export interface NPCData {
  name: string;
  raceClassLevel: string;
  disposition: string;
  hp: string;
  ac: string;
  primes: string;
  equipment: string;
  spells: string;
  mount: string;
}

export function findName(text: string): string {
  // First try to find bold names
  const boldMatch = text.match(/\*\*([^*]+)\*\*/);
  if (boldMatch) {
    return boldMatch[1].trim();
  }
  
  // Try to find structured NPC name from template format
  const structuredMatch = text.match(/^([A-Z][^*\n]+?)(?:\s*\*|$)/m);
  if (structuredMatch) {
    return structuredMatch[1].trim();
  }
  
  return text.trim().split('\n')[0];
}

export function findRaceClassLevel(text: string): string {
  // Look for structured template format with race and level/class on separate lines
  const raceMatch = text.match(/\*\s*\*\*Race:\*\*\s*\[?([^\]\n]+)\]?/i);
  const levelClassMatch = text.match(/\*\s*\*\*Level and Class:\*\*\s*\[?([^\]\n]+)\]?/i);
  
  if (raceMatch && levelClassMatch) {
    const race = raceMatch[1].trim();
    const levelClass = levelClassMatch[1].trim();
    
    // Clean up any template markers or formatting
    const cleanRace = race.replace(/\[.*?\]/g, '').trim();
    const cleanLevelClass = levelClassMatch[1].replace(/\[.*?\]/g, '').trim();
    
    // Extract level and class from the level/class field
    const levelClassParts = cleanLevelClass.match(/(\w+),\s*\*?\*?(\d+)(?:\^?[a-z]+)?\s*level\s*(\w+)\*?\*?/i);
    if (levelClassParts) {
      const [, raceFromLC, level, charClass] = levelClassParts;
      return `${cleanRace.toLowerCase()} ${level}th level ${charClass.toLowerCase()}`;
    }
    
    return `${cleanRace.toLowerCase()}, ${cleanLevelClass.toLowerCase()}`;
  }

  // Look for the specific "Race & Class" line for more accuracy
  const lineMatch = text.match(/Race & Class: ([^\n]+)/i);
  if (lineMatch) {
    const lineText = lineMatch[1];
    // Extract race, level, and class from that line
    const statsMatch = lineText.match(/(\w+),\s*(\d{1,2})(?:\^?ᵗʰ|st|nd|rd|th)?\s*level\s*(\w+)/i);
    if (statsMatch) {
      const [, race, level, charClass] = statsMatch;
      return `${race.toLowerCase()} ${level}th level ${charClass.toLowerCase()}`;
    }
  }

  // Fallback to the original method if the specific line isn't found
  const levelMatch = text.match(/(\d{1,2})(?:\^?ᵗʰ|st|nd|rd|th)? level (\w+)/i);
  if (levelMatch) {
    return `human ${levelMatch[1]}th level ${levelMatch[2].toLowerCase()}`;
  }
  return 'class unknown';
}

export function findDisposition(text: string): string {
  // Look for structured template format
  const structuredMatch = text.match(/\*\s*\*\*Disposition:\*\*\s*\[?([^\]\n]+)\]?/i);
  if (structuredMatch) {
    return structuredMatch[1].trim().toLowerCase();
  }
  
  // Original pattern matching
  const match = text.match(/(?:Disposition|Alignment)[^:]*[:\-]\s*([a-z/]+)/i);
  return match ? match[1].toLowerCase() : 'disposition unknown';
}

export function findHpAc(text: string): [string, string] {
  // Look for structured template format
  const hpStructuredMatch = text.match(/\*\s*\*\*Hit Points \(HP\):\*\*\s*\[?([^\]\n]+)\]?/i);
  const acStructuredMatch = text.match(/\*\s*\*\*Armor Class \(AC\):\*\*\s*\[?([^\]\n]+)\]?/i);
  
  let hp = '?';
  let ac = '?';
  
  if (hpStructuredMatch) {
    const hpText = hpStructuredMatch[1].trim();
    const hpNum = hpText.match(/(\d+)/);
    hp = hpNum ? hpNum[1] : hpText;
  } else {
    const hpMatch = text.match(/Hit Points.*?(\d+)/i);
    hp = hpMatch ? hpMatch[1] : '?';
  }
  
  if (acStructuredMatch) {
    const acText = acStructuredMatch[1].trim();
    const acNum = acText.match(/([0-9/]+)/);
    ac = acNum ? acNum[1] : acText;
  } else {
    const acMatch = text.match(/Armor Class.*?([0-9/]+)/i);
    ac = acMatch ? acMatch[1] : '?';
  }
  
  return [hp, ac];
}

export function findPrimes(text: string): string {
  // Look for structured template format
  const structuredMatch = text.match(/\*\s*\*\*Prime Attributes \(PA\):\*\*\s*\[?([^\]\n]+)\]?/i);
  if (structuredMatch) {
    return structuredMatch[1].trim().replace(/\s*,\s*/g, ', ');
  }
  
  const match = text.match(/Prime Attributes.*?([A-Za-z, ]+)/i);
  if (match) {
    // Clean up the primes string - remove extra spaces and normalize
    return match[1].trim().replace(/\s*,\s*/g, ', ');
  }
  return '?';
}

export function findEquipment(text: string): string {
  // Look for structured template format
  const structuredMatch = text.match(/\*\s*\*\*Equipment \(EQ\):\*\*\s*\[?([^\]\n]+)\]?/i);
  if (structuredMatch) {
    const equipment = structuredMatch[1].trim();
    // Clean up any template placeholders
    if (equipment.toLowerCase().includes('lists all equipment') || equipment === '') {
      return 'none';
    }
    return equipment;
  }

  const asteriskMatches = text.match(/\*([^*]+)\*/g);
  if (asteriskMatches) {
    const equipment = asteriskMatches
      .map(match => match.replace(/\*/g, '').trim())
      .filter(item => item.length > 0);
    return equipment.join(', ');
  }
  
  const equipMatch = text.match(/Equipment.*?[:\-]\s*([^\n]+)/i);
  if (equipMatch) {
    const equipment = equipMatch[1]
      .split(',')
      .map(e => e.trim())
      .filter(item => item.length > 0);
    return equipment.join(', ');
  }
  
  return 'none';
}

export function findSpells(text: string): string {
  // Look for structured template format
  const structuredMatch = text.match(/\*\s*\*\*Spells:\*\*\s*\[?([^\]\n]+)\]?/i);
  if (structuredMatch) {
    const spellText = structuredMatch[1].trim();
    // Clean up any template placeholders
    if (spellText.toLowerCase().includes('for spellcasters') || spellText === '') {
      return 'spells unknown';
    }
    return spellText;
  }

  // Regex updated to find formats like "1st–6" or "0–6" (handles different dash types)
  const slotMatches = text.match(/(\d+)(?:st|nd|rd|th)?\s*[–-]\s*(\d+)/gi);
  if (slotMatches && slotMatches.length > 0) {
    const formattedSlots = slotMatches.map(match => {
      const parts = match.match(/(\d+)(?:st|nd|rd|th)?\s*[–-]\s*(\d+)/i);
      if (parts) {
        return `${parts[1]}:${parts[2]}`;
      }
      return match;
    });
    return formattedSlots.join(', ');
  }
  return 'spells unknown';
}

export function findMount(text: string): string {
  // Look for structured template format first
  const structuredMatch = text.match(/\*\s*\*\*Mount:\*\*\s*([^\n]+)/i);
  if (structuredMatch) {
    const mountText = structuredMatch[1].trim();
    if (mountText.toLowerCase().includes('heavy war horse')) {
      return 'rides a heavy war horse';
    }
    if (mountText.toLowerCase() !== 'none' && mountText !== '') {
      return `rides a ${mountText.toLowerCase()}`;
    }
  }
  
  // Check for mount section header
  if (/\*\*Mount Name \(if applicable\)\*\*/i.test(text)) {
    // Look for mount details in the following section
    const mountSection = text.match(/\*\*Mount Name.*?\n([\s\S]*?)(?:\n\*\*|$)/i);
    if (mountSection) {
      if (/heavy war horse/i.test(mountSection[1])) {
        return 'rides a heavy war horse';
      }
    }
  }
  
  if (/heavy war horse/i.test(text)) {
    return 'rides a heavy war horse';
  }
  return 'no mount';
}

export function parseNPCData(text: string): NPCData {
  return {
    name: findName(text),
    raceClassLevel: findRaceClassLevel(text),
    disposition: findDisposition(text),
    ...(() => {
      const [hp, ac] = findHpAc(text);
      return { hp, ac };
    })(),
    primes: findPrimes(text),
    equipment: findEquipment(text),
    spells: findSpells(text),
    mount: findMount(text)
  };
}

export function collapseNPCEntry(text: string): string {
  const data = parseNPCData(text);
  
  // Build components, filtering out empty or unknown values
  const components = [
    data.raceClassLevel !== 'class unknown' ? data.raceClassLevel : '',
    data.disposition !== 'disposition unknown' ? `disposition ${data.disposition}` : '',
    `HP ${data.hp}`,
    `AC ${data.ac}`,
    data.primes !== '?' ? `Primes: ${data.primes}` : '',
    data.equipment !== 'none' ? `EQ: ${data.equipment}` : '',
    data.spells !== 'spells unknown' ? `Spells: ${data.spells}` : '',
    data.mount !== 'no mount' ? data.mount : ''
  ].filter(component => component.length > 0);
  
  return `${data.name} (${components.join('; ')}).`;
}

export function processDump(dump: string): string[] {
  // Split on double newlines, but be more careful about what constitutes an NPC block
  const blocks = dump.split(/\n\s*\n/);
  
  return blocks
    .filter(block => {
      const trimmed = block.trim();
      // Filter out empty blocks and code-like content
      if (!trimmed) return false;
      
      // Skip blocks that look like code or comments (Python, for example)
      if (trimmed.startsWith('#') || 
          trimmed.startsWith('def ') || 
          trimmed.startsWith('import ') ||
          trimmed.startsWith('from ') ||
          trimmed.includes('def ') ||
          trimmed.includes('return ') ||
          /^\s*[\w_]+\s*=/.test(trimmed) ||
          trimmed.includes('"""') ||
          trimmed.includes("'''")) {
        return false;
      }
      
      // Must have some indication it's an NPC (name in bold, or typical stat block content)
      const hasNPCIndicators = 
        /\*\*[^*]+\*\*/.test(trimmed) || // Bold name
        /(?:Race & Class|Disposition|Hit Points|Armor Class|Prime Attributes|Equipment)/i.test(trimmed) ||
        /\d+(?:st|nd|rd|th)?\s*level\s+\w+/i.test(trimmed); // Level/class pattern
      
      return hasNPCIndicators;
    })
    .map(block => collapseNPCEntry(block));
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