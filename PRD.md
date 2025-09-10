# NPC Stat Block Parser

Convert detailed tabletop RPG NPC stat blocks into concise, single-line summaries for quick reference during gameplay.

**Experience Qualities**: 
1. Efficient - Processes complex stat blocks instantly without manual parsing
2. Accurate - Extracts key information reliably using smart pattern recognition  
3. Clean - Presents data in a standardized, readable format for game masters

**Complexity Level**: Light Application (multiple features with basic state)
- Handles text parsing, batch processing, and provides immediate visual feedback for tabletop gaming workflows

## Essential Features

**Text Input Processor**
- Functionality: Accepts pasted NPC stat blocks and extracts key information (name, class, level, HP, AC, equipment, etc.)
- Purpose: Eliminates manual summarization work for game masters
- Trigger: User pastes stat block text into input area
- Progression: Paste text → automatic parsing → display condensed summary → copy/save result
- Success criteria: Accurately extracts name, race/class/level, disposition, HP/AC, and equipment from various stat block formats

**Batch Processing**
- Functionality: Processes multiple NPC stat blocks separated by blank lines simultaneously
- Purpose: Handles campaign preparation efficiently when processing multiple NPCs
- Trigger: User pastes multiple stat blocks in single input
- Progression: Paste multiple blocks → system detects separations → processes each individually → displays all summaries
- Success criteria: Correctly separates and processes each NPC block independently

**Smart Pattern Recognition**
- Functionality: Uses regex patterns to identify different stat block formats and extract relevant data
- Purpose: Works with various RPG system formats and inconsistent formatting
- Trigger: Text analysis during processing
- Progression: Text input → pattern matching → data extraction → validation → output formatting
- Success criteria: Handles bold names, different alignment formats, equipment lists, and spell slot notations

**Real-time Preview**
- Functionality: Shows condensed output immediately as user types or pastes
- Purpose: Provides instant feedback and allows quick corrections
- Trigger: Text input change
- Progression: Text change → immediate reprocessing → updated preview display
- Success criteria: Updates within 100ms of input change, maintains scroll position

## Edge Case Handling

- **Malformed Text**: Display helpful error messages for unparseable content
- **Missing Data**: Gracefully handle incomplete stat blocks with "unknown" placeholders  
- **Mixed Formats**: Attempt extraction from various RPG system formats
- **Large Text**: Handle performance for very long stat block dumps
- **Empty Input**: Show example format and clear instructions

## Design Direction

The interface should feel like a professional game master's digital tool - clean, focused, and efficient. Minimal interface with emphasis on the text processing workflow, avoiding distractions during active gameplay preparation.

## Color Selection

Analogous color scheme using deep blues and teals to evoke the mystical, strategic nature of tabletop RPGs while maintaining excellent readability for text-heavy content.

- **Primary Color**: Deep Blue (oklch(0.45 0.15 240)) - Communicates reliability and focus for the main processing functions
- **Secondary Colors**: Slate Gray (oklch(0.65 0.02 240)) for supporting elements and Teal (oklch(0.55 0.12 180)) for accent highlights
- **Accent Color**: Bright Cyan (oklch(0.75 0.15 195)) - Attention-grabbing highlight for processed results and action buttons
- **Foreground/Background Pairings**: 
  - Background (White oklch(1 0 0)): Dark Blue text (oklch(0.25 0.05 240)) - Ratio 8.2:1 ✓
  - Card (Light Gray oklch(0.98 0.01 240)): Dark Blue text (oklch(0.25 0.05 240)) - Ratio 7.8:1 ✓  
  - Primary (Deep Blue oklch(0.45 0.15 240)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Accent (Bright Cyan oklch(0.75 0.15 195)): Dark Blue text (oklch(0.25 0.05 240)) - Ratio 6.1:1 ✓

## Font Selection

Technical clarity with a subtle fantasy feel - using a clean monospace font for stat blocks to ensure alignment and readability, paired with a modern sans-serif for interface elements.

- **Typographic Hierarchy**:
  - H1 (App Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/20px/normal spacing  
  - Body (Interface): Inter Regular/16px/relaxed line height
  - Code (Stat Blocks): JetBrains Mono/14px/fixed width for perfect alignment
  - Labels: Inter Medium/14px/uppercase for form labels

## Animations

Subtle functionality-focused animations that enhance the parsing workflow without disrupting concentration during game preparation.

- **Purposeful Meaning**: Smooth transitions communicate processing status and guide attention to newly generated results
- **Hierarchy of Movement**: Input focus states and result highlighting receive priority, with minimal decorative motion

## Component Selection

- **Components**: Textarea for input, Card for results display, Button for actions, Alert for error states, Separator for multiple results
- **Customizations**: Custom syntax highlighting for parsed stat blocks, monospace result display component
- **States**: Clear input/output states, processing indicators, error highlighting, success confirmation
- **Icon Selection**: Copy (for result copying), Upload (for file import), Download (for export), AlertCircle (for errors)
- **Spacing**: Consistent 4-unit spacing (16px) between major sections, 2-unit (8px) for related elements
- **Mobile**: Single column layout with collapsible input/output sections, larger touch targets for action buttons