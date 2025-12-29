NotebookLM Workflow & Tier-1 Guidance
===================================

Summary
- Purpose: Prepare a minimal, safe, and reusable NotebookLM artifact (Tier-1 skeleton) for downstream AI workflows without leaking system-specific canonical data.

Principles
- Tier separation: Keep Tier-1 skeletons free of C&C-specific canonical mappings. Supply only templates, extraction examples, and small mapping hints — not exhaustive mappings or canonical name lists.
- Two-channel policy: Distinguish Reference Channel (compact canonical references for stat blocks, NPC spell lists, item shorthand) from Descriptive Channel (full spell/item writeups converted from system sourcebooks). Always treat NPC-listed spells as "reference" and do not expand them into full descriptive text during parsing.
- Explicit metadata: Add `spell_context` and `origin_context` fields to parsed outputs to indicate whether a spell or item is a referenced canonical name ("reference") or a converted prose writeup ("descriptive").

Minimal example (for NotebookLM ingestion)

```yaml
# Example bundle manifest object (illustrative)
manifest:
  name: "cnc-tier1-skeleton"
  schema_version: 1
  templates:
    - path: "templates/stat-block-template.md"
  signals:
    - name: "HasSpells"
      description: "Indicates an NPC/stat-block contains a `Spells:` list"

example_parsed_output:
  name: "Goblin Shaman"
  spells:
    - name: "Detect Magic"
      spell_context: "reference"
    - name: "Heal Light Wounds"
      spell_context: "reference"
  origin_context: "pf2e-reference"
```

Quick checklist when preparing uploads
- Remove full canonical lists (e.g., full `spell-names.ts`) from Tier-1 artifacts.
- Include a short example mapping and a human-friendly explanation of how to obtain canonical lists separately.
- Add metadata examples showing `spell_context` and `origin_context` usage.

Policies to follow
- NotebookLM must not receive Tier-1 skeletons that include system canonical mappings and conversion code together. Keep conversion code (descriptive channel) separate and gated.
- Tests and CI should assert that parsed NPC spell lists are marked with `spell_context: 'reference'` by the classification pipeline.

Next steps
- Provide an addendum for `docs/SystemAdaptationGuide.md` recommending insertion of the `spell_context` policy text.
