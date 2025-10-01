import { describe, it, expect } from 'vitest';
import { processDumpEnhanced } from './src/lib/npc-parser';

describe('Halfling Unit Parsing Fix', () => {
  it('should format non-classed halfling units correctly with race name', () => {
    const input = `Halflings x14 (these halflings' vital stats are Level 1(d6), HP 3, AC 13, and disposition good/neutral. Their primary attributes are physical. They wear leather armor and carry shields and spears.)`;

    const result = processDumpEnhanced(input);

    console.log('Input:', input);
    console.log('Converted:', result[0].converted);

    // Should use "These halflings'" not "These creatures'"
    expect(result[0].converted).toContain('These halflings');
    expect(result[0].converted).not.toContain('These creatures');

    // Should include Level 1(d6)
    expect(result[0].converted).toContain('Level 1(d6)');

    // Should have disposition in noun form without "toward"
    expect(result[0].converted).toContain('disposition good/neutral');
    expect(result[0].converted).not.toContain('toward');

    // Should start with correct title
    expect(result[0].converted).toMatch(/^\*\*Halflings x14\*\*/);
  });

  it('should format goblin marauders correctly', () => {
    const input = `Goblin Marauders x8 (these goblin marauders' vital stats are Level 1(d8), HP 5, AC 14, disposition chaos/evil. Their primary attributes are dexterity. They wear leather armor and carry short swords and shields.)`;

    const result = processDumpEnhanced(input);

    console.log('Goblin Input:', input);
    console.log('Goblin Converted:', result[0].converted);

    // Should use race-specific descriptor
    expect(result[0].converted).toContain('goblin marauders');
    expect(result[0].converted).not.toContain('These creatures');

    // Should include Level
    expect(result[0].converted).toContain('Level 1(d8)');
  });
});
