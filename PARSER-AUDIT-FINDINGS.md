# Parser Audit Findings
## Date: November 16, 2025

## Executive Summary
Based on analysis of Mouths of Madness canonical output against source document:
- **Source**: 125 stat blocks
- **Output**: 129 entries
- **Net**: +4 entries (over-extraction)

## Verified Issues

### 1. Bold Formatting Preserved in Titles ✓ CONFIRMED
**Severity**: Critical - Breaks title formatting

**Evidence**: 7 entries have `**...*:` formatting in titles:
```
**Batrachianoid*:** _
**Losel*:** _
**Iggy the Mad*:** _
**Batrachianoids* x 6:** _
**Harpy*:** _
**Fire Beetles*, Giant:** _
**The Little Hillwood Werewolf*:** _
```

**Root Cause**: Parser preserves bold markdown when extracting inline labels
**Impact**: Titles display with raw markdown in UI
**Fix Required**: Strip bold formatting (`**`) and emphasis markers (`*`, `_`) from extracted titles

---

### 2. Non-Stat-Block Entries ✓ CONFIRMED  
**Severity**: High - Inflates creature count

**Evidence**: 4+ entries that are not actual stat blocks:
```
)** _                    <- Parse error/fragment
86-90                    <- Random encounter table reference
(fisherman/hunter/trapper/woodcutter)  <- Occupation descriptor only
```

**Root Cause**: Parser captures text matching parenthetical pattern but lacking stat block structure
**Impact**: False positives in creature index
**Fix Required**: Validate entries have minimum required fields (HP, AC, raceClass)

---

### 3. Incomplete Subtype Families ✓ PARTIAL
**Severity**: Medium - Variant coverage varies

**Evidence**:
- **Wolves**: ✓ Present - "Wolf, Grey" + "Wolves x 5" + "The Little Hillwood Werewolf"
- **Boars**: ✓ Present - "Boar, wild" 
- **Giants**: ✓ Present - "Wily Wil, Giant of the Hill" (only 1 giant in source)
- **Bears**: ✓ Present - "Bear, black" + "Black Bear" + "Black Bear cubs x 2"
- **Spiders**: ✓ Present - "Spider, Giant (medium-sized)" variants

**Status**: Source document only contains ONE giant type (hill giant). No storm/frost/fire giants in this module.
**User Assumption**: Incorrect - assumed multiple giant types based on other C&C materials
**Fix Required**: None - extraction is accurate to source

---

### 4. Truncated Names - INVESTIGATION NEEDED
**Severity**: Medium - May lose important qualifiers

**Observations**:
- "Bat, Cave" vs "Bat, giant cave" - both present (may be duplicates?)
- "Snake, Poisonous" appears 3 times with slight variations
- "Kobold warrior x" appears incomplete (missing number)

**Next Action**: Cross-reference each title against source to verify completeness

---

### 5. Context-Dependent Qualifiers - REQUIRES AUDIT
**Severity**: Low-Medium - May lose Yggsburgh-specific distinctions

**Candidates for Review**:
- "Batrachianoid" - Yggsburgh-specific creature
- "Losel" - Zagyg-specific (ape-men variant)
- Named NPCs: "Iggy the Mad", "Charlie the Ogre", "Pinky the Owlbear"

**Status**: These appear to preserve their unique descriptors in stat blocks
**Fix Required**: Verify named NPCs retain full context in notes field

---

### 6. Alphabetization Gaps ✓ CONFIRMED
**Severity**: Low - Sorting includes markdown artifacts

**Evidence**: When sorted alphabetically, entries show:
```
"Charlie" the Ogre
"Pinky" the Owlbear
(fisherman/hunter/trapper/woodcutter)
)** _
**Batrachianoid*:** _
**Batrachianoids* x 6:** _
**Fire Beetles*, Giant:** _
```

**Root Cause**: Titles with special characters sort before letters
**Impact**: Index appears disorganized, gaps in alphabetical flow
**Fix Required**: Normalize titles before sorting (remove quotes, bold, punctuation)

---

### 7. Over-Normalized Duplicates - REQUIRES AUDIT
**Severity**: Medium - May lose legitimate variants

**Suspicious Patterns**:
- "Bat, Cave" + "Bat, giant cave" + "Cave bats x 80"
- "Spider, Giant (medium-sized)" appears 3 times
- "Snake, poisonous" + "Snake, Poisonous" + "Snake, poisonous (deadly)" + "Snakes, poisonous"
- "Black Bear" + "Bear, black" (case variation)

**Next Action**: Verify each is a distinct entry in source vs. duplicate extraction

---

### 8. Multi-Column/Multi-Page Continuation - NOT DETECTED
**Severity**: Unknown - Cannot verify without layout

**Status**: Markdown source is single-column
**User Assumption**: Incorrect - assumed PDF layout issues, but source is markdown
**Fix Required**: None for this module

---

## Statistics

### Entry Type Breakdown
| Type | Count | Notes |
|------|-------|-------|
| Valid stat blocks | ~120 | Estimated after removing invalid entries |
| Named NPCs | 15+ | "Charlie", "Iggy", "Wily Wil", etc. |
| Quantity groups | 30+ | "x 3", "x 6", "x 30", etc. |
| Invalid/Fragment | 4 | Parse errors, table refs |
| Bold formatting | 7 | Need title cleanup |

### Disposition Distribution
From canonical_report.json: 0 missing (100% coverage)

### Race/Class Distribution  
From canonical_report.json: 0 missing (100% coverage after fallback fix)

## Recommended Fixes

### High Priority
1. **Strip bold/emphasis from titles**: 7 entries need cleaning
2. **Filter non-stat-blocks**: Remove 4+ invalid entries based on validation
3. **Deduplicate case variations**: "Bear, black" vs "Black Bear"

### Medium Priority
4. **Audit truncated names**: Verify "Kobold warrior x" completeness
5. **Standardize variant naming**: Ensure consistent patterns for groups
6. **Verify named NPC context**: Check notes field preservation

### Low Priority
7. **Normalize sorting**: Create displayTitle field for clean alphabetization
8. **Document Yggsburgh-specific creatures**: Add metadata for campaign-specific content

## Next Steps

1. **Create validation script** to identify:
   - Entries missing required fields (HP, AC, HD, XP)
   - Duplicate titles with case variations
   - Truncated or incomplete names

2. **Enhance parser** to:
   - Strip markdown formatting from inline labels
   - Reject entries without minimum stat block structure
   - Flag suspicious patterns for review

3. **Generate clean index** with:
   - Normalized titles (no markdown artifacts)
   - Deduplicated entries
   - Proper alphabetization

## Files for Reference
- Source: `CnC Docs/02 CZ Ruins Mouths of Madness.md` (125 stat blocks)
- Candidates: `data/mouths-of-madness/entities.candidates.json` (initial parse)
- Canonical: `data/mouths-of-madness/entities.canonical.json` (129 entries)
- Report: `data/mouths-of-madness/canonical_report.json` (compliance metrics)
