# SuniPlayer Native App Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready Expo + React Native app for iPad (primary) and Android (secondary) that shares business logic with the existing web app via a `packages/core` package.

**Architecture:** Monorepo with pnpm workspaces — `packages/core` holds all shared TypeScript logic (Zustand stores, setBuilderService, platform interfaces, types); `apps/native` is a single Expo SDK 52 project targeting both iOS and Android; `apps/web` remains the existing Vite app untouched. Native adapters implement PAL interfaces using Expo APIs.

**Tech Stack:** Expo SDK 52, Expo Router v3, react-native-track-player (background audio), expo-sqlite (storage), expo-document-picker + expo-file-system (file access), Zustand 4, TypeScript 5 strict, pnpm workspaces, Jest + @testing-library/react-native.

---

## Chunk 1: Monorepo Setup + Core Package

**Goal:** Convert repo to pnpm monorepo. Extract shared logic into `packages/core`. Web app continues to work with 113/113 tests passing.

### File Map — Chunk 1

| Action | Path |
|--------|------|
| Create | `package.json` (workspace root, replaces current) |
| Create | `packages/core/package.json` |
| Create | `packages/core/tsconfig.json` |
| Copy → | `packages/core/src/types.ts` |
| Copy → | `packages/core/src/data/tracks.json` |
| Copy → | `packages/core/src/data/constants.ts` |
| Copy → | `packages/core/src/store/useBuilderStore.ts` |
| Copy → | `packages/core/src/store/usePlayerStore.ts` |
| Copy → | `packages/core/src/store/useSettingsStore.ts` |
| Copy → | `packages/core/src/store/useHistoryStore.ts` |
| Copy → | `packages/core/src/store/useLibraryStore.ts` |
| Copy → | `packages/core/src/store/useProjectStore.ts` |
| Copy → | `packages/core/src/services/setBuilderService.ts` |
| Copy → | `packages/core/src/platform/interfaces/IAudioEngine.ts` |
| Copy → | `packages/core/src/platform/interfaces/IStorage.ts` |
| Copy → | `packages/core/src/platform/interfaces/IFileAccess.ts` |
| Create | `packages/core/src/index.ts` |
| Move | Current repo root → `apps/web/` (full Vite project) |
| Modify | `apps/web/package.json` — add `@suniplayer/core` dep |
| Modify | `apps/web/src/**` — update imports to `@suniplayer/core` |

---

### Task 1.1: Merge `feature/ios-migration` to get platform interfaces

The platform interfaces (IAudioEngine, IStorage, IFileAccess) and browser adapters are on the `feature/ios-migration` branch. Merge them into `main` first.

**Files:** None new — just git ops.

- [ ] **Step 1: Verify worktree state**

```bash
cd C:/Users/omare/.claude/projects/SuniPlayer
git status
git log --oneline -5
```

- [ ] **Step 2: Check what's on ios-migration**

```bash
git log --oneline feature/ios-migration -8
```

- [ ] **Step 3: Merge ios-migration into main**

```bash
git checkout main
git merge feature/ios-migration --no-ff -m "feat(platform): merge ios-migration PAL interfaces and browser adapters"
```

- [ ] **Step 4: Verify tests still pass**

```bash
npm test
```
Expected: 113 passed (113)

- [ ] **Step 5: Commit if not already committed by merge**

The merge commit itself is the commit. Verify with `git log --oneline -3`.

---

### Task 1.2: Set up pnpm workspaces root

**Files:**
- Modify: `package.json` (current root → workspace root)
- Create: `pnpm-workspace.yaml`

- [ ] **Step 1: Install pnpm globally if not present**

```bash
npm list -g pnpm || npm install -g pnpm
pnpm --version
```
Expected: 9.x or higher

- [ ] **Step 2: Create workspace root package.json**

Replace current `package.json` with:

```json
{
  "name": "suniplayer-monorepo",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev:web": "pnpm --filter @suniplayer/web dev",
    "test:web": "pnpm --filter @suniplayer/web test",
    "test:core": "pnpm --filter @suniplayer/core test",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml
git commit -m "chore: set up pnpm workspaces root"
```

---

### Task 1.3: Create `packages/core`

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Copy: all store/service/type/interface files listed in File Map

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p packages/core/src/store
mkdir -p packages/core/src/services
mkdir -p packages/core/src/data
mkdir -p packages/core/src/platform/interfaces
```

- [ ] **Step 2: Create packages/core/package.json**

```json
{
  "name": "@suniplayer/core",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^4.0.18"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  }
}
```

- [ ] **Step 3: Create packages/core/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

Note: `lib` does NOT include `DOM` — core must be platform-agnostic. This will surface any browser-specific code immediately.

- [ ] **Step 4: Copy source files to packages/core/src/**

```bash
cp src/types.ts packages/core/src/types.ts
cp src/data/tracks.json packages/core/src/data/tracks.json
cp src/data/constants.ts packages/core/src/data/constants.ts
cp src/store/useBuilderStore.ts packages/core/src/store/useBuilderStore.ts
cp src/store/usePlayerStore.ts packages/core/src/store/usePlayerStore.ts
cp src/store/useSettingsStore.ts packages/core/src/store/useSettingsStore.ts
cp src/store/useHistoryStore.ts packages/core/src/store/useHistoryStore.ts
cp src/store/useLibraryStore.ts packages/core/src/store/useLibraryStore.ts
cp src/store/useProjectStore.ts packages/core/src/store/useProjectStore.ts
cp src/services/setBuilderService.ts packages/core/src/services/setBuilderService.ts
cp src/platform/interfaces/IAudioEngine.ts packages/core/src/platform/interfaces/IAudioEngine.ts
cp src/platform/interfaces/IStorage.ts packages/core/src/platform/interfaces/IStorage.ts
cp src/platform/interfaces/IFileAccess.ts packages/core/src/platform/interfaces/IFileAccess.ts
```

- [ ] **Step 5: Fix localStorage references in copied stores**

The stores use `createJSONStorage(() => localStorage)` which is browser-specific. Replace with a configurable storage factory pattern.

In each store that uses persist (`useBuilderStore`, `usePlayerStore`, `useSettingsStore`, `useHistoryStore`, `useLibraryStore`), replace:
```typescript
import { persist, createJSONStorage } from "zustand/middleware";
// ...
storage: createJSONStorage(() => localStorage),
```
with:
```typescript
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

// Module-level storage singleton — set by app at startup
let _storage: StateStorage | null = null;
export function setZustandStorage(s: StateStorage) { _storage = s; }

// In persist config:
storage: createJSONStorage(() => {
  if (!_storage) throw new Error("Call setZustandStorage() before using stores");
  return _storage;
}),
```

Create `packages/core/src/store/storage.ts`:
```typescript
import { StateStorage } from "zustand/middleware";

let _storage: StateStorage | null = null;

export function configureStorage(storage: StateStorage): void {
  _storage = storage;
}

export function getStorage(): StateStorage {
  if (!_storage) {
    throw new Error(
      "[suniplayer/core] Storage not configured. Call configureStorage() at app startup."
    );
  }
  return _storage;
}
```

Then in each store, replace the `() => localStorage` with `() => getStorage()`.

- [ ] **Step 6: Create packages/core/src/index.ts**

```typescript
// Types
export type { Track, Venue, Curve, SetHistoryItem } from './types';

// Stores
export { useBuilderStore } from './store/useBuilderStore';
export { usePlayerStore } from './store/usePlayerStore';
export { useSettingsStore } from './store/useSettingsStore';
export type { PedalAction, PedalBinding, PedalBindings } from './store/useSettingsStore';
export { useHistoryStore } from './store/useHistoryStore';
export { useLibraryStore } from './store/useLibraryStore';
export { useProjectStore } from './store/useProjectStore';

// Storage config
export { configureStorage } from './store/storage';

// Services
export { buildSet, type BuildSetOptions } from './services/setBuilderService';

// Platform interfaces
export type { IAudioEngine, AudioLoadOptions } from './platform/interfaces/IAudioEngine';
export type { IStorage, AnalysisData } from './platform/interfaces/IStorage';
export type { IFileAccess, ImportedFile, FileSource } from './platform/interfaces/IFileAccess';

// Catalog
export { default as catalog } from './data/tracks.json';
```

- [ ] **Step 7: Run typecheck on core**

```bash
cd packages/core && pnpm typecheck
```
Expected: no errors. Fix any DOM-specific API calls if found.

- [ ] **Step 8: Commit**

```bash
cd ../..
git add packages/
git commit -m "feat(core): extract shared business logic into @suniplayer/core package"
```

---

### Task 1.4: Move web app to `apps/web/`

**Files:**
- Move: all web app files to `apps/web/`
- Modify: `apps/web/package.json` — rename, add core dep
- Modify: `apps/web/src/**` — update imports

- [ ] **Step 1: Create apps/web directory and move files**

```bash
mkdir -p apps/web
# Move web app source (keep root for monorepo config)
git mv src apps/web/src
git mv public apps/web/public
git mv index.html apps/web/index.html
git mv vite.config.ts apps/web/vite.config.ts
git mv tsconfig.json apps/web/tsconfig.json
git mv tsconfig.app.json apps/web/tsconfig.app.json 2>/dev/null || true
git mv tsconfig.node.json apps/web/tsconfig.node.json 2>/dev/null || true
git mv vitest.config.ts apps/web/vitest.config.ts 2>/dev/null || true
git mv eslint.config.js apps/web/eslint.config.js 2>/dev/null || true
git mv eslint.config.mjs apps/web/eslint.config.mjs 2>/dev/null || true
cp package.json apps/web/package.json
```

- [ ] **Step 2: Update apps/web/package.json**

```json
{
  "name": "@suniplayer/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@suniplayer/core": "workspace:*",
    "idb": "^8.0.3",
    "music-metadata-browser": "^2.5.11",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "soundtouchjs": "^0.3.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "jsdom": "^28.1.0",
    "typescript": "^5.3.0",
    "typescript-eslint": "^8.57.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^1.2.0",
    "vitest": "^4.0.18",
    "workbox-window": "^7.4.0"
  }
}
```

- [ ] **Step 3: Add web app startup — configure localStorage storage**

In `apps/web/src/main.tsx`, add before rendering:
```typescript
import { configureStorage } from '@suniplayer/core';
configureStorage(localStorage);
```

- [ ] **Step 4: Update imports in web app**

Find all imports from `../../store/`, `../../services/setBuilderService`, `../../types` that now live in core, and update them to `@suniplayer/core`.

```bash
# Find files that import from paths that moved to core
grep -r "from.*store/use" apps/web/src --include="*.ts" --include="*.tsx" -l
grep -r "from.*services/setBuilderService" apps/web/src -l
grep -r "from.*types" apps/web/src -l
```

Update each found file. Example:
```typescript
// Before
import { usePlayerStore } from '../store/usePlayerStore';
import type { Track } from '../types';
// After
import { usePlayerStore, type Track } from '@suniplayer/core';
```

- [ ] **Step 5: Install dependencies and run web tests**

```bash
pnpm install
cd apps/web && pnpm test
```
Expected: 113 passed (113)

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/ packages/
git commit -m "chore(web): move web app to apps/web, wire @suniplayer/core"
```

---

## Chunk 2: Expo Native App Scaffold + Navigation

**Goal:** Create the Expo project at `apps/native/`, configure navigation with 4 tabs (Player, Builder, Library, Settings), set up dark theme and iPad-responsive layout. No audio logic yet — placeholder screens only.

### File Map — Chunk 2

| Action | Path |
|--------|------|
| Create | `apps/native/` (Expo project) |
| Create | `apps/native/apple/docs/README.md` |
| Create | `apps/native/apple/assets/` (icon placeholders) |
| Create | `apps/native/android/docs/README.md` |
| Create | `apps/native/android/assets/` |
| Create | `apps/native/src/theme/colors.ts` |
| Create | `apps/native/src/navigation/TabLayout.tsx` |
| Create | `apps/native/src/screens/PlayerScreen.tsx` |
| Create | `apps/native/src/screens/BuilderScreen.tsx` |
| Create | `apps/native/src/screens/LibraryScreen.tsx` |
| Create | `apps/native/src/screens/SettingsScreen.tsx` |
| Create | `apps/native/package.json` |
| Create | `apps/native/app.json` |
| Create | `apps/native/app/_layout.tsx` |
| Create | `apps/native/app/(tabs)/_layout.tsx` |
| Create | `apps/native/app/(tabs)/index.tsx` |
| Create | `apps/native/app/(tabs)/builder.tsx` |
| Create | `apps/native/app/(tabs)/library.tsx` |
| Create | `apps/native/app/(tabs)/settings.tsx` |

---

### Task 2.1: Initialize Expo project

- [ ] **Step 1: Create apps/native with blank Expo Router template**

```bash
cd apps
npx create-expo-app@latest native --template blank-typescript
cd native
```

- [ ] **Step 2: Install Expo Router and required packages**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar
```

- [ ] **Step 3: Update apps/native/package.json — add @suniplayer/core dep**

Add to dependencies:
```json
"@suniplayer/core": "workspace:*",
"zustand": "^4.5.0",
"@react-native-async-storage/async-storage": "^2.1.0"
```

- [ ] **Step 4: Update app.json for iPad target**

```json
{
  "expo": {
    "name": "SuniPlayer",
    "slug": "suniplayer",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./apple/assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./apple/assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0a0a"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.suniplayer.app",
      "requireFullScreen": false,
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSMicrophoneUsageDescription": "SuniPlayer does not use the microphone.",
        "NSAppleMusicUsageDescription": "SuniPlayer accesses your audio files for playback."
      }
    },
    "android": {
      "package": "com.suniplayer.app",
      "adaptiveIcon": {
        "foregroundImage": "./android/assets/adaptive-icon.png",
        "backgroundColor": "#0a0a0a"
      },
      "permissions": ["READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-router",
      [
        "react-native-track-player",
        {
          "iOS": { "enableAirPlay": true }
        }
      ]
    ],
    "scheme": "suniplayer",
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

Key iOS config: `"UIBackgroundModes": ["audio"]` — required for background playback.

- [ ] **Step 5: Create folder structure**

```bash
mkdir -p src/platform src/screens src/components src/theme
mkdir -p apple/docs apple/assets
mkdir -p android/docs android/assets
```

- [ ] **Step 6: Create apple/docs/README.md**

```markdown
# SuniPlayer — iPad / iOS Notes

## Target Device
- Primary: iPad (all modern models, iPadOS 16+)
- Secondary: iPhone (same codebase, adapted layout)

## Key iOS Configurations
- `UIBackgroundModes: audio` — audio continues when iPad screen locks
- `supportsTablet: true` — enables split-view and iPad-optimized layout
- `requireFullScreen: false` — allows iOS split-view multitasking

## File Access
Files are imported via `expo-document-picker` which opens the iOS Files app.
Imported files are copied to the app's `documentDirectory` (iCloud-backed).

## App Distribution
- Development: Expo Go or `npx expo run:ios`
- TestFlight: `eas build --platform ios`
- App Store: `eas submit --platform ios`

## Entitlements
No special entitlements needed for v1. Future cloud sync may need iCloud entitlement.
```

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/native/
git commit -m "feat(native): initialize Expo project with iPad config and folder structure"
```

---

### Task 2.2: Dark theme + colors

**Files:**
- Create: `apps/native/src/theme/colors.ts`

- [ ] **Step 1: Create color system**

```typescript
// apps/native/src/theme/colors.ts
// Dark-first palette optimized for low-light stage environments

export const colors = {
  // Backgrounds
  bg: '#0a0a0a',
  bgSurface: '#141414',
  bgElevated: '#1e1e1e',
  bgModal: '#242424',

  // Text
  textPrimary: '#f0f0f0',
  textSecondary: '#a0a0a0',
  textMuted: '#606060',

  // Accent (teal — matches web app)
  accent: '#0ea5e9',
  accentDim: '#0c4a6e',

  // State
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',

  // Borders
  border: '#2a2a2a',
  borderFocus: '#0ea5e9',

  // Player controls
  playButton: '#0ea5e9',
  playButtonActive: '#38bdf8',

  // Transport buttons (large — used on stage in dark)
  transportBg: '#1e1e1e',
  transportActive: '#0c4a6e',
} as const;

export type ColorKey = keyof typeof colors;
```

- [ ] **Step 2: Commit**

```bash
git add apps/native/src/theme/
git commit -m "feat(native): add dark theme color system"
```

---

### Task 2.3: Tab navigation with Expo Router

**Files:**
- Create: `apps/native/app/_layout.tsx`
- Create: `apps/native/app/(tabs)/_layout.tsx`
- Create: `apps/native/app/(tabs)/index.tsx` (Player tab)
- Create: `apps/native/app/(tabs)/builder.tsx`
- Create: `apps/native/app/(tabs)/library.tsx`
- Create: `apps/native/app/(tabs)/settings.tsx`

- [ ] **Step 1: Create root layout**

```tsx
// apps/native/app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

- [ ] **Step 2: Create tab layout**

```tsx
// apps/native/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Reproductor', tabBarIcon: ({ color }) => <TabIcon name="play-circle" color={color} /> }}
      />
      <Tabs.Screen
        name="builder"
        options={{ title: 'Armador', tabBarIcon: ({ color }) => <TabIcon name="list" color={color} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'Biblioteca', tabBarIcon: ({ color }) => <TabIcon name="music" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Ajustes', tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} /> }}
      />
    </Tabs>
  );
}

// Inline icon component — replace with @expo/vector-icons once installed
function TabIcon({ name, color }: { name: string; color: string }) {
  return null; // placeholder until vector-icons installed in Task 2.4
}
```

- [ ] **Step 3: Create placeholder screens**

```tsx
// apps/native/app/(tabs)/index.tsx
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';

export default function PlayerTab() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reproductor</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '600' },
});
```

Create identical placeholders for `builder.tsx`, `library.tsx`, `settings.tsx` with their respective names.

- [ ] **Step 4: Install @expo/vector-icons and update TabLayout**

```bash
cd apps/native
npx expo install @expo/vector-icons
```

Update `TabIcon` in `_layout.tsx`:
```tsx
import { Ionicons } from '@expo/vector-icons';

function TabIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}
```

Update tab icon names:
- Player: `"play-circle-outline"` / `"play-circle"`
- Builder: `"list-outline"` / `"list"`
- Library: `"musical-notes-outline"` / `"musical-notes"`
- Settings: `"settings-outline"` / `"settings"`

- [ ] **Step 5: Verify app runs in Expo Go**

```bash
npx expo start
```
Expected: QR code appears, app loads on device/simulator with 4 tabs visible, dark background.

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/native/app/
git commit -m "feat(native): add Expo Router tab navigation with 4 tabs and dark theme"
```

---

## Chunk 3: Native Platform Adapters

**Goal:** Implement the three PAL adapters using Expo APIs. Each adapter is independently tested. At the end of this chunk, audio can play, files can be imported and persist, and metadata can be read/written.

### File Map — Chunk 3

| Action | Path |
|--------|------|
| Create | `apps/native/src/platform/ExpoAudioEngine.ts` |
| Create | `apps/native/src/platform/SQLiteStorage.ts` |
| Create | `apps/native/src/platform/LocalFileAccess.ts` |
| Create | `apps/native/src/platform/index.ts` |
| Create | `apps/native/src/__tests__/ExpoAudioEngine.test.ts` |
| Create | `apps/native/src/__tests__/SQLiteStorage.test.ts` |
| Create | `apps/native/src/__tests__/LocalFileAccess.test.ts` |

---

### Task 3.1: Install audio and storage libraries

- [ ] **Step 1: Install react-native-track-player**

```bash
cd apps/native
npx expo install react-native-track-player
```

- [ ] **Step 2: Install expo-sqlite and expo-document-picker and expo-file-system**

```bash
npx expo install expo-sqlite expo-document-picker expo-file-system expo-crypto
```

`expo-crypto` is used to generate deterministic track IDs from file content hash — security measure to prevent duplicate imports.

- [ ] **Step 3: Verify no build errors**

```bash
npx expo start --no-dev 2>&1 | head -30
```

- [ ] **Step 4: Commit dependencies**

```bash
cd ../..
git add apps/native/package.json apps/native/app.json
git commit -m "chore(native): install audio and storage dependencies"
```

---

### Task 3.2: `ExpoAudioEngine` — react-native-track-player adapter

**Files:**
- Create: `apps/native/src/platform/ExpoAudioEngine.ts`
- Create: `apps/native/src/__tests__/ExpoAudioEngine.test.ts`

- [ ] **Step 1: Write the failing test first**

```typescript
// apps/native/src/__tests__/ExpoAudioEngine.test.ts
import { ExpoAudioEngine } from '../platform/ExpoAudioEngine';

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  setupPlayer: jest.fn().mockResolvedValue(undefined),
  add: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  seekTo: jest.fn().mockResolvedValue(undefined),
  setRate: jest.fn().mockResolvedValue(undefined),
  setVolume: jest.fn().mockResolvedValue(undefined),
  getProgress: jest.fn().mockResolvedValue({ position: 5.0, duration: 180.0, buffered: 10.0 }),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  Event: { PlaybackProgressUpdated: 'playback-progress-updated', PlaybackQueueEnded: 'playback-queue-ended', PlaybackError: 'playback-error' },
  State: { Playing: 'playing', Paused: 'paused', Stopped: 'stopped' },
}));

describe('ExpoAudioEngine', () => {
  let engine: ExpoAudioEngine;
  beforeEach(() => { engine = new ExpoAudioEngine(); });
  afterEach(() => { engine.dispose(); });

  it('satisfies IAudioEngine interface', () => {
    expect(typeof engine.load).toBe('function');
    expect(typeof engine.play).toBe('function');
    expect(typeof engine.pause).toBe('function');
    expect(typeof engine.seek).toBe('function');
    expect(typeof engine.setPitch).toBe('function');
    expect(typeof engine.setTempo).toBe('function');
    expect(typeof engine.setVolume).toBe('function');
    expect(typeof engine.onPositionUpdate).toBe('function');
    expect(typeof engine.onEnded).toBe('function');
    expect(typeof engine.onError).toBe('function');
    expect(typeof engine.dispose).toBe('function');
  });

  it('calls TrackPlayer.play on play()', async () => {
    const TrackPlayer = require('react-native-track-player');
    await engine.load('file:///audio/test.mp3');
    await engine.play();
    expect(TrackPlayer.play).toHaveBeenCalled();
  });

  it('calls TrackPlayer.pause on pause()', async () => {
    const TrackPlayer = require('react-native-track-player');
    await engine.load('file:///audio/test.mp3');
    await engine.pause();
    expect(TrackPlayer.pause).toHaveBeenCalled();
  });

  it('converts ms to seconds when seeking', async () => {
    const TrackPlayer = require('react-native-track-player');
    await engine.seek(5000); // 5000ms = 5s
    expect(TrackPlayer.seekTo).toHaveBeenCalledWith(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/native && npx jest src/__tests__/ExpoAudioEngine.test.ts
```
Expected: FAIL — `ExpoAudioEngine` not found.

- [ ] **Step 3: Implement ExpoAudioEngine**

```typescript
// apps/native/src/platform/ExpoAudioEngine.ts
import TrackPlayer, {
  Event,
  State,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import type { IAudioEngine, AudioLoadOptions } from '@suniplayer/core';

export class ExpoAudioEngine implements IAudioEngine {
  private _positionListener: ((posMs: number) => void) | null = null;
  private _endedListener: (() => void) | null = null;
  private _errorListener: ((err: Error) => void) | null = null;
  private _subscriptions: Array<{ remove: () => void }> = [];
  private _initialized = false;

  private async _ensureInitialized(): Promise<void> {
    if (this._initialized) return;
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 5, // 5MB
    });
    this._initialized = true;
    this._attachListeners();
  }

  private _attachListeners(): void {
    const progressSub = TrackPlayer.addEventListener(
      Event.PlaybackProgressUpdated,
      ({ position }: { position: number }) => {
        this._positionListener?.(position * 1000); // seconds → ms
      }
    );
    const endedSub = TrackPlayer.addEventListener(
      Event.PlaybackQueueEnded,
      () => { this._endedListener?.(); }
    );
    const errorSub = TrackPlayer.addEventListener(
      Event.PlaybackError,
      ({ message }: { message: string }) => {
        this._errorListener?.(new Error(message));
      }
    );
    this._subscriptions = [progressSub, endedSub, errorSub];
  }

  async load(url: string, options?: AudioLoadOptions): Promise<void> {
    await this._ensureInitialized();
    await TrackPlayer.add({
      url,
      title: '',
      artist: '',
    });
    if (options?.initialVolume !== undefined) {
      await TrackPlayer.setVolume(options.initialVolume);
    }
    if (options?.initialTempo !== undefined) {
      await TrackPlayer.setRate(options.initialTempo);
    }
    if (options?.startMs !== undefined) {
      await TrackPlayer.seekTo(options.startMs / 1000);
    }
  }

  async play(): Promise<void> {
    await TrackPlayer.play();
  }

  pause(): void {
    TrackPlayer.pause();
  }

  seek(positionMs: number): void {
    TrackPlayer.seekTo(positionMs / 1000); // ms → seconds
  }

  // Note: react-native-track-player does not natively support pitch shifting.
  // For v1, setPitch is a no-op. Pitch shift can be added via expo-av or
  // a dedicated DSP library in a future version.
  setPitch(_semitones: number): void {
    // TODO: implement pitch shifting in v2 using a DSP library
  }

  setTempo(rate: number): void {
    TrackPlayer.setRate(rate);
  }

  setVolume(volume: number): void {
    // Clamp to [0, 1] — security: prevent accidental amplification above system level
    const safe = Math.max(0, Math.min(1, volume));
    TrackPlayer.setVolume(safe);
  }

  onPositionUpdate(cb: (posMs: number) => void): void {
    this._positionListener = cb;
  }

  onEnded(cb: () => void): void {
    this._endedListener = cb;
  }

  onError(cb: (err: Error) => void): void {
    this._errorListener = cb;
  }

  dispose(): void {
    this._subscriptions.forEach(s => s.remove());
    this._subscriptions = [];
    this._positionListener = null;
    this._endedListener = null;
    this._errorListener = null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/ExpoAudioEngine.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/native/src/platform/ExpoAudioEngine.ts apps/native/src/__tests__/ExpoAudioEngine.test.ts
git commit -m "feat(native): add ExpoAudioEngine adapter (react-native-track-player)"
```

---

### Task 3.3: `SQLiteStorage` — expo-sqlite adapter

**Files:**
- Create: `apps/native/src/platform/SQLiteStorage.ts`
- Create: `apps/native/src/__tests__/SQLiteStorage.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/native/src/__tests__/SQLiteStorage.test.ts
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  }),
}));

import { SQLiteStorage } from '../platform/SQLiteStorage';

describe('SQLiteStorage', () => {
  let storage: SQLiteStorage;
  beforeEach(async () => {
    storage = new SQLiteStorage();
    await storage.init();
  });

  it('returns null for missing analysis', async () => {
    const result = await storage.getAnalysis('non-existent');
    expect(result).toBeNull();
  });

  it('saves and retrieves analysis data', async () => {
    const SQLite = require('expo-sqlite');
    const mockDb = await SQLite.openDatabaseAsync();
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'track-1', bpm: 128, key: 'C', energy: 0.8, gainOffset: 1.0, timestamp: 1234567890
    });
    await storage.saveAnalysis('track-1', { bpm: 128, key: 'C', energy: 0.8 });
    const result = await storage.getAnalysis('track-1');
    expect(result).not.toBeNull();
    expect(result?.bpm).toBe(128);
  });

  it('returns null for missing waveform', async () => {
    const result = await storage.getWaveform('non-existent');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/SQLiteStorage.test.ts
```

- [ ] **Step 3: Implement SQLiteStorage**

```typescript
// apps/native/src/platform/SQLiteStorage.ts
import * as SQLite from 'expo-sqlite';
import type { IStorage, AnalysisData } from '@suniplayer/core';

export class SQLiteStorage implements IStorage {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('suniplayer.db');
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS analysis (
        id TEXT PRIMARY KEY,
        bpm REAL,
        key TEXT,
        energy REAL,
        gainOffset REAL,
        timestamp INTEGER
      );
      CREATE TABLE IF NOT EXISTS waveforms (
        id TEXT PRIMARY KEY,
        data TEXT
      );
    `);
  }

  private assertReady(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('SQLiteStorage not initialized. Call init() first.');
    return this.db;
  }

  async getAnalysis(trackId: string): Promise<AnalysisData | null> {
    const db = this.assertReady();
    // Parameterized query — prevents SQL injection
    const row = await db.getFirstAsync<AnalysisData>(
      'SELECT * FROM analysis WHERE id = ?',
      [trackId]
    );
    return row ?? null;
  }

  async saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void> {
    const db = this.assertReady();
    await db.runAsync(
      `INSERT OR REPLACE INTO analysis (id, bpm, key, energy, gainOffset, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        trackId,
        data.bpm ?? null,
        data.key ?? null,
        data.energy ?? null,
        data.gainOffset ?? null,
        Date.now(),
      ]
    );
  }

  async getWaveform(trackId: string): Promise<number[] | null> {
    const db = this.assertReady();
    const row = await db.getFirstAsync<{ data: string }>(
      'SELECT data FROM waveforms WHERE id = ?',
      [trackId]
    );
    if (!row) return null;
    try {
      return JSON.parse(row.data) as number[];
    } catch {
      return null; // corrupt data — return null gracefully
    }
  }

  async saveWaveform(trackId: string, data: number[]): Promise<void> {
    const db = this.assertReady();
    await db.runAsync(
      'INSERT OR REPLACE INTO waveforms (id, data) VALUES (?, ?)',
      [trackId, JSON.stringify(data)]
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/SQLiteStorage.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/native/src/platform/SQLiteStorage.ts apps/native/src/__tests__/SQLiteStorage.test.ts
git commit -m "feat(native): add SQLiteStorage adapter (expo-sqlite)"
```

---

### Task 3.4: `LocalFileAccess` — expo-file-system + expo-document-picker adapter

**Files:**
- Create: `apps/native/src/platform/LocalFileAccess.ts`
- Create: `apps/native/src/__tests__/LocalFileAccess.test.ts`

Security notes for this adapter:
- File type validation: only audio MIME types accepted
- Extension whitelist enforced
- Max file size: 200 MB
- Files copied to app sandbox (not keeping external references)
- No eval or path traversal possible

- [ ] **Step 1: Write the failing test**

```typescript
// apps/native/src/__tests__/LocalFileAccess.test.ts
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/com.suniplayer.app/files/',
  copyAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 * 1024 }),
}));

import { LocalFileAccess } from '../platform/LocalFileAccess';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

describe('LocalFileAccess', () => {
  const access = new LocalFileAccess();

  it('resolveURL returns file URI with audio/ prefix', () => {
    const url = access.resolveURL('song.mp3');
    expect(url).toContain('audio/');
    expect(url).toContain('song.mp3');
  });

  it('checkExists returns true when file exists', async () => {
    const exists = await access.checkExists('song.mp3');
    expect(exists).toBe(true);
  });

  it('importFile returns null when user cancels picker', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: true, assets: null
    });
    const result = await access.importFile({ type: 'picker' });
    expect(result).toBeNull();
  });

  it('importFile rejects non-audio MIME types', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///malicious.exe', name: 'malicious.exe', mimeType: 'application/octet-stream', size: 100 }]
    });
    const result = await access.importFile({ type: 'picker' });
    expect(result).toBeNull();
  });

  it('importFile copies valid audio file to app sandbox', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///downloads/song.mp3', name: 'song.mp3', mimeType: 'audio/mpeg', size: 5 * 1024 * 1024 }]
    });
    const result = await access.importFile({ type: 'picker' });
    expect(result).not.toBeNull();
    expect(FileSystem.copyAsync).toHaveBeenCalled();
    expect(result?.name).toBe('song.mp3');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/LocalFileAccess.test.ts
```

- [ ] **Step 3: Implement LocalFileAccess**

```typescript
// apps/native/src/platform/LocalFileAccess.ts
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import type { IFileAccess, ImportedFile, FileSource } from '@suniplayer/core';

// Security: only these MIME types are accepted for import
const ALLOWED_AUDIO_MIMES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a',
  'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/aiff', 'audio/x-aiff',
  'audio/flac', 'audio/x-flac',
  'audio/ogg', 'audio/vorbis',
]);

// Security: extension whitelist as second layer of validation
const ALLOWED_EXTENSIONS = new Set([
  'mp3', 'm4a', 'wav', 'aiff', 'aif', 'flac', 'ogg',
]);

// Security: max file size 200 MB — prevents accidental import of video files
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

// App-internal audio directory
const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;

function sanitizeFilename(name: string): string {
  // Remove path traversal characters and control characters
  return name
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\.\./g, '_')
    .trim();
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isAllowedFile(name: string, mimeType?: string): boolean {
  const ext = getExtension(name);
  const extOk = ALLOWED_EXTENSIONS.has(ext);
  const mimeOk = mimeType ? ALLOWED_AUDIO_MIMES.has(mimeType) : true; // lenient if MIME unknown
  return extOk && mimeOk;
}

export class LocalFileAccess implements IFileAccess {
  private async ensureAudioDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(AUDIO_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
    }
  }

  async checkExists(filePath: string): Promise<boolean> {
    const uri = this.resolveURL(filePath);
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  }

  resolveURL(filePath: string): string {
    // If already an absolute file URI, return as-is
    if (filePath.startsWith('file://')) return filePath;
    return `${AUDIO_DIR}${encodeURIComponent(filePath)}`;
  }

  async importFile(source: FileSource): Promise<ImportedFile | null> {
    if (source.type === 'url') {
      // URL import: validate the URL is https only (no file:// injection)
      if (!source.url.startsWith('https://')) {
        console.warn('[LocalFileAccess] Only HTTPS URLs are accepted for URL import');
        return null;
      }
      // Download to sandbox
      await this.ensureAudioDir();
      const filename = sanitizeFilename(source.url.split('/').pop() ?? 'audio.mp3');
      const dest = `${AUDIO_DIR}${filename}`;
      const result = await FileSystem.downloadAsync(source.url, dest);
      return { url: result.uri, name: filename };
    }

    // Picker import
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: false,
      multiple: false,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) return null;

    const asset = pickerResult.assets[0];

    // Security: validate MIME type and extension
    if (!isAllowedFile(asset.name, asset.mimeType ?? undefined)) {
      console.warn(`[LocalFileAccess] Rejected file: ${asset.name} (type: ${asset.mimeType})`);
      return null;
    }

    // Security: validate file size
    if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
      console.warn(`[LocalFileAccess] Rejected file: ${asset.name} exceeds 200MB limit`);
      return null;
    }

    await this.ensureAudioDir();
    const safeName = sanitizeFilename(asset.name);
    const dest = `${AUDIO_DIR}${safeName}`;

    // Copy to app sandbox for persistent access
    await FileSystem.copyAsync({ from: asset.uri, to: dest });

    return {
      url: dest,
      name: safeName,
      mimeType: asset.mimeType ?? undefined,
      sizeBytes: asset.size ?? undefined,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/LocalFileAccess.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/native/src/platform/LocalFileAccess.ts apps/native/src/__tests__/LocalFileAccess.test.ts
git commit -m "feat(native): add LocalFileAccess adapter with security validation"
```

---

### Task 3.5: Platform index + AsyncStorage config

**Files:**
- Create: `apps/native/src/platform/index.ts`
- Modify: `apps/native/app/_layout.tsx` — initialize stores at startup

- [ ] **Step 1: Create platform/index.ts**

```typescript
// apps/native/src/platform/index.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStorage } from '@suniplayer/core';
import { ExpoAudioEngine } from './ExpoAudioEngine';
import { SQLiteStorage } from './SQLiteStorage';
import { LocalFileAccess } from './LocalFileAccess';

// Configure Zustand stores to use AsyncStorage (instead of browser localStorage)
configureStorage(AsyncStorage);

// Singletons — one instance per app session
export const audioEngine = new ExpoAudioEngine();
export const storage = new SQLiteStorage();
export const fileAccess = new LocalFileAccess();

// Initialize storage tables on app startup
export async function initPlatform(): Promise<void> {
  await storage.init();
}
```

- [ ] **Step 2: Call initPlatform in root layout**

```tsx
// apps/native/app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initPlatform } from '../src/platform';

export default function RootLayout() {
  useEffect(() => {
    initPlatform().catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/native/src/platform/index.ts apps/native/app/_layout.tsx
git commit -m "feat(native): wire platform singletons and initialize on app startup"
```

---

## Chunk 4: Core Screens

**Goal:** Implement the four main screens with full functionality — PlayerScreen with transport controls and queue, BuilderScreen with BPM/energy/key filters, LibraryScreen with file import and track list, SettingsScreen with pedal bindings.

### File Map — Chunk 4

| Action | Path |
|--------|------|
| Create | `apps/native/src/components/TrackRow.tsx` |
| Create | `apps/native/src/components/TransportControls.tsx` |
| Create | `apps/native/src/components/ProgressBar.tsx` |
| Create | `apps/native/src/screens/PlayerScreen.tsx` |
| Create | `apps/native/src/screens/BuilderScreen.tsx` |
| Create | `apps/native/src/screens/LibraryScreen.tsx` |
| Create | `apps/native/src/screens/SettingsScreen.tsx` |
| Modify | `apps/native/app/(tabs)/index.tsx` |
| Modify | `apps/native/app/(tabs)/builder.tsx` |
| Modify | `apps/native/app/(tabs)/library.tsx` |
| Modify | `apps/native/app/(tabs)/settings.tsx` |

---

### Task 4.1: Shared components

**Files:**
- Create: `apps/native/src/components/TrackRow.tsx`
- Create: `apps/native/src/components/TransportControls.tsx`
- Create: `apps/native/src/components/ProgressBar.tsx`

- [ ] **Step 1: Create TrackRow component**

```tsx
// apps/native/src/components/TrackRow.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Track } from '@suniplayer/core';

interface TrackRowProps {
  track: Track;
  isActive?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function TrackRow({ track, isActive, onPress, onLongPress }: TrackRowProps) {
  const durationMin = Math.floor(track.duration_ms / 60000);
  const durationSec = Math.floor((track.duration_ms % 60000) / 1000)
    .toString()
    .padStart(2, '0');

  return (
    <TouchableOpacity
      style={[styles.row, isActive && styles.rowActive]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} por ${track.artist}`}
    >
      {isActive && (
        <Ionicons name="musical-note" size={16} color={colors.accent} style={styles.activeIcon} />
      )}
      <View style={styles.info}>
        <Text style={[styles.title, isActive && styles.titleActive]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.bpm}>{track.bpm} BPM</Text>
        <Text style={styles.duration}>{durationMin}:{durationSec}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56, // Minimum touch target for stage use
  },
  rowActive: { backgroundColor: colors.accentDim },
  activeIcon: { marginRight: 8 },
  info: { flex: 1, marginRight: 12 },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  titleActive: { color: colors.accent },
  artist: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  meta: { alignItems: 'flex-end' },
  bpm: { color: colors.textMuted, fontSize: 12 },
  duration: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
```

- [ ] **Step 2: Create TransportControls component**

Large touch targets (56×56pt minimum) — designed for on-stage use in dark environments.

```tsx
// apps/native/src/components/TransportControls.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function TransportControls({
  isPlaying, onPlay, onPause, onNext, onPrev, hasNext, hasPrev
}: TransportControlsProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, !hasPrev && styles.btnDisabled]}
        onPress={onPrev}
        disabled={!hasPrev}
        accessibilityLabel="Canción anterior"
        accessibilityRole="button"
      >
        <Ionicons name="play-skip-back" size={32} color={hasPrev ? colors.textPrimary : colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.playBtn}
        onPress={isPlaying ? onPause : onPlay}
        accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
        accessibilityRole="button"
      >
        <Ionicons
          name={isPlaying ? 'pause-circle' : 'play-circle'}
          size={72}
          color={colors.playButton}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, !hasNext && styles.btnDisabled]}
        onPress={onNext}
        disabled={!hasNext}
        accessibilityLabel="Siguiente canción"
        accessibilityRole="button"
      >
        <Ionicons name="play-skip-forward" size={32} color={hasNext ? colors.textPrimary : colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  btn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.3 },
  playBtn: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 3: Create ProgressBar component**

```tsx
// apps/native/src/components/ProgressBar.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { colors } from '../theme/colors';

interface ProgressBarProps {
  positionMs: number;
  durationMs: number;
  onSeek?: (posMs: number) => void;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = (total % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export function ProgressBar({ positionMs, durationMs, onSeek }: ProgressBarProps) {
  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(positionMs)}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: progress }]} />
        <View style={[styles.empty, { flex: 1 - progress }]} />
      </View>
      <Text style={styles.time}>{formatTime(durationMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  track: { flex: 1, height: 4, borderRadius: 2, flexDirection: 'row', overflow: 'hidden' },
  fill: { backgroundColor: colors.accent, minWidth: 0 },
  empty: { backgroundColor: colors.border, minWidth: 0 },
  time: { color: colors.textSecondary, fontSize: 12, width: 40, textAlign: 'center' },
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/native/src/components/
git commit -m "feat(native): add shared UI components (TrackRow, TransportControls, ProgressBar)"
```

---

### Task 4.2: PlayerScreen

**Files:**
- Create: `apps/native/src/screens/PlayerScreen.tsx`
- Modify: `apps/native/app/(tabs)/index.tsx`

- [ ] **Step 1: Implement PlayerScreen**

```tsx
// apps/native/src/screens/PlayerScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore, useSettingsStore } from '@suniplayer/core';
import type { Track } from '@suniplayer/core';
import { audioEngine } from '../platform';
import { TransportControls } from '../components/TransportControls';
import { ProgressBar } from '../components/ProgressBar';
import { TrackRow } from '../components/TrackRow';
import { colors } from '../theme/colors';

export function PlayerScreen() {
  const { width } = useWindowDimensions();
  const isIPad = width >= 768; // iPad breakpoint

  const queue = usePlayerStore(s => s.queue);
  const ci = usePlayerStore(s => s.ci);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const setCi = usePlayerStore(s => s.setCi);
  const autoNext = useSettingsStore(s => s.autoNext);

  const [positionMs, setPositionMs] = useState(0);
  const currentTrack: Track | null = queue[ci] ?? null;

  useEffect(() => {
    audioEngine.onPositionUpdate(setPositionMs);
    audioEngine.onEnded(() => {
      if (autoNext && ci < queue.length - 1) {
        setCi(ci + 1);
      } else {
        setIsPlaying(false);
      }
    });
    audioEngine.onError(err => console.error('[PlayerScreen]', err));
  }, [ci, queue.length, autoNext]);

  useEffect(() => {
    if (!currentTrack) return;
    const url = currentTrack.blob_url ?? currentTrack.file_path;
    audioEngine.load(url, {
      initialVolume: useSettingsStore.getState().defaultVol,
    });
  }, [currentTrack?.id]);

  const handlePlay = useCallback(() => {
    audioEngine.play();
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    audioEngine.pause();
    setIsPlaying(false);
  }, []);

  const handleNext = useCallback(() => {
    if (ci < queue.length - 1) setCi(ci + 1);
  }, [ci, queue.length]);

  const handlePrev = useCallback(() => {
    if (ci > 0) setCi(ci - 1);
  }, [ci]);

  const emptyState = (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>Sin set cargado</Text>
      <Text style={styles.emptySubtext}>Ve al Armador para generar un set</Text>
    </View>
  );

  if (!queue.length) return <SafeAreaView style={styles.container}>{emptyState}</SafeAreaView>;

  // iPad: split view — queue on left, controls on right
  if (isIPad) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.splitContainer}>
          <FlatList
            style={styles.queuePanel}
            data={queue}
            keyExtractor={t => t.uid ?? t.id}
            renderItem={({ item, index }) => (
              <TrackRow
                track={item}
                isActive={index === ci}
                onPress={() => setCi(index)}
              />
            )}
          />
          <View style={styles.playerPanel}>
            <NowPlaying track={currentTrack} />
            <ProgressBar
              positionMs={positionMs}
              durationMs={currentTrack?.duration_ms ?? 0}
            />
            <TransportControls
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onNext={handleNext}
              onPrev={handlePrev}
              hasNext={ci < queue.length - 1}
              hasPrev={ci > 0}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Phone/portrait: stacked layout
  return (
    <SafeAreaView style={styles.container}>
      <NowPlaying track={currentTrack} />
      <ProgressBar
        positionMs={positionMs}
        durationMs={currentTrack?.duration_ms ?? 0}
      />
      <TransportControls
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={ci < queue.length - 1}
        hasPrev={ci > 0}
      />
      <FlatList
        style={styles.queueList}
        data={queue}
        keyExtractor={t => t.uid ?? t.id}
        renderItem={({ item, index }) => (
          <TrackRow
            track={item}
            isActive={index === ci}
            onPress={() => setCi(index)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function NowPlaying({ track }: { track: Track | null }) {
  if (!track) return null;
  return (
    <View style={styles.nowPlaying}>
      <Text style={styles.trackTitle} numberOfLines={2}>{track.title}</Text>
      <Text style={styles.trackArtist}>{track.artist}</Text>
      <Text style={styles.trackMeta}>{track.bpm} BPM · {track.key}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  splitContainer: { flex: 1, flexDirection: 'row' },
  queuePanel: { width: 320, borderRightWidth: 1, borderRightColor: colors.border },
  playerPanel: { flex: 1, justifyContent: 'center', gap: 24, padding: 32 },
  queueList: { flex: 1 },
  nowPlaying: { padding: 24, alignItems: 'center' },
  trackTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  trackArtist: { color: colors.textSecondary, fontSize: 16, marginTop: 8 },
  trackMeta: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { color: colors.textPrimary, fontSize: 20, fontWeight: '600' },
  emptySubtext: { color: colors.textSecondary, fontSize: 14 },
});
```

- [ ] **Step 2: Wire PlayerScreen into tab**

```tsx
// apps/native/app/(tabs)/index.tsx
import { PlayerScreen } from '../../src/screens/PlayerScreen';
export default PlayerScreen;
```

- [ ] **Step 3: Commit**

```bash
git add apps/native/src/screens/PlayerScreen.tsx apps/native/app/\(tabs\)/index.tsx
git commit -m "feat(native): implement PlayerScreen with iPad split-view layout"
```

---

### Task 4.3: LibraryScreen (file import)

**Files:**
- Create: `apps/native/src/screens/LibraryScreen.tsx`
- Modify: `apps/native/app/(tabs)/library.tsx`

- [ ] **Step 1: Implement LibraryScreen**

```tsx
// apps/native/src/screens/LibraryScreen.tsx
import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '@suniplayer/core';
import type { Track } from '@suniplayer/core';
import { fileAccess } from '../platform';
import { TrackRow } from '../components/TrackRow';
import { colors } from '../theme/colors';

export function LibraryScreen() {
  const tracks = useLibraryStore(s => s.tracks);
  const addTrack = useLibraryStore(s => s.addTrack);
  const removeTrack = useLibraryStore(s => s.removeTrack);
  const [importing, setImporting] = React.useState(false);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const imported = await fileAccess.importFile({ type: 'picker' });
      if (!imported) return; // user canceled or file rejected

      const newTrack: Track = {
        id: `user-${Date.now()}`,
        title: imported.name.replace(/\.[^.]+$/, ''), // strip extension
        artist: 'Desconocido',
        duration_ms: 0, // will be probed later
        bpm: 120,
        key: 'C',
        energy: 0.5,
        mood: 'neutral',
        file_path: imported.url,
        analysis_cached: false,
        isCustom: true,
      };
      addTrack(newTrack);
    } catch (err) {
      Alert.alert('Error', 'No se pudo importar el archivo. Verifica que sea un audio válido.');
      console.error('[LibraryScreen] import error:', err);
    } finally {
      setImporting(false);
    }
  }, [addTrack]);

  const handleDelete = useCallback((track: Track) => {
    Alert.alert(
      'Eliminar canción',
      `¿Eliminar "${track.title}" de la biblioteca?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeTrack(track.id) },
      ]
    );
  }, [removeTrack]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <TouchableOpacity
          style={[styles.importBtn, importing && styles.importBtnDisabled]}
          onPress={handleImport}
          disabled={importing}
          accessibilityLabel="Importar archivo de audio"
          accessibilityRole="button"
        >
          {importing
            ? <ActivityIndicator color={colors.textPrimary} size="small" />
            : <Ionicons name="add" size={22} color={colors.textPrimary} />
          }
          <Text style={styles.importBtnText}>{importing ? 'Importando...' : 'Importar'}</Text>
        </TouchableOpacity>
      </View>

      {tracks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Biblioteca vacía</Text>
          <Text style={styles.emptySubtext}>Toca "Importar" para agregar canciones desde Archivos</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TrackRow
              track={item}
              onLongPress={() => handleDelete(item)}
            />
          )}
          ListFooterComponent={
            <Text style={styles.hint}>Mantén presionado para eliminar</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  importBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6, minHeight: 44 },
  importBtnDisabled: { opacity: 0.5 },
  importBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyText: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: 16 },
});
```

- [ ] **Step 2: Wire into tab**

```tsx
// apps/native/app/(tabs)/library.tsx
import { LibraryScreen } from '../../src/screens/LibraryScreen';
export default LibraryScreen;
```

- [ ] **Step 3: Commit**

```bash
git add apps/native/src/screens/LibraryScreen.tsx apps/native/app/\(tabs\)/library.tsx
git commit -m "feat(native): implement LibraryScreen with secure file import"
```

---

### Task 4.4: BuilderScreen

**Files:**
- Create: `apps/native/src/screens/BuilderScreen.tsx`
- Modify: `apps/native/app/(tabs)/builder.tsx`

- [ ] **Step 1: Implement BuilderScreen**

```tsx
// apps/native/src/screens/BuilderScreen.tsx
import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import {
  useBuilderStore, usePlayerStore, useSettingsStore,
  buildSet, catalog
} from '@suniplayer/core';
import { TrackRow } from '../components/TrackRow';
import { colors } from '../theme/colors';

export function BuilderScreen() {
  const tTarget = useBuilderStore(s => s.tTarget);
  const setTTarget = useBuilderStore(s => s.setTTarget);
  const generatedSet = useBuilderStore(s => s.generatedSet);
  const setGeneratedSet = useBuilderStore(s => s.setGeneratedSet);
  const bpmMin = useSettingsStore(s => s.bpmMin);
  const bpmMax = useSettingsStore(s => s.bpmMax);
  const setBpmMin = useSettingsStore(s => s.setBpmMin);
  const setBpmMax = useSettingsStore(s => s.setBpmMax);

  const handleBuild = useCallback(() => {
    const result = buildSet({
      catalog,
      tTargetMs: tTarget * 60 * 1000,
      bpmMin,
      bpmMax,
    });
    setGeneratedSet(result);
  }, [tTarget, bpmMin, bpmMax]);

  const handleLoad = useCallback(() => {
    if (!generatedSet.length) return;
    usePlayerStore.getState().loadQueue(generatedSet);
  }, [generatedSet]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.controls}>
        <Text style={styles.title}>Armador de Set</Text>

        <View style={styles.controlGroup}>
          <Text style={styles.label}>Duración objetivo: {tTarget} min</Text>
          <Slider
            value={tTarget}
            onValueChange={setTTarget}
            minimumValue={15}
            maximumValue={120}
            step={5}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.label}>BPM mínimo: {bpmMin}</Text>
          <Slider
            value={bpmMin}
            onValueChange={setBpmMin}
            minimumValue={40}
            maximumValue={bpmMax - 5}
            step={1}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.label}>BPM máximo: {bpmMax}</Text>
          <Slider
            value={bpmMax}
            onValueChange={setBpmMax}
            minimumValue={bpmMin + 5}
            maximumValue={220}
            step={1}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
        </View>

        <TouchableOpacity style={styles.buildBtn} onPress={handleBuild}>
          <Text style={styles.buildBtnText}>Generar Set</Text>
        </TouchableOpacity>
      </ScrollView>

      {generatedSet.length > 0 && (
        <View style={styles.result}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{generatedSet.length} canciones</Text>
            <TouchableOpacity style={styles.loadBtn} onPress={handleLoad}>
              <Text style={styles.loadBtnText}>Cargar al Reproductor</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={generatedSet}
            keyExtractor={t => t.id}
            renderItem={({ item }) => <TrackRow track={item} />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: 16, maxHeight: 320 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  controlGroup: { marginBottom: 20 },
  label: { color: colors.textSecondary, fontSize: 14, marginBottom: 8 },
  buildBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 10, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  buildBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  result: { flex: 1, borderTopWidth: 1, borderTopColor: colors.border },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  resultTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  loadBtn: { backgroundColor: colors.bgElevated, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  loadBtnText: { color: colors.accent, fontWeight: '600' },
});
```

- [ ] **Step 2: Install @react-native-community/slider**

```bash
cd apps/native
npx expo install @react-native-community/slider
```

- [ ] **Step 3: Wire into tab and commit**

```tsx
// apps/native/app/(tabs)/builder.tsx
import { BuilderScreen } from '../../src/screens/BuilderScreen';
export default BuilderScreen;
```

```bash
cd ../..
git add apps/native/src/screens/BuilderScreen.tsx apps/native/app/\(tabs\)/builder.tsx
git commit -m "feat(native): implement BuilderScreen with BPM/duration filters"
```

---

### Task 4.5: SettingsScreen + Pedal Bindings

**Files:**
- Create: `apps/native/src/screens/SettingsScreen.tsx`
- Modify: `apps/native/app/(tabs)/settings.tsx`

- [ ] **Step 1: Implement SettingsScreen**

```tsx
// apps/native/src/screens/SettingsScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@suniplayer/core';
import type { PedalAction } from '@suniplayer/core';
import { colors } from '../theme/colors';

const PEDAL_ACTIONS: { action: PedalAction; label: string }[] = [
  { action: 'next', label: 'Siguiente' },
  { action: 'prev', label: 'Anterior' },
  { action: 'play_pause', label: 'Play / Pausa' },
  { action: 'vol_up', label: 'Subir volumen' },
  { action: 'vol_down', label: 'Bajar volumen' },
];

export function SettingsScreen() {
  const autoNext = useSettingsStore(s => s.autoNext);
  const setAutoNext = useSettingsStore(s => s.setAutoNext);
  const pedalBindings = useSettingsStore(s => s.pedalBindings);
  const learningAction = useSettingsStore(s => s.learningAction);
  const setLearningAction = useSettingsStore(s => s.setLearningAction);
  const setPedalBinding = useSettingsStore(s => s.setPedalBinding);
  const clearPedalBinding = useSettingsStore(s => s.clearPedalBinding);

  // Bluetooth pedal learn mode — listens for key events from Bluetooth HID devices
  useEffect(() => {
    if (!learningAction) return;

    // React Native captures hardware key events for Bluetooth keyboards/pedals
    // via the KeyboardAvoidingView or global key handler
    // For v1: rely on the Volume button approach via react-native-volume-buttons
    // or Bluetooth keyboard HID events via a custom native module
    // This is a stub — implement platform-specific handler in v2
    const timeout = setTimeout(() => {
      setLearningAction(null); // cancel after 10s
    }, 10000);
    return () => clearTimeout(timeout);
  }, [learningAction]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Reproducción</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Auto-siguiente</Text>
          <Switch
            value={autoNext}
            onValueChange={setAutoNext}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </View>

        <Text style={styles.sectionTitle}>Pedal Bluetooth</Text>
        <Text style={styles.sectionDesc}>
          Conecta tu pedal Bluetooth al iPad y asigna cada acción a un botón.
        </Text>

        {PEDAL_ACTIONS.map(({ action, label }) => {
          const binding = pedalBindings[action];
          const isLearning = learningAction === action;
          return (
            <View key={action} style={styles.pedalRow}>
              <Text style={styles.pedalLabel}>{label}</Text>
              <View style={styles.pedalControls}>
                {binding && (
                  <Text style={styles.bindingLabel}>{binding.label}</Text>
                )}
                <TouchableOpacity
                  style={[styles.pedalBtn, isLearning && styles.pedalBtnLearning]}
                  onPress={() => setLearningAction(isLearning ? null : action)}
                >
                  <Text style={styles.pedalBtnText}>
                    {isLearning ? 'Esperando...' : binding ? 'Cambiar' : 'Asignar'}
                  </Text>
                </TouchableOpacity>
                {binding && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => clearPedalBinding(action)}
                  >
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', padding: 16, paddingBottom: 8 },
  sectionDesc: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: 16, paddingBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  rowLabel: { color: colors.textPrimary, fontSize: 16 },
  pedalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  pedalLabel: { color: colors.textPrimary, fontSize: 15, flex: 1 },
  pedalControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bindingLabel: { color: colors.accent, fontSize: 13, backgroundColor: colors.accentDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  pedalBtn: { backgroundColor: colors.bgElevated, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  pedalBtnLearning: { backgroundColor: colors.warning, opacity: 0.9 },
  pedalBtnText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  clearBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error + '33', borderRadius: 16 },
  clearBtnText: { color: colors.error, fontSize: 14 },
});
```

- [ ] **Step 2: Wire into tab and commit**

```tsx
// apps/native/app/(tabs)/settings.tsx
import { SettingsScreen } from '../../src/screens/SettingsScreen';
export default SettingsScreen;
```

```bash
cd ../..
git add apps/native/src/screens/SettingsScreen.tsx apps/native/app/\(tabs\)/settings.tsx
git commit -m "feat(native): implement SettingsScreen with pedal bindings UI"
```

---

## Chunk 5: iPad Polish, Security Hardening + TrackPlayer Service

**Goal:** Register the react-native-track-player background service (required for audio to play when screen is locked), add iPad-specific optimizations, final security audit, and EAS build setup.

### File Map — Chunk 5

| Action | Path |
|--------|------|
| Create | `apps/native/src/services/TrackPlayerService.ts` |
| Modify | `apps/native/app/_layout.tsx` — register service |
| Create | `apps/native/src/hooks/useKeyboardPedal.ts` |
| Modify | `apps/native/src/screens/SettingsScreen.tsx` — wire pedal hook |
| Create | `apps/native/eas.json` |
| Create | `apps/native/apple/docs/distribution.md` |
| Create | `apps/native/android/docs/distribution.md` |

---

### Task 5.1: Register TrackPlayer background service

This is a **hard requirement** for audio to continue when the iPad screen locks. Without it, playback stops immediately on screen lock.

- [ ] **Step 1: Create TrackPlayerService**

```typescript
// apps/native/src/services/TrackPlayerService.ts
import TrackPlayer, { Event } from 'react-native-track-player';

// This module is registered as a background service with TrackPlayer.
// It runs in a separate thread on iOS/Android, keeping audio alive
// when the app is backgrounded or the screen is locked.
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  // Lock screen seek (iOS scrubber)
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }) => {
    const { position } = await TrackPlayer.getProgress();
    TrackPlayer.seekTo(position + interval);
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }) => {
    const { position } = await TrackPlayer.getProgress();
    TrackPlayer.seekTo(Math.max(0, position - interval));
  });
}
```

- [ ] **Step 2: Register service in index.js (Expo entry point)**

In `apps/native/index.js` (create if not present):
```javascript
import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/services/TrackPlayerService';
import App from './App';

TrackPlayer.registerPlaybackService(() => PlaybackService);
registerRootComponent(App);
```

- [ ] **Step 3: Commit**

```bash
git add apps/native/src/services/TrackPlayerService.ts apps/native/index.js
git commit -m "feat(native): register TrackPlayer background service for screen-lock audio"
```

---

### Task 5.2: Bluetooth pedal hook

- [ ] **Step 1: Create useKeyboardPedal hook**

On iPad, Bluetooth pedals present as HID keyboard devices. React Native receives their key events. This hook maps those events to pedal actions.

```typescript
// apps/native/src/hooks/useKeyboardPedal.ts
import { useEffect } from 'react';
import { useSettingsStore } from '@suniplayer/core';
import type { PedalAction } from '@suniplayer/core';
import { usePlayerStore } from '@suniplayer/core';
import { audioEngine } from '../platform';

// Maps key event codes to player actions based on saved PedalBindings
export function useKeyboardPedal() {
  const pedalBindings = useSettingsStore(s => s.pedalBindings);
  const learningAction = useSettingsStore(s => s.learningAction);
  const setLearningAction = useSettingsStore(s => s.setLearningAction);
  const setPedalBinding = useSettingsStore(s => s.setPedalBinding);

  useEffect(() => {
    // React Native does not expose a global keydown listener by default.
    // On iPad with Bluetooth HID device, key events flow through TVEventHandler
    // (tvOS) or through focused component key handlers.
    // For production: use `react-native-keyevent` or handle via focused TextInput.
    // This hook sets up the dispatch logic — the actual key capture is done
    // by a transparent focused View in the PlayerScreen.

    function handleKey(keyCode: string, keyLabel: string) {
      // Learn mode: save the pressed key as a binding
      if (learningAction) {
        setPedalBinding(learningAction, { key: keyCode, label: keyLabel });
        setLearningAction(null);
        return;
      }

      // Dispatch mode: find which action this key is bound to
      const bindings = useSettingsStore.getState().pedalBindings;
      const action = (Object.entries(bindings) as [PedalAction, { key: string }][])
        .find(([_, b]) => b.key === keyCode)?.[0];

      if (!action) return;

      const playerState = usePlayerStore.getState();
      switch (action) {
        case 'next':
          if (playerState.ci < playerState.queue.length - 1) {
            playerState.setCi(playerState.ci + 1);
          }
          break;
        case 'prev':
          if (playerState.ci > 0) playerState.setCi(playerState.ci - 1);
          break;
        case 'play_pause':
          if (playerState.isPlaying) {
            audioEngine.pause();
            playerState.setIsPlaying(false);
          } else {
            audioEngine.play();
            playerState.setIsPlaying(true);
          }
          break;
        case 'vol_up': {
          const settings = useSettingsStore.getState();
          const newVol = Math.min(1, settings.defaultVol + 0.05);
          audioEngine.setVolume(newVol);
          settings.setDefaultVol(newVol);
          break;
        }
        case 'vol_down': {
          const settings = useSettingsStore.getState();
          const newVol = Math.max(0, settings.defaultVol - 0.05);
          audioEngine.setVolume(newVol);
          settings.setDefaultVol(newVol);
          break;
        }
      }
    }

    // Expose dispatcher globally so native modules can call it
    (global as typeof global & { _suniPedalDispatch?: typeof handleKey })._suniPedalDispatch = handleKey;
    return () => {
      delete (global as typeof global & { _suniPedalDispatch?: typeof handleKey })._suniPedalDispatch;
    };
  }, [pedalBindings, learningAction]);
}
```

- [ ] **Step 2: Mount hook in root layout**

```tsx
// apps/native/app/_layout.tsx — add inside RootLayout:
import { useKeyboardPedal } from '../src/hooks/useKeyboardPedal';

export default function RootLayout() {
  useEffect(() => { initPlatform().catch(console.error); }, []);
  useKeyboardPedal(); // mount once — global pedal dispatch
  // ...
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/native/src/hooks/useKeyboardPedal.ts apps/native/app/_layout.tsx
git commit -m "feat(native): add useKeyboardPedal hook for Bluetooth HID pedal dispatch"
```

---

### Task 5.3: EAS Build setup

- [ ] **Step 1: Create eas.json**

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "apk" }
    },
    "production": {
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "YOUR_APPLE_ID", "ascAppId": "YOUR_ASC_APP_ID" },
      "android": { "serviceAccountKeyPath": "./android/service-account.json" }
    }
  }
}
```

- [ ] **Step 2: Create apple/docs/distribution.md**

```markdown
# Distribution — iPad / iOS

## Development
```bash
npx expo start          # Expo Go (quick iteration)
npx expo run:ios        # Full native build (requires macOS + Xcode 15+)
```

## TestFlight
```bash
npx expo install eas-cli
eas build --platform ios --profile preview
eas submit --platform ios
```
TestFlight link will be sent to testers automatically.

## App Store
1. Bump version in `app.json`
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios`

## Required Accounts
- Apple Developer Program ($99/year)
- App Store Connect app record created
```

- [ ] **Step 3: Commit**

```bash
git add apps/native/eas.json apps/native/apple/docs/ apps/native/android/docs/
git commit -m "chore(native): add EAS build config and distribution docs"
```

---

### Task 5.4: Final verification

- [ ] **Step 1: Run all core tests**

```bash
cd packages/core && pnpm test
```
Expected: all pass

- [ ] **Step 2: Run all web tests**

```bash
cd apps/web && pnpm test
```
Expected: 113 passed (113)

- [ ] **Step 3: Run all native tests**

```bash
cd apps/native && npx jest
```
Expected: 12+ adapter tests pass

- [ ] **Step 4: Typecheck all packages**

```bash
pnpm -r typecheck
```
Expected: no errors

- [ ] **Step 5: Final commit and tag**

```bash
git add .
git commit -m "chore: monorepo + native app v1 complete — all tests passing"
git tag v1.0.0-native
```

---

## Security Checklist

Before declaring v1 complete, verify each item:

- [ ] File imports: only `audio/*` MIME types accepted (`LocalFileAccess.ts:ALLOWED_AUDIO_MIMES`)
- [ ] File imports: extension whitelist enforced (`LocalFileAccess.ts:ALLOWED_EXTENSIONS`)
- [ ] File imports: max 200 MB size limit enforced (`LocalFileAccess.ts:MAX_FILE_SIZE_BYTES`)
- [ ] Filenames sanitized: path traversal characters removed (`sanitizeFilename()`)
- [ ] URL imports: only `https://` accepted — no `file://`, `javascript:`, or `data:` URLs
- [ ] SQLite queries: parameterized (`?` placeholders) — no string concatenation
- [ ] Volume clamped to `[0, 1]` before calling native API
- [ ] No `eval()`, no `new Function()`, no dynamic `require()`
- [ ] `pnpm audit` shows no critical vulnerabilities
- [ ] iOS ATS enforced (no HTTP in production — Expo default)
