# Phase 1: Signal Extraction Implementation - Complete

## Summary

Successfully implemented Version 3.0 signal extraction module (`extractSignals()`) in `src/lib/classification-rules.ts`. All six core signals are now correctly detected with comprehensive validation against both unit tests and the full mouths-of-madness dataset (129 entities).

## Implementation Details

### Six Core Signals (per Version 3.0 Section 0)

1. **HasSpells**: Detects spell lists, spell slots, or "can cast" phrases
   - Filters out false positives (e.g., "destroyed by a spell")
   - Pattern: `/(?:spellcaster|spellcasting|can\s+cast|casts?\s+\d+|spells?\s+per\s+day)/i`

2. **HasClassKeyword**: Detects explicit class names
   - Classes: fighter, cleric, wizard, rogue, thief, paladin, ranger, bard, druid, monk, barbarian, assassin, illusionist, knight, magic-user
   - Renamed from `CHARACTER_CLASSES` to `CLASS_KEYWORDS`

3. **HasRankTitle**: Detects leadership/rank titles (separate from class keywords)
   - Titles: chieftain, captain, lieutenant, sergeant, shaman, priest, acolyte, king, queen, etc.
   - Renamed from `LEADERSHIP_TITLES` to `RANK_TITLES`
   - Important: Rank detection is now separated from class detection per Version 3.0 requirements

4. **IsNamed**: Proper noun detection (capitalized names not in exclusion lists)
   - Excludes: monster types, rank titles, hireling types, generic descriptors
   - Handles plurals correctly (e.g., "Bandits" → not named, "Ember" → named)
   - Examples: "Ember Raventree" (✓), "Wily Wil" (✓), "Goblin Captain" (✗)

5. **IsUnit**: Numeration detection in header
   - Patterns: `x4`, `x 4`, `(3)`, `2-12`, etc.
   - Improved regex to handle spaces: `/\b(?:x\s*\d+|\d+\s*x|\(\d+\)|\d+-\d+)\b/i`
   - Also checks plural monster names with numeration

6. **IsHumanoid**: PC-like race detection
   - Races: human, elf, dwarf, halfling, gnome, half-elf, half-orc
   - Handles elf variants: wood elf, high elf, dark elf, wild elf, sea elf
   - Checks multiple locations: raceClass field, level field, creature name itself

### Signal Extraction Context

```typescript
export interface SignalExtractionContext {
  spells?: string;              // From ParentheticalData
  raceClass?: string;           // From ParentheticalData
  description?: string;         // Full description text if available
}
```

## Test Results

### Unit Tests: 8/8 Passed ✓

All test cases validate correctly:
- Ember Raventree: HasClassKeyword + IsNamed + IsHumanoid
- Goblin Shaman: HasSpells + HasRankTitle
- Bandits (x4): IsUnit only
- Bandit Captain: HasClassKeyword + HasRankTitle
- Wily Wil: IsNamed only (giant, not humanoid)
- Pinky the Owlbear: IsNamed only (monster, not humanoid)
- Orc Captain: HasRankTitle only
- Marcus the Wizard: HasSpells + HasClassKeyword + IsNamed

### Dataset Validation: 129 Entities

Signal distribution from mouths-of-madness dataset:
- **HasSpells**: 3 (2.3%) - Spellcasters
- **HasClassKeyword**: 0 (0.0%) - No explicit class names in dataset
- **HasRankTitle**: 20 (15.5%) - Leaders, captains, sergeants, shamans
- **IsNamed**: 42 (32.6%) - Proper names (Ember, Wily Wil, Gruzz Kree, King Krusher)
- **IsUnit**: 48 (37.2%) - Groups with numeration
- **IsHumanoid**: 6 (4.7%) - PC races (wood elf, etc.)

### Notable Corrections

1. **IsUnit** improvements:
   - Fixed regex to handle spaces: "x 5", "x 6" now detected correctly
   - Increased detection from 10.9% → 37.2%

2. **IsNamed** false positive removal:
   - "Green slime" → not named (✓)
   - "Goblin Skeletons" → not named (✓)
   - "Orcs" → not named (✓)
   - Reduced false positives from 48.1% → 32.6%

3. **HasSpells** refinement:
   - "Green slime" no longer triggers false positive from "destroyed by a spell" text
   - Now requires active spell casting indicators

4. **IsHumanoid** expansion:
   - "Ember Raventree (wood elf leader)" now correctly detected as humanoid
   - Checks creature name in addition to canonical fields

## Preview Classifications (5-Step Hierarchy)

Based on the extracted signals, preview classifications show correct Format A/B/C assignments:

**Format A (Classed NPCs)**:
- Ember Raventree: HasRankTitle + IsNamed + IsHumanoid
- Goblin shaman: HasSpells (spellcaster)
- Gruzz Kree (Goblin Chieftain): HasRankTitle + IsNamed
- King Krusher (Orc Leader): HasRankTitle + IsNamed
- Orc lieutenant: HasRankTitle

**Format B (Monsters)**:
- Ape, carnivorous: Default
- Bat, giant cave: Default
- Green slime: Default (no longer misclassified as spellcaster)
- Wily Wil, Giant of the Hill: IsNamed but not humanoid → remains monster

**Format C (Units)**:
- Goblin guards x 4: IsUnit
- Goblin patrol warriors x 5: IsUnit
- Orcs x 3, x 4, x 6: IsUnit
- Orc Guards x 2: IsUnit

## Code Changes

### New Files
- `src/lib/classification-rules.ts`: Added `extractSignals()` function
- `src/lib/classification-rules.ts`: Added `SignalExtractionContext` interface
- `src/lib/classification-rules.ts`: Added `detectProperNoun()` helper function
- `test-signal-extraction.ts`: Unit test suite
- `test-signal-dataset.ts`: Dataset validation script

### Modified Constants
- `CHARACTER_CLASSES` → `CLASS_KEYWORDS` (renamed for clarity)
- `LEADERSHIP_TITLES` → `RANK_TITLES` (renamed for clarity)
- `HUMANOID_RACES`: Expanded with elf variant handling

### Key Functions
- `extractSignals()`: Main signal extraction function (6 signals)
- `detectProperNoun()`: Proper noun detection with comprehensive exclusions
- Updated `MONSTER_TYPE_FLAT_SET` usage for plural handling

## Architecture Notes

The signal extraction module is designed to be **additive and non-breaking**:
- Does not modify existing classification logic
- Provides foundation for Phase 2 (5-step hierarchy implementation)
- Can be used independently for analysis and debugging
- Returns both boolean signals and detected context (className, rankTitle, race)

## Next Steps (Phase 2)

With signal extraction complete, the next phase will:
1. Implement 5-step classification hierarchy using extracted signals
2. Replace binary `hasClassLevels` logic with three-way Format A/B/C system
3. Apply Version 3.0 priority rules (Spells > Class/Rank > Named+Humanoid > Unit > Monster)
4. Handle override cases (bandits, named non-humanoids, etc.)

## Verification Commands

```bash
# Run unit tests
npx tsx test-signal-extraction.ts

# Validate against dataset
npx tsx test-signal-dataset.ts

# Check specific entity
jq '.[] | select(.title == "Ember Raventree (wood elf leader)")' \
  data/mouths-of-madness/entities.canonical.json
```

## Risk Assessment

**✅ Low Risk**: Signal extraction is purely additive
- No changes to existing formatting logic
- No changes to canonical data generation
- Existing tests remain passing
- Can be tested independently before integration

---

**Status**: Phase 1 Complete ✓  
**Date**: 2025-11-16  
**Tests**: 8/8 unit tests passed, 129 dataset entities validated  
**Next**: Phase 2 - 5-step classification hierarchy implementation
