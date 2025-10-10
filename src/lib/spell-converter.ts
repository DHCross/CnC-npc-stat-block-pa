import { SPELL_NAME_MAPPINGS } from './name-mappings';

export type SpellStatistics = {
  castingTime?: string;
  range?: string;
  duration?: string;
  savingThrow?: string;
  spellResistance?: string;
  areaOfEffect?: string;
  components?: string;
};

export type SpellFormatMetadata = {
  name: string;
  descriptor?: string;
  className?: string;
  level?: number;
  noun?: string;
  runeKey?: string;
  intro?: string;
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
  formatMeta: SpellFormatMetadata;
};

const FIELD_LABELS: Record<string, keyof SpellStatistics> = {
  CT: 'castingTime',
  R: 'range',
  D: 'duration',
  SV: 'savingThrow',
  SR: 'spellResistance',
  AoE: 'areaOfEffect',
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

const REQUIRED_STATISTICS: Array<[keyof SpellStatistics, string]> = [
  ['castingTime', 'Casting Time'],
  ['range', 'Range'],
  ['duration', 'Duration'],
  ['savingThrow', 'Saving Throw'],
  ['spellResistance', 'Spell Resistance'],
  ['components', 'Components'],
];

const NEVER_OUTPUT = /see\s*below/i;

function sanitizeStatValue(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (NEVER_OUTPUT.test(trimmed)) return null;
  return trimmed;
}

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
  if (/^[A-Z][A-Za-z'’-]*(\s+[A-Z][A-Za-z'’-]*)*$/.test(trimmed)) return true;
  
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
  const formatMeta: SpellFormatMetadata = {
    ...buildSpellFormatMetadata({
      canonicalName,
      rawMetadata: metadata,
    }),
    intro: description || undefined,
  };

  const formatted = formatResult({
    meta: formatMeta,
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
    formatMeta,
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

function buildSpellFormatMetadata(params: { canonicalName: string; rawMetadata?: string }): SpellFormatMetadata {
  const { canonicalName, rawMetadata } = params;
  const meta: SpellFormatMetadata = {
    name: canonicalName,
  };

  const classLevel = rawMetadata ? parseClassLevel(rawMetadata) : null;
  if (classLevel) {
    meta.level = classLevel.level;
    meta.className = classLevel.className;
  }

  if (rawMetadata) {
    const potentialRuneKey = classLevel
      ? rawMetadata.replace(classLevel.matchedText, '').trim()
      : rawMetadata.trim();
    if (potentialRuneKey) {
      meta.runeKey = potentialRuneKey;
    }

    if (/^\s*(arcane|cleric|druid|illusionist|paladin|wizard|spell|invocation|rune)\b/i.test(potentialRuneKey)) {
      meta.descriptor = titleCase(potentialRuneKey);
    }
  }

  const isRune = Boolean(rawMetadata && /roan\s+ot/i.test(rawMetadata));
  meta.noun = isRune ? 'rune' : 'spell';

  if (!meta.descriptor && !classLevel) {
    // Default descriptor for generalized conversions can remain undefined
    // allowing pure PHB entries (with class/level line) to omit the italic descriptor.
  }

  return meta;
}

function parseClassLevel(metadata: string): { level: number; className: string; matchedText: string } | null {
  const levelFirst = metadata.match(/level\s+(\d+)\s+([A-Za-z][A-Za-z\s']*)/i);
  if (levelFirst) {
    return {
      level: Number(levelFirst[1]),
      className: titleCase(levelFirst[2].trim()),
      matchedText: levelFirst[0],
    };
  }

  const classFirst = metadata.match(/([A-Za-z][A-Za-z\s']*)\s+level\s+(\d+)/i);
  if (classFirst) {
    return {
      className: titleCase(classFirst[1].trim()),
      level: Number(classFirst[2]),
      matchedText: classFirst[0],
    };
  }

  return null;
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
      if (nextNonBlank && /\b(CT|R|D|SV|SR|AoE|Comp)\b/.test(nextNonBlank)) {
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
    if (/\b(CT|R|D|SV|SR|AoE|Comp)\b/.test(trimmed)) {
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
    const sentinel = '__STAT_SPLIT__';
    const normalized = combined.replace(/(^|[^A-Za-z0-9])(CT|R|D|SV|SR|AoE|Comp)(?=[^A-Za-z]|$)/g, (_match, prefix, label) => {
      return `${prefix}${sentinel}${label} `;
    });

    const parts = normalized
      .split(sentinel)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    parts.forEach((part) => {
      const labelMatch = part.match(/^(CT|R|D|SV|SR|AoE|Comp)(.*)$/i);
      if (!labelMatch) return;
      const rawLabel = labelMatch[1];
      let rawValue = labelMatch[2].trim();
      rawValue = rawValue.replace(/^[:\-–—=]+/, '').trim();
      if (!rawValue) return;
      const normalizedValue = sanitizeStatValue(normalizeMeasurement(rawValue));
      const key = FIELD_LABELS[rawLabel as keyof typeof FIELD_LABELS];
      if (normalizedValue) {
        stats[key] = normalizedValue;
      }
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
  // Remove stray periods before plus signs (e.g., "+1./lvl" or ".+1")
  normalized = normalized.replace(/\.\s*\+/g, ' +');
  
  MEASUREMENT_REPLACEMENTS.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });
  
  // Convert slashes to "per" (e.g., "/level" -> " per level")
  normalized = normalized.replace(/\/\s*(level|round|minute|hour)/gi, ' per $1');
  
  // Normalize pluralization for basic measurement units
  normalized = normalized.replace(/(\d+)\s+(foot|feet|round|rounds|minute|minutes|hour|hours)\b/gi, (match, num, unit) => {
    const quantity = parseInt(num, 10);
    const lowerUnit = unit.toLowerCase();
    const unitMap: Record<string, { singular: string; plural: string }> = {
      foot: { singular: 'foot', plural: 'feet' },
      feet: { singular: 'foot', plural: 'feet' },
      round: { singular: 'round', plural: 'rounds' },
      rounds: { singular: 'round', plural: 'rounds' },
      minute: { singular: 'minute', plural: 'minutes' },
      minutes: { singular: 'minute', plural: 'minutes' },
      hour: { singular: 'hour', plural: 'hours' },
      hours: { singular: 'hour', plural: 'hours' },
    };
    const mapping = unitMap[lowerUnit];
    if (!mapping) return match;
    const nextUnit = quantity === 1 ? mapping.singular : mapping.plural;
    return `${quantity} ${nextUnit}`;
  });

  // Normalize whitespace and remove stray periods
  normalized = normalized.replace(/\s+/g, ' ').trim();
  normalized = normalized.replace(/\.\s+per\b/gi, ' per');
  
  // Remove trailing periods after complete measurements
  normalized = normalized.replace(/\b(rounds?|minutes?|hours?|feet|levels?)\.\s*$/gi, '$1');
  
  // Clean up common duplications
  normalized = normalized.replace(/\bper level level\b/gi, 'per level');
  normalized = normalized.replace(/\bround level\b/gi, 'round per level');
  normalized = normalized.replace(/\bminute level\b/gi, 'minute per level');
  normalized = normalized.replace(/\bfeet foot\b/gi, 'feet');
  normalized = normalized.replace(/\bhour hour\b/gi, 'hour');
  normalized = normalized.replace(/\.\s+(?=[a-z])/gi, ' ');

  // Remove erroneous leading digits before "see below"
  normalized = normalized.replace(/^\d+\s+(see below)$/i, '$1');
  
  return normalized;
}

type ResolvedStatistics = SpellStatistics & { notes?: string[] };

function resolveStatsFromBody(stats: SpellStatistics, body: string): ResolvedStatistics {
  const notes: string[] = [];
  const resolved: ResolvedStatistics = { ...stats, notes };
  const normalizedBody = body.replace(/\u2019/g, "'").replace(/\s+/g, ' ').trim();

  if (!sanitizeStatValue(resolved.range)) {
    const rangeFeetMatch = normalizedBody.match(/\brange\s+(?:is|of|extends to|extends up to|equals)?\s*(?:up to\s*)?(\d+)\s*(foot|feet)\b/i);
    if (rangeFeetMatch) {
      resolved.range = `${rangeFeetMatch[1]} feet`;
    } else if (/\brange\s+(?:is\s+)?touch\b/i.test(normalizedBody)) {
      resolved.range = 'touch';
    } else if (/\brange\s+(?:is\s+)?personal\b/i.test(normalizedBody)) {
      resolved.range = 'personal';
    } else if (/\brange\b.*\bper level\b/i.test(normalizedBody)) {
      const perLevelMatch = normalizedBody.match(/\brange\b.*?(\d+)\s*(?:foot|feet)\s*per\s*level\b/i);
      if (perLevelMatch) {
        resolved.range = `${perLevelMatch[1]} feet per level`;
      }
    } else if (/\bcentered on (?:the|this) inscription\b/i.test(normalizedBody)) {
      resolved.range = 'varies (centered on the inscription)';
    }
  }

  if (!sanitizeStatValue(resolved.duration)) {
    const perLevel = normalizedBody.match(/\b(\d+)\s*(round|minute|turn|hour)s?\s+per\s+level\b/i);
    const fixed = normalizedBody.match(/\b(\d+)\s*(round|minute|turn|hour)s?\b(?!\s*per level)/i);
    if (perLevel) {
      const count = perLevel[1];
      const unit = perLevel[2];
      resolved.duration = `${count} ${unit}${count === '1' ? '' : 's'} per level`;
    } else if (fixed) {
      const count = fixed[1];
      const unit = fixed[2];
      resolved.duration = `${count} ${unit}${count === '1' ? '' : 's'}`;
    } else if (/\bpermanent\b/i.test(normalizedBody)) {
      resolved.duration = 'permanent';
    } else if (/\bimmediate\b/i.test(normalizedBody)) {
      resolved.duration = 'immediate';
    } else if (/\bremains until\b/i.test(normalizedBody)) {
      resolved.duration = 'until dismissed or dispelled';
    }
  }

  if (!sanitizeStatValue(resolved.castingTime)) {
    if (/\brequires two rounds\b/i.test(normalizedBody) || /\bto devote 2 rounds\b/i.test(normalizedBody)) {
      resolved.castingTime = 'two rounds of concentration';
    } else if (/\brequires the caster['’]s combat action\b/i.test(normalizedBody)) {
      resolved.castingTime = "the caster's combat action for the round";
    }
  }

  return resolved;
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
  REQUIRED_STATISTICS.forEach(([key, label]) => {
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

function generateMechanicsProse(statistics: SpellStatistics, noun = 'spell', bodyText = ''): string[] {
  const resolved = resolveStatsFromBody(statistics, bodyText);
  const paragraphs: string[] = [];

  const castingText = normalizeCasting(resolved.castingTime, noun);
  const rangeText = normalizeRange(resolved.range, noun);
  const durationText = normalizeDuration(resolved.duration);
  const savingThrowText = normalizeSavingThrow(resolved.savingThrow);
  const spellResistanceText = normalizeSpellResistance(resolved.spellResistance, noun);

  const firstParagraph = [castingText, `${rangeText} ${durationText}.`, savingThrowText, spellResistanceText]
    .filter(Boolean)
    .join(' ');

  if (firstParagraph.trim()) {
    paragraphs.push(firstParagraph.replace(/\s+([.,])/g, '$1'));
  }

  if (resolved.areaOfEffect) {
    paragraphs.push(`**The area of effect** is ${normalizeArea(resolved.areaOfEffect)}.`);
  }

  if (resolved.components) {
    paragraphs.push(`**The casting components** are **${normalizeComponents(resolved.components)}**.`);
  }

  return paragraphs;
}

function formatResult(params: {
  meta: SpellFormatMetadata;
  description: string;
  effect: string;
  statistics: SpellStatistics;
}): string {
  const { meta, description, effect, statistics } = params;
  const sections: string[] = [];

  sections.push(formatTitle(meta));

  if (meta.runeKey) {
    sections.push(`_${meta.runeKey}_`);
  }

  const introText = (meta.intro ?? description)?.trim();
  if (introText) {
    const formattedIntro = formatIntro(introText);
    if (formattedIntro) {
      sections.push(formattedIntro);
    }
  }

  const bodyText = effect.trim();
  if (bodyText) {
    sections.push(bodyText);
  }

  const bodyForResolution = [description, effect].filter(Boolean).join(' ');

  const mechanicsParagraphs = generateMechanicsProse(statistics, meta.noun ?? 'spell', bodyForResolution);
  mechanicsParagraphs.forEach((paragraph) => {
    if (paragraph.trim()) {
      sections.push(paragraph);
    }
  });

  return sections.filter((section) => section && section.trim().length > 0).join('\n\n');
}

function formatTitle(meta: SpellFormatMetadata): string {
  const baseName = `**${meta.name.toUpperCase()}**`;
  const descriptor = meta.descriptor ? `, *${meta.descriptor}*` : '';
  const titleLine = `${baseName}${descriptor}`;

  if (meta.level != null && meta.className) {
    return `${titleLine}\n***Level ${meta.level} ${meta.className}***`;
  }

  return titleLine;
}

function formatIntro(intro: string): string {
  const stripped = intro.replace(/^\*+/, '').replace(/\*+$/, '').trim();
  if (!stripped) return '';
  return `*${stripped}*`;
}

function trimTrailingPeriod(value: string): string {
  return value.replace(/\.\s*$/, '').trim();
}

function normalizeCasting(value: string | null | undefined, noun: string): string {
  const sanitized = sanitizeStatValue(value);
  if (!sanitized) {
    return `**Casting** this ${noun} requires the caster's combat action for the round.`;
  }
  const phrase = ensureCompletePhrase('castingTime', sanitized);
  if (isSingleRound(phrase)) {
    return `**Casting** this ${noun} requires the caster's combat action for the round.`;
  }
  const simpleRounds = phrase.match(/^(\d+)\s+rounds?$/i);
  if (simpleRounds) {
    const count = parseInt(simpleRounds[1], 10);
    const word = numberToWords(count);
    return `**Casting** this ${noun} requires the caster to devote ${word} round${count === 1 ? '' : 's'} of concentration.`;
  }
  const trimmed = lowercaseFirstLetter(trimTrailingPeriod(phrase));
  return `**Casting** this ${noun} requires ${trimmed}.`;
}

function normalizeRange(value: string | null | undefined, noun: string): string {
  const sanitized = sanitizeStatValue(value);
  if (!sanitized) {
    return `The ${noun}'s **range** varies as described above`;
  }
  const phrase = lowercaseFirstLetter(trimTrailingPeriod(ensureCompletePhrase('range', sanitized)));
  if (/^varies/i.test(phrase)) {
    return `The ${noun}'s **range** ${phrase}`;
  }
  return `The ${noun}'s **range** is ${phrase}`;
}

function normalizeDuration(value: string | null | undefined): string {
  const sanitized = sanitizeStatValue(value);
  if (!sanitized) {
    return 'with a **duration that varies as described above**';
  }
  const phrase = lowercaseFirstLetter(trimTrailingPeriod(ensureCompletePhrase('duration', sanitized)));
  if (/^varies/i.test(phrase)) {
    return `with a **duration that ${phrase}**`;
  }
  return `with a **duration of ${phrase}**`;
}

const ABILITY_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

function capitalizeAbility(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function normalizeSavingThrow(value: string | null | undefined): string {
  const sanitized = sanitizeStatValue(value);
  if (!sanitized) {
    return '**There is no saving throw.**';
  }
  const lower = sanitized.toLowerCase();
  for (const ability of ABILITY_NAMES) {
    if (lower.includes(ability)) {
      if (lower.includes('negates')) {
        return `**${capitalizeAbility(ability)} saving throw negates the effect.**`;
      }
      if (lower.includes('half')) {
        const article = /^[aeiou]/i.test(ability) ? 'An' : 'A';
        return `**${article} ${capitalizeAbility(ability)} saving throw reduces the effect by half.**`;
      }
    }
  }
  if (lower.includes('negates')) {
    return '**A saving throw negates the effect.**';
  }
  if (lower.includes('half')) {
    return '**A saving throw reduces the effect by half.**';
  }
  if (lower.includes('none')) {
    return '**There is no saving throw.**';
  }
  return '**A saving throw may apply as described above.**';
}

function normalizeSpellResistance(value: string | null | undefined, noun: string): string {
  const sanitized = sanitizeStatValue(value);
  if (!sanitized) {
    return `The ${noun} is **unaffected by spell resistance**.`;
  }
  const lower = sanitized.toLowerCase();
  if (lower === 'yes' || lower === 'affected') {
    return `The ${noun} is **affected by spell resistance**.`;
  }
  if (lower === 'no' || lower === 'none' || lower.includes('unaffected')) {
    return `The ${noun} is **unaffected by spell resistance**.`;
}
  if (lower.includes('varies')) {
    return `The ${noun}'s interaction with spell resistance varies as described above.`;
  }
  return `Spell resistance is **${lower}**.`;
}

const NUMBER_WORDS: Record<number, string> = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
};

function numberToWords(num: number): string {
  if (NUMBER_WORDS[num]) return NUMBER_WORDS[num];
  if (num < 100 && num % 10 === 0) {
    const tens = NUMBER_WORDS[Math.floor(num / 10) * 10];
    if (tens) return tens;
  }
  return num.toString();
}

function convertFeetTokens(text: string): string {
  return text.replace(/(\d+)'/g, (_, digits: string) => {
    const num = parseInt(digits, 10);
    const word = numberToWords(num);
    return `${word} feet`;
  });
}

function normalizeArea(value: string): string {
  let text = value.replace(/\u2019/g, "'").replace(/\u00d7/g, 'x');
  text = convertFeetTokens(text);
  text = text.replace(/(\d+)\s*feet/gi, (_, digits: string) => {
    const num = parseInt(digits, 10);
    const word = numberToWords(num);
    return `${word} feet`;
  });
  text = text.replace(/(\d+)\s*x\s*(\d+)/gi, (_, a, b) => {
    const first = numberToWords(parseInt(a, 10));
    const second = numberToWords(parseInt(b, 10));
    return `${first} by ${second}`;
  });
  text = text.replace(/\+\s*(\d+)\s*feet/gi, (_, digits) => {
    const word = numberToWords(parseInt(digits, 10));
    return `plus ${word} feet`;
  });
  return lowercaseFirstLetter(text.trim().replace(/\s+/g, ' '));
}

function normalizeComponents(value: string): string {
  const formatted = formatComponents(value);
  return formatted.toLowerCase();
}

function expandComponents(value: string): string {
  return value
    .replace(/\bS\b/g, 'Somatic')
    .replace(/\bV\b/g, 'Verbal')
    .replace(/\bM\b/g, 'Material')
    .replace(/\bDF\b/g, 'Divine Focus')
    .replace(/\bF\b/g, 'Focus')
    .trim();
}

function formatComponents(value: string): string {
  const expanded = expandComponents(value);
  const tokens = expanded
    .split(/[,/]+|\s+and\s+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return expanded.toLowerCase();
  }

  if (tokens.length === 1) {
    return tokens[0];
  }

  if (tokens.length === 2) {
    return `${tokens[0]} and ${tokens[1]}`;
  }

  return `${tokens.slice(0, -1).join(', ')}, and ${tokens[tokens.length - 1]}`;
}

function capitalizeFirstLetter(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowercaseFirstLetter(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function ensureCompletePhrase(key: keyof SpellStatistics, value: string): string {
  // Ensure each statistic value is a complete phrase with proper units
  let phrase = value.trim();

  // Casting Time: ensure "1" becomes "1 round"
  if (key === 'castingTime') {
    // If it's just a number, add "round" or "rounds"
    if (/^\d+$/.test(phrase)) {
      const num = parseInt(phrase, 10);
      phrase = num === 1 ? '1 round' : `${num} rounds`;
    }
    // Ensure it ends with a period when standalone
    if (!phrase.endsWith('.')) {
      phrase = phrase + '.';
    }
    // Remove trailing period (will be added by the formatter)
    phrase = phrase.replace(/\.$/, '');
  }

  // Range: capitalize "see below"
  if (key === 'range') {
    phrase = capitalizeFirstLetter(phrase);
  }

  // Duration: ensure proper format
  if (key === 'duration') {
    phrase = capitalizeFirstLetter(phrase);
  }

  // Saving Throw: expand abbreviations and provide complete phrases
  if (key === 'savingThrow') {
    const lower = phrase.toLowerCase();
    if (lower === 'none') {
      phrase = 'None';
    } else if (lower === 'see below') {
      // Keep "see below" but note it should ideally be expanded in body text
      phrase = 'See below';
    } else {
      // Capitalize first letter
      phrase = capitalizeFirstLetter(phrase);
    }
  }

  // Spell Resistance: capitalize yes/no/none
  if (key === 'spellResistance') {
    const lower = phrase.toLowerCase();
    if (lower === 'yes') {
      phrase = 'Yes';
    } else if (lower === 'no') {
      phrase = 'No';
    } else if (lower === 'none') {
      phrase = 'None';
    } else {
      phrase = capitalizeFirstLetter(phrase);
    }
  }

  return phrase;
}

function isSingleRound(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === '1 round' || normalized === 'one round';
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
