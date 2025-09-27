// Test our specific fixes
import { normalizeAttributes, canonicalizeShields, repositionMagicItemBonuses, normalizeEquipmentVerbs } from './src/lib/enhanced-parser.js';

console.log('Testing fixes:');

// Test PA physical
console.log('\n1. PA Physical normalization:');
console.log('normalizeAttributes("str, dex, con", true):', normalizeAttributes("str, dex, con", true));
console.log('Expected: "PA physical"');

// Test shield canonicalization
console.log('\n2. Shield canonicalization:');
console.log('canonicalizeShields("steel shield"):', canonicalizeShields("steel shield"));
console.log('Expected: "medium steel shield"');

// Test magic item bonus repositioning
console.log('\n3. Magic item bonus repositioning:');
console.log('repositionMagicItemBonuses("+2 shield"):', repositionMagicItemBonuses("+2 shield"));
console.log('Expected: "shield +2"');

console.log('repositionMagicItemBonuses("+1 longsword, +2 shield, +3 lance"):', repositionMagicItemBonuses("+1 longsword, +2 shield, +3 lance"));
console.log('Expected: "longsword +1, shield +2, lance +3"');

// Test equipment verb normalization
console.log('\n4. Equipment verb normalization:');
console.log('normalizeEquipmentVerbs("carries longsword"):', normalizeEquipmentVerbs("carries longsword"));
console.log('Expected: "carry longsword"');

console.log('normalizeEquipmentVerbs("wears armor"):', normalizeEquipmentVerbs("wears armor"));
console.log('Expected: "wear armor"');