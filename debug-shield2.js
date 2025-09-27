// Debug the shield function replacement logic
const input = "steel shield";

console.log('Testing shield function:');

// Simulate the replacement logic
const before = "steel shield".substring(Math.max(0, 6 - 20), 6); // offset 6 for "shield"
console.log('Before substring:', before);
console.log('Regex test:', /\b(medium|large|small)\s+(wooden|steel|iron)$/i.test(before));

// The issue is the regex isn't matching "steel " (with space) at the end
const before2 = "steel ";
console.log('Testing "steel ":', /\b(medium|large|small)\s+(wooden|steel|iron)$/i.test(before2));

// Try a different approach - match the material directly before shield
const testString = "steel shield";
const hasPrefix = /\b(wooden|steel|iron)\s+shield$/i.test(testString);
console.log('Has material prefix:', hasPrefix);