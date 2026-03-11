---
description: Workflow for generating and validating sets in the current SuniPlayer MVP.
---
1. Read `MVP_SCOPE.md`, `DATA_MODEL.md`, and current set-builder contracts.
2. Use current store inputs (`targetMin`, `venue`, `curve`, BPM filters if present).
3. Execute `setBuilderService.ts` against the current `Track` contract using `duration_ms`.
4. Tester validates tolerance, ordering behavior, and no-duplicate guarantees.
5. Documenter updates docs if generation rules or data contracts changed.
