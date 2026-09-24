# The Long Valley — Reforge / Light Edit Diff Rules

## Governing rule

**If a word, sentence, mechanic, formatting choice, or piece of terminology does not need to change for Reforging, correctness, or a definite light-edit fix, leave it exactly as written.**

No smoothing, no modernization for taste, no restructuring for elegance, no "better" phrasing, and no added information unless current rules actually require it.

**Every proposed change needs one of three justifications: required Reforge, definite error, or necessary clarification. Otherwise: no change.**

**Surgical substitutions, not editorial recasting.** Hew as close to the author's original wording as possible. Change only the exact words required by Reforging or a definite error. Do not rephrase surrounding prose to make the update sound smoother — preserve the original sentence shapes almost verbatim.

**The core test:** does this change fix a current rules requirement, a real gameplay ambiguity, or a definite error? If no, leave the author's text alone.

**The meta-rule:** we are not asking "How would TLG write this today?" We are asking "What is the least we must change to make the author's text Reforged-correct?" That framing prevents almost every over-conversion.

Corollaries:

- Template examples are guidance, not automatic rewrite mandates. **A modern template may reveal that information is missing; it does not authorize inventing the missing information.** `HD 3` → `Level 3` (no die in source — flag it; do not write `Level 3(d8)` by guessing). If full `Level X(dY)` is wanted, ask the author or find an authoritative entry.
- Preserve encounter-specific values unless clearly wrong.
- Do not normalize prose into stat-block shorthand.
- Do not add modern abilities/fields just because current M&T has them.
- Mechanical meaning wins only where the original wording would mislead play.
- When intent is uncertain, flag rather than silently revise.

**Canonical example of a necessary mechanical correction:** the gargoyle `or` → `and` change — a real gameplay ambiguity fix, not stylistic cleanup.

**Precedence:** Jeremy's actual current guide wins whenever it disagrees with the old Notebook or NotebookLM reconstructions. NotebookLM is useful for recovering old rationale, not as an authority on current format.

## Jeremy's current abbreviated monster template

```
Level X(dX), HP X, AC X, disposition X/X. Their primary attributes are...
```

Not `HD XdY`. Not `saves are physical`. The older canonicalizer's `HD`/`saves`/auto-`XP` assumptions target a different or older convention and are wrong for this job. Also stale and non-controlling: the old Notebook's rules that generic humanoids may keep `HD` and that singular monsters use "saves are physical" — the current abbreviated Basic Monster template governs all monsters.

`Level X(dY)` is the **vital-stats notation**. In running prose, creature/character level references use **ordinal level** per Jeremy's convention: "turned as an 8th level monster," not "a Level 8 monster." In final layout (e.g., InDesign), ordinal levels take Jeremy's bold/superscript convention.

**Pronoun consistency:** a singular creature uses it/its throughout its block, even though the template literally reads "Their primary attributes are..." — e.g., a single Bag O' Bones gets "Its primary attributes are physical. It attacks...", never a mid-block switch from "Their" to "It." Conversely, in a plural unit block a generic singular ("The mephit is able to summon...") reads naturally as "each mephit" — that is not a pronoun error and does not get pluralized.

**Tense:** do not normalize tense unless context clearly demands it. `both gateways guarded the bridge` stays — past tense may be deliberate (their historical function), and a tense mismatch that doesn't mislead play is not a definite error.

**Heading typography:** preserve the source's unit-count spacing and casing conventions — `MEPHIT X 3`, not `MEPHIT x3`. The parser's `x12` roster convention does not govern the book's heading style.

The abbreviated adventure block calls for: Level, HP, AC, disposition, primary attributes, attacks, carried items, and only essential special abilities. It does **not** include Move, creature type, XP, Sanity, Biome, Climate, or other full-bestiary fields. Do not import fields from the full M&T block into adventure shorthand — making the block "more complete" is explicitly not the task.

**The template governs field vocabulary, not field completeness.** This project is a Reforge of an existing adventure, not a clean-sheet rewrite into the modern template. Do not force old inline blocks into the exact modern field set. If information is already carried in the source's structure — e.g., disposition expressed as "This neutral creature's vital stats are..." — do not duplicate it with an added `disposition neutral` field. Only convert the obsolete mechanics and fix real wording errors.

**"Primary attributes" and "saves" are distinct fields in distinct formats.** The full current M&T block has a Saves category (P or M). Jeremy's abbreviated adventure format wants "primary attributes are physical" or similar. Related concepts, not interchangeable — never convert between them.

**Creature type is a substantive rules decision, not a formatting correction.** Do not assign or infer a type (e.g., "undead") in the abbreviated block. If the source text's lore and mechanics conflict (e.g., described as a construct but turned like undead), flag it.

## Rules

- Preserve existing layout, paragraph structure, and stat-block style unless a current rule requires a change.
- Do not add italics inside abbreviated parenthetical stat blocks merely because a spell or item name appears there. Preserve the original block typography unless the block itself is being rebuilt.
- Outside stat blocks, follow current house style for spell and magic-item formatting.
- Change `HD XdY` → `Level X(dY)` when the text refers to creature level rather than the physical hit die. **A trailing `+N`/`-N` is a legacy hit-point modifier, not part of Level:** `HD 5d8+5` → `Level 5 (d8)`, never `Level 5(d8+5)`. The modifier is recovered via `extractHdHpModifier` and flagged as an unresolved HP contribution — do not drop it silently, and do not fold it into Level. Level references without a die in prose (e.g., "turned as an 8 hit dice monster") use ordinal level phrasing: "an 8th level monster."
- Change old alignment terminology to current disposition terminology.
- Use **primary attributes**, not "primary attack" or "prime attributes."
- Use **mental and physical** in that order when both apply.
- Standardize current terminology (dark vision, twilight vision, crushing grasp, etc.).
- Creatures in current Monsters & Treasure: the current M&T entry is authority for **terminology and naming** — it confirms what the source already has (e.g., verifies Level 8(d10), AC 21, supplies current spell names like `discern magic`). It does **not** authorize importing fields or mechanics the source lacks (creature type, `read languages`, frequency limits, fuller spell specs) or overwriting author-chosen values (Stephen's HP 80 stands even though current M&T lists 48 — changing it alters his encounter). M&T informs the conversion; it does not inject content.
- Creatures not in current M&T: preserve original mechanics unless Jeremy's rules require conversion.
- Check old spell names against the 11th PHB / current spell references; replace only confirmed outdated names. **Authoritative reference:** `Designer Notes/spell-names-final.csv` — the third column ("New Name") is the correct spell name; the middle column is a stale intermediate draft. Entries marked `*` are provisional. `src/lib/name-mappings.ts` is consistent with the third column on all spot-checked entries.
- No blind global replacements where an old term may still exist as a class ability or non-spell usage. **A descriptive ability that borrows a spell's name is not a spell reference.** `summon a minor flame strike once every 3 rounds for 1d6 points of damage` is a bespoke ability — fixed damage, custom cadence — not the 5th-level cleric spell *flame of the divine*. Renaming it would turn a custom ability into a modified named spell. Keep the descriptive phrase; QUERY/FLAG for author decision.
- **Monster ability names are not the same as similarly named spells.** `energy drain` is a current monster ability; `energy level drain` is a specific cleric spell. Do not conflate them — a wight's `energy drain` stays `energy drain`. (Earlier passes renamed it via the spell table — that was wrong.)
- **A descriptive object sharing a spell's name is not a spell reference.** The spell *magic jar* → *magi's vessel*, but "the magic jar" meaning a literal magical jar stays a jar.
- **Do not infer missing attack counts.** `claws` stays `claws`; do not invent `2 claws` unless another authoritative source confirms the number.
- **Mechanical ambiguity overrides preservation.** If `or` makes a full attack routine read as mutually exclusive attacks, `and` is a real play-facing correction (the gargoyle change — canonical example).
- **Custom mechanics stay custom.** Do not "repair" bespoke abilities into generic modern equivalents unless the original is actually broken — no invented saves, frequencies, creature types, or abilities.
- Magic-item bonuses move to the end: `+2 chain mail` → `chain mail +2`.
- Coin abbreviations become written denominations: `300gp` → `300 gold`, `12pp` → `12 platinum`. **Live Stephen question:** Jeremy requires spelled-out denominations, but how aggressively to apply it to legacy text is unconfirmed — flag globally until Stephen decides.
- Do not invent new magic-item names. If an old named item no longer exists, preserve the described function and rewrite only enough to make the mechanic current. A described generic item ("a magical rope that...") already satisfies the "every magic item needs a mechanical explanation" rule — do not promote it to a proper-ish name like "enchanted rope."
- **Every magic item needs a mechanical explanation — live Jeremy rule.** A `+N` bonus is self-explanatory (the number is the mechanic). A *potion* of a named spell is self-explanatory (the name is the mechanic). Anything else whose effect isn't conveyed by its name — e.g., *ring of telekinetic power* — needs a minimal gloss from current M&T or a QUERY/FLAG. **Flag rather than padding the author's prose automatically** — whether to add glosses to legacy text is an author/editor decision.
- Spell-name renames apply with confidence; **spell italics in legacy prose are a Stephen question** — do not globally retrofit italics until he confirms the style normalization.
- Do not normalize `feet` to `ft.` (or vice versa) in running prose just because formal stat blocks use one form — preserve the source's own unit style per block.
- Keep encounter difficulty, damage, CLs, and special effects intact unless they conflict with current rules or a current canonical monster entry.
- Light editing = correcting definite typos, grammar, punctuation, agreement, obvious word omissions, and awkward fragments while preserving Stephen's sentence structure and voice. Do not "improve" prose merely because a sentence could be smoother. Do not consolidate sentences or reshape the block into a more modern editorial voice.
- When a change would materially alter meaning, encounter balance, lore, or authorial intent, flag it instead of silently changing it.
- **Do not add XP values** absent from the source. (Stale baselines seen in tooling: `120+5`, `180+5 per HP`. Current M&T: Level 5 base XP 80, +5 per HP, before ability adjustments.)
- Do not modernize damage-type vocabulary without a rule requiring it — `edged` stays `edged`; do not auto-convert to `slashing` when the source deliberately says "edged and piercing."
- Internal discrepancies inside the source (e.g., encounter shorthand vs. appendix stat block) go to QUERY/FLAG — never resolve them by silently rebalancing the encounter.
- Separate every page review into **REFORGE**, **LIGHT EDIT**, and **QUERY/FLAG** so the reason for each change is visible.

**Software tiers:** `applyLightEdits` (in `enhanced-parser.ts`, runs via `sanitizeCanonicalText` on converted output) automates the definite-error tier: doubled closed-class words, `can not`→`cannot`, `wit wax`→`with wax`, `a few hundreds`→`a few hundred`, `X based damage`→`X-based`, `high level <class>`→`high-level`, `N claw`→`N claws` (N>1), missing articles (`has pouch`→`has a pouch`, with a/an), `take and additional`→`an additional`, and attack-routine `, or a <attack> for <dice>`→`, and` (the gargoyle fix — restricted to "attack" sentences where the or-clause carries damage, so `or by weapon` is untouched). `buildMonsterValidation` (in `monster-formatter.ts`) emits the QUERY/FLAG tier: stripped HD modifiers (`5d8+5`→`5(d8)` + flag for the +N), bare HD with no die, `or`-joined attack routines, singular blocks mixing it/they pronouns, and possible comma splices (flagged, never auto-fixed — subordinate clauses share the surface pattern).

## Worked example — Bag O' Bones (gold-standard diff)

Source:

> Bag O' Bones (This neutral creature's vital stats are HD 5d8, AC 15, HP 40. Its primary attack is physical. It attacks with one claw for 1d6 points of damage, or by weapon. Due to its nature, the bag o' bones has a natural turn resistance, and it is turned as an 8 hit dice monster. They only take half damage from edged weapons and piercing weapons.)
>
> Treasure: Beneath the heap of bones lies the creature's treasure; the the wizard's gear of old. Within are the remains of an old backpack, whose only remaining contents is a magical rope that is twice as strong as a normal rope and unties itself when the user desires. There is also a potion of cure serious wounds, a glyph of protection from evil carved on a small clay tablet that once broken gives the user a protection from evil for 5 rounds. There is a scroll case with five 3rd level spells in it. The CK should pick the spells.

Final:

> BAG O' BONES (This neutral creature's vital stats are Level 5(d8), HP 40, AC 15. Its primary attributes are physical. It attacks with one claw for 1d6 points of damage, or by weapon. It takes half damage from edged and piercing weapons. It has natural turn resistance, turning as an 8th level monster.)
>
> TREASURE: Beneath the heap of bones lies the creature's treasure; the wizard's gear of old. Within are the remains of an old backpack, whose only remaining contents are a magical rope that is twice as strong as a normal rope and unties itself when the user desires. There is also a potion of heal serious wounds, a glyph carved on a small clay tablet that, once broken, grants protection from disposition against evil for 5 rounds. There is a scroll case with five 3rd level spells in it. The CK should pick the spells.

REFORGE: `HD 5d8` → `Level 5(d8)`; `8 hit dice monster` → `8th level monster` (ordinal level in prose); disposition stays in the descriptor ("This neutral creature's") — no `disposition` field added, since duplicating it would violate minimum-diff; `primary attack` → `primary attributes`; `potion of cure serious wounds` → `potion of heal serious wounds` (confirmed rename; the standardized potion name points to a defined spell, so no extra gloss needed); `glyph of protection from evil` → `glyph ... grants protection from disposition against evil` — the disposition version requires a chosen target, so the original "evil" must be preserved, and the tablet is described as a custom object rather than promoted to a canonical item name.

LIGHT EDIT: `the the` → `the`; `contents is` → `contents are`; `They only take` → `It only takes`; `that once broken gives` → `that, once broken,`.

QUERY/FLAG: no XP in source — not added; Bag O' Bones not in current M&T — mechanics preserved; "protection from disposition against evil" phrasing assumes the 11th PHB rename is confirmed; the appendix characterizes Bag O' Bones as a necromantic/golem construct while its turning mechanic resembles undead — do not assign a current creature type in the abbreviated block until the full appendix block is Reforged; the appendix's full stat block reportedly reads `5d8+5` while the encounter shorthand reads `5d8` — internal source discrepancy, flag only.

## Worked example — Gynosphinx (surgical-substitution standard)

Final:

> SPHINX, GYNO (This neutral creature's vital stats are Level 8(d10), AC 21, HP 80. Her primary attributes are mental. She attacks with 2 claws for 2d4 points of damage. She is able to move 40 feet and fly 60 feet per round. She has dark vision and twilight vision. She is able to use the following spell-like abilities: discern magic, read arcane script, see invisible, locate item, dispel magic, clairaudience/clairvoyance, remove bane and legendary tales. Once a week she can cast symbol.)

What this example fixes in the rules:

- **Field order is preserved from the source.** The vitals keep the source's `AC 21, HP 80` order — do not normalize to `HP, AC` unless a rule requires it. Minimum diff applies to ordering too.
- **Gendered pronouns are kept consistent.** A gynosphinx is female, so the block runs "Her primary attributes… She attacks…" throughout — singular pronouns consistent, matching the it/its rule for ungendered creatures.
- **Movement stays as prose.** "She is able to move 40 feet and fly 60 feet per round." is preserved in the source's own phrasing — not converted to a `Move` field, and not dropped merely because the abbreviated template doesn't list Move. The no-Move rule means *don't add* it; if the source carries movement, keep it verbatim.
- **Terminology and spell names update inline only.** `dark vision`, `twilight vision`, and the spell-like ability names are canonicalized in place (discern magic, read arcane script, see invisible, locate item, dispel magic, clairaudience/clairvoyance, remove bane, legendary tales, symbol) — the surrounding sentence frames ("She is able to use the following spell-like abilities: …", "Once a week she can cast symbol.") are untouched.

NotebookLM-derived additions evaluated against the current M&T gynosphinx and **rejected** (the reference list for what M&T authority does *not* authorize):

- `magical beast` — current M&T classification, but the source inline block has no creature type. Don't add it.
- `move 40 ft., 60 ft. (fly)` — same information already present in the source's sentence. Don't restructure.
- `disposition neutral` — duplicates "This neutral creature." Don't add it.
- `read languages` ability — current M&T has it, the source encounter block does not. Adding it is adding mechanics.
- `Once per day each` — current M&T's frequency for the spell-likes; the source doesn't limit them. New information.
- `symbol (any, each)` — fuller current M&T specification; the source says `symbol`. Leave it alone unless the old version is mechanically incomplete.
- `HP 48` — current M&T's standard gynosphinx; Stephen chose 80. Changing HP alters his encounter. Leave 80.
- `Saves: M` — full-M&T field, not appropriate for the abbreviated block.
- Added italics/reformatting — preserve the book's existing block typography.

The net effect: a Notebook draft shows what a newly written gynosphinx block looks like; a Reforge of the existing block is a different job. This pass changes only obsolete terminology and the pronoun error.

## Worked example — Demon (accepted as-is)

Source:

> Demon (This chaotic evil creature's vital stats are HD 4d10, AC 18, HP 31. Its primary attributes are mental. It prefers to attack with a fire-whip that it is able to summon. The whip does 1d4 points of damage on a successful strike. Anyone who is hit by the whip must make a successful intelligence save or be struck by a psychic blast that reveals a look at the Wretched Plains. A failed saved means the view is so horrific that they are stunned for 1d4 rounds.  It can attack with two claws for 1d4 and one bite for 1d6 damage points of damage. It is immune to fear or fear type spells, can fly 60 feet per round and cast color spray once per day. It is able to assume the form of a shadow once per day.)
>
> Treasure: The wizard was wearing a magic +2 ring of protection and a ring of telekinesis.

Final:

> DEMON (This chaos/evil creature's vital stats are Level 4(d10), AC 18, HP 31. Its primary attributes are mental. It prefers to attack with a fire-whip that it is able to summon. The whip does 1d4 points of damage on a successful strike. Anyone who is hit by the whip must make a successful intelligence save or be struck by a psychic blast that reveals a look at the Wretched Plains. A failed save means the view is so horrific that they are stunned for 1d4 rounds. It can attack with two claws for 1d4 and one bite for 1d6 points of damage. It is immune to fear or fear-type spells, can fly 60 feet per round and cast colors once per day. It is able to assume the form of a shadow once per day.)
>
> TREASURE: The wizard was wearing a magic *ring of armor +2* and a *ring of telekinetic power*.

REFORGE: `HD 4d10` → `Level 4(d10)` (source field order `AC, HP` kept); `chaotic evil` → `chaos/evil` in the descriptor — disposition stays in "This … creature's," no `disposition` field added; `color spray` → `colors` (confirmed rename); `+2 ring of protection` → *ring of armor +2* (confirmed rename + bonus to end); `ring of telekinesis` → *ring of telekinetic power* (confirmed rename); `primary attributes are mental` already correct.

LIGHT EDIT: `failed saved` → `failed save`; `damage points of damage` → `points of damage`; `fear type` → `fear-type`; double space collapsed.

QUERY/FLAG: *ring of telekinetic power* needs a mechanical gloss or author decision — current M&T: the wearer can cast telekinesis on command (the `+2` on the ring of armor is self-explanatory; the telekinesis ring's name alone is not); "a magic" kept — redundant but not an error; "reveals a look at the Wretched Plains" kept — awkward but grammatical, per minimum-diff; custom mechanics (fire-whip, psychic blast, shadow form) preserved verbatim — generic "Demon" has no M&T entry to check against.

## Worked example — Mephits (rejected conversions)

Source:

> here are two barbicans on the bridge, and both gateways guarded the bridge. The western barbican is in ruins, the eastern one is still largely intact, and it is presently occupied by several mephits. These small gang of fire spirits have wandered down from the ruins on the plateau, flown over the bridge and have set about making their lair in this abandoned room.
>
> Mephit x 3 (These lawful evil creatures' vital stats are HD 2d8, AC 15 and HP 14. Their primary attributes are mental. They attack with a bite for 1d6 and a stinger for 1 point of damage. The mephit is able to summon a minor flame strike once every 3 rounds for 1d6 points of damage. All fire damage deals half damage but cold based damage inflicts double damage. They are highly aggressive.)
>
> Treasure: The mephits have amassed a small treasure. One of them wears a horn of fog, another has necklace and ring set worth 300gp and the third has pouch stuffed with 42gp and 12pp.

Final:

> There are two barbicans on the bridge, and both gateways guarded the bridge. The western barbican is in ruins, the eastern one is still largely intact, and it is presently occupied by several mephits. This small gang of fire spirits has wandered down from the ruins on the plateau, flown over the bridge and has set about making their lair in this abandoned room.
>
> MEPHIT X 3 (These law/evil creatures' vital stats are Level 2(d8), AC 15 and HP 14. Their primary attributes are mental. They attack with a bite for 1d6 and a stinger for 1 point of damage. The mephit is able to summon a minor flame strike once every 3 rounds for 1d6 points of damage. All fire damage deals half damage but cold-based damage inflicts double damage. They are highly aggressive.)
>
> TREASURE: The mephits have amassed a small treasure. One of them wears a *horn of mist*, another has a necklace and ring set worth 300 gold and the third has a pouch stuffed with 42 gold and 12 platinum.

REFORGE: `HD 2d8` → `Level 2(d8)`; `lawful evil` → `law/evil` (descriptor position); `horn of fog` → *horn of mist* (confirmed M&T item); `300gp` → `300 gold`, `42gp` → `42 gold`, `12pp` → `12 platinum`.

LIGHT EDIT: `here` → `There`; `These small gang` → `This small gang` (+ `has wandered`, `has set about` — singular collective agreement); `cold based` → `cold-based`; `has necklace`/`has pouch` → articles added.

QUERY/FLAG: `minor flame strike` — bespoke ability (fixed 1d6, 3-round cadence), NOT the named spell; do not rename to `flame of the divine`. Flag for author — the software can be mechanically clever but editorially too confident here. `horn of mist` — mechanical gloss question (M&T: creates a cloud of mist when blown).

**Rejected** (over-conversions): `The mephit is able` → plural — generic singular = "each mephit," not an error; `guarded` → `guard` — tense not clearly wrong; `MEPHIT X 3` → `x3` — preserve source spacing; `AC 15 and HP 14` — source list phrasing kept; "All fire damage deals half damage" — awkward but inferable, kept.

## Worked example — Water Foul (missing data ≠ license to invent)

Source vitals: `HD 3, AC 14, HP 21` — no die type.

Final:

> WATER FOUL, UNDINE (This neutral/evil creature's vital stats are Level 3, AC 14, HP 21. Its primary attributes are physical. It attacks with a slam for 1d6 points of damage. It is able to hide in the water, gaining a +4 to its surprise rolls. It can change shape at will. It has crushing grasp, forcing anyone struck to make a successful strength save or be consumed by the water foul. Anyone so grabbed can be pulled into the water and drowned, requiring a successful strength save to break free. It can animate water within 10 feet, tripping anyone near. The victim gets a dexterity save.)

REFORGE: `HD 3` → `Level 3` — **not** `Level 3(d8)`; the source has no die type and inventing one is fabrication, not conversion. `neutral evil` → `neutral/evil` in descriptor — the modern template's `disposition X/X` field does not mandate restructuring the legacy block; descriptor position is acceptable. `crushing grasp` kept (current terminology); `10 feet` spelled out (prose unit style preserved); singular pronouns consistent throughout.

QUERY/FLAG: `Level 3` carries an unresolved source deficiency — no die type in source. If full `Level X(dY)` is wanted, ask the author or locate an authoritative creature entry; do not guess.

## Worked example — Ghost (pronoun gendering + comma splice vs. smoothing)

Final:

> If good creatures pass through the valley the boy is inclined to follow them. Incorporeal for the most part, the ghost is invisible, but those with sharp eyes may see it (CL 6) or others may catch a glimpse out of the corner of their eye (CL 9). If the CK wishes the party to encounter the ghost, no check is required. The ghost will, at times, sit at the fire, living its last day of life over again, talking and eating. It will converse with good characters if it is seen either at the fire or following. It does not have any idea of what is going on; it believes it's living in its last moment. It will relate the tale of the Haunted Valley as noted above.
>
> GHOST (This law/good creature's vital stats are Level 10(d8), AC 20, HP 80. His primary attributes are mental. He attacks with a slam for 1d10 points of damage. Any successful hit ages the victim: humans and half-orcs 1d4 decades, halflings 1d6 decades, and dwarves and gnomes 3d6 decades. Elves are immune. He is also able to utter a frightful moan, and unless a wisdom save is made, anyone who hears it is subject to a fear spell. He is incorporeal and can use telekinesis. The ghost cannot be turned by any cleric.)

REFORGE: `HD 10d8` → `Level 10(d8)`; `lawful good` → `law/good` descriptor. `fear` and `telekinesis` are unchanged current names — no rename. Gendered pronouns (`His`/`He`) correct for the named ghost; `cannot be turned by any cleric` kept — strong custom trait, not weakened.

LIGHT EDIT: `If they CK` → `If the CK`; `believes its living` → `believes it's living`; `It is also able` → `He is also able` (mid-block gendered pronoun consistency); `half orcs` → `half-orcs`; `Halfling` → `halflings` (case+number in a parallel list); `going on, it believes` → `going on; it believes` — comma splice = definite error, repaired.

**Rejected**: `Elves` → `elves` — capitalization consistency alone is editorial smoothing, not a correction; source capitalization kept.

## Worked example — Bag O' Bones appendix (full M&T rebuild)

Appendix: New Monsters entries are a **different case** from abbreviated encounter blocks — they get rebuilt into the current full M&T format. This is the one place the Reforge is legitimately a full mechanical reconstruction, not a surgical inline conversion. The workflow: rebuild the stat block into current trade dress, preserve descriptive prose with only necessary corrections, flag missing fields rather than guessing, and resolve internal discrepancies authorially.

**Full-M&T layout conventions:**

- Header: `NAME, type` (type justified only if the source's own text supplies it — `construct` here comes from "the construct" in Stephen's prose).
- `SIEGE ECOLOGY` section header.
- Field pairs per current trade dress, in this order: `Level: X (dX)  HP: —  Number: —` / `AC: —  SR: —  Size: —` / `Saves: —  Intelligence: —` / `Move: —  Disposition: —` / `Sanity: —  Climate: —` / `Attacks: —` / `Biome: —` / `XP: —  Treasure: —`.
- Note the **spaced** `Level: 5 (d8)` in full format vs. the unspaced abbreviated `Level 5(d8)`.
- Missing fields render `[TBD]` — the template reveals gaps; it does not authorize inventing values.
- `Abilities:` line lists **names only** (`Turn Resistance, Resistant to Edged and Piercing Weapons, Telepathic Control`). Mechanical explanations go below in prose (`Turn Resistance: The bag o' bones is treated as an 8th level monster for turning purposes.`), reusing Stephen's own descriptive text where it already explains the mechanic — do not cram explanations into the header.

**Field mappings applied:** `HIT DICE: 5d8+5` → `Level: 5 (d8)` (+5 flagged as unresolved HP contribution, NOT folded into Level); `No. OF ATTACKS: 1-6` / `1-4+1 per claw or by weapon` → `Attacks: 1–6 Claws (1d4+1) or By Weapon`; `ALIGNMENT: Neutral` → `Disposition: Neutral`; `MAGIC RESISTANCE: Standard` → `SR: 1` — the 11th PHB establishes all creatures have an inherent SR of 1 unless otherwise specified, so "Standard" maps soundly to SR 1 rather than `[TBD]` (still flag for Jeremy confirmation); `Turns as 8 HD monster` → turn-resistance ability; `Intelligence: 4/See below` kept verbatim (explanation lives in prose); `MOVE: 30 feet` → `30 ft.` in stat line.

**Abilities taxonomy caution:** derive `Abilities:` names only from Stephen's existing mechanics — check comparable current M&T constructs and weapon-resistance/turn-resistance monsters for naming before committing. The goal is fitting Stephen's mechanics into the current presentation, not renaming them unnecessarily. Stephen's prose already contains the mechanics.

**The appendix rule:** *M&T determines the container; Stephen determines the creature.*

**QUERY/FLAG:** HP unresolved — appendix gives only `5d8+5`, encounter block says HP 40 but with AC 15 vs. appendix AC 19 (conflicting versions — resolve authorially). Saves, Sanity, Climate, Biome, XP, Treasure all `[TBD]` pending design ruling. Prose preserved almost intact (`only take` → `only takes`, `high level` → `high-level`, en dashes).
