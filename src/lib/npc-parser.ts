// --- NPC Stat Block Parser for Original Castles & Crusades Format ---
// Produces narrative format matching the Victor Oldham reference style

// Split title and body to prevent title contamination
function splitTitleAndBody(src: string): { title: string; body: string } {
  const text = src.trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Find title - look for bold text at the beginning
  let titleLines: string[] = [];
  let bodyStartIdx = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\*\*.*\*\*/.test(line)) {
      titleLines.push(line);
    } else if (line.match(/^(Disposition|Race|Hit Points|Armor Class|Prime|Equipment|Spells|Mount):/i)) {
      bodyStartIdx = i;
      break;
    } else if (titleLines.length > 0) {
      // We've started collecting title but hit a non-stat line
      bodyStartIdx = i;
      break;
    }
  }
  
  if (titleLines.length === 0 && lines.length > 0) {
    // Heuristic: if the first non-empty line looks like body (starts with parentheses or prose/stat indicators),
    // treat entire input as body without a separate title/name line.
    const first = lines[0];
    const looksLikeBody = /^(\(|He\b|She\b|They\b|HP\b|AC\b|Disposition\b|Alignment\b|Race\b|Spells\b|Equipment\b|Mount\b)/i.test(first);
    if (looksLikeBody) {
      titleLines = [];
      bodyStartIdx = 0;
    } else {
      titleLines = [lines[0]];
      bodyStartIdx = 1;
    }
  }
  
  const title = titleLines.join(' ');
  let body = lines.slice(bodyStartIdx).join('\n');

  // If the first body line begins with a bold title segment, strip it so any
  // trailing prose on that same line becomes part of the body. This supports
  // inputs like "**Sir Reynard** (HP 59, AC 13/22) He is a lawful good ..."
  if (body.startsWith('**')) {
    const endIdx = body.indexOf('**', 2);
    if (endIdx !== -1) {
      // Remove the bold segment and any immediate whitespace
      body = body.slice(endIdx + 2).trimStart();
    }
  }

  return { title, body };
}

export function findName(textOrTitle: string): string {
  const m = textOrTitle.match(/\*\*([^*]+)\*\*/);
  if (m) return m[1].trim();
  return textOrTitle.trim();
}

// Parse race, class, and level from various formats
export function parseRaceClassLevel(text: string): { race: string; level: string; charClass: string } {
  // 1) "Race & Class: human, 16th level cleric"
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

// Normalize adjectives → nouns (lawful good → law/good)
function normalizeDisposition(raw: string): string {
  const map: Record<string,string> = {
    lawful:'law', chaotic:'chaos', law:'law', chaos:'chaos',
    good:'good', evil:'evil', neutral:'neutral', neuter:'neutral'
  };
  
  // Handle spaces between words: "lawful good" -> "law/good"
  let cleaned = raw.toLowerCase().trim();
  
  // Replace common patterns first - these should return immediately
  if (/lawful\s+good/.test(cleaned)) return 'law/good';
  if (/lawful\s+evil/.test(cleaned)) return 'law/evil';
  if (/chaotic\s+good/.test(cleaned)) return 'chaos/good';
  if (/chaotic\s+evil/.test(cleaned)) return 'chaos/evil';
  if (/chaotic\s+neutral/.test(cleaned)) return 'chaos/neutral';
  if (/lawful\s+neutral/.test(cleaned)) return 'law/neutral';
  if (/neutral\s+good/.test(cleaned)) return 'neutral/good';
  if (/neutral\s+evil/.test(cleaned)) return 'neutral/evil';
  
  // Clean up separators for other formats
  cleaned = cleaned.replace(/-/g,'/').replace(/\s+/g,'').replace(/,/g,'/');
  const parts = cleaned.split('/').filter(Boolean);
  return parts.slice(0,2).map(p => map[p] ?? p).join('/');
}

/**
 * Pull disposition from either:
 *  - Labeled blocks: "Disposition: law/good" or "Alignment: Lawful Good"
 *  - Prose: "He is a lawful good ..." or "They are neutral ..."
 */
export function extractDisposition(source: string): string | null {
  // 1) Labeled block
  const mLabel =
    source.match(/(?:Disposition|Alignment)[^:]*[:\-]\s*([A-Za-z /-]+)/i);
  if (mLabel) return normalizeDisposition(mLabel[1]);

  // 2) Prose sentence (singular)
  const mHeIs = source.match(/\b(?:He|She)\s+is\s+(?:an?\s+)?(lawful|chaotic|neutral)[ -]?(good|evil|neutral)?\b/i);
  if (mHeIs) return normalizeDisposition([mHeIs[1], mHeIs[2] ?? ''].join('/'));

  // 3) Prose sentence (plural)
  const mTheyAre = source.match(/\bThey\s+are\s+(?:an?\s+)?(lawful|chaotic|neutral)[ -]?(good|evil|neutral)?\b/i);
  if (mTheyAre) return normalizeDisposition([mTheyAre[1], mTheyAre[2] ?? ''].join('/'));

  // 4) Lone noun (just "neutral")
  const mNeutral = source.match(/\bneutral\b/i);
  if (mNeutral) return 'neutral';

  return null;
}

// Extract gender from stat block to determine pronouns
export function extractGender(source: string): 'male' | 'female' | 'neutral' {
  const text = source.toLowerCase();

  // Strong female indicators first, as "priest" is a substring of "priestess"
  if (/\b(she|female|priestess|queen|lady|actress|woman)\b/.test(text)) {
    return 'female';
  }

  // Then male indicators - check for "high priest" specifically
  if (/\bhigh priest\b/.test(text)) {
    return 'male';
  }

  if (/\b(he|him|his|male|priest|king|lord|actor|man)\b/.test(text)) {
    return 'male';
  }

  // "her" is a weaker indicator, check it last to avoid conflicts like "other"
  if (/\bher\b/.test(text)) {
    return 'female';
  }

  return 'neutral';
}

// Backward compatibility shim for existing code
export function findDisposition(text: string): string {
  return extractDisposition(text) ?? 'unknown';
}

// Find HP and AC from various formats
export function findHpAc(text: string): [string, string] {
  const hpMatch = text.match(/Hit\s+Points\s*\(HP\):\s*(\d+)/i) || 
                  text.match(/HP\s*[:=]?\s*(\d+)/i);
  const acMatch = text.match(/Armor\s+Class\s*\(AC\):\s*([0-9/]+)/i) || 
                  text.match(/AC\s*[:=]?\s*([0-9/]+)/i);
  return [hpMatch ? hpMatch[1] : '?', acMatch ? acMatch[1] : '?'];
}

// Find and expand prime attributes to full names, lowercase
export function findPrimes(text: string): string {
  const m = text.match(/Prime\s+Attributes\s*\(PA\):\s*([^\n]+)/i) ||
            text.match(/Prime\s*Attributes?[^:]*:\s*([^\n]+)/i);
  if (!m) {
    // Prose-style support: "Primary/Prime attributes are ..."
    const prose = text.match(/\b(?:Primary|Prime)\s+Attributes?[^:)]*\s*(?:are|:)\s*([^\.\n)]+)/i);
    if (!prose) return '?';
    // Reuse the same mapping/normalization below using captured prose[1]
    const captured = prose[1];
    const map: Record<string,string> = { 
      str:'strength', dex:'dexterity', con:'constitution', 
      int:'intelligence', wis:'wisdom', cha:'charisma',
      strength:'strength', dexterity:'dexterity', constitution:'constitution',
      intelligence:'intelligence', wisdom:'wisdom', charisma:'charisma'
    };
    return captured
      .split(/,| and /i)
      .map(s => s.trim().toLowerCase().replace(/\.+$/, ''))
      .filter(Boolean)
      .map(x => map[x] ?? x)
      .join(', ');
  }
  
  const map: Record<string,string> = { 
    str:'strength', dex:'dexterity', con:'constitution', 
    int:'intelligence', wis:'wisdom', cha:'charisma',
    strength:'strength', dexterity:'dexterity', constitution:'constitution',
    intelligence:'intelligence', wisdom:'wisdom', charisma:'charisma'
  };
  
  return m[1]
    .split(/,| and /i)
    .map(s => s.trim().toLowerCase().replace(/\.+$/, ''))
    .filter(Boolean)
    .map(x => map[x] ?? x)
    .join(', ');
}

// Find equipment from Equipment: line or process raw equipment list
export function findEquipment(text: string, npcName?: string): string {
  // First try to find Equipment: line
  const m = text.match(/Equipment:\s*([^\n]+)/i);
  let equipmentText: string;
  
  if (m) {
    equipmentText = m[1];
  } else {
    // If no Equipment: line found, try to extract from prose such as
    // "He/She/They carries ..." / "carry ..." / "bears ..." / "wears ..." / "wields ..."
    const prose = text.match(/\b(?:He|She)\s+carries\s+([^\.\n)]+)/i) ||
                  text.match(/\bThey\s+carry\s+([^\.\n)]+)/i) ||
                  text.match(/\b(?:He|She|They)\s+bears?\s+([^\.\n)]+)/i) ||
                  text.match(/\b(?:He|She|They)\s+wears?\s+([^\.\n)]+)/i) ||
                  text.match(/\b(?:He|She|They)\s+wields?\s+([^\.\n)]+)/i);
    if (prose) {
      equipmentText = prose[1];
    } else {
      // As a very last resort, treat entire text as equipment list (legacy test support)
      equipmentText = text;
    }
  }
  
  if (!equipmentText || equipmentText.trim().toLowerCase() === 'none') return 'none';

  // Normalize any shield references up-front so later steps (splitting, italicization)
  // see a consistent PHB shape: "(size material) shield +#" with sane defaults
  equipmentText = normalizeShieldItems(equipmentText);

  let items = equipmentText
    .split(/,| and /i)
    .map(s => s.trim().replace(/\.+$/, ''))
    .filter(Boolean);

  // Filter out any accidental name tokens if provided
  const filteredItems = npcName ?
    items.filter(item => {
      const itemLower = item.toLowerCase();
      const nameLower = npcName.toLowerCase();
      return !itemLower.includes(nameLower) && !nameLower.includes(itemLower);
    }) : items;

  // PHB renames and explicit shield normalization (pre-italicization per Jeremy)
  const applyPHBRenames = (s: string): string => {
    let out = s;
    out = out.replace(/\brobe of protection\b/gi, 'robe of armor');
    out = out.replace(/\bring of protection\b/gi, 'ring of armor');
    out = out.replace(/\bpectoral of protection\b/gi, 'pectoral of armor');
    out = out.replace(/\bdagger of venom\b/gi, 'dagger of envenomation');
    return out;
  };

  items = filteredItems.map(x => {
    // Drop leading articles from prose extraction
    let y = x.replace(/^\b(?:a|an|the)\s+/i, '');
    return applyPHBRenames(y);
  });

  // Auto-italicize obvious magic items
  const isMagic = (s: string) =>
    /\+\d/.test(s) || /\b(staff|wand|ring|cloak|boots|amulet|pectoral|bracers|girdle|rod|scroll)\b/i.test(s);

  const cleaned = items.map(x => (isMagic(x) ? `*${x}*` : x));
  return cleaned.length ? cleaned.join(', ') : 'none';
}

// Normalize any shield reference to "(size material) shield +#"
// Size ∈ {buckler, small, medium, large, pavis}, Material ∈ {steel, wooden}
// Defaults when omitted: size = "medium", material = "steel".
// Preserves mundane shields (no +#) and existing explicit types.
function normalizeShieldItems(text: string): string {
  let out = text;

// 1) Normalize buckler/pavis (standalone types, no material or "shield" word)
// Accept bonus before or after; strip any accidental "shield" word and material qualifiers
const BP_RE = /\b(?:(\+\s*\d+)\s*)?(?:an?\s+)?(?:wooden|steel\s+)?(buckler|pavis)(?:\s+shield)?(?:\s*(\+\s*\d+))?/gi;
out = out.replace(BP_RE, (_m, bBefore, _material, type, bAfter) => {
  const bonusRaw = (bBefore || bAfter || '').replace(/\s+/g, '');
  const bonus = bonusRaw ? ` ${bonusRaw}` : '';
  return `${type.toLowerCase()}${bonus}`;
});  // 2) Canonical (size material) shield with bonus optionally before/after → move bonus to end
  const CANON_RE = /\b(?:(\+\s*\d+)\s*)?(small|medium|large)\s+(steel|wooden)\s+shield\b(?:\s*(\+\s*\d+))?/gi;
  out = out.replace(CANON_RE, (_m, bBefore, size, material, bAfter) => {
    const bonusRaw = (bBefore || bAfter || '').replace(/\s+/g, '');
    const bonus = bonusRaw ? ` ${bonusRaw}` : '';
    return `${size.toLowerCase()} ${material.toLowerCase()} shield${bonus}`;
  });

  // 3) Any remaining 'shield' mentions → promote to PHB form with defaults, preserving any size/material seen
  const GENERIC_RE = /\b(?:(\+\s*\d+)\s*)?(?:an?\s+)?(?:(buckler|small|medium|large|pavis)\s+)?(?:(wooden|steel)\s+)?shield\b(?:\s*(\+\s*\d+))?/gi;
  out = out.replace(GENERIC_RE, (_m, bBefore, sizeMaybe, matMaybe, bAfter) => {
    // Already handled buckler/pavis earlier; if they appear here, coerce to standalone
    const sizeLower = (sizeMaybe || '').toLowerCase();
    if (sizeLower === 'buckler' || sizeLower === 'pavis') {
      const bonusRaw = (bBefore || bAfter || '').replace(/\s+/g, '');
      const bonus = bonusRaw ? ` ${bonusRaw}` : '';
      return `${sizeLower}${bonus}`;
    }
    const size = (sizeLower as 'small'|'medium'|'large') || 'medium';
    const mat = (matMaybe || '').toLowerCase() || 'steel';
    const bonusRaw = (bBefore || bAfter || '').replace(/\s+/g, '');
    const bonus = bonusRaw ? ` ${bonusRaw}` : '';
    return `${size} ${mat} shield${bonus}`;
  });

  // 4) Lone buckler/pavis without preceding normalization (e.g., miss cases like "+2 buckler") handled above
  return out;
}

// Find spells and format with ordinals and en dashes
export function findSpells(text: string): string {
  const m = text.match(/Spells:\s*([^\n]+)/i);
  if (!m) return '?';
  
  // Parse the spell format like "0–6, 1st–6, 2nd–5..."
  const spellText = m[1];
  const slots = new Map<number,string>();
  
  // Match patterns like "0–6" or "1st–6"
  for (const match of spellText.matchAll(/(\d+)(?:st|nd|rd|th)?[–-](\d+)/g)) {
    slots.set(parseInt(match[1]), match[2]);
  }
  
  if (!slots.size) return '?';
  
  const ord = (n:number) => n===1?'1st':n===2?'2nd':n===3?'3rd':`${n}th`;
  const keys = [...slots.keys()].sort((a,b)=>a-b);
  return keys.map(k => k===0 ? `0–${slots.get(0)!}` : `${ord(k)}–${slots.get(k)!}`).join(', ');
}

// Check for mount and generate mount description
export function findMountOneLiner(text: string, gender: 'male' | 'female' | 'neutral'): string {
  const m = text.match(/Mount:\s*([^\n]+)/i);
  let mountText: string | null = null;
  if (m) {
    mountText = m[1].trim();
  } else {
    const prose = text.match(/\brides\s+(?:a|an)?\s*([^\.,\n)]+)/i);
    if (prose) mountText = prose[1].trim();
  }
  if (!mountText) return '';

  const mountTextLower = mountText.toLowerCase();

  if (mountTextLower === 'none' || mountTextLower === 'no mount') {
    return '';
  }

  const subjectPronoun = gender === 'female' ? 'She' : gender === 'male' ? 'He' : 'They';

  // Default per Jeremy: do not bloat with stat blocks for common mounts; keep a single line
  if (mountTextLower.includes('heavy war horse') || mountTextLower.includes('warhorse')) {
    return `\n\n${subjectPronoun} rides a heavy war horse.`;
  }

  // For any other mount, just state what it is.
  const article = 'aeiou'.includes(mountTextLower[0]) ? 'an' : 'a';
  // For named/special mounts (heuristic: capitalized name or descriptors like 'ancient', 'celestial', etc.),
  // you could include a stat block. For now, follow minimal default for all mounts unless expanded later.
  return `\n\n${subjectPronoun} rides ${article} ${mountText}.`;
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

export function formatPrimaryAttributes(primes: string): string {
  if (!primes || primes === '?') return '';

  // Clean up the attributes and make them lowercase
  const attributes = primes.split(',').map(attr => attr.trim().toLowerCase());

  // Enforce PHB canonical order (lowercase per Jeremy)
  const canonical = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const sorted = attributes.slice().sort((a, b) => canonical.indexOf(a) - canonical.indexOf(b));

  if (sorted.length === 1) {
    return sorted[0];
  } else if (sorted.length === 2) {
    return sorted.join(' and ');
  } else {
    const lastAttr = sorted[sorted.length - 1];
    return `${sorted.slice(0, -1).join(', ')}, and ${lastAttr}`;
  }
}

// Main function to collapse NPC entry into narrative format
// --- Castle Zagyg Unified Formatting Helper Functions ---

function determineStatBlockType(charClass: string, race: string, name: string): 'basic-monster' | 'classless-npc' | 'classed-npc' {
  // Basic monster: no class, often no name, typically creature types
  if (!charClass || charClass === 'unknown' || charClass === '?') {
    if (!name || /^(orc|goblin|skeleton|zombie|troll|dragon|giant|elemental)/i.test(race)) {
      return 'basic-monster';
    }
    return 'classless-npc';
  }
  return 'classed-npc';
}

function getPronouns(gender: string, race: string, name: string): { subject: string; possessive: string; object: string } {
  // Only use gendered pronouns if explicit indicators present
  const explicitFemale = /\b(priestess|female|woman|lady|queen|duchess|countess|she|her)\b/i.test(`${race} ${name}`);
  const explicitMale = /\b(male|man|lord|king|duke|count|sir|he|his|him)\b/i.test(`${race} ${name}`);
  
  if (explicitFemale || gender === 'female') {
    return { subject: 'she', possessive: 'her', object: 'her' };
  } else if (explicitMale || gender === 'male') {
    return { subject: 'he', possessive: 'his', object: 'him' };
  } else {
    return { subject: 'this creature', possessive: 'this creature\'s', object: 'this creature' };
  }
}

function formatBasicMonster(race: string, level: string, hp: string, ac: string, disposition: string, primes: string, equipment: string): string {
  const levelSuffix = getOrdinalSuffix(level);
  let block = `this creature's vital stats are level ${level}${levelSuffix}(d${getHitDie(race)}), hp ${hp}, ac ${ac}, disposition ${disposition}.`;
  
  if (primes !== '?' && primes !== 'unknown') {
    const formatted = formatPrimaryAttributes(primes);
    if (formatted) block += ` their primary attributes are ${formatted}.`;
  }
  
  if (equipment !== 'none' && equipment !== '?') {
    block += ` they attack with ${equipment} for appropriate damage.`;
  }
  
  block += ` refer to monsters & treasure for more information.`;
  
  return `(_${block}_)`;
}

function formatClasslessNPC(name: string, race: string, level: string, hp: string, ac: string, disposition: string, equipment: string, pronouns: any): string {
  const levelSuffix = getOrdinalSuffix(level);
  let block = `this ${race}'s vital stats are level ${level}${levelSuffix}(d${getHitDie(race)}), hp ${hp}, ac ${ac}, disposition ${disposition}.`;
  
  if (equipment !== 'none' && equipment !== '?') {
    block += ` ${pronouns.subject} ${pronouns.subject === 'this creature' ? 'wears' : pronouns.subject.toLowerCase() === 'he' || pronouns.subject.toLowerCase() === 'she' ? 'wears' : 'wear'} ${equipment}.`;
  }
  
  const hasPlausibleName = !!name && !/^\(/.test(name) && !/^(he|she|they|this)\b/i.test(name);
  if (hasPlausibleName) {
    return `**${name}** (_${block}_)`;
  } else {
    return `(_${block}_)`;
  }
}

function formatClassedNPC(name: string, race: string, level: string, charClass: string, hp: string, ac: string, disposition: string, primes: string, equipment: string, spells: string, pronouns: any): string {
  const levelSuffix = getOrdinalSuffix(level);
  let block = `this ${level}${levelSuffix} level ${race} ${charClass}'s vital stats are hp ${hp}, ac ${ac}, disposition ${disposition}.`;
  
  // Add primary attributes - always lowercase, use singular/plural appropriately
  if (primes !== '?' && primes !== 'unknown') {
    const formatted = formatPrimaryAttributes(primes);
    if (formatted) {
      const attrList = formatted.split(/,|\s+and\s+/).map(s => s.trim()).filter(Boolean);
      if (attrList.length === 1) {
        block += ` ${pronouns.subject === 'this creature' ? 'its' : pronouns.possessive.toLowerCase()} primary attribute is ${formatted}.`;
      } else {
        block += ` ${pronouns.subject === 'this creature' ? 'its' : pronouns.possessive.toLowerCase()} primary attributes are ${formatted}.`;
      }
    }
  }
  
  // Add equipment with proper italics for magic items
  if (equipment !== 'none' && equipment !== '?') {
    const verb = pronouns.subject === 'this creature' ? 'wears' : pronouns.subject.toLowerCase() === 'he' || pronouns.subject.toLowerCase() === 'she' ? 'wears' : 'wear';
    block += ` ${pronouns.subject === 'this creature' ? 'it' : pronouns.subject.toLowerCase()} ${verb} ${equipment}.`;
  }
  
  // Add spells with proper format
  if (spells !== '?' && spells !== 'unknown') {
    const verb = pronouns.subject === 'this creature' ? 'can cast' : pronouns.subject.toLowerCase() === 'he' || pronouns.subject.toLowerCase() === 'she' ? 'can cast' : 'can cast';
    block += ` ${pronouns.subject === 'this creature' ? 'it' : pronouns.subject.toLowerCase()} ${verb} the following number of ${getSpellType(charClass)} spells each day: ${spells}.`;
  }
  
  const hasPlausibleName = !!name && !/^\(/.test(name) && !/^(he|she|they|this)\b/i.test(name);
  if (hasPlausibleName) {
    return `**${name}** (_${block}_)`;
  } else {
    return `(_${block}_)`;
  }
}

function getHitDie(race: string): string {
  // Default hit die based on creature type - can be expanded
  const hitDiceMap: { [key: string]: string } = {
    'human': '8',
    'elf': '6', 
    'dwarf': '10',
    'halfling': '6',
    'orc': '8',
    'goblin': '6',
    'kobold': '4'
  };
  return hitDiceMap[race.toLowerCase()] || '8';
}

function getSpellType(charClass: string): string {
  if (/cleric|priest/i.test(charClass)) return 'cleric';
  if (/wizard|magic.user/i.test(charClass)) return 'wizard';
  if (/druid/i.test(charClass)) return 'druid';
  if (/ranger/i.test(charClass)) return 'ranger';
  if (/paladin/i.test(charClass)) return 'paladin';
  return 'arcane';
}

export function collapseNPCEntry(longText: string): string {
  const { title, body } = splitTitleAndBody(longText);
  let name = findName(title);

  const { race, level, charClass } = parseRaceClassLevel(body);
  const disposition = extractDisposition(body) ?? 'unknown';
  const [hp, ac] = findHpAc(body);
  const primes = findPrimes(body);
  const equipment = findEquipment(body, name);
  const spells = findSpells(body);
  const gender = extractGender(body);

  // Determine stat block type based on Castle Zagyg unified rules
  const statBlockType = determineStatBlockType(charClass, race, name);

  // Define pronouns based on gender - only use gendered if explicit
  const pronouns = getPronouns(gender, race, name);

  // If there is no heading name/title, synthesize a sensible fallback
  if (!name || name.trim() === '') {
    name = buildFallbackHeading(race, level, charClass);
  }

  let result: string;

  switch (statBlockType) {
    case 'basic-monster':
      result = formatBasicMonster(race, level, hp, ac, disposition, primes, equipment);
      break;
    case 'classless-npc':
      result = formatClasslessNPC(name, race, level, hp, ac, disposition, equipment, pronouns);
      break;
    case 'classed-npc':
      result = formatClassedNPC(name, race, level, charClass, hp, ac, disposition, primes, equipment, spells, pronouns);
      break;
    default:
      // Fallback to classed NPC format
      result = formatClassedNPC(name, race, level, charClass, hp, ac, disposition, primes, equipment, spells, pronouns);
  }

  // Add mount information if present
  const mountInfo = findMountOneLiner(body, gender);
  if (mountInfo) {
    result += mountInfo;
    // Add footnote for shared mounts to reduce repetition
    result += '\n\n*All knights ride heavy war horses.*';
  }

  return result;
}

// Construct a fallback bold heading when none is provided by the user.
// Example: "**human, 9ᵗʰ level fighter**" or "**human, 1ˢᵗ level unknown**".
function buildFallbackHeading(race: string, level: string, charClass: string): string {
  const r = (race && race !== '?' ? race.toLowerCase() : 'human');
  const c = (charClass && charClass !== 'unknown' && charClass !== '?' ? charClass.toLowerCase() : 'unknown');
  const lvl = level && level !== '?' ? `${level}${getOrdinalSuffix(level)} level` : '1ˢᵗ level';
  return `${r}, ${lvl} ${c}`;
}

// --- HTML Output Generation ---
export function convertToHtml(markdownText: string): string {
  let html = markdownText;

  // Convert **bold** to <strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert _italic_ (underscore) to <em>
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Convert *italic* to <em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert superscripts
  html = html.replace(/(\d+)ˢᵗ/g, '$1<sup>st</sup>');
  html = html.replace(/(\d+)ⁿᵈ/g, '$1<sup>nd</sup>');
  html = html.replace(/(\d+)ʳᵈ/g, '$1<sup>rd</sup>');
  html = html.replace(/(\d+)ᵗʰ/g, '$1<sup>th</sup>');

  // Convert newlines to <br>
  html = html.replace(/\n/g, '<br>');

  return html;
}

// --- Batch processor for multiple NPCs ---
export function processDump(dump: string): string[] {
  // Clean the input text
  const cleanedDump = dump.trim();
  
  // Return empty if no input
  if (!cleanedDump) {
    return [];
  }
  
  // Skip if it's clearly code or non-NPC content
  if (isCodeContent(cleanedDump)) {
    return [];
  }
  
  // Try to split by double newlines first (preferred method for multiple NPCs)
  let blocks = cleanedDump.split(/\n\s*\n/).filter(block => block.trim());
  
  // If we only got one block but it has multiple bold names, try to split differently
  if (blocks.length === 1) {
    const boldNameMatches = [...cleanedDump.matchAll(/\*\*[^*]+\*\*/g)];
    if (boldNameMatches.length > 1) {
      // Split at bold names, keeping the delimiter
      const parts = cleanedDump.split(/(?=\*\*[^*]+\*\*)/);
      blocks = parts.filter(part => part.trim() && /\*\*[^*]+\*\*/.test(part));
    }
  }
  
  const results: string[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    let block = blocks[i];
    let trimmedBlock = block.trim();
    
    // Skip empty blocks or obvious non-NPC content
    if (!trimmedBlock || isCodeContent(trimmedBlock)) {
      continue;
    }
    
    // If this block is just a plain title/name and the next block looks like a stat body,
    // merge them so we don't lose the unbolded name.
    if (looksLikeTitleOnlyBlock(trimmedBlock) && i + 1 < blocks.length && looksLikeStatBodyBlock(blocks[i + 1])) {
      trimmedBlock = `${trimmedBlock}\n${blocks[i + 1].trim()}`;
      i++; // consume the next block
    }

    // Check if this block has NPC indicators
    if (!hasNPCIndicators(trimmedBlock)) {
      continue;
    }
    
    // Process this NPC block
    try {
      const result = collapseNPCEntry(trimmedBlock);
      if (result && result.length > 20) { // Basic sanity check for valid output
        results.push(result);
      }
    } catch (error) {
      console.error('Error processing NPC block:', error);
      // Continue processing other blocks even if one fails
    }
  }
  
  return results;
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

// Heuristic: does this single-line block look like a plain title/name without stats?
function looksLikeTitleOnlyBlock(block: string): boolean {
  const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length !== 1) return false;
  const line = lines[0];
  if (!line) return false;
  // Not bold, not starting with a stat label, not parenthetical
  if (/^\*\*.*\*\*$/.test(line)) return false;
  if (/^\(/.test(line)) return false;
  if (/^(Disposition|Race|Hit Points|Armor Class|Prime|Equipment|Spells|Mount):/i.test(line)) return false;
  if (/:/.test(line)) return false;
  // Reasonable length and has at least two words (e.g., a name or title)
  const words = line.split(/\s+/);
  if (words.length < 2) return false;
  if (line.length < 3 || line.length > 120) return false;
  return true;
}

// Heuristic: does this block start like a stat body (parenthetical HP/AC or labeled stats)?
function looksLikeStatBodyBlock(block: string): boolean {
  const text = block.trim();
  if (!text) return false;
  // Starts with parenthetical containing HP/AC or spelled out terms
  if (/^\([^)]*(?:\b(?:HP|Hit\s*Points|AC|Armor\s*Class)\b)[^)]*\)/i.test(text)) return true;
  // Contains common labeled lines
  if (/(?:Race\s*&\s*Class|Disposition|Alignment|Hit\s*Points|Armor\s*Class|Prime\s*Attributes|Equipment|Spells|Mount)\s*:/i.test(text)) return true;
  // Has HP/AC shorthand anywhere
  if (/(?:\bHP\b|\bAC\b)\s*(?::|=)?\s*\d+/i.test(text)) return true;
  return false;
}

function hasNPCIndicators(text: string): boolean {
  // Must have some indication it's an NPC stat block
  const hasName = /\*\*[^*]+\*\*/.test(text); // Bold name
  const hasStatBlock = /(?:Race & Class|Disposition|Alignment|Hit Points|Armor Class|Prime Attributes|Equipment|Mount)/i.test(text);
  const hasLevelClass = /\d+(?:st|nd|rd|th)?\s*level\s+\w+/i.test(text);
  // Accept HP/AC with or without colons in more permissive parsing
  const hasHPAC = /(?:HP|AC)\s*(?::|=)?\s*\d+/i.test(text) || /Hit Points.*?\d+/i.test(text) || /Armor Class.*?\d+/i.test(text);
  
  // Also check for simplified formats like "human, 16th level cleric"
  const hasRaceClassFormat = /\w+,\s*\d+(?:st|nd|rd|th)?\s*level\s+\w+/i.test(text);
  
  // Require either a bold name with some stats, OR a good combination of stat block indicators
  // Also allow parenthetical prose bodies containing HP/AC or disposition sentences
  const hasProseDisposition = /\b(?:He|She)\s+is\s+(?:lawful|chaotic|neutral)/i.test(text) || /\bThey\s+are\s+(?:lawful|chaotic|neutral)/i.test(text);

  // New: allow an unbolded title-only first line followed by HP/AC parenthetical or labeled stats
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const titleLike = lines.length > 1 && looksLikeTitleOnlyBlock(lines[0]);
  const rest = lines.slice(1).join('\n');
  const titlePlusStats = titleLike && looksLikeStatBodyBlock(rest);

  return (hasName && (hasStatBlock || hasLevelClass || hasHPAC || hasProseDisposition)) || 
    (hasStatBlock && (hasLevelClass || hasHPAC)) ||
    (hasName && hasRaceClassFormat) ||
    titlePlusStats;
}

export function generateNPCTemplate(): string {
  return `**sir reynard montjoy, koc**

Disposition: law/good
Race & Class: human, 9ᵗʰ level fighter
Hit Points (HP): 56
Armor Class (AC): 20
Primary Attributes: strength, constitution
Equipment: plate mail, *shield +2*, *longsword +1*, *ring of protection +1*
Mount: heavy war horse`;
}

export function generateBatchTemplate(): string {
  return `**the right honorable president counselor of yggsburgh, his supernal devotion victor oldham, high priest of the grand temple**

Disposition: law/good
Race & Class: human, 16ᵗʰ level cleric
Hit Points (HP): 59
Armor Class (AC): 13/22
Primary Attributes: strength, wisdom, charisma
Equipment: *pectoral of protection +3*, full plate mail, large steel shield, *staff of striking*, mace
Spells: he can cast the following number of cleric spells each day: 0–6, 1st–6, 2nd–5, 3rd–5, 4th–4, 5th–4, 6th–3, 7th–3, 8th–2
Mount: heavy war horse

**Hector Markle, Secretary Counselor**

Disposition: law/neutral
Race & Class: human, 1st level scholar
Hit Points (HP): 5
Armor Class (AC): 10
Prime Attributes (PA): Intelligence
Equipment: nobleman's clothing

**Guard Captain Miller**

Disposition: law/good
Race & Class: human, 5th level fighter
Hit Points (HP): 35
Armor Class (AC): 18
Prime Attributes (PA): Strength, Constitution
Equipment: longsword +1, plate mail, heavy steel shield`;
}

// --- Validation System for C&C Stat Block Compliance ---

export interface ValidationWarning {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion?: string;
  fix?: {
    description: string;
    action: () => string;
  };
}

export interface CorrectionFix {
  description: string;
  originalText: string;
  correctedText: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ValidationResult {
  warnings: ValidationWarning[];
  isValid: boolean;
  complianceScore: number; // 0-100 percentage
  fixes: CorrectionFix[];
}

// --- Dictionary Support (Spells, Items, Monsters) ---
// Minimal in-memory dictionaries that can be populated from CSV uploads via UI.
type DictionarySet = {
  spells: Set<string>;
  items: Set<string>;
  monsters: Set<string>;
};

const dicts: DictionarySet = {
  spells: new Set<string>(),
  items: new Set<string>(),
  monsters: new Set<string>(),
};

export function setDictionaries(partial: {
  spellsCsv?: string; // one name per line or CSV first column
  itemsCsv?: string;
  monstersCsv?: string;
}) {
  const load = (csv?: string) => {
    if (!csv) return new Set<string>();
    const lines = csv.split(/\r?\n/).map(l => l.split(',')[0].trim()).filter(Boolean);
    return new Set(lines.map(s => s.toLowerCase()))
  };
  if (partial.spellsCsv !== undefined) dicts.spells = load(partial.spellsCsv);
  if (partial.itemsCsv !== undefined) dicts.items = load(partial.itemsCsv);
  if (partial.monstersCsv !== undefined) dicts.monsters = load(partial.monstersCsv);
}

function canonicalizeByDictionaries(text: string): string {
  if ((!dicts.spells.size && !dicts.items.size && !dicts.monsters.size) || !text) return text;
  let out = text;

  // Canonicalize spells and italicize
  if (dicts.spells.size) {
    for (const name of dicts.spells) {
      const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
      out = out.replace(re, (m) => `*${m.toLowerCase()}*`);
    }
  }

  // Canonicalize items and italicize
  if (dicts.items.size) {
    for (const name of dicts.items) {
      const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
      out = out.replace(re, (m) => `*${m.toLowerCase()}*`);
    }
  }

  // Canonicalize monster names (no italics by default)
  if (dicts.monsters.size) {
    for (const name of dicts.monsters) {
      const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
      out = out.replace(re, (m) => m.toLowerCase());
    }
  }

  return out;
}

// Auto-correction system for common C&C formatting issues
export function generateAutoCorrectionFixes(text: string): CorrectionFix[] {
  const fixes: CorrectionFix[] = [];
  
  // Dictionary-based canonicalization suggestions (if dictionaries are loaded)
  const dictCorrected = canonicalizeByDictionaries(text);
  if (dictCorrected !== text) {
    // Create a composite fix suggestion to nudge user to apply dictionary normalization.
    fixes.push({
      description: 'Normalize names using loaded dictionaries (spells/items/monsters)',
      originalText: text,
      correctedText: dictCorrected,
      category: 'Dictionary Normalization',
      confidence: 'medium'
    });
  }
  
  // Fix 1: Convert alignment to disposition terminology
  const alignmentMatches = [...text.matchAll(/\b(Alignment)\s*:/gi)];
  for (const match of alignmentMatches) {
    fixes.push({
      description: 'Replace "Alignment" with "Disposition"',
      originalText: match[1],
      correctedText: 'Disposition',
      category: 'Terminology',
      confidence: 'high'
    });
  }
  
  // Fix 2: Convert adjective alignments to noun form per Castle Zagyg rules
  const adjAlignmentMatches = [...text.matchAll(/\b(lawful|chaotic)\s+(good|evil|neutral)\b/gi)];
  for (const match of adjAlignmentMatches) {
    const adj1 = match[1].toLowerCase();
    const adj2 = match[2].toLowerCase();
    const noun1 = adj1 === 'lawful' ? 'law' : adj1 === 'chaotic' ? 'chaos' : adj1;
    const corrected = `${noun1}/${adj2}`;
    
    fixes.push({
      description: `Convert "${match[0]}" to noun form`,
      originalText: match[0],
      correctedText: corrected,
      category: 'Disposition Format',
      confidence: 'high'
    });
  }
  
  // Fix 2b: Convert single word alignments to slash form where appropriate
  const alignmentContext = [...text.matchAll(/(?:Disposition|Alignment)[^:]*:\s*([^\n]+)/gi)];
  for (const contextMatch of alignmentContext) {
    const contextText = contextMatch[1];
    const neutralGoodMatch = contextText.match(/\b(neutral)\s+(good|evil)\b/gi);
    if (neutralGoodMatch) {
      for (const match of neutralGoodMatch) {
        const parts = match.toLowerCase().split(' ');
        const corrected = parts.join('/');
        fixes.push({
          description: `Convert "${match}" to noun form with slash`,
          originalText: match,
          correctedText: corrected,
          category: 'Disposition Format',
          confidence: 'high'
        });
      }
    }
  }
  
  // Fix 3: Convert coinage abbreviations to full names (Castle Zagyg rule 12)
  const coinageMap = { pp: 'platinum', gp: 'gold', sp: 'silver', cp: 'copper', ep: 'electrum' };
  for (const [abbrev, full] of Object.entries(coinageMap)) {
    const pattern = new RegExp(`\\b(\\d+)\\s*(${abbrev})\\b`, 'gi');
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      fixes.push({
        description: `Replace "${match[2]}" with "${full}"`,
        originalText: match[0],
        correctedText: `${match[1]} ${full}`,
        category: 'Coinage Format',
        confidence: 'high'
      });
    }
  }
  
  // Fix 4: Convert two-word vision terms (Castle Zagyg rule 9)
  const newVisionFixes = [
    { old: 'darkvision', new: 'dark vision' },
    { old: 'infravision', new: 'dark vision' },
    { old: 'deepvision', new: 'deep vision' },
    { old: 'duskvision', new: 'dusk vision' },
    { old: 'twilightvision', new: 'twilight vision' }
  ];
  
  for (const { old, new: newTerm } of newVisionFixes) {
    const pattern = new RegExp(`\\b${old}\\b`, 'gi');
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      fixes.push({
        description: `Replace "${match[0]}" with two-word form "${newTerm}"`,
        originalText: match[0],
        correctedText: newTerm,
        category: 'Vision Terms',
        confidence: 'high'
      });
    }
  }
  
  // Fix 5: Convert ability terms (Castle Zagyg rule 10)
  const newAbilityFixes = [
    { old: 'improved grab', new: 'crushing grasp' },
    { old: 'bash', new: 'bash attack' }
  ];
  
  for (const { old, new: newTerm } of newAbilityFixes) {
    const pattern = new RegExp(`\\b${old}\\b`, 'gi');
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      fixes.push({
        description: `Replace "${match[0]}" with updated terminology "${newTerm}"`,
        originalText: match[0],
        correctedText: newTerm,
        category: 'Ability Terms',
        confidence: 'high'
      });
    }
  }
  
  // Fix 6: Convert uppercase attributes to lowercase (Castle Zagyg rule 4)
  const attributeMatches = [...text.matchAll(/\b(Str|Dex|Con|Int|Wis|Cha|Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b/g)];
  for (const match of attributeMatches) {
    const attr = match[1];
    let lowercase = attr.toLowerCase();
    // Convert abbreviations to full names
    const attrMap: { [key: string]: string } = {
      'str': 'strength', 'dex': 'dexterity', 'con': 'constitution',
      'int': 'intelligence', 'wis': 'wisdom', 'cha': 'charisma'
    };
    lowercase = attrMap[lowercase] || lowercase;
    
    if (attr !== lowercase) {
      fixes.push({
        description: `Convert "${attr}" to lowercase "${lowercase}"`,
        originalText: attr,
        correctedText: lowercase,
        category: 'Attribute Format',
        confidence: 'high'
      });
    }
  }
  
  // Fix 7: Italicize obvious magic items and spells
  const magicItemPatterns = [
    /\b(staff of \w+(?:\s+\w+)*)/gi,
    /\b(pectoral of \w+(?:\s+\w+)*)/gi,
    /\b(ring of \w+(?:\s+\w+)*)/gi,
    /\b(cloak of \w+(?:\s+\w+)*)/gi,
    /\b(boots of \w+(?:\s+\w+)*)/gi,
    /\b([\w\s]+\s+\+\d+)/gi
  ];
  
  for (const pattern of magicItemPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const item = match[1].trim();
      // Skip if already italicized
      if (!item.startsWith('*') && !item.endsWith('*') && 
          item.length > 5 && !item.match(/^\d/)) {
        fixes.push({
          description: `Italicize magic item "${item}"`,
          originalText: item,
          correctedText: `*${item}*`,
          category: 'Magic Item Format',
          confidence: 'high'
        });
      }
    }
  }
  
  // Fix 8: Fix magic item bonus placement (Castle Zagyg rule 5)
  const incorrectBonusMatches = [...text.matchAll(/\+(\d+)\s+([\w\s]+?)(?=\s|,|\.|\*|$)/g)];
  for (const match of incorrectBonusMatches) {
    const bonus = match[1];
    const item = match[2].trim();
    // For shields, always normalize to PHB type/material/bonus
    if (item.match(/\bshield\b/i) || item.match(/\bbuckler\b/i)) {
      const original = match[0];
      const normalized = normalizeShieldItems(original);
      fixes.push({
        description: `Normalize shield to PHB pattern (size material) shield +#: "${normalized.trim()}"`,
        originalText: original,
        correctedText: normalized.trim(),
        category: 'Shield Format',
        confidence: 'high'
      });
      continue;
    }
    // Only fix obvious weapon/armor items (not shields)
    if (item.match(/\b(?:sword|mace|armor|plate|mail|dagger|axe|bow)\b/i)) {
      fixes.push({
        description: `Move bonus to end: "${item} +${bonus}"`,
        originalText: match[0],
        correctedText: `${item} +${bonus}`,
        category: 'Magic Item Format',
        confidence: 'medium'
      });
    }
  }

  // Fix 5b: Normalize any remaining shield mentions anywhere in text, regardless of bonus order
  {
    const shieldGlobal = /\b(?:\+\s*\d+\s+)?(?:(?:an?\s+)?(?:buckler|small|medium|large|pavis)\s+)?(?:(?:wooden|steel)\s+)?shield\b(?:\s*\+\s*\d+)?|\bbuckler\b(?:\s*\+\s*\d+)?/gi;
    let m;
    while ((m = shieldGlobal.exec(text)) !== null) {
      const found = m[0];
      const normalized = normalizeShieldItems(found).trim();
      if (normalized !== found) {
        fixes.push({
          description: 'Normalize shield reference to PHB pattern',
          originalText: found,
          correctedText: normalized,
          category: 'Shield Format',
          confidence: 'high'
        });
      }
    }
  }
  
  // Fix 5c: Strip material qualifiers from buckler/pavis
  const bucklerPavisMaterialMatches = [...text.matchAll(/\b(wooden|steel)\s+(buckler|pavis)\b/gi)];
  for (const match of bucklerPavisMaterialMatches) {
    const material = match[1];
    const type = match[2];
    fixes.push({
      description: `Strip invalid material qualifier from ${type}`,
      originalText: match[0],
      correctedText: type,
      category: 'Shield Format',
      confidence: 'high'
    });
  }
  
  // Fix 6: Convert deprecated vision terminology
  const visionFixes = [
    { old: /\bdarkvision\b/gi, new: 'Dark Vision' },
    { old: /\binfravision\b/gi, new: 'Infra Vision' },
    { old: /\bultravision\b/gi, new: 'Ultra Vision' },
    { old: /\btruevision\b/gi, new: 'True Vision' },
    { old: /\blow[\s-]?light\s*vision\b/gi, new: 'Low Light Vision' }
  ];
  
  for (const { old, new: newTerm } of visionFixes) {
    const matches = [...text.matchAll(old)];
    for (const match of matches) {
      fixes.push({
        description: `Update vision terminology to "${newTerm}"`,
        originalText: match[0],
        correctedText: newTerm,
        category: 'Vision Terminology',
        confidence: 'high'
      });
    }
  }
  
  // Fix 7: Convert deprecated ability terminology
  const abilityFixes = [
    { old: /\bimproved grab\b/gi, new: 'crushing grasp' },
    { old: /\bimproved initiative\b/gi, new: 'enhanced initiative' },
    { old: /\bspell resistance\b/gi, new: 'magic resistance' }
  ];
  
  for (const { old, new: newTerm } of abilityFixes) {
    const matches = [...text.matchAll(old)];
    for (const match of matches) {
      fixes.push({
        description: `Update ability terminology to "${newTerm}"`,
        originalText: match[0],
        correctedText: newTerm,
        category: 'Ability Terminology',
        confidence: 'high'
      });
    }
  }
  
  // Fix 8: Expand prime attribute abbreviations
  const attributeFixes = [
    { old: /\bStr\b/g, new: 'Strength' },
    { old: /\bDex\b/g, new: 'Dexterity' },
    { old: /\bCon\b/g, new: 'Constitution' },
    { old: /\bInt\b/g, new: 'Intelligence' },
    { old: /\bWis\b/g, new: 'Wisdom' },
    { old: /\bCha\b/g, new: 'Charisma' }
  ];
  
  // Only apply to Prime Attributes section
  const paMatch = text.match(/Prime\s+Attributes[^:]*:\s*([^\n]+)/i);
  if (paMatch) {
    const paSection = paMatch[1];
    for (const { old, new: newTerm } of attributeFixes) {
      if (paSection.match(old)) {
        const correctedSection = paSection.replace(old, newTerm);
        fixes.push({
          description: `Expand "${old.source.replace(/\\b/g, '')}" to "${newTerm}"`,
          originalText: paSection,
          correctedText: correctedSection,
          category: 'Prime Attributes',
          confidence: 'high'
        });
      }
    }
  }
  
  // Fix 9: Convert Hit Point dice notation to sum (for classed NPCs)
  const hpDiceMatches = [...text.matchAll(/(?:Hit Points|HP)\s*[:=]\s*([^,\n]*\d+d\d+[^,\n]*)/gi)];
  for (const match of hpDiceMatches) {
    const diceNotation = match[1].trim();
    // Simple estimation for common dice
    const simpleConversion = diceNotation.replace(/(\d+)d(\d+)/g, (_, count, sides) => {
      const avgRoll = Math.floor((parseInt(sides) + 1) / 2);
      return String(parseInt(count) * avgRoll);
    });
    
    fixes.push({
      description: 'Convert dice notation to sum for classed NPC',
      originalText: diceNotation,
      correctedText: simpleConversion,
      category: 'Hit Points Format',
      confidence: 'medium'
    });
  }
  
  // Fix 10: Remove colons from title
  const titleMatch = text.match(/\*\*([^*]+)\*\*/);
  if (titleMatch && titleMatch[1].includes(':')) {
    const correctedTitle = titleMatch[1].replace(/:/g, ',');
    fixes.push({
      description: 'Replace colons with commas in title',
      originalText: titleMatch[1],
      correctedText: correctedTitle,
      category: 'Title Format',
      confidence: 'high'
    });
  }
  
  return fixes;
}

// Apply a specific fix to text
export function applyCorrectionFix(text: string, fix: CorrectionFix): string {
  return text.replace(new RegExp(escapeRegExp(fix.originalText), 'g'), fix.correctedText);
}

// Apply all high-confidence fixes automatically
export function applyAllHighConfidenceFixes(text: string): string {
  const fixes = generateAutoCorrectionFixes(text);
  const highConfidenceFixes = fixes.filter(fix => fix.confidence === 'high');
  
  let correctedText = text;
  for (const fix of highConfidenceFixes) {
    correctedText = applyCorrectionFix(correctedText, fix);
  }
  
  return correctedText;
}

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateStatBlock(text: string): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const { title, body } = splitTitleAndBody(text);
  
  // Generate auto-correction fixes
  const fixes = generateAutoCorrectionFixes(text);
  
  // Core C&C Compliance Checks based on comprehensive checklist
  
  // 1. Heading Formatting Discrepancy
  validateHeadingFormat(title, warnings);
  
  // 2. Missing Formal Address (if applicable)
  validateFormalAddress(text, warnings);
  
  // 3. Deprecated "Alignment" Terminology
  validateAlignmentTerminology(body, warnings);
  
  // 4. Incorrect Disposition Noun Formatting
  validateDispositionNounFormat(body, warnings);
  
  // 5. Improper Level Formatting
  validateLevelFormatting(body, warnings);
  
  // 6. Incorrect Hit Point Presentation for Classed NPCs
  validateHitPointFormat(body, warnings);
  
  // 7. Deprecated Coinage Abbreviations
  validateCoinageTerminology(body, warnings);
  
  // 8. Non-Italicized Magic Item Names
  validateMagicItemItalicization(body, warnings);
  
  // 9. Missing Mechanical Explanation for Magic Items
  validateMagicItemExplanations(body, warnings);
  
  // 10. Incorrect Magic Item Bonus Placement
  validateMagicItemBonusPlacement(body, warnings);
  
  // 11. Individual Spells Listed for General NPCs
  validateSpellListingFormat(body, warnings);
  
  // 12. Incorrect Race-Before-Class Order for Multiclass
  validateRaceClassOrder(body, warnings);
  
  // 13. Unjustified Gendered Pronouns
  validateGenderedPronouns(body, warnings);
  
  // 14. Castle Zagyg Vision Type Terminology (two-word forms)
  validateCastleZagygVisionTerminology(body, warnings);
  
  // 15. Castle Zagyg Ability Terminology (crushing grasp, bash attack)
  validateCastleZagygAbilities(body, warnings);
  
  // 16. Missing Mechanical Explanation for Unique Abilities
  validateUniqueAbilities(body, warnings);
  
  // Additional C&C specific checks
  
  // 17. Missing Required Core Fields
  validateRequiredFields(body, warnings);
  
  // 18. Prime Attributes Format and Terminology
  validatePrimeAttributes(body, warnings);
  
  // 19. Mount Format and Statistics
  validateMountFormat(body, warnings);
  
  // 20. Superscript Usage in Levels
  validateSuperscriptLevels(body, warnings);

  // 21. Missing Parenthetical AC Structure (AC should be base/magical if magical)
  validateACStructure(body, warnings);

  // 22. Title Formatting Issues (colons in title)
  validateTitleColons(title, warnings);

  // 23. Multiple Equipment Sections
  validateEquipmentSectionCount(body, warnings);

  // 24. Shield Type Material Enforcement
  validateShieldTypes(body, warnings);

  const errorCount = warnings.filter(w => w.type === 'error').length;
  const warningCount = warnings.filter(w => w.type === 'warning').length;
  const infoCount = warnings.filter(w => w.type === 'info').length;
  
  const totalChecks = 24;
  const issueCount = errorCount + (warningCount * 0.5) + (infoCount * 0.1);
  const complianceScore = Math.max(0, Math.round(((totalChecks - issueCount) / totalChecks) * 100));
  
  return {
    warnings,
    isValid: errorCount === 0,
    complianceScore,
    fixes
  };
}

// 1. Heading Formatting Discrepancy
function validateHeadingFormat(title: string, warnings: ValidationWarning[]) {
  // Check for proper bold formatting
  if (!title.includes('**') || !title.match(/^\*\*.*\*\*$/)) {
    warnings.push({
      type: 'error',
      category: 'Heading Format',
      message: 'Main heading does not follow proper bold formatting',
      suggestion: 'Format: **NPC Name** or **Full Title, Name, Office** for higher ranks'
    });
  }
  
  // Check for deprecated colon usage in title
  if (title.includes(':')) {
    warnings.push({
      type: 'error',
      category: 'Heading Format',
      message: 'Title contains colon - C&C convention requires comma separation instead',
      suggestion: 'Remove colons from the main heading and use commas'
    });
  }
  
  // Relax honorific requirements for lower-rank NPCs
  const cleanTitle = title.replace(/\*\*/g, '').trim();
  const isHighRank = cleanTitle.toLowerCase().includes('counselor') || 
                     cleanTitle.toLowerCase().includes('president') ||
                     cleanTitle.toLowerCase().includes('high priest') ||
                     cleanTitle.toLowerCase().includes('supernal') ||
                     cleanTitle.toLowerCase().includes('honorable');
  
  // Only require full honorifics for high-ranking NPCs
  if (isHighRank && (!cleanTitle.includes(',') || cleanTitle.split(' ').length < 5)) {
    warnings.push({
      type: 'warning',
      category: 'Heading Format',
      message: 'High-ranking NPC should include full honorifics and titles',
      suggestion: 'Include full titles, honorifics, and offices for Council members and high officials'
    });
  } else if (!isHighRank && !cleanTitle.includes(',') && cleanTitle.split(' ').length < 2) {
    warnings.push({
      type: 'info',
      category: 'Heading Format',
      message: 'Consider adding title or description for clarity',
      suggestion: 'Format: **Name, Title** or **Name** for simple NPCs'
    });
  }
}

// 2. Missing Formal Address
function validateFormalAddress(text: string, warnings: ValidationWarning[]) {
  // For high-ranking NPCs, check if formal address is present
  const title = text.match(/\*\*([^*]+)\*\*/)?.[1] || '';
  if (title.toLowerCase().includes('counselor') || title.toLowerCase().includes('president') || 
      title.toLowerCase().includes('high priest') || title.toLowerCase().includes('supernal')) {
    if (!text.match(/Formal Address:/i)) {
      warnings.push({
        type: 'info',
        category: 'Formal Address',
        message: 'High-ranking NPC may be missing formal address line',
        suggestion: 'Consider adding "Formal Address: His Supernal Devotion" or similar'
      });
    }
  }
}

// 3. Deprecated "Alignment" Terminology Used
function validateAlignmentTerminology(body: string, warnings: ValidationWarning[]) {
  if (body.match(/\balignment\b/i)) {
    warnings.push({
      type: 'error',
      category: 'Deprecated Terminology',
      message: 'Term "alignment" has been entirely replaced by "disposition" in C&C',
      suggestion: 'Replace "Alignment:" with "Disposition:" - comprehensive search and replacement required'
    });
  }
  
  // Check for adjective forms that should be nouns
  if (body.match(/\b(?:lawful|chaotic)\s+(?:good|evil|neutral)\b/i)) {
    warnings.push({
      type: 'error',
      category: 'Deprecated Terminology',
      message: 'Adjective alignment terms detected - use noun forms instead',
      suggestion: 'Replace "lawful good" with "law/good", "chaotic evil" with "chaos/evil"'
    });
  }
}

// 4. Incorrect Disposition Noun Formatting
function validateDispositionNounFormat(body: string, warnings: ValidationWarning[]) {
  const extractedDisp = extractDisposition(body);
  
  // If we found disposition, check if the original format was adjectives
  if (extractedDisp) {
    const dispMatch = body.match(/(?:Disposition|Alignment)[^:]*:\s*([^\n]+)/i);
    if (dispMatch) {
      const originalDisp = dispMatch[1].toLowerCase().trim();
      
      // Check for adjective forms (should be nouns)
      if (originalDisp.match(/\b(?:lawful|chaotic)\s+(?:good|evil|neutral)\b/)) {
        warnings.push({
          type: 'error',
          category: 'Disposition Format',
          message: 'Disposition expressed as adjectives (e.g., "chaotic good") rather than nouns',
          suggestion: 'Use noun forms: "chaos/good" or "law/good" instead'
        });
      }
      
      // Check for missing slash separation in compound dispositions
      if ((originalDisp.includes('good') || originalDisp.includes('evil')) && 
          !originalDisp.includes('/') && originalDisp.split(' ').length > 1) {
        warnings.push({
          type: 'error',
          category: 'Disposition Format',
          message: 'Disposition must use slash separation for compound values',
          suggestion: 'Format as "law/good", "chaos/evil", etc.'
        });
      }
    }
  }
}

// 5. Improper Level Formatting
function validateLevelFormatting(body: string, warnings: ValidationWarning[]) {
  const levelMatches = [...body.matchAll(/(\d+)(?:st|nd|rd|th)?\s*level/gi)];
  for (const match of levelMatches) {
    const levelNum = match[1];
    const fullMatch = match[0];
    
    // Check if it's properly superscripted in source (would indicate awareness)
    if (!fullMatch.includes('ᵗʰ') && !fullMatch.includes('ˢᵗ') && !fullMatch.includes('ⁿᵈ') && !fullMatch.includes('ʳᵈ')) {
      warnings.push({
        type: 'info',
        category: 'Level Formatting',
        message: 'Character levels should be superscripted and bolded when outside italicized stat blocks',
        suggestion: `Level will be formatted as ${levelNum}${getOrdinalSuffix(levelNum)} in output`
      });
      break; // Only warn once
    }
  }
  
  // Check for fully spelled out levels (e.g., "sixteenth level")
  const spelledOutLevels = [
    'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
    'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 
    'eighteenth', 'nineteenth', 'twentieth'
  ];
  
  for (const level of spelledOutLevels) {
    if (body.match(new RegExp(`\\b${level}\\s+level\\b`, 'i'))) {
      warnings.push({
        type: 'warning',
        category: 'Level Formatting',
        message: `Character level is fully typed out ("${level} level") rather than using numeric abbreviation`,
        suggestion: 'Use "16th level" instead of "sixteenth level"'
      });
      break;
    }
  }
}

// 6. Incorrect Hit Point Presentation for Classed NPCs
function validateHitPointFormat(body: string, warnings: ValidationWarning[]) {
  const hpMatch = body.match(/Hit\s+Points[^:]*:\s*([^\n]+)/i) || body.match(/HP[^:]*:\s*([^\n]+)/i);
  if (hpMatch) {
    const hpValue = hpMatch[1].trim();
    
    // Check for dice notation (should be sum for classed NPCs)
    if (hpValue.match(/\d+d\d+/)) {
      warnings.push({
        type: 'error',
        category: 'Hit Points Format',
        message: 'Hit points for classed NPCs must be presented as numerical sum, not dice equation',
        suggestion: 'Use "59" instead of "4d10" for classed characters'
      });
    }
    
    // Additional check for multiple dice expressions
    if ((hpValue.match(/d/g) || []).length > 1) {
      warnings.push({
        type: 'error',
        category: 'Hit Points Format',
        message: 'Complex dice notation detected - classed NPCs should use simple numerical values',
        suggestion: 'Calculate total HP and use single number'
      });
    }
  }
}

// 7. Deprecated Coinage Abbreviations
function validateCoinageTerminology(body: string, warnings: ValidationWarning[]) {
  const coinagePatterns = [
    { abbrev: 'pp', full: 'platinum' },
    { abbrev: 'gp', full: 'gold' },
    { abbrev: 'sp', full: 'silver' },
    { abbrev: 'cp', full: 'copper' },
    { abbrev: 'ep', full: 'electrum' }
  ];
  
  for (const { abbrev, full } of coinagePatterns) {
    // Look for abbreviations with numbers
    const pattern = new RegExp(`\\b\\d+\\s*${abbrev}\\b`, 'i');
    if (body.match(pattern)) {
      warnings.push({
        type: 'warning',
        category: 'Coinage Format',
        message: `Coinage abbreviation "${abbrev}" must be replaced with full material name`,
        suggestion: `Use "${full}" instead of "${abbrev}" - abbreviations are deprecated in C&C`
      });
    }
  }
  
  // Check for isolated abbreviations
  const isolatedPattern = /\b(?:pp|gp|sp|cp|ep)\b/gi;
  const matches = [...body.matchAll(isolatedPattern)];
  const uniqueMatches = new Set(matches.map(m => m[0]));
  if (uniqueMatches.size > 0) {
    warnings.push({
      type: 'warning',
      category: 'Coinage Format',
      message: 'Coinage abbreviations detected - must use full material names',
      suggestion: 'Replace all coinage abbreviations with "platinum", "gold", "silver", "copper"'
    });
  }
}

// 8. Non-Italicized Magic Item Names
function validateMagicItemItalicization(body: string, warnings: ValidationWarning[]) {
  // Enhanced patterns for magic items
  const magicPatterns = [
    /\b(?:staff|wand|ring|cloak|boots|amulet|pectoral|bracers|girdle|rod|scroll|robe|helm|crown)\s+of\s+[\w\s]+/gi,
    /\b[\w\s]*\+\d+[\w\s]*/g,
    /\b(?:staff|wand|ring|cloak|boots|amulet|pectoral|bracers|girdle|rod|scroll)\s+[\w\s]*\+\d+/gi
  ];
  
  const foundItems = new Set<string>();
  
  for (const pattern of magicPatterns) {
    const matches = [...body.matchAll(pattern)];
    for (const match of matches) {
      const item = match[0].trim();
      // Skip if already italicized or if it's just a number
      if (!item.startsWith('*') && !item.endsWith('*') && item.length > 3 && !item.match(/^\d/) && !item.match(/^\+\d+$/)) {
        foundItems.add(item);
      }
    }
  }
  
  // Check for common magic weapons that should be italicized
  const weaponBonuses = [...body.matchAll(/\+(\d+)\s+([\w\s]+?)(?:,|\.|\s|$)/g)];
  for (const match of weaponBonuses) {
    const weapon = match[2].trim();
    if (weapon.match(/\b(?:sword|mace|dagger|axe|hammer|bow|crossbow)\b/i) && weapon.length < 20) {
      foundItems.add(`${weapon} +${match[1]}`);
    }
  }
  
  for (const item of foundItems) {
    warnings.push({
      type: 'warning',
      category: 'Magic Item Format',
      message: `Magic item "${item}" should be italicized when mentioned by name`,
      suggestion: 'Format as *magic item name* outside italicized stat blocks'
    });
  }
}

// 9. Missing Mechanical Explanation for Magic Items
function validateMagicItemExplanations(body: string, warnings: ValidationWarning[]) {
  // Find italicized magic items
  const magicItems = [...body.matchAll(/\*([^*]+(?:\+\d+|staff of|wand of|ring of|cloak of|boots of|amulet of|pectoral of)[^*]*)\*/gi)];
  
  for (const match of magicItems) {
    const item = match[1].toLowerCase();
    
    // Items that typically need explanation
    const needsExplanation = [
      'staff of striking',
      'pectoral of protection',
      'ring of',
      'cloak of',
      'boots of',
      'wand of'
    ];
    
    const needsExpl = needsExplanation.some(pattern => item.includes(pattern));
    
    if (needsExpl) {
      // Check if explanation exists in vicinity
      const context = body.substr(Math.max(0, match.index! - 100), 200);
      if (!context.match(/\([^)]*(?:AC|damage|protection|effect|bonus)[^)]*\)/i)) {
        warnings.push({
          type: 'error',
          category: 'Magic Item Explanation',
          message: `Magic item "${match[1]}" lacks required mechanical explanation`,
          suggestion: 'Include brief description of magic item effects - no magic item should be printed without mechanical explanation'
        });
      }
    }
  }
}

// 10. Incorrect Magic Item Bonus Placement
function validateMagicItemBonusPlacement(body: string, warnings: ValidationWarning[]) {
  // Look for bonuses at start of item names (incorrect)
  const incorrectPlacements = [...body.matchAll(/\*\+(\d+)\s+([^*]+)\*/g)];
  
  for (const match of incorrectPlacements) {
    warnings.push({
      type: 'error',
      category: 'Magic Item Format',
      message: `Magic item bonus incorrectly placed at beginning: "+${match[1]} ${match[2]}"`,
      suggestion: `Move numerical bonus to end: "${match[2]} +${match[1]}"`
    });
  }
  
  // Also check non-italicized items with incorrect bonus placement
  const nonItalicizedIncorrect = [...body.matchAll(/\+(\d+)\s+([\w\s]+)(?:,|\.|$)/g)];
  for (const match of nonItalicizedIncorrect) {
    const item = match[2].trim();
    if (item.match(/\b(?:sword|mace|shield|armor|plate|mail)\b/i)) {
      warnings.push({
        type: 'warning',
        category: 'Magic Item Format',
        message: `Potential magic item with incorrect bonus placement: "+${match[1]} ${item}"`,
        suggestion: `Should be "${item} +${match[1]}" and italicized`
      });
    }
  }
}

// 11. Individual Spells Listed for General NPCs
function validateSpellListingFormat(body: string, warnings: ValidationWarning[]) {
  // Check if individual spell names are listed instead of numeric spread
  const commonSpells = [
    'cure light wounds', 'cure serious wounds', 'heal', 'bless', 'protection from evil',
    'fireball', 'lightning bolt', 'magic missile', 'charm person', 'sleep',
    'detect magic', 'dispel magic', 'hold person', 'silence', 'spiritual weapon'
  ];
  
  let foundSpells = 0;
  for (const spell of commonSpells) {
    if (body.match(new RegExp(`\\b${spell}\\b`, 'i'))) {
      foundSpells++;
    }
  }
  
  if (foundSpells > 0) {
    warnings.push({
      type: 'warning',
      category: 'Spell Format',
      message: 'Individual spell names listed - should use numeric spread unless essential to encounter',
      suggestion: 'Use format like "0–6, 1st–6, 2nd–5" instead of listing specific spell names'
    });
  }
  
  // Check for spell lists in Equipment or other inappropriate sections
  if (body.match(/Equipment:[^:\n]*(?:cure|heal|bless|fireball|magic)/i)) {
    warnings.push({
      type: 'error',
      category: 'Spell Format',
      message: 'Spells listed in Equipment section - should be in separate Spells section',
      suggestion: 'Move spell information to proper "Spells:" section'
    });
  }
}

// 12. Incorrect Race-Before-Class Order for Multiclass/Dual-Class NPCs
function validateRaceClassOrder(body: string, warnings: ValidationWarning[]) {
  // Look for multiclass indicators
  const multiclassPatterns = [
    /(\w+)\s*\/\s*(\w+),\s*(\d+)(?:st|nd|rd|th)?\s*level/gi,  // class/class, level
    /(\d+)(?:st|nd|rd|th)?\s*level\s*(\w+)\s*\/\s*(\w+)/gi    // level class/class
  ];
  
  for (const pattern of multiclassPatterns) {
    const matches = [...body.matchAll(pattern)];
    for (const match of matches) {
      // Check if race appears after classes
      const context = match[0];
      if (!context.match(/(?:human|elf|dwarf|halfling|gnome|half-orc|half-elf)\s*,/i)) {
        warnings.push({
          type: 'warning',
          category: 'Race-Class Order',
          message: 'For multiclass/dual-class NPCs, race should be placed before level and class',
          suggestion: 'Format: "human, 1st level fighter/1st level magic-user" for better linguistic flow'
        });
        break;
      }
    }
  }
}

// 13. Unjustified Gendered Pronouns
function validateGenderedPronouns(body: string, warnings: ValidationWarning[]) {
  const pronouns = ['\\bhe\\b', '\\bshe\\b', '\\bhis\\b', '\\bher\\b', '\\bhim\\b', '\\bhers\\b'];
  const foundPronouns: string[] = [];
  
  for (const pronoun of pronouns) {
    const matches = body.match(new RegExp(pronoun, 'gi'));
    if (matches) {
      foundPronouns.push(...matches);
    }
  }
  
  if (foundPronouns.length > 0) {
    // Check for explicit gender indicators
    const genderIndicators = [
      '\\bmale\\b', '\\bfemale\\b', '\\bman\\b', '\\bwoman\\b',
      '\\bpriest\\b', '\\bpriestess\\b', '\\bactor\\b', '\\bactress\\b',
      '\\bking\\b', '\\bqueen\\b', '\\blord\\b', '\\blady\\b'
    ];
    
    const hasGenderStatement = genderIndicators.some(indicator => 
      body.match(new RegExp(indicator, 'i'))
    );
    
    if (!hasGenderStatement) {
      warnings.push({
        type: 'warning',
        category: 'Gendered Pronouns',
        message: 'Gendered pronouns used without explicit gender statement in stat block',
        suggestion: 'Only use gendered pronouns when gender is explicitly stated (e.g., "priestess", "male", etc.)'
      });
    }
  }
}

// 14. Deprecated Vision Type Terminology
function validateVisionTerminology(body: string, warnings: ValidationWarning[]) {
  const deprecatedVision = [
    { old: 'darkvision', new: 'Dark Vision' },
    { old: 'infravision', new: 'Infra Vision' },
    { old: 'ultravision', new: 'Ultra Vision' },
    { old: 'lowlightvision', new: 'Low Light Vision' },
    { old: 'low-lightvision', new: 'Low Light Vision' },
    { old: 'truevision', new: 'True Vision' }
  ];
  
  for (const { old, new: newTerm } of deprecatedVision) {
    if (body.match(new RegExp(`\\b${old.replace('-', '[-\\s]?')}\\b`, 'i'))) {
      warnings.push({
        type: 'warning',
        category: 'Vision Terminology',
        message: `Vision type "${old}" should be two words: "${newTerm}"`,
        suggestion: `Replace "${old}" with "${newTerm}" - vision types are now two words in C&C`
      });
    }
  }
}

// 15. Deprecated "Improved Grab" Terminology
function validateDeprecatedAbilities(body: string, warnings: ValidationWarning[]) {
  const deprecatedAbilities = [
    { old: 'improved grab', new: 'crushing grasp' },
    { old: 'improved initiative', new: 'enhanced initiative' },
    { old: 'spell resistance', new: 'magic resistance' }
  ];
  
  for (const { old, new: newTerm } of deprecatedAbilities) {
    if (body.match(new RegExp(`\\b${old}\\b`, 'i'))) {
      warnings.push({
        type: 'warning',
        category: 'Ability Terminology',
        message: `"${old}" is deprecated terminology in C&C`,
        suggestion: `Replace with "${newTerm}" - ability terminology has been updated`
      });
    }
  }
}

// 16. Missing Mechanical Explanation for Unique Abilities
function validateUniqueAbilities(body: string, warnings: ValidationWarning[]) {
  // Look for special abilities that might need explanation
  const specialAbilities = [
    'special attack', 'special defense', 'spell-like', 'supernatural',
    'extraordinary', 'breath weapon', 'energy drain', 'level drain'
  ];
  
  for (const ability of specialAbilities) {
    if (body.match(new RegExp(`\\b${ability}\\b`, 'i'))) {
      // Check if there's a mechanical explanation nearby
      const abilityIndex = body.toLowerCase().indexOf(ability.toLowerCase());
      const context = body.substr(Math.max(0, abilityIndex - 50), 150);
      
      if (!context.match(/\([^)]*(?:damage|save|DC|round|turn|effect)[^)]*\)/i)) {
        warnings.push({
          type: 'info',
          category: 'Unique Abilities',
          message: `Special ability "${ability}" may lack mechanical explanation`,
          suggestion: 'Include truncated mechanical explanation for unique abilities not in core rulebooks'
        });
      }
    }
  }
}

// 17. Missing Required Core Fields
function validateRequiredFields(body: string, warnings: ValidationWarning[]) {
  const requiredFields = [
    { 
      field: 'Disposition', 
      check: () => extractDisposition(body) !== null,
      message: 'Required field "Disposition" is missing from stat block'
    },
    { 
      field: 'Race & Class/Level', 
      check: () => body.match(/(?:Race.*Class|level.*\w+|human.*level|elf.*level)/i) !== null,
      message: 'Race and class information is missing or unclear'
    },
    { 
      field: 'Hit Points', 
      check: () => body.match(/(?:Hit Points|HP)\s*[:=]/i) !== null,
      message: 'Hit Points field is missing from stat block'
    },
    { 
      field: 'Armor Class', 
      check: () => body.match(/(?:Armor Class|AC)\s*[:=]/i) !== null,
      message: 'Armor Class field is missing from stat block'
    }
  ];
  
  for (const { field, check, message } of requiredFields) {
    if (!check()) {
      warnings.push({
        type: 'error',
        category: 'Missing Required Field',
        message,
        suggestion: `Add ${field} information to complete C&C stat block`
      });
    }
  }
}

// 18. Prime Attributes Format and Terminology
function validatePrimeAttributes(body: string, warnings: ValidationWarning[]) {
  const paMatch = body.match(/Prime\s+Attributes[^:]*:\s*([^\n]+)/i);
  if (paMatch) {
    const attributes = paMatch[1].toLowerCase();
    
    // Check for abbreviated forms
    const abbreviations = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const foundAbbrevs = abbreviations.filter(abbrev => 
      attributes.includes(abbrev.toLowerCase())
    );
    
    if (foundAbbrevs.length > 0) {
      warnings.push({
        type: 'warning',
        category: 'Primary Attributes Format',
        message: 'Primary attributes use abbreviations - should be spelled out in full',
        suggestion: 'Use "Strength, Wisdom, Charisma" instead of "Str, Wis, Cha"'
      });
    }
    
    // Check for proper order (PHB order)
    const properOrder = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const mentionedAttrs = properOrder.filter(attr => attributes.includes(attr));
    
    if (mentionedAttrs.length > 1) {
      const currentOrder = attributes.split(',').map(s => s.trim());
      let orderCorrect = true;
      let lastIndex = -1;
      
      for (const current of currentOrder) {
        const index = properOrder.indexOf(current);
        if (index !== -1 && index < lastIndex) {
          orderCorrect = false;
          break;
        }
        if (index !== -1) lastIndex = index;
      }
      
      if (!orderCorrect) {
        warnings.push({
          type: 'info',
          category: 'Primary Attributes Order',
          message: 'Primary attributes not in Player\'s Handbook order',
          suggestion: 'Order: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma'
        });
      }
    }
  }
}

// 19. Mount Format and Statistics
function validateMountFormat(body: string, warnings: ValidationWarning[]) {
  const mountMatch = body.match(/Mount\s*:\s*([^\n]+)/i);
  if (mountMatch) {
    const mountText = mountMatch[1].toLowerCase();
    
    if (mountText.includes('horse') || mountText.includes('mount')) {
      // New guidance: default to minimal mention; do not suggest stats for standard mounts
      if (mountText.includes('warhorse') && !mountText.includes('heavy war horse')) {
        warnings.push({
          type: 'info',
          category: 'Mount Terminology',
          message: 'Consider specifying "heavy war horse" for clarity',
          suggestion: 'Use "heavy war horse" for standard war mounts'
        });
      }
    }
  }
}

// 20. Superscript Usage in Levels
function validateSuperscriptLevels(body: string, warnings: ValidationWarning[]) {
  // This checks the input format awareness
  const levelMatches = [...body.matchAll(/(\d+)(st|nd|rd|th)\s+level/gi)];
  
  for (const match of levelMatches) {
    const suffix = match[2].toLowerCase();
    const expectedSuperscript = getOrdinalSuffix(match[1]);
    
    if (!match[0].includes('ᵗʰ') && !match[0].includes('ˢᵗ') && 
        !match[0].includes('ⁿᵈ') && !match[0].includes('ʳᵈ')) {
      warnings.push({
        type: 'info',
        category: 'Superscript Formatting',
        message: 'Level ordinals should use superscript formatting in final C&C output',
        suggestion: `Level "${match[1]}${suffix}" will be formatted as "${match[1]}${expectedSuperscript}"`
      });
      break; // Only warn once about superscripts
    }
  }
}

// 21. Missing Parenthetical AC Structure
function validateACStructure(body: string, warnings: ValidationWarning[]) {
  const acMatch = body.match(/(?:Armor Class|AC)\s*[:=]\s*([^\n]+)/i);
  if (acMatch) {
    const acValue = acMatch[1].trim();
    
    // Check for complex AC breakdown that should be simplified
    if (acValue.includes('(') && acValue.includes('+')) {
      warnings.push({
        type: 'warning',
        category: 'AC Format',
        message: 'AC contains complex breakdown - C&C prefers simple numerical values',
        suggestion: 'Calculate total AC and present as single number or base/magical format'
      });
    }
    
    // // Check if it's a single number when it should be base/magical
    if (/^\d+$/.test(acValue)) {
      warnings.push({
        type: 'info',
        category: 'AC Format',
        message: 'AC appears to be single value - consider if base/magical format is appropriate',
        suggestion: 'If character has magical AC bonuses, format as "13/22" (base/magical)'
      });
    }
  }
}

// 22. Title Formatting Issues (colons in title)
function validateTitleColons(title: string, warnings: ValidationWarning[]) {
  if (title.includes(':')) {
    warnings.push({
      type: 'error',
      category: 'Title Format',
      message: 'Title contains colon - C&C convention requires comma separation instead',
      suggestion: 'Replace colons in title with commas for proper C&C formatting'
    });
  }
}

// 23. Multiple Equipment Sections
function validateEquipmentSectionCount(body: string, warnings: ValidationWarning[]) {
  const equipmentMatches = [...body.matchAll(/Equipment\s*:/gi)];
  if (equipmentMatches.length > 1) {
    warnings.push({
      type: 'warning',
      category: 'Equipment Format',
      message: 'Multiple Equipment sections detected - should consolidate into single section',
      suggestion: 'Combine all equipment into one "Equipment:" section'
    });
  }
  
  // Check for equipment in other sections
  if (body.match(/(?:Gear|Items|Possessions)\s*:/i)) {
    warnings.push({
      type: 'warning',
      category: 'Equipment Format',
      message: 'Non-standard equipment section labels detected',
      suggestion: 'Use standard "Equipment:" label for all gear and items'
    });
  }
}

// 24. Shield Type Material Enforcement (PHB forms only)
function validateShieldTypes(body: string, warnings: ValidationWarning[]) {
  // Acceptable forms:
  // - buckler (optional +#)
  // - pavis (optional +#)
  // - (small|medium|large) (steel|wooden) shield (optional +#)
  // Everything else should be flagged and ideally normalized.
  const acceptable = new RegExp(
    String.raw`\b(?:buckler|pavis)(?:\s*\+\s*\d+)?\b|\b(?:small|medium|large)\s+(?:steel|wooden)\s+shield(?:\s*\+\s*\d+)?\b`,
    'gi'
  );

  // Find all shield-ish mentions
  const shieldish = /\b(?:\+\s*\d+\s+)?(?:(?:an?\s+)?(?:buckler|small|medium|large|pavis)\s+)?(?:(?:wooden|steel)\s+)?shield\b(?:\s*\+\s*\d+)?|\bbuckler\b(?:\s*\+\s*\d+)?|\bpavis\b(?:\s*\+\s*\d+)?/gi;
  const matches = [...body.matchAll(shieldish)].map(m => m[0]);
  for (const m of matches) {
    const isOk = !!m.match(acceptable);
    if (!isOk) {
      warnings.push({
        type: 'warning',
        category: 'Shield Type',
        message: `Non-PHB shield reference detected: "${m}"`,
        suggestion: 'Use PHB forms only: buckler, pavis, or (small|medium|large) (steel|wooden) shield [+#]'
      });
    }
  }

  // Explicitly flag material qualifiers on buckler/pavis
  const badBucklerPavis = [...body.matchAll(/\b(?:wooden|steel)\s+(buckler|pavis)\b/gi)].map(m => m[0]);
  for (const bad of badBucklerPavis) {
    warnings.push({
      type: 'warning',
      category: 'Shield Type',
      message: `Material qualifiers are invalid for buckler/pavis: "${bad}"`,
      suggestion: 'Use "buckler" or "pavis" without material qualifiers'
    });
  }
}

// Enhanced process function that includes validation
export interface ProcessedNPC {
  original: string;
  converted: string;
  validation: ValidationResult;
}

export function processDumpWithValidation(dump: string): ProcessedNPC[] {
  const cleanedDump = dump.trim();
  
  if (!cleanedDump || isCodeContent(cleanedDump)) {
    return [];
  }
  
  let blocks = cleanedDump.split(/\n\s*\n/).filter(block => block.trim());
  
  if (blocks.length === 1) {
    const boldNameMatches = [...cleanedDump.matchAll(/\*\*[^*]+\*\*/g)];
    if (boldNameMatches.length > 1) {
      const parts = cleanedDump.split(/(?=\*\*[^*]+\*\*)/);
      blocks = parts.filter(part => part.trim() && /\*\*[^*]+\*\*/.test(part));
    }
  }
  
  const results: ProcessedNPC[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    let block = blocks[i];
    let trimmedBlock = block.trim();
    
    if (!trimmedBlock || isCodeContent(trimmedBlock)) {
      continue;
    }
    // Merge preceding title-only lines with following stat body
    if (looksLikeTitleOnlyBlock(trimmedBlock) && i + 1 < blocks.length && looksLikeStatBodyBlock(blocks[i + 1])) {
      trimmedBlock = `${trimmedBlock}\n${blocks[i + 1].trim()}`;
      i++;
    }

    if (!hasNPCIndicators(trimmedBlock)) {
      continue;
    }
    
    try {
      const converted = collapseNPCEntry(trimmedBlock);
      const validation = validateStatBlock(trimmedBlock);
      
      if (converted && converted.length > 20) {
        results.push({
          original: trimmedBlock,
          converted,
          validation
        });
      }
    } catch (error) {
      console.error('Error processing NPC block:', error);
    }
  }
  
  return results;
}

// New Castle Zagyg Unified Rules Validation Functions

function validateCastleZagygVisionTerminology(body: string, warnings: ValidationWarning[]) {
  const singleWordVision = ['darkvision', 'infravision', 'deepvision', 'duskvision', 'twilightvision'];
  
  for (const term of singleWordVision) {
    if (body.toLowerCase().includes(term)) {
      const correctForm = term.replace('vision', ' vision');
      warnings.push({
        type: 'error',
        category: 'Vision Terminology',
        message: `Use two-word form: "${correctForm}" instead of "${term}"`,
        suggestion: 'Castle Zagyg standard requires two-word vision forms'
      });
    }
  }
}

function validateCastleZagygAbilities(body: string, warnings: ValidationWarning[]) {
  if (/\bimproved grab\b/i.test(body)) {
    warnings.push({
      type: 'error',
      category: 'Ability Terminology',
      message: 'Use "crushing grasp" instead of "improved grab"',
      suggestion: 'Castle Zagyg standard terminology update'
    });
  }
  
  if (/\bbash\b/i.test(body) && !/\bbash attack\b/i.test(body)) {
    warnings.push({
      type: 'warning',
      category: 'Ability Terminology',
      message: 'Use "bash attack" instead of "bash"',
      suggestion: 'Castle Zagyg standard requires full terminology'
    });
  }
}