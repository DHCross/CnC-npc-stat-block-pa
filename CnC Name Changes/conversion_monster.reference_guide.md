# Monster & Item Conversion Reference Guide

## Purpose
This guide provides contextual rules, formatting mandates, and conversion principles to support the master CSV mappings. It ensures consistent naming, mechanical clarity, and alignment with the latest *Monsters & Treasure* (M&T) conventions.

---

## Conversion Principles

### 1. Standardization to Canonical Forms
- All monster names must be standardized to the latest canonical *Monsters & Treasure* (M&T) equivalents
- The master CSV acts as the dictionary for required replacements
- Consistency across all game materials is mandatory

### 2. Addressing IP Issues and Removal
- Differentiate between:
  - **Name changes** (creature retained with new name)
  - **Removals** (creature eliminated from M&T)
- Document rationale for IP-related changes

### 3. Formatting Mandates

#### Italicization
- Magic item names must be italicized (e.g., *Robe of Armor*, *Portable Portal*)
- Monster abilities that reference items should follow the same convention

#### Bonus Placement
- All numerical bonuses must appear **at the end** of the item name
- Examples:
  - Correct: *Robe of Armor +3*
  - Incorrect: *+3 Robe of Armor*

#### Naming Conventions
- Use consistent capitalization
- Maintain "Giant" suffix for oversized creatures (e.g., "Ant, Giant" or "Ant Lion, Giant")
- Preserve mythological accuracy where applicable

---

## Specific Replacement Rules

### Monster Name Conversions
Based on the conversion table from source documents:

| Old Name | New Name | Type | Notes |
|----------|----------|------|-------|
| Aboleth | Abhorrent | Aberration | Standardization via SRD |
| Acephali | *Remove from M&T* | Humanoid | Removed due to mythological origin |
| Aerial Servant | Aerial Thrall | Extraplanar | Name change |
| Allip | Wraithwisp | Undead | Name change |
| Ankheg | Ankh Mantis | Beast | Name change |
| Azer | Aiser | Extraplanar | Name change/Slavic creature similarity |
| Behir | Lightning Wyrm | Magical Beast | Name change |
| Belker | Shadow Demon | Elemental | Name change |
| Cadaver Caterpillar | Cadaver Caterpillar | Aberration | Carrion Crawler with name changed |
| Flumph | Flumm | Extraplanar | Name change |
| Mephit, Fire | Impling, Fire | Extraplanar | Part of group conversion of mephits to Implings |
| Xorn | Zorn | Extraplanar | Name change |

### Magic Item Conversions
| Old Name | New Name | Notes |
|----------|----------|-------|
| Robe of Protection | *Robe of Armor* or *Robe +3* | Canonicalization; bonus at end |
| Well of Many Worlds | *Portable Portal* | Canonicalization |

---

## Potion & Scroll Level Reference
*(To be populated with specific level requirements for potions and scrolls)*

### Potions
- Document minimum caster level
- Note duration and effect scaling
- Cross-reference spell equivalents

### Scrolls
- Specify spell level
- Note caster level requirements
- Document material component exceptions

---

## Monster Notes & Special Cases

### Undead Creatures
- Distinguish between Extraordinary and Supernatural undead
- Note Sanity effects where applicable
- Document Turn Undead interactions

### Extraplanar Creatures
- Specify home plane
- Note summoning restrictions
- Document banishment vulnerabilities

### Environmental Considerations
- Climate restrictions (Tropical, Temperate, Arctic, etc.)
- Biome preferences (Subterranean, Aquatic, Forest, Plains, etc.)
- AD&D 2E environment compatibility notes

---

## Quality Assurance Checklist

- [ ] All old names mapped to new canonical names
- [ ] Magic items properly italicized
- [ ] Bonuses placed at end of item names
- [ ] Type classification accurate
- [ ] Source attribution included
- [ ] IP issues documented
- [ ] Environmental data complete
- [ ] HD and Die Value specified
- [ ] Disposition/Alignment noted
- [ ] Sanity effects flagged

---

## Usage Notes

1. **For Conversion**: Use the master CSV as the authoritative mapping
2. **For Authoring**: Follow formatting mandates strictly
3. **For QA**: Cross-reference against this guide
4. **For Tooling**: Parse CSV for automated replacements

---

*This guide should be updated as new conversions are identified and M&T conventions evolve.*
