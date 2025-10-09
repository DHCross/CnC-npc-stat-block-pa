# Spell Converter - Usage Guide

## Quick Start

The spell converter is integrated into the main application as the third tab. It can process both single spells and batch files.

### Using the UI

1. Launch the app: `npm run dev`
2. Navigate to the **Spell Converter** tab (Wand icon)
3. Choose an option:
   - **Paste spell text** directly into the input area
   - **Load Example**: Click to see sample conversion
   - **Load Batch**: Try converting multiple spells at once

### Command-Line Conversion

For batch processing of files, use the conversion script pattern:

```typescript
import { convertLegacySpellText } from './src/lib/spell-converter';
import { readFileSync, writeFileSync } from 'fs';

const inputFile = readFileSync('./path/to/spells.txt', 'utf-8');
const results = convertLegacySpellText(inputFile);

// Save results
const output = results.map(r => r.formatted).join('\n\n---\n\n');
writeFileSync('./output.md', output, 'utf-8');
```

## Example Conversions

### Simple Single-Line Stats

**Input:**
```
**Light** **(Int)**

CT 1   R see below   D 10 min./lvl.   SV none   SR none   Comp S

This rune sheds light that extends up to 20 feet in radius.
```

**Output:**
```markdown
**Light**, Reforged Spell
_Int_

*Description:* This rune sheds light that extends up to 20 feet in radius.

Statistics:
- Casting Time: 1
- Range: see below
- Duration: 10 minute per level
- Saving Throw: none
- Spell Resistance: none
- Components: S
```

### Multi-Line Stats with Effects

**Input:**
```
**Arrest Motion** **(Chr) (Roan** **ot** **Kepulch)**

CT 1			R 150ft.		D 1 rd./lvl.

SV see below		SR yes		Comp S

Arrest motion stops objects in motion or keeps them from moving.

The targets are held exactly as they are when the rune is activated.
```

**Output:**
```markdown
**Arrest Motion**, Reforged Spell
_Chr Roan ot Kepulch_

*Description:* Arrest motion stops objects in motion or keeps them from moving.

*Effect:* The targets are held exactly as they are when the rune is activated.

Statistics:
- Casting Time: 1
- Range: 150 feet
- Duration: 1 round per level
- Saving Throw: see below
- Spell Resistance: yes
- Components: S
```

## Supported Input Formats

### Statistics Formats
The parser handles various formatting styles:

1. **Single line with tabs**: `CT 1\tR touch\tD instant`
2. **Single line with spaces**: `CT 1   R touch   D instant`
3. **Multi-line**: Stats split across 2-3 lines with blank lines between
4. **Mixed spacing**: Inconsistent spacing is normalized

### Measurement Abbreviations

All common abbreviations are automatically expanded:

| Abbreviation | Expanded Form |
|--------------|---------------|
| `ft` / `ft.` | feet |
| `rd` / `rd.` | round |
| `min` / `min.` | minute |
| `hr` / `hr.` | hour |
| `lvl` / `lvl.` | level |
| `/lvl` | per level |

Examples:
- `150ft.` → `150 feet`
- `1 rd./lvl.` → `1 round per level`
- `10 min./lvl.` → `10 minute per level`

### Spell Name Canonicalization

The converter includes 618 canonical spell name mappings. Examples:

| Original | Canonical |
|----------|-----------|
| BINDING | Bind |
| LIGHT | Light |
| DARKNESS | Darkness |
| Cure Light Wounds | Heal Light Wounds |

## Features

### Automatic Processing
- ✅ Removes bold markers (`**text**`)
- ✅ Extracts metadata from parentheses
- ✅ Normalizes all measurements
- ✅ Maps to canonical spell names
- ✅ Separates description from effect text
- ✅ Generates warnings for missing fields

### Batch Processing
- Processes multiple spells separated by blank lines
- Skips preamble text automatically
- Handles varying quality input
- Maintains spell order

### Validation
- Checks for all 6 required statistics fields
- Warns if description is missing
- Identifies malformed entries
- Reports canonical name mappings

## API Reference

### Main Function

```typescript
function convertLegacySpellText(text: string): SpellConversionResult[]
```

**Parameters:**
- `text`: Raw spell text (single or multiple spells)

**Returns:**
Array of conversion results with:
- `originalName`: Name as it appeared in source
- `canonicalName`: Official Reforged Edition name
- `metadata`: Extracted metadata (class, rune name, etc.)
- `description`: First paragraph
- `effect`: Remaining paragraphs
- `statistics`: All stat fields
- `formatted`: Ready-to-use Markdown output
- `warnings`: Array of validation warnings

## Troubleshooting

### Common Issues

**Problem**: Statistics not detected
- **Cause**: Missing field labels (CT, R, D, etc.)
- **Solution**: Ensure at least one stat line contains standard labels

**Problem**: Spell name not detected
- **Cause**: No all-caps or bold markers
- **Solution**: Ensure spell name is distinctive (title case, bold, or all caps)

**Problem**: Stats split incorrectly
- **Cause**: Unusual formatting
- **Solution**: Check for consistent blank lines between stat blocks

### Warning Messages

| Warning | Meaning | Action |
|---------|---------|--------|
| Missing casting time | CT field not found | Check source formatting |
| Missing range | R field not found | Verify field labels |
| Missing duration | D field not found | Check for typos |
| Missing description paragraph | No body text | Add spell description |

## Performance

- **Speed**: ~30 spells/second
- **Memory**: Minimal overhead
- **File Size**: Handles files up to several MB

## Integration

The spell converter integrates seamlessly with:
- Document Analyzer (tab 2)
- NPC Parser (tab 1)
- Existing spell name dictionary
- Canon name mapping system

All features share the same UI patterns and data structures.
