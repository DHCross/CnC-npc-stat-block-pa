import { analyzeFullDocument } from './src/lib/full-document-pipeline';
import { mouthsOfMadnessAnalysis } from './src/components/mocks/mouths-of-madness.mock';

const doc = mouthsOfMadnessAnalysis.creatures.map((c) => c.rawMarkdown).join('\n\n');
const result = analyzeFullDocument(doc, 'mock');
const ember = result.creatures.find((c) => c.entryNumber === 55);
console.log('Ember:\n', ember?.converted);
const hub = result.creatures.find((c) => c.entryNumber === 123);
console.log('\nHub-Gub:\n', hub?.converted);
const werewolf = result.creatures.find((c) => c.creatureType?.includes('Little Hillwood Werewolf'));
console.log('\nWerewolf:\n', werewolf?.converted);
const wil = result.creatures.find((c) => c.creatureType?.includes('Wily Wil'));
console.log('\nWily Wil:\n', wil?.converted);
