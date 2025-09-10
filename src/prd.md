# NPC Stat Block Parser - Product Requirements Document

## Core Purpose & Success

**Mission Statement**: Transform detailed tabletop RPG NPC stat blocks into concise, single-line summaries optimized for quick reference during gameplay sessions.

**Success Indicators**: 
- Accurate parsing of diverse NPC stat block formats
- Fast conversion with instant feedback
- High usability for both new and experienced GMs
- Support for Castles & Crusades structured templates

**Experience Qualities**: Efficient, Professional, Intuitive

## Project Classification & Approach

**Complexity Level**: Light Application (multiple features with basic state management)

**Primary User Activity**: Creating (transforming detailed stat blocks into condensed formats)

## Thought Process for Feature Selection

**Core Problem Analysis**: Game Masters need quick access to NPC information during sessions but are often overwhelmed by detailed stat blocks that contain more information than needed for real-time reference.

**User Context**: GMs preparing for sessions or actively running games who need to quickly parse and reference NPC information without interrupting game flow.

**Critical Path**: Input stat block → Parse information → Generate condensed summary → Copy for use

**Key Moments**: 
1. Initial stat block input with format recognition
2. Real-time parsing feedback and results display
3. Easy copying and saving of processed NPCs

## Essential Features

### Core Parsing Engine
- **Functionality**: Extracts key NPC data (name, class/level, HP, AC, equipment, etc.) from various stat block formats
- **Purpose**: Handles diverse formatting styles from different RPG sources
- **Success Criteria**: Successfully parses 95%+ of common stat block formats

### Template System
- **Functionality**: Provides structured Castles & Crusades template for proper NPC formatting
- **Purpose**: Guides users toward standardized, parseable formats
- **Success Criteria**: Template generates correctly formatted stat blocks that parse accurately

### Real-time Processing
- **Functionality**: Instant conversion as users type or paste content
- **Purpose**: Immediate feedback prevents formatting errors and reduces workflow friction
- **Success Criteria**: Sub-100ms processing time for typical stat blocks

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

**Technical Constraints**: Browser clipboard API limitations, file size limits for processing

## Implementation Considerations

**Scalability Needs**: Modular parser system to support additional RPG systems
**Testing Focus**: Parser accuracy across diverse stat block formats
**Critical Questions**: What parsing failures are acceptable? How to handle edge cases gracefully?

## Reflection

This approach uniquely combines real-time processing with template guidance, addressing both immediate workflow needs and long-term standardization goals. The focus on professional presentation distinguishes it from hobby-level tools while remaining accessible to casual users.

The template system addresses a key gap in existing tools by not just parsing existing content but helping users create properly formatted content from the start.