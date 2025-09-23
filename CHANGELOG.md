# Changelog



## 2025-09-20

### Tooling & Workflow Improvements
 Documented the process for installing dependencies with the `-W` flag in Yarn workspaces.
## 2025-09-19

### Major Enhancements
- Relaxed parser to accept parenthetical/prose NPC input:
	- Accepts HP/AC in parentheses after bold title
	- Parses disposition from "He is a/an ..." and "They are a/an ..."
	- Extracts equipment from prose ("He carries ...") and normalizes/italicizes items
	- Detects mounts from "rides a/an ..." and generates canonical warhorse block
	- Block detection now accepts title + parenthetical + prose body
- Editorial enforcement (italics, PHB order, shield normalization, PHB renames, complete sentences) still applied
- Added comprehensive test for flexible input (Sir Reynard example); all 20 tests passing

### Lessons Learned
- Prose parsing requires robust title/body splitting and flexible regexes
- Editorial standards can be enforced even with permissive input
- Test-driven development ensures reliability for both strict and flexible formats
