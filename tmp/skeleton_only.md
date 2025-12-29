# Tier 1 Skeleton (NotebookLM-ready Markdown)

This file contains the key Tier-1 architectural files rendered as Markdown. Upload this file into NotebookLM as your *template architecture dataset*. It intentionally excludes C&C-specific logic (`classification-rules.ts`, `enhanced-parser.ts`, `name-mappings.ts`).

## Included files
- `docs/templates/TEMPLATE_StatBlockParser.py` (template parser)
- `docs/templates/TEMPLATE_ModuleValidator.py` (template validator)
- `docs/templates/TEMPLATE_README.md` (template docs)
- `docs/templates/TEMPLATE_SchemaDefinition.json` (template JSON schema)
- `src/lib/full-document-pipeline.ts` (pipeline orchestrator)
- `src/lib/stat-block-types.ts` (canonical types)
- `src/lib/stat-block-helpers.ts` (utilities for canonicalization)
- `src/lib/utils.ts` (general helpers)
- `src/lib/document-analyzer.ts` (document analysis)

---

### docs/templates/TEMPLATE_StatBlockParser.py
```python
"""
Template stat block parser (generic)

This file is a TIER 1 template: it contains placeholders and neutral names.
COPY THIS FILE into `system-profiles/<SystemName>/` and fill in your system's field regexes.

Do NOT include system-specific code or terminology.

Replace:
- {SYSTEM_NAME} with your system name
- {DIFFICULTY_METRIC} with the system's difficulty rating field (e.g., CR for D&D)
- {STAT_FORMAT} with the example stat block format

"""

import re
from typing import Dict, Any

# --- PLACEHOLDER: define regex patterns per target system ---
# Example patterns are intentionally generic; replace them with your system's
PATTERNS = {
    # name of the creature/actor
    "name": r"(?P<name>^[A-Za-z0-9' .,\-]+)$",
    # example difficulty metric lines; e.g., CR, CL, ST
    "difficulty": r"{DIFFICULTY_PATTERN}",
    # hit points or HP expression
    "hp": r"(?i)HP(?:\:)?\s*(?P<hp>[0-9d+\- ]+)",
    # armor class / ac
    "ac": r"(?i)AC(?:\:)?\s*(?P<ac>\d+)",
}


def parse_statblock(text: str, difficulty_pattern: str = None) -> Dict[str, Any]:
    """Parse a stat block into canonical fields.

    This function uses simple regex matching as an example. For production use
    replace the regexes and add robust normalization.

    Args:
        text: raw stat block text to parse
        difficulty_pattern: optional regex string for the difficulty metric if the default is not correct

    Returns:
        dict containing canonical fields: name, hp, ac, difficulty, raw_text
    """
    out = {"raw_text": text}

    # Name — first non-empty line
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if lines:
        out["name"] = lines[0]

    # Optional difficulty override
    if difficulty_pattern:
        m = re.search(difficulty_pattern, text)
        if m:
            out["difficulty"] = m.group(1)

    # HP
    m = re.search(PATTERNS["hp"], text)
    if m:
        out["hp"] = m.group("hp")

    # AC
    m = re.search(PATTERNS["ac"], text)
    if m:
        out["ac"] = int(m.group("ac"))

    return out

# Example: provide a sample call
if __name__ == '__main__':
    sample = """
Name of Creature
HP: 22 (3d8 + 6)
AC: 14
"""
    print(parse_statblock(sample))
```

---

### docs/templates/TEMPLATE_ModuleValidator.py
```python
"""
Template Module Validator

This is an abstract module validator for an RPG workbench. Replace the schema
and validation rules for your target system. Keep this file generic — do not
use system-specific terms.
"""
import json
from typing import Dict, Any

SAMPLE_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "RPG Module",
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "entries": {
            "type": "array",
            "items": {"type": "object"}
        }
    },
    "required": ["title", "entries"]
}


def validate_module(module_data: Dict[str, Any], schema: Dict[str, Any] = None) -> Dict[str, Any]:
    """Validate basic module shape.

    This validator is intentionally simple. For full validation, use JSON
    schema and a library like `jsonschema`.
    """
    schema = schema or SAMPLE_SCHEMA

    # very light validation for demonstration
    result = {"is_valid": True, "errors": []}

    if not isinstance(module_data, dict):
        result["is_valid"] = False
        result["errors"].append("module must be an object")
        return result

    for key in schema.get("required", []):
        if key not in module_data:
            result["is_valid"] = False
            result["errors"].append(f"missing required property: {key}")

    # more rules can be added here
    return result

if __name__ == '__main__':
    print(json.dumps(validate_module({}), indent=2))
```

---

### docs/templates/TEMPLATE_README.md
```markdown
# Template: Stat Block Parsing & Validation

This directory provides TIER 1 template files that are intentionally generic.
They are meant to teach architecture, not a specific game system.

How to use templates:
1. Copy `TEMPLATE_StatBlockParser.py` to `system-profiles/<SystemName>/parser.py` and replace placeholders:
   - `{SYSTEM_NAME}`, `{DIFFICULTY_METRIC}`, `{STAT_FORMAT}`
   - Replace regex patterns with actual system-specific patterns
2. Copy `TEMPLATE_ModuleValidator.py` to `system-profiles/<SystemName>/validator.py` and adjust schema
3. Copy `TEMPLATE_SchemaDefinition.json` to `system-profiles/<SystemName>/schema.json` and update property names

Design principles:
- Keep templates free from domain-specific language
- Use small, well-documented placeholders
- Keep all system-specific detail inside the `system-profiles/<SystemName>` adapter

Notes:
- The `SystemAdaptationGuide.md` references these templates for NotebookLM prompts.
- The `docs/examples/` folder contains a fully-implemented example (Tier 2) showing how the C&C code fills the templates.
```

---

### src/lib/full-document-pipeline.ts
```typescript
(See the file in the repo; this file orchestrates high-level pipeline flows and demonstrates how to integrate your classification rules into the existing pipeline.)
```

> NOTE: Because `full-document-pipeline.ts` is extensive, we recommend you use the `generate_code_markdown.py` tool to chunk the file into NotebookLM-sized pieces if needed. Example:

```bash
python3 scripts/generate_code_markdown.py --outdir tmp/code_markdown --max-words 3000 --dirs src --map
```

---

### src/lib/stat-block-types.ts
```typescript
export type WarningType = 'error' | 'warning' | 'info';

export interface ValidationWarning {
  type: WarningType;
  category: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  warnings: ValidationWarning[];
  complianceScore: number;
}

export interface ParsedStatBlock {
  name: string;
  fields: Record<string, string>;
  notes: string[];
  original: string;
}

export type ParsedNPC = ParsedStatBlock;
```

---

### src/lib/stat-block-helpers.ts
```typescript
(See the file in the repo; this contains helper functions used to canonicalize fields and detect named entities.)
```

---

### src/lib/utils.ts
```typescript
(Utility functions used by the system; include `cn` helper and other small helpers.)
```

---

### src/lib/document-analyzer.ts
```typescript
(Contains functions to analyze a document for stat blocks; helpful for generating reports and validations.)
```

---

Tips for NotebookLM:
- If your skeleton is large, run `scripts/generate_code_markdown.py` to split code into Markdown chunks: `python3 scripts/generate_code_markdown.py --outdir tmp/code_markdown --max-words 3000 --dirs src,scripts` and then upload the `tmp/code_markdown` chunks.
- For template-only uploads, prefer `tmp/code_markdown` plus `docs/templates/*.md`.

