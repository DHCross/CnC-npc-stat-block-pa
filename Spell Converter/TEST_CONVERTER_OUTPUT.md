# Spell Converter Test - LIGHT Spell

## Original Input (from 01 The Runes of the Initiate.txt):

```
LIGHT (Int) (Roan ot Mur)

CT 1			R see below	D 10 min./lvl.

SV none		SR none	Comp S

This rune sheds light that extends up to 20 feet in radius from the inscription. It lasts one turn per level.

The light's intensity depends upon the pressure placed on the rune when it is inscribed. If the rune mark wishes the light to be dull, he inscribes the rune lightly; for more intense light, more pressure is placed when the rune is written. If vocalized, the rune's inflection determines its intensity. The light can be dull and dim or exceedingly bright as the rune mark chooses.
```

## Expected PHB Format Output (from Converter):

```markdown
**LIGHT**, *Reforged Spell*
_Int Roan ot Mur_

*[Add narrative opening: 1-3 sentences describing what the magic feels or looks like]*

This rune sheds light that extends up to 20 feet in radius from the inscription. It lasts one turn per level.

The light's intensity depends upon the pressure placed on the rune when it is inscribed. If the rune mark wishes the light to be dull, he inscribes the rune lightly; for more intense light, more pressure is placed when the rune is written. If vocalized, the rune's inflection determines its intensity. The light can be dull and dim or exceedingly bright as the rune mark chooses.

**Casting Time:** 1 round. **Range:** See below. **Duration:** 10 minutes per level. **Saving Throw:** None. **Spell Resistance:** None. **Components:** Somatic.
```

## Checklist - What the Converter Should Do:

✅ Spell name → UPPERCASE
✅ Subtitle → *Reforged Spell* (italicized)
✅ Metadata → _Int Roan ot Mur_ (italicized)
✅ Narrative placeholder added
✅ Body text → unified prose (no Description/Effect labels)
✅ Components → expanded (S → Somatic)
✅ Inline stats → bold labels separated by periods
✅ Capitalization → "None" not "none"
✅ **NEW:** Casting Time → complete phrase ("1 round" not just "1")
✅ **NEW:** Range → capitalized ("See below" not "see below")
✅ **NEW:** All stat values → complete phrases with proper units

## Key Fixes Applied in Latest Update:

1. **Casting Time:** "1" → "1 round" (complete phrase with units)
2. **Range:** "see below" → "See below" (capitalized)
3. **Saving Throw:** "see below" → "See below" (capitalized)
4. **Saving Throw:** "none" → "None" (capitalized)
5. **Spell Resistance:** "yes" → "Yes", "no" → "No", "none" → "None"
6. **Components:** "S" → "Somatic", "V" → "Verbal", "M" → "Material"

## Test Instructions:

1. Go to http://localhost:3001
2. Navigate to Spell Converter tab
3. Paste the original input above
4. Verify output matches expected format
5. Check all items in checklist
6. **IMPORTANT:** Test with the Arrest Motion spell to ensure "CT 1" becomes "Casting Time: 1 round"
