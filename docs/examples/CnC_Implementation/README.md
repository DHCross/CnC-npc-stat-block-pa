# CnC Implementation (Tier 2)

This folder documents which files in `CnC-npc-stat-block-pa` serve as the C&C implementation of the templates in `docs/templates/`.

- `docs/templates/TEMPLATE_StatBlockParser.py` → `src/lib/npc-parser.ts` (converted to TypeScript & adapted to C&C format)
- `docs/templates/TEMPLATE_ModuleValidator.py` → `src/lib/validators.ts` (module validation rules)
- `docs/templates/TEMPLATE_SchemaDefinition.json` → `data/hd-canonical.json` (canonical schema filled in for C&C)

Use this folder as a reference to see how the templates were concretely implemented for C&C.
