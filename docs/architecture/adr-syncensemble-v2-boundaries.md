# ADR: SyncEnsemble v2 collaborative boundaries

## Status
Accepted for `syncensemble-v2-collab-foundation`

## Context
`SyncEnsemble_AI_Dev_Kit_v2.md` introduces a collaborative foundation that depends on web-specific concerns:
- Firebase / Firestore realtime subscriptions
- feature-gated collaboration rollout
- marker repositories, hooks, and adapters
- progressive integration with the current React marker UI

The existing codebase already has a platform-agnostic `packages/core` package that must remain reusable outside the web app. Mixing Firebase or web UI state into `packages/core` would make the boundary muddy and increase migration risk.

## Decision
For this phase:

1. **`apps/web` owns all collaboration implementation details**
   - Firestore repositories
   - `onSnapshot` subscriptions
   - feature flags
   - collaborative marker hooks
   - adapters/mappers used by the web UI
   - future score collaboration UI entry points

2. **`packages/core` remains platform-agnostic**
   - no Firebase imports
   - no Firestore queries
   - no React hooks or web-only UI logic
   - only legacy compatibility contracts stay shared when strictly needed

3. **Collaborative rollout stays behind flags**
   - `collabMarkers` gates the new marker path
   - `scoreAnnotations` stays OFF in this phase

4. **Legacy compatibility is mandatory**
   - `TrackMarker` remains supported
   - migration happens through adapters, not a flag-day rewrite

## Consequences
### Positive
- reduces regression risk in the current player flow
- keeps repository and persistence details out of presentational components
- preserves `packages/core` reuse across platforms
- allows incremental rollout of collaborative markers before heavier score work

### Negative
- temporary duplication exists between legacy and v2 marker contracts
- adapter maintenance is required until the collaborative path becomes the default
- `MarkerLayer` integration must stay disciplined to avoid leaking repository logic into UI

## Deferred work
Explicitly out of scope for this ADR phase:
- score annotations rendering
- score CRDT sync (`Yjs` / `y-fire`)
- awareness / cursor presence
- replacing the full marker UI in one shot

## Guardrails
- use `onSnapshot` for realtime marker reads
- use soft delete only for collaborative marker removal
- keep pure filters/sorting as standalone helpers
- integrate `MarkerLayer` progressively without rewriting the legacy path
