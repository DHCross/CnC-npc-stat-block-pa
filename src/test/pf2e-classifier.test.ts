import { describe, it, expect } from 'vitest';
import { classifyPF2eEntity } from '../lib/pf2e-classification-rules';

describe('pf2e classification scaffold', () => {
  it('marks NPC spell lists as reference and sets HasSpells', () => {
    const raw = `Goblin Shaman\nSpells: detect magic, heal light wounds\nHP: 12`;
    const out = classifyPF2eEntity(raw, 'pf2e');
    expect(out.signals.HasSpells).toBe(true);
    expect(out.spell_context).toBe('reference');
    expect(out.origin_context).toBe('pf2e');
  });

  it('returns unknown for entries without spells', () => {
    const raw = `Pit Trap (hazard)\nTrigger: creature steps on rim`;
    const out = classifyPF2eEntity(raw);
    expect(out.signals.HasSpells).toBe(false);
    expect(out.spell_context).toBeUndefined();
  });
});
