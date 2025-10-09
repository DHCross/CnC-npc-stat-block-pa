import { SPELL_NAME_MAPPINGS } from './name-mappings';

export type SpellStatistics = {
  castingTime?: string;
  range?: string;
  duration?: string;
  savingThrow?: string;
  spellResistance?: string;
  components?: string;
};

export type SpellConversionResult = {
  originalName: string;
  canonicalName: string;
  metadata?: string;
  description: string;
  effect: string;
  statistics: SpellStatistics;
  formatted: string;
  warnings: string[];
};

const FIELD_LABELS: Record<string, keyof SpellStatistics> = {
  CT: 'castingTime',
  R: 'range',
  D: 'duration',
  SV: 'savingThrow',
  SR: 'spellResistance',
  Comp: 'components',
};

const MEASUREMENT_REPLACEMENTS: Array<[RegExp, string]> = [
  // Handle abbreviations after numbers (e.g., 150ft, 10min)
  [/(\d+)ft\.?/gi, '$1 feet'],
  [/(\d+)fd\.?/gi, '$1 feet'],
  [/(\d+)rd\.?/gi, '$1 round'],
  [/(\d+)rds\.?/gi, '$1 rounds'],
  [/(\d+)min\.?/gi, '$1 minute'],
  [/(\d+)mins\.?/gi, '$1 minutes'],
  [/(\d+)hr\.?/gi, '$1 hour'],
  [/(\d+)hrs\.?/gi, '$1 hours'],
  // Handle abbreviations with word boundaries (standalone)
  [/\bft\.?\b/gi, 'feet'],
  [/\bfd\.?\b/gi, 'feet'],
  [/\brd\.?\b/gi, 'round'],
  [/\brds\.?\b/gi, 'rounds'],
  [/\bmin\.?\b/gi, 'minute'],
  [/\bmins\.?\b/gi, 'minutes'],
  [/\bhr\.?\b/gi, 'hour'],
  [/\bhrs\.?\b/gi, 'hours'],
  // Handle level abbreviations
  [/\/lvl\.?/gi, '/level'],
  [/\blvl\.?/gi, 'level'],
  [/\blevels\.?/gi, 'levels'],
  [/\bper\s+lvl\.?/gi, 'per level'],
  // Normalize spacing
  [/\b\+\s+/g, '+'],
];

const STATISTICS_ORDER: Array<[keyof SpellStatistics, string]> = [
  ['castingTime', 'Casting Time'],
  ['range', 'Range'],
  ['duration', 'Duration'],
  ['savingThrow', 'Saving Throw'],
  ['spellResistance', 'Spell Resistance'],
  ['components', 'Components'],
];

export function convertLegacySpellText(text: string): SpellConversionResult[] {
  const sanitized = sanitizeInput(text);
  const blocks = splitIntoSpellBlocks(sanitized);
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'test' && blocks.length === 0) {
    console.log('No blocks found. Sanitized text:', sanitized.slice(0, 200));
  }
  return blocks.map(convertBlockToResult).filter((result) => result !== null) as SpellConversionResult[];
}

function sanitizeInput(text: string): string {
  let sanitized = text
    .replace(/\r\n?/g, '\n')
    .replace(/\u2019/g, "'");
  
  // Remove bold markers (**) but preserve the text
  sanitized = sanitized.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  return sanitized.trim();
}

function splitIntoSpellBlocks(text: string): string[] {
  const lines = text.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];

  const pushCurrent = () => {
    const joined = current.join('\n').trim();
    if (joined) {
      blocks.push(joined);
    }
    current = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isHeading(line) && current.length > 0) {
      pushCurrent();
    }

    if (isHeading(line)) {
      current.push(line);
      continue;
    }

    if (current.length === 0) {
      // Skip preamble content before the first heading
      continue;
    }

    current.push(line);
  }

  pushCurrent();
  return blocks;
}

function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  // Skip lines that are clearly stats (contain "CT", "R", "D", "SV", "SR", "Comp" alone or with values)
  if (/\b(CT|SV|SR|Comp)\s+(1|none|yes|no|see|[A-Z])/i.test(trimmed)) return false;
  
  // Skip lines with colons (usually subheadings or list items, but not spell names)
  if (trimmed.includes(':') && !trimmed.match(/^[A-Z][^:]+:?$/)) return false;
  
  // Limit heading length
  if (trimmed.length > 150) return false;
  
  const upper = (trimmed.match(/[A-Z]/g) || []).length;
  const lower = (trimmed.match(/[a-z]/g) || []).length;
  const hasParens = /\([^)]+\)/.test(trimmed);
  
  // Treat as heading if:
  // 1. All uppercase (like "LIGHT" or "DARKNESS")
  if (upper > 0 && lower === 0) return true;
  
  // 2. Has bold markers (** ... **) - these should already be stripped, but check anyway
  if (/^\*\*.+\*\*/.test(trimmed)) return true;
  
  // 3. Title case with parenthetical metadata (like "Light (Int)")
  if (hasParens && upper > 0) return true;
  
  // 4. Starts with capital letter and looks like a title (multiple words, title case)
  if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed)) return true;
  
  // 5. Starts with capital and has more uppercase than lowercase (for abbreviated names)
  if (/^[A-Z]/.test(trimmed) && upper >= lower && upper >= 2) return true;
  
  return false;
}

function convertBlockToResult(block: string): SpellConversionResult | null {
  const lines = block.split('\n');
  const headingLine = (lines[0] ?? '').trim();
  if (!headingLine) {
    return null;
  }

  const { name, metadata } = extractNameAndMetadata(headingLine);
  const canonicalName = resolveCanonicalName(name);

  const { linesConsumed, statistics } = extractStatistics(lines.slice(1));
  const bodyStartIndex = 1 + linesConsumed;
  const bodyLines = lines.slice(bodyStartIndex);
  const { description, effect } = extractNarrative(bodyLines.join('\n'));

  const warnings = buildWarnings(statistics, description, effect);

  const formatted = formatResult({
    canonicalName,
    metadata,
    description,
    effect,
    statistics,
  });

  return {
    originalName: name,
    canonicalName,
    metadata,
    description,
    effect,
    statistics,
    formatted,
    warnings,
  };
}

/**
 * Extract spell name and metadata from heading line
 */
function extractNameAndMetadata(line: string): { name: string; metadata?: string } {
  let trimmed = line.trim();
  
  // Remove bold markers if present
  trimmed = trimmed.replace(/\*\*/g, '');
  
  // Look for parenthetical metadata (e.g., "Light (Int)" or "Arrest Motion (Chr) (Roan ot Kepulch)")
  // Take everything in parentheses as metadata, and remove the parens
  const metaMatch = trimmed.match(/^(.+?)\s*(\(.+\))$/);
  if (metaMatch) {
    // Remove outer parentheses and clean up
    let metadata = metaMatch[2].replace(/^\(|\)$/g, '').trim();
    // Remove internal parentheses too for cleaner output
    metadata = metadata.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    
    return {
      name: titleCase(metaMatch[1].trim()),
      metadata
    };
  }
  
  return { name: titleCase(trimmed) };
}

function resolveCanonicalName(rawName: string): string {
  const key = rawName.trim().toLowerCase();
  if (SPELL_NAME_MAPPINGS[key]) {
    return SPELL_NAME_MAPPINGS[key];
  }
  return titleCase(rawName);
}

function extractStatistics(lines: string[]): { linesConsumed: number; statistics: SpellStatistics } {
  const stats: SpellStatistics = {};
  let endIndex = 0;
  const collected: string[] = [];
  let foundStats = false;

  // Collect all stat lines, skipping blank lines between them
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip leading blank lines before we find stats
    if (!trimmed && !foundStats) {
      endIndex = i + 1;
      continue;
    }
    
    // If we've found stats and hit a blank line, we might be done or between stat lines
    if (!trimmed && foundStats) {
      // Peek ahead to see if there's more stats
      const nextNonBlank = lines.slice(i + 1).find(l => l.trim());
      if (nextNonBlank && /\b(CT|R|D|SV|SR|Comp)\b/.test(nextNonBlank)) {
        // More stats ahead, continue
        endIndex = i + 1;
        continue;
      } else {
        // No more stats, we're done
        endIndex = i + 1;
        break;
      }
    }
    
    // Check if this line contains stat fields
    if (/\b(CT|R|D|SV|SR|Comp)\b/.test(trimmed)) {
      collected.push(line);
      foundStats = true;
      endIndex = i + 1;
    } else if (foundStats) {
      // We've found stats before but this line doesn't have them - we're done
      endIndex = i;
      break;
    } else {
      // Haven't found stats yet and this isn't a stat line - keep looking
      endIndex = i + 1;
    }
  }

  // Join all collected stat lines and normalize whitespace
  const combined = collected.join(' ').replace(/\s+/g, ' ').trim();
  if (combined) {
    const padded = ` ${combined} `;
    const labels = Object.keys(FIELD_LABELS);

    labels.forEach((label, index) => {
      const search = ` ${label} `;
      const start = padded.indexOf(search);
      if (start === -1) return;
      let end = padded.length;
      for (let j = index + 1; j < labels.length; j += 1) {
        const nextLabel = labels[j];
        const nextSearch = ` ${nextLabel} `;
        const nextIndex = padded.indexOf(nextSearch, start + search.length);
        if (nextIndex !== -1) {
          end = Math.min(end, nextIndex);
          break;
        }
      }
      const rawValue = padded.slice(start + search.length, end).trim();
      const normalized = normalizeMeasurement(rawValue);
      const key = FIELD_LABELS[label];
      stats[key] = normalized;
    });
  }

  return {
    linesConsumed: endIndex,
    statistics: stats,
  };
}

function normalizeMeasurement(value: string): string {
  let normalized = value.trim();
  
  // Remove stray periods before slashes (e.g., "rd./lvl" -> "rd/lvl")
  normalized = normalized.replace(/\.\s*\//g, '/');
  
  MEASUREMENT_REPLACEMENTS.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });
  
  // Convert slashes to "per" (e.g., "/level" -> " per level")
  normalized = normalized.replace(/\/\s*(level|round|minute|hour)/gi, ' per $1');
  
  // Normalize whitespace and remove stray periods
  normalized = normalized.replace(/\s+/g, ' ').trim();
  normalized = normalized.replace(/\.\s+per\b/gi, ' per');
  
  // Remove trailing periods after complete measurements
  normalized = normalized.replace(/\b(rounds?|minutes?|hours?|feet|levels?)\.\s*$/gi, '$1');
  
  // Clean up common duplications
  normalized = normalized.replace(/\bper level level\b/gi, 'per level');
  normalized = normalized.replace(/\bround level\b/gi, 'round per level');
  normalized = normalized.replace(/\bminute level\b/gi, 'minute per level');
  
  return normalized;
}

function extractNarrative(body: string): { description: string; effect: string } {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    return { description: '', effect: '' };
  }

  const [first, ...rest] = paragraphs;
  const description = normalizeSentence(first);
  const effect = rest.map(normalizeSentence).join('\n\n');
  return { description, effect };
}

function normalizeSentence(paragraph: string): string {
  return paragraph
    .replace(/\s+/g, ' ')
    .replace(/\s*([,.!?;:])/g, '$1')
    .replace(/([,.!?;:])([^\s])/g, '$1 $2')
    .trim();
}

function buildWarnings(statistics: SpellStatistics, description: string, effect: string): string[] {
  const warnings: string[] = [];
  STATISTICS_ORDER.forEach(([key, label]) => {
    if (!statistics[key]) {
      warnings.push(`Missing ${label.toLowerCase()}`);
    }
  });
  
  // Warn about missing narrative text
  // If NO text at all (both empty), warn about both
  // If only description (single paragraph spell), that's OK - no warning
  // If only effect (weird but possible), warn about description
  if (!description && !effect) {
    warnings.push('Missing description paragraph');
    warnings.push('Missing effect details');
  } else if (!description) {
    warnings.push('Missing description paragraph');
  }
  // Note: We intentionally don't warn if effect is missing but description exists
  // because single-paragraph spells are valid
  
  return warnings;
}

function formatResult(params: {
  canonicalName: string;
  metadata?: string;
  description: string;
  effect: string;
  statistics: SpellStatistics;
}): string {
  const { canonicalName, metadata, description, effect, statistics } = params;
  const lines: string[] = [];
  lines.push(`**${canonicalName}**, Reforged Spell`);
  if (metadata) {
    lines.push(`_${metadata}_`);
  }
  if (description) {
    lines.push('');
    lines.push(`*Description:* ${description}`);
  }
  if (effect) {
    lines.push('');
    lines.push(`*Effect:* ${effect}`);
  }
  const statsLines = STATISTICS_ORDER
    .map(([key, label]) => {
      const value = statistics[key];
      return value ? `- ${label}: ${value}` : null;
    })
    .filter((line): line is string => Boolean(line));
  if (statsLines.length > 0) {
    lines.push('');
    lines.push('Statistics:');
    lines.push(...statsLines);
  }
  return lines.join('\n');
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
