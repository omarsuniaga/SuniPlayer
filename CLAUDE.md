# SuniPlayer — Claude Code Context

## Project
Web music player for live musicians/DJs. React 18 + Zustand 4 + Vite + Vitest 4 + TypeScript 5.
Audio files live in `public/audio/`. Built-in catalog: `src/data/tracks.json` (10 tracks).

## Architecture
- **5 domain stores**: `useBuilderStore`, `usePlayerStore`, `useSettingsStore`, `useHistoryStore`, `useLibraryStore`
- **`useProjectStore`**: Composite API — combines all stores; use domain stores directly in perf-critical code
- **`usePedalBindings`**: Global keydown hook — mount once in `AppViewport`, reads state via `.getState()` to avoid stale closures

## Testing
- Run: `npm test` — Vitest 4, 113 tests across 15 files
- `globals: true` in `vitest.config.ts` — required for `@testing-library/react` auto-cleanup (`afterEach`)
- Reset stores in tests: `localStorage.clear()` + `store.setState(store.getInitialState(), true)`
- Use `queryAllByText()` not `queryByText()` when multiple elements may match (throws on multiple in v10.4.1)

## Zustand Patterns
- **Stale closure prevention**: Read store state inside event handlers with `useStore.getState()`, not from React closures
- **`partialize`**: Only persistent _data_ fields — never actions, never ephemeral UI state (e.g. `learningAction`)
- **Persist keys**: `suniplayer-builder`, `suniplayer-player`, `suniplayer-settings`, `suniplayer-history`, `suniplayer-library`

## Set Builder
- BPM filter has graceful fallback: if filter leaves < 3 tracks, uses full catalog (intentional design)
- `setTrackTrim()` recalculates `tTarget` from scratch via `getEffectiveDuration()` — not a delta
- `energy` field is musical energy (0.0–1.0), NOT audio RMS — assign semantically per genre/feel

## Audio Analysis
- `pip install librosa` — available for BPM/chroma analysis of MP3s in `public/audio/`
- `pip install mutagen` — for reading MP3 duration/metadata without full decode
- `librosa.beat.beat_track()` returns ndarray — use `float(np.asarray(tempo).item())` to extract scalar
- Slow songs (~76 BPM) may be detected at 2x tempo by librosa — divide by 2 if musically implausible

## Key Files
- `src/data/tracks.json` — built-in catalog (edit to add/update tracks with real BPM/energy/key)
- `src/store/useSettingsStore.ts` — includes `PedalAction`, `PedalBinding`, `PedalBindings` types
- `src/services/usePedalBindings.ts` — Learn Mode + global keydown dispatch
- `src/components/settings/PedalConfig.tsx` — Bluetooth pedal UI
- `src/__tests__/features.test.ts` — 65 feature acceptance tests across 9 areas (F1–F9)
- `docs/superpowers/plans/` — implementation plans (pedal bindings: done; iOS migration: pending)
