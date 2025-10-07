import { describe, expect, it } from 'vitest';
import { parseMonsterBlock, parseMonsterBlocks } from './src/lib/monster-parser';
import { formatToMonsterNarrative, buildMonsterValidation } from './src/lib/monster-formatter';
import { processDumpWithValidation } from './src/lib/npc-parser';

const ORC_BLOCK = [
  '**Orc Raider**',
  'HD: 1d8',
  'AC: 13',
  'Move: 30 ft',
  'Attacks: battleaxe +2 (1d8)',
  'Saves: P',
  'Type: Humanoid',
  'Treasure: 1d10 gp',
  'XP: 35',
  'Alignment: Chaotic Evil',
  'Special: Darkvision 60 ft.',
].join('\n');

describe('monster parser', () => {
  it('extracts canonical fields from straightforward stat blocks', () => {
    const parsed = parseMonsterBlock(ORC_BLOCK);

    expect(parsed.name).toBe('Orc Raider');
    expect(parsed.fields['HD']).toBe('1d8');
    expect(parsed.fields['AC']).toBe('13');
    expect(parsed.fields['Move']).toBe('30 ft');
    expect(parsed.fields['Attacks']).toBe('battleaxe +2 (1d8)');
    expect(parsed.fields['Saves']).toBe('P');
    expect(parsed.fields['Type']).toBe('Humanoid');
    expect(parsed.fields['Treasure']).toBe('1d10 gp');
    expect(parsed.fields['XP']).toBe('35');
    expect(parsed.fields['Disposition']).toBe('chaos/evil');
    expect(parsed.fields['ALIGNMENT']).toBe('chaos/evil');
    expect(parsed.fields['Special Abilities']).toBe('Darkvision 60 ft.');
    expect(parsed.notes).toHaveLength(0);
  });

  it('handles inline fields, multi-line specials, and treasure symbols', () => {
    const block = [
      '**Giant Spider**',
      'HD 4d8, AC 15, Move 40 ft. climb 40 ft.',
      'Attacks: bite +5 (1d8) plus venom',
      'Saves: p',
      'Type: Vermin',
      'Treasure: --',
      'XP: 320',
      'Special Abilities: Web trap',
      '  Victims must save vs paralysis or be restrained.',
    ].join('\n');

    const parsed = parseMonsterBlock(block);

    expect(parsed.fields['HD']).toBe('4d8');
    expect(parsed.fields['AC']).toBe('15');
    expect(parsed.fields['Move']).toBe('40 ft. climb 40 ft.');
    expect(parsed.fields['Attacks']).toMatch(/plus venom/i);
    expect(parsed.fields['Saves']).toBe('P');
    expect(parsed.fields['Treasure']).toBe('--');
    expect(parsed.fields['Special Abilities']).toMatch(/web trap/i);
    expect(parsed.fields['Special Abilities']).toMatch(/restrained/);
  });

  it('parses legacy inline uppercase field sequences without delimiters', () => {
    const legacyBlock = [
      'TURTLE, HUGE SNAPPING NO. ENCOUNTERED: 1',
      'SIZE: Large HD: 5 (d8)',
      'MOVE: 3 feet on land, 6 feet swimming AC: 19 shell, 12 head, limbs and tail ATTACKS: Bite (2d4+10)',
      'SPECIAL: Continuing Damage SAVES: P',
      'INT: Animal ALIGNMENT: Neutral TYPE: Animal TREASURE: Nil',
      'XP: 100+5',
    ].join('\n');

    const parsed = parseMonsterBlock(legacyBlock);

    expect(parsed.name).toBe('TURTLE, HUGE SNAPPING NO. ENCOUNTERED: 1');
    expect(parsed.fields['Size']).toBe('Large');
    expect(parsed.fields['HD']).toBe('5 (d8)');
    expect(parsed.fields['Move']).toBe('3 feet on land, 6 feet swimming');
    expect(parsed.fields['AC']).toBe('19 shell, 12 head, limbs and tail');
    expect(parsed.fields['Attacks']).toBe('Bite (2d4+10)');
    expect(parsed.fields['Special Abilities']).toBe('Continuing Damage');
    expect(parsed.fields['Saves']).toBe('P');
    expect(parsed.fields['Intelligence']).toBe('Animal');
    expect(parsed.fields['Disposition']).toBe('neutral');
    expect(parsed.fields['Type']).toBe('Animal');
    expect(parsed.fields['Treasure']).toBe('Nil');
    expect(parsed.fields['XP']).toBe('100+5');
  });

  it('splits multi-block dumps and integrates with formatting + validation', () => {
    const dump = `${ORC_BLOCK}\n\n**Goblin Sentry**\nHD 1d6, AC 14, Move 30 ft\nAttacks: spear +1 (1d6)\nSaves: P\nType: Humanoid\nTreasure: 1d4 gp\nXP: 20\nAlignment: Neutral Evil`;
    const monsters = parseMonsterBlocks(dump);
    expect(monsters).toHaveLength(2);
    expect(monsters[0].name).toBe('Orc Raider');
    expect(monsters[1].fields['Move']).toBe('30 ft');

    const parsed = parseMonsterBlock(ORC_BLOCK);
    const forced = processDumpWithValidation(ORC_BLOCK, false, 'monster')[0];
    const auto = processDumpWithValidation(ORC_BLOCK)[0];
    const narrative = formatToMonsterNarrative(parsed);
    const validation = buildMonsterValidation(parsed);

    expect(forced.converted).toBe(narrative);
    expect(auto.converted).toBe(narrative);
    expect(forced.validation).toEqual(validation);
    expect(auto.validation).toEqual(validation);
  });

  it('correctly parses multiline fields that contain field-like words', () => {
    const block = [
      '**Mind Flayer**',
      'HD 8d8, AC 15, Move 30 ft.',
      'Attacks: 4 tentacles +7 (1d4+2) plus mind blast',
      'Saves: M',
      'Special Abilities: Mind Blast',
      '  The mind flayer can discharge a cone of psychic energy.',
      '  Intelligence of targets is irrelevant to this attack.',
      '  Saves vs. paralysis are required to resist.',
    ].join('\n');

    const parsed = parseMonsterBlock(block);

    expect(parsed.fields['Special Abilities']).toBe(
      'Mind Blast The mind flayer can discharge a cone of psychic energy. Intelligence of targets is irrelevant to this attack. Saves vs. paralysis are required to resist.'
    );
  });
});
