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
  
  // 14. Deprecated Vision Type Terminology
  validateVisionTerminology(body, warnings);
  
  // 15. Deprecated "Improved Grab" Terminology
  validateDeprecatedAbilities(body, warnings);
  
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

  const errorCount = warnings.filter(w => w.type === 'error').length;
  const warningCount = warnings.filter(w => w.type === 'warning').length;
  const infoCount = warnings.filter(w => w.type === 'info').length;
  
  const totalChecks = 23;
  const issueCount = errorCount + (warningCount * 0.5) + (infoCount * 0.1);
  const complianceScore = Math.max(0, Math.round(((totalChecks - issueCount) / totalChecks) * 100));
  
  return {
    warnings,
    isValid: errorCount === 0,
    complianceScore
  };
}

// 1. Heading Formatting Discrepancy
function validateHeadingFormat(title: string, warnings: ValidationWarning[]) {
  // Check for proper bold formatting
  if (!title.includes('**') || !title.match(/^\*\*.*\*\*$/)) {
    warnings.push({
      type: 'error',
      category: 'Heading Format',
      message: 'Main heading does not follow "Full honorific + office + name" convention with proper bold formatting',
      suggestion: 'Format: **The Right Honorable President Counselor of Yggsburgh His Supernal Devotion, Victor Oldham, High Priest of the Grand Temple**'
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
  
  // Check for proper honorific structure
  const cleanTitle = title.replace(/\*\*/g, '').trim();
  if (!cleanTitle.includes(',') && cleanTitle.split(' ').length < 3) {
    warnings.push({
      type: 'warning',
      category: 'Heading Format',
      message: 'Heading may be too simple - C&C convention prefers full honorifics and titles',
      suggestion: 'Include full titles, honorifics, and offices where applicable'
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
  const dispMatch = body.match(/(?:Disposition|Alignment)[^:]*:\s*([^\n]+)/i);
  if (dispMatch) {
    const disp = dispMatch[1].toLowerCase().trim();
    
    // Check for adjective forms (should be nouns)
    if (disp.match(/\b(?:lawful|chaotic)\s+(?:good|evil|neutral)\b/)) {
      warnings.push({
        type: 'error',
        category: 'Disposition Format',
        message: 'Disposition expressed as adjectives (e.g., "chaotic good") rather than nouns',
        suggestion: 'Use noun forms: "chaos/good" or "law/good" instead'
      });
    }
    
    // Check for missing slash separation in compound dispositions
    if (disp.includes('good') || disp.includes('evil')) {
      if (!disp.includes('/') && disp.split(' ').length > 1) {
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
  if (matches.length > 0) {
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
      field: 'Disposition/Alignment', 
      pattern: /(?:Disposition|Alignment)\s*:/i,
      message: 'Required field "Disposition" is missing from stat block'
    },
    { 
      field: 'Race & Class/Level', 
      pattern: /(?:Race.*Class|level.*\w+|human.*level|elf.*level)/i,
      message: 'Race and class information is missing or unclear'
    },
    { 
      field: 'Hit Points', 
      pattern: /(?:Hit Points|HP)\s*[:=]/i,
      message: 'Hit Points field is missing from stat block'
    },
    { 
      field: 'Armor Class', 
      pattern: /(?:Armor Class|AC)\s*[:=]/i,
      message: 'Armor Class field is missing from stat block'
    }
  ];
  
  for (const { field, pattern, message } of requiredFields) {
    if (!body.match(pattern)) {
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
        category: 'Prime Attributes Format',
        message: 'Prime Attributes use abbreviations - should be spelled out in full',
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
          category: 'Prime Attributes Order',
          message: 'Prime Attributes not in Player\'s Handbook order',
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
      // Check if it's just a simple declaration without stats
      if (!body.includes('HD ') && !body.includes('Hit Dice') && 
          !mountText.includes('none') && !mountText.includes('no mount')) {
        warnings.push({
          type: 'info',
          category: 'Mount Statistics',
          message: 'Mount mentioned but detailed statistics may be missing',
          suggestion: 'Include mount vital statistics: HD, HP, AC, disposition, attacks, and equipment'
        });
      }
      
      // Check for proper mount terminology
      if (mountText.includes('warhorse') && !mountText.includes('heavy war horse')) {
        warnings.push({
          type: 'info',
          category: 'Mount Terminology',
          message: 'Consider specifying "heavy war horse" for clarity',
          suggestion: 'Use full mount description for better stat block completeness'
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
    
    // Check if it's a single number when it should be base/magical
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