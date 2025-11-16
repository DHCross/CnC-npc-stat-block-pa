#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_SCOPE = process.env.DATA_SCOPE || 'mouths-of-madness';
const inputPath = process.argv[2] || path.join(__dirname, '..', 'CnC Docs', '02 CZ Ruins Mouths of Madness.md');
const outDir = path.join(__dirname, '..', 'data', DATA_SCOPE);
const outPath = path.join(outDir, 'entities.full.json');

if (!fs.existsSync(inputPath)) {
  console.error('Input file not found:', inputPath);
  process.exit(2);
}

const text = fs.readFileSync(inputPath, 'utf8');

// Build line offsets
const lines = text.split(/\r?\n/);
const offsets = [];
let pos = 0;
for (let i = 0; i < lines.length; i++) {
  offsets.push(pos);
  pos += lines[i].length + 1; // +1 for the newline
}

function lineForIndex(idx) {
  // binary search
  let lo = 0, hi = offsets.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const start = offsets[mid];
    const end = mid + 1 < offsets.length ? offsets[mid + 1] : text.length + 1;
    if (idx >= start && idx < end) return mid + 1; // 1-based
    if (idx < start) hi = mid - 1; else lo = mid + 1;
  }
  return offsets.length;
}

const results = [];

function deriveInlineLabel(prefix) {
  if (!prefix) return null;
  const text = prefix.trim();
  if (!text) return null;

  let match;
  let lastBold = null;
  const boldRegex = /\*\*([^*]+)\*\*/g;
  while ((match = boldRegex.exec(prefix)) !== null) {
    lastBold = match[1].trim();
  }
  if (lastBold) {
    return lastBold.replace(/[:：]\s*$/, '');
  }

  const colonMatch = text.match(/([A-Za-z0-9,'"&#/\\-][^:]{1,120})[:：]\s*$/);
  if (colonMatch) {
    return colonMatch[1].trim();
  }

  const fragments = text.split(/[\.\u2014–-]/).map(s => s.trim()).filter(Boolean);
  if (fragments.length > 0) {
    return fragments[fragments.length - 1];
  }
  return null;
}

const stack = [];
for (let i = 0; i < text.length; i++) {
  const ch = text[i];
  if (ch === '(') {
    stack.push(i);
  } else if (ch === ')') {
    if (stack.length > 0) {
      const start = stack.pop();
      const end = i;
      const parenthetical = text.slice(start + 1, end).trim();

      // compute surrounding title line: find the line that contains the opening paren or previous non-empty line
      const startLine = lineForIndex(start);
      const endLine = lineForIndex(end);

      // find title: previous non-empty line within 5 lines
      let titleLineNum = startLine;
      for (let l = startLine - 1; l >= Math.max(1, startLine - 6); l--) {
        const content = lines[l - 1].trim();
        if (content) { titleLineNum = l; break; }
      }

      const titleLine = lines[titleLineNum - 1] || '';

      const lineText = lines[startLine - 1] || '';
      const lineStartIdx = offsets[startLine - 1] ?? 0;
      const inlinePrefix = lineText.slice(0, Math.max(0, start - lineStartIdx));
      const inlineLabel = deriveInlineLabel(inlinePrefix);

      // snippet: join the title line and the parenthetical containing line
      const snippetLines = [];
      snippetLines.push(titleLine);
      // include the line where the parenthetical occurs
      const parenLine = lineText;
      if (parenLine !== titleLine) snippetLines.push(parenLine);

      const snippet = snippetLines.join(' ').replace(/\s+/g, ' ').trim();

      results.push({
        parenthetical,
        start,
        end,
        startLine,
        endLine,
        titleLineNum,
        titleLine: titleLine.trim(),
        lineText,
        inlineContext: inlinePrefix.trim() || null,
        inlineLabel: inlineLabel || null,
        snippet
      });
    }
  }
}

// Ensure output dir exists
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
console.log('Wrote', outPath, 'with', results.length, 'parentheticals');
