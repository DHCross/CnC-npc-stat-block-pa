// Debug magic item bonus regex
const testString = "carries +1 sword";

// Current regex pattern
const verbBonusRegex = /\b(wears?|carries?|wields?)\s+\+(\d+)\s+([a-z\s]+(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;

console.log('Test string:', testString);
console.log('Regex pattern:', verbBonusRegex);
console.log('Test result:', verbBonusRegex.test(testString));

// Reset regex and try exec
verbBonusRegex.lastIndex = 0;
const match = verbBonusRegex.exec(testString);
console.log('Exec result:', match);

// Test individual parts
console.log('\nTesting individual parts:');
console.log('Verb part:', /\b(wears?|carries?|wields?)\s+/.test(testString));
console.log('Bonus part:', /\+(\d+)\s+/.test(testString));
console.log('Item part:', /([a-z\s]+(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/i.test(testString));

// Try simpler pattern
const simplePattern = /(wears?|carries?|wields?)\s+\+(\d+)\s+(sword|mail|armor|shield)/gi;
console.log('\nSimple pattern test:', simplePattern.test(testString));
simplePattern.lastIndex = 0;
console.log('Simple pattern exec:', simplePattern.exec(testString));