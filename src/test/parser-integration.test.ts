import { describe, it, expect } from 'vitest';
import { applyNameMappings } from '../lib/name-mappings';

describe('Parser Integration Tests', () => {
  it('should correctly transform monster names in a stat block', () => {
    const input = `
Aboleth
Hit Dice: 8
Armor Class: 16
Movement: Swim 60 ft.
Attacks: 4 tentacles
Damage: 1d6 each
Special: Mind control
`;
    const expected = `
Abhorrent
Hit Dice: 8
Armor Class: 16
Movement: Swim 60 ft.
Attacks: 4 tentacles
Damage: 1d6 each
Special: Mind control
`;
    expect(applyNameMappings(input)).toBe(expected);
  });

  it('should correctly transform magic items in text', () => {
    const input = `
The wizard carried a staff of the magi, a ring of protection, and a dagger of venom.
The warrior wore a robe of protection and wielded a frost brand sword.
`;
    const expected = `
The wizard carried a Staff of the Magus, a Ring of Armor, and a Dagger of Envenomation.
The warrior wore a robe of armor and wielded a Frostfire sword.
`;
    expect(applyNameMappings(input)).toBe(expected);
  });

  it('should handle mixed monster and item names correctly', () => {
    const input = `
The giant, hill chieftain was equipped with a bag of holding and a horn of valhalla.
His pet bugbear carried a rod of wonder and wore boots of elvenkind.
`;
    const expected = `
The Giant, Hill chieftain was equipped with a Dimensional Pouch and a Horn of Valhalla.
His pet Bugbear carried a Rod of Chaos and wore Boots of the Elves.
`;
    expect(applyNameMappings(input)).toBe(expected);
  });
});