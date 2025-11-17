/**
 * Test script for Version 3.0 Signal Extraction
 * 
 * Validates the six core signals against sample entities:
 * - HasSpells
 * - HasClassKeyword
 * - HasRankTitle
 * - IsNamed
 * - IsUnit
 * - IsHumanoid
 */

import { extractSignals, type SignalExtractionContext } from './src/lib/classification-rules';
import type { CanonicalData } from './src/lib/canonical-data-mapper';

// Test cases covering various signal combinations
const testCases = [
  {
    name: 'Ember Raventree',
    canonical: {
      name: 'Ember Raventree',
      level: '4th level human fighter',
      hd: null,
      hp: 22,
      ac: 16,
      disposition: 'chaotic neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: '4th level human fighter',
      spells: undefined
    },
    expected: {
      HasSpells: false,
      HasClassKeyword: true,  // fighter
      HasRankTitle: false,
      IsNamed: true,          // Ember Raventree
      IsUnit: false,
      IsHumanoid: true        // human
    }
  },
  {
    name: 'Goblin Shaman',
    canonical: {
      name: 'Goblin Shaman',
      level: null,
      hd: '3d8',
      hp: 15,
      ac: 14,
      disposition: 'chaotic evil',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: 'Goblin Shaman',
      spells: '1st level: cure light wounds, protection from evil'
    },
    expected: {
      HasSpells: true,        // has spell list
      HasClassKeyword: false,
      HasRankTitle: true,     // shaman
      IsNamed: false,
      IsUnit: false,
      IsHumanoid: false       // goblin is monster race
    }
  },
  {
    name: 'Bandits (x4)',
    canonical: {
      name: 'Bandits (x4)',
      level: null,
      hd: '1d8',
      hp: 4,
      ac: 12,
      disposition: 'chaotic neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: 'Bandits',
      spells: undefined
    },
    expected: {
      HasSpells: false,
      HasClassKeyword: false,
      HasRankTitle: false,
      IsNamed: false,
      IsUnit: true,           // (x4)
      IsHumanoid: false
    }
  },
  {
    name: 'Bandit Captain',
    canonical: {
      name: 'Bandit Captain',
      level: '3rd level fighter',
      hd: null,
      hp: 18,
      ac: 15,
      disposition: 'chaotic neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: '3rd level fighter',
      spells: undefined
    },
    expected: {
      HasSpells: false,
      HasClassKeyword: true,  // fighter
      HasRankTitle: true,     // captain
      IsNamed: false,
      IsUnit: false,
      IsHumanoid: false
    }
  },
  {
    name: 'Wily Wil, Giant of the Hill',
    canonical: {
      name: 'Wily Wil, Giant of the Hill',
      level: null,
      hd: '9d12',
      hp: 63,
      ac: 17,
      disposition: 'chaotic neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: 'Wily Wil',
      spells: undefined
    },
    expected: {
      HasSpells: false,
      HasClassKeyword: false,
      HasRankTitle: false,
      IsNamed: true,          // Wily Wil
      IsUnit: false,
      IsHumanoid: false       // giant, not PC race
    }
  },
  {
    name: 'Pinky the Owlbear',
    canonical: {
      name: 'Pinky the Owlbear',
      level: null,
      hd: '5d10',
      hp: 30,
      ac: 15,
      disposition: 'neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: 'Owlbear',
      spells: undefined
    },
    expected: {
      HasSpells: false,
      HasClassKeyword: false,
      HasRankTitle: false,
      IsNamed: true,          // Pinky
      IsUnit: false,
      IsHumanoid: false       // owlbear is monster
    }
  },
  {
    name: 'Orc Captain',
    canonical: {
      name: 'Orc Captain',
      level: null,
      hd: '3d8',
      hp: 15,
      ac: 16,
      disposition: 'chaotic evil',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: 'Orc Captain',
      spells: undefined
    },
    expected: {
      HasSpells: false,
      HasClassKeyword: false,
      HasRankTitle: true,     // captain
      IsNamed: false,
      IsUnit: false,
      IsHumanoid: false       // orc is monster race
    }
  },
  {
    name: 'Marcus the Wizard',
    canonical: {
      name: 'Marcus the Wizard',
      level: '5th level wizard',
      hd: null,
      hp: 20,
      ac: 13,
      disposition: 'lawful good',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: '5th level wizard',
      spells: '1st: magic missile, shield; 2nd: web, invisibility; 3rd: fireball'
    },
    expected: {
      HasSpells: true,        // has spell list
      HasClassKeyword: true,  // wizard
      HasRankTitle: false,
      IsNamed: true,          // Marcus
      IsUnit: false,
      IsHumanoid: false       // no explicit race mentioned
    }
  }
];

console.log('=== Version 3.0 Signal Extraction Test ===\n');

let passed = 0;
let failed = 0;

testCases.forEach(testCase => {
  console.log(`Testing: ${testCase.name}`);
  
  const signals = extractSignals(
    testCase.name,
    testCase.canonical as CanonicalData,
    testCase.context
  );
  
  const errors: string[] = [];
  
  // Check each signal
  Object.keys(testCase.expected).forEach(signalKey => {
    const expected = (testCase.expected as any)[signalKey];
    const actual = (signals as any)[signalKey];
    
    if (expected !== actual) {
      errors.push(`  ✗ ${signalKey}: expected ${expected}, got ${actual}`);
    }
  });
  
  if (errors.length === 0) {
    console.log('  ✓ All signals correct');
    passed++;
  } else {
    console.log(errors.join('\n'));
    failed++;
  }
  
  // Show detected context
  if (signals.detectedClassName || signals.detectedRankTitle || signals.detectedRace) {
    const context: string[] = [];
    if (signals.detectedClassName) context.push(`class: ${signals.detectedClassName}`);
    if (signals.detectedRankTitle) context.push(`rank: ${signals.detectedRankTitle}`);
    if (signals.detectedRace) context.push(`race: ${signals.detectedRace}`);
    console.log(`  Context: ${context.join(', ')}`);
  }
  
  console.log('');
});

console.log('=== Results ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed > 0) {
  process.exit(1);
}
