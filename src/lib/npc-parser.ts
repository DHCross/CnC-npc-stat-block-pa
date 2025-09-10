// --- NPC Stat Block Parser for Original Castles & Crusades Format ---
// Produces narrative format matching the Victor Oldham reference style

export function findName(text: string): string {
  // bold heading or first line
  const m = text.match(/\*\*([^*]+)\*\*/);
  if (m) {
    return m[1].trim();
  }
  return text.trim().split('\n')[0];
}

// More tolerant: "Race & Class:", "human, 16th level cleric", "16th level human cleric", "cleric, 16th level"
export function parseRaceClassLevel(text: string): { race: string; level: string; charClass: string } {
  // 1) Explicit section
  let m = text.match(/Race\s*&\s*Class:\s*([A-Za-z]+)\s*,\s*(\d{1,2})(?:st|nd|rd|th)?\s*level\s*([A-Za-z]+)/i);
  if (m) return { race: m[1].toLowerCase(), level: m[2], charClass: m[3].toLowerCase() };

  // 2) "human, 16th level cleric"
  m = text.match(/([A-Za-z]+)\s*,\s*(\d{1,2})(?:st|nd|rd|th)?\s*level\s*([A-Za-z]+)/i);
  if (m) return { race: m[1].toLowerCase(), level: m[2], charClass: m[3].toLowerCase() };

  // 3) "16th level human cleric"
  m = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s*level\s*([A-Za-z]+)\s*([A-Za-z]+)/i);
  if (m) return { race: m[2].toLowerCase(), level: m[1], charClass: m[3].toLowerCase() };

  // 4) "cleric, 16th level"
  m = text.match(/([A-Za-z]+)\s*,\s*(\d{1,2})(?:st|nd|rd|th)?\s*level\b/i);
  if (m) return { race: 'human', level: m[2], charClass: m[1].toLowerCase() };

  return { race: 'human', level: '1', charClass: 'unknown' };
}

// Normalize to noun forms (law/good, chaos/evil)
export function findDisposition(text: string): string {
  const m = text.match(/(?:Disposition|Alignment)[^:]*[:\-]\s*([A-Za-z /-]+)/i);
  if (!m) return 'unknown';
  const raw = m[1].toLowerCase().replace(/-/g,'/').replace(/\s+/g,'');
  const map: Record<string,string> = { lawful:'law', chaotic:'chaos', law:'law', chaos:'chaos', good:'good', evil:'evil', neutral:'neutral', neuter:'neutral' };
  return raw.split('/').slice(0,2).map(p => map[p] ?? p).join('/');
}

// Accept "HP 59" OR "Hit Points (HP): 59", same for AC
export function findHpAc(text: string): [string, string] {
  const hpMatch = text.match(/HP\s*[:=]?\s*(\d+)/i) || text.match(/Hit\s*Points[^0-9]*?(\d+)/i);
  const acMatch = text.match(/AC\s*[:=]?\s*([0-9/]+)/i) || text.match(/Armor\s*Class[^0-9]*?([0-9/]+)/i);
  return [hpMatch ? hpMatch[1] : '?', acMatch ? acMatch[1] : '?'];
}

// Expand Str/Wis/Cha → full names; render lower-case per Jeremy
export function findPrimes(text: string): string {
  const m = text.match(/Prime\s*Attributes?[^:]*[:\-]\s*([^\n]+)/i) ||
            text.match(/primary attributes?\s*(?:are|is)\s*([^.\n]+)/i);
  if (!m) return '?';
  const map: Record<string,string> = { str:'strength', dex:'dexterity', con:'constitution', int:'intelligence', wis:'wisdom', cha:'charisma' };
  return m[1]
    .split(/,| and /i)
    .map(s => s.trim().replace(/\.+$/,''))
    .filter(Boolean)
    .map(x => map[x.toLowerCase()] ?? x.toLowerCase())
    .join(', ');
}

// EQ: accept italics or "Equipment: …"; auto-italicize obvious magic; dedupe; keep "steel shield" if present
export function findEquipment(text: string): string {
  const italics = [...text.matchAll(/\*([^*]+)\*/g)].map(m => m[1]);
  const line = text.match(/(?:Equipment|EQ)[^:]*[:\-]\s*([^\n]+)/i);
  let items = italics.length ? italics : (line ? line[1].split(/,|;/).map(s=>s.trim()) : []);
  if (/steel shield/i.test(text)) items.push('steel shield');
  const magical = (s: string) => /\+\d/.test(s) || /\b(staff|wand|ring|cloak|boots|amulet|pectoral|bracers|girdle|rod|scroll)\b/i.test(s);
  const seen = new Set<string>();
  const cleaned = items
    .map(s => s.replace(/\s+/g,' ').replace(/\.+$/,'').trim())
    .filter(Boolean)
    .filter(s => (seen.has(s.toLowerCase()) ? false : (seen.add(s.toLowerCase()), true)))
    .map(s => magical(s) ? `*${s}*` : s);
  return cleaned.length ? cleaned.join(', ') : 'none';
}

// Grab both compact "0–6" and long "1st-level: 6"; output as "0–6, 1st–6, …"
export function findSpells(text: string): string {
  const out: Record<string,string> = {};
  // compact spreads: 0–6, 1st–6, 2nd–5 ...
  for (const m of text.matchAll(/(\d+)(?:st|nd|rd|th)?\s*[–-]\s*(\d+)/gi)) out[m[1]] = m[2];
  // long form: 1st-level: 6
  for (const m of text.matchAll(/(\d)(?:st|nd|rd|th)?-level\s*[:=]\s*(\d+)/gi)) out[m[1]] = m[2];
  // zero-level spelled out
  const z = text.match(/0\s*[-–]?\s*level\s*[:=]\s*(\d+)/i); if (z) out['0'] = z[1];

  const ord = (n: number) => n===1?'1st':n===2?'2nd':n===3?'3rd':`${n}th`;
  const keys = Object.keys(out).map(k => parseInt(k,10)).sort((a,b)=>a-b);
  if (!keys.length) return '?';
  return keys.map(k => (k===0?`0–${out['0']}`:`${ord(k)}–${out[String(k)]}`)).join(', ');
}

export function findMount(text: string): { hasMount: boolean; mountType: string } {
  if (text.match(/war horse/i)) {
    return { hasMount: true, mountType: 'warhorse' };
  }
  if (text.match(/mount.*?:\s*none/i)) {
    return { hasMount: false, mountType: '' };
  }
  return { hasMount: false, mountType: '' };
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

function formatPrimaryAttributes(primes: string): string {
  if (!primes || primes === '?') return '';
  
  // Clean up the attributes and make them lowercase
  const attributes = primes.split(',').map(attr => attr.trim().toLowerCase());
  
  if (attributes.length === 1) {
    return attributes[0];
  } else if (attributes.length === 2) {
    return attributes.join(' and ');
  } else {
    const lastAttr = attributes.pop();
    return `${attributes.join(', ')}, and ${lastAttr}`;
  }
}

// --- Safer main builder ---

export function collapseNPCEntry(longText: string): string {
  const name = findName(longText);
  const { race, level, charClass } = parseRaceClassLevel(longText);
  const disposition = findDisposition(longText);
  const [hp, ac] = findHpAc(longText);
  const primes = findPrimes(longText);
  const equipment = findEquipment(longText);
  const spells = findSpells(longText);

  let s = `${name} (This ${level}${getOrdinalSuffix(level)} level ${race} ${charClass}'s vital stats are HP ${hp}, AC ${ac}, disposition ${disposition}.`;

  if (primes !== '?') {
    const p = formatPrimaryAttributes(primes);
    if (p) s += ` His primary attributes are ${p}.`;
  }
  if (equipment !== 'none') {
    const items = equipment.split(',').map(x => x.trim()).filter(Boolean);
    if (items.length === 1) s += ` He carries ${items[0]}.`;
    else if (items.length === 2) s += ` He carries ${items[0]} and ${items[1]}.`;
    else s += ` He carries ${items.slice(0,-1).join(', ')}, and ${items.slice(-1)}.`;
  }
  if (spells !== '?') s += ` He can cast the following number of spells per day: ${spells}.`;

  s += ')';
  return s;
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