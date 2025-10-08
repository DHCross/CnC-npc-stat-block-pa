import { describe, it, expect } from 'vitest';
import { processDump } from './src/lib/npc-parser';

describe('Single-Line NPC Stat Block Parsing', () => {
  it('should correctly parse a single-line stat block', () => {
    const input = `
**The Right Honorable President Counselor of Yggsburgh, His Supernal Devotion Victor Oldham, High Priest of the Grand Temple** Disposition: law/good Race & Class: human, 16th level cleric Hit Points (HP): 59 Armor Class (AC): 13/22 Primary attributes: strength, wisdom, charisma Equipment: pectoral of armor +3, full plate mail, large steel shield, staff of striking, mace Spells: 0-6, 1st-6, 2nd-5, 3rd-5, 4th-4, 5th-4, 6th-3, 7th- 3, 8th-2 Mount: heavy war horse
`;

    const result = processDump(input);

    expect(result).toHaveLength(1);
    const npc = result[0];

    // Note: The parser will create a narrative string, so we check for the presence of the data
    // in the 'converted' output. The underlying `ParsedNPC` object is not directly exposed.
    expect(npc.converted).toContain('disposition law/good');
    expect(npc.converted).toContain('human 16ᵗʰ level cleric');
    expect(npc.converted).toContain('HP 59');
    expect(npc.converted).toContain('AC 13/22');
    expect(npc.converted).toContain('primary attributes are strength, wisdom, and charisma');
    expect(npc.converted).toContain('pectoral of armor +3');
    expect(npc.converted).toContain('full plate mail');
    expect(npc.converted).toContain('large steel shield');
    expect(npc.converted).toContain('staff of striking');
    expect(npc.converted).toContain('mace');
    expect(npc.converted).toContain('0-6, 1st-6, 2nd-5, 3rd-5, 4th-4, 5th-4, 6th-3, 7th- 3, 8th-2');
    expect(npc.converted).toContain('**Heavy War Horse (mount)**');
  });
});