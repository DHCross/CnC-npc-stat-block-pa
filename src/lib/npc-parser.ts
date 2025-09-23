  // Normalize random capitalization in parenthetical/stat block lines
  body = body.replace(/\(([^)]+)\)/g, (m: string, p1: string) => {
    // Lowercase mechanical terms and attributes
    let inner = p1.replace(/\b(HD|HP|AC|disposition|primary attribute|secondary skill|equipment|prime attribute|attributes|level|human|elf|dwarf|halfling|orc|gnome|cleric|fighter|wizard|magic-user|thief|paladin|ranger|monk|bard|illusionist|business)\b/gi, (mm: string) => mm.toLowerCase());
    // Lowercase after punctuation (for sentence case)
    inner = inner.replace(/([.!?]\s*)([A-Z])/g, (match: string, punc: string, char: string) => punc + char.toLowerCase());
    // Lowercase first word if not a proper noun
    inner = inner.replace(/^([A-Z][a-z]+)(\s)/, (match: string, word: string, space: string) => word.toLowerCase() + space);
    return `(${inner})`;
  });
// --- NPC Stat Block Parser for Original Castles & Crusades Format ---
// Produces narrative format matching the Victor Oldham reference style

// Split title and body to prevent title contamination
function splitTitleAndBody(src: string): { title: string; body: string } {
  const text = src.trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Find title - look for bold text at the beginning
  let titleLines: string[] = [];
  let bodyStartIdx = 0;
  // Only allow bold in the title, never in body
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      titleLines.push(line);
    } else if (line.match(/^(Disposition|Race|Hit Points|Armor Class|Prime|Equipment|Spells|Mount):/i)) {
      bodyStartIdx = i;
      break;
    } else if (titleLines.length > 0) {
      bodyStartIdx = i;
      break;
    }
  }
  // If no labeled fields, treat everything after bolded name as body
  if (titleLines.length > 0 && bodyStartIdx === 0 && lines.length > 1) {
    bodyStartIdx = 1;
  }
  if (titleLines.length === 0 && lines.length > 0) {
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
  // Normalize heading capitalization: only name capitalized, roles/titles sentence case
  let rawTitle = titleLines.join(' ');
  if (rawTitle) {
    // Split name and role/title by comma
    const parts = rawTitle.split(',');
    if (parts.length > 1) {
      const name = parts[0].replace(/\*\*/g, '').trim();
      const role = parts.slice(1).join(',').trim().toLowerCase();
      rawTitle = `**${name}, ${role}**`;
    }
  }
  const title = rawTitle;
  let bodyLines = lines.slice(bodyStartIdx).filter(Boolean);
  // Auto-correct each stat block line
  function toSuperscript(num: string): string {
    const map: Record<string, string> = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
    return String(num).split('').map((c: string) => map[c] ?? c).join('');
  }
  function nounDisposition(str: string): string {
    const map = {
      'lawful good': 'law/good', 'lawful neutral': 'law/neutral', 'lawful evil': 'law/evil',
      'neutral good': 'neutral/good', 'neutral': 'neutral', 'neutral evil': 'neutral/evil',
      'chaotic good': 'chaos/good', 'chaotic neutral': 'chaos/neutral', 'chaotic evil': 'chaos/evil',
      'good': 'good', 'evil': 'evil', 'chaotic': 'chaos', 'lawful': 'law',
    };
    str = str.toLowerCase().replace(/alignment:?/i, '').trim();
  return map[str as keyof typeof map] || str;
  }
  function boldName(name: string): string {
    if (!/^\*\*.*\*\*$/.test(name)) {
      return `**${name.replace(/\*\*/g, '')}**`;
    }
    return name;
  }
  function ensureRaceClass(line: string): string {
    if (!/human|elf|dwarf|halfling|orc|goblin|gnoll|hobgoblin|fighter|cleric|wizard|rogue|thief|paladin|ranger|barbarian|monk|druid|assassin/i.test(line)) {
      return line + ' (human, fighter)';
    }
    return line;
  }
  function ensureHP(line: string): string {
    if (!/HP/i.test(line)) {
      return line + ', HP 7';
    }
    return line;
  }
  function ensureAC(line: string): string {
    if (!/AC/i.test(line)) {
      return line + ', AC 15';
    }
    return line;
  }
  function superscriptLevels(line: string): string {
  return line.replace(/(\d+)(st|nd|rd|th) level/g, (m: string, num: string, ord: string) => `${toSuperscript(num)}${ord} level`);
  }
  interface StatParts {
    name?: string;
    raceClass?: string;
    disposition?: string;
    hp?: string;
    ac?: string;
    prime?: string;
    equipment?: string;
    [key: string]: string | undefined;
  }
  function canonicalOrder(parts: StatParts): string {
    const order = ['name', 'raceClass', 'disposition', 'hp', 'ac', 'prime', 'equipment'];
    let out = [];
    for (let key of order) {
      if (parts[key as keyof StatParts]) out.push(parts[key as keyof StatParts] as string);
    }
    return out.join(' ');
  }
  function parseLine(line: string): string {
    const parts: StatParts = {};
    let nameMatch = line.match(/^([A-Za-z\- ]+ x\d+)/);
    if (nameMatch) {
      parts.name = boldName(nameMatch[1]);
      line = line.replace(nameMatch[1], '').trim();
    }
    let rcMatch = line.match(/\(([^)]*)\)/);
    if (rcMatch) {
      let rc = rcMatch[1];
      rc = ensureRaceClass(rc);
      rc = superscriptLevels(rc);
      parts.raceClass = `(${rc})`;
      line = line.replace(rcMatch[0], '').trim();
    }
    let dispMatch = line.match(/Disposition:? ([^,)]*)/i);
    if (dispMatch) {
      parts.disposition = `Disposition: ${nounDisposition(dispMatch[1])}`;
      line = line.replace(dispMatch[0], '').trim();
    } else if (/alignment/i.test(line)) {
      let alignMatch = line.match(/alignment:? ([^,)]*)/i);
      if (alignMatch) {
        parts.disposition = `Disposition: ${nounDisposition(alignMatch[1])}`;
        line = line.replace(alignMatch[0], '').trim();
      }
    }
    let hpMatch = line.match(/HP ?(\d+[\-\d]*)/i);
    if (hpMatch) {
      parts.hp = `HP ${hpMatch[1]}`;
      line = line.replace(hpMatch[0], '').trim();
    } else {
      parts.hp = 'HP 7';
    }
    let acMatch = line.match(/AC ?(\d+)/i);
    if (acMatch) {
      parts.ac = `AC ${acMatch[1]}`;
      line = line.replace(acMatch[0], '').trim();
    } else {
      parts.ac = 'AC 15';
    }
    let paMatch = line.match(/PA ([^,)]*)/i);
    if (paMatch) {
      parts.prime = `Prime: ${paMatch[1]}`;
      line = line.replace(paMatch[0], '').trim();
    }
    let eqMatch = line.match(/EQ ([^,)]*)/i);
    if (eqMatch) {
      parts.equipment = `Equipment: ${eqMatch[1]}`;
      line = line.replace(eqMatch[0], '').trim();
    }
    return canonicalOrder(parts);
  }
  let body = bodyLines.map(parseLine).filter(Boolean).join('\n');
  // Grammar consistency: fix double spaces, trailing spaces
  body = body.replace(/ +/g, ' ').replace(/\s+$/gm, '');
  return { title, body };
}

function superscriptOrdinals(input: string): string {
  return input.replace(/(\b\d{1,3})(st|nd|rd|th)\b/gi, (_m, n: string, suf: string) => `${n}<sup>${suf.toLowerCase()}</sup>`);
}

function mdInlineToHTML(input: string): string {
  // escape HTML first
  let s = input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // **bold** first (non-greedy)
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  // *italic* (ensure not **)
  s = s.replace(/(^|[^*])\*(?!\*)([^*]+?)\*(?!\*)/g, '$1<i>$2</i>');
  // normalize newlines to <br/>
  s = s.replace(/\r?\n\r?\n/g, '<br/><br/>').replace(/\r?\n/g, '<br/>');
  // superscript ordinals
  s = superscriptOrdinals(s);
  return s;
}

function splitTitleAndBodyForHTML(src: string): { title: string; body: string } {
  const text = src.trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let titleLines: string[] = [];
  let bodyStartIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      titleLines.push(line);
    } else if (line.match(/^(Disposition|Race|Hit Points|Armor Class|Prime|Equipment|Spells|Mount):/i)) {
      bodyStartIdx = i;
      break;
    } else if (titleLines.length > 0) {
      bodyStartIdx = i;
      break;
    }
  }
  if (titleLines.length > 0 && bodyStartIdx === 0 && lines.length > 1) bodyStartIdx = 1;
  if (titleLines.length === 0 && lines.length > 0) {
    const first = lines[0];
    const looksLikeBody = /^(\(|He\b|She\b|They\b|HP\b|AC\b|Disposition\b|Alignment\b|Race\b|Spells\b|Equipment\b|Mount\b)/i.test(first);
    if (looksLikeBody) { titleLines = []; bodyStartIdx = 0; }
    else { titleLines = [lines[0]]; bodyStartIdx = 1; }
  }
  const title = titleLines.join(' ');
  let body = lines.slice(bodyStartIdx).join('\n');
  // Keep italics as-is for HTML preview; do minimal cleanup only
  body = body.replace(/ +/g, ' ').replace(/\s+$/gm, '');
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

// Normalize adjectives  nouns (lawful good  law/good)
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
      .map((s: string) => s.trim().toLowerCase().replace(/\.+$/, ''))
      .filter(Boolean)
      .map((x: string) => Object.prototype.hasOwnProperty.call(map, x) ? map[x] : x)
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
    .map((s: string) => s.trim().toLowerCase().replace(/\.+$/, ''))
    .filter(Boolean)
    .map((x: string) => Object.prototype.hasOwnProperty.call(map, x) ? map[x] : x)
    .join(', ');

/**
 * formatNpcStatBlockToHTML
 * ------------------------
 * Returns a safely-rendered HTML string (bold/italics/superscripts preserved) for WYSIWYG preview
 * and rich clipboard copying into Word. Use this in the preview pane and the "Copy as HTML" action.
 */
export function formatNpcStatBlockToHTML(src: string): string {
  const { title, body } = splitTitleAndBodyForHTML(src);
  const titleHTML = title ? mdInlineToHTML(title) : '';
  const bodyHTML = mdInlineToHTML(body);
  // Ensure title is bold-only (house rule: headings bold). If input lacks **, wrap the whole line.
  const finalTitle = titleHTML || '';
  const needsWrap = finalTitle && !/^<b>/.test(finalTitle);
  const wrappedTitle = needsWrap ? `<b>${finalTitle}</b>` : finalTitle;
  return [wrappedTitle, bodyHTML].filter(Boolean).join('<br/>');
}
