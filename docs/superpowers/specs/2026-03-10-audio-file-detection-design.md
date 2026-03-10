# Audio File Detection — Design Spec
**Date:** 2026-03-10
**Status:** Approved

## Problem

`isSimulating` is set reactively: only after `play()` fails does the app know it's in simulation mode. The user sees no simulation indicator until they press Play and the error fires. On reload, the banner is gone even if no files exist.

## Goal

Detect simulation mode **proactively** — before the user interacts — so the amber banner is accurate from the moment the app loads.

## Approach: HEAD Probe (Hybrid)

Two-level detection via `fetch` HEAD requests:
1. **Global probe at mount** — determines initial simulation state
2. **Per-track probe on `ci` change** — updates simulation state when the active track changes

No manifest files, no build changes, no Vite plugins. HEAD requests return only status codes (no body download), so overhead is minimal.

## Architecture

### New file: `src/services/audioProbe.ts`

Pure functions, no React dependencies:

```ts
probeOne(filePath: string): Promise<boolean>
// HEAD /audio/<filePath> → true if 200 OK, false otherwise

probeFiles(filePaths: string[]): Promise<Set<string>>
// batch version — returns Set of available file_paths
// (used for future catalog scanning)
```

### Changes: `src/services/useAudio.ts`

**Effect 1 — Global probe (mount only):**
```ts
useEffect(() => {
  probeOne(TRACKS[0].file_path).then(ok => setIsSimulating(!ok));
}, []);
```
Uses `TRACKS[0]` as representative. If the catalog has real files, this one will too.

**Effect 2 — Per-track probe (on `ci` / `ct` change):**
Added inside existing `useEffect([ci, ct?.id])`, before the `canplay` handler:
```ts
if (ct.blob_url) {
  setIsSimulating(false);   // user-imported → always real
} else {
  probeOne(ct.file_path).then(ok => setIsSimulating(!ok));
}
```

**Existing `.catch → setIsSimulating(true)` is kept** as a safety net.

### No changes needed

- `usePlayerStore.ts` — `isSimulating` + `setIsSimulating` already exist
- `Player.tsx` — amber simulation banner already consumes `isSimulating`
- `Builder.tsx`, stores, tests — unaffected

## Data Flow

```
App mount
  └─ probeOne(TRACKS[0].file_path)
       ├─ 200 OK → setIsSimulating(false)  → no banner
       └─ 404    → setIsSimulating(true)   → amber banner shown immediately

User loads set into queue / ci changes
  └─ ct.blob_url?
       ├─ yes → setIsSimulating(false)
       └─ no  → probeOne(ct.file_path)
                  ├─ 200 OK → setIsSimulating(false)
                  └─ 404    → setIsSimulating(true)
```

## Error Handling

- `fetch` can throw (network error, CORS, etc.) — `probeOne` wraps in `try/catch`, returns `false` on any error → app stays in simulation mode (safe default)
- Race condition: probe resolves after `canplay` fires → `canplay` handler already calls `setIsSimulating(false)`, overrides correctly since both point to the same truth

## Testing

- `audioProbe.test.ts` — unit tests for `probeOne` and `probeFiles` using `vi.stubGlobal('fetch', ...)` to mock responses
- `useAudio.ts` changes are covered by existing integration tests (simulation mode behavior unchanged externally)

## Files Changed

| File | Change |
|------|--------|
| `src/services/audioProbe.ts` | **CREATE** — probe utilities |
| `src/services/useAudio.ts` | **EDIT** — add mount probe + per-track probe |

## Out of Scope

- Per-track availability icons in Builder/Player track lists (YAGNI)
- Scanning the full 18-track catalog on mount (overkill — one probe is enough for the global banner)
- Auto-discovery of files not in the catalog
