# Energy Curve Toggle — Design Spec

**Date:** 2026-03-22
**Status:** Approved

## Problem

The Energy Curve panel in the Player tab can only be expanded/collapsed via its header chevron. There is no way for the user to fully hide the panel, and the expand/collapse state is not persisted across sessions. Additionally, the TABLET UI button lives in the superpoderes row (Player page) instead of the Settings panel where it logically belongs alongside other display preferences.

## Solution

1. Add a `CURVE` toggle button to the superpoderes row — visible only when the active set has a curve configured — that shows/hides the Energy Curve panel persistently.
2. Persist `curveExpanded` (previously local `useState`) in `useSettingsStore`.
3. Move the TABLET UI button from the superpoderes row to `SettingsPanel` as a proper `Toggle` row.

## State Changes — `useSettingsStore`

Two new fields added to the store and included in `partialize` (persisted to `localStorage` under key `suniplayer-settings`):

| Field | Type | Default | Description |
|---|---|---|---|
| `curveVisible` | `boolean` | `true` | Shows/hides the Energy Curve panel entirely |
| `curveExpanded` | `boolean` | `true` | Controls the accordion open/close state of the panel |

Setters: `setCurveVisible(v: boolean)`, `setCurveExpanded(v: boolean)`.

`performanceMode` already exists in `useSettingsStore` — no new field needed, only UI relocation.

## Component Changes

### `useSettingsStore.ts`
- Add `curveVisible: boolean`, `setCurveVisible`
- Add `curveExpanded: boolean`, `setCurveExpanded`
- Include both in `partialize`

### `Player.tsx`
- Remove `const [curveExpanded, setCurveExpanded] = useState(true)` local state
- Read `curveVisible`, `setCurveVisible`, `curveExpanded`, `setCurveExpanded` from `useSettingsStore`
- Remove the `TABLET UI` button from the superpoderes row
- Add `CURVE` button in the superpoderes row: visible only when `curve` has a value, styled in violet (matching Energy Curve accent), active when `curveVisible=true`
- Pass `curveVisible` as a new prop to `Dashboard`

### `Dashboard.tsx`
- Add `curveVisible: boolean` to `DashboardProps` interface
- Change render condition from `{curve && (...)}` to `{curve && curveVisible && (...)}`

### `SettingsPanel.tsx`
- Add a `Toggle` row under the "Reproducción" section:
  - **Label:** "Modo Tablet / Escenario"
  - **Description:** "Aumenta el tamaño de fuentes y controles para uso en escenario"
  - **State:** `performanceMode` from `useSettingsStore`

## Data Flow

```
useSettingsStore
  ├── curveVisible  ──→ Player.tsx ──→ Dashboard (prop)
  ├── curveExpanded ──→ Player.tsx ──→ Dashboard (prop)
  └── performanceMode ──→ SettingsPanel (Toggle)

Player.tsx superpoderes row:
  [CROSS] [FADE] [METER] [CURVE*] [≡]
  * only rendered when `curve` (from useBuilderStore) is truthy
```

## Superpoderes Row — Before / After

**Before:**
```
[CROSS]  [FADE]  [METER]  [TABLET UI]  [≡]
```

**After (with curve set):**
```
[CROSS]  [FADE]  [METER]  [CURVE]  [≡]
```

**After (no curve):**
```
[CROSS]  [FADE]  [METER]  [≡]
```

## What Does NOT Change

- The `curve` prop source (`useBuilderStore`) — unchanged
- The `curvePlayheadPct` calculation — unchanged
- `EnergyCurveChart` component — unchanged
- The existing collapse chevron inside the Section header — still works, now backed by persistent `curveExpanded`
- All other Dashboard panels (CROSSFADE, FADE CURVES, SPL METER) — unchanged
