import { mouthsOfMadnessAnalysis } from './src/components/mocks/mouths-of-madness.mock';
import { analyzeFullDocument } from './src/lib/full-document-pipeline';
const doc = mouthsOfMadnessAnalysis.creatures.map(c=>c.rawMarkdown).join('\n\n');
const result = analyzeFullDocument(doc,'mock');
const werewolf = result.creatures.find(c => c.entryNumber === 67);
console.log('converted:', werewolf?.converted);
console.log('canonicalData:', werewolf?.canonicalData);
