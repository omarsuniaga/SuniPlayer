---
description: Build-validation loop for the current SuniPlayer repo.
---
1. Confirm current source of truth in `AGENTS.md`.
2. Builder applies the smallest required code change.
3. Tester runs `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
4. If any check fails, Debugger uses `systematic-debugging` before changing code.
5. Reviewer verifies that the result matches requirements and did not drift from docs.
6. Documenter updates `DECISIONS.md` or related docs if validation changed repo behavior or expectations.
