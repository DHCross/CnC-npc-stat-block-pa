# Index Builder Status Report

## Current Results

**Input**: 123 cleaned encounter entries  
**Output**: 94 unique stat blocks  
**Reduction**: 23.6%

### Gold Standard Compliance
✅ No quantity suffixes (x N)  
✅ No markdown formatting  
⚠️ Still contains some NPCs and invalid entries  
⚠️ Creating "variant" entries for HP differences  

---

## Remaining Issues

### 1. Non-Monster Entries Still Present
```
❌ "(fisherman/hunter/trapper/woodcutter)" - occupation descriptor
❌ "Children" - not a monster
❌ "Brigand," - trailing comma artifact
❌ "Elf, Wood, bowman/spearman/swordsman" - NPC class types
❌ "Fekk" - NPC name
❌ "Ember Raventree" - NPC name
```

### 2. Too Many "Variant" Entries
Created 20+ "(variant N)" entries for creatures that differ only in HP roll.

**Example: Goblins**
- Goblin prisoner: 1d6, HP 4, AC 14
- Goblin males: 1d6, HP 3, AC 14  
- Goblin females: 1d6, HP 2, AC 12
- Goblin patrol: 1d6, HP 4, AC 14
- Goblin warriors: 1d6, HP 4, AC 14

**Should consolidate to**:
- Goblin, raider (base type)
- Goblin, leader (corporal) (different HD: 3d6+2)
- Goblin shaman (different HD: 4d6)

The issue: Different encounter instances have different HP **rolls** from same HD, not different **stat blocks**.

### 3. Male/Female Distinction

Source shows:
- Goblin males: AC 14
- Goblin females: AC 12

This is a mechanical difference, BUT:
- For an index, we list "Goblin, raider" as the base stat block
- The male/female AC difference is encounter-specific detail
- Not separate index entries

---

## What Gold Standard Index SHOULD Look Like

Estimate: **~40-60 unique stat blocks**

### Breakdown by Type

**Animals** (~10)
- Ape, carnivorous
- Bat, cave
- Bat, giant cave
- Bear, black  
- Boar, wild
- Lion (mountain, forest)
- Otter, giant
- Owlbear (small)
- Turtle, Huge Snapping
- Wolf, Grey
- Wolverine (small, normal)

**Humanoids - Base Types** (~10)
- Bugbear
- Gnoll
- Goblin, raider
- Goblin, leader (corporal)
- Hobgoblin
- Kobold
- Lizardfolk
- Losel
- Orc

**Humanoids - Named Leaders** (~10)
- Blook-glook (Batrachianoid Chieftain)
- Grimlock Manface (Losel Chieftain)
- Gruzz Kree (Goblin Chieftain)
- Hub-Gub the Bloody (Hobgoblin Chieftain)
- King Griggle-gruk (Kobold Chieftain)
- King Krusher (Orc Leader)
- Yeexuul (Gnoll Chieftain)
- Ji'gun-tima (Losel Shaman)
- Goblin shaman
- Orc lieutenant

**Special Creatures** (~8)
- Batrachianoid
- Griffon
- Harpy
- Naga, Water
- Nixie (sprite)
- "Charlie" the Ogre
- "Pinky" the Owlbear  
- Wily Wil, Giant of the Hill

**Vermin/Insects** (~5)
- Centipede, Black, Giant
- Fire Beetles, Giant
- Rat, River (giant)
- Spider, Giant (medium-sized)
- Stirge
- Tick, Giant

**Undead** (~3)
- Ghoul
- Skeleton
- Zombie

**Oozes** (~2)
- Gray Ooze (small)
- Green slime

**Snakes** (~2)
- Snake, poisonous
- Snake, poisonous (deadly)

---

## What Needs to Happen

### Phase 1: Better NPC Filtering
- Remove all entries with "(fisherman/hunter/...)" pattern
- Remove "Children"
- Remove "Elf, Wood, [class]" patterns (these are classed NPCs)
- Remove proper-name NPCs without monster descriptors
- Keep "Charlie" the Ogre, "Pinky" the Owlbear (unique monsters with names)
- Keep all "[Name] (Chieftain/Leader/Shaman)" (boss monsters)

### Phase 2: Smart Deduplication
Current logic creates variants for HP differences.
Should only create variants for:
- Different HD (1d6 vs 2d6 vs 3d6+2)
- Different AC baseline
- Different race/class descriptor

Do NOT create variants for:
- Same HD, different HP roll
- Population descriptors (males, females, guards)

### Phase 3: Preserve Type Descriptors
Keep creature-defining descriptors:
- "raider", "leader", "corporal"
- "poisonous", "poisonous (deadly)"
- "giant", "small", "huge"
- "cave", "forest", "mountain"

Remove population descriptors:
- "males", "females"
- "guards", "sentries", "warriors"
- "patrol", "prisoners"
- Quantity suffixes (already done)

---

## Expected Final Count

Based on manual review: **~50 unique stat blocks**

This represents the true monster index for the Mouths of Madness module.

---

## Next Action

Revise `build_canonical_index.cjs` with:
1. Stricter NPC filtering
2. Smarter variant detection (HD/AC-based, not HP-based)
3. Better preservation of type descriptors  
4. Manual review of output to verify quality
