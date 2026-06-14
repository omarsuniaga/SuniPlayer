# GEMINI.md — SuniPlayer Instructional Context

## Project Overview
**SuniPlayer** is an AI-powered performance player for live musicians and DJs, designed to reduce friction and increase confidence on stage. It is organized as a **TypeScript monorepo** using `pnpm` workspaces.

### Architecture & Layers
- **`packages/core`**: Shared domain logic, Zustand stores, data contracts, and platform interfaces (`IAudioEngine`, `IFileAccess`, `IStorage`).
- **`apps/web`**: Mature PWA implementation using React 18, Vite, and Vitest. Features a dual-channel A/B web audio engine.
- **`apps/native`**: Mobile implementation using Expo (React Native), Expo Router, and SQLite. Uses `react-native-track-player` for audio.
- **`.agents/`**: Operational runtime for AI agents, including specialized skills (debugging, testing, etc.).

### Core Technologies
- **Frontend**: React (Web/Native), TypeScript.
- **State Management**: Zustand (5 domain stores: Builder, Player, Settings, History, Library).
- **Audio**: Web Audio API (Web), Expo AV / Track Player (Native).
- **Build/Tools**: Vite, Vitest, Jest, Expo, pnpm.

---

## Building and Running

### Prerequisites
- `pnpm` (version 10.x recommended)
- Node.js
- Expo CLI (for native development)

### Key Commands
Run these from the root directory:

| Command | Description |
|---|---|
| `pnpm install` | Install all dependencies. |
| `pnpm dev:web` | Start the Web/PWA dev server. |
| `pnpm dev:native` | Start the Expo development client. |
| `pnpm test` | Run all tests (Vitest for Web/Core, Jest for Native). |
| `pnpm typecheck` | Run type checking across all packages. |
| `pnpm lint` | Run ESLint. |
| `pnpm build` | Build the web application and check native types. |
| `pnpm validate` | Full validation suite: lint + typecheck + test + build. |

---

## Development Conventions

### Source of Truth Hierarchy
When resolving ambiguity, refer to documentation in this order:
1. `MVP_SCOPE.md` (Scope & priorities)
2. `DECISIONS.md` (Architecture decisions/ADRs)
3. `ROADMAP.md` (Sequencing)
4. `ARCHITECTURE.md` (Technical design)
5. `DATA_MODEL.md` (Entities & schemas)
6. `TASKS.md` (Current backlog)

### Coding Standards
- **Zustand Patterns**: 
    - Use `useStore.getState()` inside event handlers to avoid stale closures.
    - `partialize` persistent data fields; exclude actions and ephemeral state (e.g., `blob_url`).
- **Platform Adapters**: Always use the interfaces defined in `packages/core/src/platform/interfaces/`. Implementations reside in `apps/web/src/platform/` and `apps/native/src/platform/`.
- **Audio Engine**: 
    - Web: Dual-channel A/B with `useAudio.ts`.
    - Native: `ExpoAudioEngine.ts`. Note: Pitch shift is currently a no-op on native.
- **Testing**: 
    - New features must have tests (Vitest for web, Jest for native).
    - Reset stores in tests using `localStorage.clear()` and `store.setState(store.getInitialState(), true)`.
- **Persistence**: 
    - Web: `localStorage` (light) and `IndexedDB` (heavy/audio).
    - Native: `AsyncStorage` and `SQLite`.

### File Organization
- Shared code: `packages/core/src/`
- Web app: `apps/web/src/`
- Native app: `apps/native/`
- Legacy code: `legacy/` (do not use for new features)

---

## Agent Integration
This repository is designed for multi-agent collaboration.
- **Operational Agents**: Instructions in `.agents/agents/`.
- **Skills**: Specialized capabilities in `.agents/skills/`.
- **Workflows**: Common task loops in `.agents/workflows/`.

*Always respect the guardrails defined in `AGENTS.md` when acting as an agent in this workspace.*
