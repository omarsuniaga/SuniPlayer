# Rollout safety — SyncEnsemble v2 collaborative markers

## Status
Conditionally ready for verify.

This slice is functionally implemented, but rollout safety depends on acknowledging one explicit limitation in the current test runtime.

## What is included
- feature-gated collaborative marker path
- v2 marker contracts and legacy adapter
- Firestore mapper and repository
- `useMarkers` with optimistic reconciliation
- `MarkerEditor`
- progressive `MarkerLayer` integration behind `collabMarkers`

## What is not included
- score annotations
- score CRDT
- awareness / cursors
- `MarkerChip` visual enhancement

## Current verification snapshot

### Targeted collaborative suite
- Command executed:
```bash
pnpm --filter @suniplayer/web exec vitest run \
  src/features/collaboration/markers/components/MarkerEditor.test.tsx \
  src/components/common/MarkerLayer.collaborativeLogic.test.ts \
  src/components/common/MarkerLayer.featureFlag.test.tsx \
  src/features/collaboration/markers/hooks/useMarkers.test.ts \
  src/features/collaboration/markers/data/markerRepository.test.ts \
  src/features/collaboration/markers/data/markerFirestoreMapper.test.ts \
  src/features/collaboration/markers/adapters/trackMarkerAdapter.test.ts \
  src/features/collaboration/markers/utils/markerFilters.test.ts \
  src/features/collaboration/markers/utils/markerSorting.test.ts \
  src/config/featureFlags.test.ts
```
- Result:
  - `10` test files
  - `27` tests
  - `27` passing

### Typecheck snapshot
- Command executed:
```bash
pnpm --filter @suniplayer/web exec tsc --noEmit --pretty false
```
- Result:
  - still failing on pre-existing unrelated files outside this slice
  - no new typecheck failures were introduced in the collaborative marker files for this phase

## Verification criteria

### 1. Legacy path remains default
Expected:
- `collabMarkers=false` keeps the current marker flow untouched

Evidence:
- `src/config/featureFlags.test.ts`
- `src/components/common/MarkerLayer.featureFlag.test.tsx`

### 2. Data boundary is isolated
Expected:
- UI does not depend on raw Firestore document shapes
- mapper/repository own timestamp and soft-delete normalization

Evidence:
- `src/features/collaboration/markers/data/markerFirestoreMapper.test.ts`
- `src/features/collaboration/markers/data/markerRepository.test.ts`

### 3. Optimistic UI does not duplicate active markers
Expected:
- create/update/delete reconciles against snapshots without duplicate active markers

Evidence:
- `src/features/collaboration/markers/hooks/useMarkers.test.ts`

### 4. Legacy compatibility remains deterministic
Expected:
- legacy `TrackMarker` consumers keep working through stable defaults/adapters

Evidence:
- `src/features/collaboration/markers/adapters/trackMarkerAdapter.test.ts`

### 5. Marker helpers stay deterministic
Expected:
- filtering, visibility, and sorting rules are pure and stable

Evidence:
- `src/features/collaboration/markers/utils/markerFilters.test.ts`
- `src/features/collaboration/markers/utils/markerSorting.test.ts`

### 6. UI logic is validated honestly
Expected:
- collaborative UI logic is covered without overstating what the runtime can prove today

Current state:
- helper/controller logic coverage exists for `MarkerEditor` and `MarkerLayer`
- full RTL/jsdom render coverage is still constrained by the workspace React runtime

Evidence:
- `src/features/collaboration/markers/components/MarkerEditor.test.tsx`
- `src/components/common/MarkerLayer.collaborativeLogic.test.ts`

## Known blocker

### React component render runtime
The current workspace can throw `Invalid hook call` for hook-based component render tests in RTL/jsdom.

Implication:
- the slice has strong logic coverage
- but not the ideal full component render coverage for `MarkerEditor` / `MarkerLayer`

Decision for this phase:
- do **not** fake component coverage
- accept helper/controller coverage as the current mitigation
- keep the runtime issue visible for a later testing-infrastructure fix

## Recommended enablement policy

Use `collabMarkers` only for:
- local development
- explicit collaboration testing
- controlled rollout review

Do not treat it as general availability yet.

## Targeted verification commands

### Collaborative marker suite
```bash
pnpm --filter @suniplayer/web exec vitest run \
  src/features/collaboration/markers/components/MarkerEditor.test.tsx \
  src/components/common/MarkerLayer.collaborativeLogic.test.ts \
  src/components/common/MarkerLayer.featureFlag.test.tsx \
  src/features/collaboration/markers/hooks/useMarkers.test.ts \
  src/features/collaboration/markers/data/markerRepository.test.ts \
  src/features/collaboration/markers/data/markerFirestoreMapper.test.ts \
  src/features/collaboration/markers/adapters/trackMarkerAdapter.test.ts \
  src/features/collaboration/markers/utils/markerFilters.test.ts \
  src/features/collaboration/markers/utils/markerSorting.test.ts \
  src/config/featureFlags.test.ts
```

Expected outcome:
- targeted collaborative suite passes

### Typecheck note
```bash
pnpm --filter @suniplayer/web exec tsc --noEmit --pretty false
```

Current expectation:
- may fail on unrelated pre-existing files outside this slice
- should not report new typecheck errors in the collaborative marker files introduced by this change

## Verify readiness statement

This slice is **ready for SDD verify with an explicit testing-runtime caveat**:
- implementation complete for the collaborative marker foundation
- rollout remains feature-gated
- known test-runtime blocker is documented instead of hidden
