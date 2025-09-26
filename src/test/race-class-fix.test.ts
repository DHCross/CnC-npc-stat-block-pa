import { describe, it, expect } from 'vitest';
import { processDumpEnhanced } from '../lib/npc-parser';

describe('Race & Class Preservation Fix', () => {
  it('should preserve race and class information in enhanced parser', () => {
    const input = "Men-at-Arms, Bowmen x6 (these 2ⁿᵈ level human fighters' vital stats are HP 12, AC 15, disposition neutral. PA physical. they wear chain mail and carry longbows, longswords, belt axes, and carry 2–12 gold in coin. they carry medium steel shields.)";

    const result = processDumpEnhanced(input);

    expect(result).toHaveLength(1);

    console.log('Input:', input);
    console.log('Name:', result[0].name);
    console.log('Converted:', result[0].converted);

    // The key test: race and class information should be preserved in the converted output
    // This should now work since we fixed the buildCanonicalParenthetical function
    expect(result[0].converted).toContain('human, 2ⁿᵈ level fighter');
  });

  it('should preserve race and class information for individual NPCs', () => {
    const input = "Sir Elric (human, 4th level fighter, HP 24, AC 16, disposition neutral, wears banded mail, carries medium steel shield, longsword, dagger)";

    const result = processDumpEnhanced(input);

    expect(result).toHaveLength(1);

    console.log('Input:', input);
    console.log('Name:', result[0].name);
    console.log('Converted:', result[0].converted);

    // The key test: race and class information should be preserved in the converted output
    expect(result[0].converted).toContain('human, 4ᵗʰ level fighter');
  });
});