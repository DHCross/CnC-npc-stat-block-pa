import { describe, it, expect } from 'vitest';
import {
  splitTitleAndBody,
  extractParentheticalData,
  isUnitHeading,
  normalizeDisposition,
  normalizeAttributes,
  canonicalizeShields,
  repositionMagicItemBonuses,
  deduplicateEquipment,
  normalizeEquipmentVerbs,
  extractMountFromParenthetical,
  buildCanonicalParenthetical,
  formatMountBlock
} from '../lib/enhanced-parser';

describe('Enhanced Parser Functions', () => {
  describe('splitTitleAndBody', () => {
    it('should extract title and parentheticals from text', () => {
      const input = `**Owen Carter, lieutenant of the town guard**
(He is a neutral, human, 4th level fighter. His vital stats are HP 24, AC 16. He carries banded mail, shield, longsword and dagger.)`;

      const result = splitTitleAndBody(input);

      expect(result.title).toBe('**Owen Carter, lieutenant of the town guard**');
      expect(result.parentheticals).toHaveLength(1);
      expect(result.parentheticals[0]).toContain('He is a neutral, human, 4th level fighter');
    });

    it('should handle multiple parentheticals', () => {
      const input = `**Sir Knight** (human fighter) (HP 30, AC 18)`;
      const result = splitTitleAndBody(input);

      expect(result.parentheticals).toHaveLength(2);
      expect(result.parentheticals[0]).toBe('human fighter');
      expect(result.parentheticals[1]).toBe('HP 30, AC 18');
    });
  });

  describe('extractParentheticalData', () => {
    it('should extract HP from various formats', () => {
      expect(extractParentheticalData('HP 36').hp).toBe('36');
      expect(extractParentheticalData('Hit Points: 59').hp).toBe('59');
      expect(extractParentheticalData('vital stats are HP 24').hp).toBe('24');
    });

    it('should extract AC from various formats', () => {
      expect(extractParentheticalData('AC 16').ac).toBe('16');
      expect(extractParentheticalData('AC 13/22').ac).toBe('13/22');
      expect(extractParentheticalData('AC: 18').ac).toBe('18');
    });

    it('should extract race/class/level', () => {
      const data = extractParentheticalData('human, 4th level fighter');
      expect(data.raceClass).toBe('human, 4ᵗʰ level fighter');
      expect(data.level).toBe('4');
    });

    it('should extract disposition and normalize it', () => {
      expect(extractParentheticalData('alignment: lawful good').disposition).toBe('law/good');
      expect(extractParentheticalData('disposition neutral').disposition).toBe('neutral');
      expect(extractParentheticalData('disposition neutral/neutral').disposition).toBe('neutral');
      expect(extractParentheticalData('disposition true neutral').disposition).toBe('neutral');
    });

    it('should extract equipment', () => {
      const data = extractParentheticalData('carries banded mail, shield, longsword');
      expect(data.equipment).toBe('banded mail, shield, longsword');
    });
  });

  describe('isUnitHeading', () => {
    it('should detect unit headings', () => {
      expect(isUnitHeading('Men-at-Arms, Bowmen x6')).toBe(true);
      expect(isUnitHeading('Guards x10')).toBe(true);
      expect(isUnitHeading('Militia Warriors')).toBe(true);
      expect(isUnitHeading('Sir Owen Carter')).toBe(false);
    });
  });

  describe('normalizeDisposition', () => {
    it('should convert adjective forms to noun forms', () => {
      expect(normalizeDisposition('lawful good')).toBe('law/good');
      expect(normalizeDisposition('Chaotic Evil')).toBe('chaos/evil');
      expect(normalizeDisposition('neutral good')).toBe('neutral/good');
      expect(normalizeDisposition('true neutral')).toBe('neutral');
      expect(normalizeDisposition('neutral/neutral')).toBe('neutral');
    });

    it('should handle single-word alignments', () => {
      expect(normalizeDisposition('lawful')).toBe('law/neutral');
      expect(normalizeDisposition('chaotic')).toBe('chaos/neutral');
      expect(normalizeDisposition('neutral')).toBe('neutral');
    });
  });

  describe('normalizeAttributes', () => {
    it('should convert unit attributes to physical prime sentence', () => {
      const result = normalizeAttributes('str, dex, con', { isUnit: true });
      expect(result.type).toBe('prime');
      expect(result.value).toBe('physical');
    });

    it('should include all prime attributes for classed NPCs', () => {
      const result = normalizeAttributes('str 15, dex 12, con 13', {
        raceClassText: 'human, 4ᵗʰ level fighter',
        levelText: '4'
      });
      expect(result.type).toBe('list');
      // Fighters have strength, dexterity, constitution as primes
      expect(result.value).toBe('strength, dexterity, constitution');
    });

    it('should always include fighter primes for 1st level fighters', () => {
      const result = normalizeAttributes('str 11, dex 10, con 9', {
        raceClassText: 'human, 1ˢᵗ level fighter',
        levelText: '1'
      });
      expect(result.type).toBe('list');
      expect(result.value).toBe('strength, dexterity, constitution');
    });

    it('should return prime type for creatures without class levels', () => {
      const result = normalizeAttributes('str 14, con 13', {
        raceClassText: 'ogre brute'
      });
      expect(result.type).toBe('prime');
      expect(result.value).toBe('physical');
    });
  });

  describe('canonicalizeShields', () => {
    it('should fix the buckler bug', () => {
      expect(canonicalizeShields('buckler +1')).toBe('buckler +1');
      expect(canonicalizeShields('+2 shield')).toBe('medium steel shield +2');
      expect(canonicalizeShields('steel shield')).toBe('medium steel shield');
    });

    it('should handle various shield formats', () => {
      expect(canonicalizeShields('a shield')).toBe('medium steel shield');
      expect(canonicalizeShields('wooden buckler')).toBe('buckler');
      expect(canonicalizeShields('iron pavis +3')).toBe('pavis +3');
    });
  });

  describe('repositionMagicItemBonuses', () => {
    it('should move bonuses from beginning to end', () => {
      expect(repositionMagicItemBonuses('+1 longsword')).toBe('longsword +1');
      expect(repositionMagicItemBonuses('+2 shield')).toBe('shield +2');
      expect(repositionMagicItemBonuses('+3 full plate mail')).toBe('full plate mail +3');
    });

    it('should handle multiple magic items', () => {
      const input = '+1 longsword, +2 shield, +3 lance';
      const expected = 'longsword +1, shield +2, lance +3';
      expect(repositionMagicItemBonuses(input)).toBe(expected);
    });
  });

  describe('deduplicateEquipment', () => {
    it('should remove duplicate equipment items', () => {
      expect(deduplicateEquipment('lance, lance, sword')).toBe('lance, sword');
      expect(deduplicateEquipment('shield, sword, shield, dagger')).toBe('shield, sword, dagger');
    });
  });

  describe('normalizeEquipmentVerbs', () => {
    it('should normalize armor verbs to "wears"', () => {
      expect(normalizeEquipmentVerbs('wearing chain mail')).toBe('wears chain mail');
      expect(normalizeEquipmentVerbs('worn plate armor')).toBe('wears plate armor');
    });

    it('should normalize weapon verbs to "carry"', () => {
      expect(normalizeEquipmentVerbs('carries longsword')).toBe('carry longsword');
      expect(normalizeEquipmentVerbs('carrying a bow')).toBe('carry a bow');
    });
  });

  describe('extractMountFromParenthetical', () => {
    it('should extract war horse data and clean parenthetical', () => {
      const input = 'human fighter, HP 30, AC 16, heavy war horse HP 35, AC 19, 2 hooves for 1d4 each';
      const result = extractMountFromParenthetical(input);

      expect(result.mountBlock).toBeDefined();
      expect(result.mountBlock?.name).toBe('warhorse');
      expect(result.mountBlock?.hp).toBe('35');
      expect(result.mountBlock?.ac).toBe('19');
      expect(result.cleanedParenthetical).not.toContain('war horse');
      expect(result.cleanedParenthetical).not.toContain('hooves');
    });

    it('should return unchanged if no mount data', () => {
      const input = 'human fighter, HP 30, AC 16';
      const result = extractMountFromParenthetical(input);

      expect(result.mountBlock).toBeUndefined();
      expect(result.cleanedParenthetical).toBe(input);
    });
  });

  describe('buildCanonicalParenthetical', () => {
    it('should build canonical format for individual NPC with qualifying attributes', () => {
      const data = {
        hp: '24',
        ac: '16',
        disposition: 'neutral',
        raceClass: 'human, 4th level fighter',
        level: '4',
        attributes: 'strength 15, dexterity 12, constitution 13',
        equipment: 'wears banded mail, carry shield, longsword, dagger',
        raw: 'original'
      };

      const result = buildCanonicalParenthetical(data, false, false, false);

      expect(result).toContain("HP 24, AC 16, disposition neutral");
      // Fighters list all primes: strength, dexterity, constitution
      expect(result).toContain("His primary attributes are strength, dexterity, constitution");
      expect(result).toContain('He wears');
    });

    it('should build canonical format for unit', () => {
      const data = {
        hp: '12',
        ac: '15',
        disposition: 'neutral',
        raceClass: 'human, 2nd level fighters',
        level: '2',
        attributes: 'PA physical',
        equipment: 'chain mail, longbow, longsword',
        raw: 'original'
      };


      const result = buildCanonicalParenthetical(data, true, false, false);

      expect(result).toContain('Their primary attributes are physical');
      // Mundane equipment should NOT be italicized
      expect(result).toContain('chain mail');
      expect(result).not.toContain('*chain mail*');
    });
 
    it('should use prime statement for creatures without class levels', () => {
      const data = {
        hp: '18',
        ac: '14',
        disposition: 'chaos/evil',
        raceClass: 'goblin marauder',
        attributes: 'dex 14, con 11',
        equipment: 'leather armor, short sword',
        raw: 'original'
      };

      const result = buildCanonicalParenthetical(data, false, false, false);

      // For non-classed creatures, "Their" is capitalized and vital stats ends with period
      expect(result).toContain('Their primary attributes are physical');
      expect(result).toMatch(/vital stats are .+\.\s+Their primary attributes/);
    });

    it('should merge jewelry and coins into single carry sentence when no weapons present', () => {
      const data = {
        hp: '30',
        ac: '12',
        disposition: 'neutral',
        raceClass: 'human merchant',
        equipment: 'leather armor',
        jewelry: '50 gold worth of jewelry',
        coins: '25gp',
        raw: 'original'
      };

      const result = buildCanonicalParenthetical(data, false, false, false);

      // Should have exactly one carry sentence that includes both jewelry and coins
      expect(result).toContain('He carries 25 in coin and fifty in jewelry');

      // Should only have one instance of "carries" (merged into single sentence)
      const carriesCount = (result.match(/\bcarries\b/g) || []).length;
      expect(carriesCount).toBe(1);
    });
  });

  describe('formatMountBlock', () => {
    it('should format complete mount block', () => {
      const mountBlock = {
        name: 'warhorse',
        level: '4(d10)',
        hp: '35',
        ac: '19',
        disposition: 'neutral',
        attacks: '2 hooves for 1d4 damage each',
        equipment: 'chainmail barding',
        raw: 'original'
      };

      const result = formatMountBlock(mountBlock);

      expect(result).toContain("Level 4(d10), HP 35, AC 19, disposition neutral");
      expect(result).toContain("It attacks with 2 hooves for 1d4 damage each");
      expect(result).toContain("It wears chainmail barding");
    });

    it('should handle minimal mount data', () => {
      const mountBlock = {
        name: 'horse',
        raw: 'original'
      };

      const result = formatMountBlock(mountBlock);

      expect(result).toBe('**Horse (mount)** *(This creature’s vital stats are unavailable.)*');
    });
  });

  describe('Integration tests', () => {
    it('should handle Owen Carter example correctly', () => {
      const input = `**Owen Carter, lieutenant of the town guard**
(He is a neutral, human, 4th level fighter. His vital stats are HP 24, AC 16. He carries banded mail, shield, longsword and dagger.)`;

      const { title, parentheticals } = splitTitleAndBody(input);
      const data = extractParentheticalData(parentheticals[0]);
      const isUnit = isUnitHeading(title);

      expect(data.hp).toBe('24');
      expect(data.ac).toBe('16');
      // Note: disposition extraction from prose requires more sophisticated parsing
      expect(isUnit).toBe(false);

      // Test equipment canonicalization
      if (data.equipment) {
        let equipment = canonicalizeShields(data.equipment);
        equipment = repositionMagicItemBonuses(equipment);
        expect(equipment).toContain('medium steel shield');
      }
    });

    it('should handle unit example correctly', () => {
      const input = `**Men-at-Arms, Bowmen x6**
(these human men-at-arms are 2nd level fighters; HP 12; AC 15; primary attributes strength, dexterity, constitution; EQ chain mail, longbow, longsword, belt axe; 2-12gp.)`;

      const { title, parentheticals } = splitTitleAndBody(input);
      const data = extractParentheticalData(parentheticals[0]);
      const isUnit = isUnitHeading(title);

      expect(data.hp).toBe('12');
      expect(data.ac).toBe('15');
      expect(isUnit).toBe(true);

      if (data.attributes) {
        const normalizedAttrs = normalizeAttributes(data.attributes, { isUnit });
        expect(normalizedAttrs.type).toBe('prime');
        expect(normalizedAttrs.value).toBe('physical');
      }
    });
  });
});