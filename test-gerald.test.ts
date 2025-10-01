import { describe, it, expect } from 'vitest';
import { processDumpEnhanced } from './src/lib/npc-parser';

describe('Gerald Farmer Parsing', () => {
  it('should parse Gerald Farmer correctly with all details', () => {
    const input = `Gerald "Grins" Farmer, lesser bully (He is a neutral evil, human, 4th/5th level fighter/assassin whose vital stats are: HP 28, AC 12. His prime attributes are: str, dex, int. He has a secondary skill of: bullying. He carries leather armor, long sword and dagger.)`;

    const result = processDumpEnhanced(input);

    console.log('Input:', input);
    console.log('Converted:', result[0].converted);
    console.log('Fields:', JSON.stringify(result[0], null, 2));

    // Should extract human race
    expect(result[0].converted).toContain('human');

    // Should have multiclass levels
    expect(result[0].converted).toMatch(/4.*5.*level/);

    // Should include fighter/assassin
    expect(result[0].converted).toContain('fighter');
    expect(result[0].converted).toContain('assassin');

    // Should use singular "His" not plural "Their"
    expect(result[0].converted).toContain('His primary attributes');
    expect(result[0].converted).not.toContain('Their primary attributes');

    // Should list specific attributes, not generic "physical"
    expect(result[0].converted).toContain('strength');
    expect(result[0].converted).toContain('dexterity');
    expect(result[0].converted).toContain('intelligence');
    expect(result[0].converted).not.toMatch(/primary attributes are physical/i);

    // Should NOT italicize mundane equipment
    expect(result[0].converted).not.toContain('*leather armor*');
    expect(result[0].converted).not.toContain('*long sword*');
    expect(result[0].converted).not.toContain('*dagger*');
  });
});
