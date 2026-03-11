# Player Refactor v2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 bugs, integrate the 8 dead sub-components into the live Player.tsx, add a new PlayerSuperpowerButtons component, consolidate 30+ store selectors into grouped hooks, and expand test coverage — with zero behavior change.

**Architecture:** Pure JSX extraction of the current Player.tsx (378 lines) into focused sub-components under `src/features/player/ui/`. Logic, handlers, and derived values remain in Player.tsx. Three grouped selector hooks (`usePlaybackState`, `useDashboardState`, `usePlayerFlags`) replace the current 30+ individual selectors using Zustand's `useShallow`.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Zustand 4.5 (`useShallow` available at `zustand/react/shallow`).

**Spec:** `docs/superpowers/specs/2026-03-11-player-refactor-v2-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| MODIFY | `src/pages/Player.tsx` | Wire sub-components, fix bugs, use grouped hooks |
| CREATE | `src/features/player/usePlayerState.ts` | 3 grouped selector hooks |
| CREATE | `src/features/player/ui/PlayerSuperpowerButtons.tsx` | CROSS/FADE/METER/PARTITURA/QUEUE toggles |
| MODIFY | `src/features/player/ui/PlayerBanners.tsx` | Add isLive banner support |
| MODIFY | `src/features/player/ui/PlayerTrackHeader.tsx` | Fix timer formula (rem/durMs) |
| MODIFY | `src/features/player/ui/PlayerWaveform.tsx` | Add loading state, touch, fade props |
| MODIFY | `src/features/player/ui/PlayerControls.tsx` | Combine transport + volume |
| MODIFY | `src/features/player/ui/PlayerSetFooter.tsx` | SET ELAPSED + TOTAL REMAINING layout |
| REWRITE | `src/features/player/ui/PlayerQueueSidebar.tsx` | Stack order, profile button, mobile-responsive |
| MOVE+MODIFY | `src/components/player/LiveUnlockModal.tsx` → `src/features/player/ui/LiveUnlockModal.tsx` | Consolidate duplicate |
| MOVE+MODIFY | `src/components/player/Dashboard.tsx` → `src/features/player/ui/Dashboard.tsx` | Consolidate directory |
| DELETE | `src/features/player/ui/LiveUnlockModal.tsx` (old dead version) | Remove dead code |
| MODIFY | `src/pages/Player.test.tsx` | Expand from 2 to 10 tests |

---

## Chunk 1: Phase 1 — Bug Fixes

### Task 1: Real Waveform

**Files:**
- Modify: `src/pages/Player.tsx` (lines 83–89, 1–12)

- [ ] **Step 1: Add waveform service import to Player.tsx**

Find the import section (top of file) and add:
```tsx
import { getWaveformData } from "../services/waveformService";
```

- [ ] **Step 2: Replace fake waveform effect with real one**

Replace lines 83–89 in Player.tsx:
```tsx
// Waveform simulation
const [currentWave, setCurrentWave] = useState<number[]>([]);
useEffect(() => {
    if (!ct) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentWave(Array.from({ length: 100 }, () => 0.1 + Math.random() * 0.8));
}, [ct?.id, ct]);
```

With:
```tsx
const [currentWave, setCurrentWave] = useState<number[]>([]);
const [isLoadingWave, setIsLoadingWave] = useState(false);

useEffect(() => {
    if (!ct) return;
    const url = ct.blob_url ?? `/audio/${encodeURIComponent(ct.file_path)}`;
    setIsLoadingWave(true);
    getWaveformData(url)
        .then(setCurrentWave)
        .finally(() => setIsLoadingWave(false));
}, [ct?.id]);
```

- [ ] **Step 3: Pass `isLoadingWave` to the Wave div**

In the waveform section (around line 210), change:
```tsx
<div onClick={seek} style={{ ... }}>
    <Wave data={currentWave} progress={prog} ...
```
To:
```tsx
<div onClick={seek} style={{ ... opacity: isLoadingWave ? 0.4 : 1, transition: "opacity 0.3s" }}>
    <Wave data={currentWave.length > 0 ? currentWave : Array(100).fill(0.15)} progress={prog} ...
```

- [ ] **Step 4: Run TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Run tests**
```bash
npm test -- --run
```
Expected: All 21 tests pass.

- [ ] **Step 6: Commit**
```bash
git add src/pages/Player.tsx
git commit -m "fix: connect real waveformService instead of Math.random() placeholder"
```

---

### Task 2: Empty State Guard

**Files:**
- Modify: `src/pages/Player.tsx`

The `PlayerEmptyState` component already exists at `src/features/player/ui/PlayerEmptyState.tsx` and is ready to use.

- [ ] **Step 1: Add imports to Player.tsx**

Add to the import section:
```tsx
import { doGen, toPlayer } from "../store/useProjectStore";
import { useBuilderStore } from "../store/useBuilderStore.ts";
import { PlayerEmptyState } from "../features/player/ui/PlayerEmptyState";
```

- [ ] **Step 2: Add guard after handlers section, before return**

Insert before `return (` in Player.tsx:
```tsx
// ── Empty State Guard ────────────────────────────────────────────────────────
if (!pQueue.length) {
    return (
        <PlayerEmptyState
            onQuickLoad={() => { doGen(); setTimeout(() => toPlayer(), 50); }}
            onGoToBuilder={() => useBuilderStore.getState().setView("builder")}
        />
    );
}
```

- [ ] **Step 3: Run TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Run tests**
```bash
npm test -- --run
```
Expected: 21 pass.

- [ ] **Step 5: Commit**
```bash
git add src/pages/Player.tsx
git commit -m "fix: add empty state guard when pQueue is empty"
```

---

### Task 3: Touch Support for Waveform Seek

**Files:**
- Modify: `src/pages/Player.tsx` (seek handler + waveform JSX)

- [ ] **Step 1: Replace the `seek` handler with a shared helper + two handlers**

Find the current seek handler:
```tsx
const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLive || !ct) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    setPos(p * ct.duration_ms);
};
```

Replace with:
```tsx
const seekFromX = (clientX: number, target: HTMLElement) => {
    if (isLive || !ct) return;
    const rect = target.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * ct.duration_ms);
};
const seek = (e: React.MouseEvent<HTMLDivElement>) =>
    seekFromX(e.clientX, e.currentTarget);
const seekTouch = (e: React.TouchEvent<HTMLDivElement>) =>
    seekFromX(e.changedTouches[0].clientX, e.currentTarget);
```

- [ ] **Step 2: Add `onTouchEnd` to the waveform container div**

Find the waveform container:
```tsx
<div onClick={seek} style={{
```

Add `onTouchEnd`:
```tsx
<div onClick={seek} onTouchEnd={seekTouch} style={{
```

- [ ] **Step 3: Run TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Run tests + commit**
```bash
npm test -- --run
git add src/pages/Player.tsx
git commit -m "fix: add touch support for waveform seek (onTouchEnd)"
```

---

### Task 4: Consolidate Duplicate LiveUnlockModal

**Files:**
- Move: `src/components/player/LiveUnlockModal.tsx` → `src/features/player/ui/LiveUnlockModal.tsx`
- Delete: `src/features/player/ui/LiveUnlockModal.tsx` (the old dead version)
- Modify: `src/pages/Player.tsx` (import path)

- [ ] **Step 1: Read the USED version (src/components/player/LiveUnlockModal.tsx)**

Verify this is the working version currently imported by Player.tsx.

- [ ] **Step 2: Overwrite the dead version with the content of the used version**

Copy content of `src/components/player/LiveUnlockModal.tsx` into `src/features/player/ui/LiveUnlockModal.tsx`.

The file at `src/features/player/ui/LiveUnlockModal.tsx` already exists (dead code). Overwrite it with the working content.

- [ ] **Step 3: Delete the original from src/components/player/**
```bash
rm src/components/player/LiveUnlockModal.tsx
```

- [ ] **Step 4: Update import in Player.tsx**

Change:
```tsx
import { LiveUnlockModal } from "../components/player/LiveUnlockModal";
```
To:
```tsx
import { LiveUnlockModal } from "../features/player/ui/LiveUnlockModal";
```

- [ ] **Step 5: TypeScript check + tests + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add -A
git commit -m "refactor: consolidate duplicate LiveUnlockModal into features/player/ui/"
```

---

## Chunk 2: Phase 2A — Foundation (Selector Hooks + PlayerSuperpowerButtons)

### Task 5: Create `usePlayerState.ts` — Grouped Selector Hooks

**Files:**
- Create: `src/features/player/usePlayerState.ts`

This replaces the 30+ individual `useProjectStore(s => s.XXX)` calls in Player.tsx with three grouped hooks using Zustand's `useShallow` for efficient batched subscriptions.

- [ ] **Step 1: Create the file**

```typescript
// src/features/player/usePlayerState.ts
import { useProjectStore } from "../../store/useProjectStore";
import { useShallow } from "zustand/react/shallow";

/**
 * Core playback state — re-renders only when these values actually change.
 * Replaces 14 individual useProjectStore calls in Player.tsx.
 */
export const usePlaybackState = () =>
    useProjectStore(
        useShallow(s => ({
            pQueue:        s.pQueue,
            ci:            s.ci,
            pos:           s.pos,
            playing:       s.playing,
            vol:           s.vol,
            mode:          s.mode,
            elapsed:       s.elapsed,
            stackOrder:    s.stackOrder,
            setPos:        s.setPos,
            setCi:         s.setCi,
            setPlaying:    s.setPlaying,
            setVol:        s.setVol,
            setMode:       s.setMode,
            setPQueue:     s.setPQueue,
            setStackOrder: s.setStackOrder,
        }))
    );

/**
 * Dashboard controls — re-renders only when fade/crossfade/SPL values change.
 * Replaces 16 individual useProjectStore calls in Player.tsx.
 */
export const useDashboardState = () =>
    useProjectStore(
        useShallow(s => ({
            fadeEnabled:        s.fadeEnabled,
            setFadeEnabled:     s.setFadeEnabled,
            fadeInMs:           s.fadeInMs,
            setFadeInMs:        s.setFadeInMs,
            fadeOutMs:          s.fadeOutMs,
            setFadeOutMs:       s.setFadeOutMs,
            fadeExpanded:       s.fadeExpanded,
            setFadeExpanded:    s.setFadeExpanded,
            crossfade:          s.crossfade,
            setCrossfade:       s.setCrossfade,
            crossfadeMs:        s.crossfadeMs,
            setCrossfadeMs:     s.setCrossfadeMs,
            crossExpanded:      s.crossExpanded,
            setCrossExpanded:   s.setCrossExpanded,
            splMeterEnabled:    s.splMeterEnabled,
            setSplMeterEnabled: s.setSplMeterEnabled,
            splMeterTarget:     s.splMeterTarget,
            splMeterExpanded:   s.splMeterExpanded,
            setSplMeterExpanded:s.setSplMeterExpanded,
        }))
    );

/**
 * Misc flags — isSimulating only.
 */
export const usePlayerFlags = () =>
    useProjectStore(
        useShallow(s => ({
            isSimulating: s.isSimulating,
        }))
    );
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors. If `useShallow` is not found, check Zustand version: it's available in `zustand/react/shallow` since v4.3.

- [ ] **Step 3: Commit**
```bash
git add src/features/player/usePlayerState.ts
git commit -m "feat: add grouped Zustand selector hooks (usePlaybackState, useDashboardState, usePlayerFlags)"
```

---

### Task 6: Create `PlayerSuperpowerButtons`

**Files:**
- Create: `src/features/player/ui/PlayerSuperpowerButtons.tsx`

Extracts the 5 toggle buttons (CROSS, FADE, METER, PARTITURA, QUEUE) from Player.tsx lines 190–199.

- [ ] **Step 1: Create the component**

```tsx
// src/features/player/ui/PlayerSuperpowerButtons.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    crossfade:        boolean;
    fadeEnabled:      boolean;
    splMeterEnabled:  boolean;
    hasSheetMusic:    boolean;
    onToggleCross:    () => void;
    onToggleFade:     () => void;
    onToggleMeter:    () => void;
    onShowSheet:      () => void;
    onToggleQueue:    () => void;
}

const btn = (
    active: boolean,
    color: string,
    onClick: () => void,
    label: string,
    extraStyle?: React.CSSProperties,
) => (
    <button
        onClick={onClick}
        style={{
            padding: "10px 16px",
            borderRadius: THEME.radius.md,
            border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
            background: active ? color + "20" : "transparent",
            color: active ? color : THEME.colors.text.muted,
            fontSize: 11,
            fontWeight: 900,
            cursor: "pointer",
            transition: "all 0.15s",
            ...extraStyle,
        }}
    >
        {label}
    </button>
);

export const PlayerSuperpowerButtons: React.FC<Props> = ({
    crossfade, fadeEnabled, splMeterEnabled, hasSheetMusic,
    onToggleCross, onToggleFade, onToggleMeter, onShowSheet, onToggleQueue,
}) => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {btn(crossfade,       THEME.colors.brand.cyan,   onToggleCross,  "CROSS")}
        {btn(fadeEnabled,     THEME.colors.brand.cyan,   onToggleFade,   "FADE")}
        {btn(splMeterEnabled, THEME.colors.brand.violet, onToggleMeter,  "METER")}
        {hasSheetMusic && btn(false, THEME.colors.brand.violet, onShowSheet, "PARTITURA")}

        {/* Queue toggle — separate, right-aligned */}
        <button
            onClick={onToggleQueue}
            style={{
                marginLeft: "auto",
                width: 44, height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: "none",
                color: "white",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="8"  y1="6"  x2="21" y2="6"  />
                <line x1="8"  y1="12" x2="21" y2="12" />
                <line x1="8"  y1="18" x2="21" y2="18" />
                <line x1="3"  y1="6"  x2="3.01" y2="6"  />
                <line x1="3"  y1="12" x2="3.01" y2="12" />
                <line x1="3"  y1="18" x2="3.01" y2="18" />
            </svg>
        </button>
    </div>
);
```

- [ ] **Step 2: TypeScript check + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add src/features/player/ui/PlayerSuperpowerButtons.tsx
git commit -m "feat: add PlayerSuperpowerButtons sub-component"
```

---

## Chunk 3: Phase 2B — Update Existing Sub-components

### Task 7: Update `PlayerBanners`

**Files:**
- Modify: `src/features/player/ui/PlayerBanners.tsx`

Current version only shows simulation banner. Update to also show a Live mode indicator banner.

- [ ] **Step 1: Rewrite PlayerBanners.tsx**

```tsx
// src/features/player/ui/PlayerBanners.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    isLive:       boolean;
    isSimulating: boolean;
    playing:      boolean;
}

export const PlayerBanners: React.FC<Props> = ({ isLive, isSimulating, playing }) => (
    <>
        {isLive && (
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", borderRadius: THEME.radius.md,
                backgroundColor: `${THEME.colors.brand.cyan}10`,
                border: `1px solid ${THEME.colors.brand.cyan}30`,
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={THEME.colors.brand.cyan} strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{ fontSize: 12, color: THEME.colors.brand.cyan, fontWeight: 700 }}>
                    LIVE MODE — Cola y seek bloqueados
                </span>
            </div>
        )}

        {isSimulating && playing && (
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", borderRadius: THEME.radius.md,
                backgroundColor: `${THEME.colors.status.warning}10`,
                border: `1px solid ${THEME.colors.status.warning}30`,
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={THEME.colors.status.warning} strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: 12, color: THEME.colors.status.warning, fontWeight: 700 }}>
                    MODO SIMULACIÓN ACTIVO
                </span>
            </div>
        )}
    </>
);
```

- [ ] **Step 2: TypeScript check + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add src/features/player/ui/PlayerBanners.tsx
git commit -m "refactor: update PlayerBanners to match current Player.tsx (add live banner)"
```

---

### Task 8: Update `PlayerTrackHeader`

**Files:**
- Modify: `src/features/player/ui/PlayerTrackHeader.tsx`

Update timer formula: now uses `rem` (remaining ms for current track) and `durMs` instead of set elapsed.

- [ ] **Step 1: Rewrite PlayerTrackHeader.tsx**

```tsx
// src/features/player/ui/PlayerTrackHeader.tsx
import React from "react";
import { Track } from "../../../types";
import { THEME } from "../../../data/theme.ts";
import { fmt } from "../../../services/uiUtils.ts";
import { mc } from "../../../services/uiUtils.ts";

interface Props {
    ct:    Track | undefined;
    rem:   number;   // remaining ms for current track
    durMs: number;   // total ms for current track
    tCol:  string;   // timer color (playing ? mCol : muted)
    tPct:  number;   // progress 0–1 (pos / durMs)
    mCol:  string;   // mood color
}

export const PlayerTrackHeader: React.FC<Props> = ({ ct, rem, tCol, tPct, mCol }) => (
    <header style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 20,
    }}>
        {/* Left: title + artist + metadata badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
                fontSize: 36, fontWeight: 900, margin: 0,
                letterSpacing: "-0.03em", lineHeight: 1.1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
                {ct?.title || "--"}
            </h1>
            <p style={{ fontSize: 18, color: THEME.colors.text.muted, margin: "4px 0 16px" }}>
                {ct?.artist || "--"}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ct && (
                    <>
                        <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: THEME.colors.brand.cyan + "15", color: THEME.colors.brand.cyan, fontWeight: 800 }}>
                            {ct.bpm} BPM
                        </span>
                        <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: THEME.colors.brand.violet + "15", color: THEME.colors.brand.violet, fontWeight: 800 }}>
                            {ct.key}
                        </span>
                        <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: mc(ct.mood) + "15", color: mc(ct.mood), fontWeight: 800 }}>
                            {ct.mood}
                        </span>
                    </>
                )}
            </div>
        </div>

        {/* Right: circular timer */}
        <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                <circle
                    cx="50" cy="50" r="44"
                    fill="none" stroke={tCol} strokeWidth="6"
                    strokeDasharray="276.5"
                    strokeDashoffset={276.5 * (1 - tPct)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s linear" }}
                />
            </svg>
            <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
            }}>
                <span style={{ fontSize: 18, fontWeight: 900, fontFamily: THEME.fonts.mono }}>
                    {fmt(rem)}
                </span>
                <span style={{ fontSize: 8, opacity: 0.4, textTransform: "uppercase" }}>restante</span>
            </div>
        </div>
    </header>
);
```

- [ ] **Step 2: TypeScript check + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add src/features/player/ui/PlayerTrackHeader.tsx
git commit -m "refactor: update PlayerTrackHeader with correct timer formula"
```

---

### Task 9: Update `PlayerWaveform`

**Files:**
- Modify: `src/features/player/ui/PlayerWaveform.tsx`

Add: `isLoading` prop (opacity + placeholder), `onSeekTouch` prop, full fade props for `Wave` component.

- [ ] **Step 1: Rewrite PlayerWaveform.tsx**

```tsx
// src/features/player/ui/PlayerWaveform.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Wave } from "../../../components/common/Wave.tsx";
import { fmt } from "../../../services/uiUtils.ts";

interface Props {
    waveData:    number[];
    isLoading:   boolean;
    prog:        number;
    pos:         number;
    durationMs:  number;
    mCol:        string;
    isLive:      boolean;
    playing:     boolean;
    fadeEnabled: boolean;
    fadeInMs:    number;
    fadeOutMs:   number;
    onSeek:      (e: React.MouseEvent<HTMLDivElement>) => void;
    onSeekTouch: (e: React.TouchEvent<HTMLDivElement>) => void;
}

export const PlayerWaveform: React.FC<Props> = ({
    waveData, isLoading, prog, pos, durationMs, mCol, isLive, playing,
    fadeEnabled, fadeInMs, fadeOutMs, onSeek, onSeekTouch,
}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
            onClick={onSeek}
            onTouchEnd={onSeekTouch}
            style={{
                height: 160,
                backgroundColor: "rgba(255,255,255,0.01)",
                border: `1px solid ${isLive ? THEME.colors.brand.cyan + "20" : THEME.colors.border}`,
                borderRadius: THEME.radius.xl,
                position: "relative",
                cursor: isLive ? "default" : "pointer",
                overflow: "hidden",
                opacity: isLoading ? 0.4 : 1,
                transition: "opacity 0.3s",
            }}
        >
            <Wave
                data={waveData.length > 0 ? waveData : Array(100).fill(0.15)}
                progress={prog}
                color={mCol}
                fadeEnabled={fadeEnabled}
                fadeInMs={fadeInMs}
                fadeOutMs={fadeOutMs}
                totalMs={durationMs}
            />

            {/* Playhead */}
            <div style={{
                position: "absolute", top: 0, bottom: 0,
                left: `${prog * 100}%`, width: 3,
                background: mCol, boxShadow: `0 0 20px ${mCol}`,
                zIndex: 5, transition: "left 0.1s linear",
            }} />

            {/* Live mode protection overlay */}
            {isLive && playing && (
                <div style={{
                    position: "absolute", top: 12, left: 12,
                    padding: "6px 14px", borderRadius: 6,
                    background: THEME.colors.brand.cyan + "30",
                    border: `1px solid ${THEME.colors.brand.cyan}50`,
                    color: THEME.colors.brand.cyan,
                    fontSize: 10, fontWeight: 900,
                }}>
                    LIVE MODE PROTECTED
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <span style={{ fontSize: 10, color: THEME.colors.text.muted, opacity: 0.6 }}>
                        Analizando audio…
                    </span>
                </div>
            )}
        </div>

        {/* Timestamps */}
        <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 13, fontFamily: THEME.fonts.mono, opacity: 0.5,
        }}>
            <span>{fmt(pos)}</span>
            <span>-{fmt(Math.max(0, durationMs - pos))}</span>
        </div>
    </div>
);
```

- [ ] **Step 2: TypeScript check + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add src/features/player/ui/PlayerWaveform.tsx
git commit -m "refactor: update PlayerWaveform with loading state, touch support, fade props"
```

---

### Task 10: Update `PlayerControls`

**Files:**
- Modify: `src/features/player/ui/PlayerControls.tsx`

Matches current Player.tsx layout exactly: transport buttons + volume slider in the same component.

- [ ] **Step 1: Rewrite PlayerControls.tsx**

```tsx
// src/features/player/ui/PlayerControls.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    playing:         boolean;
    isLive:          boolean;
    ci:              number;
    queueLen:        number;
    vol:             number;
    mCol:            string;
    onPlayPause:     () => void;
    onPrev:          () => void;
    onNext:          () => void;
    onVolumeChange:  (v: number) => void;
}

export const PlayerControls: React.FC<Props> = ({
    playing, isLive, ci, queueLen, vol, mCol,
    onPlayPause, onPrev, onNext, onVolumeChange,
}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Transport Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 48 }}>
            <button
                onClick={onPrev}
                title={isLive ? "Bloqueado en modo Live" : "Anterior"}
                style={{
                    background: "none", border: "none",
                    opacity: !isLive && ci > 0 ? 0.9 : 0.2,
                    cursor: !isLive && ci > 0 ? "pointer" : "default",
                }}
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
            </button>

            <button
                onClick={onPlayPause}
                style={{
                    width: 88, height: 88, borderRadius: "50%",
                    border: "none", background: THEME.gradients.brand,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: playing ? `0 0 40px ${mCol}50` : "0 10px 30px rgba(0,0,0,0.5)",
                    transition: "box-shadow 0.2s, transform 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
                {playing
                    ? <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    : <svg width="36" height="36" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 6 }}><path d="M8 5v14l11-7z" /></svg>
                }
            </button>

            <button
                onClick={onNext}
                title={isLive ? "Bloqueado en modo Live" : "Siguiente"}
                style={{
                    background: "none", border: "none",
                    opacity: !isLive && ci < queueLen - 1 ? 0.9 : 0.2,
                    cursor: !isLive && ci < queueLen - 1 ? "pointer" : "default",
                }}
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
            </button>
        </div>

        {/* Volume Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "0 10px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <div style={{ flex: 1, position: "relative", height: 10 }}>
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.06)", borderRadius: 5 }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${vol * 100}%`, background: THEME.gradients.brand, borderRadius: 5, boxShadow: `0 0 10px ${mCol}30` }} />
                <input
                    type="range" min="0" max="100" value={Math.round(vol * 100)}
                    onChange={e => onVolumeChange(parseInt(e.target.value) / 100)}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                />
            </div>
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: THEME.fonts.mono, color: mCol, width: 50 }}>
                {Math.round(vol * 100)}%
            </span>
        </div>
    </div>
);
```

- [ ] **Step 2: TypeScript check + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add src/features/player/ui/PlayerControls.tsx
git commit -m "refactor: update PlayerControls with transport + volume combined"
```

---

### Task 11: Update `PlayerSetFooter`

**Files:**
- Modify: `src/features/player/ui/PlayerSetFooter.tsx`

Update to match current Player.tsx: SET ELAPSED + TOTAL REMAINING counters + progress bar + mode toggle.

- [ ] **Step 1: Rewrite PlayerSetFooter.tsx**

```tsx
// src/features/player/ui/PlayerSetFooter.tsx
import React from "react";
import { Track } from "../../../types";
import { THEME } from "../../../data/theme.ts";
import { fmtM } from "../../../services/uiUtils.ts";
import { sumTrackDurationMs } from "../../../utils/trackMetrics.ts";

interface Props {
    elapsed:       number;   // set elapsed seconds (from store)
    qTot:          number;   // total queue duration ms
    pQueue:        Track[];
    ci:            number;
    pos:           number;   // current track position ms
    isLive:        boolean;
    mCol:          string;
    onModeToggle:  () => void;
}

export const PlayerSetFooter: React.FC<Props> = ({
    elapsed, qTot, pQueue, ci, pos, isLive, mCol, onModeToggle,
}) => {
    const playedMs = sumTrackDurationMs(pQueue.slice(0, ci)) + pos;
    const remainingMs = Math.max(0, qTot - playedMs);
    const progress = Math.min(100, (playedMs / (qTot || 1)) * 100);

    return (
        <div style={{
            marginTop: "auto",
            padding: "24px",
            borderRadius: THEME.radius.xl,
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${isLive ? THEME.colors.brand.cyan + "25" : THEME.colors.border}`,
            display: "flex", flexDirection: "column", gap: 20,
            transition: "border-color 0.4s",
        }}>
            {/* Elapsed / Remaining counters */}
            <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 900, letterSpacing: 1.5 }}>SET ELAPSED</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono }}>
                            {fmtM(elapsed * 1000)}
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 900, letterSpacing: 1.5 }}>TOTAL REMAINING</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: mCol, fontFamily: THEME.fonts.mono }}>
                            {fmtM(remainingMs)}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{
                        height: "100%", width: `${progress}%`,
                        background: THEME.gradients.brand,
                        transition: "width 0.5s",
                    }} />
                </div>
            </div>

            {/* Footer row: total label + mode toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.4 }}>
                    Total Set: {fmtM(qTot)}
                </span>
                <button
                    onClick={onModeToggle}
                    style={{
                        padding: "10px 24px",
                        borderRadius: THEME.radius.full,
                        background: isLive ? THEME.colors.brand.cyan + "20" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isLive ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`,
                        color: isLive ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                        fontSize: 12, fontWeight: 900, cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                >
                    {isLive ? "EXIT LIVE" : "ENTER LIVE"}
                </button>
            </div>
        </div>
    );
};
```

- [ ] **Step 2: TypeScript check + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add src/features/player/ui/PlayerSetFooter.tsx
git commit -m "refactor: update PlayerSetFooter with elapsed/remaining layout"
```

---

### Task 12: Rewrite `PlayerQueueSidebar`

**Files:**
- Modify: `src/features/player/ui/PlayerQueueSidebar.tsx`

Full rewrite to match current Player.tsx sidebar (lines 270–370): stack order badges, profile button, drag-drop, mobile-responsive.

- [ ] **Step 1: Rewrite PlayerQueueSidebar.tsx**

```tsx
// src/features/player/ui/PlayerQueueSidebar.tsx
import React from "react";
import { Track } from "../../../types";
import { THEME } from "../../../data/theme.ts";

interface Props {
    pQueue:         Track[];
    ci:             number;
    isLive:         boolean;
    mCol:           string;
    stackOrder:     string[];
    playing:        boolean;
    isMobile:       boolean;
    showQueue:      boolean;
    onQueueClick:   (track: Track) => void;
    onDrop:         (dragIdx: number, targetIdx: number) => void;
    onProfileTrack: (track: Track) => void;
    onClose:        () => void;
}

export const PlayerQueueSidebar: React.FC<Props> = ({
    pQueue, ci, isLive, mCol, stackOrder, playing, isMobile, showQueue,
    onQueueClick, onDrop, onProfileTrack, onClose,
}) => (
    <aside style={{
        position: isMobile ? "fixed" : "relative",
        right: 0, top: 0, bottom: 0,
        width: showQueue ? (isMobile ? "min(360px, 100vw)" : "360px") : 0,
        transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        backgroundColor: THEME.colors.panel,
        borderLeft: `1px solid ${showQueue ? THEME.colors.border : "transparent"}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        zIndex: 1001,
        boxShadow: showQueue && isMobile ? "-10px 0 30px rgba(0,0,0,0.5)" : "none",
    }}>
        <div style={{ width: isMobile ? "min(360px, 100vw)" : 360, height: "100%", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ padding: "24px", borderBottom: `1px solid ${THEME.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 900, margin: 0, opacity: 0.8, letterSpacing: "0.05em" }}>
                        SETLIST QUEUE
                    </h2>
                    <span style={{ fontSize: 11, fontWeight: 800, color: THEME.colors.text.muted }}>
                        {pQueue.length} Tracks
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: "none", border: "none", color: THEME.colors.text.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = THEME.colors.text.muted; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Track list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                {pQueue.map((t, i) => {
                    const stackIdx = stackOrder.indexOf(t.id);
                    const isActive = ci === i;

                    return (
                        <div
                            key={t.id}
                            onClick={() => onQueueClick(t)}
                            draggable={!isLive}
                            onDragStart={e => e.dataTransfer.setData("idx", i.toString())}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => onDrop(parseInt(e.dataTransfer.getData("idx")), i)}
                            style={{
                                padding: "14px", borderRadius: THEME.radius.md, marginBottom: 6,
                                cursor: "pointer",
                                background: isActive ? `${mCol}15` : "rgba(255,255,255,0.03)",
                                border: `1px solid ${isActive ? mCol + "40" : "transparent"}`,
                                display: "flex", gap: 14, alignItems: "center",
                                transition: "all 0.2s",
                                opacity: isActive ? 1 : 0.8,
                            }}
                        >
                            {/* Track number */}
                            <span style={{ fontFamily: THEME.fonts.mono, fontSize: 11, opacity: 0.3, minWidth: 20 }}>
                                {String(i + 1).padStart(2, "0")}
                            </span>

                            {/* Track info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "white" : THEME.colors.text.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {t.title}
                                </div>
                                <div style={{ fontSize: 11, color: THEME.colors.text.muted, fontWeight: 600 }}>
                                    {t.artist.toUpperCase()}
                                </div>
                            </div>

                            {/* LIVE: stack priority badge */}
                            {isLive && stackIdx !== -1 && (
                                <div style={{
                                    backgroundColor: THEME.colors.brand.cyan, color: "black",
                                    width: 22, height: 22, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 10, fontWeight: 900,
                                    boxShadow: `0 0 15px ${THEME.colors.brand.cyan}60`,
                                }}>
                                    {stackIdx + 1}
                                </div>
                            )}

                            {/* EDIT: profile button */}
                            {!isLive && (
                                <button
                                    onClick={e => { e.stopPropagation(); onProfileTrack(t); }}
                                    style={{ background: "none", border: "none", color: THEME.colors.text.muted, cursor: "pointer", opacity: 0.5, padding: 0, display: "flex" }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </button>
                            )}

                            {/* Playing indicator */}
                            {isActive && playing && (
                                <div style={{ display: "flex", gap: 3, height: 16, alignItems: "flex-end" }}>
                                    <div style={{ width: 3, height: "60%", background: mCol }} />
                                    <div style={{ width: 3, height: "100%", background: mCol }} />
                                    <div style={{ width: 3, height: "40%", background: mCol }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    </aside>
);
```

- [ ] **Step 2: TypeScript check + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add src/features/player/ui/PlayerQueueSidebar.tsx
git commit -m "refactor: rewrite PlayerQueueSidebar to match current Player.tsx (stack order, profile, mobile)"
```

---

## Chunk 4: Phase 2C — Directory Migration + Player.tsx Wiring

### Task 13: Move Dashboard to `features/player/ui/`

**Files:**
- Read: `src/components/player/Dashboard.tsx`
- Create: `src/features/player/ui/Dashboard.tsx`
- Delete: `src/components/player/Dashboard.tsx`
- Modify: `src/pages/Player.tsx` (import path)

- [ ] **Step 1: Copy Dashboard.tsx to new location**

Read `src/components/player/Dashboard.tsx` completely, then create `src/features/player/ui/Dashboard.tsx` with the same content but update the internal import:

Change:
```tsx
import { SplMeter } from "../common/SplMeter";
```
To:
```tsx
import { SplMeter } from "../../../components/common/SplMeter";
```

All other content stays identical.

- [ ] **Step 2: Delete original**
```bash
rm src/components/player/Dashboard.tsx
```

If `src/components/player/` is now empty, remove it:
```bash
rmdir src/components/player/ 2>/dev/null || true
```

- [ ] **Step 3: Update Player.tsx import**

Change:
```tsx
import { Dashboard } from "../components/player/Dashboard";
```
To:
```tsx
import { Dashboard } from "../features/player/ui/Dashboard";
```

- [ ] **Step 4: TypeScript check + tests + commit**
```bash
npx tsc --noEmit
npm test -- --run
git add -A
git commit -m "refactor: move Dashboard to features/player/ui/ and remove src/components/player/"
```

---

### Task 14: Wire Player.tsx with All Sub-components and Selector Hooks

**Files:**
- Modify: `src/pages/Player.tsx` (full rewrite)

This is the final wiring step. Replace the entire contents of Player.tsx with the composition-only version. **Read the current file first to verify its latest state before overwriting.**

- [ ] **Step 1: Read current Player.tsx to get latest state**

Do a full read of `src/pages/Player.tsx` before making changes.

- [ ] **Step 2: Replace Player.tsx with wired version**

```tsx
// src/pages/Player.tsx
import React, { useEffect, useState } from "react";
import { useProjectStore, setTrackTrim, updateTrackMetadata, doGen, toPlayer } from "../store/useProjectStore";
import { useBuilderStore } from "../store/useBuilderStore.ts";
import { THEME } from "../data/theme.ts";
import { mc } from "../services/uiUtils.ts";
import { sumTrackDurationMs } from "../utils/trackMetrics.ts";
import { getWaveformData } from "../services/waveformService";
import { TrackTrimmer } from "../components/common/TrackTrimmer";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { SheetMusicViewer } from "../components/common/SheetMusicViewer";
import { Track } from "../types";
import { usePlaybackState, useDashboardState, usePlayerFlags } from "../features/player/usePlayerState";
import { LiveUnlockModal }          from "../features/player/ui/LiveUnlockModal";
import { PlayerEmptyState }         from "../features/player/ui/PlayerEmptyState";
import { PlayerBanners }            from "../features/player/ui/PlayerBanners";
import { PlayerTrackHeader }        from "../features/player/ui/PlayerTrackHeader";
import { PlayerSuperpowerButtons }  from "../features/player/ui/PlayerSuperpowerButtons";
import { Dashboard }                from "../features/player/ui/Dashboard";
import { PlayerWaveform }           from "../features/player/ui/PlayerWaveform";
import { PlayerControls }           from "../features/player/ui/PlayerControls";
import { PlayerSetFooter }          from "../features/player/ui/PlayerSetFooter";
import { PlayerQueueSidebar }       from "../features/player/ui/PlayerQueueSidebar";

// ── Player Page ───────────────────────────────────────────────────────────────
export const Player: React.FC = () => {
    const {
        pQueue, ci, pos, playing, vol, mode, elapsed, stackOrder,
        setPos, setCi, setPlaying, setVol, setMode, setPQueue, setStackOrder,
    } = usePlaybackState();
    const dash = useDashboardState();
    const { isSimulating } = usePlayerFlags();

    // ── UI State ──
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [trimmingTrack,   setTrimmingTrack]   = useState<Track | null>(null);
    const [profileTrack,    setProfileTrack]    = useState<Track | null>(null);
    const [showSheetViewer, setShowSheetViewer] = useState(false);
    const [showQueue,       setShowQueue]       = useState(window.innerWidth > 1000);
    const [isMobile,        setIsMobile]        = useState(window.innerWidth < 800);
    const [currentWave,     setCurrentWave]     = useState<number[]>([]);
    const [isLoadingWave,   setIsLoadingWave]   = useState(false);

    // ── Effects ──
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 800);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const ct = pQueue[ci];
    const isLive = mode === "live";

    useEffect(() => {
        if (!ct) return;
        const url = ct.blob_url ?? `/audio/${encodeURIComponent(ct.file_path)}`;
        setIsLoadingWave(true);
        getWaveformData(url).then(setCurrentWave).finally(() => setIsLoadingWave(false));
    }, [ct?.id]);

    // ── Derived values ──
    const mCol  = mc(ct?.mood);
    const tCol  = playing ? mCol : THEME.colors.text.muted;
    const durMs = ct?.duration_ms || 1;
    const rem   = Math.max(0, durMs - pos);
    const tPct  = Math.min(1, pos / durMs);
    const prog  = pos / durMs;
    const qTot  = sumTrackDurationMs(pQueue);

    // ── Empty state ──
    if (!pQueue.length) {
        return (
            <PlayerEmptyState
                onQuickLoad={() => { doGen(); setTimeout(() => toPlayer(), 50); }}
                onGoToBuilder={() => useBuilderStore.getState().setView("builder")}
            />
        );
    }

    // ── Handlers ──
    const seekFromX = (clientX: number, target: HTMLElement) => {
        if (isLive || !ct) return;
        const rect = target.getBoundingClientRect();
        setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * ct.duration_ms);
    };
    const seek      = (e: React.MouseEvent<HTMLDivElement>)  => seekFromX(e.clientX, e.currentTarget);
    const seekTouch = (e: React.TouchEvent<HTMLDivElement>)  => seekFromX(e.changedTouches[0].clientX, e.currentTarget);

    const handleModeToggle = () => {
        if (isLive) setShowUnlockModal(true);
        else setMode("live");
    };

    const handleQueueClick = (track: Track) => {
        if (isLive) {
            if (ct?.id === track.id) return;
            setStackOrder((prev: string[]) =>
                prev.includes(track.id)
                    ? prev.filter(id => id !== track.id)
                    : [...prev, track.id]
            );
            return;
        }
        const idx = pQueue.findIndex(t => t.id === track.id);
        if (idx !== -1) { setCi(idx); setPos(0); setStackOrder([]); }
    };

    const handleDrop = (dragIdx: number, targetIndex: number) => {
        if (isLive) return;
        const newQueue = [...pQueue];
        const [movedItem] = newQueue.splice(dragIdx, 1);
        newQueue.splice(targetIndex, 0, movedItem);
        setPQueue(newQueue);
        setStackOrder([]);
        if (ci === dragIdx) setCi(targetIndex);
        else if (ci > dragIdx && ci <= targetIndex) setCi(ci - 1);
        else if (ci < dragIdx && ci >= targetIndex) setCi(ci + 1);
    };

    // ── Render ──
    return (
        <div style={{ height: "100%", width: "100%", display: "flex", backgroundColor: THEME.colors.bg, color: THEME.colors.text.primary, overflow: "hidden" }}>

            {showUnlockModal && (
                <LiveUnlockModal
                    onConfirm={() => { setMode("edit"); setShowUnlockModal(false); }}
                    onCancel={() => setShowUnlockModal(false)}
                />
            )}

            {/* Main content column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", overflowY: "auto", gap: 32 }}>
                    <PlayerBanners isLive={isLive} isSimulating={isSimulating} playing={playing} />
                    <PlayerTrackHeader ct={ct} rem={rem} durMs={durMs} tCol={tCol} tPct={tPct} mCol={mCol} />
                    <PlayerSuperpowerButtons
                        crossfade={dash.crossfade}
                        fadeEnabled={dash.fadeEnabled}
                        splMeterEnabled={dash.splMeterEnabled}
                        hasSheetMusic={!!(ct?.sheetMusic && ct.sheetMusic.length > 0)}
                        onToggleCross={() => dash.setCrossfade(!dash.crossfade)}
                        onToggleFade={() => dash.setFadeEnabled(!dash.fadeEnabled)}
                        onToggleMeter={() => dash.setSplMeterEnabled(!dash.splMeterEnabled)}
                        onShowSheet={() => setShowSheetViewer(true)}
                        onToggleQueue={() => setShowQueue(q => !q)}
                    />
                    <Dashboard
                        fadeEnabled={dash.fadeEnabled}
                        fadeInMs={dash.fadeInMs}       setFadeInMs={dash.setFadeInMs}
                        fadeOutMs={dash.fadeOutMs}     setFadeOutMs={dash.setFadeOutMs}
                        fadeExpanded={dash.fadeExpanded} setFadeExpanded={dash.setFadeExpanded}
                        crossfade={dash.crossfade}
                        crossfadeMs={dash.crossfadeMs} setCrossfadeMs={dash.setCrossfadeMs}
                        crossExpanded={dash.crossExpanded} setCrossExpanded={dash.setCrossExpanded}
                        splMeterEnabled={dash.splMeterEnabled}
                        splMeterTarget={dash.splMeterTarget}
                        splMeterExpanded={dash.splMeterExpanded} setSplMeterExpanded={dash.setSplMeterExpanded}
                    />
                    <PlayerWaveform
                        waveData={currentWave}
                        isLoading={isLoadingWave}
                        prog={prog}
                        pos={pos}
                        durationMs={durMs}
                        mCol={mCol}
                        isLive={isLive}
                        playing={playing}
                        fadeEnabled={dash.fadeEnabled}
                        fadeInMs={dash.fadeInMs}
                        fadeOutMs={dash.fadeOutMs}
                        onSeek={seek}
                        onSeekTouch={seekTouch}
                    />
                    <PlayerControls
                        playing={playing}
                        isLive={isLive}
                        ci={ci}
                        queueLen={pQueue.length}
                        vol={vol}
                        mCol={mCol}
                        onPlayPause={() => setPlaying(!playing)}
                        onPrev={() => { if (!isLive && ci > 0) { setCi(ci - 1); setPos(0); } }}
                        onNext={() => { if (!isLive && ci < pQueue.length - 1) { setCi(ci + 1); setPos(0); } }}
                        onVolumeChange={v => setVol(v)}
                    />
                    <PlayerSetFooter
                        elapsed={elapsed}
                        qTot={qTot}
                        pQueue={pQueue}
                        ci={ci}
                        pos={pos}
                        isLive={isLive}
                        mCol={mCol}
                        onModeToggle={handleModeToggle}
                    />
                </main>
            </div>

            {/* Mobile backdrop */}
            {showQueue && isMobile && (
                <div
                    onClick={() => setShowQueue(false)}
                    style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 1000, animation: "fadeIn 0.3s ease-out" }}
                />
            )}

            <PlayerQueueSidebar
                pQueue={pQueue}
                ci={ci}
                isLive={isLive}
                mCol={mCol}
                stackOrder={stackOrder}
                playing={playing}
                isMobile={isMobile}
                showQueue={showQueue}
                onQueueClick={handleQueueClick}
                onDrop={handleDrop}
                onProfileTrack={t => setProfileTrack(t)}
                onClose={() => setShowQueue(false)}
            />

            {/* Modals */}
            {trimmingTrack && (
                <TrackTrimmer
                    track={trimmingTrack}
                    onSave={(s, e) => { setTrackTrim(trimmingTrack.id, s, e); setTrimmingTrack(null); }}
                    onCancel={() => setTrimmingTrack(null)}
                />
            )}
            {profileTrack && (
                <TrackProfileModal
                    track={profileTrack}
                    onSave={u => { updateTrackMetadata(profileTrack.id, u); setProfileTrack(null); }}
                    onCancel={() => setProfileTrack(null)}
                />
            )}
            {showSheetViewer && ct?.sheetMusic && (
                <SheetMusicViewer items={ct.sheetMusic} onClose={() => setShowSheetViewer(false)} />
            )}
        </div>
    );
};
```

- [ ] **Step 3: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors. Fix any TypeScript errors before continuing.

- [ ] **Step 4: Run all tests**
```bash
npm test -- --run
```
Expected: All 21 tests pass.

- [ ] **Step 5: Verify line count**
```bash
wc -l src/pages/Player.tsx
```
Expected: ~110 lines (down from 378).

- [ ] **Step 6: Commit**
```bash
git add src/pages/Player.tsx
git commit -m "refactor: wire all sub-components into Player.tsx, replace 30+ selectors with grouped hooks

- Player.tsx reduced from 378 to ~110 lines
- All logic/handlers remain in Player.tsx
- Sub-components receive data via typed props
- usePlaybackState / useDashboardState / usePlayerFlags hooks replace individual selectors
- Zero behavior change"
```

---

## Chunk 5: Phase 3 — Tests

### Task 15: Expand `Player.test.tsx`

**Files:**
- Modify: `src/pages/Player.test.tsx`

Expand from 2 tests to 10. Keep existing tests passing, add 8 new ones.

- [ ] **Step 1: Read current Player.test.tsx**

Read the full file to understand existing setup before modifying.

- [ ] **Step 2: Replace with expanded test suite**

```tsx
// src/pages/Player.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Player } from "./Player";
import { useProjectStore } from "../store/useProjectStore";
import { TRACKS } from "../data/tracks";

// Mock the waveform service so tests don't fetch audio
vi.mock("../services/waveformService", () => ({
    getWaveformData: vi.fn().mockResolvedValue(Array(100).fill(0.5)),
}));

// Helper: reset all stores to clean state
function resetStores() {
    localStorage.clear();
    const { getInitialState } = useProjectStore as any;
    if (getInitialState) {
        useProjectStore.setState(getInitialState());
    } else {
        useProjectStore.setState({
            pQueue: [], ci: 0, pos: 0, playing: false, vol: 0.8, mode: "edit",
            elapsed: 0, stackOrder: [], tTarget: 0,
            fadeEnabled: false, crossfade: false, splMeterEnabled: false,
            crossfadeMs: 2000, fadeInMs: 1000, fadeOutMs: 1000,
            fadeExpanded: false, crossExpanded: false, splMeterExpanded: false,
            splMeterTarget: "small", isSimulating: false,
        });
    }
}

const sampleTrack = TRACKS[0];
const twoTracks   = TRACKS.slice(0, 2);

describe("Player", () => {

    beforeEach(resetStores);

    // ── Existing tests ─────────────────────────────────────────────────────────

    it("shows the empty state when no set is loaded", () => {
        render(<Player />);
        expect(screen.getByText(/No hay set cargado/i)).toBeTruthy();
    });

    it("renders the current track metadata when a queue exists", () => {
        useProjectStore.setState({ pQueue: [sampleTrack], ci: 0 });
        render(<Player />);
        expect(screen.getByText(sampleTrack.title)).toBeTruthy();
    });

    // ── New tests ──────────────────────────────────────────────────────────────

    it("shows track artist and BPM badge", () => {
        useProjectStore.setState({ pQueue: [sampleTrack], ci: 0 });
        render(<Player />);
        expect(screen.getByText(sampleTrack.artist)).toBeTruthy();
        expect(screen.getByText(`${sampleTrack.bpm} BPM`)).toBeTruthy();
    });

    it("play button toggles playing state", () => {
        useProjectStore.setState({ pQueue: [sampleTrack], ci: 0, playing: false });
        render(<Player />);
        // The play button is the big circle — find it by its SVG play path
        const playBtn = screen.getAllByRole("button").find(b =>
            b.style.borderRadius === "50%" && b.style.width === "88px"
        ) ?? screen.getAllByRole("button")[2]; // fallback: 3rd button (Prev, Play, Next)
        fireEvent.click(playBtn!);
        expect(useProjectStore.getState().playing).toBe(true);
    });

    it("ENTER LIVE button switches to live mode", () => {
        useProjectStore.setState({ pQueue: [sampleTrack], ci: 0, mode: "edit" });
        render(<Player />);
        const liveBtn = screen.getByText("ENTER LIVE");
        fireEvent.click(liveBtn);
        expect(useProjectStore.getState().mode).toBe("live");
    });

    it("EXIT LIVE button shows the unlock modal, not immediately switching", () => {
        useProjectStore.setState({ pQueue: [sampleTrack], ci: 0, mode: "live" });
        render(<Player />);
        const exitBtn = screen.getByText("EXIT LIVE");
        fireEvent.click(exitBtn);
        // Modal should appear, mode should NOT have changed yet
        expect(useProjectStore.getState().mode).toBe("live");
        // Modal content should be visible
        expect(screen.queryByRole("dialog") ?? document.querySelector("[style*='position: fixed']")).toBeTruthy();
    });

    it("CROSS button toggles crossfade", () => {
        useProjectStore.setState({ pQueue: [sampleTrack], ci: 0, crossfade: false });
        render(<Player />);
        fireEvent.click(screen.getByText("CROSS"));
        expect(useProjectStore.getState().crossfade).toBe(true);
    });

    it("FADE button toggles fadeEnabled", () => {
        useProjectStore.setState({ pQueue: [sampleTrack], ci: 0, fadeEnabled: false });
        render(<Player />);
        fireEvent.click(screen.getByText("FADE"));
        expect(useProjectStore.getState().fadeEnabled).toBe(true);
    });

    it("METER button toggles splMeterEnabled", () => {
        useProjectStore.setState({ pQueue: [sampleTrack], ci: 0, splMeterEnabled: false });
        render(<Player />);
        fireEvent.click(screen.getByText("METER"));
        expect(useProjectStore.getState().splMeterEnabled).toBe(true);
    });

    it("queue shows all tracks with track numbers", () => {
        useProjectStore.setState({ pQueue: twoTracks, ci: 0 });
        render(<Player />);
        // Both tracks should be visible
        expect(screen.getByText(twoTracks[0].title)).toBeTruthy();
        expect(screen.getByText(twoTracks[1].title)).toBeTruthy();
        // Track numbers
        expect(screen.getByText("01")).toBeTruthy();
        expect(screen.getByText("02")).toBeTruthy();
    });
});
```

- [ ] **Step 3: Run new tests**
```bash
npm test -- --run src/pages/Player.test.tsx
```
Expected: 10/10 pass. If any fail, debug and fix before committing. Common issues:
- `TRACKS[0]` undefined → check TRACKS import path
- Store state shape mismatch → check `useProjectStore.setState` keys match actual store
- `waveformService` mock not working → ensure `vi.mock` path matches actual import

- [ ] **Step 4: Run full test suite**
```bash
npm test -- --run
```
Expected: All tests pass (21 original + new ones).

- [ ] **Step 5: Commit**
```bash
git add src/pages/Player.test.tsx
git commit -m "test: expand Player tests from 2 to 10 (mode toggle, superpower buttons, queue)"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `npx tsc --noEmit` exits with 0 errors
- [ ] `npm test -- --run` all tests pass
- [ ] `wc -l src/pages/Player.tsx` → ~110 lines (was 378)
- [ ] `src/features/player/ui/` has exactly 9 files: LiveUnlockModal, PlayerEmptyState, PlayerBanners, PlayerTrackHeader, PlayerSuperpowerButtons, PlayerWaveform, PlayerControls, PlayerSetFooter, PlayerQueueSidebar, Dashboard (10 with Dashboard)
- [ ] `src/components/player/` directory no longer exists
- [ ] Player.tsx imports from `../features/player/ui/` only (no more `../components/player/`)
- [ ] Waveform uses `getWaveformData` (no `Math.random`)
- [ ] Empty state shows when `pQueue.length === 0`
- [ ] Touch seek works (`onTouchEnd` present on waveform container)
- [ ] All `useProjectStore` selectors in Player.tsx replaced by the 3 grouped hooks
