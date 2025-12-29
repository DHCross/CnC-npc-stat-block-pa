NotebookLM Addendum: `spell_context` and `origin_context`
-------------------------------------------------------

Purpose
- This addendum contains recommended copy and examples that may be inserted into `docs/SystemAdaptationGuide.md` to enforce the two-channel policy and the use of `spell_context` metadata.

Recommended text (insert into SystemAdaptationGuide)

"When preparing artifacts for NotebookLM or other model ingestion, the pipeline must clearly annotate any referenced game mechanics (spells, magic items, feats) using metadata fields. In particular, parsed NPC spell lists must be annotated with `spell_context: 'reference'` to indicate these are compact canonical references and must not be expanded into full descriptive prose by downstream conversion processes. Separately-converted descriptive spell writeups (PHB-style prose) must include `spell_context: 'descriptive'` and `origin_context` indicating the authoritative source. This separation prevents contamination of template-level training data with full-text copyrighted or system-specific prose."

Example JSON fragment

```json
{
  "name": "Goblin Shaman",
  "spells": [
    {"name": "Detect Magic", "spell_context": "reference"},
    {"name": "Heal Light Wounds", "spell_context": "reference"}
  ],
  "origin_context": "pf2e-reference"
}
```

Enforcement
- Add unit tests that assert parsed NPC/monster `spells` entries are labeled `spell_context: 'reference'` and CI jobs that run those tests on PRs.
