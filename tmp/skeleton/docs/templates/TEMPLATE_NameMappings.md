# TEMPLATE: Name mappings (System-specific)

This file explains how to create a name-mappings file for your target system.

Purpose:
- C&C uses `src/lib/name-mappings.ts` to map in-text names (character names, locations, items) to canonical references for classification and linking.
- For Template skeleton exports, do *not* ship C&C-specific mappings. Instead, add a system-specific mapping guide and example in this template.

Content suggestions:
- Describe the structure: key -> canonical ID, metadata fields (type, aliases, notes)
- Provide an example mapping for a canonical creature in the target system (PF2e example if appropriate)
- Add instructions to store mappings under `system-profiles/<System>/name-mappings.yml` or a similar place

Example YAML snippet:

```yaml
- id: goblin_standard
  type: creature
  aliases:
    - "Goblin"
    - "goblin"
  notes: "Use system canonical name: Goblin (CR 1/3)
```

This template is intentionally non-C&C. Concrete mappings belong in a system implementation repository or the Tier 2 example in `docs/examples`.
