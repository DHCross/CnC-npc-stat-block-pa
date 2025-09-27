// Debug leading bonus regex
const testString = "+1 longsword";

// Our current regex
const LEADING_BONUS_RE = /\+(\d+)\s+((?:\w+\s+)*(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;

console.log('Test string:', testString);
console.log('Regex test:', LEADING_BONUS_RE.test(testString));

LEADING_BONUS_RE.lastIndex = 0;
const match = LEADING_BONUS_RE.exec(testString);
console.log('Regex exec:', match);

// Let's test the item part specifically
const itemPattern = /((?:\w+\s+)*(?:sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;
console.log('Item pattern test:', itemPattern.test("longsword"));

itemPattern.lastIndex = 0;
console.log('Item pattern exec:', itemPattern.exec("longsword"));

// The issue might be that "longsword" needs to be handled
// Let's add "longsword" to our pattern
const fixedPattern = /\+(\d+)\s+((?:\w+\s+)*(?:longsword|sword|mail|armor|shield|lance|dagger|mace|axe|bow|crossbow|staff|rod|wand|ring|robe|cloak|boots|gauntlets|helm|bracers|pectoral))/gi;
console.log('Fixed pattern test:', fixedPattern.test(testString));

fixedPattern.lastIndex = 0;
console.log('Fixed pattern exec:', fixedPattern.exec(testString));