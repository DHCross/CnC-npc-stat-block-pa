# Gold Standard Monster Index Requirements

## Current Status: 40% Index Validity

**Problem**: Parser extracts **encounter instances** instead of **unique stat blocks**

---

## What a Gold Standard Index IS

A reference list of **unique monster stat blocks** that appear in the document.

### Valid Index Entries
- Base creature types: "Goblin", "Orc", "Wolf"
- Size/type variants with different stats: "Bat, cave" vs "Bat, giant cave"
- Deadly variants with different mechanics: "Snake, poisonous" vs "Snake, poisonous (deadly)"
- Named unique creatures with distinct stat blocks: "Wily Wil, Giant of the Hill"

---

## What a Gold Standard Index IS NOT

An encounter log, room population list, or NPC roster.

### INVALID for Index

#### 1. Encounter Quantities
```
❌ "Losel warriors x 30"
❌ "Goblin males x 8"
❌ "Orcs x 3"
❌ "Wolves x 5"
❌ "Bugbears x 3"
❌ "Cave bats x 80"

✓ "Losel"
✓ "Goblin"
✓ "Orc"
✓ "Wolf"
✓ "Bugbear"
✓ "Bat, cave"
```

#### 2. NPCs (not monsters)
```
❌ Robert Cooper
❌ Wilbur Hornblower
❌ Oni Blackbeard
❌ Prisoner #2
❌ Fekk
❌ Children x 3-6
❌ Bandit sentries x 8
❌ Wood Elf Scouts x 11
```

#### 3. Room/Population Descriptors
```
❌ "Goblin males x 4"
❌ "Goblin females x 13"
❌ "Gnoll guards x 2"
❌ "Kobold Bodyguards x 2"
❌ "Orc chieftain's mate"
❌ "Bandit, Lieutenant" (if just a leveled NPC)
```

#### 4. Parse Errors
```
❌ "86-90" (table reference)
❌ ")** _" (markdown fragment)
❌ "96. )" (layout artifact)
```

#### 5. Duplicate Instances
```
❌ "Snake, poisonous"
❌ "Snake, Poisonous" (case variation)
❌ "Snakes, poisonous" (plural, same stats)

✓ "Snake, poisonous" (keep ONE)
✓ "Snake, poisonous (deadly)" (different stats, keep separate)
```

#### 6. Token Artifacts
```
❌ "Harpy*: _**"
❌ "Losel*: _**"
❌ "**Batrachianoid*:** _"

✓ "Harpy"
✓ "Losel"
✓ "Batrachianoid"
```

---

## Extraction Quality vs Index Quality

### Current State
- **Extraction**: 70% ✓ (found the blocks, preserved structure)
- **Index**: 40% ✗ (mixed encounters with stat blocks)

### What Works
✓ Found 129 entities
✓ Preserved HP, AC, disposition, saves
✓ Kept Yggsburgh naming
✓ Stable extraction rules

### What Breaks Gold Standard
✗ Encounter groups treated as unique entries
✗ NPCs mixed with monsters
✗ Quantity variants (x3, x4, x6) create duplicates
✗ Room populations treated as creatures
✗ No deduplication of mechanically identical entries

---

## Required: Second-Pass Classification

### Phase 1: Extract (DONE)
Parse all parentheticals from document → 129 entries

### Phase 2: Classify (NEEDED)
Filter and deduplicate to canonical index:

1. **Remove encounter quantities**
   - "Orcs x 3" → "Orc"
   - Strip " x \d+", " x \d+-\d+" patterns

2. **Remove NPC entries**
   - Filter entries with proper names (capitalized multi-word without commas)
   - Keep: "Goblin, raider" (creature descriptor)
   - Remove: "Robert Cooper" (NPC name)

3. **Deduplicate mechanically identical**
   - "Snake, poisonous" = "Snakes, poisonous" (plural)
   - Keep singular form

4. **Preserve mechanical variants**
   - "Snake, poisonous" ≠ "Snake, poisonous (deadly)" (different stats)
   - Keep both

5. **Remove population descriptors**
   - "Goblin males" → "Goblin"
   - "Gnoll females" → "Gnoll"
   - Strip "males", "females", "guards", "sentries", "warriors"

6. **Clean markdown artifacts**
   - Strip **, *, _, : patterns
   - Already done in cleanup script

---

## Implementation Plan

### Script: `build_canonical_index.cjs`

```javascript
function buildCanonicalIndex(cleanedEntries) {
  // 1. Strip quantity suffixes
  // 2. Normalize to singular
  // 3. Remove population descriptors
  // 4. Filter NPCs
  // 5. Deduplicate by normalized name
  // 6. Preserve mechanical variants (check stat differences)
  // 7. Sort alphabetically
}
```

### Expected Output

From 123 clean entries → ~40-60 unique stat blocks

---

## Validation Criteria

A Gold Standard Index passes when:

1. ✓ No "x N" quantity patterns remain
2. ✓ No proper-name NPCs (unless unique boss monsters)
3. ✓ No gender/role descriptors (males, females, guards)
4. ✓ No duplicate base creatures with identical stats
5. ✓ All entries are base creature types or mechanical variants
6. ✓ Alphabetical, consistent formatting
7. ✓ Each entry represents ONE unique stat block

---

## Next Steps

1. Create `scripts/build_canonical_index.cjs`
2. Implement classification rules
3. Run on `entities.canonical.clean.json` (123 entries)
4. Output `entities.canonical.index.json` (~50 unique stat blocks)
5. Validate against Gold Standard criteria
6. Document indexing rules for future processing
