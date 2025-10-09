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
      expect(results[0].originalName).toBe('Arrest Motion');
      expect(results[0].canonicalName).toBe('Arrest Motion');
      expect(results[0].metadata).toBe('Chr Roan ot Kepulch');
      expect(results[0].statistics.castingTime).toBe('1');
      expect(results[0].statistics.range).toBe('150 feet');
  expect(results[0].statistics.duration).toBe('1 round per level');
      expect(results[0].statistics.savingThrow).toBe('see below');
      expect(results[0].statistics.spellResistance).toBe('yes');
      expect(results[0].statistics.components).toBe('S');
      expect(results[0].description).toContain('stops objects in motion');
      expect(results[0].effect).toContain('held exactly as they are');
      expect(results[0].warnings).toHaveLength(0);
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
      expect(formatted).toContain('**Light**, Reforged Spell');
      expect(formatted).toContain('*Description:* This rune sheds light.');
      expect(formatted).toContain('*Effect:* The light extends up to 20 feet in radius.');
      expect(formatted).toContain('Statistics:');
      expect(formatted).toContain('- Casting Time: 1');
      expect(formatted).toContain('- Range: see below');
      expect(formatted).toContain('- Duration: 10 minutes per level');
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
      expect(results[0].warnings).toHaveLength(0);
      expect(results[1].warnings).toHaveLength(0);
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
      expect(results[0].statistics.duration).toBe('see below');
      expect(results[0].statistics.range).toBe('see below');
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
      expect(results[0].statistics.savingThrow).toBe('see below');
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
