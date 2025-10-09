# Canonicalizer Conversion Rules for Castles & Crusades (C\&C) Material



The standardization and conversion process for Castles & Crusades (C\&C) material, governed by editorial fiat (often referred to as the Canonicalizer Conversion Rules or Jeremy's Fiat), relies on a comprehensive set of mandatory rules, situational guidelines, and deliberate exceptions. These are designed to achieve consistency, clarity, and compatibility with the C\&C Reforged system, prioritizing narrative flow, Castle Keeper (CK) usability, and legal/IP cleanliness over literal transcription of source material.

The process addresses the "Frankenstein's monster" nature of original files, which amalgamated elements from AD\&D, d20/OGL, Lejendary Adventures (LA), Hackmaster, and more. Key priorities include stripping proprietary LA content, standardizing nomenclature to Monsters & Treasure (M\&T) and Player's Handbook (PHB) canons, and enforcing the SIEGE Engine's rules-light philosophy.

Below is a reorganized, consolidated outline drawing from all provided sources. Redundancies have been eliminated, sections merged for logical flow, and deeper philosophical/mechanical/administrative insights integrated at the end.

## I. General Content and Structural Conversion Rules

### A. Core Formatting Mandates

- **Source Removal**: Completely strip all LA material (e.g., stats, classes like Canting Crew, Essential Places, Pantheons) and d20-specific mechanics/terminology (e.g., Arcane Spell Failure, Armor Check Penalty). Rephrase or remove references to ensure C\&C compatibility.  
- **Heading Style**: Bold NPC/monster titles (e.g., **Gerald Overton, captain of the town guard**). For high-ranking figures, use full title, name, and office separated by commas; prohibit colons.  
- **Linguistic Flow**: Parenthetical stat blocks must start with capitalized "This" (singular) or "These" (plural) for grammatical readability, overriding source text verbatim.  
- **Punctuation and Grammar**: Fix all errors, including consecutive commas; enforce Oxford comma in lists of three+ items.  
- **Prohibited Formatting**: Never expose markup (e.g., LaTeX, HTML/XML, Markdown) or use Unicode superscripts (e.g., no $2^{\\text{nd}}$ or 2ⁿᵈ). Output must be clean, ready-to-paste text.

### B. Level and Vitality Notation

- **Level Notation (Prose/Headings)**: Use superscript ordinals (e.g., 1ˢᵗ level, 6ᵗʰ level).  
- **Level Notation (Stat Blocks)**: Use plain numerals in Hit Dice (e.g., Level 1(d8) or Level X(dX)); no superscripts.  
- **HP for Named NPCs**: Present as flat sum (e.g., HP 59\) for classed, advancing NPCs.  
- **HP for Generic Units/Monsters**: Retain HD format (e.g., HD 4d10, Level 1(d8)) for monsters, mounts, or troops.  
- **Required Fields**: Always include HP and AC in stat blocks.

### C. Attributes and Disposition

- **Attribute Casing**: Lowercase (e.g., strength, dexterity).  
- **Attribute Order**: Follow strict PHB sequence.  
- **Group Attribute Shorthand**: Expand "PA" to "their primary attributes are physical" for generic troops.  
- **Disposition Conversion**: Use noun form (e.g., "neutral" → "neutrality"; "Chaotic Good" → "chaos/good"). First listed is primary.

### D. Equipment and Magic Item Language

- **Standardized Verbs**: "Wears" for armor/barding; "Carries" for weapons, shields, gear, treasure.  
- **Shield Detail**: Specify type (small/medium/large; wooden/steel) when possible.  
- **Magic Item Formatting**: Italicize names; place bonuses at end (e.g., *longsword \+1*).  
- **Clarity Mandate**: Add short mechanical explanation for unusual/unique items (e.g., non-M\&T standards) to aid CK understanding.

## II. Nomenclature and Terminology Conversions

### A. Monster Name Conversions

- **Standardization**: Use latest M\&T canonical forms.  
- **Specific Changes**:  
  - Arrowhawk → Lightning Hawk  
  - Behir → Lightning Wyrm  
  - Belker → Shadow Demon  
  - Flumph → Flumm  
  - Xorn → Zorn  
- **Group Conversions**: Mephits → single "Implings" group.  
- **Source/Origin Retention**: Keep pre-1974 names (e.g., ion stone from Jack Vance).  
- **Removals**: Delete non-SRD/mythology creatures (e.g., Acephali, Bagiennik from Codex).

### B. Spell and Magic Terminology Conversions

- **Italicization**: Always italicize spell names.  
- **Name Enforcement**: Use current "New Name" version; resolve multi-version conflicts (original, "old new," final).  
- **Specific Changes**:  
  - Detect Alignment → *Detect Disposition* (and variants like Protection from Alignment).  
  - Animal Friendship → *Animal Bond*.  
  - Anti-Magic Shell → *Anti Magic Sphere*.  
  - Cure Light Wounds → *Heal Light Wounds* (or *Cure Minor Wounds*).  
- **Spell Mergers**: Combine variants (e.g., minor/major image \+ third → scalable *Illusion*).  
- **Reversible Spells**: Mark with asterisk (\*) next to name.

## III. Conversion Rules for Mounts and Unit Tactics

### A. Standard Mount Conversion (Units)

- **Concise Reference Formula** (for Orders of Battle): Avoid full M\&T duplication; use: "\[He/They\] ride \[light/heavy\] war horse(s) in battle (see Monsters & Treasure). \[It/They\] wear \[barding type\], and thus AC \[value\]."  
- **Canonical AC**: Heavy Warhorse (base AC 14\) \+ Full Chain Mail Barding \= AC 19\.  
- **Mount Separation**: Render in separate block after rider; no inlining.  
- **Mount Block Phrasing**: Neutral: "(This creature's vital stats are HD..., HP..., AC..., disposition neutral.)"  
- **Repetition for Clarity**: Extract full block even if duplicating stats; treat mounts as "little citizens."

### B. Tactical Qualifiers

- **Retention**: Preserve conditional phrases (e.g., "when in formation," "on horseback").  
- **Placement**: In separate sentence after equipment list.

## IV. Conversion Rules for Mechanics and Systems

### A. Spell-Like Abilities (SLAs) and Scalable Spells

- **Emulation Level**: For combined/scalable spells (e.g., *Illusion* as SLA), state explicit level emulated.  
- **CL Determination** (for items casting spells/effects): CK choice of (1) user level, (2) creator level, or (3) assumed 12\.

### B. SIEGE Engine Rules (Core and Alternatives)

- **Core Challenge Base (CB)**: 12 (primary attributes), 18 (secondary). Final Challenge Class (CC) \= CB \+ Challenge Level (CL, e.g., opponent level/complexity).  
  - Rationale: 12 \= 50% success for 1st-level character (d20 roll \+1 level); 18 ≈20% baseline for non-specialty.  
- **Alternatives** (optional):  
  - 18/+6: CB 18; \+6 for primary.  
  - 20/+8/+2: CB 20; \+8 primary, \+2 secondary.  
  - 15/+3/-3: CB 15; \+3 primary, \-3 secondary.  
  - Tertiary (CL 24): CB 24 for non-class abilities (no level added; 0% success without mitigation).  
- **Opposing Attributes**: \+6 CL if opponent's attribute is prime; \+0 otherwise.  
- **When to Roll**: Only for dramatic/conflict actions; ignore for non-consequential (e.g., tavern stairs unless oiled).  
- **Level Addition Exceptions** (CK discretion): Disallow if action is another class's specialty (e.g., wizard tracking) or unused long-term (e.g., rusty rogue pickpocketing). Reward descriptive play by reducing CL.  
- **Skill/Feat Conversion**:  
  - Checks: Attribute roll \+2 per skill level (no class level).  
  - Saving Throws: Target \-2 per aggressor skill level (+ attribute/level mods).

### C. Critical Success and Failure (Optional)

- Natural 20: Always hit; optional "Massive Success" (+5 effective or impossible feats).  
- Natural 1: Always miss; optional Critical Fumble (e.g., weapon break, self-damage, attribute loss/turn skip).

## V. Barding, Armor, and Equipment Rules

- **Barding AC**: Fixed bonus (ΔAC) to mount base (e.g., Full Chain Mail \+5 → Heavy Warhorse AC 19).  
- **Armor HP** (optional): 10 × AC value; track separately.  
- **Wastage Checks**: Against CC (no mods unless magical) for extreme events (e.g., fire, crushing).

## VI. Explicit Exceptions, Nuances, and Intentional Inconsistencies

- **Currency Nuance**: Spell out fully (e.g., "ten gold in coin"); in compact contexts, use numerals \+ spelled name (e.g., "125 gold in coin"). Avoid "gp"/"pieces"; internal debates persist on phrasing.  
- **Sacrificing Brevity**: Repeat mount blocks for clarity; gate global footnotes (e.g., "All knights ride heavy war horses") to exact matches only.  
- **Italicization Exception**: Reserve for magic items/spells; override for full stat blocks in Orders of Battle (Appendix I/J).  
- **Spell Behavior**:  
  - Holy Water: Effective only in caster's/similar hands unless cast in deity's sanctum (permanent for all).  
  - Artifacts/Specials: Bypass saves/immunities (e.g., Demilich Death Attack, Rod of Deactivation).  
  - Magical Fire Underwater: Ineffective unless specified (e.g., divine → steam).  
- **Entity Inconsistencies**:  
  - Monsters vs. Characters: Monsters use abstract saves (P: Str/Con/Dex; M: Int/Wis/Cha; no detailed attributes; fixed CB 12/18). Delete "significant attributes."  
  - Dwarf Dilemma: M\&T dwarves (3 primes, Level 1 fixed) vs. characters (2 primes, advancing)—retained for design distinction.  
- **Abbreviated Abilities**: Omit details (e.g., ghoul paralysis); refer to M\&T.  
- **LA Compromise**: Convert prestige classes/Orders to generic "ideas" or C\&C backgrounds/secondary skills; avoid total deletion.

## VII. Deeper Rationale: Philosophy, Mechanics, and Operational Challenges

### A. Philosophical Core: Narrative Over Mechanics

- **Rules-Light Identity**: SIEGE Engine simplifies adjudication (d20 vs. CB) for fluid role-playing; rules are "servants," not masters. CK fiat paramount—amend/ignore for story flow (e.g., fudge dice for pacing).  
- **Tyranny Caution**: Optional rules add clarity but risk overcomplication; prioritize fun/adventure.  
- **Dramatic Adjudication**: Checks only for high-stakes; reward descriptive play with CL reductions.

### B. Mechanical Rationale and Systemic Logic

- **12/18 CB Origin**: From simplified engine (vs. original 6-tier 10-20); enables quick play, balances monster/item levels.  
- **Monster Abstraction**: Static, non-advancing; no attributes to avoid simulation bloat.  
- **Scalable Magic Burden**: Mergers (e.g., *Illusion*) require editor-calculated SLA levels—frustrating but essential for consistency.

### C. Editorial and Administrative Necessities

- **IP/Chaos Response**: Purge LA/d20 for legal cleanliness; resolve name triplication from poor due diligence.  
- **Clarity Mandates**: Explanations for ambiguous items; separate mounts/tactics for CK modularity.  
- **Blockers**: Missing Castle Zagyg core (e.g., Ounce area; awaits Gygax Binder clearance); Kos IP transplant to Yggsburgh/Aihrde; stalled contracts/payments (e.g., Silvey, Damiani).

Guide to Spell Conversion for the Reforged Edition

Introduction: Purpose and Guiding Principles

This guide establishes the official framework for converting spells from legacy editions into a standardized and refined system for the Reforged Edition. Its purpose is to ensure that all magical effects are cohesive, balanced, and deeply integrated with the established lore. This process is not a simple mechanical translation but a thoughtful recalibration of every spell to align with the core "Gygaxian model" and the mechanics of the SIEGE Engine.

Adherence to these principles is paramount. The ultimate goal is to produce a consistent and high-quality spellbook where every entry is, as the internal mandate states, "ready-to-paste, editorially final text." This document provides the official methodology for achieving that consistency and quality, ensuring that magic feels like a natural and foundational element of the world.

---

1.0 The Philosophical Framework: Grounding Spells in the World

Before any mechanical conversion can begin, a spell's core concept must be evaluated against the established lore and tone of the world. This foundational analysis ensures that magic feels like an integrated and consistent force, rather than an arbitrary collection of disconnected effects.

1.1 Analyze the Role of Magic in Society

Magic is a practical and integrated part of daily life, impacting commerce, security, and public utilities. It is a tangible force within the economy and infrastructure, particularly in more developed communities like Yggsburgh.

Practical applications are widespread. You must evaluate all converted spells, particularly those at lower levels, for their non-combat utility to reflect a world where magic is woven into the fabric of society. Ground this evaluation in concrete examples such as:

- Business & Utilities: Self-cleaning cooking utensils, self-adding account books, cold storage chests, insect and vermin repellent devices, and elevators/descenders.  
- Security & Safety: Widespread use of magical alarms for intrusion and fire detection, as well as enchantments for entrance closing and locking.

A spell that creates a simple hovering object, for example, could be used by a merchant for displaying goods as much as by an adventurer for tactical advantage. This approach ensures magic reinforces the lived-in, breathing nature of the setting.

1.2 Differentiate Between Magical Traditions

To maintain the unique identity of each spellcasting class and the integrity of the world's lore, every spell must be categorized within one of the core magical traditions. These traditions are distinct in their source, methodology, and expression.

- Divine Magic This form of magic is granted by deities or potent natural forces and is practiced by Clerics and Druids. Its power is channeled through faith and service, reflecting the central role that religion and established ecclesiastical hierarchies play in society. Clerical magic is a direct expression of a deity's will, while a Druid's power is a manifestation of the symbiotic bond they share with the natural world.  
- Arcane Magic This is the art of manipulating ambient magical energies through the mastery of complex, arcane formulas. Arcane practice is further divided into distinct disciplines:  
  - Wizardry & Geourgy: Geourgy is the direct manipulation of the four elemental forces—earth, air, fire, and water. This powerful and often destructive magic is characteristic of high-level spells and is the domain of Wizards who master the fundamental building blocks of the material world.  
  - Illusion & Thaumaturgy: Thaumaturgy encompasses the subtler, non-elemental forms of magic that manipulate reality, minds, or perceptions. This is the primary domain of the Illusionist. As stated in the Castle Keepers Guide, "The illusionist is no trickster and one cannot simply choose to 'disbelieve' the illusionist's magic." It is a real and tangible manipulation of substance and time; its effects are not psychic projections but alterations of the world itself. Converted illusion spells must reflect this principle, having real, measurable consequences.  
- Forbidden Magic Practices such as Witchcraft derive their power from compacts made with infernal spirits. Practitioners of this malign art are evil in nature and must remain hidden from normal society, as their power works against its foundations.

By properly categorizing each converted spell, you ensure its mechanics and flavor align with the caster who wields it, reinforcing class identity and the world's metaphysical laws before moving on to the core game mechanics.

---

2.0 The Core Conversion Framework: Adherence to the SIEGE Engine

All spell mechanics must be standardized to conform to the Castles & Crusades SIEGE Engine. This section provides the baseline rules for translating a spell's statistical properties, creating a consistent foundation for all magical effects.

2.1 Standardizing Saving Throws

The process for assigning and calculating a saving throw against a spell's effect is as follows:

1. Attribute Association: First, you must identify the core nature of the spell's effect and associate it with one of the six primary attributes: strength, dexterity, constitution, intelligence, wisdom, or charisma. A spell that paralyzes the body would target strength or constitution, while one that clouds the mind would target intelligence or wisdom.  
2. Challenge Level (CL): The Challenge Level (CL) of a saving throw determines its difficulty. Unless the original spell's description provides a compelling mechanical or thematic reason for a fixed difficulty, the CL for a spell saving throw is equal to the spellcaster's level.  
3. Final Calculation: The final saving throw mechanic must be written clearly and consistently. The correct instruction is: "The target must make an attribute saving throw against a Challenge Level equal to the caster's level. The check is made by rolling a d20 and adding the target's attribute modifier and level (if the target is a classed character or unique creature with defined levels)."

2.2 Calibrating Core Spell Parameters

The following table defines the standard units and required formats for all fundamental spell parameters. You must use this as the definitive guide for converting all spell statistics.

Parameter	Standard Mandate & Instructions Range	Define range in feet. Use standard categories: Personal, Touch, Short (25 ft.), Medium (50 ft.), Long (450 ft.). Duration	Specify duration in rounds, minutes, hours, or days. Use Instant for instantaneous effects and Permanent for effects that last until dispelled. Area of Effect	Define AoE using standard geometric shapes and measurements in feet (e.g., 20 ft. radius sphere, 50 ft. x 50 ft. square, 25 ft. cone). Target(s)	Clearly state the number and type of valid targets (e.g., One living creature, Up to 3 trees, All creatures within 10 feet). Components	List all required components, referencing the categories: Speech, Hand Gestures, Material. If a material component has a cost, state it in gold pieces (gp).

These mechanical standards form the non-negotiable foundation of spell design, upon which the nuances of class identity and specific magical effects are built.

---

3.0 Analysis of Spell Effect and Class Identity

You must ensure that a spell's converted effect reinforces the unique archetype of the class that casts it. A spell is more than a set of numbers; it is an expression of the caster's power source and worldview. This section provides specific guidance for aligning spell effects with each major spellcasting tradition.

3.1 Arcane Spells: Wizard and Illusionist

* Wizard: The Wizard is a master of arcane formulas and elemental power (Geourgy). Their spells must be converted to reflect this mastery through direct, tangible effects. Mandate spells that deal elemental damage, cause physical transformation, summon creatures, or alter the battlefield in a physical way. Spells such as Meteor Shower and Wall of Stone exemplify this philosophy, representing a direct and powerful application of arcane science.  
* Illusionist: The Illusionist manipulates the fabric of reality itself (Thaumaturgy). Their magic is a real manipulation of substance and time, not a psychic trick. You must convert their spells to focus on effects that alter perception, create tangible-though-illusory constructs, and bend the laws of reality. The Illusionist's ability to heal by "changing the nature of time and substance," or to cause real physical harm with a spell like Phantasmal Killer, underscores this principle. Their effects cause real damage and have lasting consequences that cannot be willed away.

3.2 Divine Spells: Cleric and Druid

* Cleric: The Cleric serves as a divine channel for their chosen deity. Their spells are an extension of their faith and their god's portfolio. Convert their spells to focus on healing wounds, offering protection from hostile forces, enacting divine judgment against enemies like the undead, and providing spiritual and tactical support to allies. Core abilities like Turn Undead and spells such as Protection from Disposition and Heal Light Wounds are the archetypal expressions of their divine connection.  
* Druid: The Druid acts as a conduit for the raw power of nature. Their spells must reflect a deep, symbiotic bond with the natural world. Convert their spells to focus on commanding flora and fauna, manipulating natural elements like weather and terrain, and adopting the forms of wild beasts. Spells from their list, including Animal Courier, Barkform, and Plant Growth, are perfect examples that guide how their unique brand of divine magic should be represented.

Once the spell's core effect is properly aligned with the identity of its caster, it must be cross-referenced against more complex game mechanics and interactions.

---

4.0 Advanced Conversion: Interactions and Edge Cases

A fully converted spell must account for complex interactions within the game system. This section provides instructions for handling spells that interface with specific monster abilities, create lasting or unusual effects, or fall outside standard damage and buff categories.

4.1 Reconciling with Monster Traits

Spells must be evaluated against the traits and immunities of creatures found in the Monsters & Treasure sourcebook. Follow these steps to ensure consistency:

1. Spell Resistance (SR): If a spell's effect can be negated or reduced by a creature's innate magical resilience, the spell description must explicitly state that it is "affected by spell resistance."  
2. Immunities: Cross-reference the spell's effect (e.g., fire damage, poison, charm) against creature immunities. Add a canonical note to the spell description if it is ineffective against creatures with specific traits. For a mind-affecting spell, for example, add the note: "This spell has no effect on creatures with the Undead trait, as they are unaffected by effects which target the mind, such as charms and magical compulsions."  
3. Weapon Immunities: For spells that conjure weapons or create physical force effects, the description must specify if they function as magical weapons. This is critical for determining their effectiveness against creatures like Golems or a Wretch Wight, which are immune to normal weapons.  
4. Special Abilities: Evaluate if the spell's effect would be logically negated or altered by a monster's unique ability. A targeted damage spell, for instance, would be useless against a Tarrasque due to its Spell Immunity. A spell that relies on sight would be ineffective against a Gray Ooze due to its Transparent nature.

4.2 Handling Permanent and Creative Effects

For spells that create unusual, lasting, or unconventional effects, the following rules must be applied to maintain balance and consistency.

* Polymorph Effects: When converting a spell that changes a target's form, such as Polymorph, the spell description must detail the risks involved. This includes the possibility of the target assuming the consciousness of the new form and the rule that the target reverts to its original form if slain while polymorphed.  
* Permanent Spells: For spells made permanent with the Permanency spell, the description must state the exact mechanical cost. Upon casting, the wizard must make a constitution save. "If they succeed, they lose 1 point of constitution for 1 month. If they fail, they lose 1 point of constitution permanently." The description must also specify that the effect can only be dispelled by a spellcaster of a higher level than the original caster.  
* Summoning and Creation: For spells that summon or create creatures, such as Summon Familiar or Major Creation, the description must be explicit. Specify the duration of the creature's service, the nature of the empathic link between caster and creature (if any), and the consequences to the caster should the summoned creature be slain.

With all mechanical, thematic, and interactive elements checked, the final step is to format the spell entry according to the project's strict editorial standards.

---

5.0 Finalization: The Reforged Spell Entry Format

The final step in the conversion process is to present the completed spell in the standardized, "editorially final" format. This presentation ensures consistency across the entire spellbook and provides maximum clarity and usability for the Castle Keeper.

5.1 Spell Block Structure

All spell entries must adhere to the following template, which is derived from the standard format observed in the Players Handbook.

\[SPELL NAME\], LEVEL \[X\] \[CLASS\]

* Description: Provide a 1-2 sentence thematic description of the spell in italics.  
* Effect: Detail the spell's mechanical effects in a clear, concise paragraph using unambiguous, active language.  
* Statistics: Create a bulleted list for the spell's core statistical parameters.  
  * Casting Time: \[e.g., 1 round\]  
  * Range: \[e.g., 50 feet\]  
  * Area of Effect: \[e.g., 20 ft. radius\]  
  * Duration: \[e.g., 1 minute per level\]  
  * Saving Throw: \[e.g., Wisdom save negates\]  
  * Spell Resistance: \[e.g., Affected by SR\]  
* Components: \[e.g., Speech, Hand Gestures, Material (a pinch of wool worth 5cp)\]

5.2 Editorial Checklist

Before an entry is considered final, it must be verified against every point in this quality assurance checklist. This ensures adherence to project-wide editorial mandates.

Check	Requirement Disposition Terminology	Ensure disposition is in noun form (e.g., "evil," "law/good"), not adjective form. Attribute Terminology	Ensure all attributes are written in lowercase (e.g., "strength," "dexterity"). Clarity of Language	Verify that the spell's effect is described in unambiguous, active language. Markup Scan	Confirm the final text contains no broken markup or non-standard formatting that would require manual cleanup by an editor.

---

Appendix: Quick Conversion Checklist

This checklist serves as a high-level summary of the entire spell conversion process, intended for quick reference. A spell is not considered complete until it has passed every stage.

1. Philosophical Review: Does the spell's concept fit the world's lore and magical traditions (Divine, Arcane, etc.)?  
2. Class Identity Check: Does the spell's effect reinforce the core archetype of the casting class (Wizard, Cleric, etc.)?  
3. SIEGE Engine Calibration: Have the core parameters (Range, Duration, AoE, Saving Throw, CL) been standardized?  
4. Advanced Interactions: Has the spell been checked against key monster traits (SR, Immunities) and edge cases (Polymorph, Permanency)?  
5. Final Formatting: Is the spell written in the standard Reforged Edition spell block format?  
6. Editorial Pass: Has the entry been validated against the editorial checklist for correct terminology and clean markup?

