import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */

const HD_REQUIRED_EXCEPTIONS = new Set(['Fekk', 'Prisoner #2: An elderly orc']);
const HD_PATTERN = /^\d+d\d+(?:\s*(?:\+|-)\s*\d+)?$/i;

function hasClassLevels(entry: any): boolean {
  const parsed = entry.parsed || {};

  if (typeof parsed.level === 'number') {
    return true;
  }

  if (typeof parsed.level === 'string' && parsed.level.trim().length > 0) {
    // Level strings that include dice notation (e.g., "1(d6)") are HD, not class levels.
    if (!/\(d\d+/i.test(parsed.level)) {
      return true;
    }
  }

  const normalizedRaceClass = typeof parsed.raceClass === 'string' ? parsed.raceClass.replace(/_/g, ' ') : '';
  if (normalizedRaceClass && /\blevel\b/i.test(normalizedRaceClass)) {
    return true;
  }

  if (entry.canonicalData?.raceClass && /\blevel\b/i.test(entry.canonicalData.raceClass.replace(/_/g, ' '))) {
    return true;
  }

  return false;
}

describe('Mouths of Madness canonical dataset', () => {
  it('has HP/AC/disposition coverage and HD notation for every non-classed record', () => {
    const file = path.join('data', 'mouths-of-madness', 'entities.canonical.json');
    const raw = fs.readFileSync(file, 'utf8');
    const entities = JSON.parse(raw);

    const missingHP = entities.filter((e: any) => !e.canonicalData || !e.canonicalData.hp || e.canonicalData.hp === 'N/A');
    const missingAC = entities.filter((e: any) => !e.canonicalData || !e.canonicalData.ac || e.canonicalData.ac === 'N/A');
    const missingDisposition = entities.filter((e: any) => !e.canonicalData || !e.canonicalData.disposition || e.canonicalData.disposition === 'N/A');

    expect(missingHP.length, `Missing HP entries: ${missingHP.length}`).toBe(0);
    expect(missingAC.length, `Missing AC entries: ${missingAC.length}`).toBe(0);
    expect(missingDisposition.length, `Missing disposition entries: ${missingDisposition.length}`).toBeLessThanOrEqual(1);

    const hdIssues = entities
      .filter((entry: any) => !hasClassLevels(entry))
      .filter((entry: any) => !entry.canonicalData?.hd || !HD_PATTERN.test(entry.canonicalData.hd))
      .map((entry: any) => entry.title);

    const unexpectedHdGaps = hdIssues.filter((title: string) => !HD_REQUIRED_EXCEPTIONS.has(title));
    expect(unexpectedHdGaps, `Unexpected entries missing HD: ${unexpectedHdGaps.join(', ')}`).toHaveLength(0);
    expect(hdIssues.length).toBe(HD_REQUIRED_EXCEPTIONS.size);
  });
});
