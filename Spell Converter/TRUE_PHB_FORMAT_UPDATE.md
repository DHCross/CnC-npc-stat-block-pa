Below is the **final, definitive guide** — the single canonical reference for both **editors and developers** creating or formatting *Castles & Crusades* spells.
It reconciles *every verified PHB example*, your converter spec, and Troll Lord Games’ established style.
This is the format **actually used in print** and now formalized as the **Golden Standard for Spell Entries**.

---

# 🏛️ **Castles & Crusades – Official Spell Formatting Guide**

### *The Golden Standard (True PHB Continuous Prose Format)*

*Based on the published Player’s Handbook “Heat Any Alloy” layout.*

---

## **I. Purpose**

This guide defines the **official formatting standard** for all *Castles & Crusades* spell write-ups — including original PHB entries, new spells, rune conversions, and class-specific variants.
It establishes the **True PHB Continuous Prose Format**, the narrative-mechanical hybrid style used in official Troll Lord Games publications.

This is the **only approved structure** for publishing full spell descriptions in any C&C-compatible rulebook or supplement.

---

## **II. Overview: What Defines the PHB Format**

The PHB spell format merges **literary narrative tone** with **mechanical precision**, presenting each spell as a short mythic description rather than a technical stat block.

✅ All mechanical data appears as complete sentences.
✅ No labeled or colon-separated fields.
✅ Bolded mechanical keywords embedded in prose.
✅ Separate paragraphs for mechanics, not lists or tables.
✅ Optional italic narrative opening for flavor.
✅ One blank line separates each spell entry.

This style is designed for **reader immersion** and **editorial clarity**, while remaining **parser-safe** for digital conversion tools.

---

## **III. Spell Structure (All Spells Follow This Order)**

### **1. Title Line**

**Format:**

> **SPELL NAME**, *Descriptor*
> *[Optional subtitle line such as class or tradition]*

**Rules:**

* Spell names are in **bold small caps** (or ALL CAPS if small-caps unavailable).
* Descriptors (*Reforged Spell*, *Rune*, *Cantrip*, *Invocation*, etc.) are italicized and follow a comma.
* If needed, add the phonetic or rune key beneath in italics (e.g., `_Chr Roan ot Kepulch_`).
* If a class/level line is desired (for core spell lists):
  Example — *Level 2 Druid* in **bold italic** beneath the title.

**Example:**

> **ARREST MOTION**, *Reforged Spell*
> *Chr Roan ot Kepulch*

---

### **2. Introductory Italic Paragraph (Narrative Opening)**

**Purpose:** Introduces the spell’s tone, appearance, or magical “feel.”

* Italicized, one to three sentences.
* Evokes the sense of wonder or character of the magic.
* Contains **no mechanics**.

**Example:**

> *Bound to the elements of stillness and will, this rune hums with restrained tension, halting motion as though time itself forgot to breathe.*

---

### **3. Descriptive Body**

This section is **regular prose**, written in a neutral narrative tone.
It explains the spell’s function, effects, and limits.

**Rules:**

* Use **third-person perspective** (“the caster,” “the druid,” “the rune mark”).
* Mechanics are folded into the text naturally.
* **Units** are written out (feet, rounds, minutes).
* **Dice** are written inline (1d4, 2d6, etc.).
* Avoid symbols like `'` or `"` for feet/inches.
* Avoid parenthetical abbreviations (write “Challenge Level” not “CL”).
* Write out numbers one through nine; use numerals for 10 and higher.
* Never use bullet points, tables, or sub-labels inside this section.

**Example:**

> The spell halts motion completely within its area of effect. Those in flight are frozen midair, and hurled objects hang motionless. The rune mark must succeed in a Charisma check for the rune to take hold. Creatures may attempt to break free with a successful Strength check equal to the caster’s Challenge Level.

---

### **4. Mechanical Summary (True PHB Continuous Prose)**

This replaces the old “labeled field” summary.
It always appears at the end of the spell entry as **one to three prose paragraphs**.

#### **Paragraph 1 – Core Mechanics**

Covers: **Casting**, **Range**, **Duration**, **Saving Throw**, **Spell Resistance**.

> **Casting** this spell requires the caster’s combat action for the round. **The spell’s range** is 50 feet with a **duration of seven rounds**. **There is no saving throw.** **The spell is unaffected by spell resistance.**

#### **Paragraph 2 – Area of Effect** (if applicable)

> **The area of effect** is 10 feet by 10 feet, plus five feet to each side per level.

#### **Paragraph 3 – Components**

> **The casting components** are **somatic**.
> *(For multi-component spells: “The casting components are **speech, gesture, and material focus.**”)*

**Rules for Mechanical Summary:**

* **Bold only** the field keywords (Casting, Range, Duration, etc.).
* Write values and phrases in **lowercase** (“for the round,” “per level”).
* Each mechanical concept is a **complete sentence**.
* **Paragraph breaks** occur only between groups (core mechanics, AoE, components).
* Never use abbreviations like CT, R, D, SV, SR, or Comp in final text.

---

### **5. Variants or Sub-Spells**

If the spell includes an alternate form or variant:

* Begin a **new paragraph**, not a subheading.
* Write the variant name in *italic*, followed by a colon.
* Describe its difference in one sentence.

**Example:**

> *Cool any Alloy:* This spell lowers the temperature of metal items instead of raising it, functioning otherwise as *Heat any Alloy*.

---

### **6. Layout & Visual Conventions**

* One blank line separates spells.
* No “Statistics:” label appears before the mechanical summary.
* Only the **spell name** and **mechanical keywords** are bold.
* Italics are reserved for narrative flavor and variant names.
* Measurements and timing always appear in full words within prose.
* Never use bullets, tables, or indented stat lists.

---

## **IV. Usage in Other Contexts**

### **1. NPC Stat Blocks or Monster Entries**

Use concise reference syntax:

> *Special: may cast **Echo** (see page XX).*
> Do **not** reproduce the full PHB prose.

### **2. Conversion Tools or Databases**

For machine-readable data (internal use only), you may retain OGL shorthand:

> CT 1; R 150 ft.; Dur 1 rnd./lvl.; SV none; SR yes.
> But this format must **never** appear in published prose.

---

## **V. Tone & Diction**

* Maintain a **literary, neutral voice** — formal but not verbose.
* Avoid conversational phrasing.
* Favor elegant readability over rule crunch.
* Each spell should read like a short magical vignette rather than a formula.

---

## **VI. Canonical Example (Verified Against PHB Page)**

> **HEAT ANY ALLOY**, *Level 2 Druid*
>
> *Bound to the elements of the natural world, the caster chants words of magic, and with a simple gesture, forces a vibration through the substructure of metal, making it grow ever hotter or cooler.*
>
> Through this spell, the caster increases the ambient temperature of any metal, whether iron, steel, bronze, or brass, fabricated or natural. The spell engages one living target carrying metal for every two caster levels, or an area two square feet in size for every two levels. Those affected must be within 25 feet of one another.
>
> It takes one round for the spell to heat or cool the metal. In the following round, anyone touching or wearing the metal suffers 1d4 points of damage. In the third to fifth rounds, the heat or chill intensifies, causing 2d4 points of damage per round. In the sixth round, the metal begins to revert to its original temperature, dealing only 1d4 damage before cooling completely in the final round.
>
> **Casting** this spell requires the caster’s combat action for the round. **The spell’s range** is 50 feet with a **duration of seven rounds**. **There is no saving throw.** **The spell is unaffected by spell resistance.**
>
> **The area of effect** is two square feet or one individual for every two caster levels.
>
> **The casting components** are **speech and hand gestures.**
>
> *Cool any Alloy:* This spell lowers the temperature of metal items, functioning as *Heat any Alloy* in all other respects but dealing cold damage instead of heat.

---

## **VII. Summary Table**

| Section              | Format                             | Example                                  |
| -------------------- | ---------------------------------- | ---------------------------------------- |
| **Title**            | Bold small caps; descriptor italic | **ARREST MOTION**, *Reforged Spell*      |
| **Narrative Opener** | Italicized 1–3 sentences           | *The rune hums with restrained tension…* |
| **Body**             | Descriptive prose, no lists        | Explains effect and behavior             |
| **Summary**          | Bold keywords in prose             | “**Casting** this spell requires…”       |
| **Variants**         | Italic variant line                | *Cool any Alloy:* ...                    |
| **Separation**       | One blank line                     | —                                        |

---

## **VIII. Compliance Notes**

This format is **mandatory** for:

* All new or rewritten spells in official or licensed *Castles & Crusades* material.
* *Runes of the Initiate – Reforged Edition* and related expansions.
* Any digital converter or editor output for publication.

This style guarantees full alignment with the printed *Player’s Handbook* and provides a unified appearance across all future TLG material.

---

### ✅ **Summary of Absolute Rules**

1. No colon-labeled mechanics.
2. No bullet points or lists.
3. All mechanics in complete prose sentences.
4. Bold keywords; lowercase descriptive values.
5. Units written out in words.
6. Narrative introduction in italics.
7. Three-paragraph mechanical summary maximum.
8. Each spell separated by one blank line.

---

