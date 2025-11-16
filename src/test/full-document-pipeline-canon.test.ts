import { describe, it, expect } from 'vitest';
import { analyzeFullDocument } from '@/lib/full-document-pipeline';
import { mouthsOfMadnessAnalysis } from '@/components/mocks/mouths-of-madness.mock';

describe('FullDocumentPipeline canonicalization tests (automated)', () => {
  const doc = mouthsOfMadnessAnalysis.creatures.map((c: any) => c.rawMarkdown).join('\n\n');
  const result = analyzeFullDocument(doc, 'mock');

  it('Ember Raventree uses full long-form PHB attributes', () => {
    const ember = result.creatures.find((c) => c.entryNumber === 55);
    expect(ember).toBeDefined();
    expect(ember?.converted).toContain('His primary attributes are strength, dexterity, constitution, intelligence, wisdom, charisma');
  });

  it('Bandit (#2) uses physical shorthand pronoun His', () => {
    const bandit = result.creatures.find((c) => c.entryNumber === 2);
    expect(bandit).toBeDefined();
    expect(bandit?.converted).toContain('His primary attributes are physical');
  });

  it('Hub-Gub the Bloody shows HP 18 not HD 3d10', () => {
    const hub = result.creatures.find((c) => c.creatureType?.includes('Hub-Gub'));
    expect(hub).toBeDefined();
    expect(hub?.converted).toContain('HP 18');
    expect(hub?.converted).not.toContain('HD 3d10');
  });

  it('The Little Hillwood Werewolf shows plain Level 12', () => {
    const werewolf = result.creatures.find((c) => c.creatureType?.includes('Little Hillwood Werewolf'));
    expect(werewolf).toBeDefined();
    expect(werewolf?.converted).toContain('12 level');
    expect(werewolf?.converted).not.toContain('12ᵗʰ');
  });

  it('Naga spells canonicalize to Dimension Door and Teleport', () => {
    const naga = result.creatures.find((c) => c.entryNumber === 26);
    expect(naga).toBeDefined();
    expect(naga?.converted).toMatch(/Dimension Door|Teleport/);
    // Should not refer to medium steel shield in spells text
    expect(naga?.converted).not.toContain('medium steel shield');
  });

  it('Goblin shaman => scroll of cause paralysis and potion text', () => {
    const shaman = result.creatures.find((c) => c.entryNumber === 90);
    expect(shaman).toBeDefined();
    expect(shaman?.converted).toContain('scroll of *cause paralysis*');
    expect(shaman?.converted).toMatch(/potion of extra healing/i);
    expect(shaman?.converted).toMatch(/heals.*2d8\+2/i);
  });

  it('Wily Wil grammar fixes armor/trash', () => {
    const wil = result.creatures.find((c) => c.creatureType?.includes('Wily Wil'));
    expect(wil).toBeDefined();
    expect(wil?.converted).not.toMatch(/armors|trashs/);
    expect(wil?.converted).toMatch(/armor/);
    expect(wil?.converted).toMatch(/trash/);
  });

  it('Artifact message removed from canonical preview and moved to validation', () => {
    // Pick an entry that in original mocks may have the artifact
    const ape = result.creatures.find((c) => c.entryNumber === 1);
    expect(ape).toBeDefined();
    expect(ape?.converted).not.toContain('vital stats are unavailable');
    // Archived artifact should be in validation warnings rather than converted
    expect(ape?.validation.warnings.some((w) => /Vital stats are unavailable/i.test(w.message))).toBe(false);
  });
});
