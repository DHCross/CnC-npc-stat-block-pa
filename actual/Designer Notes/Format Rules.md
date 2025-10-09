
Nice — here’s the *explicit*, compact style sheet for **capitalization, bolding, italics, parentheses, and all stat-block formatting** you asked for. Copy this into your project style guide and lint rules.

# Canonical formatting rules (short & exact)

**1) Headings / names**

* The NPC/monster heading line is the *only* place that may be bolded. Use Markdown bold: `**Name, role**`.
* A person’s *actual name* is **always capitalized** (e.g., `Victor Oldham`).
* Role/title after the comma is sentence-cased or lowercase (e.g., `captain of the town guard`, `High Priest of the Grand Temple` — prefer sentence case for long honorifics).
* Example: `**Gerald Overton, captain of the town guard**`

**2) Parentheses (parenthetical stat block)**

* Use a single compact parenthetical block immediately after the heading or on the following line: `(this 6ᵗʰ level human fighter's vital stats are HP 36, AC 16, disposition neutral. ...)`
* Parentheses contain only *mechanical*, labeled data or a compact prose sentence summarizing them. Do **not** place long flavor text, nested parentheses, or multi-paragraph prose inside parentheses.
* Parenthetical must be plain text except for allowed italics (see rule 4). Do **not** bold anything inside a parenthetical.
* No nested parentheses — if you need extra detail, make a separate indented block below the parenthetical.

**3) Sentence case & capitalization inside parenthetical**

* Use sentence case for sentences.
* Attribute names and class/race names are lowercased where specified (see attributes rule).
* Mechanical abbreviations: `HP`, `AC`, `HD` — these are uppercase. Example: `HP 56, AC 20`.
* Levels outside parentheses use superscript ordinals (see rule 6). Inside the parenthetical use the compact phrase `this 6ᵗʰ level human fighter` or `this 6th-level human fighter` depending on renderer, but prefer superscript when rendering final output.

**4) Italics**

* Italics are *only* for:

  * Magic item names and bonuses: `*longsword +1*`, `*pectoral of protection +3*`
  * Spell names and spellbook/source titles: `*cure light wounds*`, `*Book of Shadows*`
  * Unique artifact proper nouns (one-off named items).
* Do **not** italicize mundane gear, armor types, whole parentheticals, or headings.
* Example: `Equipment: *longsword +1*, full plate mail, medium steel shield`

**5) Bold**

* Only the heading line (the name/role) uses bold. Never bold inside the parenthetical or equipment lines.

**6) Levels / ordinals**

* When shown in prose outside italicized blocks, use superscript ordinals: `6ᵗʰ`, `1ˢᵗ`, `2ⁿᵈ`, `3ʳᵈ`.
* Do **not** bold the level inside the parenthetical.
* For classed NPCs, prefer a single numeric HP total (e.g., `HP 56`) rather than dice notation; for monsters or creature stat blocks use dice notation where appropriate (`HD 4d10, HP 35`).

**7) Attributes**

* Attribute names are always **lowercase** and spelled out in full: `strength, dexterity, constitution, wisdom, intelligence, charisma`.
* Example: `Primary attributes: strength, wisdom, charisma`

**8) Disposition / alignment**

* Use the noun form, not adjective form: `law/good`, `chaos/evil`, `neutral` (if single).
* Do not write `lawful good`; write `law/good`.

**9) Equipment lists**

* Comma-separated list; use `and` before the final item. No serial comma requirement unless you prefer it — be consistent.
* Magic item bonuses go *after* the item name: `longsword +1` (and italicized as `*longsword +1*`).
* Canonicalize shields and uncommon forms (see shield rule).
* Example: `Equipment: *pectoral of protection +3*, full plate mail, medium steel shield, *staff of striking* and mace.`

**10) Shields (canonical form)**

* Use only canonical shield names: `buckler`, `pavis`, or `(small|medium|large) (steel|wooden) shield +#`.
* Write bonus at the end: `medium steel shield +2`.
* In markdown italics: `*medium steel shield +2*` only if it is magical; otherwise plain text.

**11) Magic item formatting**

* Magic item names are italicized and include bonus at the end: `*longsword +1*`.
* If the item has a unique name, keep the proper noun italicized: `*The Blackbrand +2*`.

**12) Spells**

* Use a compact “spells per day” line for casters: `Spells: 0–6, 1st–6, 2nd–5, ...` using en-dash for ranges if possible. Spell names in lists are italicized individually: `*cure light wounds*, *bless*`.

**13) Mounts / creatures**

* Mounts and other creatures get a **separate block** below the rider — do not inline large mount stat blocks inside the rider parenthetical.
* Example:

  ```
  **Sir X, knight**
  (this 9ᵗʰ level fighter's vital stats are HP 56, AC 20, disposition chaos/good. ...)

  **Heavy war horse (mount)**
  (this creature's vital stats are HD 4d10, HP 35, AC 19. Barding: chain mail. It makes two hoof attacks (1–4) or one overbearing attack.)
  ```

**14) Pronouns & gender**

* Only use gendered pronouns (`he`, `she`) if the heading includes an explicit gender anchor (e.g., `(male)` or `Sir/Lady` is acceptable as an anchor).
* Otherwise prefer neutral phrasing or `this creature`/`they` when natural.

**15) HP / AC / HD conventions**

* `HP` and `AC` are uppercase.
* For classed NPCs: present `HP` as a numeric total, not dice formula. For monsters: `HD` and dice notation acceptable.
* AC may include parenthetical breakdown only in full stat lines (e.g., `AC 13/22` or `AC 18 (+1 dex, +7 plate, +2 shield)`) — keep breakdowns short.

**16) Parenthetical content allowed**

* Inside the compact parenthetical include only: level/class/race, HP, AC, disposition, primary attributes, key equipment (canonicalized), spells per day (if caster), and brief notable abilities. Nothing verbose.

# Examples — correct vs incorrect

Correct:

```
**Victor Oldham, High Priest of the Grand Temple**
(this 16ᵗʰ level human cleric's vital stats are HP 59, AC 13/22, disposition law/good. his primary attributes are strength, wisdom, charisma. Equipment: *pectoral of protection +3*, full plate mail, medium steel shield, *staff of striking* and mace. Spells: 0–6, 1st–6, 2nd–5, 3rd–5, 4th–4, 5th–4, 6th–3, 7th–3, 8th–2)

**Heavy war horse (mount)**
(this creature's vital stats are HD 4d10, HP 35, AC 19. Barding: chain mail. It makes two hoof attacks (1–4) or one overbearing attack.)
```

Incorrect:

* Heading in bold and again bold inside parenthetical.
* `He Is A Lawful Good, Human, 16th Level Cleric.` (Title case and adjective alignment)
* `+3 Pectoral Of Protection` (bonus before name; title case)
* Full parenthetical in italics.
* Mount stats inline as a paragraph inside parenthetical with flavor prose.

# Quick QA checklist (for lints / CI)

1. Heading present and bolded; name capitalized.
2. Parenthetical exists or labeled lines present; parenthetical not italicized.
3. `HP`, `AC`, `HD` uppercase and present.
4. Attributes spelled out, all lowercase.
5. Disposition is noun-form (no “lawful good”).
6. Magic items italics and bonus at end (`*item +#*`).
7. Shields use canonical naming pattern.
8. Levels shown with superscript ordinals outside italics.
9. Mounts are separate blocks.
10. No gendered pronouns unless heading has explicit gender anchor.

---

If you want, I’ll convert a sample of current NPCs to this canonical form and generate an auto-correction patch (with unit tests) to apply in `npc-parser`. Which sample batch should I start with?

You requested a single master table compiling all canonical formatting rules for *Castles & Crusades* NPC and monster stat blocks, based on the conversation history and the provided sources.

This table integrates rules for capitalization, bolding, italics, attribute naming, and structural organization, adhering strictly to the reforge standards, which mandate the use of lowercase attributes and noun-form disposition.

### Canonical Formatting Master Table (C&C Reforge Standards)

| Category | Rule/Guideline | Mandatory Format and Details | Source Citations |
| :--- | :--- | :--- | :--- |
| **I. Headings & Structure** | **Heading Bolding** | **Bold** the NPC's name and title in the main heading line [Rule 1, 60, 524, 474]. | [Rule 1, 60, 524, 474] |
| | **Name Capitalization** | A person’s actual name (proper noun) is **always capitalized** (e.g., Victor Oldham) [Rule 1, 524]. | [Rule 1, 524, 474] |
| | **Role/Title Casing** | Role or title after the comma is sentence-cased or lowercase (e.g., captain of the town guard) [Rule 1, 474]. | [Rule 1, 474] |
| | **Parenthetical Format** | Use a single, compact parenthetical block for **mechanical, labeled data** [Rule 2, 16, 58, 56, 531]. Do **not** place long flavor text, nested parentheses, or multi-paragraph prose inside [Rule 2, 531]. | [Rule 2, 16, 58, 56, 531] |
| | **Parenthetical Bolding** | Do not bold text *unless* it is the level number or a vital abbreviation (**HP**, **AC**, **HD**). The level, HP, and AC are frequently **bolded** inside the compact parenthetical. | |
| | **Gendered Pronouns** | Only use gendered pronouns (`he`, `she`) if the character's **gender is explicitly stated** (e.g., "orc war priestess," "dryad," "satyr") [Rule 14, 57, 63, 23, 15, 26, 510]. Otherwise, use neutral phrasing (e.g., `this creature`) [Rule 14, 63, 57]. | [Rule 14, 57, 63, 23, 15, 26, 510] |
| **II. Vital Statistics & Attributes** | **Levels / Ordinals** | Use **superscript ordinals** (e.g., $9^{th}$, $16^{th}$) [Rule 6, 2, 52, 60, 15, 26, 526, 474]. **Do not spell out** levels (e.g., not "first level") [Rule 6, 2, 52, 60, 26]. | [Rule 6, 2, 52, 60, 15, 26, 526, 474] |
| | **Vitals Abbreviations** | `HP`, `AC`, and `HD` (Hit Dice) must be **uppercase** [Rule 3, 15, 528, 474] and generally **bolded** inside the parenthetical. | [Rule 3, 15, 528, 474] |
| | **HP for Classed NPCs** | Always present **HP** as a **numeric total** (sum), never a dice formula (e.g., HP 56) [Rule 6, 61, 2, 14, 29, 18, 26, 474]. | [Rule 6, 61, 2, 14, 29, 18, 26, 474] |
| | **HP/HD for Monsters** | Use **Hit Dice (HD)** notation (e.g., HD 4d10) for creatures and mounts [Rule 6, 61, 2, 14, 26, 474]. | [Rule 6, 61, 2, 14, 26, 474] |
| | **Attribute Naming** | Attribute names are always **lowercase** and **spelled out in full** (e.g., `strength`, `wisdom`, `charisma`) [Rule 7, 62, 527]. Abbreviations (like Str) are generally avoided. | [Rule 7, 62, 527, 474] |
| | **Attribute Description** | If listing both types of primary attributes, denote them as "**mental and physical**". | |
| **III. Terminology & Structure** | **Disposition Term** | The term "**disposition**" **replaces "alignment"** entirely [Rule 8, 2, 61, 11, 14, 18, 26, 525]. | [Rule 8, 2, 61, 11, 14, 18, 26, 525, 474] |
| | **Disposition Format** | Must use the **noun form**, not the adjective form (e.g., **law/good** or **chaos/evil**) [Rule 8, 61, 2, 11, 14, 18, 26, 525]. Disposition uses **two parameters separated by a slash**. | [Rule 8, 61, 2, 11, 14, 18, 26, 525, 474] |
| | **Race Before Class** | For multi/dual-class NPCs, the **race is listed before the level and class** (e.g., "human $1^{st}$ level fighter/ $1^{st}$ level wizard"). | |
| | **Mounts/Creatures** | Mounts and other creatures get a **separate block** below the rider; do not inline large mount stats [Rule 13, 530, 474]. | [Rule 13, 530, 474] |
| | **Canonical Abilities** | Use standardized terms like "**crushing grasp**" (instead of "improved grab") and explicitly "**bash attacks**". Vision types must be **two words** (e.g., Dark Vision). | |
| | **Coinage** | **Never abbreviate** coinage (pp, gp, sp, cp); use the **full material names** (e.g., gold, silver, copper) [Rule 11, 63, 3, 55, 11, 14, 23]. | [Rule 11, 63, 3, 55, 11, 14, 23] |
| | **Shields** | Use canonical shield names (e.g., `buckler`, `medium steel shield`) [Rule 10, 29, 23]. | [Rule 10, 29, 23] |
| **IV. Magic & Spells** | **Magic Item Italicization** | **Italicize** all magic item names and bonuses, including outside italicized stat blocks [Rule 4, 11, 62, 53, 64, 474]. | [Rule 4, 11, 62, 53, 64, 474] |
| | **Magic Item Bonus** | Bonus must be placed **at the end** (e.g., *longsword +1*, not +1 longsword) [Rule 9, 11, 62, 53, 64]. | [Rule 9, 11, 62, 53, 64] |
| | **Item Explanation** | **No magic item should be printed without some degree of mechanical explanation**. | |
| | **Spell Name Italicization** | All spell names are **italicized** (e.g., *cure light wounds*) [Rule 4, 62, 54, 12, 24, 15, 474]. | [Rule 4, 62, 54, 12, 24, 15, 474] |
| | **Spell Slots/Spread** | List spells as a numerical spread (e.g., 0–6, $1^{st}$–6) [Rule 12, 62, 46, 529, 474]. Spell levels use standard ordinals (**not superscript**) [Rule 6, 62, 46, 526, 529]. | [Rule 12, 62, 46, 529, 474] |
| | **Listing Individual Spells** | **Avoid listing individual spells** unless they are "**really essential** to like the way the designer wanted an encounter to go". The Castle Keeper assigns spells otherwise. | |
| **V. Specialized Terminology** | **Removed Monster Stats** | Original "significant attributes" for monsters have been **removed**; monsters do not have stats in the same way characters do. | |
| | **New Monster Fields** | New monster stat blocks include **Sanity, Biome, and Climate** fields. Sanity is an **optional statistic**. | |
| | **Magic-User Term** | The term "**magic-user**" is used collectively to refer to "wizards and illusionists". | |