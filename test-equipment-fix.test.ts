import { describe, it, expect } from 'vitest';
import { processDumpEnhanced } from './src/lib/npc-parser';

describe('Equipment Processing Edge Cases', () => {
  it('should handle unit equipment verbs correctly', () => {
    const unitInput = 'Guards x4 (they wear leather, carry spears)';
    const result = processDumpEnhanced(unitInput);

    console.log('Unit input:', unitInput);
    console.log('Unit result:', result[0].converted);

    expect(result[0].converted).toContain('wear ');
    expect(result[0].converted).toContain('carry ');
  });

  it('should handle magic item bonuses correctly', () => {
    const magicInput = 'Paladin (wears +2 plate mail, carries +1 sword)';
    const result = processDumpEnhanced(magicInput);

    console.log('Magic input:', magicInput);
    console.log('Magic result:', result[0].converted);

    expect(result[0].converted).toContain('plate mail +2');
    expect(result[0].converted).toContain('sword +1');
    expect(result[0].converted).not.toContain('+2 plate mail');
    expect(result[0].converted).not.toContain('+1 sword');
  });

  it('should handle currency expansion', () => {
    const currencyInput = 'Merchant (carries 10gp, 5sp, 2pp)';
    const result = processDumpEnhanced(currencyInput);

    console.log('Currency input:', currencyInput);
    console.log('Currency result:', result[0].converted);

    expect(result[0].converted).toContain('10 gp');
    expect(result[0].converted).toContain('5 sp');
    expect(result[0].converted).toContain('2 pp');
  });
});
