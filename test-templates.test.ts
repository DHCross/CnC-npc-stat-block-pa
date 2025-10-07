import { describe, it, expect } from 'vitest';
import { buildCanonicalParenthetical } from './src/lib/enhanced-parser';

describe('Template Format Verification', () => {
  it('Template 1: Non-classed NPC/creature', () => {
    // Template: These [races'] vital stats are Level 1d#, HP #, AC #, disposition [disposition].
    // Their primary attributes are [attr1], [attr2], and [attr3]. They wear [armor] and carry [weapons], [shields], and [treasure].

    const data = {
      level: '1d8',
      hp: '18',
      ac: '14',
      disposition: 'chaos/evil',
      raceClass: 'goblin marauders',
      attributes: 'dex 14, con 11, str 10',
      equipment: 'leather armor, short swords, medium steel shields, 5gp',
      raw: 'original'
    };

    const result = buildCanonicalParenthetical(data, true, false, false);
    console.log('\n=== Template 1: Non-classed NPC/creature ===');
    console.log(result);
    console.log('');

    expect(result).toContain('Their primary attributes are');
    expect(result).toMatch(/vital stats are .+\.\s+Their primary attributes/);
  });

  it('Template 2: Individual Classed NPC', () => {
    // Template: [Name], [class] *(This [level] level [race] [class]'s vital stats are HP [HP], AC [AC], disposition [disposition].
    // [Pronoun] primary attributes are [attr1], [attr2], and [attr3]. [Pronoun] significant attributes are [attr] [score]...
    // [Pronoun] wears [armor] and carries [shields], [weapons], and [treasure]. [Pronoun] is mounted on a [mount] and is skilled at [skill].)*

    const data = {
      hp: '24',
      ac: '16',
      disposition: 'law/good',
      raceClass: 'human, 4th level fighter',
      level: '4',
      attributes: 'strength 16, dexterity 12, constitution 14',
      significantAttributes: 'strength 16, constitution 14, charisma 10',
      equipment: 'plate mail, medium steel shield, longsword, dagger, 20gp',
      secondarySkills: 'tracking',
      raw: 'original'
    };

    const result = buildCanonicalParenthetical(data, false, false, false);
    console.log('=== Template 2: Individual Classed NPC ===');
    console.log(result);
    console.log('');

    expect(result).toContain('His primary attributes are');
    expect(result).toContain('He carries');
  });

  it('Template 3: Unit of Classed NPCs', () => {
    // Template: [Unit Name] x[Quantity] (*These [level] level [race] [class]s' vital stats are HP [HP], AC [AC], disposition [disposition].
    // Their primary attributes are [attr1], [attr2], and [attr3]. They wear [armor] and carry [shields], [weapons], and [treasure].*)

    const data = {
      hp: '12',
      ac: '15',
      disposition: 'neutral',
      raceClass: 'human, 2nd level fighters',
      level: '2',
      attributes: 'PA physical',
      equipment: 'chain mail, medium steel shields, longswords, 10gp',
      raw: 'original'
    };

    const result = buildCanonicalParenthetical(data, true, false, false);
    console.log('=== Template 3: Unit of Classed NPCs ===');
    console.log(result);
    console.log('');

    expect(result).toContain('Their primary attributes are');
    expect(result).toContain('They wear');
  });

  it('Template 4: Classed NPC with Spells', () => {
    // Template: [Name] (*This [level] level [race] [class]'s vital stats are HP [HP], AC [AC], disposition [disposition].
    // [Pronoun] primary attributes are [attr1], [attr2], and [attr3]. [Pronoun] secondary skill is [skill].
    // [Pronoun] significant attributes are [attr] [score], [attr] [score]... [Pronoun] wears [armor] and carries a [magic item 1] ([charges] charges), and a [magic item 2].
    // [Pronoun] can cast the following number of [spell type] spells per day: [level 0]–[quantity], [level 1]–[quantity]...
    // [Pronoun] carries [gold in coin] gold in coin and [gold in jewelry] gold worth of jewelry.*)

    const data = {
      hp: '35',
      ac: '18',
      disposition: 'law/good',
      raceClass: 'human, 7th level cleric',
      level: '7',
      attributes: 'wisdom 17, charisma 14, constitution 13',
      secondarySkills: 'herbalism',
      significantAttributes: 'wisdom 17, charisma 14, constitution 13, intelligence 10, strength 9',
      equipment: 'plate mail, staff of striking, mace',
      spells: 'cleric spells per day: 0–4, 1–5, 2–4, 3–3, 4–1',
      coins: '50gp',
      jewelry: '100 gold worth of jewelry',
      raw: 'original'
    };

    const result = buildCanonicalParenthetical(data, false, false, false);
    console.log('=== Template 4: Classed NPC with Spells ===');
    console.log(result);
    console.log('');

    expect(result).toContain('His primary attributes are');
    expect(result).toContain('He can cast the following number of');
    expect(result).toContain('His secondary skill is');
  });
});
