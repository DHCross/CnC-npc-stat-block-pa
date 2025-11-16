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
