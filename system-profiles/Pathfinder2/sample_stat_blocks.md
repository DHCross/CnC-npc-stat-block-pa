# Pathfinder 2e Sample Entities (Tier 2 Profile Data)
This file contains canonical Pathfinder 2e stat blocks to be used as test inputs for the adapted parser.

## Goblin Warrior
This block tests standard Monster classification and simple action parsing.

**Level:** 1
**Type:** Small humanoid (goblin)
**Alignment:** Chaotic Evil
**Traits:** Goblin, Humanoid, Orcish (trait to test)

**AC:** 16 (Leather Armor)
**HP:** 20
**Speed:** 25 feet
**Perception:** +5
**Saves:** Fort +5, Ref +8, Will +2
**Languages:** Common, Goblin

**Abilities:**
**Sneak Attack (Trait):** +1d6 precision damage if the target is flat-footed.
**Maneuver (Action):** **Climb:** +8, **Stealth:** +6

**Actions:**
**Shortsword (Melee, 1 Action):** +8 to hit, 1d6+3 slashing damage.
**Shortbow (Ranged, 1 Action):** +8 to hit, 1d6 piercing damage (Range 60 ft.).
---

## Captain Elara (Human Marshal)
This block tests named NPC status, multiple defensive actions, and complex ability score structure. Your PF2e parser adaptation must classify this as an **NPC**.

**Level:** 8
**Type:** Medium Humanoid (human)
**Alignment:** Lawful Good
**Traits:** Human, Leader, Classed (trait to test parser logic)

**AC:** 27 (Plate Armor)
**HP:** 140
**Speed:** 20 feet
**Perception:** +17
**Saves:** Fort +16, Ref +13, Will +19

**Ability Scores:** STR 18 (+4), DEX 14 (+2), CON 18 (+4), INT 10 (+0), WIS 20 (+5), CHA 16 (+3)

**Gear:**
**Weapon:** +1 Flaming Longsword (Melee, 1 Action)
**Armor:** +1 Full Plate (Worn)
**Coin:** 50 gold in coin, 15 silver in coin

**Abilities:**
**Marshal's Aura (Aura, 10 ft.):** Allies gain +1 status bonus to saving throws.
**Challenge (Action):** Marks one enemy for defeat, granting a +2 status bonus to attack rolls against it.

**Actions:**
**Longsword Strike (1 Action):** +18 to hit (includes marshal aura), 2d8+8 slashing damage + 1d6 fire damage.
**Battle Cry (1 Action, Incapacitation):** All enemies within 30 feet must attempt a DC 24 Will save or become frightened 1.
---

## Pit Trap (Hazard)
This block tests the ability to parse a non-creature entity type, which requires different field validation.

**Level:** 3
**Type:** Mechanical, Trap
**Stealth:** DC 23 (Expert)
**Disable:** DC 20 (Expert)
**Immunity:** Critical Hits, Object Immunities

**AC:** 18
**Hardness:** 8
**HP:** 32 (Broken Threshold 16)

**Effect (Trigger):** Pressure plate is stepped on.
**Effect (Ransom):** Target falls 20 feet, taking 2d6 falling damage and 4d6 piercing damage from spikes (DC 20 Basic Reflex Save). Target is Immobilized.
