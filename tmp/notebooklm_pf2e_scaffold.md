# NotebookLM: PF2e scaffold prompt (Markdown)

Goal: Teach NotebookLM the architecture from the Tier 1 skeleton and have it produce PF2e-specific `classification-rules.ts` and tests.

### Template Files (Tier 1)
Upload this content from `tmp/skeleton_only.md` (the Tier 1 architecture). *NotebookLM accepts Markdown; upload the combined skeleton content there.*

### Target Input (Tier 2)
Upload `system-profiles/Pathfinder2/sample_stat_blocks.md` to the target Notebook.

---

## Step 1 — Read the architecture (Template Notebook)
Please review the uploaded skeleton to learn the architecture and responsibilities:

- `document-analyzer.ts` — high-level document scanning
- `full-document-pipeline.ts` — pipeline orchestration
- `stat-block-types.ts` — canonical types for output
- `stat-block-helpers.ts` — shared normalization
- `utils.ts` — general helpers

Then summarize what 'classification', 'canonicalization', and 'pipeline orchestration' responsibilities each file provides.

---

## Step 2 — Read PF2e sample inputs (Target)
From the uploaded PF2e sample `system-profiles/Pathfinder2/sample_stat_blocks.md`, identify:
- how PF2e uses `Level` and `HP`
- how PF2e expresses abilities (STR 18 (+4))
- traits (Classed, Leader, Trap) and how they map to `monster|npc|hazard`

List three rules you would implement in a PF2e `classification-rules.ts` to separate NPCs from monsters.

---

## Step 3 — Generate `classification-rules.ts` scaffold
Create a TypeScript `classification-rules.ts` that:
- Exports `classifyEntityPF2e(creatureName, canonicalData, traits)` returning `{ kind, rank, system, confidence, rationale }`
- Exports `extractPF2eStatNumbers(textBlock: string)` to capture `hp`, `ac`, `level`, `saves`, `abilities` and `skill_dcs`
- Exports `mapTraitsToSystemTypes(traits)` to map PF2e traits -> canonical system types.

Add comments explaining each rule (NotebookLM will use these to learn how to port the rules to other systems).

---

## Step 4 — Validation harness
Provide a small Node-style test harness (Vitest or Jest pseudo-code) that runs the classifier on the PF2e samples and asserts expected outputs:
- `Goblin Warrior`: monster with `hp=20` and `ac=16`
- `Captain Elara`: npc with `level=8` and classification via `Classed`/`Leader` trait
- `Pit Trap`: hazard with `DCs` and `Hardness/HP`

Also show how to wire the PF2e classifier into `full-document-pipeline.ts` by providing 1-2 sample calls.

---

## Step 5 — Evaluation
After NotebookLM produces `classification-rules.ts`, verify:
- No reference to `classification-rules.ts` or `enhanced-parser.ts` from C&C.
- Uses `stat-block-types.ts` canonical types.
- Unit tests pass for the PF2e sample input.

---

Notes & tips:
- NotebookLM does not accept zip or ipynb but does accept Markdown. Use the `tmp/skeleton_only.md` file to provide the Tier 1 architecture and `system-profiles/Pathfinder2/sample_stat_blocks.md` for target data.
- If the skeleton is large, run `scripts/generate_code_markdown.py` and upload the resulting Markdown chunks (they will be in `tmp/code_markdown/`).

