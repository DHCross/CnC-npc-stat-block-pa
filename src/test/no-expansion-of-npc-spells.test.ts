import { describe, it, expect } from 'vitest';
import { processDumpWithValidation } from '@/lib/npc-parser';

describe('No expansion of NPC spells (C&C)', () => {
  it('preserves referenced spell names and does not include descriptive spell prose', () => {
    const input = `**Goblin Priest**\n
Disposition: neutral\n
Race & Class: goblin, 2nd level priest\n
Hit Points (HP): 12\n
Armor Class (AC): 13\n
Spells: detect disposition, sanctuary`;

    const processed = processDumpWithValidation(input, true, 'enhanced');
    expect(processed.length).toBeGreaterThan(0);

    const output = processed[0].converted;

    // Spell names are preserved in the output (reference channel)
    expect(output.toLowerCase()).toContain('detect disposition');
    expect(output.toLowerCase()).toContain('sanctuary');

    // No PHB-like spell blocks (these keywords indicate expanded spell prose)
    expect(output).not.toMatch(/Casting Time:|Duration:|Components:|Range:|Target:/i);

    // No obvious sentence that looks like a full spell description
    expect(output).not.toMatch(/\b\d+\s+minutes\b|\b(instantaneous|concentration)\b/i);
  });
});
