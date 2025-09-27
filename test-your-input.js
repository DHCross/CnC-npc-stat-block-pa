// Simple test script to verify the fix
const input = "Men-at-Arms, Bowmen x10 (these 2ⁿᵈ level human fighters' vital stats are HP 14, AC 12, disposition neutral. PA physical. they wear leather armor and carry longbows, longswords, belt axes, and carry 2–12 gold in coin. they carry medium steel shields.)";

console.log('Original Input:');
console.log(input);
console.log('\n=== Processing with Enhanced Parser ===');

// For testing, let's mock the functions to see what's happening
try {
  const { processDumpEnhanced } = require('./dist/lib/npc-parser.js');
  const result = processDumpEnhanced(input);
  console.log('✅ Enhanced Parser Result:');
  console.log('Name:', result[0].name);
  console.log('Converted:', result[0].converted);
} catch (error) {
  console.log('❌ Error:', error.message);
}