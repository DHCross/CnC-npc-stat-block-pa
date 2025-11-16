import { splitTitleAndBody, extractParentheticalData } from './src/lib/enhanced-parser';
import { processDumpWithValidation } from './src/lib/npc-parser';
import { enrichParentheticalData } from './src/lib/npc-parser';
import { buildCanonicalParenthetical } from './src/lib/enhanced-parser';
import { isRankedNamedEntity } from './src/lib/stat-block-helpers';
import { mouthsOfMadnessAnalysis } from './src/components/mocks/mouths-of-madness.mock';

const emberRaw = mouthsOfMadnessAnalysis.creatures.find((c: any) => c.entryNumber === 55)?.rawMarkdown;
if (!emberRaw) { console.error('ember not found'); process.exit(1); }

// Simulate the pipeline's pre-processing: the header/title line is removed
// before we call parseBlockEnhanced in the pipeline.
const block = emberRaw.split('\n').slice(1).join('\n');
const { title, parentheticals } = splitTitleAndBody(block);
console.log('Title:', title);
console.log('Parentheticals:', parentheticals);

	const findRegex = /\b(HP|H\s*P|Hit Points|vital stats|AC|HD|Primary attributes|primary attributes|PA|attributes|significant attributes|race,|level)\b/i;
	let statLikeParen = parentheticals.find(p => findRegex.test(p));
	console.log('Find Regex on parenthetical matches?', parentheticals.map(p => Boolean(findRegex.test(p))));
if (!statLikeParen) {
	const bodyHas = /\b(HP|H\s*P|Hit Points|vital stats|AC|HD|Primary attributes|attributes|PA|significant attributes|race,|level)\b/i.test(emberRaw);
	console.log('bodyHasMatches? ', bodyHas);
	if (bodyHas) {
		statLikeParen = emberRaw;
	} else {
		statLikeParen = parentheticals[0];
	}
}
console.log('Selected parenthetical:', statLikeParen);

const data = extractParentheticalData(statLikeParen, false, title);
console.log('Extracted Data:', data);

// enrichParentheticalData is only exported in npc-parser; we can't import directly as it's local
// but we can mimic the function: for now, call buildCanonicalParenthetical directly
const canonical = buildCanonicalParenthetical(data, false, false, true, title);
console.log('Canonical:', canonical);
console.log('isRankedNamedEntity ->', isRankedNamedEntity(title, data));

// Now process the block through the usual pipeline call used in the full-document step
const lines = emberRaw.split('\n').slice(1).join('\n');
const processed = processDumpWithValidation(lines, true, 'monster');
console.log('Processed via pipeline conversion:', processed[0]?.converted);
