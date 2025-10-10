import { describe, it, expect } from 'vitest';
import { MAGIC_ITEM_MAPPINGS, MONSTER_NAME_MAPPINGS, applyNameMappings } from '../lib/name-mappings';

describe('Name Mappings', () => {
  describe('Magic Item Mappings', () => {
    it('should have correct mappings for magic items', () => {
      expect(MAGIC_ITEM_MAPPINGS['dagger of venom']).toBe('Dagger of Envenomation');
      expect(MAGIC_ITEM_MAPPINGS['ring of protection']).toBe('Ring of Armor');
      expect(MAGIC_ITEM_MAPPINGS['robe of protection']).toBe('robe of armor');
      expect(MAGIC_ITEM_MAPPINGS['talisman of pure good']).toBe('Talisman of Unwavering Good');
      expect(MAGIC_ITEM_MAPPINGS['staff of the magi']).toBe('Staff of the Magus');
      expect(MAGIC_ITEM_MAPPINGS['slaying arrow']).toBe('Arrow of Slaying');
    });
  });

  describe('Monster Name Mappings', () => {
    it('should have correct mappings for monsters', () => {
      expect(MONSTER_NAME_MAPPINGS['aboleth']).toBe('Abhorrent');
      expect(MONSTER_NAME_MAPPINGS['bugbear']).toBe('Bugbear');
      expect(MONSTER_NAME_MAPPINGS['giant, hill']).toBe('Giant, Hill');
    });
  });

  describe('applyNameMappings function', () => {
    it('should transform text with correct mappings', () => {
      const input = 'The bugbear had a dagger of venom and a ring of protection.';
      const expected = 'The Bugbear had a Dagger of Envenomation and a Ring of Armor.';
      expect(applyNameMappings(input)).toBe(expected);
    });

    it('should handle multiple mappings in a single text', () => {
      const input = 'The aboleth carried a staff of the magi and wore a robe of protection.';
      const expected = 'The Abhorrent carried a Staff of the Magus and wore a robe of armor.';
      expect(applyNameMappings(input)).toBe(expected);
    });

    it('should not change text without mappings', () => {
      const input = 'This text has no mappable terms.';
      expect(applyNameMappings(input)).toBe(input);
    });
  });
});