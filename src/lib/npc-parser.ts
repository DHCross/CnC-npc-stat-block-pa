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
    titleLines = [lines[0]];
    bodyStartIdx = 1;
  }
  
  const title = titleLines.join(' ');
  const body = lines.slice(bodyStartIdx).join('\n');
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

// Normalize disposition to noun forms (law/good, chaos/evil)
export function findDisposition(text: string): string {
  const m = text.match(/(?:Disposition|Alignment)[^:]*:\s*([A-Za-z /-]+)/i);
  if (!m) return 'unknown';
  
  const raw = m[1].toLowerCase().replace(/-/g,'/').replace(/\s+/g,'').trim();
  const map: Record<string,string> = { 
    lawful:'law', chaotic:'chaos', law:'law', chaos:'chaos', 
    good:'good', evil:'evil', neutral:'neutral' 
  };
  
  const parts = raw.split('/').filter(Boolean).slice(0,2);
  return parts.map(p => map[p] ?? p).filter(Boolean).join('/');
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
  if (!m) return '?';
  
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

// Find equipment from Equipment: line only, avoiding title contamination
export function findEquipment(text: string, npcName?: string): string {
  const m = text.match(/Equipment:\s*([^\n]+)/i);
  if (!m) return 'none';
  
  const items = m[1]
    .split(',')
    .map(s => s.trim().replace(/\.+$/, ''))
    .filter(Boolean);

  // Filter out any accidental name tokens if provided
  const filteredItems = npcName ? 
    items.filter(item => {
      const itemLower = item.toLowerCase();
      const nameLower = npcName.toLowerCase();
      return !itemLower.includes(nameLower) && !nameLower.includes(itemLower);
    }) : items;

  // Auto-italicize obvious magic items
  const isMagic = (s: string) =>
    /\+\d/.test(s) || /\b(staff|wand|ring|cloak|boots|amulet|pectoral|bracers|girdle|rod|scroll)\b/i.test(s);

  const cleaned = filteredItems.map(x => (isMagic(x) ? `*${x}*` : x));
  return cleaned.length ? cleaned.join(', ') : 'none';
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
export function findMountOneLiner(text: string): string {
  const m = text.match(/Mount:\s*([^\n]+)/i);
  if (!m) return '';
  
  const mountText = m[1].toLowerCase();
  if (mountText.includes('heavy war horse') || mountText.includes('warhorse')) {
    return `\n\nHe rides a warhorse with the following statistics:\n\n` +
           `**Warhorse** (This creature's vital stats are Level 4(1d10), HP 35, AC 19, disposition neutral. ` +
           `It makes two hoof attacks for 1d4 damage each, or one overbearing attack. ` +
           `The horse is outfitted with chainmail barding.)`;
  }
  
  return '';
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

// Main function to collapse NPC entry into narrative format
export function collapseNPCEntry(longText: string): string {
  const { title, body } = splitTitleAndBody(longText);
  const name = findName(title);
  
  const { race, level, charClass } = parseRaceClassLevel(body);
  const disposition = findDisposition(body);
  const [hp, ac] = findHpAc(body);
  const primes = findPrimes(body);
  const equipment = findEquipment(body, name);
  const spells = findSpells(body);

  // Build the main narrative sentence
  let result = `**${name}** (This ${level}${getOrdinalSuffix(level)} level ${race} ${charClass}'s vital stats are HP ${hp}, AC ${ac}, disposition ${disposition}.`;

  // Add primary attributes if found
  if (primes !== '?') {
    const formatted = formatPrimaryAttributes(primes);
    if (formatted) result += ` His primary attributes are ${formatted}.`;
  }
  
  // Add equipment if found
  if (equipment !== 'none') {
    const items = equipment.split(',').map(x => x.trim()).filter(Boolean);
    if (items.length === 1) {
      result += ` He carries ${items[0]}.`;
    } else if (items.length === 2) {
      result += ` He carries ${items[0]} and ${items[1]}.`;
    } else {
      const lastItem = items.pop();
      result += ` He carries ${items.join(', ')}, and ${lastItem}.`;
    }
  }
  
  // Add spells if found
  if (spells !== '?') {
    result += ` He can cast the following number of spells per day: ${spells}.`;
  }

  result += ')';
  
  // Add mount information if present
  const mountInfo = findMountOneLiner(body);
  if (mountInfo) {
    result += mountInfo;
  }
  
  return result;
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
  
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    
    // Skip empty blocks or obvious non-NPC content
    if (!trimmedBlock || isCodeContent(trimmedBlock)) {
      continue;
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

function hasNPCIndicators(text: string): boolean {
  // Must have some indication it's an NPC stat block
  const hasName = /\*\*[^*]+\*\*/.test(text); // Bold name
  const hasStatBlock = /(?:Race & Class|Disposition|Hit Points|Armor Class|Prime Attributes|Equipment)/i.test(text);
  const hasLevelClass = /\d+(?:st|nd|rd|th)?\s*level\s+\w+/i.test(text);
  const hasHPAC = /(?:HP|AC)\s*[:=]\s*\d+/i.test(text) || /Hit Points.*?\d+/i.test(text) || /Armor Class.*?\d+/i.test(text);
  
  // Also check for simplified formats like "human, 16th level cleric"
  const hasRaceClassFormat = /\w+,\s*\d+(?:st|nd|rd|th)?\s*level\s+\w+/i.test(text);
  
  // Require either a bold name with some stats, OR a good combination of stat block indicators
  return (hasName && (hasStatBlock || hasLevelClass || hasHPAC)) || 
         (hasStatBlock && hasLevelClass && hasHPAC) ||
         (hasName && hasRaceClassFormat);
}

export function generateNPCTemplate(): string {
  return `**NPC Name, Title or Office**

Disposition: law/good
Race & Class: human, 16th level cleric
Hit Points (HP): 59
Armor Class (AC): 13/22
Prime Attributes (PA): Strength, Wisdom, Charisma
Equipment: pectoral of protection +3, full plate mail, steel shield, staff of striking, mace
Spells: 0–6, 1st–6, 2nd–5, 3rd–5, 4th–4, 5th–4, 6th–3, 7th–3, 8th–2
Mount: heavy war horse`;
}

export function generateBatchTemplate(): string {
  return `**The Right Honorable President Counselor of Yggsburgh His Supernal Devotion, Victor Oldham, High Priest of the Grand Temple**

Disposition: law/good
Race & Class: human, 16th level cleric
Hit Points (HP): 59
Armor Class (AC): 13/22
Prime Attributes (PA): Strength, Wisdom, Charisma
Equipment: pectoral of protection +3, full plate mail, steel shield, staff of striking, mace
Spells: 0–6, 1st–6, 2nd–5, 3rd–5, 4th–4, 5th–4, 6th–3, 7th–3, 8th–2
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
}

export interface ValidationResult {
  warnings: ValidationWarning[];
  isValid: boolean;
  complianceScore: number; // 0-100 percentage
}

export function validateStatBlock(text: string): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const { title, body } = splitTitleAndBody(text);
  
  // 1. Heading Formatting Check
  validateHeadingFormat(title, warnings);
  
  // 2. Deprecated Alignment Terminology
  validateDispositionTerminology(body, warnings);
  
  // 3. Disposition Format (should be nouns)
  validateDispositionFormat(body, warnings);
  
  // 4. Level Formatting (superscript and bold)
  validateLevelFormatting(body, warnings);
  
  // 5. Hit Point Presentation for Classed NPCs
  validateHitPointFormat(body, warnings);
  
  // 6. Coinage Abbreviations
  validateCoinageTerminology(body, warnings);
  
  // 7. Magic Item Italicization
  validateMagicItemFormatting(body, warnings);
  
  // 8. Magic Item Mechanical Explanations
  validateMagicItemExplanations(body, warnings);
  
  // 9. Magic Item Bonus Placement
  validateMagicItemBonusPlacement(body, warnings);
  
  // 10. Individual Spells vs Numeric Spread
  validateSpellListing(body, warnings);
  
  // 11. Deprecated Vision Terminology
  validateVisionTerminology(body, warnings);
  
  // 12. Deprecated "Improved Grab" -> "Crushing Grasp"
  validateAbilityTerminology(body, warnings);
  
  // 13. Missing Required Fields
  validateRequiredFields(body, warnings);
  
  // 14. Gendered Pronouns Without Context
  validateGenderedPronouns(body, warnings);

  const errorCount = warnings.filter(w => w.type === 'error').length;
  const warningCount = warnings.filter(w => w.type === 'warning').length;
  
  const totalChecks = 14;
  const issueCount = errorCount + (warningCount * 0.5);
  const complianceScore = Math.max(0, Math.round(((totalChecks - issueCount) / totalChecks) * 100));
  
  return {
    warnings,
    isValid: errorCount === 0,
    complianceScore
  };
}

function validateHeadingFormat(title: string, warnings: ValidationWarning[]) {
  if (!title.includes('**') || !title.match(/^\*\*.*\*\*$/)) {
    warnings.push({
      type: 'error',
      category: 'Heading Format',
      message: 'NPC name must be enclosed in bold formatting (**Name**)',
      suggestion: 'Format: **The Right Honorable Title, Name, Office**'
    });
  }
  
  // Check for colon in title (deprecated)
  if (title.includes(':')) {
    warnings.push({
      type: 'warning',
      category: 'Heading Format',
      message: 'Title should not contain colons - use comma separation instead',
      suggestion: 'Remove colons from the main heading'
    });
  }
}

function validateDispositionTerminology(body: string, warnings: ValidationWarning[]) {
  if (body.match(/\balignment\b/i)) {
    warnings.push({
      type: 'error',
      category: 'Deprecated Terminology',
      message: 'Term "alignment" is deprecated - use "disposition" instead',
      suggestion: 'Replace "Alignment:" with "Disposition:"'
    });
  }
  
  if (body.match(/\b(?:lawful|chaotic)\s+(?:good|evil|neutral)\b/i)) {
    warnings.push({
      type: 'warning',
      category: 'Disposition Format',
      message: 'Disposition should use adjective forms (lawful good) rather than noun forms',
      suggestion: 'Use "law/good" instead of "lawful good"'
    });
  }
}

function validateDispositionFormat(body: string, warnings: ValidationWarning[]) {
  const dispMatch = body.match(/(?:Disposition|Alignment)[^:]*:\s*([^\n]+)/i);
  if (dispMatch) {
    const disp = dispMatch[1].toLowerCase();
    if (!disp.includes('/') && disp.match(/\b(?:lawful|chaotic)\b/)) {
      warnings.push({
        type: 'error',
        category: 'Disposition Format',
        message: 'Disposition must be expressed as nouns with slash separation',
        suggestion: 'Use "law/good" not "lawful good"'
      });
    }
  }
}

function validateLevelFormatting(body: string, warnings: ValidationWarning[]) {
  const levelMatches = [...body.matchAll(/(\d+)(?:st|nd|rd|th)?\s*level/gi)];
  for (const match of levelMatches) {
    const fullMatch = match[0];
    // Check if it's properly superscripted (would be in formatted output)
    if (!fullMatch.includes('ᵗʰ') && !fullMatch.includes('ˢᵗ') && !fullMatch.includes('ⁿᵈ') && !fullMatch.includes('ʳᵈ')) {
      warnings.push({
        type: 'info',
        category: 'Level Formatting',
        message: 'Character levels should be superscripted and bolded in final output',
        suggestion: 'Parser will automatically format as 16ᵗʰ level'
      });
      break; // Only warn once
    }
  }
}

function validateHitPointFormat(body: string, warnings: ValidationWarning[]) {
  // Check for dice notation in HP field
  const hpMatch = body.match(/Hit\s+Points[^:]*:\s*([^\n]+)/i);
  if (hpMatch) {
    const hpValue = hpMatch[1];
    if (hpValue.match(/\d+d\d+/)) {
      warnings.push({
        type: 'error',
        category: 'Hit Points Format',
        message: 'Hit Points for classed NPCs should be a sum, not dice notation',
        suggestion: 'Use "59" instead of "4d10" for classed characters'
      });
    }
  }
}

function validateCoinageTerminology(body: string, warnings: ValidationWarning[]) {
  const coinageAbbrevs = ['pp', 'gp', 'sp', 'cp'];
  for (const abbrev of coinageAbbrevs) {
    if (body.match(new RegExp(`\\b${abbrev}\\b`, 'i'))) {
      warnings.push({
        type: 'warning',
        category: 'Coinage Format',
        message: `Coinage abbreviation "${abbrev}" should be spelled out`,
        suggestion: 'Use "gold", "silver", "copper", "platinum" instead of abbreviations'
      });
    }
  }
}

function validateMagicItemFormatting(body: string, warnings: ValidationWarning[]) {
  // Look for obvious magic items that aren't italicized
  const magicPatterns = [
    /\b(?:staff|wand|ring|cloak|boots|amulet|pectoral|bracers|girdle|rod|scroll)\s+of\s+\w+/gi,
    /\b\w+\s*\+\d+\b/g
  ];
  
  for (const pattern of magicPatterns) {
    const matches = [...body.matchAll(pattern)];
    for (const match of matches) {
      const item = match[0];
      if (!item.startsWith('*') || !item.endsWith('*')) {
        warnings.push({
          type: 'warning',
          category: 'Magic Item Format',
          message: `Magic item "${item}" should be italicized`,
          suggestion: 'Format as *magic item name*'
        });
      }
    }
  }
}

function validateMagicItemExplanations(body: string, warnings: ValidationWarning[]) {
  // This is a basic check - in a full implementation, you'd maintain a list of standard items
  const magicItems = [...body.matchAll(/\*([^*]+\+\d+[^*]*)\*/g)];
  
  for (const match of magicItems) {
    const item = match[1];
    // Basic check for items that might need explanation
    if (item.includes('staff of') || item.includes('pectoral of')) {
      warnings.push({
        type: 'info',
        category: 'Magic Item Explanation',
        message: `Consider adding mechanical explanation for "${item}"`,
        suggestion: 'Include brief description of magic item effects'
      });
    }
  }
}

function validateMagicItemBonusPlacement(body: string, warnings: ValidationWarning[]) {
  // Look for bonuses at start of item names
  const incorrectPlacements = [...body.matchAll(/\*\+(\d+)\s+([^*]+)\*/g)];
  
  for (const match of incorrectPlacements) {
    warnings.push({
      type: 'error',
      category: 'Magic Item Format',
      message: `Magic item bonus should be at the end: "${match[2]} +${match[1]}" not "+${match[1]} ${match[2]}"`,
      suggestion: 'Move numerical bonus to end of item name'
    });
  }
}

function validateSpellListing(body: string, warnings: ValidationWarning[]) {
  // Check if individual spell names are listed instead of numeric spread
  const spellNamePatterns = [
    /\b(?:cure|heal|bless|protection|fireball|lightning|magic missile)\b/gi
  ];
  
  for (const pattern of spellNamePatterns) {
    if (body.match(pattern)) {
      warnings.push({
        type: 'warning',
        category: 'Spell Format',
        message: 'Individual spell names should be avoided unless essential to encounter',
        suggestion: 'Use numeric spread format: "0–6, 1st–6, 2nd–5" instead of spell names'
      });
      break;
    }
  }
}

function validateVisionTerminology(body: string, warnings: ValidationWarning[]) {
  const singleWordVision = ['darkvision', 'infravision', 'ultravision'];
  
  for (const term of singleWordVision) {
    if (body.match(new RegExp(`\\b${term}\\b`, 'i'))) {
      const corrected = term.replace(/vision/, ' Vision').replace(/^(.)/, (c) => c.toUpperCase());
      warnings.push({
        type: 'warning',
        category: 'Vision Terminology',
        message: `Vision type "${term}" should be two words: "${corrected}"`,
        suggestion: 'Use "Dark Vision", "Deep Vision", etc.'
      });
    }
  }
}

function validateAbilityTerminology(body: string, warnings: ValidationWarning[]) {
  if (body.match(/\bimproved grab\b/i)) {
    warnings.push({
      type: 'warning',
      category: 'Ability Terminology',
      message: '"Improved grab" is deprecated - use "crushing grasp"',
      suggestion: 'Replace with "crushing grasp"'
    });
  }
}

function validateRequiredFields(body: string, warnings: ValidationWarning[]) {
  const requiredFields = [
    { field: 'Disposition', pattern: /(?:Disposition|Alignment)/i },
    { field: 'Race & Class', pattern: /(?:Race.*Class|level.*\w+)/i },
    { field: 'Hit Points', pattern: /(?:Hit Points|HP)/i },
    { field: 'Armor Class', pattern: /(?:Armor Class|AC)/i }
  ];
  
  for (const { field, pattern } of requiredFields) {
    if (!body.match(pattern)) {
      warnings.push({
        type: 'error',
        category: 'Missing Field',
        message: `Required field "${field}" is missing`,
        suggestion: `Add ${field} information to stat block`
      });
    }
  }
}

function validateGenderedPronouns(body: string, warnings: ValidationWarning[]) {
  const pronouns = ['he', 'she', 'his', 'her', 'him'];
  const hasPronouns = pronouns.some(pronoun => 
    body.match(new RegExp(`\\b${pronoun}\\b`, 'i'))
  );
  
  if (hasPronouns) {
    const hasGenderStatement = body.match(/\b(?:male|female|man|woman|priestess|actress)\b/i);
    if (!hasGenderStatement) {
      warnings.push({
        type: 'info',
        category: 'Gendered Pronouns',
        message: 'Gendered pronouns used without explicit gender statement',
        suggestion: 'Only use gendered pronouns when gender is explicitly stated'
      });
    }
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
  
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    
    if (!trimmedBlock || isCodeContent(trimmedBlock) || !hasNPCIndicators(trimmedBlock)) {
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