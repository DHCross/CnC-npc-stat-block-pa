// Quick test to verify our parser changes are working correctly
import { collapseNPCEntry } from './src/lib/npc-parser.ts';

const testNPC = `**Victor Oldham, High Priest**

Disposition: lawful good
Race & Class: human, 16th level cleric
Hit Points (HP): 59
Armor Class (AC): 13/22
Prime Attributes (PA): Strength, Wisdom, Charisma
Equipment: pectoral of protection +3, full plate mail, shield, staff of striking, mace
Spells: 0–6, 1st–6, 2nd–5, 3rd–5, 4th–4, 5th–4, 6th–3, 7th–3, 8th–2
Mount: heavy war horse`;

console.log('Input NPC:');
console.log(testNPC);
console.log('\n=== Converted Output ===');

try {
  const result = collapseNPCEntry(testNPC);
  console.log(result);
} catch (error) {
  console.error('Error:', error);
}