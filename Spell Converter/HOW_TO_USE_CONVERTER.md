# How to Use the Spell Converter for PHB Format

## The App is Now Ready!

The spell converter at **http://localhost:3001** has been updated to output **True PHB Continuous Prose Format**.

## What the Converter Does Automatically:

✅ **Spell names** → UPPERCASE
✅ **Subtitle** → Italicized (*Reforged Spell*)
✅ **Components** → Expanded (S → Somatic, V → Verbal, M → Material)
✅ **Capitalization** → Fixed (yes → Yes, none → None)
✅ **Mechanics as prose** → NO labeled fields - all mechanics in complete sentences
✅ **Unified body** → Description and Effect combined without labels
✅ **PHB-accurate structure** → Follows "Heat any Alloy" format exactly

## What Needs Human Touch:

📝 **Narrative Opening** - The converter flags where it's needed with:

`*[Add narrative opening: 1-3 sentences describing what the magic feels or looks like]*`

A human writer replaces this with sensory, evocative prose.

### True PHB Continuous Prose Output:
```markdown
**ARREST MOTION**, *Reforged Spell*
_Chr Roan ot Kepulch_

*[Add narrative opening: 1-3 sentences describing what the magic feels or looks like]*

Arrest motion stops objects in motion...

Casting this rune requires the caster's combat action **for the round**. The rune's **range is 150 feet** with a **duration of 1 round per level**. A **See below saving throw** is allowed. The rune **is affected by spell resistance**.

The **area of effect is 10 feet by 10 feet, plus 5 feet to each side per level**.

The casting components are **somatic**.
```

**Note:** Mechanics are now in complete sentences, NOT labeled fields. This matches the PHB "Heat any Alloy" format exactly.

## Workflow:

1. **Open the app:** http://localhost:3001
2. **Copy spell** from [01 The Runes of the Initiate.txt](01%20The%20Runes%20of%20the%20Initiate.txt)
3. **Paste into Spell Converter tab**
4. **Copy the output** (converter does all structural work)
5. **Replace narrative placeholder** with creative opening (human writer)

## Example Input (from original file):

```
BREATH (Chr) (Roan ot Higle)

CT 1			R touch		D see below

SV none		SR no		Comp S

Breath creates breathable air and is useful in almost every environment under water, in sulfurous caverns, in the Void, or on other planes where air might be in short supply or does not exist at all.
```

## Example Output (from converter):

```markdown
**BREATH**, *Reforged Spell*
_Chr Roan ot Higle_

*[Add narrative opening: 1-3 sentences describing what the magic feels or looks like]*

Breath creates breathable air and is useful in almost every environment under water, in sulfurous caverns, in the Void, or on other planes where air might be in short supply or does not exist at all.

Casting this rune requires the caster's combat action **for the round**. The rune's **range is touch** with a **duration of see below**. There is **no saving throw**. The rune is **unaffected by spell resistance**.

The casting components are **somatic**.
```

**Notice:** No "Casting Time:", "Range:", etc. labels - just complete prose sentences with bold keywords.

## Final Step:

Replace the placeholder with a narrative opening like:

*"The rune stirs the void, calling forth breath where there is none—a whisper of life in the airless dark, sustaining those who would otherwise perish."*

## Progress Tracking:

See [CONVERSION_PROGRESS.md](CONVERSION_PROGRESS.md) for a checklist of which spells have been completed.
