# Book MD Workbench: Architecture Guide for RPG System Adaptation

## Purpose
This document explains how to use the CnC-npc-stat-block-pa project as a template for building similar tools for other tabletop RPG systems.

**Key idea:** the repo contains a set of reusable architectural patterns (stat-block parsing, module validation, canonicalization schemas) and some system-specific rules (C&C stat block notations). With a clear translation map and example stat blocks in NotebookLM, the model can recommend how to create a new repo for a different game system.

---

## Universal Components (copy these patterns)
These are the systems and patterns you can usually reuse across RPG systems.

- Stat-block regex parsers (in `src/lib`):
  - Pattern: small function reading a block and returning questions/fields like name, HP, AC, saves.
  - Reuse: replace only the regex definitions and small normalization functions for new systems.

- Module structure validators (in `src/lib` and `scripts`):
  - Pattern: a JSON/TS schema that enumerates required sections and canonical fields.
  - Reuse: keep validator logic; swap schema file for new system-specific rules.

- Markdown chunking / NotebookLM prep (scripts):
  - Pattern: `pyragify` and `scripts/generate_code_markdown.py` look at repo contents and emit chunked Markdown.
  - Reuse: same tooling. Runs off `pyragify_config_*` and `scripts/`.

- Metadata extraction & canonicalization:
  - Pattern: parse → classify → canonicalize → output (Reforged canonical JSON).
  - Reuse: canonical JSON structure remains consistent across systems; only mappings change.

---

## System-Specific Components (must be replaced)
When adapting this codebase to a new system, these must be adapted or reimplemented.

- Stat block formats: each system uses different notation, e.g. `CL` vs. `CR`, different hit-die formats.
- Derived fields: e.g., C&C may use a bespoke disposition metric or special runes; those fields should be isolated into system-specific adapters.
- Canonical mapping details: in `system-profiles/<system>/profile.yaml` and `adapter.py` you define how system fields map to canonical fields.

---

## Translation Examples
### C&C → D&D 5e
- `CL` → `CR` (Challenge Rating). Source: map `CL` numeric ranges to `CR` if possible.
- `HD` stays but parsing and rounding rules differ.
- `Saves` → mapping of new system names to the canonical `saves` structure.

### C&C → Pathfinder 2e
- Stat-block structure will likely need a new parser since PF2's stat blocks are tabular.
- `HP` rules differ; some PF2 items include temporary or conditional HP; map these with a robust `transformations` flag.

---

## Adaptation Workflow (suggested)
1. Create `system-profiles/<TargetSystem>` using `scripts/create_system_profile_template.py`.
2. Populate `profile.yaml` with field mapping (system → canonical) and basic flags (parse_hp, parse_ac).
3. Implement `adapter.py` to do transformations and parse edge cases (damage formulas, templates).
4. Use `scripts/generate-notebooklm.sh` to prepare a ZIP containing relevant docs + the adapter.
5. Upload both this repository (`C n C-npc-stat-block-pa`) and the target system docs to NotebookLM.
6. Ask NotebookLM to propose file structure and the function `to_canonical` for your new system.

Note: use the `docs/templates/` files as your starting point (Tier 1). Copy them, then populate `system-profiles/<TargetSystem>` with the `parser.py`, `adapter.py`, and schema files. See `docs/examples/CnC_Implementation` for a full reference (Tier 2).

Use `scripts/generate-notebooklm.sh --skeleton` to produce a code skeleton that excludes C&C-specific signal extraction and classification rules. Upload that skeleton to NotebookLM as the template architecture, not the `CnC` implementation, so the Notebook only learns generic architecture.

---

## What to put into NotebookLM (quality sample data)
- Examples of multiple stat-block variants (weak/standard/boss).
- `profile.yaml` mapping with comments.
- Example canonical outputs so the model can learn expected targets.

---

## NotebookLM Prompt examples for translation
- "Read `SystemAdaptationGuide.md` and the C&C canonicalization code. Using the Book MD Workbench architecture as template, generate a file layout and `to_canonical` plan for [TargetGame]."

- Ask for a small example scaffold:
  - "Create `system-profiles/Pathfinder2/adapter.py` which includes a `parse_hp` function that handles PF2's HP rules and outputs canonical JSON. Include tests."

---

## Important: Use Separate Notebooks for Template vs Target System

Do not upload C&C rules or modules with this repository in the same NotebookLM session where you upload a target system (e.g., Pathfinder 2e). That would mix content with template and may lead NotebookLM to copy or reuse C&C mechanics.

Recommended practice:
- Notebook 1 (Template-only): upload `CnC-npc-stat-block-pa` code + `docs/SystemAdaptationGuide.md` + example prompt notebook. Ask NotebookLM to treat the repo as an architecture template.
- Notebook 2 (Target-only): upload only the target system content (SRD or rules) + `docs/SystemAdaptationGuide.md`. Then ask NotebookLM to adapt the architecture described in guide to the target system. This keeps the pattern recognition pure and avoids accidental blending of system rules.

---

## Notes & tips
- Keep all system-specific transformations in `system-profiles/*` to make the core repo reusable.
- Ensure the `metadata.json` produced by pyragify includes `system-profiles` sample files so NotebookLM can read mapping easily.
- Use `chunk_map.csv` (from `scripts/generate_code_markdown.py --map`) to find mapping between chunk and original file when NotebookLM cites a chunk.

---

If you want, I can draft a small sample NotebookLM conversation script (in `tmp/`) that demonstrates the above step-by-step micro-prompts — it would make it easier to reproduce the process every time you want to adapt the workbench to a new system.
