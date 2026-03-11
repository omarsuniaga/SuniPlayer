# Player.tsx Partition Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `src/pages/Player.tsx` (1034 lines) into 8 focused presentational sub-components with zero behavior change.

**Architecture:** Pure JSX extraction — all logic, state, handlers, and derived values stay in `Player.tsx`. Eight components under `src/features/player/ui/` each receive what they need as props. TypeScript compilation is the primary correctness gate.

**Tech Stack:** React 18, TypeScript, Vite, Vitest. No new libraries.

---

## Notes on Current File State

- `Player.tsx` has a `LiveUnlockModal` defined at **module scope** (lines 14–119). Extract this directly to its own file.
- The file also contains `TrackTrimmer` (imported + rendered at root of return, lines 1193–1202). This is a separate feature component — it **stays in `Player.tsx`** after extraction.
- A **trimming button** inside the queue sidebar calls `setTrimmingTrack(t)`. `PlayerQueueSidebar` needs an `onTrimTrack` prop for this (minor extension beyond the approved spec).
- `Wave` and `mc` imports become unused in `Player.tsx` after extraction — remove them.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/player/ui/LiveUnlockModal.tsx` | **CREATE** | Confirmation dialog: Live → Edit mode |
| `src/features/player/ui/PlayerEmptyState.tsx` | **CREATE** | Full-screen empty state when queue is empty |
| `src/features/player/ui/PlayerBanners.tsx` | **CREATE** | Live Lock + Simulation banners |
| `src/features/player/ui/PlayerTrackHeader.tsx` | **CREATE** | Track title, artist, badges, timer circle |
| `src/features/player/ui/PlayerWaveform.tsx` | **CREATE** | Waveform + seek + timestamps |
| `src/features/player/ui/PlayerControls.tsx` | **CREATE** | Prev/Play/Next transport + volume slider |
| `src/features/player/ui/PlayerSetFooter.tsx` | **CREATE** | Set progress bar + Export + Mode toggle |
| `src/features/player/ui/PlayerQueueSidebar.tsx` | **CREATE** | Full sidebar: queue, pool, coming-up-next |
| `src/pages/Player.tsx` | **EDIT** | Remove extracted JSX, import + compose sub-components |

---

## Chunk 1: Simple Presentational Components (Tasks 1–4)

### Task 1: `LiveUnlockModal`

**Files:**
- Create: `src/features/player/ui/LiveUnlockModal.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/features/player/ui
```

- [ ] **Step 2: Create `LiveUnlockModal.tsx`**

```tsx
// src/features/player/ui/LiveUnlockModal.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    onConfirm: () => void;
    onCancel: () => void;
}

export const LiveUnlockModal: React.FC<Props> = ({ onConfirm, onCancel }) => (
    <>
        {/* Backdrop */}
        <div
            onClick={onCancel}
            style={{
                position: "fixed", inset: 0,
                backgroundColor: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 900,
                animation: "fadeIn 0.15s ease-out",
            }}
        />
        {/* Dialog */}
        <div
            style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 910,
                backgroundColor: "#14141f",
                border: `1px solid ${THEME.colors.brand.cyan}40`,
                borderRadius: THEME.radius.xl,
                padding: "32px 28px",
                width: "min(420px, 90vw)",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                boxShadow: `0 0 60px ${THEME.colors.brand.cyan}15, 0 30px 60px rgba(0,0,0,0.6)`,
                animation: "slideUp 0.2s ease-out",
            }}
        >
            {/* Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                    width: 48, height: 48,
                    borderRadius: THEME.radius.lg,
                    backgroundColor: `${THEME.colors.status.warning}15`,
                    border: `1px solid ${THEME.colors.status.warning}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.status.warning} strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Salir del modo Live</h3>
                    <p style={{ fontSize: 13, color: THEME.colors.text.muted, margin: "4px 0 0" }}>El reproductor está actualmente bloqueado</p>
                </div>
            </div>

            {/* Message */}
            <p style={{ fontSize: 14, color: THEME.colors.text.secondary, lineHeight: 1.6, margin: 0 }}>
                Estás a punto de desbloquear el reproductor durante una{" "}
                <strong style={{ color: "white" }}>presentación en vivo</strong>.
                Esto permitirá cambiar tracks, reordenar la cola y alterar la reproducción.
                <br /><br />
                ¿Confirmas que quieres activar el{" "}
                <strong style={{ color: THEME.colors.brand.violet }}>modo Edit</strong>?
            </p>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        backgroundColor: "transparent",
                        color: THEME.colors.text.secondary,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirm}
                    style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.status.warning}50`,
                        backgroundColor: `${THEME.colors.status.warning}15`,
                        color: THEME.colors.status.warning,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = `${THEME.colors.status.warning}25`}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = `${THEME.colors.status.warning}15`}
                >
                    Sí, desbloquear
                </button>
            </div>
        </div>
    </>
);
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors related to this file.

- [ ] **Step 4: Commit**

```bash
git add src/features/player/ui/LiveUnlockModal.tsx
git commit -m "feat: add LiveUnlockModal sub-component (player partition step 1)"
```

---

### Task 2: `PlayerEmptyState`

**Files:**
- Create: `src/features/player/ui/PlayerEmptyState.tsx`

- [ ] **Step 1: Create `PlayerEmptyState.tsx`**

```tsx
// src/features/player/ui/PlayerEmptyState.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    onQuickLoad: () => void;
    onGoToBuilder: () => void;
}

export const PlayerEmptyState: React.FC<Props> = ({ onQuickLoad, onGoToBuilder }) => (
    <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 24, padding: 40, textAlign: "center",
    }}>
        <div style={{
            width: 80, height: 80, borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: `1px solid ${THEME.colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13M9 10L21 8M6 15a3 3 0 100 6 3 3 0 000-6zm12-2a3 3 0 100 6 3 3 0 000-6z" />
            </svg>
        </div>
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>No hay set cargado</h2>
            <p style={{ fontSize: 14, color: THEME.colors.text.muted, margin: 0, lineHeight: 1.6 }}>
                Genera un set en el Builder y pulsa<br />
                <strong style={{ color: THEME.colors.text.secondary }}>"Send to Player"</strong>, o carga uno rápido aquí.
            </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
            <button
                onClick={onQuickLoad}
                style={{
                    padding: "14px", borderRadius: THEME.radius.md, border: "none",
                    background: THEME.gradients.brand, color: "white", fontSize: 14,
                    fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: `0 8px 24px ${THEME.colors.brand.cyan}30`,
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                Generar Set Rápido (45 min)
            </button>
            <button
                onClick={onGoToBuilder}
                style={{
                    padding: "12px", borderRadius: THEME.radius.md,
                    border: `1px solid ${THEME.colors.border}`,
                    backgroundColor: "transparent", color: THEME.colors.text.secondary,
                    fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
                Ir al Builder →
            </button>
        </div>
    </div>
);
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/player/ui/PlayerEmptyState.tsx
git commit -m "feat: add PlayerEmptyState sub-component (player partition step 2)"
```

---

### Task 3: `PlayerBanners`

**Files:**
- Create: `src/features/player/ui/PlayerBanners.tsx`

- [ ] **Step 1: Create `PlayerBanners.tsx`**

```tsx
// src/features/player/ui/PlayerBanners.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    isLive: boolean;
    isSimulating: boolean;
    playing: boolean;
}

export const PlayerBanners: React.FC<Props> = ({ isLive, isSimulating, playing }) => (
    <>
        {/* ── Live Lock Banner ── */}
        {isLive && (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderRadius: THEME.radius.md,
                    backgroundColor: `${THEME.colors.brand.cyan}08`,
                    border: `1px solid ${THEME.colors.brand.cyan}25`,
                    animation: "fadeIn 0.3s ease-out",
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{ fontSize: 12, color: THEME.colors.brand.cyan, fontWeight: 700, letterSpacing: "0.04em" }}>
                    LIVE LOCK ACTIVO — La reproducción está protegida
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: THEME.colors.text.muted }}>
                    Espacio para pausar · Flechas bloqueadas
                </span>
            </div>
        )}

        {/* ── Simulation Mode Indicator ── */}
        {isSimulating && playing && (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: THEME.radius.md,
                    backgroundColor: `${THEME.colors.status.warning}08`,
                    border: `1px solid ${THEME.colors.status.warning}30`,
                    animation: "fadeIn 0.3s ease-out",
                }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.status.warning} strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: 11, color: THEME.colors.status.warning, fontWeight: 700, letterSpacing: "0.04em" }}>
                    MODO SIMULACIÓN — Sin archivos de audio reales
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: THEME.colors.text.muted }}>
                    Usa la pestaña "Library" para seleccionar tu música local
                </span>
            </div>
        )}
    </>
);
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/player/ui/PlayerBanners.tsx
git commit -m "feat: add PlayerBanners sub-component (player partition step 3)"
```

---

### Task 4: `PlayerTrackHeader`

**Files:**
- Create: `src/features/player/ui/PlayerTrackHeader.tsx`

- [ ] **Step 1: Create `PlayerTrackHeader.tsx`**

```tsx
// src/features/player/ui/PlayerTrackHeader.tsx
import React from "react";
import { Track } from "../../../types";
import { THEME } from "../../../data/theme.ts";
import { fmt, mc } from "../../../services/uiUtils.ts";

interface Props {
    ct: Track | undefined;
    rem: number;
    tCol: string;
    tPct: number;
}

export const PlayerTrackHeader: React.FC<Props> = ({ ct, rem, tCol, tPct }) => (
    <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }} className="title-xl">
                {ct?.title || "--"}
            </h1>
            <p style={{ fontSize: 16, color: THEME.colors.text.muted, margin: "4px 0 0" }}>{ct?.artist}</p>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {ct && (
                    <>
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: THEME.colors.brand.cyan + "15", color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>
                            {ct.bpm} BPM
                        </span>
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: THEME.colors.brand.violet + "15", color: THEME.colors.brand.violet, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>
                            {ct.key}
                        </span>
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: mc(ct.mood) + "15", color: mc(ct.mood), fontWeight: 700, textTransform: "capitalize" }}>
                            {ct.mood}
                        </span>
                    </>
                )}
            </div>
        </div>

        {/* Timer Circle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: 100, height: 100 }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke={tCol}
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        strokeDashoffset={`${2 * Math.PI * 44 * (1 - tPct)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                    />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 700, fontFamily: THEME.fonts.mono, color: tCol }}>{fmt(rem * 1000)}</span>
                    <span style={{ fontSize: 9, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1 }}>Remaining</span>
                </div>
            </div>
        </div>
    </header>
);
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/player/ui/PlayerTrackHeader.tsx
git commit -m "feat: add PlayerTrackHeader sub-component (player partition step 4)"
```

---

## Chunk 2: Waveform, Controls, Footer (Tasks 5–7)

### Task 5: `PlayerWaveform`

**Files:**
- Create: `src/features/player/ui/PlayerWaveform.tsx`

- [ ] **Step 1: Create `PlayerWaveform.tsx`**

```tsx
// src/features/player/ui/PlayerWaveform.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Wave } from "../../../components/common/Wave.tsx";
import { fmt } from "../../../services/uiUtils.ts";

interface Props {
    waveData: number[];
    prog: number;
    mCol: string;
    isLive: boolean;
    pos: number;
    durationMs: number;
    onSeek: (e: React.MouseEvent) => void;
}

export const PlayerWaveform: React.FC<Props> = ({ waveData, prog, mCol, isLive, pos, durationMs, onSeek }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
            onClick={onSeek}
            style={{
                cursor: isLive ? "not-allowed" : "pointer",
                borderRadius: THEME.radius.xl,
                padding: "12px 0",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: `1px solid ${isLive ? THEME.colors.brand.cyan + "20" : THEME.colors.border}`,
                position: "relative",
                opacity: isLive ? 0.85 : 1,
                transition: "border-color 0.3s",
                minHeight: 76,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            <Wave data={waveData} progress={prog} color={mCol} />
            {/* Playhead */}
            <div
                style={{
                    position: "absolute",
                    top: 4, bottom: 4,
                    left: `${prog * 100}%`,
                    width: 3,
                    backgroundColor: mCol,
                    borderRadius: 2,
                    boxShadow: `0 0 15px ${mCol}`,
                    transition: "left 0.25s linear",
                }}
            />
            {/* Live lock overlay */}
            {isLive && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: THEME.radius.xl,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "transparent",
                }}>
                    <span style={{ fontSize: 10, color: THEME.colors.brand.cyan, opacity: 0.4, fontWeight: 700, letterSpacing: "0.1em" }}>SEEK BLOQUEADO</span>
                </div>
            )}
        </div>
        {/* Timestamps */}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: THEME.fonts.mono, fontSize: 12, color: THEME.colors.text.muted, padding: "0 8px" }}>
            <span>{fmt(pos)}</span>
            <span>-{fmt(Math.max(0, durationMs - pos))}</span>
        </div>
    </div>
);
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/player/ui/PlayerWaveform.tsx
git commit -m "feat: add PlayerWaveform sub-component (player partition step 5)"
```

---

### Task 6: `PlayerControls`

**Files:**
- Create: `src/features/player/ui/PlayerControls.tsx`

- [ ] **Step 1: Create `PlayerControls.tsx`**

```tsx
// src/features/player/ui/PlayerControls.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    playing: boolean;
    isLive: boolean;
    ci: number;
    queueLen: number;
    vol: number;
    mCol: string;
    onPlayPause: () => void;
    onPrev: () => void;
    onNext: () => void;
    onVolumeChange: (v: number) => void;
}

export const PlayerControls: React.FC<Props> = ({
    playing, isLive, ci, queueLen, vol, mCol,
    onPlayPause, onPrev, onNext, onVolumeChange,
}) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* Prev — blocked in live */}
            <button
                onClick={onPrev}
                title={isLive ? "Bloqueado en modo Live" : "Anterior"}
                style={{
                    background: "none", border: "none",
                    cursor: isLive ? "not-allowed" : "pointer",
                    opacity: isLive ? 0.15 : ci > 0 ? 0.6 : 0.1,
                    transition: "opacity 0.2s",
                    position: "relative",
                }}
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>

            {/* Play/Pause — always allowed */}
            <button
                onClick={onPlayPause}
                style={{
                    width: 80, height: 80,
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    background: THEME.gradients.brand,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: playing ? `0 0 40px ${mCol}40` : "0 10px 30px rgba(0,0,0,0.5)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
                {playing
                    ? <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    : <svg width="32" height="32" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 4 }}><path d="M8 5v14l11-7z" /></svg>
                }
            </button>

            {/* Next — blocked in live */}
            <button
                onClick={onNext}
                title={isLive ? "Bloqueado en modo Live" : "Siguiente"}
                style={{
                    background: "none", border: "none",
                    cursor: isLive ? "not-allowed" : "pointer",
                    opacity: isLive ? 0.15 : ci < queueLen - 1 ? 0.6 : 0.1,
                    transition: "opacity 0.2s",
                }}
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
        </div>

        {/* Volume — ALWAYS UNLOCKED */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={THEME.colors.text.muted}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
            <input
                type="range" min="0" max="100"
                value={Math.round(vol * 100)}
                onChange={e => onVolumeChange(parseInt(e.target.value) / 100)}
                className="vol-slider"
                style={{
                    width: 200,
                    appearance: "none",
                    height: 4,
                    borderRadius: 2,
                    background: `linear-gradient(to right, ${mCol} ${vol * 100}%, rgba(255,255,255,0.08) ${vol * 100}%)`,
                    outline: "none",
                    cursor: "pointer",
                }}
            />
            <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: THEME.colors.text.muted, width: 40 }}>{Math.round(vol * 100)}%</span>
        </div>
    </div>
);
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/player/ui/PlayerControls.tsx
git commit -m "feat: add PlayerControls sub-component (player partition step 6)"
```

---

### Task 7: `PlayerSetFooter`

**Files:**
- Create: `src/features/player/ui/PlayerSetFooter.tsx`

- [ ] **Step 1: Create `PlayerSetFooter.tsx`**

```tsx
// src/features/player/ui/PlayerSetFooter.tsx
import React from "react";
import { Track } from "../../../types";
import { THEME } from "../../../data/theme.ts";
import { fmtM } from "../../../services/uiUtils.ts";
import { sumTrackDurationMs } from "../../../utils/trackMetrics.ts";

interface Props {
    pQueue: Track[];
    ci: number;
    pos: number;
    qTot: number;
    isLive: boolean;
    mCol: string;
    onExport: () => void;
    onModeToggle: () => void;
}

export const PlayerSetFooter: React.FC<Props> = ({ pQueue, ci, pos, qTot, isLive, mCol, onExport, onModeToggle }) => (
    <div style={{
        marginTop: "auto", padding: "24px",
        borderRadius: THEME.radius.xl,
        backgroundColor: THEME.colors.surface,
        border: `1px solid ${isLive ? THEME.colors.brand.cyan + "20" : THEME.colors.border}`,
        display: "flex", alignItems: "center", gap: 20,
        transition: "border-color 0.4s",
    }}>
        <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.text.muted }}>SET PROGRESS</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: mCol, fontFamily: THEME.fonts.mono }}>{fmtM(qTot)} TOTAL</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div
                    style={{
                        height: "100%",
                        width: `${Math.min(100, (sumTrackDurationMs(pQueue.slice(0, ci)) + pos) / (qTot || 1) * 100)}%`,
                        background: THEME.gradients.brand,
                        transition: "width 0.5s ease-out",
                    }}
                />
            </div>
        </div>

        {/* Export Set Button — Edit mode only */}
        {!isLive && (
            <button
                onClick={onExport}
                title="Exportar lista del set como .txt"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: THEME.radius.full,
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    border: `1px solid ${THEME.colors.border}`,
                    color: THEME.colors.text.muted,
                    transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = THEME.colors.brand.violet + "60";
                    e.currentTarget.style.color = THEME.colors.brand.violet;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = THEME.colors.border;
                    e.currentTarget.style.color = THEME.colors.text.muted;
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Export</span>
            </button>
        )}

        {/* Mode Toggle Button */}
        <button
            onClick={onModeToggle}
            title={isLive ? "Haz clic para desbloquear (pedirá confirmación)" : "Activar modo Live — bloquea la reproducción"}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                borderRadius: THEME.radius.full,
                cursor: "pointer",
                backgroundColor: isLive ? THEME.colors.brand.cyan + "15" : THEME.colors.surfaceHover,
                border: `1px solid ${isLive ? THEME.colors.brand.cyan + "50" : THEME.colors.border}`,
                transition: "all 0.25s",
                boxShadow: isLive ? `0 0 20px ${THEME.colors.brand.cyan}10` : "none",
            }}
        >
            {isLive
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.text.muted} strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
            }
            <span style={{ fontSize: 12, color: isLive ? THEME.colors.brand.cyan : THEME.colors.text.muted, fontWeight: 700 }}>
                {isLive ? "LIVE" : "EDIT"}
            </span>
        </button>
    </div>
);
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/player/ui/PlayerSetFooter.tsx
git commit -m "feat: add PlayerSetFooter sub-component (player partition step 7)"
```

---

## Chunk 3: Queue Sidebar (Task 8)

### Task 8: `PlayerQueueSidebar`

**Files:**
- Create: `src/features/player/ui/PlayerQueueSidebar.tsx`

**Note:** The approved spec's props interface is extended with `onTrimTrack` to support the trimming button that exists in the sidebar's queue list. No behavior changes — just wires through the existing `setTrimmingTrack` from `Player.tsx`.

- [ ] **Step 1: Create `PlayerQueueSidebar.tsx`**

```tsx
// src/features/player/ui/PlayerQueueSidebar.tsx
import React from "react";
import { Track } from "../../../types";
import { THEME } from "../../../data/theme.ts";
import { fmt } from "../../../services/uiUtils.ts";

interface Props {
    pQueue: Track[];
    ci: number;
    isLive: boolean;
    mCol: string;
    masterPool: Track[];
    stackOrder: string[];
    dropTarget: number | null;
    editingNotes: string | null;
    dragIdx: React.MutableRefObject<number | null>;
    onDragStart: (i: number) => void;
    onDragOver: (e: React.DragEvent, i: number) => void;
    onDrop: (e: React.DragEvent, i: number) => void;
    onDragEnd: () => void;
    onQueueClick: (track: Track, idx: number) => void;
    onTogglePool: (track: Track) => void;
    onSetNotes: (id: string, notes: string) => void;
    onEditNotes: (id: string | null) => void;
    onTrimTrack: (track: Track) => void;
}

export const PlayerQueueSidebar: React.FC<Props> = ({
    pQueue, ci, isLive, mCol, masterPool, stackOrder,
    dropTarget, editingNotes, dragIdx,
    onDragStart, onDragOver, onDrop, onDragEnd,
    onQueueClick, onTogglePool, onSetNotes, onEditNotes, onTrimTrack,
}) => {
    const poolTracks = masterPool.filter(t => !pQueue.some(p => p.id === t.id));

    return (
        <aside className="desktop-sidebar" style={{ width: 340, backgroundColor: THEME.colors.panel, borderLeft: `1px solid ${THEME.colors.border}`, display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${THEME.colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isLive && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2.5" strokeLinecap="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 700, color: isLive ? THEME.colors.brand.cyan : THEME.colors.text.primary }}>
                            {isLive ? "COLA · LOCKED" : "COLA · EDIT"}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: THEME.colors.text.muted, fontFamily: THEME.fonts.mono }}>
                            {pQueue.length}/{masterPool.length}
                        </span>
                        <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, fontWeight: 700, color: mCol }}>{pQueue.length} activas</span>
                    </div>
                </div>
                {!isLive && (
                    <p style={{ fontSize: 11, color: THEME.colors.text.muted, margin: "8px 0 0", lineHeight: 1.4 }}>
                        Click en una pista para añadir/quitar de la cola de reproducción
                    </p>
                )}
            </div>

            {/* Queue list */}
            <div style={{ flex: 1, overflowY: "auto" }}>

                {/* ── ACTIVE QUEUE ── */}
                <div style={{ padding: "8px 8px 0" }}>
                    {isLive && (
                        <div style={{ fontSize: 10, color: THEME.colors.brand.violet, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, padding: "4px 8px 8px" }}>
                            Toca para apilar el orden ▼
                        </div>
                    )}
                    {pQueue.map((t, i) => {
                        const stackIdx = stackOrder.indexOf(t.id);
                        const isStacked = stackIdx !== -1;
                        const isCurrent = i === ci;

                        return (
                            <div
                                key={t.id + "q" + i}
                                draggable={!isLive && !isCurrent}
                                onDragStart={() => onDragStart(i)}
                                onDragOver={e => onDragOver(e, i)}
                                onDrop={e => onDrop(e, i)}
                                onDragEnd={onDragEnd}
                                onClick={() => onQueueClick(t, i)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 10px 10px 8px",
                                    borderRadius: THEME.radius.md,
                                    cursor: isCurrent ? "default" : (isLive ? "pointer" : "grab"),
                                    backgroundColor: isCurrent
                                        ? `${THEME.colors.brand.cyan}12`
                                        : dropTarget === i ? `${THEME.colors.brand.violet}18`
                                            : isStacked ? `${THEME.colors.brand.violet}10` : "transparent",
                                    borderTop: !isLive && dropTarget === i && dragIdx.current !== null && dragIdx.current !== i
                                        ? `2px solid ${THEME.colors.brand.violet}`
                                        : "2px solid transparent",
                                    borderLeft: isCurrent
                                        ? `3px solid ${THEME.colors.brand.cyan}`
                                        : isStacked ? `3px solid ${THEME.colors.brand.violet}60` : "3px solid transparent",
                                    transition: "all 0.1s",
                                    opacity: dragIdx.current === i ? 0.4 : 1,
                                }}
                                onMouseEnter={e => {
                                    if (!isCurrent && dragIdx.current === null) {
                                        const hoverColor = isLive
                                            ? (isStacked ? `${THEME.colors.status.error}10` : `${THEME.colors.brand.violet}15`)
                                            : `${THEME.colors.surfaceHover}`;
                                        e.currentTarget.style.backgroundColor = hoverColor;
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (dropTarget !== i) {
                                        e.currentTarget.style.backgroundColor = isCurrent
                                            ? `${THEME.colors.brand.cyan}12`
                                            : isStacked ? `${THEME.colors.brand.violet}10` : "transparent";
                                    }
                                }}
                                title={
                                    isCurrent ? "Reproduciendo ahora"
                                        : isLive
                                            ? (isStacked ? `Prioridad ${stackIdx + 1} — click para quitar del stack` : "Click para apilar como siguiente")
                                            : "Click para saltar · Arrastra para reordenar"
                                }
                            >
                                {/* Drag handle — only in Edit mode, not for current track */}
                                {!isLive && !isCurrent && (
                                    <div style={{
                                        color: THEME.colors.text.muted,
                                        opacity: 0.35,
                                        cursor: "grab",
                                        flexShrink: 0,
                                        padding: "0 2px",
                                        fontSize: 14,
                                    }}>
                                        ⠿
                                    </div>
                                )}
                                {/* Position/Stack badge */}
                                <span style={{
                                    minWidth: 22, height: 22,
                                    borderRadius: "50%",
                                    backgroundColor: isCurrent
                                        ? THEME.colors.brand.cyan
                                        : isStacked ? THEME.colors.brand.violet : "rgba(255,255,255,0.06)",
                                    color: isCurrent || isStacked ? "white" : THEME.colors.text.muted,
                                    fontSize: 10, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: THEME.fonts.mono,
                                    flexShrink: 0,
                                    transition: "all 0.2s",
                                    boxShadow: isStacked ? `0 0 8px ${THEME.colors.brand.violet}60` : "none",
                                }}>
                                    {isCurrent
                                        ? <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                                        : isStacked ? (stackIdx + 1) : (i + 1)
                                    }
                                </span>

                                {/* Track info + Notes */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13,
                                        fontWeight: isCurrent || isStacked ? 700 : 400,
                                        color: isCurrent ? "white" : isStacked ? THEME.colors.brand.violet : THEME.colors.text.secondary,
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>{t.title}</div>
                                    <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{t.artist}</div>
                                    {/* Notes display/edit */}
                                    {editingNotes === t.id ? (
                                        <textarea
                                            autoFocus
                                            defaultValue={t.notes || ""}
                                            placeholder="Notas de performance..."
                                            onBlur={e => {
                                                onSetNotes(t.id, e.target.value.trim());
                                                onEditNotes(null);
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === "Escape") onEditNotes(null);
                                                if (e.key === "Enter" && e.metaKey) {
                                                    onSetNotes(t.id, (e.target as HTMLTextAreaElement).value.trim());
                                                    onEditNotes(null);
                                                }
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                width: "100%",
                                                marginTop: 4,
                                                padding: "4px 8px",
                                                fontSize: 11,
                                                backgroundColor: "rgba(0,0,0,0.4)",
                                                border: `1px solid ${THEME.colors.brand.violet}60`,
                                                borderRadius: THEME.radius.sm,
                                                color: THEME.colors.text.primary,
                                                resize: "none",
                                                height: 52,
                                                outline: "none",
                                                fontFamily: THEME.fonts.main,
                                            }}
                                        />
                                    ) : t.notes ? (
                                        <div
                                            onClick={e => { e.stopPropagation(); if (!isLive) onEditNotes(t.id); }}
                                            style={{ fontSize: 11, color: THEME.colors.brand.violet, marginTop: 2, opacity: 0.85, cursor: isLive ? "default" : "pointer" }}
                                            title={isLive ? t.notes : "Click para editar notas"}
                                        >
                                            📝 {t.notes}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Right column: Duration + note btn + trim btn */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                                    <span style={{ fontSize: 11, fontFamily: THEME.fonts.mono, color: THEME.colors.text.muted }}>{fmt(t.duration_ms)}</span>
                                    {isLive && isStacked && (
                                        <span style={{ fontSize: 9, color: THEME.colors.brand.violet, fontWeight: 700, letterSpacing: "0.05em" }}>NEXT {stackIdx + 1}</span>
                                    )}
                                    {/* Note button (Edit mode only) */}
                                    {!isLive && !isCurrent && editingNotes !== t.id && (
                                        <button
                                            onClick={e => { e.stopPropagation(); onEditNotes(editingNotes === t.id ? null : t.id); }}
                                            title="Agregar nota de performance"
                                            style={{
                                                background: "none", border: "none",
                                                cursor: "pointer", padding: "2px 3px",
                                                color: t.notes ? THEME.colors.brand.violet : THEME.colors.text.muted,
                                                opacity: t.notes ? 0.9 : 0.4,
                                                fontSize: 13, lineHeight: 1,
                                                transition: "opacity 0.15s",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = t.notes ? "0.9" : "0.4"; }}
                                        >
                                            ✏️
                                        </button>
                                    )}
                                    {/* Trimming button (Edit mode only) */}
                                    {!isLive && !isCurrent && (
                                        <button
                                            onClick={e => { e.stopPropagation(); onTrimTrack(t); }}
                                            title="Recortar inicio/fin"
                                            style={{
                                                background: "none", border: "none",
                                                cursor: "pointer", padding: "2px 3px",
                                                color: THEME.colors.text.muted,
                                                opacity: 0.4,
                                                fontSize: 13, lineHeight: 1,
                                                transition: "opacity 0.15s",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = THEME.colors.brand.cyan; }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = "0.4"; e.currentTarget.style.color = THEME.colors.text.muted; }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                                                <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
                                                <line x1="8.12" y1="8.12" x2="12" y2="12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── POOL (not in queue) ── */}
                {poolTracks.length > 0 && (
                    <div style={{ padding: "12px 8px 8px", marginTop: 4, borderTop: `1px solid ${THEME.colors.border}` }}>
                        <div style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, padding: "0 8px 6px" }}>
                            Disponibles · no programadas
                        </div>
                        {poolTracks.map(t => (
                            <div
                                key={t.id + "pool"}
                                onClick={() => !isLive && onTogglePool(t)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 10px 10px 8px",
                                    borderRadius: THEME.radius.md,
                                    cursor: isLive ? "default" : "pointer",
                                    backgroundColor: "transparent",
                                    borderLeft: "3px solid transparent",
                                    transition: "background-color 0.15s",
                                    opacity: 0.45,
                                }}
                                onMouseEnter={e => {
                                    if (!isLive) {
                                        e.currentTarget.style.backgroundColor = `${THEME.colors.brand.cyan}0a`;
                                        e.currentTarget.style.opacity = "0.85";
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.opacity = "0.45";
                                }}
                                title={isLive ? "" : "Click para añadir a la cola"}
                            >
                                {/* Empty slot badge */}
                                <span style={{
                                    minWidth: 22, height: 22,
                                    borderRadius: "50%",
                                    border: `1px dashed rgba(255,255,255,0.15)`,
                                    fontSize: 10, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </span>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 400,
                                        color: THEME.colors.text.secondary,
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>{t.title}</div>
                                    <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{t.artist}</div>
                                </div>

                                <span style={{ fontSize: 11, fontFamily: THEME.fonts.mono, color: THEME.colors.text.muted, flexShrink: 0 }}>
                                    {fmt(t.duration_ms)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Coming up next */}
                {ci < pQueue.length - 1 && (
                    <div style={{ margin: "8px", padding: "12px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}` }}>
                        <div style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Siguiente</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{pQueue[ci + 1]?.title}</div>
                        <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{pQueue[ci + 1]?.artist}</div>
                    </div>
                )}
            </div>
        </aside>
    );
};
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/player/ui/PlayerQueueSidebar.tsx
git commit -m "feat: add PlayerQueueSidebar sub-component (player partition step 8)"
```

---

## Chunk 4: Wire Player.tsx (Task 9)

### Task 9: Edit `Player.tsx`

**Files:**
- Modify: `src/pages/Player.tsx`

This is the final step. Remove extracted JSX sections, remove the module-scope `LiveUnlockModal` definition, update imports, and compose the 8 sub-components.

**Import changes:**
- Remove: `Wave` (moves to PlayerWaveform)
- Remove: `mc` from uiUtils (moves to PlayerTrackHeader)
- Keep: `fmt`, `fmtM`, `THEME`, `sumTrackDurationMs`, `getWaveformData`, `setTrackTrim`, `TrackTrimmer`, `Track`
- Add: 8 sub-component imports

**After this edit, `Player.tsx` should be ~215 lines.**

- [ ] **Step 1: Replace the full `Player.tsx` with the wired version**

```tsx
// src/pages/Player.tsx
import React, { useEffect, useRef, useState } from "react";
import { useProjectStore, doGen, toPlayer } from "../store/useProjectStore";
import { useBuilderStore } from "../store/useBuilderStore.ts";
import { usePlayerStore } from "../store/usePlayerStore.ts";
import { THEME } from "../data/theme.ts";
import { fmt, fmtM } from "../services/uiUtils.ts";
import { sumTrackDurationMs } from "../utils/trackMetrics.ts";
import { getWaveformData } from "../services/waveformService";
import { setTrackTrim } from "../store/useProjectStore";
import { TrackTrimmer } from "../components/common/TrackTrimmer";
import { Track } from "../types";
import { LiveUnlockModal } from "../features/player/ui/LiveUnlockModal";
import { PlayerEmptyState } from "../features/player/ui/PlayerEmptyState";
import { PlayerBanners } from "../features/player/ui/PlayerBanners";
import { PlayerTrackHeader } from "../features/player/ui/PlayerTrackHeader";
import { PlayerWaveform } from "../features/player/ui/PlayerWaveform";
import { PlayerControls } from "../features/player/ui/PlayerControls";
import { PlayerSetFooter } from "../features/player/ui/PlayerSetFooter";
import { PlayerQueueSidebar } from "../features/player/ui/PlayerQueueSidebar";

// ── Player Page ───────────────────────────────────────────────────────────────
export const Player: React.FC = () => {
    const pQueue = useProjectStore(s => s.pQueue);
    const ci = useProjectStore(s => s.ci);
    const pos = useProjectStore(s => s.pos);
    const playing = useProjectStore(s => s.playing);
    const elapsed = useProjectStore(s => s.elapsed);
    const tTarget = useProjectStore(s => s.tTarget);
    const vol = useProjectStore(s => s.vol);
    const mode = useProjectStore(s => s.mode);
    const setPos = useProjectStore(s => s.setPos);
    const setCi = useProjectStore(s => s.setCi);
    const setPlaying = useProjectStore(s => s.setPlaying);
    const setVol = useProjectStore(s => s.setVol);
    const setMode = useProjectStore(s => s.setMode);
    const setPQueue = useProjectStore(s => s.setPQueue);
    const setTrackNotes = useProjectStore(s => s.setTrackNotes);
    const isSimulating = usePlayerStore(s => s.isSimulating);

    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [trimmingTrack, setTrimmingTrack] = useState<Track | null>(null);
    const [currentWave, setCurrentWave] = useState<number[]>([]);

    // ── Export set as .txt ───────────────────────────────────────────────────
    const exportSet = () => {
        const lines = [
            `== SuniPlayer · Set Export ==`,
            `Fecha: ${new Date().toLocaleString()}`,
            `Total: ${pQueue.length} canciones · ${fmtM(sumTrackDurationMs(pQueue))}`,
            ``,
            ...pQueue.map((t, i) => [
                `${String(i + 1).padStart(2, "0")}. ${t.title} — ${t.artist}`,
                `    Duración: ${fmt(t.duration_ms)}  BPM: ${t.bpm}  Key: ${t.key}  Mood: ${t.mood}`,
                t.notes ? `    📝 ${t.notes}` : "",
            ].filter(Boolean).join("\n")),
        ].join("\n");

        const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SuniPlayer_Set_${new Date().toLocaleDateString("es")}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Queue Planning ───────────────────────────────────────────────────────
    const [masterPool, setMasterPool] = useState<typeof pQueue>([]);

    useEffect(() => {
        if (pQueue.length > 0 && masterPool.length === 0) {
            setMasterPool([...pQueue]);
        }
    }, [masterPool.length, pQueue]);

    useEffect(() => {
        if (pQueue.length > 0) {
            setMasterPool(prev => {
                const pIds = pQueue.map(t => t.id).sort().join();
                const mIds = prev.map(t => t.id).sort().join();
                if (pIds !== mIds) return [...pQueue];
                return prev;
            });
        }
    }, [pQueue]);

    const toggleTrackInQueue = (track: typeof pQueue[0]) => {
        if (isLive) return;
        const currentId = pQueue[ci]?.id;
        const inQueue = pQueue.some(t => t.id === track.id);

        if (inQueue) {
            if (track.id === currentId) return;
            const newQueue = pQueue.filter(t => t.id !== track.id);
            setPQueue(newQueue);
            const newCi = newQueue.findIndex(t => t.id === currentId);
            setCi(Math.max(0, newCi));
        } else {
            const newQueue = [...pQueue, track];
            setPQueue(newQueue);
        }
    };

    const isLive = mode === "live";
    const ct = pQueue[ci];
    const prog = ct ? pos / (ct.duration_ms || 1) : 0;
    const qTot = sumTrackDurationMs(pQueue);
    const mCol = isLive ? THEME.colors.brand.cyan : THEME.colors.brand.violet;

    // ── Real Waveform Analysis ───────────────────────────────────────────────
    useEffect(() => {
        if (!ct) return;
        const url = ct.blob_url ?? (`/audio/${encodeURIComponent(ct.file_path)}`);
        getWaveformData(url).then(setCurrentWave);
    }, [ct]);

    // ── Stack Order (Live mode manual queue reordering) ──────────────────────
    const [stackOrder, setStackOrder] = useState<string[]>([]);
    useEffect(() => { setStackOrder([]); }, [ci]);

    // ── Drag-to-reorder (Edit mode only) ────────────────────────────────────
    const dragIdx = useRef<number | null>(null);
    const [dropTarget, setDropTarget] = useState<number | null>(null);

    const onDragStart = (i: number) => {
        if (isLive || i === ci) return;
        dragIdx.current = i;
    };
    const onDragOver = (e: React.DragEvent, i: number) => {
        if (isLive) return;
        e.preventDefault();
        setDropTarget(i);
    };
    const onDrop = (e: React.DragEvent, dropI: number) => {
        e.preventDefault();
        setDropTarget(null);
        const fromI = dragIdx.current;
        dragIdx.current = null;
        if (fromI === null || fromI === dropI || dropI === ci) return;

        const newQ = [...pQueue];
        const [moved] = newQ.splice(fromI, 1);
        newQ.splice(dropI, 0, moved);

        const playingId = pQueue[ci]?.id;
        const newCi = newQ.findIndex(t => t.id === playingId);
        setPQueue(newQ);
        if (newCi >= 0) setCi(newCi);
    };
    const onDragEnd = () => {
        dragIdx.current = null;
        setDropTarget(null);
    };

    const handleQueueClick = (track: typeof pQueue[0], queueIdx: number) => {
        if (queueIdx === ci) return;

        if (!isLive) {
            setCi(queueIdx);
            setPos(0);
            return;
        }

        const inStack = stackOrder.includes(track.id);
        const newStack: string[] = inStack
            ? stackOrder.filter(id => id !== track.id)
            : [...stackOrder, track.id];
        setStackOrder(newStack);

        const played = pQueue.slice(0, ci);
        const current = pQueue[ci];
        const allUpcoming = pQueue.slice(ci + 1);
        const stackedTracks = newStack
            .map(id => allUpcoming.find(t => t.id === id))
            .filter((t): t is typeof pQueue[0] => !!t);
        const restTracks = allUpcoming.filter(t => !newStack.includes(t.id));
        setPQueue([...played, current, ...stackedTracks, ...restTracks]);
    };

    const handleModeToggle = () => {
        if (isLive) {
            setShowUnlockModal(true);
        } else {
            setMode("live");
        }
    };

    const confirmUnlock = () => {
        setMode("edit");
        setShowUnlockModal(false);
    };

    // ── Keyboard Navigation ──────────────────────────────────────────────────
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === " ") {
                e.preventDefault();
                setPlaying((p: boolean) => !p);
            }
            if (isLive) return;
            if (e.key === "ArrowRight" && ci < pQueue.length - 1) { setCi(ci + 1); setPos(0); }
            if (e.key === "ArrowLeft" && ci > 0) { setCi(ci - 1); setPos(0); }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [ci, isLive, pQueue.length, setPlaying, setCi, setPos]);

    // ── Seek ─────────────────────────────────────────────────────────────────
    const seek = (e: React.MouseEvent) => {
        if (!ct || isLive) return;
        const r = e.currentTarget.getBoundingClientRect();
        setPos(Math.floor(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (ct.duration_ms || 0)));
    };

    const rem = Math.max(0, tTarget - elapsed);
    const tPct = tTarget > 0 ? Math.min(1, elapsed / tTarget) : 0;
    const tCol = rem < 120 && rem > 0
        ? THEME.colors.status.error
        : rem < 300 && rem > 0
            ? THEME.colors.status.warning
            : THEME.colors.brand.cyan;

    // ── Empty state ──────────────────────────────────────────────────────────
    if (!pQueue.length) {
        return (
            <PlayerEmptyState
                onQuickLoad={() => { doGen(); setTimeout(() => toPlayer(), 50); }}
                onGoToBuilder={() => useBuilderStore.getState().setView("builder")}
            />
        );
    }

    return (
        <>
            {showUnlockModal && (
                <LiveUnlockModal
                    onConfirm={confirmUnlock}
                    onCancel={() => setShowUnlockModal(false)}
                />
            )}

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }} className="player-layout">
                <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px", minWidth: 0, gap: 24, overflowY: "auto", position: "relative", zIndex: 1 }} className="main-content">
                    <PlayerBanners isLive={isLive} isSimulating={isSimulating} playing={playing} />
                    <PlayerTrackHeader ct={ct} rem={rem} tCol={tCol} tPct={tPct} />
                    <PlayerWaveform
                        waveData={currentWave.length > 0 ? currentWave : Array(100).fill(0.1)}
                        prog={prog}
                        mCol={mCol}
                        isLive={isLive}
                        pos={pos}
                        durationMs={ct?.duration_ms || 0}
                        onSeek={seek}
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
                        pQueue={pQueue}
                        ci={ci}
                        pos={pos}
                        qTot={qTot}
                        isLive={isLive}
                        mCol={mCol}
                        onExport={exportSet}
                        onModeToggle={handleModeToggle}
                    />
                </main>

                <PlayerQueueSidebar
                    pQueue={pQueue}
                    ci={ci}
                    isLive={isLive}
                    mCol={mCol}
                    masterPool={masterPool}
                    stackOrder={stackOrder}
                    dropTarget={dropTarget}
                    editingNotes={editingNotes}
                    dragIdx={dragIdx}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                    onQueueClick={handleQueueClick}
                    onTogglePool={toggleTrackInQueue}
                    onSetNotes={(id, notes) => setTrackNotes(id, notes)}
                    onEditNotes={id => setEditingNotes(id)}
                    onTrimTrack={track => setTrimmingTrack(track)}
                />
            </div>

            {trimmingTrack && (
                <TrackTrimmer
                    track={trimmingTrack}
                    onSave={(start, end) => {
                        setTrackTrim(trimmingTrack.id, start, end);
                        setTrimmingTrack(null);
                    }}
                    onCancel={() => setTrimmingTrack(null)}
                />
            )}
        </>
    );
};
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If there are errors, fix them before continuing.

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --run
```

Expected: **21 tests pass, 0 failures.** The existing `src/pages/Player.test.tsx` exercises the exported `Player` component end-to-end — it must pass unchanged.

- [ ] **Step 4: Verify Player.tsx line count is ~215 lines**

```bash
wc -l src/pages/Player.tsx
```

Expected: ~215 lines (down from 1034).

- [ ] **Step 5: Commit all files**

```bash
git add src/pages/Player.tsx
git commit -m "refactor: partition Player.tsx into 8 focused sub-components

- Extract LiveUnlockModal, PlayerEmptyState, PlayerBanners,
  PlayerTrackHeader, PlayerWaveform, PlayerControls,
  PlayerSetFooter, PlayerQueueSidebar to src/features/player/ui/
- Player.tsx reduced from 1034 to ~215 lines
- Zero behavior change; all 21 tests pass
- Pure JSX extraction: all logic stays in Player.tsx"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `src/features/player/ui/` contains exactly 8 `.tsx` files
- [ ] `npx tsc --noEmit` exits with 0 errors
- [ ] `npm test -- --run` shows 21 tests passing
- [ ] `src/pages/Player.tsx` is ~215 lines
- [ ] `Wave` and `mc` imports are gone from `Player.tsx`
- [ ] The module-scope `LiveUnlockModal` definition (old lines 14–119) is removed from `Player.tsx`
