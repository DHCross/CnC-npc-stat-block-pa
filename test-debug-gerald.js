import { extractParentheticalData } from './src/lib/enhanced-parser.ts';

const parenthetical = 'He is a neutral evil, human, 4th/5th level fighter/assassin whose vital stats are: HP 28, AC 12. His prime attributes are: str, dex, int. He has a secondary skill of: bullying. He carries leather armor, long sword and dagger.';

const data = extractParentheticalData(parenthetical, false, 'Gerald "Grins" Farmer, lesser bully');

console.log('Extracted data:', JSON.stringify(data, null, 2));
