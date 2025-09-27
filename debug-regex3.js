// Test the corrected regex pattern
const testString = "carries +1 sword";

// The problem is the [a-z\s]+ pattern - it should be more specific
// Current broken pattern:
const brokenPattern = /\b(wears?|carries?|wields?)\s+\+(\d+)\s+([a-z\s]+(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;

// Fixed pattern - remove the [a-z\s]+ and just match the item names directly
const fixedPattern = /\b(wears?|carries?|wields?)\s+\+(\d+)\s+((?:\w+\s+)*(sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;

// Even simpler - just match the core items with optional adjectives
const simplestPattern = /(wears?|carries?|wields?)\s+\+(\d+)\s+((?:\w+\s+)*(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;

console.log('Test string:', testString);
console.log('Broken pattern result:', brokenPattern.exec(testString));

brokenPattern.lastIndex = 0;
fixedPattern.lastIndex = 0;
simplestPattern.lastIndex = 0;

console.log('Fixed pattern result:', fixedPattern.exec(testString));
console.log('Simplest pattern result:', simplestPattern.exec(testString));

// Test the replacement
const testReplacement = (pattern, input) => {
  pattern.lastIndex = 0;
  return input.replace(pattern, (match, verb, bonus, item) => {
    console.log(`Match: "${match}", Verb: "${verb}", Bonus: "${bonus}", Item: "${item}"`);
    return `${verb} ${item} +${bonus}`;
  });
};

console.log('\nTesting replacements:');
console.log('Simplest pattern replacement:', testReplacement(simplestPattern, testString));