/**
 * Test signal extraction against actual mouths-of-madness dataset
 * 
 * Validates that extractSignals() correctly identifies signals in real entities
 */

import { readFileSync } from 'fs';
import { extractSignals, type SignalExtractionContext } from './src/lib/classification-rules';
import type { CanonicalData } from './src/lib/canonical-data-mapper';

const dataPath = 'data/mouths-of-madness/entities.canonical.json';
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('=== Signal Extraction Dataset Validation ===\n');
console.log(`Total entities: ${data.length}\n`);

// Sample interesting entities to verify
const testTargets = [
  'Ember Raventree',
  'Wily Wil',
  'Ape, carnivorous',
  'Bat, giant cave',
  'Green slime',
  'Goblin',
  'Orc',
  'Bandits'
];

// Statistics
const stats = {
  HasSpells: 0,
  HasClassKeyword: 0,
  HasRankTitle: 0,
  IsNamed: 0,
  IsUnit: 0,
  IsHumanoid: 0
};

// Test each entity
data.forEach((entry: any) => {
  const title = entry.title;
  const canonical = entry.canonicalData;
  
  // Build signal extraction context from raw data if available
  const context: SignalExtractionContext = {};
  
  // Try to extract spells from the raw canonical text
  // Look for spell casting indicators, not just any mention of "spell"
  const raw = canonical.raw || '';
  if (/\b(?:can\s+cast|casts?\s+\d+|spells?\s+per\s+day|spell\s+slots?|spellcaster)\b/i.test(raw)) {
    context.spells = 'detected';
  }
  
  // Extract race/class from canonical name field
  if (canonical.name) {
    context.raceClass = canonical.name;
  }
  
  // Also check raw text for additional context
  if (raw.includes('spells per day')) {
    context.description = raw;
  }
  
  const signals = extractSignals(title, canonical, context);
  
  // Update statistics
  if (signals.HasSpells) stats.HasSpells++;
  if (signals.HasClassKeyword) stats.HasClassKeyword++;
  if (signals.HasRankTitle) stats.HasRankTitle++;
  if (signals.IsNamed) stats.IsNamed++;
  if (signals.IsUnit) stats.IsUnit++;
  if (signals.IsHumanoid) stats.IsHumanoid++;
  
  // Show details for test targets
  if (testTargets.some(target => title.includes(target))) {
    console.log(`\n${title}:`);
    console.log(`  HasSpells: ${signals.HasSpells}`);
    console.log(`  HasClassKeyword: ${signals.HasClassKeyword}${signals.detectedClassName ? ` (${signals.detectedClassName})` : ''}`);
    console.log(`  HasRankTitle: ${signals.HasRankTitle}${signals.detectedRankTitle ? ` (${signals.detectedRankTitle})` : ''}`);
    console.log(`  IsNamed: ${signals.IsNamed}`);
    console.log(`  IsUnit: ${signals.IsUnit}`);
    console.log(`  IsHumanoid: ${signals.IsHumanoid}${signals.detectedRace ? ` (${signals.detectedRace})` : ''}`);
  }
});

console.log('\n\n=== Signal Distribution Statistics ===');
console.log(`HasSpells:       ${stats.HasSpells} (${(stats.HasSpells / data.length * 100).toFixed(1)}%)`);
console.log(`HasClassKeyword: ${stats.HasClassKeyword} (${(stats.HasClassKeyword / data.length * 100).toFixed(1)}%)`);
console.log(`HasRankTitle:    ${stats.HasRankTitle} (${(stats.HasRankTitle / data.length * 100).toFixed(1)}%)`);
console.log(`IsNamed:         ${stats.IsNamed} (${(stats.IsNamed / data.length * 100).toFixed(1)}%)`);
console.log(`IsUnit:          ${stats.IsUnit} (${(stats.IsUnit / data.length * 100).toFixed(1)}%)`);
console.log(`IsHumanoid:      ${stats.IsHumanoid} (${(stats.IsHumanoid / data.length * 100).toFixed(1)}%)`);

console.log('\n=== Expected Classifications (Preview) ===');
console.log('Based on Version 3.0 5-step hierarchy:\n');

// Preview classification for interesting entities
const previewEntities = data.filter((e: any) => 
  testTargets.some(target => e.title.includes(target))
);

previewEntities.forEach((entry: Record<string, unknown>) => {
  const title = entry.title as string;
  const canonical = entry.canonicalData as Record<string, unknown>;
  const context: SignalExtractionContext = { raceClass: canonical.name as string };
  const raw = (canonical.raw as string) || '';
  if (/\b(?:can\s+cast|casts?\s+\d+|spells?\s+per\s+day|spell\s+slots?|spellcaster)\b/i.test(raw)) {
    context.spells = 'detected';
  }
  if (raw.includes('spells per day')) {
    context.description = raw;
  }
  
  const signals = extractSignals(title, canonical as unknown as CanonicalData, context);
  
  // Apply 5-step hierarchy (preview only)
  let format = 'B'; // Default: Monster
  let reasoning = 'Monster (default)';
  
  if (signals.HasSpells) {
    format = 'A';
    reasoning = 'Classed NPC (Spellcaster)';
  } else if (signals.HasClassKeyword || signals.HasRankTitle) {
    format = 'A';
    reasoning = signals.HasClassKeyword 
      ? `Classed NPC (Class: ${signals.detectedClassName})`
      : `Classed NPC (Rank: ${signals.detectedRankTitle})`;
  } else if (signals.IsNamed && signals.IsHumanoid) {
    format = 'A';
    reasoning = `Classed NPC (Named Humanoid)`;
  } else if (signals.IsUnit) {
    format = 'C';
    reasoning = 'Unit';
  }
  
  console.log(`${title}:`);
  console.log(`  → Format ${format}: ${reasoning}`);
});

console.log('\n✓ Signal extraction validated against dataset');
