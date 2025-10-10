import { describe, it, expect } from 'vitest';
import { convertLegacySpellText } from '../lib/spell-converter';

describe('Spell Converter', () => {
  describe('Single Spell Conversion', () => {
    it('should convert a basic spell with all fields', () => {
      const input = `**Arrest Motion** **(Chr) (Roan** **ot** **Kepulch)**

CT 1			R 150ft.		D 1 rd./lvl.

SV see below		SR yes		Comp S

Arrest motion stops objects in motion or keeps them from moving, if already motionless.

The targets are held exactly as they are when the rune is activated.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      const spell = results[0];
      expect(spell.originalName).toBe('Arrest Motion');
      expect(spell.canonicalName).toBe('Arrest Motion');
      expect(spell.metadata).toBe('Chr Roan ot Kepulch');
      expect(spell.statistics.castingTime).toBe('1');
      expect(spell.statistics.range).toBe('150 feet');
      expect(spell.statistics.duration).toBe('1 round per level');
      expect(spell.statistics.savingThrow).toBeUndefined();
      expect(spell.statistics.spellResistance).toBe('yes');
      expect(spell.statistics.components).toBe('S');
      expect(spell.description).toContain('stops objects in motion');
      expect(spell.effect).toContain('held exactly as they are');
      expect(spell.formatMeta.descriptor).toBeUndefined();
      expect(spell.formatMeta.noun).toBe('rune');
      expect(spell.formatMeta.runeKey).toBe('Chr Roan ot Kepulch');
      expect(spell.formatted).toContain('**Casting** this rune');
      expect(spell.formatted).not.toContain('Reforged Spell');
      expect(spell.formatted).not.toMatch(/see below/i);
      expect(spell.formatted).not.toMatch(/^\*(?!\*)(.*?)(?<!\*)\*$/m);
      expect(spell.warnings).toContain('Missing saving throw');
    });

    it('should map original spell names to canonical names', () => {
      const input = `**Cure Light Wounds**

CT 1   R touch   D instant

SV none   SR yes   Comp S

This spell heals minor injuries.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].originalName).toBe('Cure Light Wounds');
      expect(results[0].canonicalName).toBe('Heal Light Wounds');
    });

    it('should handle spells with missing statistics', () => {
      const input = `**Test Spell**

CT 1   R touch

This spell does something.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].warnings).toContain('Missing duration');
      expect(results[0].warnings).toContain('Missing saving throw');
      expect(results[0].warnings).toContain('Missing spell resistance');
      expect(results[0].warnings).toContain('Missing components');
    });

    it('should normalize measurements correctly', () => {
      const input = `**Test Spell**

CT 1 rd.   R 50 ft.   D 10 min./lvl.   SV none   SR no   Comp S

Test description.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].statistics.castingTime).toBe('1 round');
      expect(results[0].statistics.range).toBe('50 feet');
      expect(results[0].statistics.duration).toBe('10 minutes per level');
    });

    it('should handle spells with no description paragraphs', () => {
      const input = `**Empty Spell**

CT 1   R touch   D instant   SV none   SR yes   Comp S`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].warnings).toContain('Missing description paragraph');
      expect(results[0].warnings).toContain('Missing effect details');
    });

    it('should format the output correctly', () => {
      const input = `**Light**

CT 1   R see below   D 10 min./lvl.   SV none   SR none   Comp S

This rune sheds light.

The light extends up to 20 feet in radius.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      const formatted = results[0].formatted;
      expect(formatted).toContain('**LIGHT**');
      expect(formatted).toContain('This rune sheds light.');
      expect(formatted).not.toContain('*This rune sheds light.*');
      expect(formatted).toContain('The light extends up to 20 feet in radius.');
      expect(formatted).toContain('**Casting** this spell requires the caster\'s combat action for the round.');
      expect(formatted).toContain('The spell\'s **range** varies as described above with a **duration of 10 minutes per level**.');
      expect(formatted).toContain('**There is no saving throw.**');
      expect(formatted).toContain('The spell is **unaffected by spell resistance**.');
      expect(formatted).toContain('**The casting components** are **gesture**.');
      expect(formatted).not.toContain('Statistics:');
      expect(formatted).not.toContain('Casting Time:');
      expect(formatted).not.toContain('Reforged Spell');
      expect(formatted).not.toMatch(/see below/i);
    });

    it('should render area of effect and components in separate prose paragraphs', () => {
      const input = `**Sonic Lattice (Int) (Roan ot Vel)**

CT 2 rds.   R 60 ft.   D 3 rds.   SV negates   SR yes   AoE 20 ft. radius   Comp V, S, M

Sound shards lash from the rune in a pulsing pattern.

Creatures within the sphere are pelted by razored sound-waves and deafened.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      const formatted = results[0].formatted;
      expect(formatted).toContain('**The area of effect** is 20 feet radius.');
      expect(formatted).toContain('**The casting components** are **speech, gesture, and material component**.');
      expect(formatted).toContain('**Casting** this rune requires the caster to devote two rounds of concentration.');
      expect(formatted).not.toMatch(/see below/i);
    });
  });

  describe('Batch Spell Conversion', () => {
    it('should convert multiple spells from batch input', () => {
      const input = `**LIGHT (Int) (Roan ot Mur)**

CT 1   R see below   D 10 min./lvl.   SV none   SR none   Comp S

This rune sheds light that extends up to 20 feet in radius from the inscription. It lasts one turn per level.

**DARKNESS (Int) (Roan ot Unk)**

CT 1   R 100 ft.   D see below   SV none   SR no   Comp S

Darkness extinguishes any normal, natural light source, such as fire, candles, torches, etc., in a 20-foot radius.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(2);
      expect(results[0].originalName).toBe('Light');
      expect(results[1].originalName).toBe('Darkness');
      expect(results[0].warnings).toContain('Missing range');
      expect(results[1].warnings).toContain('Missing duration');
    });

    it('should skip preamble text before first spell', () => {
      const input = `The Runes of the Initiate: These are the Foundation.

**First Spell**

CT 1   R touch   D instant   SV none   SR yes   Comp S

This is the first spell.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].originalName).toBe('First Spell');
    });

    it('should handle multiple spells with varying quality', () => {
      const input = `**Complete Spell**

CT 1   R touch   D instant   SV none   SR yes   Comp S

Full description here.

Full effect details here.

**Incomplete Spell**

CT 1   R touch

Missing lots of data.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(2);
      expect(results[0].warnings).toHaveLength(0);
      expect(results[1].warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should parse statistics when labels are concatenated without spacing', () => {
      const input = `**The Voice**

CT 1   R touch   D1 min.+1min./lvl.   SV none   SR no   Comp S

Voice magic.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].statistics.range).toBe('touch');
      expect(results[0].statistics.duration).toBe('1 minute +1 minute per level');
    });

    it('should normalize chained bonuses with proper spacing and plurals', () => {
      const input = `**Mind's Eye**

CT 1   R 400 ft.+1./lvl.   D 10 rds. +1/lvl.   SV none   SR no   Comp S

Mind sight.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].statistics.range).toBe('400 feet +1 per level');
      expect(results[0].statistics.duration).toBe('10 rounds +1 per level');
    });

    it('should strip erroneous leading digits from "see below" values', () => {
      const input = `**Echo**

CT 1   R see below   D 1 see below   SV none   SR yes   Comp S

Echo senses.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].statistics.duration).toBeUndefined();
      expect(results[0].statistics.range).toBeUndefined();
    });

    it('should handle empty input', () => {
      const results = convertLegacySpellText('');
      expect(results).toHaveLength(0);
    });

    it('should handle input with only whitespace', () => {
      const results = convertLegacySpellText('   \n\n   ');
      expect(results).toHaveLength(0);
    });

    it('should handle malformed heading lines', () => {
      const input = `This is not a proper heading

CT 1   R touch   D instant   SV none   SR yes   Comp S

Description text.`;

      const results = convertLegacySpellText(input);
      // Should skip or handle gracefully
      expect(results).toHaveLength(0);
    });

    it('should preserve metadata from parentheses in heading', () => {
      const input = `**Test Spell (Int) (Special Metadata)**

CT 1   R touch   D instant   SV none   SR yes   Comp S

Description.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].metadata).toBe('Int Special Metadata');
      expect(results[0].formatted).toContain('_Int Special Metadata_');
    });

    it('should handle statistics with unusual spacing', () => {
      const input = `**Spaced Spell**

CT    1			R    150ft.		D   1 rd./lvl.

SV see  below		SR    yes		Comp   S

Description text.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].statistics.castingTime).toBe('1');
      expect(results[0].statistics.range).toBe('150 feet');
      expect(results[0].statistics.savingThrow).toBeUndefined();
    });

    it('should handle multi-paragraph effects', () => {
      const input = `**Multi Effect Spell**

CT 1   R touch   D instant   SV none   SR yes   Comp S

First paragraph description.

Second paragraph effect.

Third paragraph more effect.

Fourth paragraph even more effect.`;

      const results = convertLegacySpellText(input);

      expect(results).toHaveLength(1);
      expect(results[0].description).toBe('First paragraph description.');
      expect(results[0].effect).toContain('Second paragraph effect.');
      expect(results[0].effect).toContain('Third paragraph more effect.');
      expect(results[0].effect).toContain('Fourth paragraph even more effect.');
    });
  });
});
