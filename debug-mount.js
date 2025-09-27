// Debug mount extraction
import { extractMountFromParenthetical } from './src/lib/enhanced-parser.js';

const testInput = 'human fighter, HP 35, AC 18, rides heavy war horse HP 40, AC 19, 2 hooves 1d4';

console.log('Input:', testInput);

const result = extractMountFromParenthetical(testInput);
console.log('Mount extraction result:', JSON.stringify(result, null, 2));

// Test the MOUNT_TYPE_RE regex directly
const MOUNT_TYPE_RE = /\b(heavy|light)?\s*war\s*horse\b/i;
console.log('MOUNT_TYPE_RE test:', MOUNT_TYPE_RE.test(testInput));
console.log('MOUNT_TYPE_RE match:', MOUNT_TYPE_RE.exec(testInput));