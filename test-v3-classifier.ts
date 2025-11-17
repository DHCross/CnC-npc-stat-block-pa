/**
 * Test Version 3.0 5-Step Classification Hierarchy
 * 
 * Validates classifyEntityV3() against known test cases
 */

import { classifyEntityV3, type SignalExtractionContext } from './src/lib/classification-rules';
import type { CanonicalData } from './src/lib/canonical-data-mapper';

// Test cases covering all 5 steps of the hierarchy
const testCases = [
  {
    name: 'STEP 1: Goblin Shaman (Spellcaster)',
    creature: 'Goblin Shaman',
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
      spells: 'cleric spells per day: 3/2/1'
    },
    expected: {
      format: 'A',
      reasoning: 'Spellcaster'
    }
  },
  {
    name: 'STEP 2a: Ember Raventree (Class Keyword)',
    creature: 'Ember Raventree',
    canonical: {
      name: 'Ember Raventree',
      level: '4th level fighter',
      hd: null,
      hp: 22,
      ac: 16,
      disposition: 'chaotic neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: '4th level fighter'
    },
    expected: {
      format: 'A',
      reasoning: 'Class: fighter'
    }
  },
  {
    name: 'STEP 2b: Orc Captain (Rank Title)',
    creature: 'Orc Captain',
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
    context: {},
    expected: {
      format: 'A',
      reasoning: 'Rank: captain'
    }
  },
  {
    name: 'STEP 2b: Bandit Lieutenant (Rank Title - bandit with rank)',
    creature: 'Bandit Lieutenant',
    canonical: {
      name: 'Bandit Lieutenant',
      level: null,
      hd: '2d8',
      hp: 14,
      ac: 14,
      disposition: 'neutral evil',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {},
    expected: {
      format: 'A',
      reasoning: 'Rank: lieutenant'
    }
  },
  {
    name: 'STEP 3: Marcus the Human Wizard (Named Humanoid with Class)',
    creature: 'Marcus',
    canonical: {
      name: 'Marcus',
      level: '5th level human wizard',
      hd: null,
      hp: 20,
      ac: 13,
      disposition: 'lawful good',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {
      raceClass: '5th level human wizard',
      spells: 'wizard spells'
    },
    expected: {
      format: 'A',
      reasoning: 'Spellcaster' // Spells takes priority over Named+Humanoid
    }
  },
  {
    name: 'STEP 4: Goblin Guards x 4 (Unit)',
    creature: 'Goblin Guards x 4',
    canonical: {
      name: 'Goblin Guards',
      level: null,
      hd: '1d8',
      hp: 4,
      ac: 14,
      disposition: 'lawful evil',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {},
    expected: {
      format: 'C',
      reasoning: 'Unit'
    }
  },
  {
    name: 'STEP 5: Ape, Carnivorous (Monster)',
    creature: 'Ape, carnivorous',
    canonical: {
      name: 'Ape',
      level: null,
      hd: '4d10',
      hp: 23,
      ac: 15,
      disposition: 'neutrality',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {},
    expected: {
      format: 'B',
      reasoning: 'Monster'
    }
  },
  {
    name: 'STEP 5: Wily Wil (Named Non-Humanoid - remains Monster)',
    creature: 'Wily Wil, Giant of the Hill',
    canonical: {
      name: 'Wily Wil',
      level: null,
      hd: '9d12',
      hp: 63,
      ac: 17,
      disposition: 'chaotic neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {},
    expected: {
      format: 'B',
      reasoning: 'Monster' // Named but not humanoid
    }
  },
  {
    name: 'STEP 5: Pinky the Owlbear (Named Non-Humanoid)',
    creature: 'Pinky the Owlbear',
    canonical: {
      name: 'Pinky',
      level: null,
      hd: '5d10',
      hp: 30,
      ac: 15,
      disposition: 'neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {},
    expected: {
      format: 'B',
      reasoning: 'Monster'
    }
  },
  {
    name: 'Override: Bandit (no rank - default to Monster)',
    creature: 'Bandit',
    canonical: {
      name: 'Bandit',
      level: null,
      hd: '1d6',
      hp: 4,
      ac: 13,
      disposition: 'neutral evil',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {},
    expected: {
      format: 'B',
      reasoning: 'Monster' // Bandit without rank is Monster
    }
  }
  ,
  {
    name: 'Regression: Elf, Wood, Bowman (generic monster with class keyword)',
    creature: 'Elf, Wood, Bowman',
    canonical: {
      name: 'Elf, Wood, Bowman',
      level: null,
      hd: '1d10',
      hp: 8,
      ac: 12,
      disposition: 'chaotic neutral',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {},
    expected: {
      format: 'B',
      reasoning: 'Monster'
    }
  },
  {
    name: 'Regression: Losel sub-chiefs x 10 (unit with HD)',
    creature: 'Losel sub-chiefs x 10',
    canonical: {
      name: 'Losel sub-chiefs',
      level: null,
      hd: '2d8+4',
      hp: 16,
      ac: 13,
      disposition: 'neutral evil',
      primaryAttributes: null,
      equipment: null,
      coins: null
    },
    context: {},
    expected: {
      format: 'C',
      reasoning: 'Unit'
    }
  }
];

console.log('=== Version 3.0 5-Step Classification Test ===\n');

let passed = 0;
let failed = 0;

testCases.forEach(testCase => {
  console.log(`Testing: ${testCase.name}`);
  
  const result = classifyEntityV3(
    testCase.creature,
    testCase.canonical as CanonicalData,
    testCase.context
  );
  
  const errors: string[] = [];
  
  // Check format
  if (result.format !== testCase.expected.format) {
    errors.push(`  ✗ Format: expected ${testCase.expected.format}, got ${result.format}`);
  }
  
  // Check reasoning contains expected keywords
  if (!result.reasoning.toLowerCase().includes(testCase.expected.reasoning.toLowerCase())) {
    errors.push(`  ✗ Reasoning: expected to contain "${testCase.expected.reasoning}", got "${result.reasoning}"`);
  }
  
  if (errors.length === 0) {
    console.log(`  ✓ Format ${result.format}: ${result.reasoning}`);
    passed++;
  } else {
    console.log(errors.join('\n'));
    console.log(`  Got: Format ${result.format}: ${result.reasoning}`);
    failed++;
  }
  console.log('');
});

console.log('=== Results ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed > 0) {
  process.exit(1);
}
