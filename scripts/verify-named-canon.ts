#!/usr/bin/env tsx
import { mouthsOfMadnessAnalysis } from '../src/components/mocks/mouths-of-madness.mock';
import { processDumpWithValidation } from '../src/lib/npc-parser';

const named = ['Ember Raventree', 'Hub-Gub the Bloody', 'Wily Wil', 'The Little Hillwood Werewolf'];

function run() {
  const namedEntries = mouthsOfMadnessAnalysis.creatures.filter((c: any) => {
    const type = c.creatureType ?? '';
    return named.some((n) => type.includes(n));
  });

  const results = namedEntries.map((entry: any) => {
    const parsed = processDumpWithValidation(entry.rawMarkdown, true);
    return {
      type: entry.creatureType,
      raw: entry.rawMarkdown,
      processed: parsed,
    };
  });

  console.log('Found entries:', namedEntries.map((e: any) => e.creatureType));
  for (const r of results) {
    console.log('\n---\n', r.type);
    for (const p of r.processed) {
      console.log('Name:', p.name);
      console.log('Converted:', p.converted);
      console.log('CanonicalData:', JSON.stringify(p.canonicalData, null, 2));
    }
  }
}

run();
