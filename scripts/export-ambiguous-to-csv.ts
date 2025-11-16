#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const IN = path.join(process.cwd(), 'data', 'mouths-of-madness', 'ambiguous-entries.json');
const OUT = path.join(process.cwd(), 'data', 'mouths-of-madness', 'ambiguous-entries.csv');

if (!fs.existsSync(IN)) {
  console.error('Missing ambiguous-entries.json. Run detect-ambiguous-entries.ts first.');
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
const lines = ['entryNumber,creatureName,probableType,flags,rawSnippet'];
for (const r of data) {
  const safeName = '"' + (r.creatureName || '').replace(/"/g, '""') + '"';
  const safeFlags = '"' + (r.flags?.join(';') || '').replace(/"/g, '""') + '"';
  const safeRaw = '"' + (r.rawMarkdownSnippet || '').replace(/"/g, '""') + '"';
  lines.push(`${r.entryNumber},${safeName},${r.probableType},${safeFlags},${safeRaw}`);
}

fs.writeFileSync(OUT, lines.join('\n'));
console.log(`Wrote ${OUT} with ${data.length} rows`);
