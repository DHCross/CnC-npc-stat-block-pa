# NotebookLM Workflow — Template vs Target

This tutorial walks through the best practice for using NotebookLM to adapt the architecture of this project to other systems.

## Why tiered notebooks matter
- Notebook 1 (Template-only) contains only the skeleton, frameworks, and metadata for the system architecture — this prevents NotebookLM from copying system content.
- Notebook 2 (Target-only) contains only the target system content (SRD or rules) and the meta-doc so NotebookLM maps the template to the target.

## How to prepare the Template-only notebook
1. Run:

```bash
./scripts/generate-notebooklm.sh --templates
```

2. This will produce `tmp/templates_only.zip` containing `docs/templates` and reference `docs/examples`.
3. Upload `tmp/templates_only.zip` to NotebookLM: call it Notebook: "Template - CnC Workbench".
4. Use `tmp/notebooklm_template.ipynb` or prompts in `README-notebooklm.md` to ask NotebookLM to analyze architectural patterns.

## How to prepare the Target-only notebook
1. Create a repo or folder that contains the target system SRD and example stat blocks (e.g., `pathfinder2e-srd/`).
2. Upload `pathfinder2e-srd` to its own NotebookLM notebook along with `docs/SystemAdaptationGuide.md` and `docs/templates` (optional).
3. Use `tmp/notebooklm_targetsystem.ipynb` prompts; NotebookLM will use the template to map the new system's stat block formats.

## Creating a SKELETON export for integration
- Use the `--skeleton` flag to create a minimal `tmp/skeleton_only.zip` that contains: core scanning logic, pipeline engine, and docs templates — but excludes C&C rule trees (e.g., `classification-rules.ts`, `enhanced-parser.ts`).

```bash
./scripts/generate-notebooklm.sh --skeleton
```

This should be uploaded to NotebookLM as the "skeleton" source if you want a pure framework that third parties can use without seeing C&C signals.

## Final notes
- When using NotebookLM, always separate the architecture (template) from domain rule sets.
- Use `scripts/generate-notebooklm.sh --templates` to create a template-only bundle and `--skeleton` to produce a code skeleton without system-specific rules.
- The goal is for NotebookLM to learn the architecture and suggest how to adapt it, not to copy C&C's mechanics.
