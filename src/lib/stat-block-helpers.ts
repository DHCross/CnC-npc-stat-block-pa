export function normalizeDisposition(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const mapping: Record<string, string> = {
    'lawful good': 'law/good',
    'lawful neutral': 'law/neutral',
    'lawful evil': 'law/evil',
    'neutral good': 'neutral/good',
    'true neutral': 'neutral',
    'neutral': 'neutral',
    'neutral/neutral': 'neutral',
    'neutral evil': 'neutral/evil',
    'chaotic good': 'chaos/good',
    'chaotic neutral': 'chaos/neutral',
    'chaotic evil': 'chaos/evil',
  };
  return mapping[trimmed] ?? value.trim();
}

export interface SubjectOptions {
  isPlural: boolean;
  race?: string;
  level?: string;
  charClass?: string;
  fallback?: string | null;
}

export function buildSubjectDescriptor(options: SubjectOptions): string {
  const pronoun = options.isPlural ? 'These' : 'This';
  const descriptorParts: string[] = [];

  if (options.race) {
    descriptorParts.push(options.race.trim().toLowerCase());
  }

  if (options.level) {
    descriptorParts.push(`${toSuperscript(options.level.trim())} level`);
  }

  if (options.charClass) {
    const baseClass = options.charClass.trim().toLowerCase();
    const classDescriptor = options.isPlural ? pluralizeClassName(baseClass) : baseClass;
    descriptorParts.push(classDescriptor);
  }

  let descriptor = descriptorParts.filter(Boolean).join(' ').trim();

  if (!descriptor) {
    const fallback = options.fallback?.trim();
    if (fallback) {
      descriptor = fallback
        .replace(/[,]+/g, ' ')
        .replace(/\s+/g, ' ')
        .toLowerCase();
    }
  }

  if (!descriptor) {
    descriptor = options.isPlural ? 'creatures' : options.charClass ? options.charClass : 'character';
    descriptor = descriptor.toLowerCase();
  }

  return `${pronoun} ${descriptor}`.replace(/\s+/g, ' ').trim();
}

export function toPossessiveSubject(subject: string, isPlural: boolean): string {
  const trimmed = subject.trim();
  const apostrophe = '\u2019';
  if (!trimmed) {
    return isPlural ? `These creatures${apostrophe}` : `This character${apostrophe}s`;
  }

  const lower = trimmed.toLowerCase();
  const alreadyPossessive = lower.endsWith("'") || lower.endsWith(apostrophe);
  if (alreadyPossessive) {
    return trimmed;
  }

  if (isPlural) {
    if (lower.endsWith('men') || lower.endsWith('children') || lower.endsWith('people')) {
      return `${trimmed}${apostrophe}`;
    }
    if (lower.endsWith('s')) {
      return `${trimmed}${apostrophe}`;
    }
    return `${trimmed}${apostrophe}s`;
  }

  if (lower.endsWith('s')) {
    return `${trimmed}${apostrophe}`;
  }

  return `${trimmed}${apostrophe}s`;
}

export function toSuperscript(value: string): string {
  return value + 'ᵗʰ';
}

export function pluralizeClassName(name: string): string {
  const lower = name.trim().toLowerCase();
  const irregulars: Record<string, string> = {
    'thief': 'thieves',
    'archer': 'archers',
    'fighter': 'fighters',
    'cleric': 'clerics',
    'paladin': 'paladins',
    'ranger': 'rangers',
    'wizard': 'wizards',
    'warlock': 'warlocks',
    'druid': 'druids',
    'bard': 'bards',
    'monk': 'monks',
    'rogue': 'rogues',
    'assassin': 'assassins',
    'knight': 'knights',
    'magic-user': 'magic-users',
  };

  if (irregulars[lower]) {
    return irregulars[lower];
  }

  if (lower.endsWith('man')) {
    return `${lower.slice(0, -3)}men`;
  }
  if (lower.endsWith('fe')) {
    return `${lower.slice(0, -2)}ves`;
  }
  if (lower.endsWith('f')) {
    return `${lower.slice(0, -1)}ves`;
  }
  if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) {
    return `${lower.slice(0, -1)}ies`;
  }
  if (lower.endsWith('s')) {
    return lower;
  }

  return `${lower}s`;
}
