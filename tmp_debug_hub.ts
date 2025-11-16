import { mouthsOfMadnessAnalysis } from './src/components/mocks/mouths-of-madness.mock';
import { parseMonsterBlockWithHeuristics, parseMonsterBlock } from './src/lib/monster-parser';
const entry = mouthsOfMadnessAnalysis.creatures.find(c => c.entryNumber === 123);
if (!entry) { console.log('not found'); process.exit(1); }
const lines = entry.rawMarkdown.split('\n').slice(1).join('\n');
console.log('Lines:', lines);
const parsed0 = parseMonsterBlock(lines);
console.log('parseMonsterBlock fields:', parsed0.fields);
const parsed1 = parseMonsterBlockWithHeuristics(lines, entry.creatureType);
console.log('parseMonsterBlockWithHeuristics fields:', parsed1.fields);
