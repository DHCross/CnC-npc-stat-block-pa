#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { extractCreatureEntries } from '../src/lib/full-document-pipeline';
import { processDumpWithValidation, type ProcessedNPC } from '../src/lib/npc-parser';

const DOC = path.join(process.cwd(), 'CnC Docs', 'mouths-of-madness-canonical-clean.md');
const OUT = path.join(process.cwd(), 'data', 'mouths-of-madness', 'ambiguous-entries.json');

interface AmbiguousResult {
  entryNumber: number;
  creatureName: string;
  probableType: 'monster' | 'classed' | 'ambiguous';
  flags: string[];
  rawMarkdownSnippet: string;
}

function heuristicProbableType(parsed: ProcessedNPC) {
  // parsed: ProcessedNPC
  const cd = parsed.canonicalData ?? {};
  const hasHP = Boolean(cd.hp);
  const hasHD = Boolean(cd.hd);
  const hasLevel = Boolean(cd.level);

  if (hasHP && !hasHD && hasLevel) return 'classed';
  if (hasHD && !hasHP && !hasLevel) return 'monster';
  if (hasHP && !hasHD && !hasLevel) return 'classed';
  return 'ambiguous';
}

function detectFlags(processed: ProcessedNPC, title: string, raw: string) {
  const flags: string[] = [];
  const cd = processed.canonicalData ?? {};

  if (cd.hp && cd.hd) flags.push('HP+HD');
  if (cd.level && !/\d+\s*level/i.test(cd.level)) flags.push('weird-level-format');
  if (!cd.level && /level/i.test(title)) flags.push('title-includes-level-bare');
  if (cd.primaryAttributes && /physical/i.test(cd.primaryAttributes)) flags.push('primary-attributes-physical');
  
  // Pronoun checks
  if (/These creatures|These creatures\s+/.test(raw) && /\b(He|She)\b/i.test(raw)) flags.push('plural-title-but-singular-body');
  if (/This creature|This creature\s+/.test(raw) && /\b(They)\b/i.test(raw)) flags.push('singular-title-but-plural-body');

  // HP/HD in raw text
  if (/\bHD\b/i.test(raw) && /\bHP\b/i.test(raw)) flags.push('raw-hd-and-hp');

  // Money sanity checks
  if (/\b\d+[–-]\d+\s*(?:gp|sp|cp)\b/i.test(raw) || /\d+\s*(sp|gp|cp)\s*,\s*\d+\s*(sp|gp|cp)/i.test(raw)) flags.push('ambiguous-coins');

  // presence of 'primary attributes are physical' phrase - can be monster rule override
  if (/primary attributes are physical/i.test(raw)) flags.push('attributes-physical-phrase');

  // Title has explicit named role (possible named/ranked entity)
  if (/\b(king|queen|chieftain|prince|captain)\b/i.test(title)) flags.push('named-ranked-title');

  return flags;
}

function main() {
  if (!fs.existsSync(DOC)) {
    console.error(`Missing source doc at ${DOC}. You can also run this on the mouths-of-madness mock by editing this script.`);
    process.exit(1);
  }

  const md = fs.readFileSync(DOC, 'utf8');
  const entries = extractCreatureEntries(md);
  const results: AmbiguousResult[] = [];

  for (const e of entries) {
    const parsedArr = processDumpWithValidation(e.rawMarkdown, true, 'monster');
    if (!parsedArr || parsedArr.length === 0) continue;
    const p = parsedArr[0];
    const flags = detectFlags(p, e.creatureName, e.rawMarkdown);
    const probableType = heuristicProbableType(p);

    if (flags.length > 0 || probableType === 'ambiguous') {
      results.push({
        entryNumber: e.entryNumber,
        creatureName: e.creatureName,
        probableType,
        flags,
        rawMarkdownSnippet: e.rawMarkdown.split('\n').slice(0,6).join('\n')
      });
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`Detected ${results.length} ambiguous or flagged entries. Wrote to ${OUT}`);
  // Print top 25 for quick scan
  results.slice(0, 25).forEach((r) => {
    console.log(`${r.entryNumber}. ${r.creatureName}
  probable: ${r.probableType}
  flags: ${r.flags.join(', ')}`);
  });
}

main();
