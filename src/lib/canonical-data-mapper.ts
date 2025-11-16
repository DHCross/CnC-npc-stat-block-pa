import type { ParsedNPC } from './stat-block-types';

export interface CanonicalData {
  name: string;
  level: string | null;
  hd: string | null;
  hp: number | null;
  ac: number | null;
  disposition: string | null;
  primaryAttributes: string | null;
  equipment: string | null;
  coins: string | null;
  notes?: string[];
}

function parseFirstNumber(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function pickField(fields: Record<string, string>, ...keys: string[]): string | null {
  for (const key of keys) {
    const candidate = fields[key];
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

export function buildCanonicalData(parsed: ParsedNPC): CanonicalData {
  const { fields, name, notes } = parsed;

  const level = pickField(fields, 'Level');
  const hd = pickField(fields, 'HD');
  const hpRaw = pickField(fields, 'Hit Points (HP)', 'HP');
  const acRaw = pickField(fields, 'Armor Class (AC)', 'AC');
  const disposition = pickField(fields, 'Disposition', 'Alignment');
  const primaryAttributes = pickField(fields, 'Primary attributes', 'Prime Attributes', 'Primary Attributes');
  const equipment = pickField(fields, 'Equipment', 'EQ');
  const coins = pickField(fields, 'Coins', 'Treasure');

  return {
    name,
    level: level ?? null,
    hd: hd ?? null,
    hp: parseFirstNumber(hpRaw),
    ac: parseFirstNumber(acRaw),
    disposition: disposition ?? null,
    primaryAttributes: primaryAttributes ?? null,
    equipment: equipment ?? null,
    coins: coins ?? null,
    notes: notes?.length ? notes : undefined,
  };
}
