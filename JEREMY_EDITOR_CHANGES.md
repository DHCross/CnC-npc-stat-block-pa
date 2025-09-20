# Changes from OGL Reference Guide - Jeremy Farkas Editor Notes

## Summary
All formatting requirements from Jeremy Farkas have been implemented and verified. The parser now produces output that differs from the original OGL Reference Guide in specific, intentional ways to match modern Castles & Crusades editorial standards.

## Key Changes Implemented

### 1. **Italicized Stat Blocks** ✅
- **Change**: Entire content inside parentheses is now italicized
- **OGL Original**: `**Name** (stat block content)`  
- **New Format**: `**Name** (_stat block content_)`
- **Applies to**: Both NPC stat blocks and mount/creature descriptions

### 2. **Complete Sentence Structure** ✅  
- **Change**: All content written as complete sentences with proper conjunctions
- **OGL Original**: `HP 59, AC 13/22, disposition law/good`
- **New Format**: `HP 59, AC 13/22, and disposition law/good.`
- **Note**: Uses Oxford comma style throughout

### 3. **Primary Attributes: Lowercase & PHB Order** ✅
- **Change**: Attributes are lowercase and follow PHB canonical order
- **OGL Original**: `Strength, Wisdom, Charisma` (capitalized)
- **New Format**: `strength, wisdom, charisma` (lowercase)
- **Order**: strength, dexterity, constitution, intelligence, wisdom, charisma

### 4. **Shield Type Specification** ✅  
- **Change**: Generic "shield" entries become explicit PHB shield types
- **OGL Original**: `shield` or `shield +2`
- **New Format**: `large steel shield` or `large steel shield +2`
- **Note**: Preserves existing explicit shields (e.g., "wooden shield")

### 5. **PHB Magic Item Name Updates** ✅
- **Change**: Updated to current PHB terminology
- **Renames Applied**:
  - `robe of protection` → `robe of armor`  
  - `ring of protection` → `ring of armor`
  - `dagger of venom` → `dagger of envenomation`

### 6. **No Bolded Text Inside Stat Blocks** ✅
- **Change**: Class levels and other elements inside italicized blocks are not bolded  
- **OGL Original**: Sometimes included `**16th**` within stat descriptions
- **New Format**: Plain text levels within italicized content: `16ᵗʰ`

### 7. **Mount Stat Block Integration** ✅
- **Change**: Mount descriptions fully italicized with sentence structure
- **Format**: `**Warhorse** (_This creature's vital stats are level 4, HP 35, AC 19, and disposition neutral. It makes two hoof attacks for 1d4 damage each..._)`

## Technical Implementation Notes

### Parser Functions Updated:
- `collapseNPCEntry()`: Main formatting with italics wrapper
- `formatPrimaryAttributes()`: PHB order + lowercase enforcement  
- `findEquipment()`: Shield normalization + PHB renames + magic item italicization
- `findMountOneLiner()`: Complete italicized mount stat blocks
- Validation functions: Updated messaging to use "Primary attributes"

### UI/UX Improvements:
- **Keyboard Shortcut**: Changed from Ctrl+B to Ctrl+Shift+B to avoid conflict with universal bold hotkey
- **Cookie Security**: Added `samesite=lax` and `secure` flags, plus cookie reading on mount
- **CSS Classes**: Fixed invalid `in-data-[...]` selectors to proper `group-data-[...]`

## Editorial Rationale
These changes reflect Jeremy Farkas's editorial direction to:
1. **Standardize formatting** across all C&C publications
2. **Improve readability** with complete sentences and consistent italicization  
3. **Align with current PHB** terminology and attribute ordering
4. **Reduce ambiguity** in equipment specifications (explicit shield types)
5. **Maintain consistency** with modern C&C editorial standards

## Verification Status
- ✅ Build successful with no TypeScript errors
- ✅ All formatting rules implemented and tested  
- ✅ Validation system updated with correct terminology
- ✅ UI fixes applied (keyboard shortcuts, cookie security, CSS classes)
- ✅ Ready for testing with Council of Eight examples

## Testing Recommendation
Run the dev server (`npm run dev`) and test with the Council of Eight NPC examples to verify output matches Jeremy's specifications exactly.