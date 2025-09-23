/* prd.md */# NPC Stat Block Parser with Validation System - Product Requirements Document

## Core Purpose & Success

**Mission Statement**: Provide a comprehensive tool for converting tabletop RPG NPC stat blocks into proper Castles & Crusades narrative format while ensuring full compliance with modern C&C design conventions through intelligent validation and scoring.

**Success Indicators**: 
- Users can confidently convert stat blocks knowing they meet C&C standards
- Validation system catches 95% of common formatting and terminology issues
- Batch processing handles multiple NPCs efficiently with individual compliance scoring
- Clear guidance helps users understand and fix C&C convention violations

**Experience Qualities**: Professional, Educational, Reliable

## Project Classification & Approach

**Complexity Level**: Light Application (multiple features with validation state management)

**Primary User Activity**: Acting (converting and validating content with immediate feedback)

## Thought Process for Feature Selection

**Core Problem Analysis**: Converting legacy or inconsistent RPG stat blocks to modern C&C standards requires both format conversion and compliance validation, as users often don't know about updated terminology and conventions.

**User Context**: Game masters and publishers need to ensure their NPCs follow current C&C design principles, especially when converting older materials or working with mixed-format sources.

**Critical Path**: Input → Parse → Convert → Validate → Display Results with Warnings → Export/Save

**Key Moments**: 
1. Real-time validation feedback during input
2. Clear compliance scoring that motivates improvement
3. Actionable suggestions for fixing issues

## Essential Features

### Core Conversion Engine
- **Functionality**: Converts various stat block formats to C&C narrative style
- **Purpose**: Ensures consistent output matching Victor Oldham reference format
- **Success Criteria**: Produces properly formatted narrative text with correct terminology

### Comprehensive Validation System  
- **Functionality**: 14-point validation checklist covering all C&C conventions
- **Purpose**: Educates users about current standards while ensuring compliance
- **Success Criteria**: Identifies issues with 95% accuracy and provides actionable guidance

### Batch Processing with Individual Scoring
- **Functionality**: Processes multiple NPCs simultaneously with per-NPC validation
- **Purpose**: Enables efficient conversion of large stat block collections
- **Success Criteria**: Handles 10+ NPCs with individual compliance reports

### Interactive Validation Display
- **Functionality**: Collapsible validation panels with color-coded warnings
- **Purpose**: Makes compliance issues discoverable without overwhelming the interface
- **Success Criteria**: Users can quickly identify and understand issues

### Template System
- **Functionality**: Provides correct examples and common problematic examples
- **Purpose**: Teaches proper formatting while demonstrating validation capabilities
- **Success Criteria**: Users learn C&C conventions through example interaction

## Design Direction

### Visual Tone & Identity
**Emotional Response**: Professional confidence with educational clarity
**Design Personality**: Scholarly and systematic, like a reference manual come to life
**Visual Metaphors**: Academic validation, publishing standards, editorial review process
**Simplicity Spectrum**: Rich interface that progressively reveals complexity

### Color Strategy
**Color Scheme Type**: Professional palette with semantic validation colors
**Primary Color**: Deep blue (#3b4f8a) - conveys expertise and reliability
**Secondary Colors**: Slate grays for content areas
**Accent Color**: Bright cyan (#22d3ee) for highlights and interactive elements
**Validation Colors**: 
- Red (#ef4444) for errors requiring immediate attention
- Yellow (#eab308) for warnings that should be addressed
- Blue (#3b82f6) for informational suggestions
- Green (#22c55e) for compliance success

### Typography System
**Font Pairing Strategy**: Inter for interface clarity, JetBrains Mono for stat block content
**Typographic Hierarchy**: Clear distinction between input, output, and validation content
**Which fonts**: Inter (sans-serif) and JetBrains Mono (monospace)
**Legibility Check**: Both fonts optimize for extended reading and code/stat block display

### UI Elements & Component Selection
**Component Usage**: 
- Cards for major content sections (input, output, validation)
- Collapsible panels for validation details
- Badges for compliance scoring and issue counts
- Alerts for different validation warning types
- Buttons with clear action hierarchy

**Component Customization**: 
- Validation badges use semantic colors
- Collapsible triggers show compliance scores prominently
- Input areas use monospace fonts for accurate stat block display

### Animations
**Purposeful Meaning**: Smooth collapsible transitions guide attention to validation details
**Hierarchy of Movement**: Validation panels expand to reveal issues without jarring transitions

### Accessibility & Readability
**Contrast Goal**: WCAG AA compliance maintained across all validation color combinations
- Error red on light backgrounds: 4.5:1 ratio
- Warning yellow with dark text: 4.5:1 ratio  
- Success green with sufficient contrast: 4.5:1 ratio

## Implementation Considerations

### Validation System Architecture
- Modular validation functions for each C&C convention
- Weighted scoring system (errors count more than warnings)
- Extensible design for adding new validation rules

### Batch Processing Performance
- Efficient parsing to handle large inputs
- Individual validation tracking per NPC
- Progressive display of results

### Educational Value
- Clear categorization of validation warnings
- Specific suggestions for fixing each issue type
- Examples demonstrating both correct and problematic formats

## Edge Cases & Problem Scenarios

**Potential Obstacles**: 
- Malformed input that breaks parsing
- Legacy stat blocks with obsolete terminology
- Edge cases in validation logic

**Edge Case Handling**:
- Graceful degradation when parsing fails
- Fuzzy matching for variant terminology
- Fallback suggestions when exact rules don't apply

**Testing Focus**:
- Validation accuracy across diverse stat block formats
- Performance with large batch inputs
- User comprehension of validation feedback

## Reflection

This approach uniquely combines format conversion with educational validation, turning a simple parsing tool into a comprehensive C&C compliance system. The validation scoring gamifies adherence to standards while the detailed warnings provide learning opportunities. This creates lasting value beyond just format conversion - users internalize proper C&C conventions through repeated use.