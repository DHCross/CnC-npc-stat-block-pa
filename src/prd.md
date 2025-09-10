# NPC Stat Block Parser - Product Requirements Document

## Core Purpose & Success

**Mission Statement**: Transform detailed tabletop RPG NPC stat blocks into properly formatted Castles & Crusades narrative entries that match the original reference style, with automatic formatting, C&C convention compliance, and batch processing capabilities for multiple NPCs.

**Success Indicators**: 
- Accurate parsing of diverse NPC stat block formats
- Perfect adherence to C&C narrative formatting standards
- Automatic magic item italicization and proper terminology
- Fast conversion with instant feedback
- Efficient batch processing of multiple NPCs
- High usability for both new and experienced Castle Keepers

**Experience Qualities**: Professional, Precise, Efficient

## Project Classification & Approach

**Complexity Level**: Light Application (specialized parsing with persistent state management)

**Primary User Activity**: Creating (transforming detailed stat blocks into standardized C&C narrative format)

## Thought Process for Feature Selection

**Core Problem Analysis**: Castle Keepers need properly formatted NPC entries that follow official Castles & Crusades conventions, but manually converting stat blocks is time-consuming and error-prone.

**User Context**: Castle Keepers preparing adventures or converting materials who need consistent, properly formatted NPC entries that match the published C&C style guide.

**Critical Path**: Input diverse stat block(s) → Parse with C&C rules → Generate compliant narrative format(s) → Copy for publication/use

**Key Moments**: 
1. Intelligent format recognition and title/body separation
2. Proper disposition normalization (lawful good → law/good)
3. Automatic magic item detection and italicization
4. Mount statistics generation when applicable

## Essential Features

### Core Parsing Engine
- **Functionality**: Extracts key NPC data (name, class/level, HP, AC, equipment, etc.) from various stat block formats, supporting both single NPCs and batch processing of multiple NPCs separated by blank lines
- **Purpose**: Handles diverse formatting styles from different RPG sources and enables efficient conversion of multiple NPCs at once
- **Success Criteria**: Successfully parses 95%+ of common stat block formats, correctly identifies and separates multiple NPCs in batch input

### Template System
- **Functionality**: Provides structured Castles & Crusades templates for both single NPCs and batch processing examples
- **Purpose**: Guides users toward standardized, parseable formats and demonstrates proper batch formatting
- **Success Criteria**: Templates generate correctly formatted stat blocks that parse accurately, batch template clearly shows proper NPC separation

### Real-time Processing
- **Functionality**: Instant conversion as users type or paste content, handling both single NPCs and multiple NPCs automatically
- **Purpose**: Immediate feedback prevents formatting errors and reduces workflow friction, enables rapid conversion of multiple NPCs
- **Success Criteria**: Sub-100ms processing time for typical stat blocks, successful identification and parsing of multiple NPCs

### Results Management
- **Functionality**: Copy individual/all results, save NPCs for later reference, download as text files
- **Purpose**: Supports various workflow preferences and session preparation needs
- **Success Criteria**: Zero-friction export to common formats

### Persistent Storage
- **Functionality**: Saves previously processed NPCs across sessions
- **Purpose**: Builds personal NPC library for recurring campaign use
- **Success Criteria**: Reliable data persistence with easy access and management

## Design Direction

### Visual Tone & Identity
**Emotional Response**: Professional confidence with subtle gaming references
**Design Personality**: Clean, systematic, slightly technical but approachable
**Visual Metaphors**: Parchment textures, dice iconography, table organization
**Simplicity Spectrum**: Minimal interface that doesn't distract from content processing

### Color Strategy
**Color Scheme Type**: Analogous with accent
**Primary Color**: Deep blue (oklch(0.45 0.15 240)) - suggests reliability and focus
**Secondary Colors**: Slate grays for supporting elements
**Accent Color**: Bright cyan (oklch(0.75 0.15 195)) - highlights interactive elements
**Color Psychology**: Blue conveys professionalism and trust; cyan provides energy for actions
**Color Accessibility**: All combinations exceed WCAG AA contrast requirements

### Typography System
**Font Pairing Strategy**: Inter (clean sans-serif) for UI, JetBrains Mono for code/stat blocks
**Typographic Hierarchy**: Clear distinction between headers, body text, and monospace content
**Font Personality**: Inter conveys modern professionalism; JetBrains Mono ensures readable stat blocks
**Readability Focus**: Generous line spacing, appropriate sizes for quick scanning
**Typography Consistency**: Systematic use of weights and sizes throughout interface

### Visual Hierarchy & Layout
**Attention Direction**: Left-to-right flow from input to results
**White Space Philosophy**: Generous spacing to reduce cognitive load during stat block processing
**Grid System**: Two-column layout on desktop, stacked on mobile
**Responsive Approach**: Mobile-first design with expanded desktop capabilities
**Content Density**: Balanced information display without overwhelming users

### Animations
**Purposeful Meaning**: Subtle feedback for successful operations and state changes
**Hierarchy of Movement**: Minimal, functional animations that don't delay workflow
**Contextual Appropriateness**: Professional feel appropriate for productivity tool

### UI Elements & Component Selection
**Component Usage**: Cards for content sections, buttons for actions, textarea for input
**Component Customization**: Subtle border radius, professional color application
**Component States**: Clear hover, focus, and active states for all interactive elements
**Icon Selection**: Phosphor icons for consistent, professional appearance
**Component Hierarchy**: Primary actions (parse, copy) emphasized; secondary actions available but subdued

### Accessibility & Readability
**Contrast Goal**: WCAG AA compliance achieved across all text and interface elements
**Keyboard Navigation**: Full keyboard accessibility with logical tab order
**Screen Reader Support**: Proper semantic markup and ARIA labels

## Edge Cases & Problem Scenarios

**Potential Obstacles**: 
- Inconsistent stat block formatting across different RPG systems
- Very long or complex stat blocks that don't fit condensed format
- User confusion about supported formats

**Edge Case Handling**: 
- Graceful degradation for unparseable content
- Clear error messages with formatting guidance
- Template system to guide proper input
- Intelligent NPC separation for batch processing
- Fallback parsing when standard separators aren't used

**Technical Constraints**: Browser clipboard API limitations, file size limits for processing

## Implementation Considerations

**Scalability Needs**: Modular parser system to support additional RPG systems
**Testing Focus**: Parser accuracy across diverse stat block formats
**Critical Questions**: What parsing failures are acceptable? How to handle edge cases gracefully?

## Reflection

This approach uniquely combines real-time processing with template guidance, addressing both immediate workflow needs and long-term standardization goals. The focus on professional presentation distinguishes it from hobby-level tools while remaining accessible to casual users.

The template system addresses a key gap in existing tools by not just parsing existing content but helping users create properly formatted content from the start.