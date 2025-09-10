// --- NPC Stat Block Parser for Original Castles & Crusades Format ---
// Produces narrative format matching the Victor Oldham reference style

// 1) Pre-clean: split title and body to prevent title contamination
function splitTitleAndBody(src: string): { title: string; body: string } {
  const lines = src.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // Title can be one or two lines before the first parenthesis block
  const idx = lines.findIndex(l => l.startsWith('('));
  const title = (idx > 0 ? lines.slice(0, idx) : lines.slice(0, 1)).join(' ');
  const body = lines.slice(Math.max(idx, 1)).join(' ');
  return { title, body };
}

export function findName(textOrTitle: string): string {
  const m = textOrTitle.match(/\*\*([^*]+)\*\*/);
  if (m) return m[1].trim();
  return textOrTitle.trim();
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
  const m = text.match(/(?:Disposition|Alignment)[^:]*[:\-]\s*([A-Za-z /-]+)/i) ||
            text.match(/\b(lawful|chaotic|neutral)\b.*\b(good|evil|neutral)\b/i);
  if (!m) return 'unknown';
  const raw = (m[1] || m[0]).toLowerCase().replace(/-/g,'/').replace(/\s+/g,'');
  const map: Record<string,string> = { lawful:'law', chaotic:'chaos', law:'law', chaos:'chaos', good:'good', evil:'evil', neutral:'neutral' };
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
  const m = text.match(/Prime\s*Attributes?[^:]*[:\-]\s*([^.]+)\.?/i) ||
            text.match(/primary attributes?\s*(?:are|is)\s*([^.]+)\.?/i);
  if (!m) return '?';
  const map: Record<string,string> = { str:'strength', dex:'dexterity', con:'constitution', int:'intelligence', wis:'wisdom', cha:'charisma' };
  return m[1]
    .split(/,| and /i)
    .map(s => s.trim().replace(/\.+$/,''))
    .filter(Boolean)
    .map(x => map[x.toLowerCase()] ?? x.toLowerCase())
    .join(', ');
}

// Scope equipment to "He carries ..." sentence or "Equipment:" line to prevent title contamination
export function findEquipment(text: string, npcName?: string): string {
  // Prefer explicit sentence: "He carries ... ."
  const mCarries = text.match(/(?:He|She)\s+carries\s+([^.!?]+?)(?:\.\s|$)/is);
  let span = mCarries ? mCarries[1] : '';

  // Fallback: "Equipment: ..."
  if (!span) {
    const mEq = text.match(/(?:Equipment|EQ)[^:]*[:\-]\s*([^.!\n]+)(?:[.!]|\n|$)/i);
    if (mEq) span = mEq[1];
  }
  if (!span) return 'none';

  // Normalize whitespace and split on ",", ";", or " and "
  const items = span
    .replace(/\s+/g, ' ')
    .split(/,|;\s*|(?:\s+and\s+)/i)
    .map(s => s.trim())
    .filter(Boolean);

  // Drop accidental title/name tokens
  const drop = new Set<string>(
    (npcName ? [npcName, ...npcName.split(',')] : []).map(s => s.trim().toLowerCase())
  );

  // Keep steel shield if present anywhere in the text
  if (/steel shield/i.test(text)) items.push('steel shield');

  // Auto-italicize obvious magic; dedupe
  const isMagic = (s: string) =>
    /\+\d/.test(s) || /\b(staff|wand|ring|cloak|boots|amulet|pectoral|bracers|girdle|rod|scroll|robe|shield)\b/i.test(s);

  const seen = new Set<string>();
  const cleaned = items
    .map(x => x.replace(/\.+$/, '').trim())
    .filter(x => x && !drop.has(x.toLowerCase()))
    .filter(x => (seen.has(x.toLowerCase()) ? false : (seen.add(x.toLowerCase()), true)))
    .map(x => (isMagic(x) ? `*${x}*` : x));

  return cleaned.length ? cleaned.join(', ') : 'none';
}

// Grab both compact "0–6" and long "1st-level: 6"; output with ordinals + en dashes
export function findSpells(text: string): string {
  const slots = new Map<number,string>();
  for (const m of text.matchAll(/(\d)(?:st|nd|rd|th)?-level\s*[:=]\s*(\d+)/gi)) slots.set(+m[1], m[2]);
  for (const m of text.matchAll(/(\d+)\s*[–-]\s*(\d+)/gi)) slots.set(+m[1], m[2]); // 0–6 / 0-6
  if (!slots.size) return '?';
  
  const ord = (n:number)=> n===1?'1st':n===2?'2nd':n===3?'3rd':`${n}th`;
  const keys = [...slots.keys()].sort((a,b)=>a-b);
  return keys.map(k => k===0 ? `0–${slots.get(0)!}` : `${ord(k)}–${slots.get(k)!}`).join(', ');
}

export function findMountOneLiner(text: string): string {
  if (!/heavy\s+war\s*horse|warhorse/i.test(text)) return '';
  // Jeremy's stock stats format
  return `\n\nHe rides a warhorse with the following statistics:\n\n` +
         `**Warhorse** (This creature's vital stats are Level 4(1d10), HP 35, AC 19, disposition neutral. ` +
         `It makes two hoof attacks for 1d4 damage each, or one overbearing attack. ` +
         `The horse is outfitted with chainmail barding.)`;
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

// --- Main builder: work on body, pass name into EQ ---

export function collapseNPCEntry(longText: string): string {
  const { title, body } = splitTitleAndBody(longText);
  const name = findName(title);
  
  const { race, level, charClass } = parseRaceClassLevel(body);
  const disposition = findDisposition(body);
  const [hp, ac] = findHpAc(body);
  const primes = findPrimes(body);
  const equipment = findEquipment(body, name);
  const spells = findSpells(body);

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
  
  // Append mount if present
  const mountInfo = findMountOneLiner(body);
  if (mountInfo) s += mountInfo;
  
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