// Debug ordinal conversion
const getSuperscriptOrdinal = (num) => {
  const n = parseInt(num);
  if (n % 10 === 1 && n % 100 !== 11) return 'ˢᵗ';
  if (n % 10 === 2 && n % 100 !== 12) return 'ⁿᵈ';
  if (n % 10 === 3 && n % 100 !== 13) return 'ʳᵈ';
  return 'ᵗʰ';
};

console.log('Testing ordinal conversion:');
console.log('4 -> superscript:', getSuperscriptOrdinal('4'));
console.log('Expected: ᵗʰ');

// Test with input "human, 4th level fighter"
const input = "human, 4th level fighter";
const match = input.match(/(\d+)(st|nd|rd|th|ⁿᵈ|ˢᵗ|ʳᵈ|ᵗʰ)/);
console.log('Input match:', match);

if (match) {
  const level = match[1];
  const originalOrdinal = match[2];
  const superscriptOrdinal = getSuperscriptOrdinal(level);

  console.log('Level:', level);
  console.log('Original ordinal:', originalOrdinal);
  console.log('Superscript ordinal:', superscriptOrdinal);

  const converted = input.replace(/(\d+)(st|nd|rd|th)/, `$1${superscriptOrdinal}`);
  console.log('Converted:', converted);
}