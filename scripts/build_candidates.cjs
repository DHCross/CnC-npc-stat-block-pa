#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_SCOPE = process.env.DATA_SCOPE || 'mouths-of-madness';
const dataDir = path.join(__dirname, '..', 'data', DATA_SCOPE);
const parsedPath = path.join(dataDir, 'entities.parsed.json');
const outPath = path.join(dataDir, 'entities.candidates.json');

if (!fs.existsSync(parsedPath)) {
  console.error('Missing parsed data:', parsedPath);
  process.exit(2);
}

const parsed = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));
const candidates = parsed.filter(entry => typeof entry.hp === 'number' && typeof entry.ac === 'number');

fs.writeFileSync(outPath, JSON.stringify(candidates, null, 2));
console.log(`Wrote ${outPath} with ${candidates.length} candidates (from ${parsed.length} parsed entries).`);
