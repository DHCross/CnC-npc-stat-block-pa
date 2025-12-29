# Chunk 32

### data/mouths-of-madness/parser_audit_report.json

```json
{
  "generated": "2025-11-16T07:01:40.820Z",
  "summary": {
    "total_entries": 129,
    "entries_with_issues": 129,
    "issues_by_severity": {
      "critical": 10,
      "high": 0,
      "medium": 144,
      "low": 0
    },
    "issues_by_type": {
      "missing_xp_recommended": 129,
      "missing_hd_recommended": 14,
      "markdown_formatting": 7,
      "likely_fragment": 3,
      "possible_truncation": 1
    },
    "duplicates_found": 4
  },
  "duplicates": [
    {
      "normalized": "snake poisonous",
      "entries": [
        {
          "index": 32,
          "title": "Snake, poisonous"
        },
        {
          "index": 62,
          "title": "Snake, Poisonous"
        }
      ]
    },
    {
      "normalized": "spider giant mediumsized",
      "entries": [
        {
          "index": 34,
          "title": "Spider, Giant (medium-sized)"
        },
        {
          "index": 63,
          "title": "Spider, Giant (medium-sized)"
        }
      ]
    },
    {
      "normalized": "kobold serjeant x 1",
      "entries": [
        {
          "index": 71,
          "title": "Kobold serjeant x 1"
        },
        {
          "index": 73,
          "title": "Kobold serjeant x 1"
        }
      ]
    },
    {
      "normalized": "orcs x 4",
      "entries": [
        {
          "index": 102,
          "title": "Orcs x 4"
        },
        {
          "index": 107,
          "title": "Orcs x 4"
        }
      ]
    }
  ],
  "problematic_entries": [
    {
      "index": 0,
      "title": "Ape, carnivorous",
      "sourceIndex": 58495,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 1,
      "title": "Bandit",
      "sourceIndex": 59104,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 2,
      "title": "Bandit, Lieutenant",
      "sourceIndex": 59395,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 3,
      "title": "Bat, giant cave",
      "sourceIndex": 59695,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 4,
      "title": "**Batrachianoid*:** _",
      "sourceIndex": 60136,
      "issues": [
        {
          "type": "markdown_formatting",
          "severity": "critical",
          "message": "Title contains markdown formatting"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 5,
      "title": "Bear, black",
      "sourceIndex": 60547,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 6,
      "title": "Boar, wild",
      "sourceIndex": 60899,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 7,
      "title": "Brigand, crossbowmen",
      "sourceIndex": 61144,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 8,
      "title": "Brigand, flailmen",
      "sourceIndex": 61483,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 9,
      "title": "Brigand, Serjeant",
      "sourceIndex": 61749,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 10,
      "title": "Bugbear",
      "sourceIndex": 62055,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 11,
      "title": "Elf, Wood, bowman",
      "sourceIndex": 62393,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 12,
      "title": "Elf, Wood, spearman",
      "sourceIndex": 62830,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 13,
      "title": "Elf, Wood, swordsman",
      "sourceIndex": 63267,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 14,
      "title": "Ghoul",
      "sourceIndex": 63705,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 15,
      "title": "Gnoll",
      "sourceIndex": 64380,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 16,
      "title": "Goblin, raider",
      "sourceIndex": 64699,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 17,
      "title": "Goblin, leader (corporal)",
      "sourceIndex": 65005,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 18,
      "title": "Griffon",
      "sourceIndex": 65369,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 19,
      "title": "Hobgoblin",
      "sourceIndex": 65660,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 20,
      "title": "Kobold",
      "sourceIndex": 65971,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 21,
      "title": "Lion (mountain, forest)",
      "sourceIndex": 66281,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 22,
      "title": "Lizardfolk",
      "sourceIndex": 66601,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 23,
      "title": "**Losel*:** _",
      "sourceIndex": 66823,
      "issues": [
        {
          "type": "markdown_formatting",
          "severity": "critical",
          "message": "Title contains markdown formatting"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 24,
      "title": "(fisherman/hunter/trapper/woodcutter)",
      "sourceIndex": 67390,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        },
        {
          "type": "likely_fragment",
          "severity": "critical",
          "message": "Validation issue: likely_fragment"
        }
      ]
    },
    {
      "index": 25,
      "title": "Naga, Water",
      "sourceIndex": 67707,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 26,
      "title": "Nixies (sprite)",
      "sourceIndex": 68589,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 27,
      "title": "Orc",
      "sourceIndex": 68931,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 28,
      "title": "Otter, giant",
      "sourceIndex": 69249,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 29,
      "title": "Owlbear (small)",
      "sourceIndex": 69448,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 30,
      "title": "Rats, River (giant)",
      "sourceIndex": 70000,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 31,
      "title": "Rivermen",
      "sourceIndex": 70331,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 32,
      "title": "Snake, poisonous",
      "sourceIndex": 70677,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 33,
      "title": "Snake, poisonous (deadly)",
      "sourceIndex": 70950,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 34,
      "title": "Spider, Giant (medium-sized)",
      "sourceIndex": 71269,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 35,
      "title": "Stirges",
      "sourceIndex": 71684,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 36,
      "title": "Thieves",
      "sourceIndex": 71967,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 37,
      "title": "Turtle, Huge Snapping",
      "sourceIndex": 72473,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 38,
      "title": "Wolf, Grey",
      "sourceIndex": 73124,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 39,
      "title": "Wolverine (small, normal)",
      "sourceIndex": 73400,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 40,
      "title": "Grimlock Manface (Losel Chieftain)",
      "sourceIndex": 88639,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 41,
      "title": "Ji'gun-tima (Losel Shaman)",
      "sourceIndex": 89263,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 42,
      "title": "Losel sub-chiefs x 10",
      "sourceIndex": 89896,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 43,
      "title": "Losel warriors x 30",
      "sourceIndex": 90458,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 44,
      "title": "Losel females x 35",
      "sourceIndex": 91060,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 45,
      "title": "**Iggy the Mad*:** _",
      "sourceIndex": 92960,
      "issues": [
        {
          "type": "markdown_formatting",
          "severity": "critical",
          "message": "Title contains markdown formatting"
        },
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 46,
      "title": "The Ogre",
      "sourceIndex": 96795,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 47,
      "title": "Children x 3-6",
      "sourceIndex": 97199,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 48,
      "title": "**Batrachianoids* x 6:** _",
      "sourceIndex": 103505,
      "issues": [
        {
          "type": "markdown_formatting",
          "severity": "critical",
          "message": "Title contains markdown formatting"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 49,
      "title": "Blook-glook (Batrachianoid Chieftain)",
      "sourceIndex": 104261,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 50,
      "title": "Spider, Giant (medium-sized) x 2",
      "sourceIndex": 105936,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 51,
      "title": "**Harpy*:** _",
      "sourceIndex": 107407,
      "issues": [
        {
          "type": "markdown_formatting",
          "severity": "critical",
          "message": "Title contains markdown formatting"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 52,
      "title": "Tick, Giant x 3",
      "sourceIndex": 108895,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 53,
      "title": "Wood Elf Scouts x 11",
      "sourceIndex": 111852,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 54,
      "title": "Ember Raventree (wood elf leader)",
      "sourceIndex": 112303,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 55,
      "title": "86-90",
      "sourceIndex": 55432,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        },
        {
          "type": "likely_fragment",
          "severity": "critical",
          "message": "Validation issue: likely_fragment"
        }
      ]
    },
    {
      "index": 56,
      "title": "Raven \"One-Eye\"",
      "sourceIndex": 115657,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 57,
      "title": "Bandit sentries x 8",
      "sourceIndex": 116651,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 58,
      "title": "Bat, Cave",
      "sourceIndex": 127925,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 59,
      "title": "Centipedes, Black, Giant",
      "sourceIndex": 128374,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 60,
      "title": "**Fire Beetles*, Giant:** _",
      "sourceIndex": 128665,
      "issues": [
        {
          "type": "markdown_formatting",
          "severity": "critical",
          "message": "Title contains markdown formatting"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 61,
      "title": "Rats, Giant",
      "sourceIndex": 128908,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 62,
      "title": "Snake, Poisonous",
      "sourceIndex": 129247,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 63,
      "title": "Spider, Giant (medium-sized)",
      "sourceIndex": 129551,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 64,
      "title": "Tick, Giant",
      "sourceIndex": 130089,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 65,
      "title": "Wolves x 5",
      "sourceIndex": 131969,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 66,
      "title": "**The Little Hillwood Werewolf*:** _",
      "sourceIndex": 133978,
      "issues": [
        {
          "type": "markdown_formatting",
          "severity": "critical",
          "message": "Title contains markdown formatting"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 67,
      "title": "Kobold Guards x 2",
      "sourceIndex": 138174,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 68,
      "title": "Mastiff",
      "sourceIndex": 138585,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 69,
      "title": "Fekk",
      "sourceIndex": 141713,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 70,
      "title": "Kobold warrior x 6",
      "sourceIndex": 142512,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 71,
      "title": "Kobold serjeant x 1",
      "sourceIndex": 142809,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 72,
      "title": "Kobold warrior x",
      "sourceIndex": 144008,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        },
        {
          "type": "possible_truncation",
          "severity": "medium",
          "message": "Title may be truncated or malformed"
        }
      ]
    },
    {
      "index": 73,
      "title": "Kobold serjeant x 1",
      "sourceIndex": 144305,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 74,
      "title": "King Griggle-gruk (Kobold Chieftain)",
      "sourceIndex": 146654,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 75,
      "title": "Kobold Bodyguards x 2",
      "sourceIndex": 147108,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 76,
      "title": "Goblin prisoner",
      "sourceIndex": 148467,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 77,
      "title": "\"Charlie\" the Ogre",
      "sourceIndex": 151141,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 78,
      "title": "Goblin patrol warriors x 5",
      "sourceIndex": 155973,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 79,
      "title": "Goblin guards x 4",
      "sourceIndex": 157044,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 80,
      "title": "Goblin patrol warriors x 6",
      "sourceIndex": 158677,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 81,
      "title": "Goblin males x 8",
      "sourceIndex": 161831,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 82,
      "title": "Goblin females x 13",
      "sourceIndex": 162165,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 83,
      "title": "Goblin warriors x 3",
      "sourceIndex": 168595,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 84,
      "title": "Goblin serjeant",
      "sourceIndex": 168929,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 85,
      "title": "Prisoner #2: An elderly orc",
      "sourceIndex": 171131,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 86,
      "title": "Robert Cooper",
      "sourceIndex": 172453,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 87,
      "title": "Oni Blackbeard (Dwarf Crossbowman)",
      "sourceIndex": 173642,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 88,
      "title": "Wilbur Hornblower",
      "sourceIndex": 174887,
      "issues": [
        {
          "type": "missing_hd_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_hd_recommended"
        },
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 89,
      "title": "Goblin shaman",
      "sourceIndex": 177449,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 90,
      "title": "Goblin Skeletons x 4",
      "sourceIndex": 178128,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 91,
      "title": "Goblin warriors x 2",
      "sourceIndex": 181975,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 92,
      "title": "Gruzz Kree (Goblin Chieftain)",
      "sourceIndex": 184388,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 93,
      "title": "Goblin females x 6",
      "sourceIndex": 184824,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 94,
      "title": "Cave bats x 80",
      "sourceIndex": 186327,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 95,
      "title": ")** _",
      "sourceIndex": 188927,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        },
        {
          "type": "likely_fragment",
          "severity": "critical",
          "message": "Validation issue: likely_fragment"
        }
      ]
    },
    {
      "index": 96,
      "title": "Snakes, poisonous",
      "sourceIndex": 190284,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 97,
      "title": "Green slime",
      "sourceIndex": 192531,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 98,
      "title": "Rats, giant x 3-12",
      "sourceIndex": 194494,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 99,
      "title": "Gray Ooze (small)",
      "sourceIndex": 196194,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 100,
      "title": "Black Centipedes, giant x 5",
      "sourceIndex": 199320,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 101,
      "title": "Orcs x 3",
      "sourceIndex": 201602,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 102,
      "title": "Orcs x 4",
      "sourceIndex": 202054,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 103,
      "title": "Orcs x 6",
      "sourceIndex": 204714,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 104,
      "title": "Orc Guards x 2",
      "sourceIndex": 205532,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 105,
      "title": "King Krusher (Orc Leader)",
      "sourceIndex": 208684,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 106,
      "title": "Orc chieftain's mate",
      "sourceIndex": 209707,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 107,
      "title": "Orcs x 4",
      "sourceIndex": 211369,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 108,
      "title": "Orc lieutenant",
      "sourceIndex": 211687,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 109,
      "title": "Zombies x 6",
      "sourceIndex": 216535,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 110,
      "title": "Skeletons x 8",
      "sourceIndex": 218587,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 111,
      "title": "Wily Wil, Giant of the Hill",
      "sourceIndex": 222850,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 112,
      "title": "\"Pinky\" the Owlbear",
      "sourceIndex": 225293,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 113,
      "title": "Black Bear",
      "sourceIndex": 229920,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 114,
      "title": "Black Bear cubs x 2",
      "sourceIndex": 230329,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 115,
      "title": "River Rats, giant x 40",
      "sourceIndex": 231908,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 116,
      "title": "Stirges x 8",
      "sourceIndex": 240182,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 117,
      "title": "Bugbears x 3",
      "sourceIndex": 241850,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 118,
      "title": "Hobgoblin sentries x 2",
      "sourceIndex": 248459,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 119,
      "title": "Hobgoblin males x 2 or 4",
      "sourceIndex": 249977,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 120,
      "title": "Hobgoblin females x 9",
      "sourceIndex": 250292,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 121,
      "title": "Hobgoblin warriors x 2",
      "sourceIndex": 252899,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 122,
      "title": "Hub-Gub the Bloody (Hobgoblin Chieftain)",
      "sourceIndex": 254444,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 123,
      "title": "Hobgoblin females x 3",
      "sourceIndex": 254900,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 124,
      "title": "Gnoll sentries x 2",
      "sourceIndex": 257035,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 125,
      "title": "Gnoll males x 4",
      "sourceIndex": 259311,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 126,
      "title": "Gnoll females x 5",
      "sourceIndex": 259645,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 127,
      "title": "Gnoll guards x 2",
      "sourceIndex": 260733,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    },
    {
      "index": 128,
      "title": "Yeexuul (Gnoll Chieftain)",
      "sourceIndex": 261048,
      "issues": [
        {
          "type": "missing_xp_recommended",
          "severity": "medium",
          "message": "Validation issue: missing_xp_recommended"
        }
      ]
    }
  ]
}
```

