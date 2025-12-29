# Template: Stat Block Parsing & Validation

This directory provides TIER 1 template files that are intentionally generic.
They are meant to teach architecture, not a specific game system.

How to use templates:
1. Copy `TEMPLATE_StatBlockParser.py` to `system-profiles/<SystemName>/parser.py` and replace placeholders:
   - `{SYSTEM_NAME}`, `{DIFFICULTY_METRIC}`, `{STAT_FORMAT}`
   - Replace regex patterns with actual system-specific patterns
2. Copy `TEMPLATE_ModuleValidator.py` to `system-profiles/<SystemName>/validator.py` and adjust schema
3. Copy `TEMPLATE_SchemaDefinition.json` to `system-profiles/<SystemName>/schema.json` and update property names

Design principles:
- Keep templates free from domain-specific language
- Use small, well-documented placeholders
- Keep all system-specific detail inside the `system-profiles/<SystemName>` adapter

Notes:
- The `SystemAdaptationGuide.md` references these templates for NotebookLM prompts.
- The `docs/examples/` folder contains a fully-implemented example (Tier 2) showing how the C&C code fills the templates.
