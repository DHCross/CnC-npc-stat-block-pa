# Chunk 25

### src/app/test/document-pipeline/page.tsx

```tsx
'use client';

import { FullDocumentPipeline } from '@/components/FullDocumentPipeline';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function DocumentPipelineTestPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.28),transparent_60%)]" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-accent/25 blur-[140px]" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-6 pb-20 pt-12 lg:px-10 lg:pb-28">
        {/* Header */}
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="border-amber-400/50 bg-amber-500/10 text-amber-200 normal-case">
            🧪 Test Environment
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Full Document Pipeline
          </h1>
          <p className="text-lg text-foreground/80 md:text-xl">
            Standalone testing environment for the full document processor. This page is isolated from the main app.
          </p>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-inner shadow-black/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground/70">
              Batch extraction, parsing, validation & statistics
            </span>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mx-auto max-w-3xl border-sky-400/40 bg-sky-500/10">
          <div className="p-4 space-y-2 text-sm text-sky-100">
            <div className="font-medium text-sky-200">Testing Instructions:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>This is a standalone test route at <code className="bg-white/10 px-1 rounded">/test/document-pipeline</code></li>
              <li>Upload or paste a markdown bestiary (like mouths-of-madness-canonical-clean.md)</li>
              <li>The pipeline extracts creatures using numbered headers (<code className="bg-white/10 px-1 rounded">### 1. Name</code>)</li>
              <li>Each creature is parsed using the existing NPC parser</li>
              <li>View statistics, validation reports, and export in multiple formats</li>
              <li>This test route is safe to delete before production deployment</li>
            </ul>
          </div>
        </Card>

        {/* Component */}
        <FullDocumentPipeline />
      </div>
    </div>
  );
}

```

### scripts/generate-notebooklm.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Ensure pyragify is installed. Try pipx or pip:"
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is not installed. Please install Python 3.9+"
  exit 1
fi

if ! python3 -m pip show pyragify >/dev/null 2>&1; then
  echo "pyragify not found; installing into user site (python -m pip install pyragify --user)"
  python3 -m pip install pyragify --user
fi

# Run pyragify on CnC Docs
CONFIG=scripts/pyragify_config_cncdocs.yaml
OUTDIR=$(grep 'output_dir:' $CONFIG | cut -d: -f2 | tr -d '[:space:]' || echo tmp/pyragify_cncdocs)
mkdir -p "$OUTDIR"

echo "Running pyragify with config: $CONFIG"
python3 -m pyragify --config-file "$CONFIG" --verbose

# Zip the output for NotebookLM
ZIPNAME=tmp/pyragify_cncdocs.zip
echo "Zipping output to $ZIPNAME"
rm -f "$ZIPNAME"
zip -r "$ZIPNAME" "$OUTDIR"

echo "Done. Upload $ZIPNAME to NotebookLM. See scripts/README-notebooklm.md for tips."
```

### scripts/pyragify_config_cncdocs.yaml

```yaml
repo_path: "CnC Docs"
output_dir: tmp/pyragify_cncdocs
max_words: 2500
max_file_size: 2000000
skip_dirs:
  - node_modules
  - .venv
  - __pycache__
skip_patterns:
  - '*.png'
  - '*.jpg'
  - '*.jpeg'
  - 'tmp/*'
  - 'node_modules/*'
  - 'data/*'
  - 'external/*'
# Optional: allow you to include only certain files
#include_patterns:
#  - 'CnC Docs/**/*.md'
#  - '**/*.md'

```

### scripts/detect-ambiguous-entries.ts

```typescript
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

```

### scripts/export-ambiguous-to-csv.ts

```typescript
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

```

### scripts/canonicalize_candidates.ts

```typescript
#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { extractParentheticalData, buildCanonicalParenthetical, isUnitHeading, expandShorthandForClassed, normalizePrimaryAttributesForMonsters, canonicalizeShields, repositionMagicItemBonuses, normalizeEquipmentVerbs, deduplicateEquipment } from '../src/lib/enhanced-parser.ts';
import { classifyCreature, classifyEntityV3, extractPreCheckData, getFormattingRules } from '../src/lib/classification-rules.ts';
import type { CanonicalData } from '../src/lib/canonical-data-mapper.ts';

const DATA_SCOPE = process.env.DATA_SCOPE || 'mouths-of-madness';
const DATA_DIR = path.join(process.cwd(), 'data', DATA_SCOPE);
const CANDIDATES = path.join(DATA_DIR, 'entities.candidates.json');
const OUT_CANON = path.join(DATA_DIR, 'entities.canonical.json');
const OUT_REPORT = path.join(DATA_DIR, 'canonical_report.json');

function safeReadJson(file: string) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as any[];
}

function safeWriteJson(file: string, obj: any) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

const parseFirstNumber = (value?: string | null): number | null => {
  if (!value) return null;
  const match = String(value).match(/-?\d+/);
  return match ? Number(match[0]) : null;
};

function buildCanonicalDataFromParenthetical(title: string, data: any): CanonicalData {
  return {
    name: title,
    level: data.level ?? null,
    hd: data.hd ?? null,
    hp: parseFirstNumber(data.hp),
    ac: parseFirstNumber(data.ac),
    disposition: data.disposition ?? null,
    primaryAttributes: data.attributes ?? data.significantAttributes ?? null,
    equipment: data.equipment ?? null,
    coins: data.coins ?? null,
    notes: data.significantAttributes ? [data.significantAttributes] : undefined,
  };
}

// If a monster is missing canonical HD, fall back to a user-provided mapping
// of canonical hit-dice values (M&T canonical defaults). This keeps monsters
// in the HD path so they show "Level X(dY), HP Z" instead of plain HP.
function applyHdFallbacks(title: string, obj: any) {
  try {
    const mapPath = path.join(process.cwd(), 'data', 'hd-canonical.json');
    if (!fs.existsSync(mapPath)) return obj;
    const hdMap: Record<string, string> = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const lowered = String(title || '').toLowerCase();
    for (const key of Object.keys(hdMap)) {
      if (lowered.includes(key)) {
        if (!obj.hd) {
          obj.hd = hdMap[key];
        }
        break;
      }
    }
  } catch (err) {
    // ignore mapping errors
  }
  return obj;
}

function analyzeAndCanonicalize() {
  const candidates = safeReadJson(CANDIDATES);
  const canonical: any[] = [];
  const report: any = {
    total: candidates.length,
    processed: 0,
    canonicalBuilt: 0,
    flagged: [],
    sample: []
  };

  for (const item of candidates) {
    try {
      const label =
        (item.inlineLabel && String(item.inlineLabel).trim()) ||
        (item.titleLine && String(item.titleLine).trim()) ||
        (item.title && String(item.title).trim()) ||
        '';
      const title = label || `Entry@${item.start ?? 'unknown'}`;
      const isUnit = isUnitHeading(title) || /\bx\s*\d+/i.test(title) || /\b(each|each of)\b/i.test(item.parenthetical || '');

      // Use authoritative extractor
      const data = extractParentheticalData(item.parenthetical || '', isUnit, title);

      // Ensure raw points back
      data.raw = item.parenthetical;

      // Fall back to parsed raceClass if extractor didn't find it
      if (!data.raceClass && item.raceClass) {
        data.raceClass = item.raceClass;
      }

      const canonicalData = buildCanonicalDataFromParenthetical(title, data);
      // Apply canonical HD defaults for monsters lacking HD; ensure the
      // raw parsed 'data' also reflects any canonical HD so the canonical
      // HTML generation shows the HD value.
      applyHdFallbacks(title, canonicalData);
      if (canonicalData.hd && !data.hd) {
        data.hd = canonicalData.hd;
      }
      const preCheck = extractPreCheckData(title, canonicalData);
      // Prefer the Version 3 classifier for most formatting decisions; fallback
      // to legacy classifier for compatibility only when needed.
      const v3Classification = classifyEntityV3(title, canonicalData, { spells: data.spells, raceClass: data.raceClass, description: data.raw });
      // For monsters/units, ensure canonicalData.primaryAttributes defaults to 'physical'
      // unless the parenthetical explicitly states 'mental'. This keeps the JSON
      // canonical records consistent with the published shorthand for monsters.
      if (v3Classification.format !== 'A') {
        const attr = String(canonicalData.primaryAttributes || '').toLowerCase();
        if (!attr || !/\bmental\b/.test(attr)) {
          canonicalData.primaryAttributes = 'physical';
          if (!data.attributes || /\b(strength|dexterity|constitution|str|dex|con)\b/i.test(String(data.attributes || ''))) {
            data.attributes = 'physical';
          }
        }
        // Also override single-attribute tokens (strength/dex/constitution) to 'physical'
        if (/\b(strength|dexterity|constitution|str|dex|con)\b/i.test(String(canonicalData.primaryAttributes || ''))) {
          canonicalData.primaryAttributes = 'physical';
          if (!data.attributes || /\b(strength|dexterity|constitution|str|dex|con)\b/i.test(String(data.attributes || ''))) {
            data.attributes = 'physical';
          }
        }
      }
      const classification: any = {
        type: v3Classification.type,
        format: v3Classification.format,
        subtype: v3Classification.subtype,
        confidence: v3Classification.confidence,
        reasoning: v3Classification.reasoning,
        warnings: v3Classification.warnings
      };
      const formattingRules = getFormattingRules(classification, preCheck);

      let canonicalParenthetical = buildCanonicalParenthetical(
        data,
        isUnit,
        false,
        true,
        title,
        formattingRules,
      );

      // Ensure equipment fields are normalized before canonical build so the
      // canonical outputs match the behavior in `npc-parser` and Storybook.
      if (data.equipment) {
        let equipment = data.equipment;
        equipment = canonicalizeShields(equipment);
        equipment = repositionMagicItemBonuses(equipment);
        equipment = normalizeEquipmentVerbs(equipment);
        equipment = deduplicateEquipment(equipment);
        data.equipment = equipment;
      }

      if (classification?.type === 'classed') {
        canonicalParenthetical = expandShorthandForClassed(canonicalParenthetical);
      } else if (classification?.type === 'monster') {
        canonicalParenthetical = normalizePrimaryAttributesForMonsters(canonicalParenthetical, false);
      }

      const out = {
        sourceIndex: item.start ?? null,
        title: title || null,
        classification,
        labels: {
          inline: item.inlineLabel || null,
          titleLine: item.titleLine || null
        },
        isUnit,
        parsed: item,
        canonicalData: data,
        canonicalParenthetical
      };

      canonical.push(out);
      report.processed += 1;
      if (canonicalParenthetical && canonicalParenthetical.length > 0) report.canonicalBuilt += 1;

      // Flag common issues
      const flags: string[] = [];
      if (!data.hp && !data.ac) flags.push('missing HP and AC');
      if (!data.hp && data.ac) flags.push('missing HP');
      if (!data.ac && data.hp) flags.push('missing AC');
      if (!data.raceClass) flags.push('missing raceClass');
      if (!data.xp && !/XP[:\s]/i.test(item.parenthetical || '')) flags.push('missing XP');

      if (flags.length > 0) {
        report.flagged.push({ title: title || item.snippet || '', start: item.start, flags });
      }

      if (report.sample.length < 5) report.sample.push(out);
    } catch (err: any) {
      report.flagged.push({ title: item.titleLine || '', start: item.start, error: err.message });
    }
  }

  safeWriteJson(OUT_CANON, canonical);
  safeWriteJson(OUT_REPORT, report);

  console.log(`Processed ${report.processed} candidates. Built ${report.canonicalBuilt} canonical parentheticals.`);
  console.log(`Wrote ${OUT_CANON}`);
  console.log(`Wrote ${OUT_REPORT}`);
}

// Run
try {
  analyzeAndCanonicalize();
} catch (err: any) {
  console.error('Error:', err?.message || err);
  process.exit(2);
}

```

### scripts/classify-all-creatures.ts

```typescript
#!/usr/bin/env tsx
/**
 * Classify all 129 creatures using the deterministic rule-tree
 * Outputs classification decisions to JSON and CSV
 */

import fs from 'fs';
import path from 'path';
import { extractCreatureEntries } from '../src/lib/full-document-pipeline';
import { processDumpWithValidation } from '../src/lib/npc-parser';
import { classifyCreature, getFormattingRules, extractPreCheckData } from '../src/lib/classification-rules';

const DOC = path.join(process.cwd(), 'CnC Docs', 'mouths-of-madness-canonical-clean.md');
const OUT_JSON = path.join(process.cwd(), 'data', 'mouths-of-madness', 'creature-classifications.json');
const OUT_CSV = path.join(process.cwd(), 'data', 'mouths-of-madness', 'creature-classifications.csv');

interface ClassificationRecord {
  entryNumber: number;
  creatureName: string;
  type: string;
  subtype?: string;
  confidence: string;
  reasoning: string;
  warnings: string[];
  formattingRules: {
    pronounTrack: string;
    pronounThis: string;
    attributePhrasing: string;
    showLevel: boolean;
    showHD: boolean;
  };
  rawData: {
    hasHP: boolean;
    hasHD: boolean;
    hasLevel: boolean;
    raceClass?: string;
  };
}

function main() {
  if (!fs.existsSync(DOC)) {
    console.error(`Missing source doc at ${DOC}`);
    process.exit(1);
  }

  const md = fs.readFileSync(DOC, 'utf8');
  const entries = extractCreatureEntries(md);
  const records: ClassificationRecord[] = [];

  console.log(`\n${'='.repeat(80)}`);
  console.log('CANONICAL CLASSIFICATION SYSTEM - RULE-TREE EXECUTION');
  console.log(`${'='.repeat(80)}\n`);

  for (const entry of entries) {
    const parsedArr = processDumpWithValidation(entry.rawMarkdown, true, 'monster');
    if (!parsedArr || parsedArr.length === 0) {
      console.log(`⚠️  ${entry.entryNumber}. ${entry.creatureName} - PARSE FAILED`);
      continue;
    }

    const parsed = parsedArr[0];
    const canonicalData = parsed.canonicalData;
    
    if (!canonicalData) {
      console.log(`⚠️  ${entry.entryNumber}. ${entry.creatureName} - NO CANONICAL DATA`);
      continue;
    }

    // Run classification
    const classification = classifyCreature(entry.creatureName, canonicalData);
    const preCheck = extractPreCheckData(entry.creatureName, canonicalData);
    const formatting = getFormattingRules(classification, preCheck);

    // Build record
    const record: ClassificationRecord = {
      entryNumber: entry.entryNumber,
      creatureName: entry.creatureName,
      type: classification.type,
      subtype: classification.subtype,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      warnings: classification.warnings,
      formattingRules: {
        pronounTrack: formatting.pronounTrack,
        pronounThis: formatting.pronounThis,
        attributePhrasing: formatting.attributePhrasing,
        showLevel: formatting.showLevel,
        showHD: formatting.showHD
      },
      rawData: {
        hasHP: Boolean(canonicalData.hp),
        hasHD: Boolean(canonicalData.hd),
        hasLevel: Boolean(canonicalData.level),
        raceClass: preCheck.raceClass
      }
    };

    records.push(record);

    // Print to console
    const icon = classification.type === 'classed' ? '👤' : 
                 classification.type === 'monster' ? '👹' : '❓';
    const confidenceBadge = classification.confidence === 'high' ? '✓' :
                           classification.confidence === 'medium' ? '~' : '?';
    
    console.log(`${icon} ${confidenceBadge} ${entry.entryNumber}. ${entry.creatureName}`);
    console.log(`   Type: ${classification.type.toUpperCase()}${classification.subtype ? ` (${classification.subtype})` : ''}`);
    console.log(`   Confidence: ${classification.confidence}`);
    console.log(`   Reasoning: ${classification.reasoning}`);
    if (classification.warnings.length > 0) {
      classification.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
    }
    console.log();
  }

  // Write JSON
  fs.writeFileSync(OUT_JSON, JSON.stringify(records, null, 2));
  console.log(`\n✅ Wrote ${records.length} classifications to ${OUT_JSON}`);

  // Write CSV
  const csvLines = [
    'Entry,Creature Name,Type,Subtype,Confidence,Has HP,Has HD,Has Level,Pronoun Track,Attribute Phrasing,Reasoning,Warnings'
  ];

  for (const r of records) {
    const escapeCsv = (s: string) => {
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    csvLines.push([
      r.entryNumber,
      escapeCsv(r.creatureName),
      r.type,
      r.subtype || '',
      r.confidence,
      r.rawData.hasHP ? 'YES' : 'NO',
      r.rawData.hasHD ? 'YES' : 'NO',
      r.rawData.hasLevel ? 'YES' : 'NO',
      r.formattingRules.pronounTrack,
      r.formattingRules.attributePhrasing,
      escapeCsv(r.reasoning),
      escapeCsv(r.warnings.join('; '))
    ].join(','));
  }

  fs.writeFileSync(OUT_CSV, csvLines.join('\n'));
  console.log(`✅ Wrote CSV to ${OUT_CSV}`);

  // Summary statistics
  const stats = {
    total: records.length,
    classed: records.filter(r => r.type === 'classed').length,
    monster: records.filter(r => r.type === 'monster').length,
    ambiguous: records.filter(r => r.type === 'ambiguous').length,
    highConfidence: records.filter(r => r.confidence === 'high').length,
    mediumConfidence: records.filter(r => r.confidence === 'medium').length,
    lowConfidence: records.filter(r => r.confidence === 'low').length,
    withWarnings: records.filter(r => r.warnings.length > 0).length
  };

  console.log(`\n${'='.repeat(80)}`);
  console.log('CLASSIFICATION SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total creatures: ${stats.total}`);
  console.log(`  Classed NPCs: ${stats.classed} (${((stats.classed/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Monsters: ${stats.monster} (${((stats.monster/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Ambiguous: ${stats.ambiguous} (${((stats.ambiguous/stats.total)*100).toFixed(1)}%)`);
  console.log();
  console.log(`Confidence distribution:`);
  console.log(`  High: ${stats.highConfidence} (${((stats.highConfidence/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Medium: ${stats.mediumConfidence} (${((stats.mediumConfidence/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Low: ${stats.lowConfidence} (${((stats.lowConfidence/stats.total)*100).toFixed(1)}%)`);
  console.log();
  console.log(`Entries with warnings: ${stats.withWarnings} (${((stats.withWarnings/stats.total)*100).toFixed(1)}%)`);
  console.log(`${'='.repeat(80)}\n`);
}

main();

```

