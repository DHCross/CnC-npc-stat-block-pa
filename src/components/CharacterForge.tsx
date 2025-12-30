"use client";

import React, { useState, useReducer, useEffect } from 'react';
import { normalizeDisposition, validateDispositionForClass } from '@/lib/stat-block-helpers';
import { 
  Shield, Scroll, Backpack, 
  RefreshCw, Calculator,
  Hammer, User, Copy, Check, BookOpen,
  ChevronUp, ChevronDown, Package, FileText, PenTool, Layout,
  Gem, Save, Upload, Trash2
} from 'lucide-react';

// --- THE REFORGED LEXICON & RULES ---

interface RaceMod {
  STR?: number;
  DEX?: number;
  CON?: number;
  INT?: number;
  WIS?: number;
  CHA?: number;
}

interface Race {
  id: string;
  name: string;
  desc: string;
  mods: RaceMod;
  traits: string[];
  baseSpeed: number;
}

interface CharClass {
  id: string;
  name: string;
  hd: number;
  reqPrime: string[];
  desc: string;
  abilities: string[];
  spells?: boolean;
  bthMod: number;
}

interface Spell {
  name: string;
  level: number;
  type: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'gear';
  cost: number;
  ev: number;
  dmg?: string;
  ac?: number;
  cat: string;
  desc?: string;
}

interface ClassKit {
  name: string;
  items: string[];
  cost: number;
}

const RULES = {
  attributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const,
  
  getMod: (score: number): number => {
    if (score >= 18) return 3;
    if (score >= 16) return 2;
    if (score >= 13) return 1;
    if (score >= 9) return 0;
    if (score >= 6) return -1;
    if (score >= 4) return -2;
    if (score >= 2) return -3;
    return -4;
  },

  races: [
    { id: 'human', name: 'Human', desc: 'The most adaptable of all races.', mods: {}, traits: ['Extra Prime Attribute', 'Quick Learner'], baseSpeed: 30 },
    { id: 'dwarf', name: 'Dwarf', desc: 'Stout, hardy, and stubborn.', mods: { CON: 1, CHA: -1 }, traits: ['Darkvision', 'Stonecraft', 'Resistant to Arcane'], baseSpeed: 20 },
    { id: 'elf', name: 'Elf', desc: 'Long-lived and magical.', mods: { DEX: 1, CON: -1 }, traits: ['Twilight Vision', 'Move Silently', 'Immune to Ghoul Paralysis'], baseSpeed: 30 },
    { id: 'halfling', name: 'Halfling', desc: 'Small, nimble, and lucky.', mods: { DEX: 1, STR: -1 }, traits: ['Hide', 'Move Silently', 'Fearless'], baseSpeed: 20 },
    { id: 'gnome', name: 'Gnome', desc: 'Inventive and illusion-prone.', mods: { INT: 1, WIS: -1 }, traits: ['Darkvision', 'Illusion Resistance', 'Listen'], baseSpeed: 20 },
    { id: 'half-orc', name: 'Half-Orc', desc: 'Strong and fierce lineage.', mods: { STR: 1, CHA: -1 }, traits: ['Darkvision', 'Intimidate'], baseSpeed: 30 },
    { id: 'half-elf', name: 'Half-Elf', desc: 'Walking two worlds.', mods: {}, traits: ['Twilight Vision', 'Empathy'], baseSpeed: 30 }
  ] as Race[],

  classes: [
    { id: 'fighter', name: 'Fighter', hd: 10, reqPrime: ['STR'], desc: 'Masters of weapons and warfare.', abilities: ['Weapon Specialization', 'Combat Dominance'], bthMod: 1 },
    { id: 'ranger', name: 'Ranger', hd: 10, reqPrime: ['STR'], desc: 'Guardians of the wild places.', abilities: ['Combat Marauder', 'Conceal', 'Track'], bthMod: 1 },
    { id: 'rogue', name: 'Rogue', hd: 6, reqPrime: ['DEX'], desc: 'Skilled tricksters and scouts.', abilities: ['Back Attack', 'Cant', 'Traps', 'Sneak'], bthMod: 0.5 },
    { id: 'wizard', name: 'Wizard', hd: 4, reqPrime: ['INT'], desc: 'Wielders of arcane magic.', abilities: ['Spellcasting (Arcane)', 'Familiar'], spells: true, bthMod: 0.33 },
    { id: 'cleric', name: 'Cleric', hd: 8, reqPrime: ['WIS'], desc: 'Divine servants of the gods.', abilities: ['Spellcasting (Divine)', 'Turn Undead'], spells: true, bthMod: 0.75 },
    { id: 'bard', name: 'Bard', hd: 6, reqPrime: ['CHA'], desc: 'Chroniclers and inspirers.', abilities: ['Fascinate', 'Exalt', 'Exhort Greatness', 'Decipher Script'], bthMod: 0.5 },
    { id: 'druid', name: 'Druid', hd: 8, reqPrime: ['WIS'], desc: 'Servants of nature and the old ways.', abilities: ['Nature Lore', 'Resist Elements', 'Woodland Stride'], spells: true, bthMod: 0.75 },
    { id: 'illusionist', name: 'Illusionist', hd: 4, reqPrime: ['INT'], desc: 'Masters of shadow and deception.', abilities: ['Spellcasting (Arcane)', 'Disguise', 'Detect Illusion'], spells: true, bthMod: 0.33 },
    { id: 'paladin', name: 'Paladin', hd: 10, reqPrime: ['STR', 'CHA'], desc: 'Holy warriors of law and good.', abilities: ['Lay on Hands', 'Divine Aura', 'Cure Disease'], bthMod: 1 },
    { id: 'knight', name: 'Knight', hd: 10, reqPrime: ['STR', 'CHA'], desc: 'Nobles sworn to a liege or cause.', abilities: ['Birthright Mount', 'Horsemanship', 'Inspire'], bthMod: 1 },
    { id: 'assassin', name: 'Assassin', hd: 6, reqPrime: ['DEX'], desc: 'Masters of stealth and death.', abilities: ['Death Attack', 'Sneak Attack', 'Disguise', 'Poisons'], bthMod: 0.5 },
    { id: 'barbarian', name: 'Barbarian', hd: 12, reqPrime: ['CON'], desc: 'Fierce warriors from untamed lands.', abilities: ['Combat Sense', 'Deerstalker', 'Intimidate', 'Whirlwind Attack'], bthMod: 1 },
    { id: 'monk', name: 'Monk', hd: 12, reqPrime: ['CON'], desc: 'Martial artists of mind and body.', abilities: ['Stun Attack', 'Deflect Missiles', 'Iron Body', 'Fast Movement'], bthMod: 1 }
  ] as CharClass[],

  startingGold: {
    fighter: '3d8x10', ranger: '3d8x10', knight: '6d4x10', paladin: '6d4x10',
    rogue: '3d4x10', assassin: '3d4x10', bard: '3d4x10',
    barbarian: '2d4x10', monk: '2d4x10',
    wizard: '1d10x10', illusionist: '1d10x10',
    cleric: '2d10x10', druid: '2d10x10'
  } as Record<string, string>,

  armorRestrictions: {
    fighter: 'Any', ranger: 'Any', knight: 'Any', paladin: 'Any', barbarian: 'Any',
    cleric: 'Any', druid: 'Leather, padded, hide, cuir bouille',
    rogue: 'Leather, leather coat, padded', assassin: 'Leather, leather coat, padded',
    bard: 'Chain shirt, ring mail, studded leather, leather, padded',
    wizard: 'None', illusionist: 'None', monk: 'None'
  } as Record<string, string>,

  spellSlots: {
    cleric: [
      [3,1,0,0,0,0,0,0,0,0], [4,2,0,0,0,0,0,0,0,0], [4,2,1,0,0,0,0,0,0,0],
      [4,3,2,0,0,0,0,0,0,0], [4,3,2,1,0,0,0,0,0,0]
    ],
    druid: [
      [3,1,0,0,0,0,0,0,0,0], [4,2,0,0,0,0,0,0,0,0], [4,2,1,0,0,0,0,0,0,0],
      [4,3,2,0,0,0,0,0,0,0], [4,3,2,1,0,0,0,0,0,0]
    ],
    wizard: [
      [4,2,0,0,0,0,0,0,0,0], [4,3,0,0,0,0,0,0,0,0], [4,3,1,0,0,0,0,0,0,0],
      [4,3,2,0,0,0,0,0,0,0], [5,4,2,1,0,0,0,0,0,0]
    ],
    illusionist: [
      [4,2,0,0,0,0,0,0,0,0], [4,3,0,0,0,0,0,0,0,0], [4,3,1,0,0,0,0,0,0,0],
      [4,3,2,0,0,0,0,0,0,0], [5,4,2,1,0,0,0,0,0,0]
    ]
  } as Record<string, number[][]>,

  deities: [
    { name: 'Burol', domains: ['Stone', 'Mountains'], weapon: 'Club' },
    { name: 'Corthain', domains: ['Law', 'Good', 'Wind'], weapon: 'Spear, Sword' },
    { name: 'Daladon Lothian', domains: ['Forests', 'Wilderness'], weapon: 'Two-handed sword, battle axe' },
    { name: 'Ealor', domains: ['Oceans', 'Seas'], weapon: 'Trident' },
    { name: 'Ea Raena', domains: ['Night Hunt'], weapon: 'Bow and Arrows' },
    { name: 'Ea Vette', domains: ['Seasons', 'Sun'], weapon: 'Javelin' },
    { name: 'Frafnog', domains: ['Knowledge', 'Fire'], weapon: 'None' },
    { name: 'Hroth', domains: ['Earth', 'Soil'], weapon: 'Mace, Club, Flail' },
    { name: 'Toth', domains: ['Death', 'Knowledge'], weapon: 'Khopesh, Spear' },
    { name: 'Unklar', domains: ['Darkness', 'Winter'], weapon: 'Sword, Flail, Mace' },
    { name: 'Wenafar', domains: ['Stars', 'Fey', 'Animals'], weapon: 'Staff' }
  ] as { name: string; domains: string[]; weapon: string }[],

  spells: [
    // WIZARD SPELLS (Arcane)
    // Level 0
    { name: 'Arcane Rune', level: 0, type: 'Wizard' },
    { name: 'Dancing Orbs', level: 0, type: 'Wizard' },
    { name: 'Discern Magic', level: 0, type: 'Wizard' },
    { name: 'Discover Poison', level: 0, type: 'Wizard' },
    { name: 'Endure Cold/Heat', level: 0, type: 'Wizard' },
    { name: 'Ghostly Noise', level: 0, type: 'Wizard' },
    { name: 'Light', level: 0, type: 'Wizard' },
    { name: "Magi's Reach", level: 0, type: 'Wizard' },
    { name: 'Mending', level: 0, type: 'Wizard' },
    { name: 'Message', level: 0, type: 'Wizard' },
    { name: 'Open/Close', level: 0, type: 'Wizard' },
    { name: 'Prestidigitation', level: 0, type: 'Wizard' },
    // Level 1
    { name: "Alter One's Person Lesser", level: 1, type: 'Wizard' },
    { name: 'Alter Size', level: 1, type: 'Wizard' },
    { name: 'Arcane Armor', level: 1, type: 'Wizard' },
    { name: 'Burning Flames', level: 1, type: 'Wizard' },
    { name: 'Charm Humanoid', level: 1, type: 'Wizard' },
    { name: 'Comprehension', level: 1, type: 'Wizard' },
    { name: 'Erase', level: 1, type: 'Wizard' },
    { name: 'Feather Light', level: 1, type: 'Wizard' },
    { name: 'Flying Saucer', level: 1, type: 'Wizard' },
    { name: 'Hold Bar & Gate', level: 1, type: 'Wizard' },
    { name: 'Identify', level: 1, type: 'Wizard' },
    { name: 'Jump', level: 1, type: 'Wizard' },
    { name: "Magi's Missile", level: 1, type: 'Wizard' },
    { name: 'Protection from Disposition', level: 1, type: 'Wizard' },
    { name: 'Read Arcane Script', level: 1, type: 'Wizard' },
    { name: 'Shield', level: 1, type: 'Wizard' },
    { name: 'Shock', level: 1, type: 'Wizard' },
    { name: 'Sleep', level: 1, type: 'Wizard' },
    { name: 'Spider Walk', level: 1, type: 'Wizard' },
    { name: 'Summon Familiar', level: 1, type: 'Wizard' },
    { name: 'Unseen ID', level: 1, type: 'Wizard' },
    // Level 2
    { name: 'Acidic Bolt', level: 2, type: 'Wizard' },
    { name: 'Continual Fire', level: 2, type: 'Wizard' },
    { name: 'Darkness', level: 2, type: 'Wizard' },
    { name: 'Discern Thoughts', level: 2, type: 'Wizard' },
    { name: 'Enhance an Attribute', level: 2, type: 'Wizard' },
    { name: 'Fog', level: 2, type: 'Wizard' },
    { name: 'Invisibility', level: 2, type: 'Wizard' },
    { name: 'Knock', level: 2, type: 'Wizard' },
    { name: 'Levitate', level: 2, type: 'Wizard' },
    { name: 'Locate Item', level: 2, type: 'Wizard' },
    { name: "Magi's Visage", level: 2, type: 'Wizard' },
    { name: 'Mirrored Self', level: 2, type: 'Wizard' },
    { name: 'Protection from Normal Missiles', level: 2, type: 'Wizard' },
    { name: 'Pyrotechnics', level: 2, type: 'Wizard' },
    { name: 'Ray of Weakening', level: 2, type: 'Wizard' },
    { name: 'Rope Dimension', level: 2, type: 'Wizard' },
    { name: 'Scare', level: 2, type: 'Wizard' },
    { name: 'See Invisible', level: 2, type: 'Wizard' },
    { name: 'Shatter', level: 2, type: 'Wizard' },
    { name: 'Web', level: 2, type: 'Wizard' },
    // Level 3
    { name: 'Blink', level: 3, type: 'Wizard' },
    { name: 'Clairaudience/Clairvoyance', level: 3, type: 'Wizard' },
    { name: 'Dispel Magic', level: 3, type: 'Wizard' },
    { name: 'Explosive Mark', level: 3, type: 'Wizard' },
    { name: 'Fireball', level: 3, type: 'Wizard' },
    { name: 'Fly', level: 3, type: 'Wizard' },
    { name: 'Gas Form', level: 3, type: 'Wizard' },
    { name: 'Gust', level: 3, type: 'Wizard' },
    { name: 'Haste', level: 3, type: 'Wizard' },
    { name: 'Hold Humanoid', level: 3, type: 'Wizard' },
    { name: 'Invisibility Orb', level: 3, type: 'Wizard' },
    { name: 'Lightning', level: 3, type: 'Wizard' },
    { name: 'Magic Circle', level: 3, type: 'Wizard' },
    { name: 'Nondetection', level: 3, type: 'Wizard' },
    { name: 'Stench', level: 3, type: 'Wizard' },
    { name: 'Suggestion', level: 3, type: 'Wizard' },
    { name: 'Summon Monstrous Ally', level: 3, type: 'Wizard' },
    { name: 'Tiny Realm', level: 3, type: 'Wizard' },
    { name: 'Tongues', level: 3, type: 'Wizard' },
    { name: 'Water Breathing', level: 3, type: 'Wizard' },
    // Level 4
    { name: 'Arcane Vision', level: 4, type: 'Wizard' },
    { name: 'Charm Monster', level: 4, type: 'Wizard' },
    { name: 'Confusion', level: 4, type: 'Wizard' },
    { name: 'Dimensional Leap', level: 4, type: 'Wizard' },
    { name: 'Discern Scrying', level: 4, type: 'Wizard' },
    { name: 'Fear', level: 4, type: 'Wizard' },
    { name: 'Flame Shield', level: 4, type: 'Wizard' },
    { name: 'Flame Snare', level: 4, type: 'Wizard' },
    { name: 'Hallucinatory Ground', level: 4, type: 'Wizard' },
    { name: 'Ice Storm', level: 4, type: 'Wizard' },
    { name: 'Locate Other', level: 4, type: 'Wizard' },
    { name: 'Minor Globe of Spell Protection', level: 4, type: 'Wizard' },
    { name: 'Mnemonic Enhancement', level: 4, type: 'Wizard' },
    { name: 'Polymorph Creature', level: 4, type: 'Wizard' },
    { name: 'Remove Bane', level: 4, type: 'Wizard' },
    { name: 'Resilient Globe', level: 4, type: 'Wizard' },
    { name: 'Scrying', level: 4, type: 'Wizard' },
    { name: 'Shout', level: 4, type: 'Wizard' },
    { name: 'Wall of Elemental Fire', level: 4, type: 'Wizard' },
    { name: 'Wall of Elemental Ice', level: 4, type: 'Wizard' },
    // Level 5
    { name: 'Animate Corpse', level: 5, type: 'Wizard' },
    { name: 'Bind Elemental', level: 5, type: 'Wizard' },
    { name: 'Cloud of Pestilence', level: 5, type: 'Wizard' },
    { name: "Cone of Winter's Blast", level: 5, type: 'Wizard' },
    { name: 'Contact Other Worlds', level: 5, type: 'Wizard' },
    { name: 'Faithful Watch Dog', level: 5, type: 'Wizard' },
    { name: 'Feeblemind', level: 5, type: 'Wizard' },
    { name: 'Hold Creature', level: 5, type: 'Wizard' },
    { name: "Magi's Vessel", level: 5, type: 'Wizard' },
    { name: 'Passage', level: 5, type: 'Wizard' },
    { name: 'Permanency', level: 5, type: 'Wizard' },
    { name: 'Secret Container', level: 5, type: 'Wizard' },
    { name: 'Telekinesis', level: 5, type: 'Wizard' },
    { name: 'Telepathy', level: 5, type: 'Wizard' },
    { name: 'Teleportation', level: 5, type: 'Wizard' },
    { name: 'Transform Soft Soil to Stone', level: 5, type: 'Wizard' },
    { name: 'Wall of Elemental Earth', level: 5, type: 'Wizard' },
    { name: 'Wall of Resilient Alloy', level: 5, type: 'Wizard' },
    { name: 'Wall of Will', level: 5, type: 'Wizard' },
    // Level 6
    { name: 'Anti-Magic Sphere', level: 6, type: 'Wizard' },
    { name: 'Chain Lightning', level: 6, type: 'Wizard' },
    { name: 'Control Atmosphere', level: 6, type: 'Wizard' },
    { name: 'Disintegrate', level: 6, type: 'Wizard' },
    { name: 'Geas', level: 6, type: 'Wizard' },
    { name: 'Globe of Spell Protection', level: 6, type: 'Wizard' },
    { name: 'Guard with Wards', level: 6, type: 'Wizard' },
    { name: 'Harrow the Earth', level: 6, type: 'Wizard' },
    { name: 'Legendary Tales', level: 6, type: 'Wizard' },
    { name: 'Projection', level: 6, type: 'Wizard' },
    { name: 'Suggestion in Area', level: 6, type: 'Wizard' },
    { name: 'Transform Flesh to Stone', level: 6, type: 'Wizard' },
    // Level 7
    { name: 'Delayed Fireball', level: 7, type: 'Wizard' },
    { name: 'Fatal Gesture', level: 7, type: 'Wizard' },
    { name: 'Instant Item', level: 7, type: 'Wizard' },
    { name: 'Invisibility in Area', level: 7, type: 'Wizard' },
    { name: 'Phase Through Obstruction', level: 7, type: 'Wizard' },
    { name: 'Power of Spoken Word: Immobilize', level: 7, type: 'Wizard' },
    { name: 'Sequester', level: 7, type: 'Wizard' },
    { name: 'Teleport Accurately', level: 7, type: 'Wizard' },
    { name: 'Vanish', level: 7, type: 'Wizard' },
    { name: 'Wish (Minor)', level: 7, type: 'Wizard' },
    // Level 8
    { name: 'Antipathy', level: 8, type: 'Wizard' },
    { name: 'Bind', level: 8, type: 'Wizard' },
    { name: 'Charm Area', level: 8, type: 'Wizard' },
    { name: 'Clone', level: 8, type: 'Wizard' },
    { name: 'Incendiary Flow', level: 8, type: 'Wizard' },
    { name: 'Maze', level: 8, type: 'Wizard' },
    { name: 'Mind Ward', level: 8, type: 'Wizard' },
    { name: 'Polymorph Creature and Things', level: 8, type: 'Wizard' },
    { name: 'Power of the Spoken Word: Purblind', level: 8, type: 'Wizard' },
    { name: 'Symbol', level: 8, type: 'Wizard' },
    { name: 'Teleportation Field', level: 8, type: 'Wizard' },
    { name: 'Trap Entity', level: 8, type: 'Wizard' },
    // Level 9
    { name: 'Astral Travel', level: 9, type: 'Wizard' },
    { name: 'Disjunction', level: 9, type: 'Wizard' },
    { name: 'Gate', level: 9, type: 'Wizard' },
    { name: 'Imprison', level: 9, type: 'Wizard' },
    { name: 'Meteor Shower', level: 9, type: 'Wizard' },
    { name: 'Polychromatic Sphere', level: 9, type: 'Wizard' },
    { name: 'Power of the Spoken Word: Slay', level: 9, type: 'Wizard' },
    { name: 'Refuge', level: 9, type: 'Wizard' },
    { name: 'Shapeshift', level: 9, type: 'Wizard' },
    { name: 'Temporal Inertia', level: 9, type: 'Wizard' },
    { name: 'Time Control', level: 9, type: 'Wizard' },
    { name: 'Wish', level: 9, type: 'Wizard' },

    // CLERIC SPELLS (Divine)
    // Level 0
    { name: 'Create Water', level: 0, type: 'Cleric' },
    { name: 'Detect Disposition', level: 0, type: 'Cleric' },
    { name: 'Discern Magic', level: 0, type: 'Cleric' },
    { name: 'Discover Poison', level: 0, type: 'Cleric' },
    { name: 'Endure Cold/Heat', level: 0, type: 'Cleric' },
    { name: 'First Aid', level: 0, type: 'Cleric' },
    { name: 'Light', level: 0, type: 'Cleric' },
    { name: 'Purify', level: 0, type: 'Cleric' },
    // Level 1
    { name: 'Bless', level: 1, type: 'Cleric' },
    { name: 'Blessing Water', level: 1, type: 'Cleric' },
    { name: 'Command', level: 1, type: 'Cleric' },
    { name: 'Discover Secret Doors', level: 1, type: 'Cleric' },
    { name: 'Discover Undead', level: 1, type: 'Cleric' },
    { name: 'Heal Light Wounds', level: 1, type: 'Cleric' },
    { name: 'Invisible Cloak of the Undead', level: 1, type: 'Cleric' },
    { name: 'Protection from Disposition', level: 1, type: 'Cleric' },
    { name: 'Remove Despair', level: 1, type: 'Cleric' },
    { name: 'Resist One Element', level: 1, type: 'Cleric' },
    { name: 'Sanctuary', level: 1, type: 'Cleric' },
    { name: 'Shield of the Divine', level: 1, type: 'Cleric' },
    { name: 'Sound Storm', level: 1, type: 'Cleric' },
    // Level 2
    { name: 'Aid', level: 2, type: 'Cleric' },
    { name: 'Augury', level: 2, type: 'Cleric' },
    { name: 'Consecrate', level: 2, type: 'Cleric' },
    { name: 'Darkness', level: 2, type: 'Cleric' },
    { name: 'Delay Toxin', level: 2, type: 'Cleric' },
    { name: 'Discover Traps', level: 2, type: 'Cleric' },
    { name: 'Hold Humanoid', level: 2, type: 'Cleric' },
    { name: 'Restoration', level: 2, type: 'Cleric' },
    { name: 'Restore Movement', level: 2, type: 'Cleric' },
    { name: 'Silence', level: 2, type: 'Cleric' },
    { name: 'Speak with the Dead', level: 2, type: 'Cleric' },
    { name: 'Spiritual Warrior', level: 2, type: 'Cleric' },
    // Level 3
    { name: 'Animate Corpse', level: 3, type: 'Cleric' },
    { name: 'Continual Fire', level: 3, type: 'Cleric' },
    { name: 'Create Sustenance', level: 3, type: 'Cleric' },
    { name: 'Dispel Magic', level: 3, type: 'Cleric' },
    { name: 'Glyphs', level: 3, type: 'Cleric' },
    { name: 'Heal Serious Wounds', level: 3, type: 'Cleric' },
    { name: 'Locate Item', level: 3, type: 'Cleric' },
    { name: 'Magic Circle', level: 3, type: 'Cleric' },
    { name: 'Prayer', level: 3, type: 'Cleric' },
    { name: 'Remove Bane', level: 3, type: 'Cleric' },
    { name: 'Remove Malady', level: 3, type: 'Cleric' },
    { name: 'Restore Sight and Hearing', level: 3, type: 'Cleric' },
    // Level 4
    { name: 'Air/Water Stride', level: 4, type: 'Cleric' },
    { name: 'Control Liquids', level: 4, type: 'Cleric' },
    { name: 'Discern Falsehood', level: 4, type: 'Cleric' },
    { name: 'Dismissal', level: 4, type: 'Cleric' },
    { name: 'Divination', level: 4, type: 'Cleric' },
    { name: 'Free Motion', level: 4, type: 'Cleric' },
    { name: 'Hallow', level: 4, type: 'Cleric' },
    { name: 'Healing Sphere', level: 4, type: 'Cleric' },
    { name: 'Neutralize Toxins', level: 4, type: 'Cleric' },
    { name: 'Restoration (Greater)', level: 4, type: 'Cleric' },
    { name: 'Send', level: 4, type: 'Cleric' },
    { name: 'Tongues', level: 4, type: 'Cleric' },
    // Level 5
    { name: 'Atonement', level: 5, type: 'Cleric' },
    { name: 'Commune', level: 5, type: 'Cleric' },
    { name: 'Death Mask', level: 5, type: 'Cleric' },
    { name: 'Dispel Disposition', level: 5, type: 'Cleric' },
    { name: 'Ethereal Jump', level: 5, type: 'Cleric' },
    { name: 'Flame of the Divine', level: 5, type: 'Cleric' },
    { name: 'Heal Critical Wounds', level: 5, type: 'Cleric' },
    { name: 'Insect Swarm', level: 5, type: 'Cleric' },
    { name: 'Planar Travel', level: 5, type: 'Cleric' },
    { name: 'Raise', level: 5, type: 'Cleric' },
    { name: 'Scrying', level: 5, type: 'Cleric' },
    { name: 'Truth Revealed', level: 5, type: 'Cleric' },
    // Level 6
    { name: 'Banishment', level: 6, type: 'Cleric' },
    { name: 'Blade Blockade', level: 6, type: 'Cleric' },
    { name: 'Create Common/Extraordinary Undead', level: 6, type: 'Cleric' },
    { name: 'Finding Trails', level: 6, type: 'Cleric' },
    { name: 'Geas', level: 6, type: 'Cleric' },
    { name: 'Heal', level: 6, type: 'Cleric' },
    { name: 'Wind Travel', level: 6, type: 'Cleric' },
    { name: 'Word of Sanctuary', level: 6, type: 'Cleric' },
    // Level 7
    { name: 'Control Atmosphere', level: 7, type: 'Cleric' },
    { name: 'Holy Utterance', level: 7, type: 'Cleric' },
    { name: 'Refuge', level: 7, type: 'Cleric' },
    { name: 'Regenerate', level: 7, type: 'Cleric' },
    { name: 'Repulsion', level: 7, type: 'Cleric' },
    { name: 'Restoration (True)', level: 7, type: 'Cleric' },
    { name: 'Resurrection', level: 7, type: 'Cleric' },
    { name: 'Scrying (Greater)', level: 7, type: 'Cleric' },
    // Level 8
    { name: 'Create Unique Undead', level: 8, type: 'Cleric' },
    { name: 'Discover Location', level: 8, type: 'Cleric' },
    { name: 'Earthquake', level: 8, type: 'Cleric' },
    { name: 'Flaming Tempest', level: 8, type: 'Cleric' },
    { name: 'Heal in Area', level: 8, type: 'Cleric' },
    { name: 'Holy Glamour', level: 8, type: 'Cleric' },
    { name: 'Summon Extraplanar Ally', level: 8, type: 'Cleric' },
    { name: 'Symbol', level: 8, type: 'Cleric' },
    // Level 9
    { name: 'Antipathy', level: 9, type: 'Cleric' },
    { name: 'Astral Travel', level: 9, type: 'Cleric' },
    { name: 'Energy Level Drain', level: 9, type: 'Cleric' },
    { name: 'Gate', level: 9, type: 'Cleric' },
    { name: 'Mind Ward', level: 9, type: 'Cleric' },
    { name: 'Resurrection Without Error', level: 9, type: 'Cleric' },
    { name: 'Soul to Gem', level: 9, type: 'Cleric' },
    { name: 'Trap Entity', level: 9, type: 'Cleric' },

    // DRUID SPELLS (Divine)
    // Level 0
    { name: 'Create Water', level: 0, type: 'Druid' },
    { name: 'Detect Disposition', level: 0, type: 'Druid' },
    { name: 'Discover Poison', level: 0, type: 'Druid' },
    { name: 'Endure Cold/Heat', level: 0, type: 'Druid' },
    { name: 'First Aid', level: 0, type: 'Druid' },
    { name: 'Know the Path', level: 0, type: 'Druid' },
    { name: 'Light', level: 0, type: 'Druid' },
    { name: 'Purify', level: 0, type: 'Druid' },
    // Level 1
    { name: 'Alarm', level: 1, type: 'Druid' },
    { name: 'Animal Bond', level: 1, type: 'Druid' },
    { name: 'Calm Animals', level: 1, type: 'Druid' },
    { name: 'Discover Snares and Pits', level: 1, type: 'Druid' },
    { name: 'Entangling Vegetation', level: 1, type: 'Druid' },
    { name: 'Faerie Aura', level: 1, type: 'Druid' },
    { name: 'Good Fruit', level: 1, type: 'Druid' },
    { name: 'Invisibility to Animals', level: 1, type: 'Druid' },
    { name: 'Magic Sling', level: 1, type: 'Druid' },
    { name: 'Obscure with Mist', level: 1, type: 'Druid' },
    { name: 'Pass with Woodland Stride', level: 1, type: 'Druid' },
    { name: 'Shillelagh', level: 1, type: 'Druid' },
    // Level 2
    { name: 'Animal Courier', level: 2, type: 'Druid' },
    { name: 'Barkform', level: 2, type: 'Druid' },
    { name: 'Charm Humanoid or Animal', level: 2, type: 'Druid' },
    { name: 'Darkness', level: 2, type: 'Druid' },
    { name: 'Delay Toxin', level: 2, type: 'Druid' },
    { name: 'Discover Traps', level: 2, type: 'Druid' },
    { name: 'Flame Snare', level: 2, type: 'Druid' },
    { name: 'Gust', level: 2, type: 'Druid' },
    { name: 'Heal Light Wounds', level: 2, type: 'Druid' },
    { name: 'Heat Any Alloy', level: 2, type: 'Druid' },
    { name: 'Hold Animals & Plants', level: 2, type: 'Druid' },
    { name: 'Produce Fire', level: 2, type: 'Druid' },
    { name: 'Speak with Animals', level: 2, type: 'Druid' },
    { name: 'Spider Walk', level: 2, type: 'Druid' },
    { name: 'Summon Pests', level: 2, type: 'Druid' },
    { name: 'Warp Timber', level: 2, type: 'Druid' },
    { name: 'Web', level: 2, type: 'Druid' },
    // Level 3
    { name: 'Conjure Lightning', level: 3, type: 'Druid' },
    { name: 'Create Sustenance', level: 3, type: 'Druid' },
    { name: 'Faithful Watch Dog', level: 3, type: 'Druid' },
    { name: 'Meld', level: 3, type: 'Druid' },
    { name: 'Neutralize Toxins', level: 3, type: 'Druid' },
    { name: 'Plant Growth', level: 3, type: 'Druid' },
    { name: 'Protection from Elemental Attacks', level: 3, type: 'Druid' },
    { name: 'Pyrotechnics', level: 3, type: 'Druid' },
    { name: 'Remove Bane', level: 3, type: 'Druid' },
    { name: 'Remove Malady', level: 3, type: 'Druid' },
    { name: 'Shape Stone or Wood', level: 3, type: 'Druid' },
    { name: 'Snare', level: 3, type: 'Druid' },
    { name: 'Speak with Plants', level: 3, type: 'Druid' },
    { name: 'Wall of Elemental Wind', level: 3, type: 'Druid' },
    { name: 'Water Breathing', level: 3, type: 'Druid' },
    // Level 4
    { name: 'Anti Plant Sphere', level: 4, type: 'Druid' },
    { name: 'Control Liquids', level: 4, type: 'Druid' },
    { name: 'Control Plants', level: 4, type: 'Druid' },
    { name: 'Dispel Magic', level: 4, type: 'Druid' },
    { name: 'Free Motion', level: 4, type: 'Druid' },
    { name: 'Heal Serious Wounds', level: 4, type: 'Druid' },
    { name: 'Quench', level: 4, type: 'Druid' },
    { name: 'Reincarnate', level: 4, type: 'Druid' },
    { name: 'Repel Pest', level: 4, type: 'Druid' },
    { name: 'Scrying', level: 4, type: 'Druid' },
    { name: 'Sleet', level: 4, type: 'Druid' },
    { name: 'Spike Spell', level: 4, type: 'Druid' },
    { name: 'Summon Animals', level: 4, type: 'Druid' },
    // Level 5
    { name: 'Animal Alteration', level: 5, type: 'Druid' },
    { name: 'Awaken', level: 5, type: 'Druid' },
    { name: 'Bind Elemental', level: 5, type: 'Druid' },
    { name: 'Commune with the Natural World', level: 5, type: 'Druid' },
    { name: 'Control Gales', level: 5, type: 'Druid' },
    { name: 'Death Mask', level: 5, type: 'Druid' },
    { name: 'Harrow the Earth', level: 5, type: 'Druid' },
    { name: 'Heal Critical Wounds', level: 5, type: 'Druid' },
    { name: 'Ice Storm', level: 5, type: 'Druid' },
    { name: 'Insect Swarm', level: 5, type: 'Druid' },
    { name: 'Summon Beasts and Plants', level: 5, type: 'Druid' },
    { name: 'Transform Soft Soil to Stone', level: 5, type: 'Druid' },
    { name: 'Wall of Bramble & Hedge', level: 5, type: 'Druid' },
    { name: 'Wall of Elemental Fire', level: 5, type: 'Druid' },
    // Level 6
    { name: 'Anti Life Sphere', level: 6, type: 'Druid' },
    { name: 'Flame Seeds', level: 6, type: 'Druid' },
    { name: 'Ironbark', level: 6, type: 'Druid' },
    { name: 'Remove Wood from Path', level: 6, type: 'Druid' },
    { name: 'Stone Speak', level: 6, type: 'Druid' },
    { name: 'Summon Elemental Being', level: 6, type: 'Druid' },
    { name: 'Transport Through Plants', level: 6, type: 'Druid' },
    { name: 'Wall of Elemental Earth', level: 6, type: 'Druid' },
    // Level 7
    { name: 'Change Stave to Treant', level: 7, type: 'Druid' },
    { name: 'Control Atmosphere', level: 7, type: 'Druid' },
    { name: 'Creeping Swarm', level: 7, type: 'Druid' },
    { name: 'Flaming Tempest', level: 7, type: 'Druid' },
    { name: 'Scrying', level: 7, type: 'Druid' },
    { name: 'Summon Fey and Magic Beasts', level: 7, type: 'Druid' },
    { name: 'Transform Metal to Wood', level: 7, type: 'Druid' },
    { name: 'Wind Travel', level: 7, type: 'Druid' },
    // Level 8
    { name: 'Animal Form', level: 8, type: 'Druid' },
    { name: 'Command Plants', level: 8, type: 'Druid' },
    { name: 'Fatal Gesture', level: 8, type: 'Druid' },
    { name: 'Regenerate', level: 8, type: 'Druid' },
    { name: 'Remove Alloy and Stone from Path', level: 8, type: 'Druid' },
    { name: 'Sun Flare', level: 8, type: 'Druid' },
    { name: 'Whirlwind', level: 8, type: 'Druid' },
    { name: 'Word to Sanctuary', level: 8, type: 'Druid' },
    // Level 9
    { name: 'Antipathy', level: 9, type: 'Druid' },
    { name: 'Astral Travel', level: 9, type: 'Druid' },
    { name: 'Earthquake', level: 9, type: 'Druid' },
    { name: 'Heal', level: 9, type: 'Druid' },
    { name: 'Polychromatic Wall', level: 9, type: 'Druid' },
    { name: 'Shapeshift', level: 9, type: 'Druid' },
    { name: 'Storm of Wrath', level: 9, type: 'Druid' },
    { name: 'Summon Elemental Horde', level: 9, type: 'Druid' },

    // ILLUSIONIST SPELLS (Arcane)
    // Level 0
    { name: 'Arcane Rune', level: 0, type: 'Illusionist' },
    { name: 'Dancing Orbs', level: 0, type: 'Illusionist' },
    { name: 'Discern Illusion', level: 0, type: 'Illusionist' },
    { name: 'Dragon Mark', level: 0, type: 'Illusionist' },
    { name: 'First Aid', level: 0, type: 'Illusionist' },
    { name: 'Ghostly Noise', level: 0, type: 'Illusionist' },
    { name: 'Influence', level: 0, type: 'Illusionist' },
    { name: 'Light', level: 0, type: 'Illusionist' },
    { name: "Magi's Glamour", level: 0, type: 'Illusionist' },
    { name: 'Mending', level: 0, type: 'Illusionist' },
    { name: 'Message', level: 0, type: 'Illusionist' },
    { name: 'Prestidigitation', level: 0, type: 'Illusionist' },
    // Level 1
    { name: "Alter One's Person Lesser", level: 1, type: 'Illusionist' },
    { name: 'Arcane Armor', level: 1, type: 'Illusionist' },
    { name: 'Charm Humanoid', level: 1, type: 'Illusionist' },
    { name: 'Colors', level: 1, type: 'Illusionist' },
    { name: 'Darkness', level: 1, type: 'Illusionist' },
    { name: 'Daze', level: 1, type: 'Illusionist' },
    { name: 'Dragon Armor', level: 1, type: 'Illusionist' },
    { name: 'Dragon Image', level: 1, type: 'Illusionist' },
    { name: 'Erase', level: 1, type: 'Illusionist' },
    { name: 'Faerie Reflection', level: 1, type: 'Illusionist' },
    { name: 'Head Fog', level: 1, type: 'Illusionist' },
    { name: 'Hypnotism', level: 1, type: 'Illusionist' },
    { name: 'Illusionary Hounds', level: 1, type: 'Illusionist' },
    { name: 'Minor Dark Whips', level: 1, type: 'Illusionist' },
    { name: 'Obscure with Mist', level: 1, type: 'Illusionist' },
    { name: 'Read Arcane Script', level: 1, type: 'Illusionist' },
    { name: 'See Invisible', level: 1, type: 'Illusionist' },
    { name: 'Silent Illusion', level: 1, type: 'Illusionist' },
    { name: 'Undetectable Aura', level: 1, type: 'Illusionist' },
    { name: 'Ventriloquism', level: 1, type: 'Illusionist' },
    { name: "Ward's Temporary Strength", level: 1, type: 'Illusionist' },
    // Level 2
    { name: "Alter One's Person Greater", level: 2, type: 'Illusionist' },
    { name: 'Angelic Image', level: 2, type: 'Illusionist' },
    { name: 'Blur', level: 2, type: 'Illusionist' },
    { name: 'Dark Whips', level: 2, type: 'Illusionist' },
    { name: 'Discern Magic', level: 2, type: 'Illusionist' },
    { name: 'Discern Thoughts', level: 2, type: 'Illusionist' },
    { name: 'Dragon Bite', level: 2, type: 'Illusionist' },
    { name: 'Eyes of Chaos', level: 2, type: 'Illusionist' },
    { name: 'False Snare or Trap', level: 2, type: 'Illusionist' },
    { name: 'Fog', level: 2, type: 'Illusionist' },
    { name: 'Heal Light Wounds', level: 2, type: 'Illusionist' },
    { name: 'Hypnotic Imagery', level: 2, type: 'Illusionist' },
    { name: 'Illusion', level: 2, type: 'Illusionist' },
    { name: 'Invisibility', level: 2, type: 'Illusionist' },
    { name: "Magi's Visage", level: 2, type: 'Illusionist' },
    { name: 'Mirrored Self', level: 2, type: 'Illusionist' },
    { name: 'Misdirection', level: 2, type: 'Illusionist' },
    { name: 'Pyrotechnics', level: 2, type: 'Illusionist' },
    { name: 'Restore Sight and Hearing', level: 2, type: 'Illusionist' },
    { name: "Ward's Temporary Invisibility", level: 2, type: 'Illusionist' },
    // Level 3
    { name: 'Blink', level: 3, type: 'Illusionist' },
    { name: 'Continual Fire', level: 3, type: 'Illusionist' },
    { name: 'Discern Illusion', level: 3, type: 'Illusionist' },
    { name: 'Dispel Magic', level: 3, type: 'Illusionist' },
    { name: 'Displace', level: 3, type: 'Illusionist' },
    { name: 'Doubled Treasure', level: 3, type: 'Illusionist' },
    { name: 'Dragon Mount', level: 3, type: 'Illusionist' },
    { name: 'Explosive Mark', level: 3, type: 'Illusionist' },
    { name: 'Hallucinatory Ground', level: 3, type: 'Illusionist' },
    { name: 'Hold Humanoid', level: 3, type: 'Illusionist' },
    { name: 'Illusion', level: 3, type: 'Illusionist' },
    { name: 'Illusionary Help', level: 3, type: 'Illusionist' },
    { name: 'Illusory Writing', level: 3, type: 'Illusionist' },
    { name: 'Invisibility Orb', level: 3, type: 'Illusionist' },
    { name: 'Nondetection', level: 3, type: 'Illusionist' },
    { name: 'Rope Dimension', level: 3, type: 'Illusionist' },
    { name: 'Scare', level: 3, type: 'Illusionist' },
    { name: 'Secret Script', level: 3, type: 'Illusionist' },
    { name: 'Suggestion', level: 3, type: 'Illusionist' },
    { name: 'Tongues', level: 3, type: 'Illusionist' },
    // Level 4
    { name: 'Charm Monster', level: 4, type: 'Illusionist' },
    { name: 'Confusion', level: 4, type: 'Illusionist' },
    { name: 'Dragon Scales', level: 4, type: 'Illusionist' },
    { name: 'Emotion', level: 4, type: 'Illusionist' },
    { name: 'Fear', level: 4, type: 'Illusionist' },
    { name: 'Heal Serious Wounds', level: 4, type: 'Illusionist' },
    { name: 'Idol of Death', level: 4, type: 'Illusionist' },
    { name: 'Illusory Barrier', level: 4, type: 'Illusionist' },
    { name: 'Invisibility Heightened', level: 4, type: 'Illusionist' },
    { name: 'Major Dark Whips', level: 4, type: 'Illusionist' },
    { name: 'Minor Concoction', level: 4, type: 'Illusionist' },
    { name: 'Mirage', level: 4, type: 'Illusionist' },
    { name: 'Phantasm', level: 4, type: 'Illusionist' },
    { name: 'Rainbow', level: 4, type: 'Illusionist' },
    { name: 'Seeming', level: 4, type: 'Illusionist' },
    { name: 'Shadow Convocation', level: 4, type: 'Illusionist' },
    { name: 'Shelter', level: 4, type: 'Illusionist' },
    { name: 'Solidlike Fog', level: 4, type: 'Illusionist' },
    { name: 'Treasure Hoard', level: 4, type: 'Illusionist' },
    { name: "Ward's Illusionary Portal", level: 4, type: 'Illusionist' },
    // Level 5
    { name: 'Conjure Phantasm', level: 5, type: 'Illusionist' },
    { name: 'Dragon Breath', level: 5, type: 'Illusionist' },
    { name: 'Dragon Shadow', level: 5, type: 'Illusionist' },
    { name: 'Dream', level: 5, type: 'Illusionist' },
    { name: 'Faithful Watch Dog', level: 5, type: 'Illusionist' },
    { name: 'False Scrying', level: 5, type: 'Illusionist' },
    { name: 'Guard with Wards', level: 5, type: 'Illusionist' },
    { name: 'Hold Creature', level: 5, type: 'Illusionist' },
    { name: 'Humanoid Finding', level: 5, type: 'Illusionist' },
    { name: "Magi's Conjuring", level: 5, type: 'Illusionist' },
    { name: 'Mirror Wall', level: 5, type: 'Illusionist' },
    { name: 'Neutralize Toxins', level: 5, type: 'Illusionist' },
    { name: 'Nightmare', level: 5, type: 'Illusionist' },
    { name: 'Persevering Illusion', level: 5, type: 'Illusionist' },
    { name: 'Projection', level: 5, type: 'Illusionist' },
    { name: 'Secret Container', level: 5, type: 'Illusionist' },
    { name: 'Shadow Sorcery', level: 5, type: 'Illusionist' },
    { name: 'Suggestion in Area', level: 5, type: 'Illusionist' },
    { name: 'Truth Revealed', level: 5, type: 'Illusionist' },
    { name: "Ward's Extended Invisibility", level: 5, type: 'Illusionist' },
    // Level 6
    { name: 'Anti Illusion Sphere', level: 6, type: 'Illusionist' },
    { name: 'Cloak of Smoke and Darkness', level: 6, type: 'Illusionist' },
    { name: 'Conjure Phantasm', level: 6, type: 'Illusionist' },
    { name: 'Feeblemind', level: 6, type: 'Illusionist' },
    { name: 'Geas', level: 6, type: 'Illusionist' },
    { name: 'Heal Critical Wounds', level: 6, type: 'Illusionist' },
    { name: 'Illusionary Lions', level: 6, type: 'Illusionist' },
    { name: 'Misguide', level: 6, type: 'Illusionist' },
    { name: 'Perpetual Illusion', level: 6, type: 'Illusionist' },
    { name: 'Programmed Illusion', level: 6, type: 'Illusionist' },
    { name: 'Shades', level: 6, type: 'Illusionist' },
    { name: 'Veil', level: 6, type: 'Illusionist' },
    // Level 7
    { name: 'Awe', level: 7, type: 'Illusionist' },
    { name: 'Insanity', level: 7, type: 'Illusionist' },
    { name: 'Invisibility in Area', level: 7, type: 'Illusionist' },
    { name: 'Maze', level: 7, type: 'Illusionist' },
    { name: 'Polychromatic Spray', level: 7, type: 'Illusionist' },
    { name: 'Power of Spoken Word: Immobilize', level: 7, type: 'Illusionist' },
    { name: 'Restoration', level: 7, type: 'Illusionist' },
    { name: 'Sequester', level: 7, type: 'Illusionist' },
    { name: 'Shadow Journey', level: 7, type: 'Illusionist' },
    { name: 'Simulacrum', level: 7, type: 'Illusionist' },
    { name: 'Telepathy', level: 7, type: 'Illusionist' },
    { name: 'Vision', level: 7, type: 'Illusionist' },
    // Level 8
    { name: 'Antipathy', level: 8, type: 'Illusionist' },
    { name: 'Charm Area', level: 8, type: 'Illusionist' },
    { name: 'Distort Reality', level: 8, type: 'Illusionist' },
    { name: 'Finding Trails', level: 8, type: 'Illusionist' },
    { name: 'Incendiary Flow', level: 8, type: 'Illusionist' },
    { name: 'Polymorph', level: 8, type: 'Illusionist' },
    { name: 'Polychromatic Wall', level: 8, type: 'Illusionist' },
    { name: 'Power of the Spoken Word: Purblind', level: 8, type: 'Illusionist' },
    { name: 'Screen', level: 8, type: 'Illusionist' },
    { name: 'Sun Flare', level: 8, type: 'Illusionist' },
    { name: 'Trap Entity', level: 8, type: 'Illusionist' },
    { name: 'Wind Travel', level: 8, type: 'Illusionist' },
    // Level 9
    { name: 'Astral Travel', level: 9, type: 'Illusionist' },
    { name: 'Bind', level: 9, type: 'Illusionist' },
    { name: 'Clone', level: 9, type: 'Illusionist' },
    { name: 'Dreaming', level: 9, type: 'Illusionist' },
    { name: 'Heal', level: 9, type: 'Illusionist' },
    { name: 'Mind Ward', level: 9, type: 'Illusionist' },
    { name: 'Polymorph Creatures & Things', level: 9, type: 'Illusionist' },
    { name: 'Polychromatic Sphere', level: 9, type: 'Illusionist' },
    { name: 'Power of the Spoken Word: Slay', level: 9, type: 'Illusionist' },
    { name: 'Regenerate', level: 9, type: 'Illusionist' },
    { name: 'Symbol', level: 9, type: 'Illusionist' },
    { name: 'Weirding', level: 9, type: 'Illusionist' },
  ] as Spell[],

  equipment: [
    { id: 'longsword', name: 'Longsword', type: 'weapon', cost: 15, ev: 3, dmg: '1d8', cat: 'Melee' },
    { id: 'shortsword', name: 'Short Sword', type: 'weapon', cost: 10, ev: 2, dmg: '1d6', cat: 'Melee' },
    { id: 'dagger', name: 'Dagger', type: 'weapon', cost: 2, ev: 1, dmg: '1d4', cat: 'Melee' },
    { id: 'greatsword', name: 'Greatsword', type: 'weapon', cost: 30, ev: 5, dmg: '2d6', cat: 'Melee' },
    { id: 'spear', name: 'Spear', type: 'weapon', cost: 2, ev: 3, dmg: '1d6', cat: 'Melee' },
    { id: 'longbow', name: 'Longbow', type: 'weapon', cost: 60, ev: 4, dmg: '1d6', cat: 'Ranged' },
    { id: 'shortbow', name: 'Shortbow', type: 'weapon', cost: 30, ev: 2, dmg: '1d6', cat: 'Ranged' },
    { id: 'xbow_wood_light', name: 'Crossbow, Wooden Light', type: 'weapon', cost: 35, ev: 3, dmg: '1d6', cat: 'Ranged' },
    { id: 'xbow_wood_heavy', name: 'Crossbow, Wooden Heavy', type: 'weapon', cost: 45, ev: 5, dmg: '1d6', cat: 'Ranged' },
    { id: 'xbow_comp_light', name: 'Crossbow, Composite Light', type: 'weapon', cost: 45, ev: 3, dmg: '1d8', cat: 'Ranged' },
    { id: 'xbow_comp_heavy', name: 'Crossbow, Composite Heavy', type: 'weapon', cost: 50, ev: 5, dmg: '1d10', cat: 'Ranged' },
    { id: 'xbow_steel_light', name: 'Crossbow, Steel Light', type: 'weapon', cost: 75, ev: 4, dmg: '1d8', cat: 'Ranged' },
    { id: 'xbow_steel_heavy', name: 'Crossbow, Steel Heavy', type: 'weapon', cost: 100, ev: 6, dmg: '1d10', cat: 'Ranged' },
    { id: 'xbow_gastraphetes', name: 'Gastraphetes', type: 'weapon', cost: 50, ev: 4, dmg: '1d6', cat: 'Ranged' },
    { id: 'xbow_pistol', name: 'Crossbow, Pistol', type: 'weapon', cost: 100, ev: 1, dmg: '1d4', cat: 'Ranged' },
    { id: 'xbow_repeating', name: 'Crossbow, Repeating', type: 'weapon', cost: 125, ev: 4, dmg: '1d4', cat: 'Ranged' },
    { id: 'mace_light', name: 'Mace, light', type: 'weapon', cost: 5, ev: 2, dmg: '1d4', cat: 'Melee' },
    { id: 'mace_heavy', name: 'Mace, heavy', type: 'weapon', cost: 12, ev: 4, dmg: '1d8', cat: 'Melee' },
    { id: 'padded', name: 'Padded armor', type: 'armor', cost: 5, ev: 2, ac: 1, cat: 'Light' },
    { id: 'leather', name: 'Leather armor', type: 'armor', cost: 10, ev: 3, ac: 2, cat: 'Light' },
    { id: 'ringmail', name: 'Ring mail', type: 'armor', cost: 30, ev: 6, ac: 3, cat: 'Medium' },
    { id: 'chainmail', name: 'Chain mail', type: 'armor', cost: 150, ev: 8, ac: 5, cat: 'Medium' },
    { id: 'platemail', name: 'Plate mail', type: 'armor', cost: 600, ev: 12, ac: 7, cat: 'Heavy' },
    { id: 'shield_sm', name: 'Shield, small wooden', type: 'shield', cost: 3, ev: 1, ac: 1, cat: 'Shield' },
    { id: 'shield_lg', name: 'Shield, large steel', type: 'shield', cost: 7, ev: 2, ac: 1, cat: 'Shield' },
    { id: 'shield_adarga', name: 'Adarga (+2 vs missile)', type: 'shield', cost: 12, ev: 2, ac: 1, cat: 'Shield' },
    { id: 'shield_tower', name: 'Tower Shield', type: 'shield', cost: 30, ev: 6, ac: 3, cat: 'Shield' },
    { id: 'backpack', name: 'Backpack', type: 'gear', cost: 2, ev: 0, cat: 'Gear', desc: 'Holds 8 EV items' },
    { id: 'rations', name: 'Rations (1 week)', type: 'gear', cost: 5, ev: 1, cat: 'Gear', desc: 'Dry food' },
    { id: 'rope', name: 'Rope (50ft)', type: 'gear', cost: 1, ev: 2, cat: 'Gear', desc: 'Hemp' },
    { id: 'torches', name: 'Torches (10)', type: 'gear', cost: 1, ev: 1, cat: 'Gear', desc: 'Lighting' },
    { id: 'waterskin', name: 'Waterskin', type: 'gear', cost: 1, ev: 1, cat: 'Gear', desc: 'Water' },
  ] as EquipmentItem[],

  classKits: {
    fighter: { name: 'Mercenary Kit', items: ['chainmail', 'longsword', 'shield_lg', 'backpack', 'rations'], cost: 175 },
    ranger: { name: 'Scout Kit', items: ['leather', 'longbow', 'shortsword', 'backpack', 'rations', 'rope'], cost: 95 },
    rogue: { name: 'Burglar Kit', items: ['leather', 'shortsword', 'dagger', 'backpack', 'rope', 'torches'], cost: 45 },
    wizard: { name: 'Scholar Kit', items: ['dagger', 'backpack', 'rations', 'waterskin', 'torches'], cost: 15 },
    cleric: { name: 'Priest Kit', items: ['ringmail', 'mace_heavy', 'shield_sm', 'backpack', 'rations'], cost: 55 },
    bard: { name: 'Minstrel Kit', items: ['leather', 'longsword', 'backpack', 'rations', 'waterskin'], cost: 35 },
    paladin: { name: 'Crusader Kit', items: ['chainmail', 'longsword', 'shield_lg', 'backpack'], cost: 170 },
    knight: { name: 'Noble Kit', items: ['platemail', 'longsword', 'shield_lg', 'backpack'], cost: 630 },
    assassin: { name: 'Shadow Kit', items: ['leather', 'shortsword', 'dagger', 'backpack', 'rope'], cost: 40 },
    barbarian: { name: 'Tribal Kit', items: ['leather', 'greatsword', 'backpack', 'rations'], cost: 50 },
    monk: { name: 'Ascetic Kit', items: ['backpack', 'rations', 'waterskin', 'rope'], cost: 10 },
    druid: { name: 'Grove Kit', items: ['leather', 'spear', 'backpack', 'rations'], cost: 20 },
    illusionist: { name: 'Trickster Kit', items: ['dagger', 'backpack', 'torches', 'waterskin'], cost: 10 },
  } as Record<string, ClassKit>,

  magicItems: [
    // Potions & Scrolls
    { name: 'Potion of Giant Strength', cat: 'Potions' },
    { name: 'Potion of Youth', cat: 'Potions' },
    { name: 'Potion of Protection from Disposition', cat: 'Potions' },
    { name: 'Scroll of Restoration', cat: 'Scrolls' },
    { name: 'Scroll of Protection', cat: 'Scrolls' },
    { name: 'Scroll of Anti-Magic Sphere', cat: 'Scrolls' },
    { name: 'Scroll of Heal', cat: 'Scrolls' },
    // Swords
    { name: 'Bane Sword', cat: 'Swords' },
    { name: 'Sword of Dancing', cat: 'Swords' },
    { name: 'Sword of Defending', cat: 'Swords' },
    { name: 'Dragonslayer', cat: 'Swords' },
    { name: 'Flaming Sword', cat: 'Swords' },
    { name: 'Frostfire', cat: 'Swords' },
    { name: 'Holy Avenger', cat: 'Swords' },
    { name: 'Luck Blade', cat: 'Swords' },
    { name: 'Nine Lives Thief', cat: 'Swords' },
    { name: 'Sylvan Blade', cat: 'Swords' },
    { name: 'Vorpal Sword', cat: 'Swords' },
    // Weapons
    { name: 'Club of Dagda', cat: 'Weapons' },
    { name: 'Dagger of Envenomation', cat: 'Weapons' },
    { name: 'Dwarven Hammer of Throwing', cat: 'Weapons' },
    { name: 'Lightning Javelin', cat: 'Weapons' },
    { name: 'Mace of Turning', cat: 'Weapons' },
    { name: 'Mace of Banishment', cat: 'Weapons' },
    { name: 'Oathkeeper Bow', cat: 'Weapons' },
    { name: 'Arrow of Slaying', cat: 'Weapons' },
    { name: 'Trident of Sea Creature Command', cat: 'Weapons' },
    // Armor
    { name: 'Armor of Cold Resistance', cat: 'Armor' },
    { name: 'Armor of the Ethereal Knight', cat: 'Armor' },
    { name: 'Armor of Fire Resistance', cat: 'Armor' },
    { name: 'Armor of Spell Resistance', cat: 'Armor' },
    { name: 'Animated Shield', cat: 'Armor' },
    { name: 'Dwarven Fullplate', cat: 'Armor' },
    { name: 'Elven Chainmail', cat: 'Armor' },
    { name: 'Shield of the Roaring Lion', cat: 'Armor' },
    // Wondrous Items
    { name: 'Amulet of Superior Health', cat: 'Wondrous' },
    { name: 'Amulet of Mighty Blows', cat: 'Wondrous' },
    { name: 'Amulet of Planar Travel', cat: 'Wondrous' },
    { name: 'Dimensional Pouch', cat: 'Wondrous' },
    { name: 'Harness of Giant Strength', cat: 'Wondrous' },
    { name: 'Boots of the Elves', cat: 'Wondrous' },
    { name: 'Boots of Levitation', cat: 'Wondrous' },
    { name: 'Boots of Flight of Foot', cat: 'Wondrous' },
    { name: 'Boots of Teleporting', cat: 'Wondrous' },
    { name: 'Bracers of Armor', cat: 'Wondrous' },
    { name: 'Flying Broomstick', cat: 'Wondrous' },
    { name: 'Flying Carpet', cat: 'Wondrous' },
    { name: 'Cloak of the Spider', cat: 'Wondrous' },
    { name: 'Cloak of the Bat', cat: 'Wondrous' },
    { name: 'Cloak of the Elves', cat: 'Wondrous' },
    { name: 'Cloak of Ethereal Travel', cat: 'Wondrous' },
    { name: 'Crystal Ball', cat: 'Wondrous' },
    { name: 'Decanter of Unending Water', cat: 'Wondrous' },
    { name: 'Gauntlets of Ogrish Might', cat: 'Wondrous' },
    { name: 'Gloves of Dexterity', cat: 'Wondrous' },
    { name: 'Dimensional Backpack', cat: 'Wondrous' },
    { name: 'Helm of Teleporting', cat: 'Wondrous' },
    { name: 'Horn of Valhalla', cat: 'Wondrous' },
    { name: 'Instant Fortress', cat: 'Wondrous' },
    { name: 'Ioun Stones', cat: 'Wondrous' },
    { name: 'Portable Hole', cat: 'Wondrous' },
    { name: 'Robe of the High Magus', cat: 'Wondrous' },
    { name: 'Seven-League Boots', cat: 'Wondrous' },
    // Rings
    { name: 'Ring of Invisibility', cat: 'Rings' },
    { name: 'Ring of Regeneration', cat: 'Rings' },
    { name: 'Ring of Spell Keeping', cat: 'Rings' },
    { name: 'Ring of Spell Deflection', cat: 'Rings' },
    { name: 'Ring of Flying', cat: 'Rings' },
    { name: 'Ring of Free Motion', cat: 'Rings' },
    { name: 'Ring of Granting', cat: 'Rings' },
    { name: 'Ring of Armor', cat: 'Rings' },
    { name: 'Ring of Eldritch Wizardry', cat: 'Rings' },
    { name: 'Gyges Ring', cat: 'Rings' },
    // Rods & Staves
    { name: 'Rod of Spell Stealing', cat: 'Rods & Staves' },
    { name: 'Rod of Supreme Usefulness', cat: 'Rods & Staves' },
    { name: 'Rod of Chaos', cat: 'Rods & Staves' },
    { name: 'Staff of Pyromancy', cat: 'Rods & Staves' },
    { name: 'Staff of Cryomancy', cat: 'Rods & Staves' },
    { name: 'Staff of Healing', cat: 'Rods & Staves' },
    { name: 'Staff of Power', cat: 'Rods & Staves' },
    { name: 'Staff of the Magus', cat: 'Rods & Staves' },
    { name: 'Staff of the Druids', cat: 'Rods & Staves' },
    // Legendary
    { name: 'Aegis', cat: 'Legendary' },
    { name: 'Excalibur', cat: 'Legendary' },
    { name: 'Mjolnir', cat: 'Legendary' },
    { name: 'Deck of Many Things', cat: 'Legendary' },
    { name: 'Hammer of Thunderbolts', cat: 'Legendary' },
    { name: 'Philosopher\'s Stone', cat: 'Legendary' },
    { name: 'Sphere of Obliteration', cat: 'Legendary' },
    { name: 'Tarnhelm', cat: 'Legendary' },
  ] as { name: string; cat: string }[]
};

// --- HELPER TYPES ---

interface AttributeData {
  score: number;
  prime: boolean;
}

interface MagicItem {
  name: string;
  cat: string;
  notes?: string;
}

interface CharacterState {
  name: string;
  race: Race;
  charClass: CharClass;
  level: number;
  gold: number;
  disposition: string;
  attributes: Record<string, AttributeData>;
  inventory: EquipmentItem[];
  knownSpells: Spell[];
  magicItems: MagicItem[];
  activeTab: string;
  rollingMethod: string;
  pointsRemaining: number;
  viewMode: 'builder' | 'sheet' | 'split';
  spellLevelFilter: number;
  treasureCategoryFilter: string;
}

type CharacterAction =
  | { type: 'SET_FIELD'; field: string; payload: unknown }
  | { type: 'SET_CLASS'; payload: CharClass }
  | { type: 'LEVEL_UP' }
  | { type: 'LEVEL_DOWN' }
  | { type: 'SET_VIEW_MODE'; payload: 'builder' | 'sheet' | 'split' }
  | { type: 'UPDATE_ATTR_SCORE'; payload: { attr: string; val: number } }
  | { type: 'TOGGLE_PRIME'; payload: { attr: string } }
  | { type: 'BUY_ITEM'; payload: EquipmentItem }
  | { type: 'BUY_KIT'; payload: ClassKit }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'LEARN_SPELL'; payload: Spell }
  | { type: 'FORGET_SPELL'; payload: Spell }
  | { type: 'RANDOMIZE_STATS' }
  | { type: 'ADD_MAGIC_ITEM'; payload: MagicItem }
  | { type: 'REMOVE_MAGIC_ITEM'; payload: number }
  | { type: 'SAVE_CHARACTER' }
  | { type: 'LOAD_CHARACTER'; payload: CharacterState };

// --- HELPER: REFORGED TEXT GENERATOR ---

const generateReforgedBlock = (state: CharacterState): string => {
  const { race, charClass, level, attributes, inventory, disposition, gold } = state;

  const conMod = RULES.getMod(attributes.CON.score + (race.mods.CON || 0));
  const hp = Math.max(1, (charClass.hd + conMod) * level);
  const dexMod = RULES.getMod(attributes.DEX.score + (race.mods.DEX || 0));
  const armorBonus = inventory.filter(i => i.type === 'armor' || i.type === 'shield').reduce((sum, i) => sum + (i.ac || 0), 0);
  const ac = 10 + dexMod + armorBonus;

  const dispString = disposition.toLowerCase();
  const primes = Object.entries(attributes).filter(([, v]) => v.prime).map(([k]) => k).join(', ');

  const worn = inventory.filter(i => i.type === 'armor' || i.type === 'shield').map(i => i.name.toLowerCase());
  const carried = inventory.filter(i => i.type === 'weapon' || i.type === 'gear').map(i => i.name.toLowerCase());
  
  let equipString = '';
  if (worn.length > 0) {
    equipString += `He/She wears ${worn.join(', ')}`;
  }
  if (carried.length > 0) {
    equipString += (worn.length > 0 ? ' and carries ' : 'He/She carries ') + carried.join(', ');
  }
  if (gold > 0) {
    equipString += (worn.length > 0 || carried.length > 0 ? ', and ' : 'He/She carries ') + `${gold} gold in coin`;
  }

  const ordinal = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
  return `(This ${level}${ordinal} level ${race.name.toLowerCase()} ${charClass.name.toLowerCase()}'s vital stats are HP ${hp}, AC ${ac}, disposition ${dispString}. Primary attributes: ${primes}. ${equipString}.)`;
};

// --- INITIAL STATE & REDUCER ---

const initialState: CharacterState = {
  name: 'Unnamed Hero',
  race: RULES.races[0],
  charClass: RULES.classes[0],
  level: 1,
  gold: 150,
  disposition: 'Neutral',
  attributes: {
    STR: { score: 10, prime: true },
    DEX: { score: 10, prime: false },
    CON: { score: 10, prime: false },
    INT: { score: 10, prime: false },
    WIS: { score: 10, prime: false },
    CHA: { score: 10, prime: false },
  },
  inventory: [],
  knownSpells: [],
  magicItems: [],
  activeTab: 'origin',
  rollingMethod: '3d6',
  pointsRemaining: 48,
  viewMode: 'split',
  spellLevelFilter: 0,
  treasureCategoryFilter: 'All',
};

function characterReducer(state: CharacterState, action: CharacterAction): CharacterState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.payload };
    
    case 'SET_CLASS': {
      const newClass = action.payload;
      const updatedAttributes = { ...state.attributes };
      newClass.reqPrime.forEach(attr => { updatedAttributes[attr] = { ...updatedAttributes[attr], prime: true }; });
      return { ...state, charClass: newClass, attributes: updatedAttributes };
    }

    case 'LEVEL_UP': return { ...state, level: Math.min(20, state.level + 1) };
    case 'LEVEL_DOWN': return { ...state, level: Math.max(1, state.level - 1) };

    case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload };

    case 'UPDATE_ATTR_SCORE': {
      const { attr, val } = action.payload;
      if (state.rollingMethod === 'pointBuy') {
        const currentScore = state.attributes[attr].score;
        const diff = val - currentScore;
        if (val < 3) return state;
        if (state.pointsRemaining - diff < 0) return state; 
        return { 
          ...state, 
          pointsRemaining: state.pointsRemaining - diff,
          attributes: { ...state.attributes, [attr]: { ...state.attributes[attr], score: val } } 
        };
      }
      return { ...state, attributes: { ...state.attributes, [attr]: { ...state.attributes[attr], score: val } } };
    }

    case 'TOGGLE_PRIME': {
      const { attr } = action.payload;
      const isClassReq = state.charClass.reqPrime.includes(attr);
      if (isClassReq) return state; 
      
      const currentPrimes = Object.values(state.attributes).filter(a => a.prime).length;
      const maxPrimes = state.race.id === 'human' ? 3 : 2;

      if (!state.attributes[attr].prime && currentPrimes >= maxPrimes) return state;

      return { ...state, attributes: { ...state.attributes, [attr]: { ...state.attributes[attr], prime: !state.attributes[attr].prime } } };
    }

    case 'BUY_ITEM': {
      const item = action.payload;
      if (state.gold < item.cost) return state;
      return { ...state, gold: state.gold - item.cost, inventory: [...state.inventory, item] };
    }

    case 'BUY_KIT': {
      const kit = action.payload;
      if (state.gold < kit.cost) return state;
      const newItems = kit.items.map(id => RULES.equipment.find(e => e.id === id)).filter((e): e is EquipmentItem => e !== undefined);
      return {
        ...state,
        gold: state.gold - kit.cost,
        inventory: [...state.inventory, ...newItems]
      };
    }

    case 'REMOVE_ITEM': {
      const index = action.payload;
      const item = state.inventory[index];
      return { ...state, gold: state.gold + item.cost, inventory: state.inventory.filter((_, i) => i !== index) };
    }

    case 'LEARN_SPELL': {
      if (state.knownSpells.some(s => s.name === action.payload.name)) return state;
      return { ...state, knownSpells: [...state.knownSpells, action.payload] };
    }

    case 'FORGET_SPELL': {
      return { ...state, knownSpells: state.knownSpells.filter(s => s.name !== action.payload.name) };
    }

    case 'RANDOMIZE_STATS': {
      const newAttrs: Record<string, AttributeData> = {};
      RULES.attributes.forEach(attr => {
        let r: number;
        if (state.rollingMethod === '3d6') {
          r = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
        } else if (state.rollingMethod === '4d6') {
          const rolls = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
          rolls.sort((a,b) => a-b);
          r = rolls[1] + rolls[2] + rolls[3];
        } else {
          r = 3;
        }
        newAttrs[attr] = { score: r, prime: state.attributes[attr].prime };
      });
      return { ...state, attributes: newAttrs, pointsRemaining: state.rollingMethod === 'pointBuy' ? 48 : 0 };
    }

    case 'ADD_MAGIC_ITEM': {
      return { ...state, magicItems: [...state.magicItems, action.payload] };
    }

    case 'REMOVE_MAGIC_ITEM': {
      return { ...state, magicItems: state.magicItems.filter((_, i) => i !== action.payload) };
    }

    case 'LOAD_CHARACTER': {
      return action.payload;
    }

    default: return state;
  }
}

// --- SUB-COMPONENTS ---

const LogoTLG = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-md">
    <path d="M50 0 L95 25 L85 85 L50 100 L15 85 L5 25 Z" fill="#292524" stroke="#d97706" strokeWidth="4"/>
    <text x="50" y="55" textAnchor="middle" fill="#d97706" fontFamily="serif" fontSize="28" fontWeight="bold" style={{textShadow: '1px 1px 0 #000'}}>TLG</text>
    <text x="50" y="75" textAnchor="middle" fill="#a8a29e" fontSize="10" fontWeight="bold" fontFamily="serif">GAMES</text>
  </svg>
);

const LogoCNC = () => (
  <svg viewBox="0 0 220 60" className="h-full w-full">
    <text x="5" y="25" fill="#451a03" fontFamily="serif" fontSize="24" fontWeight="bold" letterSpacing="1" style={{textShadow: '1px 1px 0 #d97706'}}>CASTLES</text>
    <text x="50" y="50" fill="#451a03" fontFamily="serif" fontSize="24" fontWeight="bold" letterSpacing="1" style={{textShadow: '1px 1px 0 #d97706'}}>& CRUSADES</text>
    <line x1="5" y1="30" x2="210" y2="30" stroke="#78350f" strokeWidth="2" opacity="0.5"/>
  </svg>
);

const LogoSiege = () => (
  <svg viewBox="0 0 100 30" className="h-full w-full drop-shadow-sm">
    <rect x="0" y="0" width="100" height="30" rx="2" fill="#292524" stroke="#78350f" strokeWidth="2"/>
    <text x="50" y="20" textAnchor="middle" fill="#e7e5e4" fontFamily="serif" fontSize="12" fontWeight="bold" letterSpacing="1">SIEGE ENGINE</text>
  </svg>
);

// -- DISPOSITION BUILDER --
interface DispositionBuilderProps {
  value: string;
  onChange: (val: string) => void;
  charClass?: string;
  deityDisposition?: string;
}

const DispositionBuilder = ({ value, onChange, charClass, deityDisposition }: DispositionBuilderProps) => {
  const [primary, setPrimary] = useState('Neutral');
  const [secondary, setSecondary] = useState('None');
  const [validation, setValidation] = useState<{ valid: boolean; reason?: string } | null>(null);

  useEffect(() => {
    const toTitleCase = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

    if (value.includes('/')) {
      const [p, s] = value.split('/').map(x => x.trim());
      setPrimary(toTitleCase(p));
      // Normalize legacy adjectives to nouns for internal state
      let cleanS = toTitleCase(s);
      if (cleanS === 'Lawful') cleanS = 'Law';
      if (cleanS === 'Chaotic') cleanS = 'Chaos';
      setSecondary(cleanS);
    } else {
      setPrimary(toTitleCase(value.trim()));
      setSecondary('None');
    }
  }, [value]);

  useEffect(() => {
    let newVal = primary;
    if (secondary !== 'None' && secondary !== primary) {
      newVal = `${primary}/${secondary}`;
    }
    if (primary === 'Neutral' && secondary === 'Neutral') newVal = 'Neutral';

    // Normalize to noun-form (e.g., law/good, neutrality)
    const normalized = normalizeDisposition(newVal).toString();
    if (normalized !== value) onChange(normalized);

    // Run class/deity validation when available
    if (charClass) {
      const v = validateDispositionForClass(normalized, charClass, deityDisposition);
      setValidation(v);
    } else {
      setValidation(null);
    }
  }, [primary, secondary, value, onChange, charClass, deityDisposition]);

  const coreOptions = ['Law', 'Chaos', 'Good', 'Evil', 'Neutral'];
  
  // Tendency options depend on core selection to avoid redundancy
  const getTendencyOptions = (core: string) => {
    switch (core) {
      case 'Law':
        return ['Good', 'Evil', 'Neutral'];
      case 'Chaos':
        return ['Good', 'Evil', 'Neutral'];
      case 'Good':
        return ['Law', 'Chaos', 'Neutral'];
      case 'Evil':
        return ['Law', 'Chaos', 'Neutral'];
      case 'Neutral':
        return ['Law', 'Chaos', 'Good', 'Evil'];
      default:
        return ['Law', 'Chaos', 'Good', 'Evil', 'Neutral'];
    }
  };

  const handlePrimaryChange = (newPrimary: string) => {
    setPrimary(newPrimary);
    const valid = getTendencyOptions(newPrimary);
    if (secondary !== 'None' && !valid.includes(secondary)) {
      setSecondary('None');
    }
  };

  return (
    <div className="bg-[#f5f5f4] p-3 rounded-sm border-2 border-[#d6d3d1] shadow-inner">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="text-[10px] uppercase font-bold text-[#78716c] mb-1">Primary (Core Outlook)</div>
          <div className="flex flex-col gap-1">
            {coreOptions.map(opt => (
              <button 
                key={opt}
                onClick={() => handlePrimaryChange(opt)}
                className={`text-xs py-1 px-2 rounded-sm border text-left font-serif transition-colors ${primary === opt ? 'bg-[#b45309] text-white border-[#b45309]' : 'bg-white text-[#57534e] border-[#e7e5e4] hover:bg-[#e7e5e4]'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col justify-center items-center gap-1 text-[#d6d3d1]">
          <div className="text-[8px] uppercase tracking-widest font-bold rotate-0 text-[#a8a29e]">with</div>
          <ChevronDown className="-rotate-90" />
        </div>

        <div className="flex-1">
          <div className="text-[10px] uppercase font-bold text-[#78716c] mb-1">Secondary (Tendency)</div>
          <div className="flex flex-col gap-1">
            <button 
                onClick={() => setSecondary('None')}
                className={`text-xs py-1 px-2 rounded-sm border text-left font-serif italic ${secondary === 'None' ? 'bg-[#78716c] text-white border-[#78716c]' : 'bg-white text-[#a8a29e] border-[#e7e5e4]'}`}
              >
                None (Pure)
            </button>
            {getTendencyOptions(primary).map(opt => (
              <button 
                key={opt}
                onClick={() => setSecondary(opt)}
                disabled={opt === primary}
                title={opt === primary ? 'Secondary cannot be the same as Primary' : undefined}
                className={`text-xs py-1 px-2 rounded-sm border text-left font-serif transition-colors ${secondary === opt ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-[#57534e] border-[#e7e5e4] hover:bg-[#e7e5e4]'} ${opt === primary ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-[#d6d3d1]">
        <div className="text-[10px] uppercase text-[#a8a29e] text-center mb-1">Explanation</div>
        <div className="text-center text-xs italic text-[#78350f] mb-3 px-2">
          {secondary === 'None' || (primary === 'Neutral' && secondary === 'Neutral')
            ? `Character is purely ${primary}.`
            : `Character is primarily ${primary}, with ${secondary} tendencies.`}
        </div>

        <div className="text-[10px] uppercase text-[#a8a29e] text-center">Resulting Disposition</div>
        <div className="text-center font-bold text-[#451a03] text-lg font-serif">{value}</div>
        {validation && !validation.valid && (
          <div className="mt-2 text-xs text-red-600 text-center">{validation.reason}</div>
        )}
      </div>
    </div>
  );
};

interface SiegeSwitchProps {
  attr: string;
  data: AttributeData;
  isLocked: boolean;
  mod: number;
  onToggle: () => void;
}

const SiegeSwitch = ({ attr, data, isLocked, mod, onToggle }: SiegeSwitchProps) => (
  <div className={`relative p-3 rounded-sm border-2 transition-all duration-200 ${data.prime ? 'bg-[#fffbeb] border-[#d97706] shadow-md' : 'bg-[#f5f5f4] border-[#a8a29e]'}`}>
    <div className="flex justify-between items-center mb-2">
      <span className="font-bold text-lg text-[#292524] font-serif">{attr}</span>
      <span className={`text-xl font-mono font-bold ${mod >= 0 ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>{mod >= 0 ? `+${mod}` : mod}</span>
    </div>
    <button onClick={onToggle} disabled={isLocked} className={`w-full py-1 px-2 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-between font-serif ${data.prime ? 'bg-[#d97706] text-white hover:bg-[#b45309]' : 'bg-[#e7e5e4] text-[#57534e] hover:bg-[#d6d3d1]'} ${isLocked ? 'cursor-not-allowed opacity-90' : ''}`}>
      <span>{data.prime ? 'Prime' : 'Secondary'}</span>
      {isLocked && <Shield size={12} />}
    </button>
    <div className="mt-2 text-xs text-center border-t border-[#d6d3d1] pt-1 font-serif">
      <div className="text-[#57534e] uppercase text-[10px]">Base Check</div>
      <div className={`text-lg font-bold ${data.prime ? 'text-[#d97706]' : 'text-[#57534e]'}`}>{data.prime ? '12' : '18'}</div>
    </div>
  </div>
);

interface ReforgedBlockProps {
  text: string;
}

const ReforgedBlock = ({ text }: ReforgedBlockProps) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#fefce8] p-4 rounded-sm border-2 border-[#b45309] mt-6 font-mono text-xs text-[#451a03] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center mb-2 border-b border-[#b45309]/30 pb-2">
        <span className="font-bold text-[#b45309] uppercase tracking-widest font-serif">Reforged Canonical String</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-[#78350f] hover:text-[#b45309] transition-colors font-serif font-bold">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="leading-relaxed whitespace-pre-wrap break-words">{text}</p>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function CharacterForge() {
  const [state, dispatch] = useReducer(characterReducer, initialState);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        dispatch({type: 'SET_VIEW_MODE', payload: 'builder'});
      } else {
        dispatch({type: 'SET_VIEW_MODE', payload: 'split'});
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const currentStr = state.attributes.STR.score + (state.race.mods.STR || 0);
  const evCapacity = currentStr + 2;
  const currentEV = state.inventory.reduce((sum, item) => sum + item.ev, 0);
  const isOverburdened = currentEV > evCapacity;
  
  const bth = Math.floor(state.charClass.bthMod * state.level);
  const conMod = RULES.getMod(state.attributes.CON.score + (state.race.mods.CON || 0));
  const hp = Math.max(1, (state.charClass.hd + conMod) * state.level); 

  const tabs = [
    { id: 'origin', label: 'Concept', icon: <User size={18} /> },
    { id: 'stats', label: 'Siege Stats', icon: <Calculator size={18} /> },
    { id: 'spells', label: 'Grimoire', icon: <BookOpen size={18} />, hidden: !state.charClass.spells },
    { id: 'shop', label: 'Gear', icon: <Backpack size={18} /> },
    { id: 'treasure', label: 'Treasure', icon: <Gem size={18} /> },
  ].filter(t => !t.hidden);

  const saveCharacter = () => {
    const saveData = JSON.stringify(state);
    localStorage.setItem('cnc-forge-character', saveData);
    alert('Character saved to browser storage!');
  };

  const loadCharacter = () => {
    const saved = localStorage.getItem('cnc-forge-character');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const race = RULES.races.find(r => r.id === parsed.race?.id) || RULES.races[0];
        const charClass = RULES.classes.find(c => c.id === parsed.charClass?.id) || RULES.classes[0];
        dispatch({ type: 'LOAD_CHARACTER', payload: { ...parsed, race, charClass } });
      } catch {
        alert('Failed to load character data.');
      }
    } else {
      alert('No saved character found.');
    }
  };

  const treasureCategories = ['All', ...new Set(RULES.magicItems.map(i => i.cat))];

  return (
    <div className="flex flex-col h-screen bg-[#fdf6e3] text-[#292524] font-serif overflow-hidden selection:bg-[#fcd34d] selection:text-[#451a03]">
      
      {/* Header */}
      <header className="h-20 bg-[#1c1917] border-b-4 border-[#d97706] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-lg relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")'}}></div>
        
        <div className="flex items-center gap-3 sm:gap-6 relative z-10">
          <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <LogoTLG />
          </div>
          <div className="h-12 w-32 sm:h-14 sm:w-36 shrink-0 hidden md:block drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <LogoCNC />
          </div>
          
          <div className="h-10 w-px bg-[#44403c] mx-2 hidden md:block"></div>

          <div className="flex items-center gap-2 text-[#a8a29e]">
             <Hammer size={18} className="text-[#d97706]" />
             <span className="font-bold tracking-widest text-sm sm:text-base uppercase hidden sm:inline text-[#e7e5e4]" style={{textShadow: '2px 2px 0 #000'}}>The Forge</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 relative z-10">
           <div className="flex items-center bg-[#292524] rounded-sm border border-[#57534e] px-1 sm:px-2 py-1 shadow-inner">
             <span className="text-[10px] sm:text-xs text-[#a8a29e] mr-1 sm:mr-2 uppercase font-bold tracking-wider">Lvl</span>
             <button onClick={() => dispatch({type: 'LEVEL_DOWN'})} className="text-[#d6d3d1] hover:text-[#fbbf24] transition-colors"><ChevronDown size={14}/></button>
             <span className="w-6 sm:w-8 text-center font-bold text-[#fbbf24] text-base sm:text-lg font-mono">{state.level}</span>
             <button onClick={() => dispatch({type: 'LEVEL_UP'})} className="text-[#d6d3d1] hover:text-[#fbbf24] transition-colors"><ChevronUp size={14}/></button>
           </div>

           <div className="flex items-center bg-[#292524] rounded-sm border border-[#57534e] p-0.5 shadow-inner">
             <button 
                onClick={() => dispatch({type: 'SET_VIEW_MODE', payload: 'builder'})}
                title="Editor View"
                className={`p-1.5 rounded-sm transition-colors ${state.viewMode === 'builder' ? 'bg-[#d97706] text-white' : 'text-[#a8a29e] hover:text-white'}`}
             >
               <PenTool size={16}/>
             </button>
             <button 
                onClick={() => dispatch({type: 'SET_VIEW_MODE', payload: 'split'})}
                title="Split View"
                className={`hidden lg:block p-1.5 rounded-sm transition-colors ${state.viewMode === 'split' ? 'bg-[#d97706] text-white' : 'text-[#a8a29e] hover:text-white'}`}
             >
               <Layout size={16}/>
             </button>
             <button 
                onClick={() => dispatch({type: 'SET_VIEW_MODE', payload: 'sheet'})}
                title="View Sheet"
                className={`p-1.5 rounded-sm transition-colors ${state.viewMode === 'sheet' ? 'bg-[#d97706] text-white' : 'text-[#a8a29e] hover:text-white'}`}
             >
               <FileText size={16}/>
             </button>
           </div>

           <input 
             type="text" 
             value={state.name}
             onChange={(e) => dispatch({type: 'SET_FIELD', field: 'name', payload: e.target.value})}
             className="bg-[#292524] border border-[#57534e] rounded-sm px-2 sm:px-3 py-1 text-sm sm:text-base text-[#e7e5e4] focus:border-[#d97706] outline-none w-24 sm:w-32 md:w-64 text-center transition-all focus:w-32 sm:focus:w-48 md:focus:w-80 placeholder-[#57534e] font-serif font-bold shadow-inner"
             placeholder="Name"
           />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT: WORKBENCH */}
        <div className={`
            flex flex-col bg-[#f5f5f4] relative border-r-4 border-[#d6d3d1] transition-all duration-300 ease-in-out
            ${state.viewMode === 'sheet' ? 'hidden' : 'flex'}
            ${state.viewMode === 'split' ? 'w-full lg:w-3/5' : 'w-full'}
        `}>
          
          <div className="flex border-b-2 border-[#d6d3d1] bg-[#e7e5e4] shrink-0 shadow-sm overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => dispatch({type: 'SET_FIELD', field: 'activeTab', payload: tab.id})}
                className={`flex-1 py-4 px-2 min-w-fit flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest transition-all ${state.activeTab === tab.id ? 'bg-[#fdf6e3] text-[#b45309] border-b-4 border-[#b45309] -mb-0.5' : 'text-[#78716c] hover:bg-[#d6d3d1] hover:text-[#44403c]'}`}
              >
                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
            
            {/* 1. CONCEPT */}
            {state.activeTab === 'origin' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <section className="bg-white p-4 rounded-sm border border-[#d6d3d1] shadow-sm">
                   <h2 className="text-xl font-bold text-[#451a03] mb-4 flex items-center gap-2 border-b-2 border-[#fcd34d] pb-2">
                    <span className="bg-[#b45309] w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-mono shadow-sm">1</span>
                    Disposition
                  </h2>
                  <DispositionBuilder 
                    value={state.disposition}
                    onChange={(val) => dispatch({type: 'SET_FIELD', field: 'disposition', payload: val})}
                    charClass={state.charClass?.name}
                    deityDisposition={undefined} // Placeholder for future deity selection logic
                  />
                </section>

                <section className="bg-white p-4 rounded-sm border border-[#d6d3d1] shadow-sm">
                  <h2 className="text-xl font-bold text-[#451a03] mb-4 flex items-center gap-2 border-b-2 border-[#fcd34d] pb-2">
                    <span className="bg-[#b45309] w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-mono shadow-sm">2</span>
                    Ancestry
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {RULES.races.map(r => (
                      <button
                        key={r.id}
                        onClick={() => dispatch({type: 'SET_FIELD', field: 'race', payload: r})}
                        className={`text-left p-4 rounded-sm border-2 transition-all relative overflow-hidden group ${state.race.id === r.id ? 'border-[#b45309] bg-[#fffbeb] shadow-md' : 'border-[#e7e5e4] bg-[#fafaf9] hover:border-[#d6d3d1] hover:bg-white'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`font-bold font-serif text-lg ${state.race.id === r.id ? 'text-[#b45309]' : 'text-[#57534e]'}`}>{r.name}</span>
                          <div className="flex gap-1">
                            {Object.entries(r.mods).map(([attr, val]) => (
                              <span key={attr} className={`text-[10px] px-1.5 py-0.5 rounded-sm font-mono font-bold border ${val > 0 ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]' : 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]'}`}>{attr} {val>0?'+':''}{val}</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-[#78716c] mb-2 italic">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="bg-white p-4 rounded-sm border border-[#d6d3d1] shadow-sm">
                  <h2 className="text-xl font-bold text-[#451a03] mb-4 flex items-center gap-2 border-b-2 border-[#fcd34d] pb-2">
                    <span className="bg-[#b45309] w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-mono shadow-sm">3</span>
                    Class
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {RULES.classes.map(c => (
                      <button
                        key={c.id}
                        onClick={() => dispatch({type: 'SET_CLASS', payload: c})}
                        className={`text-left p-4 rounded-sm border-2 transition-all flex flex-col h-full ${state.charClass.id === c.id ? 'border-[#0369a1] bg-[#f0f9ff] shadow-md' : 'border-[#e7e5e4] bg-[#fafaf9] hover:border-[#d6d3d1] hover:bg-white'}`}
                      >
                        <div className="mb-2">
                          <span className={`font-bold block font-serif text-lg ${state.charClass.id === c.id ? 'text-[#0369a1]' : 'text-[#57534e]'}`}>{c.name}</span>
                          <span className="text-[10px] text-[#78716c] uppercase tracking-wide font-bold">HD: d{c.hd} • Prime: {c.reqPrime.join(', ')}</span>
                        </div>
                        <p className="text-xs text-[#78716c] mb-2 flex-1 italic">{c.desc}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* 2. STATS */}
            {state.activeTab === 'stats' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-[#292524] p-4 rounded-sm shadow-md flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-[#b45309]">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-8 opacity-90">
                        <LogoSiege />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#e7e5e4] leading-none font-serif tracking-wide">Attributes</h2>
                        <p className="text-xs text-[#a8a29e] mt-1 font-sans">Primes base 12. Others base 18.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-[#1c1917] p-1.5 rounded-sm border border-[#57534e]">
                    <select 
                      value={state.rollingMethod}
                      onChange={(e) => {
                        dispatch({type: 'SET_FIELD', field: 'rollingMethod', payload: e.target.value});
                        dispatch({type: 'RANDOMIZE_STATS'});
                      }}
                      className="bg-transparent text-sm font-bold text-[#fbbf24] outline-none p-1 font-serif cursor-pointer hover:text-[#fcd34d]"
                    >
                      <option value="3d6">Classic (3d6)</option>
                      <option value="4d6">Heroic (4d6 drop low)</option>
                      <option value="pointBuy">Point Buy (66 pts, min 3)</option>
                    </select>
                    {state.rollingMethod !== 'pointBuy' && (
                      <button onClick={() => dispatch({type: 'RANDOMIZE_STATS'})} className="p-1 text-[#a8a29e] hover:text-white transition-colors" title="Reroll">
                        <RefreshCw size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {state.rollingMethod === 'pointBuy' && (
                  <div className="text-center text-sm font-bold text-[#b45309] mb-2 bg-[#fffbeb] py-2 rounded-sm border border-[#fcd34d] shadow-sm">
                    <span className="text-[#78716c]">CKG Method Five:</span> Points Remaining: <span className="font-mono text-lg ml-2">{state.pointsRemaining}</span> <span className="text-xs text-[#a8a29e] ml-2">(of 48 distributable, min 3 per attr)</span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {RULES.attributes.map(attr => {
                    const baseScore = state.attributes[attr].score;
                    const racialMod = state.race.mods[attr as keyof RaceMod] || 0;
                    const totalScore = baseScore + racialMod;
                    return (
                      <div key={attr} className="bg-white rounded-sm p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border border-[#d6d3d1]">
                        <SiegeSwitch 
                          attr={attr} 
                          data={state.attributes[attr]} 
                          isLocked={state.charClass.reqPrime.includes(attr)}
                          mod={RULES.getMod(totalScore)}
                          onToggle={() => dispatch({type: 'TOGGLE_PRIME', payload: {attr}})}
                        />
                        <div className="mt-3 px-2 pb-2 flex items-center gap-2">
                           <button onClick={() => dispatch({type: 'UPDATE_ATTR_SCORE', payload: {attr, val: Math.max(3, baseScore - 1)}})} className="w-8 h-8 bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#57534e] rounded-sm flex items-center justify-center font-bold border border-[#d6d3d1] shadow-sm transition-colors">-</button>
                           <div className="flex-1 text-center font-bold text-[#292524] text-2xl font-mono">{totalScore}</div>
                           <button onClick={() => dispatch({type: 'UPDATE_ATTR_SCORE', payload: {attr, val: Math.min(19, baseScore + 1)}})} className="w-8 h-8 bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#57534e] rounded-sm flex items-center justify-center font-bold border border-[#d6d3d1] shadow-sm transition-colors">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SPELLS */}
            {state.activeTab === 'spells' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!state.charClass.spells ? (
                  <div className="bg-[#fef3c7] border-l-4 border-[#f59e0b] p-4 rounded-r-sm shadow-sm text-sm text-[#92400e]">
                    <h3 className="font-bold flex items-center gap-2 font-serif text-lg">No Spellcasting</h3>
                    <p className="opacity-80 mt-1">{state.charClass.name}s do not cast spells. Select a spellcasting class (Wizard, Cleric, Druid, or Illusionist) to access the Grimoire.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-[#faf5ff] border-l-4 border-[#9333ea] p-4 rounded-r-sm shadow-sm text-sm text-[#581c87] mb-4">
                      <h3 className="font-bold flex items-center gap-2 font-serif text-lg"><Scroll size={20}/> {state.charClass.name} Grimoire</h3>
                      <p className="opacity-80 mt-1 italic">Select spells for your {state.charClass.name}. Names use Reforged Canon.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[0,1,2,3,4,5,6,7,8,9].map(lvl => {
                        const spellsAtLevel = RULES.spells.filter(s => s.type === state.charClass.name && s.level === lvl).length;
                        if (spellsAtLevel === 0) return null;
                        return (
                          <button
                            key={lvl}
                            onClick={() => dispatch({type: 'SET_FIELD', field: 'spellLevelFilter', payload: lvl})}
                            className={`px-3 py-1.5 rounded-sm text-sm font-bold border transition-all ${state.spellLevelFilter === lvl ? 'bg-[#9333ea] text-white border-[#7e22ce]' : 'bg-white text-[#6b7280] border-[#d1d5db] hover:border-[#9333ea] hover:text-[#9333ea]'}`}
                          >
                            {lvl === 0 ? 'Cantrips' : `Level ${lvl}`} <span className="opacity-60">({spellsAtLevel})</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                      {RULES.spells
                        .filter(s => s.type === state.charClass.name && s.level === state.spellLevelFilter)
                        .map(spell => {
                          const known = state.knownSpells.some(k => k.name === spell.name);
                          return (
                            <button 
                              key={spell.name}
                              onClick={() => dispatch({type: known ? 'FORGET_SPELL' : 'LEARN_SPELL', payload: spell})}
                              className={`flex items-center justify-between p-3 rounded-sm border transition-all text-left group ${known ? 'bg-[#f3e8ff] border-[#d8b4fe] text-[#6b21a8] shadow-inner' : 'bg-white border-[#e5e7eb] text-[#4b5563] hover:border-[#d1d5db] hover:shadow-sm'}`}
                            >
                              <div>
                                <div className="font-bold text-sm font-serif">{spell.name}</div>
                                <div className="text-[10px] opacity-70 mt-0.5 font-sans">Level {spell.level}</div>
                              </div>
                              {known && <Check size={18} className="text-[#9333ea]" />}
                            </button>
                          );
                        })}
                    </div>
                    {state.knownSpells.length > 0 && (
                      <div className="mt-4 p-3 bg-[#f3e8ff] rounded-sm border border-[#d8b4fe]">
                        <div className="text-xs font-bold text-[#6b21a8] mb-2">Known Spells ({state.knownSpells.length})</div>
                        <div className="flex flex-wrap gap-1">
                          {state.knownSpells.map(s => (
                            <span key={s.name} className="text-xs bg-white px-2 py-1 rounded-sm border border-[#d8b4fe] text-[#581c87]">{s.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 4. SHOP */}
            {state.activeTab === 'shop' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#292524] p-4 rounded-sm border-b-4 border-[#d97706] sticky top-0 z-10 shadow-lg flex justify-between items-center text-[#e7e5e4]">
                  <div className="text-[#fbbf24] font-bold text-2xl font-serif">{state.gold} <span className="text-xs text-[#d97706] uppercase tracking-wider font-sans">gold in coin</span></div>
                  <div className="flex-1 ml-8 text-right">
                    <div className="text-xs text-[#a8a29e] mb-1 font-bold uppercase tracking-wider">Encumbrance (EV) <span className={isOverburdened ? 'text-[#ef4444]' : ''}>{currentEV} / {evCapacity}</span></div>
                    <div className="h-2 bg-[#1c1917] rounded-full w-full overflow-hidden border border-[#44403c]"><div className={`h-full transition-all ${isOverburdened ? 'bg-[#ef4444]' : 'bg-[#10b981]'}`} style={{width: `${Math.min(100, (currentEV/evCapacity)*100)}%`}}></div></div>
                  </div>
                </div>

                {RULES.classKits[state.charClass.id] && (
                  <div className="bg-[#f0f9ff] border border-[#0ea5e9] p-4 rounded-sm mb-4 flex justify-between items-center shadow-sm">
                    <div>
                      <h3 className="font-bold text-[#0c4a6e] flex items-center gap-2 font-serif text-lg"><Package size={20}/> {RULES.classKits[state.charClass.id].name}</h3>
                      <p className="text-xs text-[#0369a1] mt-1 italic">Includes standard starting gear for {state.charClass.name}.</p>
                    </div>
                    <button 
                      onClick={() => dispatch({type: 'BUY_KIT', payload: RULES.classKits[state.charClass.id]})}
                      disabled={state.gold < RULES.classKits[state.charClass.id].cost}
                      className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${state.gold < RULES.classKits[state.charClass.id].cost ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed' : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'}`}
                    >
                      Buy for {RULES.classKits[state.charClass.id].cost}
                    </button>
                  </div>
                )}

                {(['weapon', 'armor', 'shield', 'gear'] as const).map(cat => (
                  <div key={cat} className="mb-6">
                    <h3 className="text-xs font-bold uppercase text-[#78716c] mb-2 tracking-widest border-b border-[#d6d3d1] pb-1 font-serif">{cat}s</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {RULES.equipment.filter(i => i.type === cat).map(item => (
                        <button
                          key={item.id}
                          disabled={state.gold < item.cost}
                          onClick={() => dispatch({type: 'BUY_ITEM', payload: item})}
                          className={`flex justify-between items-center p-2.5 rounded-sm border transition-all text-sm group ${state.gold < item.cost ? 'opacity-50 bg-[#f5f5f4] border-[#e5e5e5] grayscale' : 'bg-white border-[#e7e5e4] hover:border-[#b45309] hover:shadow-sm'}`}
                        >
                          <div className="text-left">
                            <span className="font-bold text-[#292524] block font-serif text-base">{item.name}</span>
                            <span className="text-[10px] text-[#78716c] font-sans">EV {item.ev} • {item.cat}</span>
                          </div>
                          <span className="text-[#d97706] font-mono font-bold text-lg">{item.cost}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. TREASURE */}
            {state.activeTab === 'treasure' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#fef3c7] border-l-4 border-[#f59e0b] p-4 rounded-r-sm shadow-sm text-sm text-[#92400e] mb-4">
                  <h3 className="font-bold flex items-center gap-2 font-serif text-lg"><Gem size={20}/> Magic Item Hoard</h3>
                  <p className="opacity-80 mt-1 italic">Track your character&apos;s magical acquisitions. Items use Reforged canonical names.</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={saveCharacter} className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-sm text-sm font-bold shadow-sm transition-all">
                    <Save size={16}/> Save Character
                  </button>
                  <button onClick={loadCharacter} className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-sm text-sm font-bold shadow-sm transition-all">
                    <Upload size={16}/> Load Character
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {treasureCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => dispatch({type: 'SET_FIELD', field: 'treasureCategoryFilter', payload: cat})}
                      className={`px-3 py-1.5 rounded-sm text-sm font-bold border transition-all ${state.treasureCategoryFilter === cat ? 'bg-[#f59e0b] text-white border-[#d97706]' : 'bg-white text-[#6b7280] border-[#d1d5db] hover:border-[#f59e0b] hover:text-[#f59e0b]'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
                  {RULES.magicItems
                    .filter(item => state.treasureCategoryFilter === 'All' || item.cat === state.treasureCategoryFilter)
                    .map(item => {
                      const owned = state.magicItems.some(m => m.name === item.name);
                      return (
                        <button 
                          key={item.name}
                          onClick={() => {
                          if (owned) {
                            const idx = state.magicItems.findIndex(m => m.name === item.name);
                            dispatch({type: 'REMOVE_MAGIC_ITEM', payload: idx});
                          } else {
                            dispatch({type: 'ADD_MAGIC_ITEM', payload: item});
                          }
                        }}
                          className={`flex items-center justify-between p-3 rounded-sm border transition-all text-left group ${owned ? 'bg-[#fef3c7] border-[#fcd34d] text-[#92400e] shadow-inner' : 'bg-white border-[#e5e7eb] text-[#4b5563] hover:border-[#d1d5db] hover:shadow-sm'}`}
                        >
                          <div>
                            <div className="font-bold text-sm font-serif">{item.name}</div>
                            <div className="text-[10px] opacity-70 mt-0.5 font-sans">{item.cat}</div>
                          </div>
                          {owned && <Check size={18} className="text-[#f59e0b]" />}
                        </button>
                      );
                    })}
                </div>

                {state.magicItems.length > 0 && (
                  <div className="mt-4 p-3 bg-[#fef3c7] rounded-sm border border-[#fcd34d]">
                    <div className="text-xs font-bold text-[#92400e] mb-2 flex items-center gap-2"><Gem size={14}/> Owned Magic Items ({state.magicItems.length})</div>
                    <div className="space-y-1">
                      {state.magicItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded-sm border border-[#fcd34d] text-[#78350f]">
                          <span className="font-bold">{item.name}</span>
                          <button onClick={() => dispatch({type: 'REMOVE_MAGIC_ITEM', payload: idx})} className="text-[#dc2626] hover:text-[#b91c1c] p-1"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT: LIVE SHEET */}
        <div className={`
            flex flex-col border-[#292524] bg-[#fdf6e3] overflow-y-auto text-[#292524] font-serif relative transition-all duration-300 ease-in-out
            ${state.viewMode === 'builder' ? 'hidden' : 'flex'}
            ${state.viewMode === 'split' ? 'w-full lg:w-2/5 border-l-4' : 'w-full'}
        `}>
          <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-multiply" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")'}}></div>
          
          <div className="p-4 sm:p-8 min-h-full relative z-10 w-full">
            
            <div className="border-b-4 border-double border-[#292524] pb-4 mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight text-[#292524] leading-none" style={{textShadow: '1px 1px 0 #d6d3d1'}}>{state.name}</h1>
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-[#57534e] font-sans uppercase tracking-widest font-bold">
                <span>{state.race.name}</span>
                <span className="text-[#d97706]">•</span>
                <span>{state.charClass.name}</span>
                <span className="text-[#d97706]">•</span>
                <span>Level {state.level}</span>
                <span className="text-[#d97706]">•</span>
                <span className="text-[#b45309]">{state.disposition}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8 text-center font-sans">
              <div className="bg-[#292524] text-[#e7e5e4] p-2 sm:p-3 rounded-sm shadow-[3px_3px_0px_0px_#78716c]">
                <div className="text-2xl sm:text-3xl font-bold">{hp}</div>
                <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#d97706] mt-1">HP</div>
              </div>
              <div className="bg-white text-[#292524] p-2 sm:p-3 rounded-sm border-2 border-[#292524] shadow-[3px_3px_0px_0px_#a8a29e]">
                <div className="text-2xl sm:text-3xl font-bold">{10 + RULES.getMod(state.attributes.DEX.score + (state.race.mods.DEX||0)) + state.inventory.filter(i => i.type==='armor'||i.type==='shield').reduce((s,i)=>s+(i.ac||0),0)}</div>
                <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#78716c] mt-1">AC</div>
              </div>
              <div className="bg-white text-[#292524] p-2 sm:p-3 rounded-sm border-2 border-[#292524] shadow-[3px_3px_0px_0px_#a8a29e]">
                 <div className="text-2xl sm:text-3xl font-bold">{bth}</div>
                 <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#78716c] mt-1">BTH</div>
              </div>
              <div className="bg-white text-[#292524] p-2 sm:p-3 rounded-sm border-2 border-[#292524] shadow-[3px_3px_0px_0px_#a8a29e]">
                 <div className="text-2xl sm:text-3xl font-bold">{state.race.baseSpeed}</div>
                 <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#78716c] mt-1">Move</div>
              </div>
            </div>

            <div className="mb-8 border-2 border-[#292524] p-4 bg-white rounded-sm shadow-sm">
              <div className="flex justify-between items-center border-b-2 border-[#292524] mb-3 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#292524]">Siege Engine</h3>
                <div className="h-5 w-20 opacity-80">
                    <LogoSiege />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2 text-sm">
                {RULES.attributes.map(attr => {
                  const val = state.attributes[attr].score + (state.race.mods[attr as keyof RaceMod]||0);
                  const mod = RULES.getMod(val);
                  const totalBonus = mod + state.level;
                  const base = state.attributes[attr].prime ? 12 : 18;

                  return (
                    <div key={attr} className="flex justify-between items-center border-b border-dotted border-[#d6d3d1] last:border-0 py-1.5">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className={`w-2.5 h-2.5 rotate-45 ${state.attributes[attr].prime ? 'bg-[#d97706]' : 'bg-[#d6d3d1]'} border border-[#292524]`} />
                        <span className={`font-bold text-base ${state.attributes[attr].prime ? 'text-[#292524]' : 'text-[#78716c]'}`}>
                            {attr}
                        </span>
                        <span className="text-xs font-mono text-[#78716c]">[{state.attributes[attr].score}]</span>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-[#a8a29e] uppercase leading-none font-bold">Bonus</span>
                                <span className="font-mono font-bold text-[#292524] text-lg">
                                    {totalBonus >= 0 ? `+${totalBonus}` : totalBonus}
                                </span>
                            </div>

                            <div className="flex flex-col items-end w-8">
                                <span className="text-[9px] text-[#a8a29e] uppercase leading-none font-bold">Base</span>
                                <span className={`font-mono font-bold text-lg ${state.attributes[attr].prime ? 'text-[#d97706]' : 'text-[#a8a29e]'}`}>
                                    {base}
                                </span>
                            </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase border-b-2 border-[#292524] mb-3 pb-1 text-[#292524] tracking-widest">Attacks</h3>
              <div className="space-y-2">
                {state.inventory.filter(i=>i.type==='weapon').map(w => (
                  <div key={w.name} className="flex justify-between text-base bg-white p-2 border border-[#e7e5e4] shadow-sm">
                    <span className="font-bold text-[#451a03]">{w.name}</span>
                    <span className="font-mono font-bold text-[#292524]">{w.dmg}</span>
                  </div>
                ))}
                {state.inventory.filter(i=>i.type==='weapon').length===0 && <div className="text-sm italic text-[#78716c] p-2">Unarmed (1d2)</div>}
              </div>
            </div>

            {state.charClass.spells && RULES.spellSlots[state.charClass.id] && (
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase border-b-2 border-[#292524] mb-3 pb-1 text-[#292524] tracking-widest">Spell Slots</h3>
                <div className="flex flex-wrap gap-2">
                  {(RULES.spellSlots[state.charClass.id][Math.min(state.level, 5) - 1] || []).map((slots, lvl) => 
                    slots > 0 && (
                      <div key={lvl} className="bg-[#f3e8ff] border border-[#d8b4fe] px-3 py-1.5 rounded-sm text-center">
                        <div className="text-lg font-bold text-[#6b21a8]">{slots}</div>
                        <div className="text-[9px] uppercase font-bold text-[#9333ea]">{lvl === 0 ? 'Cantrip' : `Lvl ${lvl}`}</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {RULES.armorRestrictions[state.charClass.id] && RULES.armorRestrictions[state.charClass.id] !== 'Any' && (
              <div className="mb-4 text-xs text-[#78716c] italic">
                <span className="font-bold">Armor:</span> {RULES.armorRestrictions[state.charClass.id]}
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase border-b-2 border-[#292524] mb-3 pb-1 text-[#292524] tracking-widest">Equipment</h3>
              <p className="text-sm leading-relaxed text-[#292524] font-medium">
                {state.inventory.filter(i => i.type === 'armor' || i.type === 'shield').length > 0 && 
                  <>He wears <span className="font-bold">{state.inventory.filter(i => i.type === 'armor' || i.type === 'shield').map(i => i.name.toLowerCase()).join(', ')}</span>. </>
                }
                He carries {state.inventory.filter(i => i.type !== 'armor' && i.type !== 'shield').map(i => i.name.toLowerCase()).join(', ')}
                {state.inventory.length > 0 ? ', and ' : ''}<span className="text-[#b45309] font-bold">{state.gold} gold in coin</span>.
              </p>
            </div>
            
            {state.knownSpells.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase border-b-2 border-[#292524] mb-3 pb-1 text-[#292524] tracking-widest">Grimoire</h3>
                <div className="text-sm italic text-[#451a03] bg-[#fffbeb] p-3 border border-[#fcd34d] rounded-sm">
                  {state.knownSpells.map(s => s.name).join(', ')}
                </div>
              </div>
            )}

            <ReforgedBlock text={generateReforgedBlock(state)} />

          </div>
        </div>

      </div>
    </div>
  );
}
