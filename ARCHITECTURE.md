# Architecture Overview — SuniPlayer

**Agente Responsable:** Agent 02 — Audio Systems Architect

---

## 1. Current architectural reality

SuniPlayer now uses a **monorepo architecture**.

- `apps/web` contains the PWA and remains the most mature surface today.
- `apps/native` contains the Expo / React Native app for iOS and Android.
- `packages/core` contains shared domain logic, Zustand stores, data contracts, and reusable services.

The previous single-app root structure is no longer the primary implementation path.

---

## 2. High-level layout

```text
apps/
  web/
    src/
      app/
      components/
      features/
      pages/
      platform/
      services/
      store/
  native/
    app/
    src/
      components/
      platform/
      screens/

packages/
  core/
    src/
      data/
      platform/interfaces/
      services/
      store/
      utils/
```

---

## 3. Layer responsibilities

### 3.1 `packages/core`

Owns:

- shared `Track` and domain types
- builder/player/history/library/settings stores
- cross-domain actions
- set-building logic
- platform interfaces such as storage, file access, and audio engine contracts

This package should remain UI-agnostic and platform-agnostic as much as practical.

### 3.2 `apps/web`

Owns:

- React/Vite UI and PWA runtime
- browser-specific platform adapters
- web audio behavior and PWA recovery features
- web-only UX, tests, and integration points

### 3.3 `apps/native`

Owns:

- Expo Router navigation and React Native screens
- mobile platform adapters
- SQLite and native file access implementation
- native audio engine integration
- iOS/Android-specific behavior and constraints

---

## 4. Platform adapter model

The project is moving toward explicit platform boundaries.

### Shared contracts

- `IAudioEngine`
- `IFileAccess`
- `IStorage`

### Web implementations

Live under `apps/web/src/platform/browser/`.

### Native implementations

Live under `apps/native/src/platform/`.

This is the key mechanism that allows the same product logic to target browser and mobile with different runtime capabilities.

---

## 5. State architecture

The state model remains Zustand-based, but now it is intentionally shared through `@suniplayer/core`.

Core stores include:

- `useBuilderStore`
- `usePlayerStore`
- `useSettingsStore`
- `useHistoryStore`
- `useLibraryStore`
- `useProjectStore` as compatibility/composition layer

Important rule:

- platform-specific side effects must stay in the app layer
- domain state shape and cross-domain actions should stay in `packages/core`

---

## 6. Audio architecture

### Web

- browser audio engine
- waveform analysis
- PWA recovery and simulation fallback
- current transposition behavior is web-constrained and not equivalent to high-end native DSP

### Native

- Expo / native audio engine path
- Track Player based integration already exists as a platform layer
- intended to become the preferred route for reliable show playback on iPad/iPhone/Android

---

## 7. Persistence architecture

### Web

- `localStorage` for lightweight state
- `IndexedDB` for stronger session recovery and heavier browser persistence

### Native

- AsyncStorage for store persistence
- SQLite for stronger local data storage

This means persistence strategy is now explicitly platform-dependent, while the data contracts remain shared.

---

## 8. Current strengths

- correct monorepo split by delivery surface and shared core
- real native app scaffolding already present
- shared store contracts already extracted to `packages/core`
- platform adapter direction is sound

## 9. Current weaknesses

- documentation still needs full convergence around the monorepo reality
- some legacy/transitional files still exist outside the main app paths
- not all functionality is guaranteed feature-parity between web and native yet
- validation is stronger on web than on native runtime behavior

---

## 10. Near-term architecture priorities

1. finish documentation convergence around `apps/` + `packages/`
2. reduce leftover ambiguity from root-level legacy structure
3. continue pushing domain logic into `packages/core`
4. close critical parity gaps between `apps/web` and `apps/native`
5. harden native reliability for real iPad/phone usage

---

## 11. Decision summary

SuniPlayer is no longer architecturally “web-first with a future mobile idea”.

It is now:

- a shared-core product
- with a real web app
- and a real native app
- in an active migration toward cleaner platform separation
