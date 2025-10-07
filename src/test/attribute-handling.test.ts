import { describe, it, expect } from 'vitest';
import { normalizeAttributes } from '../lib/enhanced-parser';

describe('Attribute Handling Rules', () => {
  describe('Classless Creatures', () => {
    it('should use "physical" designation when no individual scores provided', () => {
      const result = normalizeAttributes('PA physical', {
        raceClassText: 'goblin',
        levelText: undefined
      });

      expect(result.type).toBe('prime');
      expect(result.value).toBe('physical');
    });

    it('should use "mental" designation when specified', () => {
      const result = normalizeAttributes('PA mental', {
        raceClassText: 'ghost',
        levelText: undefined
      });

      expect(result.type).toBe('prime');
      expect(result.value).toBe('mental');
    });

    it('should infer physical from attribute names for classless creatures', () => {
      const result = normalizeAttributes('str 16, dex 14, con 10, int 8', {
        raceClassText: 'orc',
        levelText: undefined
      });

      expect(result.type).toBe('prime');
      // Classless creatures infer type from attribute names (has physical attrs → "physical")
      expect(result.value).toBe('physical');
    });

    it('should use physical designation if no modifiers', () => {
      const result = normalizeAttributes('str 10, dex 11, con 12', {
        raceClassText: 'human peasant',
        levelText: undefined
      });

      expect(result.type).toBe('prime');
      expect(result.value).toBe('physical');
    });
  });

  describe('Classed NPCs - Individual Scores Provided', () => {
    it('should list all fighter primes when scores provided', () => {
      const result = normalizeAttributes('str 12, dex 11, con 10', {
        raceClassText: 'human, 3rd level fighter',
        levelText: '3'
      });

      expect(result.type).toBe('list');
      // All fighter primes: strength, dexterity, constitution
      expect(result.value).toBe('strength, dexterity, and constitution');
    });

    it('should list cleric prime (wisdom) when score provided', () => {
      const result = normalizeAttributes('wis 15, int 10, cha 12', {
        raceClassText: 'human, 5th level cleric',
        levelText: '5'
      });

      expect(result.type).toBe('list');
      // Cleric prime is wisdom, also wisdom 15 has a modifier
      expect(result.value).toBe('wisdom');
    });

    it('should list wizard prime (intelligence) plus high charisma', () => {
      const result = normalizeAttributes('int 16, wis 11, cha 14', {
        raceClassText: 'elf, 4th level wizard',
        levelText: '4'
      });

      expect(result.type).toBe('list');
      // Wizard prime is intelligence, charisma 14 also has modifier
      expect(result.value).toBe('intelligence and charisma');
    });

    it('should list rogue prime (dexterity) when provided', () => {
      const result = normalizeAttributes('str 10, dex 15, con 12', {
        raceClassText: 'halfling, 2nd level rogue',
        levelText: '2'
      });

      expect(result.type).toBe('list');
      // Rogue prime is dexterity
      expect(result.value).toBe('dexterity');
    });

    it('should include all ranger primes when provided', () => {
      const result = normalizeAttributes('str 14, dex 13, wis 15, int 10', {
        raceClassText: 'human, 4th level ranger',
        levelText: '4'
      });

      expect(result.type).toBe('list');
      // Ranger primes: strength, dexterity, wisdom (all provided with modifiers)
      expect(result.value).toBe('strength, dexterity, and wisdom');
    });
  });

  describe('Classed NPCs - Only Designation Provided', () => {
    it('should use physical designation for fighter unit with PA physical', () => {
      const result = normalizeAttributes('PA physical', {
        raceClassText: 'human, 2nd level fighters',
        levelText: '2',
        isUnit: true
      });

      expect(result.type).toBe('prime');
      expect(result.value).toBe('physical');
    });

    it('should use mental designation for wizard with PA mental', () => {
      const result = normalizeAttributes('PA mental', {
        raceClassText: 'elf, 5th level wizard',
        levelText: '5'
      });

      expect(result.type).toBe('prime');
      expect(result.value).toBe('mental');
    });
  });

  describe('Classed NPCs - No Attributes Provided', () => {
    it('should return none for classed NPC with no attributes', () => {
      const result = normalizeAttributes('', {
        raceClassText: 'human, 3rd level fighter',
        levelText: '3'
      });

      expect(result.type).toBe('none');
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed attributes with some primes and some modifiers', () => {
      const result = normalizeAttributes('str 16, dex 10, con 13, int 8, wis 12, cha 14', {
        raceClassText: 'human, 6th level fighter',
        levelText: '6'
      });

      expect(result.type).toBe('list');
      // Fighter primes: str, dex, con (all listed)
      // Plus int 8 and cha 14 have modifiers
      expect(result.value).toBe('strength, dexterity, constitution, intelligence, and charisma');
    });

    it('should handle paladin with multiple primes and high strength', () => {
      const result = normalizeAttributes('str 14, wis 15, cha 16', {
        raceClassText: 'human, 5th level paladin',
        levelText: '5'
      });

      expect(result.type).toBe('list');
      // Paladin primes: wisdom, charisma; also strength 14 has a modifier
      expect(result.value).toBe('strength, wisdom, and charisma');
    });
  });
});
