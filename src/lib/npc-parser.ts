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
  const boldMatch = text.match(/\*\*([^*]+)\*\*/);
  if (boldMatch) {
    return boldMatch[1].trim();
  }
  return text.trim().split('\n')[0];
}

export function findRaceClassLevel(text: string): string {
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
  const match = text.match(/(?:Disposition|Alignment)[^:]*[:\-]\s*([a-z/]+)/i);
  return match ? match[1].toLowerCase() : 'disposition unknown';
}

export function findHpAc(text: string): [string, string] {
  const hpMatch = text.match(/Hit Points.*?(\d+)/i);
  const acMatch = text.match(/Armor Class.*?([0-9/]+)/i);
  return [hpMatch ? hpMatch[1] : '?', acMatch ? acMatch[1] : '?'];
}

export function findPrimes(text: string): string {
  const match = text.match(/Prime Attributes.*?([A-Za-z, ]+)/i);
  if (match) {
    // Clean up the primes string - remove extra spaces and normalize
    return match[1].trim().replace(/\s*,\s*/g, ', ');
  }
  return '?';
}

export function findEquipment(text: string): string {
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
  const blocks = dump.split(/\n\s*\n/);
  return blocks
    .filter(block => block.trim())
    .map(block => collapseNPCEntry(block));
}