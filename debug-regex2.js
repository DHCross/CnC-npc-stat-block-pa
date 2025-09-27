// Debug the complex character class issue
const testString = "carries +1 sword";

// Test the item part with different approaches
console.log('Test string:', testString);

// Original complex pattern
const complexItemPattern = /([a-z\s]+(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/i;
console.log('Complex item pattern test:', complexItemPattern.test(testString));
console.log('Complex item pattern exec:', complexItemPattern.exec(testString));

// The issue might be the [a-z\s]+ part - it might be too greedy or not matching correctly
// Let's test without the character class
const simpleItemPattern = /(sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral)/i;
console.log('Simple item pattern test:', simpleItemPattern.test(testString));
console.log('Simple item pattern exec:', simpleItemPattern.exec(testString));

// Test with word boundary
const wordBoundaryPattern = /(\w+(?:\s+\w+)*(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/i;
console.log('Word boundary pattern test:', wordBoundaryPattern.test(testString));
console.log('Word boundary pattern exec:', wordBoundaryPattern.exec(testString));

// Let's see what the [a-z\s]+ is actually matching
const charClassPattern = /[a-z\s]+/i;
console.log('Char class pattern matches:', charClassPattern.exec(testString));