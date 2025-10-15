# What's New - NPC Stat Block Parser

**Welcome!** This changelog highlights improvements to the NPC Stat Block Parser for Castles & Crusades. Our goal is to make your stat blocks more consistent and PHB-compliant while saving you time.

**We'd love your feedback!** If you notice any issues or have suggestions, please let us know.

---

## October 14, 2025

### 🐛 Fixed: Attribute Names Now Preserved

**What was happening:** When parsing NPCs, specific attribute names like "strength, dexterity, constitution" were being changed to generic terms like "physical" or "mental."

**What we fixed:** The parser now preserves the exact attribute names you provide, maintaining clarity about which abilities are prime attributes.

**Example:**
- **Before:** "primary attributes: physical"
- **After:** "primary attributes: strength, dexterity, and constitution"

**Why this matters:** Knowing the specific prime attributes helps you and your players understand the character's strengths and mechanics more clearly.

**Your feedback needed:** Does this match how you'd like to see attributes displayed? If you prefer a different format or notice any issues, please let us know!

---

## September 19, 2025

### ✨ New: More Flexible Input Formats

**What changed:** The parser now accepts NPC stat blocks written in a more natural, prose-style format in addition to the strict format.

**What you can now do:**
- Write stats in parentheses after the NPC name: `**Sir Reynard** (HP 45, AC 18)`
- Use natural language: "He is lawful good" or "She carries a sword and shield"
- Describe mounts naturally: "He rides a heavy warhorse into battle"
- Mix formats as needed

**What the parser does:**
- Automatically converts your prose into the standard PHB format
- Italicizes magic items correctly
- Generates complete mount stat blocks when mentioned
- Ensures consistent terminology and formatting

**Example Input:**
```
Sir Reynard (HP 45, AC 18, lawful good). He carries a sword +1, 
full plate, and a large shield. He rides a heavy warhorse.
```

**Parser Output:**
```
**Sir Reynard** *(This 5th level human fighter's vital stats are 
HP 45, AC 18, disposition lawful/good. His primary attributes are 
strength, dexterity, and constitution. He carries *sword +1 (+1 bonus)*, 
full plate mail, and a large steel shield.)*

He rides a heavy warhorse in battle.

**Heavy War Horse (mount)** *(This creature's vital stats are 
HD 4d10, HP 35, AC 19, disposition neutral. It receives two hoof 
attacks for 1–4 damage or one overbearing attack.)*
```

**Why this matters:** You can write stat blocks more naturally and let the tool handle the formatting details.

**Your feedback needed:** Is this flexibility helpful? What other input formats would make your work easier?

---

## How to Give Feedback

We're constantly improving this tool based on your needs. Please share:
- **Issues you encounter** - What's not working as expected?
- **Desired features** - What would make this more useful?
- **Format preferences** - How do you prefer your stat blocks formatted?
- **Real examples** - Share stat blocks that the parser struggles with

The more specific you can be, the better we can help!

---

## Coming Soon

We're exploring:
- Better handling of edge cases in equipment parsing
- Improved magic item name recognition and formatting
- Support for more complex NPC abilities and special rules

Stay tuned for updates!
