// Debug shield canonicalization issue
const input = "steel shield";

console.log('Input:', input);

// Simulate the steps in canonicalizeShields
let result = input;

// First pass: Handle bonus shields
console.log('After bonus shields pass:', result);

// Second pass: Handle material-only shields (add size)
result = result.replace(/\b(wooden|steel|iron)\s+shield(?!\s*\+)/gi, 'medium $1 shield');
console.log('After material-only pass:', result);

// Third pass: Handle bare "shield" (add both size and material)
result = result.replace(/\b(?:a\s+|an\s+)?shield(?!\s*\+)(?!\s+\w)/gi, 'medium steel shield');
console.log('After bare shield pass:', result);

// Fourth pass: Handle buckler and pavis
result = result.replace(/\b(?:wooden|steel|iron)\s+(buckler|pavis)/gi, '$1');
console.log('Final result:', result);

// Test the bare shield regex on the intermediate result
const intermediateResult = "medium steel shield";
const bareShieldRegex = /\b(?:a\s+|an\s+)?shield(?!\s*\+)(?!\s+\w)/gi;
console.log('\nTesting bare shield regex on intermediate result:');
console.log('Regex test:', bareShieldRegex.test(intermediateResult));
console.log('Regex exec:', bareShieldRegex.exec(intermediateResult));