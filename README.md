
# Castles & Crusades NPC Stat Block Parser

## Features

- Converts strict and prose-style NPC stat blocks to Jeremy Farkas editorial standards (Victor Oldham reference style)
- Supports parenthetical HP/AC, prose disposition ("He is a ..."), equipment from natural language ("He carries ..."), and mount from prose ("rides a ...")
- Editorial enforcement: italics, complete sentences, PHB attribute order, shield normalization, PHB item renames, magic item italicization
- Comprehensive validation and auto-correction for C&C compliance
- Batch processing and compliance scoring

## Recent Enhancements (2025-09-19)

- **Flexible Parsing**: Accepts parenthetical/prose NPC entries (e.g., `**Sir Reynard** (HP 59, AC 13/22) He is a lawful good human knight. He carries ... He rides ...`).
- **Prose Equipment Extraction**: Parses items from sentences like "He carries ..." and normalizes/italicizes as needed.
- **Prose Mount Extraction**: Detects mounts from "rides a/an ..." and generates canonical warhorse block.
- **Disposition Parsing**: Accepts "He is a/an ..." and "They are a/an ..." phrasing.
- **Block Detection**: Recognizes HP/AC with or without colons; accepts title + parenthetical + prose body.
- **Test Coverage**: Added tests for flexible input; all 20 tests passing.

## Usage

Paste NPC entries in either strict or prose format. Example:

```
**Sir Reynard** (HP 59, AC 13/22) He is a lawful good human knight. He carries a pectoral of protection +3, full plate mail, a shield, and a mace. He rides a heavy war horse.
```

Output will:
- Render vital stats, disposition, equipment (with PHB renames and shield normalization), and mount block in correct narrative format.
- Enforce Jeremy Farkas editorial standards.

See CHANGELOG.md for details.
