const { processDumpEnhanced } = require('./dist/lib/npc-parser.js');
const fs = require('fs');

const input = fs.readFileSync('./test-input.txt', 'utf8');
console.log('Input:');
console.log(input);
console.log('\nProcessed:');
const result = processDumpEnhanced(input);
console.log('Converted:', result[0].converted);
console.log('Original fields:', JSON.stringify(result[0], null, 2));