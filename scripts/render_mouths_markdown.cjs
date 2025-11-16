#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_SCOPE = process.env.DATA_SCOPE || 'mouths-of-madness';
const slug = DATA_SCOPE.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
const dataPath = path.join(__dirname, '..', 'data', DATA_SCOPE, 'entities.canonical.json');
const docsDir = path.join(__dirname, '..', 'CnC Docs');
const detailedPath = path.join(docsDir, `${slug}-canonical.md`);
const cleanPath = path.join(docsDir, `${slug}-canonical-clean.md`);

if (!fs.existsSync(dataPath)) {
  console.error('Missing canonical dataset:', dataPath);
  process.exit(2);
}

const canonical = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function renderHeader() {
  return [
    '# Castle Zagyg: The Upper Works – Mouths of Madness (Reforged)',
    '',
    '## Master Bestiary & NPC Roster',
    '',
    '*This document contains all canonical creatures and NPCs extracted from the Mouths of Madness module, converted to Castles & Crusades Reforged format.*',
    '',
    '---',
    '',
    '## Creatures & NPCs (By Order of Appearance)',
    ''
  ];
}

function coreStatsLine(entry) {
  const hp = entry?.canonicalData?.hp ?? '—';
  const ac = entry?.canonicalData?.ac ?? '—';
  const disp = entry?.canonicalData?.disposition ?? '—';
  return `**Core Stats:** HP ${hp}, AC ${ac}, Disposition ${disp}`;
}

function renderEntry(entry, index, includeDetails) {
  const lines = [];
  const title = entry?.title || `Entry ${index + 1}`;
  lines.push(`### ${index + 1}. ${title}`, '');
  if (entry?.canonicalParenthetical) {
    lines.push(`*${entry.canonicalParenthetical}*`, '');
  }
  lines.push(coreStatsLine(entry), '');
  if (includeDetails) {
    lines.push('<details>', '<summary>Full Canonical Record (JSON)</summary>', '', '```json');
    lines.push(JSON.stringify(entry, null, 2));
    lines.push('```', '</details>', '');
  }
  lines.push('---', '');
  return lines;
}

function writeMarkdown(includeDetails, outPath) {
  const parts = renderHeader();
  canonical.forEach((entry, idx) => {
    parts.push(...renderEntry(entry, idx, includeDetails));
  });
  parts.push('', '');
  fs.writeFileSync(outPath, parts.join('\n'), 'utf8');
  console.log(`Wrote ${outPath}`);
}

writeMarkdown(true, detailedPath);
writeMarkdown(false, cleanPath);
