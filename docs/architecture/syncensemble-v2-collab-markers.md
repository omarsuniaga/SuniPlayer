# SyncEnsemble v2 collaborative markers

## Purpose
Document how the collaborative marker slice is enabled, where its boundaries live, and what remains explicitly deferred in `syncensemble-v2-collab-foundation`.

## Feature flag

### `collabMarkers`
- Source: `apps/web/src/config/featureFlags.ts`
- Default: `false`
- Scope: enables the collaborative marker data path in `apps/web`

When `collabMarkers` is **OFF**:
- `MarkerLayer` stays on the legacy `TrackMarker[]` path
- existing click/seek behavior remains the default
- no collaborative repository subscription is required

When `collabMarkers` is **ON**:
- `MarkerLayer` can consume collaborative marker data through `useMarkers`
- `MarkerEditor` is used for collaborative edit flows
- the collaborative repository boundary stays inside `apps/web`

## Required boundary

Collaborative markers are a **web concern** in this phase.

Owned by `apps/web`:
- feature flags
- marker adapters
- Firestore mapper/repository
- `useMarkers`
- `MarkerEditor`
- `MarkerLayer` collaborative wiring

Forbidden in `packages/core` for this slice:
- Firebase imports
- Firestore queries / `onSnapshot`
- React hooks or web-only repository logic

See also:
- `docs/architecture/adr-syncensemble-v2-boundaries.md`

## Integration contract

`MarkerLayer` only enters the collaborative path when **both** conditions are true:
1. `collabMarkers === true`
2. `collaborativeOptions` is provided

This keeps the rollout safe:
- flag OFF -> legacy path
- flag ON but missing collaborative options -> no accidental partial wiring

## Deferred scope

The following remain explicitly out of scope for this slice:
- score annotations rendering
- score CRDT sync
- `react-pdf`
- awareness / cursor presence
- wide rollout of `scoreAnnotations`

## Testing note

The current workspace has a real limitation for full React render tests on hook-based components:
- `Invalid hook call` can appear in RTL/jsdom component renders
- because of that, this slice currently relies on:
  - unit tests for adapters, helpers, mapper, repository, hook/controller logic
  - helper-based logic tests for `MarkerEditor` and `MarkerLayer`

That is a **known limitation**, not hidden coverage.

## Rollout guidance

- Keep `collabMarkers` OFF by default until rollout-safety checks are reviewed
- Treat collaborative markers as opt-in for development/testing
- Do not assume score collaboration is included just because marker collaboration exists
