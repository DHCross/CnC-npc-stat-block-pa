# NotebookLM upload helpers

This folder contains scripts to prepare the repository for NotebookLM ingestion.

## Files
- `generate_code_markdown.py` — Extracts selected code files into Markdown chunks and zips them.
- `pyragify_config_cncdocs.yaml` — Settings for pyragify for the `CnC Docs` folder.
- `generate-notebooklm.sh` — Wrapper that runs pyragify for the docs set and zips them.

## How to use
- Generate `CnC Docs` Markdown with `pyragify`:
```
./scripts/generate-notebooklm.sh
```
- Generate code Markdown for the repo (defaults to `src`, `scripts`, `test`, `data`):
```
python3 scripts/generate_code_markdown.py --outdir tmp/code_markdown --max-words 3000
```

The example `3000` word chunk should be adjusted to your taste; NotebookLM supports large inputs, but chunking into 1500–3000 word files conservatively improves retrieval.

## Notes
- NotebookLM prefers Markdown and plain text over PDF.
- Use per-repo or per-subset configs if your repository is large.
 - Upload a `system-profiles/<SystemName>` directory when you want NotebookLM to learn a new system. Include `profile.yaml`, `adapter.py`, and examples.
 - NotebookLM Workflows should use two notebooks: Template-only (this repo + guide) and Target-only (the SRD or other game docs + the guide). See `docs/SystemAdaptationGuide.md` for more detail on why we separate them.
 - Use `docs/templates/` (Tier 1) as the architecture-only skeleton the model should learn. Then upload the target system docs in a separate Notebook and ask NotebookLM to map the skeleton to the target system.
 - The code skeleton can be created with `./scripts/generate-notebooklm.sh --skeleton` — this will copy the minimal framework into `tmp/skeleton_only.zip` and exclude C&C-specific signal rules.
 - See `docs/notebooklm-workflow.md` for an end-to-end tutorial and best-practices for Template vs Target notebooks.
 - The meta-document you want to add is `docs/SystemAdaptationGuide.md` — it explains which parts of this codebase are universal vs system-specific.
 - Use the following prompt templates with NotebookLM to extract conversions and generator rules.

## NotebookLM prompt templates

1) Ask NotebookLM to summarize the mapping rules in plain language:
```
Read the repository and `system-profiles/GenericGame/profile.yaml` and `adapter.py`. Summarize the mapping rules and how hp, AC, and ability stats are extracted and normalized. Provide a list of recommended improvements and missing edge cases and also include example input and expected canonical output.
```

2) Ask NotebookLM to propose an adapter code implementation based on existing canonicalization functions in `src/lib`:
```
You will be given repository files. Extract code patterns for parsing 'AC' and 'HP' in the repo and propose a Python function `to_canonical(input_block)` that maps fields for the 'GenericGame' system to our canonical fields. Focus on 'hp', 'ac', 'saves', and attacks. Provide tests.
```

3) Extract test cases:
```
Given the files in the repo, produce a list of realistic unit test inputs for the 'GenericGame' system to validate the adapter. Provide expected outputs for each test case.
```

4) Create an audit checklist for migration:
```
When migrating a new system to our canonical format, list by priority the manual checks required after NotebookLM's suggestions (e.g. verify conversions of unusual damage formulas, ensure AC variations are mapped correctly, confirm magic-item stat blocks are preserved.)
```
