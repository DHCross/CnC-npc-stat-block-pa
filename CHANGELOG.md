# Changelog

## 2025-10-14

### Bug Fixes
- **Fixed: Attributes being collapsed to "physical" or "mental"**
  - Issue: Parser was converting specific attributes (strength, dexterity, etc.) to generic "physical" or "mental" labels
  - Root cause: `normalizeAttributes()` in `enhanced-parser.ts` was defaulting to prime type designations
  - Fix: Modified logic to preserve and list specific attribute names in PHB order
  - Now properly outputs: "strength, dexterity, and constitution" instead of "physical"
  - Only uses "physical" or "mental" if explicitly stated in the input text
  - Applies to both classed NPCs (when no scores provided) and unclassed units

### Development Experiments
- **Attempted Jules API Integration (Reverted)**
  - Explored integrating Google's Jules AI API for developer assistance
  - Created chat interface UI components (`JulesChat.tsx`, `dialog.tsx`, `scroll-area.tsx`)
  - Added API route (`/api/jules/route.ts`) with environment variable configuration
  - **Discovery**: Jules API is session-based and designed for GitHub repository automation (creating PRs, fixing bugs), not real-time chat
  - **Decision**: Removed integration as it didn't match the intended use case
  - Cleaned up UI components and removed Dev button from footer

### UI Components Added (Available for Future Use)
- Implemented Radix UI Dialog component (`src/components/ui/dialog.tsx`)
- Implemented Radix UI Scroll Area component (`src/components/ui/scroll-area.tsx`)
- These remain available for future features requiring modal dialogs or scrollable content

### Lessons Learned
- Jules API uses `X-Goog-Api-Key` header authentication (not Bearer tokens)
- Base URL: `https://jules.googleapis.com/v1alpha/`
- API structure: Sources (repos) → Sessions (tasks) → Activities (work updates)
- Not all AI APIs are designed for conversational chat interfaces
- Alternative APIs for chat: OpenAI GPT, Anthropic Claude, Google Gemini, GitHub Copilot Chat

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
