# GitHub Copilot Instructions for CnC NPC Stat Block Parser

## Project Overview
This is a Next.js 15/React 19 web application for parsing and validating Castles & Crusades NPC and monster stat blocks. It includes flexible parsing, comprehensive validation, document analysis, and export capabilities.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **UI Library**: Radix UI primitives
- **Testing**: Vitest with React Testing Library
- **Build Tool**: Next.js built-in webpack/turbopack

## Key Directories
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components (UI, parsers, converters)
- `src/lib/` - Core libraries and utilities (parsers, validators, exporters)
- `data/` - Canonical datasets and dictionaries
- `scripts/` - Build and data processing scripts
- `test/` - Test files and fixtures
- `docs/` - Project documentation and guides

## Core Features
1. **NPC/Monster Parser** (`src/lib/npc-parser.ts`)
   - Accepts both strict and prose formats
   - Auto-correction and validation
   - Dictionary-based canonicalization

2. **Spell Converter** (`src/components/SpellConverter.tsx`)
   - Converts legacy spell format to PHB Continuous Prose
   - Batch processing support
   - 618 canonical spell names

3. **Document Analysis**
   - DOCX/PDF support via mammoth and pdfjs-dist
   - HTML export for Word/Docs integration

4. **Template Generation**
   - Stat block templates
   - Export to multiple formats

## Development Workflow
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev` or `npm run dev:web`
3. Run tests: `npm run test`
4. Lint: `npm run lint`
5. Build: `npm run build`

## Testing
- Unit tests with Vitest: `npm run test`
- Test files follow naming pattern: `*.test.ts` or `*.test.tsx`
- Mock fixtures in `src/components/mocks/`

## Data Pipeline
- Canonical datasets live in `data/`
- Scripts in `scripts/` for data processing and canonicalization
- Run full pipeline with `npm run regen:mouths`

## TRPG Workbench Editor (Electron Desktop App)
The TRPG Workbench Editor provides a desktop Electron app for markdown editing, stat block analysis, and document processing.

**Location**: `/Users/dancross/Documents/GitHub/TRPG Workbench Editor/electron`

**Launch commands**:
```sh
# Launch the TRPG Workbench Editor Electron app
cd "/Users/dancross/Documents/GitHub/TRPG Workbench Editor/electron"
npm start
# or: npm run dev
```

**Features**:
- Markdown editor with live preview
- Stat block navigator and validation
- Table conversion tools (TSV/CSV/Markdown)
- Reforged name conversion
- Document comparison and pipeline tools

**Integration**:
- Can work alongside the CnC web app
- Use `npm run dev:web` in the CnC repo to run the web app simultaneously
- The TRPG app includes CnC-specific stat block parsing tools

## Code Style Guidelines
- Use TypeScript strict mode
- Follow existing component patterns in `src/components/`
- Use shadcn/ui components for UI consistency
- Implement proper error boundaries with `react-error-boundary`
- Use Zod for validation schemas
- Prefer ES modules over CommonJS

## Common Patterns
- API routes in `src/app/api/`
- Server actions in component files
- Data fetching with `@tanstack/react-query`
- Form handling with `react-hook-form`
- Modals/Dialogs with Radix UI via shadcn/ui

## When Adding New Features
1. Check if similar functionality exists in `src/lib/`
2. Use existing component patterns from `src/components/`
3. Add appropriate tests
4. Update documentation if needed
5. Follow the established TypeScript patterns

## Performance Considerations
- Use React.memo for expensive components
- Implement proper loading states
- Optimize re-renders with useCallback/useMemo
- Lazy load heavy components when appropriate

## Security Notes
- Never expose API keys in client code
- Validate all user inputs with Zod schemas
- Use React's built-in XSS protection
- Sanitize markdown content properly

## Useful Commands
- `npm run storybook` - Component development
- `npm run analyze:bestiary` - Data analysis
- `npm run generate:mocks` - Generate test data
- `npm run build` - Production build
