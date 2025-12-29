# Chunk 26

### scripts/generate-mouths-mock.ts

```typescript
import fs from 'fs';
import path from 'path';
import { analyzeFullDocument } from '@/lib/full-document-pipeline';

async function main() {
  const cwd = process.cwd();
  
  // Load canonical data if available
  const canonicalPath = path.join(cwd, 'data', 'mouths-of-madness', 'entities.canonical.json');
  let canonicalData: any[] = [];
  if (fs.existsSync(canonicalPath)) {
    try {
      canonicalData = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
      console.log(`Loaded ${canonicalData.length} canonical entries from entities.canonical.json`);
    } catch (err) {
      console.warn('Failed to load canonical data:', err);
    }
  }
  
  // Load canonical report for accurate validation metrics
  const reportPath = path.join(cwd, 'data', 'mouths-of-madness', 'canonical_report.json');
  let canonicalReport: any = null;
  if (fs.existsSync(reportPath)) {
    try {
      canonicalReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      console.log(`Loaded canonical report with ${canonicalReport.flagged?.length || 0} flagged items`);
    } catch (err) {
      console.warn('Failed to load canonical report:', err);
    }
  }
  
  // Try to find the mouths-of-madness canonical file in 'CnC Docs' folder
  // Prefer mouths-of-madness-canonical-clean.md without date suffix
  const docsDirCandidates = [path.join(cwd, 'CnC Docs'), path.join(cwd, 'CnC-Docs'), path.join(cwd, 'CnC Docs/')];
  let filePath = '';
  for (const dir of docsDirCandidates) {
    if (!fs.existsSync(dir)) continue;
    // Try exact match first
    const preferredFile = path.join(dir, 'mouths-of-madness-canonical-clean.md');
    if (fs.existsSync(preferredFile)) {
      filePath = preferredFile;
      break;
    }
    // Fall back to any canonical file
    const files = fs.readdirSync(dir);
    const candidate = files.find(f => f.startsWith('mouths-of-madness-canonical') && !f.includes('.11.14'));
    if (candidate) {
      filePath = path.join(dir, candidate);
      break;
    }
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(cwd, 'CnC Docs', 'mouths-of-madness-canonical-clean.md');
  }

  if (!fs.existsSync(filePath)) {
    console.error('Cannot find mouths-of-madness-canonical*.md in CnC Docs. Abort.');
    process.exit(2);
  }

  const md = fs.readFileSync(filePath, 'utf8');

  console.log('Running full-document pipeline on:', filePath);
  const analysis = analyzeFullDocument(md, 'Mouths of Madness', 'enhanced');
  
  // Merge canonical data into creatures
  if (canonicalData.length > 0 && analysis.creatures) {
    console.log(`Merging canonical data into ${analysis.creatures.length} creatures`);
    
    // Build a map of flagged entries from canonical report
    const flaggedMap = new Map<string, string[]>();
    if (canonicalReport?.flagged) {
      for (const item of canonicalReport.flagged) {
        if (item.title && item.flags) {
          flaggedMap.set(item.title, item.flags);
        }
      }
    }
    
    for (let i = 0; i < analysis.creatures.length && i < canonicalData.length; i++) {
      const creature = analysis.creatures[i];
      const canonical = canonicalData[i];
      
      if (canonical.canonicalParenthetical) {
        creature.converted = creature.converted.replace(
          /\*[^*]+\*\s*$/,
          `*${canonical.canonicalParenthetical}*`
        );
      }
      
      // Also add the canonical data to the creature object for reference
      if (canonical.canonicalData) {
        creature.canonicalData = canonical.canonicalData;
      }
      
      // Update validation based on canonical report
      const flags = flaggedMap.get(canonical.title);
      if (flags && flags.length > 0) {
        // This creature is flagged - lower compliance score
        creature.validation = {
          warnings: flags.map(flag => ({
            type: 'warning' as const,
            category: 'Canonical Analysis',
            message: flag,
          })),
          complianceScore: 80,
        };
      } else {
        // This creature passed canonical validation - high compliance
        creature.validation = {
          warnings: [],
          complianceScore: 95,
        };
      }
    }
  }
  
  // If we have classification results, merge them into the analysis for Storybook use
  const classificationPath = path.join(process.cwd(), 'data', 'mouths-of-madness', 'creature-classifications.json');
  if (fs.existsSync(classificationPath)) {
    try {
      const classifications = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));
      if (Array.isArray(classifications) && analysis.creatures) {
        const byEntry = new Map<number, any>();
        for (const c of classifications) {
          if (typeof c.entryNumber === 'number') byEntry.set(c.entryNumber, c);
        }

        for (const creature of analysis.creatures) {
          const c = byEntry.get(creature.entryNumber);
          if (c) {
            creature.classification = {
              type: c.type,
              subtype: c.subtype,
              confidence: c.confidence,
              reasoning: c.reasoning,
              warnings: c.warnings,
            } as any;
          } else {
            creature.classification = null;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to attach classification data to Storybook mock', err);
    }
  }
  
  // Override validation report with canonical report data
  if (canonicalReport && analysis.validationReport) {
    console.log('Replacing validation report with canonical analyzer results');
    const flaggedCount = canonicalReport.flagged?.length || 0;
    const totalEntries = canonicalData.length || analysis.creatures?.length || 0;
    
    // Calculate compliance based on entries without critical flags
    const compliance = totalEntries > 0 
      ? Math.round(((totalEntries - flaggedCount) / totalEntries) * 100)
      : 100;
    
    analysis.validationReport = {
      totalValidationScore: compliance,
      perCreatureScores: analysis.creatures?.map(() => compliance) || [],
      crossEntryIssues: [],
      statisticalAnomalies: [],
      recommendations: [
        ...(compliance < 70 ? ['Overall compliance is below 70% - consider using auto-correction features'] : []),
        ...(flaggedCount > 0 ? [`${flaggedCount} entries flagged in canonical report - review for completeness`] : []),
      ],
      totalIssues: flaggedCount,
      criticalIssues: flaggedCount,
    };
  }

  // Sanitize the object: remove circular or complex data if needed
  const out = JSON.stringify(analysis, null, 2);

  const destDir = path.join(cwd, 'src', 'components', 'mocks');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, 'mouths-of-madness.mock.ts');

  const content = `/* This file is auto-generated by scripts/generate-mouths-mock.ts */\nexport const mouthsOfMadnessAnalysis = ${out} as const;\n`;
  fs.writeFileSync(dest, content, 'utf8');

  console.log('Wrote mock to', dest);
}

main().catch((err) => {
  console.error('Error generating mock:', err);
  process.exit(1);
});

```

### scripts/generate-essentialplaces-mock.ts

```typescript
import fs from 'fs';
import path from 'path';
import { analyzeFullDocument } from '@/lib/full-document-pipeline';

async function main() {
  const cwd = process.cwd();
  const src = path.join(cwd, 'CnC Docs', 'Essential Places 10.30.25_headers_export.md');
  if (!fs.existsSync(src)) {
    console.error('Source markdown missing:', src);
    process.exit(2);
  }

  const md = fs.readFileSync(src, 'utf8');
  console.log('Running full-document pipeline on:', src);

  const analysis = analyzeFullDocument(md, 'Essential Places (headers export)', 'enhanced');

  // Sanitize the object to avoid circular references and keep config small
  const out = JSON.stringify(analysis, null, 2);

  const destDir = path.join(cwd, 'src', 'components', 'mocks');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, 'essential-places.mock.ts');

  const content = `/* This file is auto-generated by scripts/generate-essentialplaces-mock.ts */\nexport const essentialPlacesAnalysis = ${out} as const;\n`;
  fs.writeFileSync(dest, content, 'utf8');

  console.log('Wrote mock to', dest);
}

main().catch(err => {
  console.error('Error generating mock:', err);
  process.exit(1);
});

```

### scripts/verify-named-canon.ts

```typescript
#!/usr/bin/env tsx
import { mouthsOfMadnessAnalysis } from '../src/components/mocks/mouths-of-madness.mock';
import { processDumpWithValidation } from '../src/lib/npc-parser';

const named = ['Ember Raventree', 'Hub-Gub the Bloody', 'Wily Wil', 'The Little Hillwood Werewolf'];

function run() {
  const namedEntries = mouthsOfMadnessAnalysis.creatures.filter((c: any) => {
    const type = c.creatureType ?? '';
    return named.some((n) => type.includes(n));
  });

  const results = namedEntries.map((entry: any) => {
    const parsed = processDumpWithValidation(entry.rawMarkdown, true);
    return {
      type: entry.creatureType,
      raw: entry.rawMarkdown,
      processed: parsed,
    };
  });

  console.log('Found entries:', namedEntries.map((e: any) => e.creatureType));
  for (const r of results) {
    console.log('\n---\n', r.type);
    for (const p of r.processed) {
      console.log('Name:', p.name);
      console.log('Converted:', p.converted);
      console.log('CanonicalData:', JSON.stringify(p.canonicalData, null, 2));
    }
  }
}

run();

```

### scripts/generate_code_markdown.py

```python
#!/usr/bin/env python3
"""
Generate Markdown files containing code blocks for later upload to NotebookLM.

Script behavior:
 - Walk selected directories (default: `src`, `scripts`, `test`, `data` optional)
 - Collect files with certain extensions (e.g., .py, .ts, .js, .tsx, .jsx, .md)
 - Group them into Markdown files that contain headings and fenced code blocks
 - Chunk output when a `max_words` threshold is reached (NotebookLM-friendly)
 - Write results to `tmp/code_markdown/` and zip them

Usage:
    python3 scripts/generate_code_markdown.py --outdir tmp/code_markdown --max-words 3000

"""
from __future__ import annotations
import argparse
from collections import defaultdict
from pathlib import Path
import re
import json
import os
import zipfile

# Detect words roughly: split by whitespace
WORD_RE = re.compile(r"\w+")

DEFAULT_EXTENSIONS = [
    ".py", ".ts", ".js", ".jsx", ".tsx", ".java", ".c", ".cpp", ".h", ".cs",
    ".go", ".rb", ".php", ".sh", ".bash", ".zsh", ".yml", ".yaml", ".json", ".css", ".scss", ".html", ".md"
]

DEFAULT_DIRS = ["src", "scripts", "test", "test/e2e", "data"]

META_FILENAME = "metadata.json"


def count_words(text: str) -> int:
    return len(WORD_RE.findall(text))


def highlight_language_from_ext(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".py":
        return "python"
    if ext in [".ts"]:
        return "typescript"
    if ext == ".js":
        return "javascript"
    if ext in [".jsx"]:
        return "jsx"
    if ext in [".tsx"]:
        return "tsx"
    if ext in [".md"]:
        return "markdown"
    if ext in [".css"]:
        return "css"
    if ext in [".html"]:
        return "html"
    if ext in [".sh", ".bash", ".zsh"]:
        return "bash"
    if ext in [".yml", ".yaml"]:
        return "yaml"
    return ext.replace(".", "") or "text"


class Collector:
    def __init__(self, outdir: Path, max_words: int = 3000, extensions: list[str] | None = None):
        self.outdir = outdir
        self.max_words = max_words
        self.extensions = set((extensions or DEFAULT_EXTENSIONS))
        self.chunks: list[Path] = []
        self.metadata = {"chunks": []}

    def add_file(self, src_path: Path, relative_path: str) -> None:
        try:
            text = src_path.read_text(encoding='utf-8')
        except Exception:
            text = src_path.read_text(encoding='latin-1', errors='ignore')
        # Prepare markdown block for this file
        lang = highlight_language_from_ext(src_path)
        header = f"### {relative_path}\n\n"
        code_block = f"```{lang}\n" + text + "\n```\n\n"

        # Now add to the current chunk or open a new chunk if near max words
        self._ensure_chunk()
        cur_chunk_path = self.chunks[-1]
        cur_text_words = count_words(cur_chunk_path.read_text(encoding='utf-8'))
        add_words = count_words(header) + count_words(code_block)
        if cur_text_words + add_words > self.max_words and cur_text_words > 0:
            # start a new chunk
            self._new_chunk()
            cur_chunk_path = self.chunks[-1]

        with cur_chunk_path.open('a', encoding='utf-8') as fh:
            fh.write(header)
            fh.write(code_block)

        # Add to metadata
        self.metadata["chunks"][-1]["files"].append(relative_path)

    def _ensure_chunk(self) -> None:
        if not self.chunks:
            self._new_chunk()

    def _new_chunk(self) -> None:
        index = len(self.chunks)
        p = self.outdir / f"chunk_{index}.md"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(f"# Chunk {index}\n\n", encoding='utf-8')
        self.chunks.append(p)
        self.metadata.setdefault("chunks", []).append({"file": str(p), "files": []})

    def save_metadata(self) -> None:
        p = self.outdir / META_FILENAME
        p.write_text(json.dumps(self.metadata, indent=2), encoding='utf-8')


def walk_and_collect(paths: list[str], collector: Collector, ignore_patterns: list[str] | None = None) -> None:
    ignore_patterns = ignore_patterns or []
    for base in paths:
        base_path = Path(base)
        if not base_path.exists():
            continue
        for p in base_path.rglob('*'):
            if p.is_dir():
                continue
            if p.suffix.lower() not in collector.extensions:
                continue
            skip = False
            for pat in ignore_patterns:
                if p.match(pat):
                    skip = True
                    break
            if skip:
                continue
            # use os.path.relpath to avoid ValueError when p is not under Path.cwd() as a Path
            rel = os.path.relpath(p, Path.cwd())
            collector.add_file(p, rel)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--outdir", default="tmp/code_markdown", help="Output directory")
    parser.add_argument("--max-words", type=int, default=3000, help="Max words per chunk")
    parser.add_argument("--dirs", nargs="*", default=DEFAULT_DIRS, help="Dirs to scan")
    parser.add_argument("--ext", nargs="*", help="Extensions to include (override)")
    args = parser.parse_args()

    outdir = Path(args.outdir)
    if outdir.exists():
        # optional remove old
        pass
    outdir.mkdir(parents=True, exist_ok=True)

    collector = Collector(outdir, max_words=args.max_words, extensions=args.ext)
    walk_and_collect(args.dirs, collector, ignore_patterns=["node_modules/*", "**/__pycache__/*"])
    collector.save_metadata()

    # zip
    zip_path = Path("tmp/code_markdown.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for chunk in collector.chunks:
            zf.write(chunk, arcname=chunk.name)
        zf.write(outdir / META_FILENAME, arcname=META_FILENAME)

    print("Wrote chunks to", outdir)
    print("ZIP created at", zip_path)


if __name__ == '__main__':
    main()

```

### scripts/README-notebooklm.md

```markdown
# NotebookLM upload helpers

This folder contains scripts to prepare the repository for NotebookLM ingestion.

## Files
- `generate_code_markdown.py` — Extracts selected code files into Markdown chunks and zips them.
- `pyragify_config_cncdocs.yaml` — Settings for pyragify for the `CnC Docs` folder.
- `generate-notebooklm.sh` — Wrapper that runs pyragify for the docs set and zips them.

## How to use
- Generate `CnC Docs` Markdown with `pyragify`:
```
./scripts/generate-notebooklm.sh
```
- Generate code Markdown for the repo (defaults to `src`, `scripts`, `test`, `data`):
```
python3 scripts/generate_code_markdown.py --outdir tmp/code_markdown --max-words 3000
```

The example `3000` word chunk should be adjusted to your taste; NotebookLM supports large inputs, but chunking into 1500–3000 word files conservatively improves retrieval.

## Notes
- NotebookLM prefers Markdown and plain text over PDF.
- Use per-repo or per-subset configs if your repository is large.

```

### scripts/compile_docs.py

```python
#!/usr/bin/env python3
"""
Compile repository documentation into a single Markdown / text file, and optionally export to PDF

Usage:
  python3 scripts/compile_docs.py --dirs "CnC Docs" docs "Sample Docs" 
  python3 scripts/compile_docs.py --all  # walk entire repo (excludes node_modules, .git)

Output files created in `tmp/`: `compiled_docs.md`, `compiled_docs.txt`, and if pandoc is available `compiled_docs.pdf`.

Notes:
  - The script skips binary files and large directories like node_modules and .git by default.
  - Markdown sections include a file heading with relative path for traceability.
"""

import argparse
import os
import shutil
import subprocess
from pathlib import Path
from typing import List

# Defaults
ROOT = Path.cwd()
TMP_DIR = ROOT / 'tmp'
DEFAULT_DOC_DIRS = ["CnC Docs", "docs", "Designer Notes", "Developer Notes", "Sample Docs"]
INCLUDE_EXTS = ['.md', '.mdx', '.txt', '.markdown']
EXCLUDE_DIRS = ['.git', 'node_modules', '.next', 'dist', 'build']


def find_files(dirs: List[str], all_walk: bool=False):
    files = []
    if all_walk:
        for root, dirnames, filenames in os.walk(ROOT):
            # prune
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
            for f in filenames:
                if Path(f).suffix.lower() in INCLUDE_EXTS:
                    files.append(Path(root) / f)
        return sorted(files)

    for d in dirs:
        path = ROOT / d
        if not path.exists():
            continue
        for root, _, filenames in os.walk(path):
            # skip common exclusions
            if any(part in EXCLUDE_DIRS for part in Path(root).parts):
                continue
            for f in filenames:
                if Path(f).suffix.lower() in INCLUDE_EXTS:
                    files.append(Path(root) / f)
    return sorted(files)


def write_compiled_md(file_list: List[Path], dest: Path):
    lines = []
    for p in file_list:
        lines.append(f"\n\n<!-- BEGIN_FILE: {p.relative_to(ROOT)} -->\n\n")
        lines.append(f"# Source: {p.relative_to(ROOT)}\n\n")
        try:
            text = p.read_text(encoding='utf8')
        except Exception as e:
            text = f"(Could not read file: {e})"
        lines.append(text)
        lines.append("\n\n<!-- END_FILE -->\n")
    dest.write_text('\n'.join(lines), encoding='utf8')
    print('Wrote', dest)


def compile_to_pdf(md_file: Path, pdf_file: Path):
    # Prefer pandoc if installed
    # pypandoc may not be present; call pandoc CLI if available
    try:
        subprocess.run(['pandoc', str(md_file), '-o', str(pdf_file)], check=True)
        print('Wrote', pdf_file)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        print('Pandoc not available or failed; skipping PDF generation')
        return False


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dirs', nargs='+', default=DEFAULT_DOC_DIRS,
                        help='List of directories to include (relative to repo root)')
    parser.add_argument('--all', action='store_true', help='Walk entire repo (excludes node_modules/.git)')
    parser.add_argument('--out', default=str(TMP_DIR/'compiled_docs'), help='Output base path (no suffix)')
    args = parser.parse_args()

    TMP_DIR.mkdir(parents=True, exist_ok=True)

    files = find_files(args.dirs, all_walk=args.all)
    print('Found', len(files), 'files')

    md_out = Path(args.out + '.md')
    txt_out = Path(args.out + '.txt')
    pdf_out = Path(args.out + '.pdf')

    write_compiled_md(files, md_out)

    # also write a plain text version, stripping markdown
    try:
        import markdown
        html = markdown.markdown(md_out.read_text(encoding='utf8'))
        # strip tags simply
        import re
        text = re.sub('<[^<]+?>', '', html)
        txt_out.write_text(text, encoding='utf8')
        print('Wrote', txt_out)
    except Exception:
        # fallback: copy md to txt
        shutil.copy2(md_out, txt_out)
        print('Wrote', txt_out, '(copied markdown since markdown package unavailable)')

    # Try to compile PDF with pandoc
    compile_to_pdf(md_out, pdf_out)

    print('Done. Next step: upload', pdf_out if pdf_out.exists() else txt_out, 'to NotebookLM or other LLM tools')

```

### scripts/extract_parentheticals.js

```javascript
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

```

