import { convertLegacySpellText } from './src/lib/spell-converter.ts';
import { readFileSync } from 'fs';

const runesFile = readFileSync('./Spell Converter/01 The Runes of the Initiate.txt', 'utf-8');
console.log('Converting Runes of the Initiate...\n');

const results = convertLegacySpellText(runesFile);

console.log(`Total spells found: ${results.length}\n`);

results.forEach((spell, idx) => {
  console.log(`\n=== SPELL ${idx + 1}: ${spell.name} ===`);
  console.log(`Canonical Name: ${spell.canonicalName || 'N/A'}`);
  console.log(`Original Name: ${spell.originalName || 'N/A'}`);
  
  if (spell.metadata) {
    console.log(`Metadata: ${spell.metadata}`);
  }
  
  console.log('\nStatistics:');
  console.log(`  CT: ${spell.statistics.castingTime || 'missing'}`);
  console.log(`  R: ${spell.statistics.range || 'missing'}`);
  console.log(`  D: ${spell.statistics.duration || 'missing'}`);
  console.log(`  SV: ${spell.statistics.savingThrow || 'missing'}`);
  console.log(`  SR: ${spell.statistics.spellResistance || 'missing'}`);
  console.log(`  Comp: ${spell.statistics.components || 'missing'}`);
  
  console.log(`\nDescription length: ${spell.description?.length || 0} chars`);
  console.log(`Effect length: ${spell.effect?.length || 0} chars`);
  
  if (spell.warnings.length > 0) {
    console.log(`\nWarnings (${spell.warnings.length}):`);
    spell.warnings.forEach(w => console.log(`  - ${w}`));
  }
});

console.log('\n\n=== SUMMARY ===');
const withWarnings = results.filter(r => r.warnings.length > 0).length;
const withoutCanonical = results.filter(r => !r.canonicalName).length;
console.log(`Spells with warnings: ${withWarnings}/${results.length}`);
console.log(`Spells without canonical names: ${withoutCanonical}/${results.length}`);
