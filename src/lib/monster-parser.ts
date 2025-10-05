import type { ParsedNPC } from './stat-block-types';
import { normalizeDisposition } from './stat-block-helpers';

interface FieldAlias {
  field: string;
  patterns: RegExp[];
  transform?: (value: string) => string;
  multiline?: boolean;
  consumeRestOfLine?: boolean;
  additionalFields?: string[];
}

const FIELD_ALIASES: FieldAlias[] = [
  {
    field: 'HD',
    patterns: [buildFieldPattern('HD'), buildFieldPattern('Hit Dice')],
  },
  {
    field: 'Level',
    patterns: [buildFieldPattern('Level')],
  },
  {
    field: 'AC',
    patterns: [buildFieldPattern('AC'), buildFieldPattern('Armor Class')],
  },
  {
    field: 'Hit Points (HP)',
    patterns: [buildFieldPattern('Hit Points'), buildFieldPattern('HP')],
  },
  {
    field: 'Move',
    patterns: [
      buildFieldPattern('Move'),
      buildFieldPattern('Movement'),
      buildFieldPattern('Move Rate'),
      buildFieldPattern('Speed'),
      buildFieldPattern('MV'),
    ],
  },
  {
    field: 'Attacks',
    patterns: [
      buildFieldPattern('Attacks'),
      buildFieldPattern('Attack Routine'),
      buildFieldPattern('Attack'),
      buildFieldPattern('#AT'),
    ],
    multiline: true,
    consumeRestOfLine: true,
  },
  {
    field: 'Saves',
    patterns: [
      buildFieldPattern('Saves'),
      buildFieldPattern('Save'),
      buildFieldPattern('Save Category'),
    ],
    transform: (value) => value.toUpperCase(),
  },
  {
    field: 'Type',
    patterns: [buildFieldPattern('Type')],
  },
  {
    field: 'Treasure',
    patterns: [buildFieldPattern('Treasure'), buildFieldPattern('Treasure Type')],
  },
  {
    field: 'XP',
    patterns: [buildFieldPattern('XP'), buildFieldPattern('Experience Points'), buildFieldPattern('Experience')],
  },
  {
    field: 'Special Abilities',
    patterns: [
      buildFieldPattern('Special Abilities'),
      buildFieldPattern('Special Attacks'),
      buildFieldPattern('Special Qualities'),
      buildFieldPattern('Special'),
    ],
    multiline: true,
    consumeRestOfLine: true,
  },
  {
    field: 'Disposition',
    patterns: [buildFieldPattern('Disposition'), buildFieldPattern('Alignment')],
    transform: (value) => normalizeDisposition(value),
    additionalFields: ['ALIGNMENT'],
  },
  {
    field: 'Organization',
    patterns: [buildFieldPattern('Organization')],
  },
  {
    field: 'Environment',
    patterns: [buildFieldPattern('Environment')],
  },
  {
    field: 'Intelligence',
    patterns: [buildFieldPattern('Intelligence'), buildFieldPattern('INT')],
  },
  {
    field: 'Size',
    patterns: [buildFieldPattern('Size')],
  },
  {
    field: 'Number Appearing',
    patterns: [
      buildFieldPattern('Number Appearing'),
      buildFieldPattern('No. Appearing'),
      buildFieldPattern('No Appearing'),
    ],
  },
];

export function parseMonsterBlock(block: string): ParsedNPC {
  const lines = block.split(/\r?\n/);
  const name = sanitizeName(lines);
  const fields: Record<string, string> = {};
  const notes: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (typeof rawLine !== 'string') {
      continue;
    }

    const trimmedLine = rawLine.trim();
    if (!trimmedLine) {
      continue;
    }

    const segments = splitSegments(trimmedLine);
    let handled = false;

    for (const segment of segments) {
      const match = matchField(segment);
      if (!match) {
        continue;
      }

      let { value } = match;
      const alias = match.alias;
      let nextIndex = i + 1;

      if (alias.multiline) {
        const continuation = collectContinuation(value, lines, nextIndex);
        value = continuation.value;
        nextIndex = continuation.nextIndex;
      }

      if (value) {
        if (!fields[alias.field]) {
          fields[alias.field] = value;
        } else if (alias.consumeRestOfLine) {
          fields[alias.field] = `${fields[alias.field]}, ${value}`;
        }

        if (alias.additionalFields) {
          for (const extra of alias.additionalFields) {
            if (!fields[extra]) {
              fields[extra] = value;
            }
          }
        }
      }

      i = Math.max(i, nextIndex - 1);
      handled = true;

      if (alias.consumeRestOfLine) {
        continue;
      }
    }

    if (!handled) {
      notes.push(trimmedLine);
    }
  }

  if (fields['ALIGNMENT'] && !fields['Disposition']) {
    fields['Disposition'] = normalizeDisposition(fields['ALIGNMENT']);
  }

  return {
    name,
    fields,
    notes,
    original: block,
  };
}

export function parseMonsterBlocks(input: string): ParsedNPC[] {
  return input
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => parseMonsterBlock(block));
}

function matchField(segment: string): { alias: FieldAlias; value: string } | null {
  const trimmed = segment.trim();
  if (!trimmed) {
    return null;
  }

  for (const alias of FIELD_ALIASES) {
    for (const pattern of alias.patterns) {
      const match = pattern.exec(trimmed);
      if (!match) {
        continue;
      }

      const rawValue = trimmed.slice(match[0].length);
      const cleaned = cleanValue(rawValue);
      const value = alias.transform ? alias.transform(cleaned) : cleaned;
      return {
        alias,
        value,
      };
    }
  }

  return null;
}

function collectContinuation(value: string, lines: string[], startIndex: number): { value: string; nextIndex: number } {
  let combined = value.trim();
  let index = startIndex;

  while (index < lines.length) {
    const candidate = lines[index];
    const trimmed = candidate?.trim?.() ?? '';
    if (!trimmed) {
      index += 1;
      continue;
    }

    if (looksLikeFieldStart(trimmed)) {
      break;
    }

    combined = `${combined} ${trimmed}`.trim();
    index += 1;
  }

  return {
    value: combined,
    nextIndex: index,
  };
}

function looksLikeFieldStart(line: string): boolean {
  for (const alias of FIELD_ALIASES) {
    for (const pattern of alias.patterns) {
      if (pattern.test(line)) {
        return true;
      }
    }
  }
  return false;
}

function splitSegments(line: string): string[] {
  const segments: string[] = [];
  let current = '';
  let depth = 0;

  const push = () => {
    const trimmed = current.trim();
    if (trimmed) {
      segments.push(trimmed);
    }
    current = '';
  };

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    }

    current += char;

    if (depth > 0) {
      continue;
    }

    const remainder = line.slice(i + 1);
    if (!remainder) {
      continue;
    }

    const trimmedRemainder = remainder.replace(/^[\s,;]+/, '');
    if (!trimmedRemainder) {
      continue;
    }

    if (looksLikeFieldStart(trimmedRemainder)) {
      push();
      const consumed = remainder.length - trimmedRemainder.length;
      i += consumed;
      continue;
    }
  }

  push();
  return segments;
}

function cleanValue(value: string): string {
  return value.replace(/^[\s:;]+/, '').replace(/[\s]+/g, ' ').trim();
}

function buildFieldPattern(label: string): RegExp {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`^${escaped}\\b(?:\\s*[.:;–—-])?\\s*`, 'i');
}

function sanitizeName(lines: string[]): string {
  const firstNonEmpty = lines.find((line) => line.trim().length > 0) ?? 'Unnamed Monster';
  return stripMarkdown(firstNonEmpty).replace(/\s+/g, ' ').trim();
}

function stripMarkdown(value: string): string {
  return value.replace(/^\*+/, '').replace(/\*+$/, '').trim();
}
