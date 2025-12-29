# Chunk 27

### test/full-document-pipeline.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import {
  extractCreatureEntries,
  parseCreatureBlock,
  analyzeFullDocument,
} from '../src/lib/full-document-pipeline';

const SAMPLE_DOCUMENT = `# Test Bestiary

## Creatures

### 1. Ape, carnivorous

*These creatures' vital stats are HD 4d10, HP 23, AC 15, disposition neutral. Their primary attributes are physical.*

**Core Stats:** HP 23, AC 15, Disposition neutral

---

### 2. Bandit

*This creature's vital stats are HP 4, AC 13, disposition neutral/evil. Their primary attributes are physical. He carries 6 silver in coin.*

**Core Stats:** HP 4, AC 13, Disposition neutral/evil

---

### 3. Goblin, raider

*This creature's vital stats are HD 1d6, HP 4, AC 14, disposition law/evil. Their primary attributes are physical. He carries 6 silver in coin.*

**Core Stats:** HP 4, AC 14, Disposition law/evil

---

### 4. Goblin, leader (corporal)

*This creature's vital stats are HD 3d6+2, HP 15, AC 16, disposition law/evil. Their primary attributes are physical. He carries 4 gold in coin.*

**Core Stats:** HP 15, AC 16, Disposition law/evil`;

describe('Full Document Pipeline', () => {
  describe('extractCreatureEntries', () => {
    it('should extract creature entries from markdown', () => {
      const entries = extractCreatureEntries(SAMPLE_DOCUMENT);
      
      expect(entries).toHaveLength(4);
      expect(entries[0].entryNumber).toBe(1);
      expect(entries[0].creatureName).toContain('Ape');
      expect(entries[1].entryNumber).toBe(2);
      expect(entries[1].creatureName).toContain('Bandit');
      expect(entries[2].entryNumber).toBe(3);
      expect(entries[2].creatureName).toContain('Goblin');
    });

    it('should handle creature names with special formatting', () => {
      const markdown = `### 1. **Batrachianoid*:** _\n\nStats here`;
      const entries = extractCreatureEntries(markdown);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].creatureName).toBe('Batrachianoid');
    });

    it('should return empty array for document without creatures', () => {
      const markdown = `# No Creatures Here\n\nJust some text.`;
      const entries = extractCreatureEntries(markdown);
      
      expect(entries).toHaveLength(0);
    });
  });

  describe('parseCreatureBlock', () => {
    it('should parse a creature entry', () => {
      const entries = extractCreatureEntries(SAMPLE_DOCUMENT);
      const parsed = parseCreatureBlock(entries[0]);
      
      expect(parsed).not.toBeNull();
      if (parsed) {
        expect(parsed.entryNumber).toBe(1);
        expect(parsed.creatureType).toContain('Ape');
        expect(parsed.converted).toBeTruthy();
        expect(parsed.validation).toBeTruthy();
      }
    });

    it('should extract creature type correctly', () => {
      const entries = extractCreatureEntries(SAMPLE_DOCUMENT);
      const goblinRaider = parseCreatureBlock(entries[2]);
      const goblinLeader = parseCreatureBlock(entries[3]);
      
      expect(goblinRaider?.creatureType).toBe('Goblin');
      expect(goblinLeader?.creatureType).toBe('Goblin');
    });
  });

  describe('generateDocumentStatistics', () => {
    it('should generate statistics from parsed creatures', () => {
      const result = analyzeFullDocument(SAMPLE_DOCUMENT, 'Test Bestiary');
      const stats = result.stats;
      
      expect(stats.totalCreatures).toBeGreaterThan(0);
      expect(stats.creatureTypeFrequency.size).toBeGreaterThan(0);
      expect(stats.acRange.min).toBeGreaterThan(0);
      expect(stats.hpRange.min).toBeGreaterThan(0);
    });

    it('should count creature type frequency correctly', () => {
      const result = analyzeFullDocument(SAMPLE_DOCUMENT, 'Test Bestiary');
      const stats = result.stats;
      
      // Should have 2 Goblins
      expect(stats.creatureTypeFrequency.get('Goblin')).toBe(2);
      // Should have 1 Ape
      expect(stats.creatureTypeFrequency.get('Ape')).toBe(1);
      // Should have 1 Bandit
      expect(stats.creatureTypeFrequency.get('Bandit')).toBe(1);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect AC outliers', () => {
      const highACDoc = `### 1. Super Tank\n\nHP 100, AC 25, Disposition neutral`;
      const result = analyzeFullDocument(highACDoc, 'Test');
      
      const anomalies = result.validationReport.statisticalAnomalies;
      const hasHighACAnomaly = anomalies.some(a => 
        a.message.includes('high AC')
      );
      
      expect(hasHighACAnomaly).toBe(true);
    });
  });

  describe('analyzeFullDocument', () => {
    it('should perform complete document analysis', () => {
      const result = analyzeFullDocument(SAMPLE_DOCUMENT, 'Test Bestiary');
      
      expect(result.creatures.length).toBeGreaterThan(0);
      expect(result.stats).toBeTruthy();
      expect(result.validationReport).toBeTruthy();
      expect(result.metadata.documentName).toBe('Test Bestiary');
      expect(result.metadata.totalEntries).toBeGreaterThan(0);
      expect(result.metadata.successRate).toBeGreaterThan(0);
    });

    it('should calculate success rate correctly', () => {
      const result = analyzeFullDocument(SAMPLE_DOCUMENT, 'Test Bestiary');
      
      // All entries should parse successfully
      expect(result.metadata.successRate).toBe(100);
      expect(result.creatures.length).toBe(result.metadata.totalEntries);
    });

      it('verifies that missing vital stats become a validation error and not preview artifact', () => {
        const doc = `### 1. Shadow Thug\n\n*This creature’s vital stats are unavailable.*\n\n**Core Stats:**`; // simulate old artifact

        const result = analyzeFullDocument(doc, 'testdoc');
        expect(result.creatures).toHaveLength(1);

        const creature = result.creatures[0];
        // converted should NOT contain the artifact text
        expect(creature.converted).not.toMatch(/This creature[’']s vital stats are unavailable/);

        // Instead, a Vital Stats error should appear in validation warnings
        const vit = creature.validation.warnings.find(w => w.category === 'Vital Stats');
        expect(vit).toBeDefined();
        expect(vit?.type).toBe('error');
      });

    it('should generate validation report', () => {
      const result = analyzeFullDocument(SAMPLE_DOCUMENT, 'Test Bestiary');
      const report = result.validationReport;
      
      expect(report.totalValidationScore).toBeGreaterThanOrEqual(0);
      expect(report.totalValidationScore).toBeLessThanOrEqual(100);
      expect(report.perCreatureScores.length).toBe(result.creatures.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document gracefully', () => {
      const result = analyzeFullDocument('', 'Empty Doc');
      
      expect(result.creatures).toHaveLength(0);
      expect(result.metadata.successRate).toBe(0);
    });

    it('should handle malformed entries', () => {
      const malformed = `### 1. Broken Entry\n\nThis has no stats`;
      const result = analyzeFullDocument(malformed, 'Test');
      
      // Should attempt to parse but may have low success rate
      expect(result.metadata.totalEntries).toBe(1);
    });

    it('should handle entries with missing data', () => {
      const incomplete = `### 1. Incomplete\n\nHP 10`;
      const result = analyzeFullDocument(incomplete, 'Test');
      
      expect(result.metadata.totalEntries).toBe(1);
      // Parser should still attempt to extract available data
    });
  });
});

```

### test/npc-parser-html.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { convertToHtml } from '../src/lib/npc-parser';

describe('convertToHtml', () => {
  it('should convert markdown bold and italics to HTML', () => {
    const input = '**Bold** and *italic* text\n\nNext paragraph';
    const html = convertToHtml(input);

    expect(html).toContain('<strong>Bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<p>Next paragraph</p>');
  });

  it('should convert both ** and __ bold markers to <strong>', () => {
    expect(convertToHtml('**bold**')).toContain('<strong>bold</strong>');
    expect(convertToHtml('__bold__')).toContain('<strong>bold</strong>');
  });

  it('should preserve bold/italic in the real sample', () => {
    const sample = "**This creature's vital stats are HP 23** *disposition neutral*";
    const html = convertToHtml(sample);

    expect(html).toContain('<strong>This creature\'s vital stats are HP 23</strong>');
    expect(html).toContain('<em>disposition neutral</em>');
  });

  it('should escape html then convert markdown', () => {
    const input = '<script>alert(1)</script> **Note**';
    const html = convertToHtml(input);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<strong>Note</strong>');
  });
});

```

### test/canonical_dataset.test.ts

```typescript
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

```

### data/hd-canonical.json

```json
{
  "ape": "4d10",
  "bandit": "1d6",
  "bear": "3d8",
  "boar": "2d8",
  "bugbear": "3d10",
  "goblin": "1d6",
  "bandits": "1d6",
  "bandit sentry": "1d6",
  "orc": "1d8",
  "wolf": "2d6",
  "owlbear": "3d10",
  "owl bear": "3d10"
}

```

