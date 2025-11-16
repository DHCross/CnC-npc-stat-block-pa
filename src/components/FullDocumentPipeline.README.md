# FullDocumentPipeline component

Purpose
- The `FullDocumentPipeline` React component provides an "offshoot" UI used to analyze an entire markdown or DOCX bestiary document.
- It's used for isolated, visual verification in Storybook (not integrated into the main `App` by default). The component extracts individual creature entries, canonicalizes each using the parser pipeline, and returns a `DocumentAnalysisResult` that includes validation and summary statistics.

Key props
- `initialAnalysis?: DocumentAnalysisResult | null` — Provide pre-computed analysis to pre-populate the right-pane results (useful for Storybook mocks).
- `isProcessing?: boolean` — Controls the "Processing..." state for large documents.
- `initialLeftCollapsed?: boolean` — Start the UI with the left input pane collapsed (handy for UX tests in Storybook).

Important behaviors
- Uses `analyzeFullDocument(documentText, documentName)` to produce a `DocumentAnalysisResult` composed of parsed creatures and validation.
- Supports file uploads for `.md`, `.txt`, and `.docx` (via `mammoth`) — the DOCX upload converts to Markdown and re-parses.
- Shows a preview of each parsed creature with a canonicalized Markdown converted to HTML via `convertToHtml`.
- Export support: Markdown, CSV, JSON, HTML. Exports include parsed creatures + validation and metadata.
- Copy to clipboard and per-creature Copy/Mass Export buttons included.
- Storybook-ready: `src/components/FullDocumentPipeline.stories.tsx` includes realistic `mouths-of-madness` sample data for tests and manual inspection.

Visual verification checklist
- Ember Raventree (named classed NPC): confirm the canonical preview contains the long-form PHB attributes expanded (strength, dexterity, constitution, intelligence, wisdom, charisma).
- Hub-Gub / Kings: ensure HD-based HP estimation for named rulers and that ordinals are normalized from updated Rule-of-Rank.
- Magic item / Spells: confirm canonical mapping — *Dimensional Leap* → *Dimension Door* and *Teleportation* → *Teleport*.
- Equipment grammar: check equipment list for shield normalization (e.g., "medium steel shield") and that verbs and plural nouns are corrected.
- Parenthetical selection: when title contains a short parenthetical and a later parenthetical contains stats, ensure stats parenthetical is chosen and used for canonicalization.

Unit tests
- There is a `src/test/full-document-pipeline-ui.test.tsx` UI test that validates collapse toggle and ensures the realistic mocked analysis renders the expected results.

Limitations & next steps
- This component is intended for isolated Storybook verification and should not be directly integrated into `App.tsx` without considering UI duplication. If you decide to integrate, use `initialAnalysis` to avoid reprocessing during load.
- Consider adding more Storybook scenarios for failed parsing, large documents, and mixed locale formats.

Author note
- For the Canonicalizer fixes, keep the `Rule-of-Rank` heuristics and parenthetical selection rules updated in `src/lib/enhanced-parser.ts` & `src/lib/npc-parser.ts` if additional edge cases are found during visual verification.