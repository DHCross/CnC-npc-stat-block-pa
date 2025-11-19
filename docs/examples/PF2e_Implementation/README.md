# PF2e Implementation (TIER 2 placeholder)

This folder is an example of a Pathfinder 2e implementation built on top of the Tier 1 architecture.

Contents:
- `classification-rules.ts` — Example PF2e classifier scaffold (Tier 2 example). This example shows how to map PF2e fields to the skeleton canonical types and includes a small test harness.
- `README.md` — This file.

How to run the PF2e test harness:

1) Install ts-node and TypeScript if you don't already have them:

```bash
npm install -g ts-node typescript
```

2) Run the PF2e classifier sample test harness:

```bash
npx ts-node docs/examples/PF2e_Implementation/classification-rules.ts
```

This will parse `system-profiles/Pathfinder2/sample_stat_blocks.md` and print the resulting classification and extracted numeric fields for each sample block.

This example is a Tier 2 scaffold (PF2e) only and is not included in the Tier 1 skeleton.
