# Marker Bubbles Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent per-track markers to the waveform: long-press to create, animated bubble on approach, red dot always visible.

**Architecture:** Pure logic extracted to `markerUtils.ts` (testable), UI split into four focused components (`MarkerDot`, `MarkerModal`, `MarkerBubble`, `MarkerLayer`), wired into `Player.tsx` replacing the raw waveform div. Markers stored in `apps/web/src/types.ts` Track type (note: `apps/web` uses its own local `types.ts`, not `packages/core/src/types.ts` — Player.tsx imports `from "../types"` which resolves to the local file), persisted via existing `updateTrackMetadata`.

**Tech Stack:** React 18, TypeScript 5, Vitest 4, Zustand 4, CSS-in-JS inline styles (follow existing player patterns).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `apps/web/src/types.ts` | Add `TrackMarker` interface + `markers?` to Track |
| Create | `apps/web/src/components/common/markerUtils.ts` | Pure logic: hit-test, blink duration, bubble state |
| Create | `apps/web/src/components/common/markerUtils.test.ts` | Unit tests for all pure functions |
| Create | `apps/web/src/components/common/MarkerDot.tsx` | Red 8px dot at absolute position, hover tooltip |
| Create | `apps/web/src/components/common/MarkerModal.tsx` | Modal: time display, textarea, save/cancel/delete, prev/next |
| Create | `apps/web/src/components/common/MarkerBubble.tsx` | Animated bubble with blinking border + fade-out |
| Create | `apps/web/src/components/common/MarkerLayer.tsx` | Wrapper: long-press detection, orchestrates everything |
| Modify | `apps/web/src/pages/Player.tsx` | Wrap waveform section in `<MarkerLayer>` |

---

## Chunk 1: Data model + pure logic

### Task 1: Add TrackMarker type to types.ts

**Files:**
- Modify: `apps/web/src/types.ts`

- [ ] **Step 1: Add TrackMarker interface and markers field**

In `apps/web/src/types.ts`, add before the `Track` interface:

```typescript
export interface TrackMarker {
    id: string;       // uuid, generated at creation time
    posMs: number;    // position in milliseconds within the track
    comment: string;  // max 140 characters
}
```

Then inside the `Track` interface, add after the `notes?` field:

```typescript
markers?: TrackMarker[];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/types.ts
git commit -m "feat(markers): add TrackMarker type and markers field to Track"
```

---

### Task 2: Pure logic utilities

**Files:**
- Create: `apps/web/src/components/common/markerUtils.ts`
- Create: `apps/web/src/components/common/markerUtils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/components/common/markerUtils.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
    findNearbyMarker,
    blinkDurationSec,
    getBubbleState,
} from "./markerUtils";
import type { TrackMarker } from "../../types";

const marker = (id: string, posMs: number): TrackMarker => ({
    id,
    posMs,
    comment: "test",
});

// ── findNearbyMarker ─────────────────────────────────────────────────────────
describe("findNearbyMarker", () => {
    const markers = [marker("a", 30000), marker("b", 90000)];
    // waveformWidth=800, durationMs=120000
    // posMs=30000 → x = 30000/120000*800 = 200px
    // posMs=90000 → x = 90000/120000*800 = 600px
    // tolerance = 12/800*120000 = 1800ms

    it("returns null when list is empty", () => {
        expect(findNearbyMarker(200, 800, 120000, [])).toBeNull();
    });

    it("returns marker when click is within tolerance", () => {
        // 205px → posMs=30750, delta to marker a = 750ms < 1800ms → hit
        expect(findNearbyMarker(205, 800, 120000, markers)?.id).toBe("a");
    });

    it("returns null when click is outside tolerance", () => {
        // 220px → posMs=33000, delta = 3000ms > 1800ms → miss
        expect(findNearbyMarker(220, 800, 120000, markers)).toBeNull();
    });

    it("returns nearest marker when two are within tolerance", () => {
        const close = [marker("x", 30000), marker("y", 31200)];
        // tolerance = 1800ms
        // click at 202px → posMs=30300; delta x=300ms, delta y=900ms → x wins
        expect(findNearbyMarker(202, 800, 120000, close)?.id).toBe("x");
    });

    it("returns null when waveformWidth is 0", () => {
        expect(findNearbyMarker(0, 0, 120000, markers)).toBeNull();
    });
});

// ── blinkDurationSec ─────────────────────────────────────────────────────────
describe("blinkDurationSec", () => {
    it("returns ~2s at 15s distance", () => {
        expect(blinkDurationSec(15)).toBeCloseTo(2, 1);
    });

    it("returns 0.25s at 0s distance", () => {
        expect(blinkDurationSec(0)).toBeCloseTo(0.25, 2);
    });

    it("clamps to 0.25s for negative distances", () => {
        expect(blinkDurationSec(-5)).toBe(0.25);
    });

    it("clamps max to 2s for distances beyond 15s", () => {
        expect(blinkDurationSec(30)).toBeCloseTo(2, 1);
    });
});

// ── getBubbleState ───────────────────────────────────────────────────────────
describe("getBubbleState", () => {
    it("returns hidden when marker is >15s ahead", () => {
        expect(getBubbleState(30000, 10000)).toBe("hidden");
    });

    it("returns visible when marker is ≤15s ahead", () => {
        expect(getBubbleState(30000, 20000)).toBe("visible");
    });

    it("returns visible exactly at playhead", () => {
        expect(getBubbleState(30000, 30000)).toBe("visible");
    });

    it("returns fading when marker passed within 10s", () => {
        expect(getBubbleState(30000, 35000)).toBe("fading");
    });

    it("returns hidden when marker passed >10s ago", () => {
        expect(getBubbleState(30000, 45000)).toBe("hidden");
    });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
cd apps/web && pnpm test -- markerUtils
```
Expected: FAIL — "cannot find module './markerUtils'"

- [ ] **Step 3: Create markerUtils.ts**

Create `apps/web/src/components/common/markerUtils.ts`:

```typescript
import type { TrackMarker } from "../../types";

const HIT_TOLERANCE_PX = 12;

/**
 * Returns the marker closest to clickX within pixel tolerance, or null.
 * toleranceMs = (12px / waveformWidth) * durationMs
 */
export function findNearbyMarker(
    clickX: number,
    waveformWidth: number,
    durationMs: number,
    markers: TrackMarker[]
): TrackMarker | null {
    if (markers.length === 0 || waveformWidth === 0 || durationMs === 0) return null;

    const clickPosMs = (clickX / waveformWidth) * durationMs;
    const toleranceMs = (HIT_TOLERANCE_PX / waveformWidth) * durationMs;

    let nearest: TrackMarker | null = null;
    let nearestDelta = Infinity;

    for (const m of markers) {
        const delta = Math.abs(m.posMs - clickPosMs);
        if (delta <= toleranceMs && delta < nearestDelta) {
            nearest = m;
            nearestDelta = delta;
        }
    }
    return nearest;
}

/**
 * Returns CSS animation-duration in seconds for the blinking border.
 * distanceSec=15 → 2s (slow), distanceSec=0 → 0.25s (fast).
 */
export function blinkDurationSec(distanceSec: number): number {
    const clamped = Math.max(0, Math.min(15, distanceSec));
    return Math.max(0.25, 2 - (15 - clamped) * (1.75 / 15));
}

export type BubbleState = "hidden" | "visible" | "fading";

/**
 * Returns bubble visibility state.
 * visible: playhead within 15s before marker
 * fading: playhead passed marker within 10s
 * hidden: everything else
 */
export function getBubbleState(markerPosMs: number, playheadMs: number): BubbleState {
    const distMs = markerPosMs - playheadMs;
    if (distMs > 15000) return "hidden";
    if (distMs >= 0) return "visible";
    if (distMs >= -10000) return "fading";
    return "hidden";
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
cd apps/web && pnpm test -- markerUtils
```
Expected: all 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/common/markerUtils.ts apps/web/src/components/common/markerUtils.test.ts
git commit -m "feat(markers): add marker utility functions with tests"
```

---

## Chunk 2: UI Components

### Task 3: MarkerDot

**Files:**
- Create: `apps/web/src/components/common/MarkerDot.tsx`

- [ ] **Step 1: Create MarkerDot.tsx**

```typescript
import React, { useState } from "react";
import type { TrackMarker } from "../../types";

interface MarkerDotProps {
    marker: TrackMarker;
    durationMs: number;
    onClick: (marker: TrackMarker) => void;
}

export const MarkerDot: React.FC<MarkerDotProps> = ({ marker, durationMs, onClick }) => {
    const [hovered, setHovered] = useState(false);
    const leftPct = durationMs > 0 ? (marker.posMs / durationMs) * 100 : 0;
    const truncated = marker.comment.length > 40
        ? marker.comment.slice(0, 40) + "…"
        : marker.comment;

    return (
        <div
            style={{
                position: "absolute",
                left: `${leftPct}%`,
                bottom: 0,
                transform: "translateX(-50%)",
                zIndex: 10,
                cursor: "pointer",
            }}
            onClick={(e) => { e.stopPropagation(); onClick(marker); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Red dot */}
            <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                boxShadow: "0 0 4px rgba(239,68,68,0.7)",
                transition: "transform 0.15s",
                transform: hovered ? "scale(1.5)" : "scale(1)",
            }} />

            {/* Tooltip */}
            {hovered && marker.comment && (
                <div style={{
                    position: "absolute",
                    bottom: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(15,15,20,0.95)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    color: "white",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}>
                    {truncated}
                </div>
            )}
        </div>
    );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/common/MarkerDot.tsx
git commit -m "feat(markers): add MarkerDot component"
```

---

### Task 4: MarkerModal

**Files:**
- Create: `apps/web/src/components/common/MarkerModal.tsx`

- [ ] **Step 1: Create MarkerModal.tsx**

```typescript
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TrackMarker } from "../../types";
import { THEME } from "../../data/theme";

const MAX_CHARS = 140;

function fmtMs(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

interface MarkerModalProps {
    marker: Partial<TrackMarker> & { posMs: number };  // posMs always set
    markers: TrackMarker[];                            // all track markers (for nav)
    isReadOnly: boolean;
    onSave: (marker: TrackMarker) => void;
    onDelete: (id: string) => void;
    onNavigate: (marker: TrackMarker) => void;
    onClose: () => void;
}

export const MarkerModal: React.FC<MarkerModalProps> = ({
    marker, markers, isReadOnly, onSave, onDelete, onNavigate, onClose,
}) => {
    const [comment, setComment] = useState(marker.comment ?? "");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sort markers by position for prev/next nav
    const sorted = [...markers].sort((a, b) => a.posMs - b.posMs);
    const currentIdx = marker.id ? sorted.findIndex(m => m.id === marker.id) : -1;
    const prevMarker = currentIdx > 0 ? sorted[currentIdx - 1] : null;
    const nextMarker = currentIdx !== -1 && currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSave = () => {
        if (!comment.trim()) return;
        onSave({
            id: marker.id ?? crypto.randomUUID(),
            posMs: marker.posMs,
            comment: comment.trim().slice(0, MAX_CHARS),
        });
    };

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 2000);
            return;
        }
        if (marker.id) onDelete(marker.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
    };

    return createPortal(
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9000,
                backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: THEME.colors.panel,
                    border: `1px solid ${THEME.colors.border}`,
                    borderRadius: THEME.radius.xl,
                    padding: 24,
                    width: "min(400px, 92vw)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 10, color: THEME.colors.text.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                            {marker.id ? "Editar marcador" : "Nuevo marcador"}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: THEME.fonts.mono, color: "#ef4444", marginTop: 2 }}>
                            {fmtMs(marker.posMs)}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: THEME.colors.text.muted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
                </div>

                {/* Textarea */}
                <div style={{ position: "relative" }}>
                    <textarea
                        ref={textareaRef}
                        value={comment}
                        onChange={e => setComment(e.target.value.slice(0, MAX_CHARS))}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? "" : "Escribe tu comentario…"}
                        rows={4}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            resize: "none",
                            backgroundColor: THEME.colors.surface,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.md,
                            color: THEME.colors.text.primary,
                            fontSize: 14,
                            padding: "10px 12px",
                            fontFamily: "inherit",
                            outline: "none",
                        }}
                    />
                    {!isReadOnly && (
                        <div style={{
                            position: "absolute", bottom: 8, right: 10,
                            fontSize: 10, color: comment.length >= MAX_CHARS ? "#ef4444" : THEME.colors.text.muted,
                        }}>
                            {comment.length}/{MAX_CHARS}
                        </div>
                    )}
                </div>

                {/* Nav — prev/next */}
                {markers.length > 1 && (
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={() => prevMarker && onNavigate(prevMarker)}
                            disabled={!prevMarker}
                            style={{
                                flex: 1, padding: "8px", borderRadius: THEME.radius.md,
                                background: "rgba(255,255,255,0.04)", border: `1px solid ${THEME.colors.border}`,
                                color: prevMarker ? THEME.colors.text.secondary : THEME.colors.text.muted,
                                cursor: prevMarker ? "pointer" : "default", fontSize: 12, fontWeight: 700,
                            }}
                        >
                            ← Anterior
                        </button>
                        <button
                            onClick={() => nextMarker && onNavigate(nextMarker)}
                            disabled={!nextMarker}
                            style={{
                                flex: 1, padding: "8px", borderRadius: THEME.radius.md,
                                background: "rgba(255,255,255,0.04)", border: `1px solid ${THEME.colors.border}`,
                                color: nextMarker ? THEME.colors.text.secondary : THEME.colors.text.muted,
                                cursor: nextMarker ? "pointer" : "default", fontSize: 12, fontWeight: 700,
                            }}
                        >
                            Siguiente →
                        </button>
                    </div>
                )}

                {/* Action buttons */}
                {!isReadOnly && (
                    <div style={{ display: "flex", gap: 8 }}>
                        {marker.id && (
                            <button
                                onClick={handleDelete}
                                style={{
                                    padding: "10px 16px", borderRadius: THEME.radius.md,
                                    background: confirmDelete ? "rgba(239,68,68,0.15)" : "transparent",
                                    border: `1px solid ${confirmDelete ? "#ef4444" : THEME.colors.border}`,
                                    color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700,
                                    transition: "all 0.2s",
                                }}
                            >
                                {confirmDelete ? "¿Confirmar?" : "Eliminar"}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: "10px", borderRadius: THEME.radius.md,
                                background: "transparent", border: `1px solid ${THEME.colors.border}`,
                                color: THEME.colors.text.muted, cursor: "pointer", fontSize: 13, fontWeight: 700,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!comment.trim()}
                            style={{
                                flex: 2, padding: "10px", borderRadius: THEME.radius.md,
                                background: comment.trim() ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${comment.trim() ? THEME.colors.brand.cyan : THEME.colors.border}`,
                                color: comment.trim() ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                                cursor: comment.trim() ? "pointer" : "default",
                                fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                            }}
                        >
                            Guardar
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/common/MarkerModal.tsx
git commit -m "feat(markers): add MarkerModal component"
```

---

### Task 5: MarkerBubble

**Files:**
- Create: `apps/web/src/components/common/MarkerBubble.tsx`

- [ ] **Step 1: Inject CSS keyframes once (add to MarkerLayer later — just note the style string)**

The animation keyframe needed:
```css
@keyframes markerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50%       { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}
```

- [ ] **Step 2: Create MarkerBubble.tsx**

```typescript
import React from "react";
import type { TrackMarker } from "../../types";
import { blinkDurationSec, BubbleState } from "./markerUtils";

interface MarkerBubbleProps {
    marker: TrackMarker;
    durationMs: number;
    playheadMs: number;
    state: BubbleState;           // "visible" | "fading"
    stackIndex: number;           // 0, 1, 2… for side-by-side layout
}

export const MarkerBubble: React.FC<MarkerBubbleProps> = ({
    marker, durationMs, playheadMs, state, stackIndex,
}) => {
    if (state === "hidden") return null;

    const leftPct = durationMs > 0 ? (marker.posMs / durationMs) * 100 : 0;
    const distanceSec = Math.max(0, (marker.posMs - playheadMs) / 1000);
    const blinkSec = blinkDurationSec(distanceSec);
    const opacity = state === "fading"
        ? Math.max(0, 1 - Math.abs(marker.posMs - playheadMs) / 10000)
        : 1;

    // Horizontal offset for stacked bubbles (same posMs)
    const BUBBLE_WIDTH = 200; // max px — actual width adjusts to text
    const offsetX = stackIndex * (BUBBLE_WIDTH + 8);

    return (
        <div
            style={{
                position: "absolute",
                left: `${leftPct}%`,
                bottom: 14,                         // above the dot
                transform: `translateX(calc(-50% + ${offsetX}px))`,
                zIndex: 20,
                pointerEvents: "none",
                opacity,
                transition: state === "fading" ? "opacity 0.5s" : "opacity 0.3s",
            }}
        >
            <div
                style={{
                    backgroundColor: "rgba(10,10,15,0.95)",
                    borderRadius: 8,
                    padding: "12px",
                    maxWidth: BUBBLE_WIDTH,
                    minWidth: 100,
                    boxSizing: "border-box",
                    // Blinking border via box-shadow animation
                    animation: `markerPulse ${blinkSec}s ease-in-out infinite`,
                }}
            >
                <div style={{
                    fontSize: 12,
                    color: "white",
                    lineHeight: 1.4,
                    // Max 3 lines
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                    wordBreak: "break-word",
                }}>
                    {marker.comment}
                </div>
            </div>
        </div>
    );
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/common/MarkerBubble.tsx
git commit -m "feat(markers): add MarkerBubble component with animated blinking border"
```

---

## Chunk 3: MarkerLayer + Player integration

### Task 6: MarkerLayer

**Files:**
- Create: `apps/web/src/components/common/MarkerLayer.tsx`
- Create: `apps/web/src/components/common/MarkerLayer.test.tsx`

- [ ] **Step 1: Write failing tests for MarkerLayer interaction logic**

Create `apps/web/src/components/common/MarkerLayer.test.tsx`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import React from "react";
import { MarkerLayer } from "./MarkerLayer";
import type { TrackMarker } from "../../types";

const DURATION_MS = 120000;

const makeMarker = (posMs: number): TrackMarker => ({
    id: "m1",
    posMs,
    comment: "Test comment",
});

function renderLayer(
    markers: TrackMarker[],
    opts?: { isLive?: boolean; onSeek?: (ms: number) => void; onMarkersChange?: (m: TrackMarker[]) => void }
) {
    const onSeek = opts?.onSeek ?? vi.fn();
    const onMarkersChange = opts?.onMarkersChange ?? vi.fn();
    const result = render(
        <MarkerLayer
            markers={markers}
            posMs={0}
            durationMs={DURATION_MS}
            isLive={opts?.isLive ?? false}
            onMarkersChange={onMarkersChange}
            onSeek={onSeek}
        >
            <div data-testid="wave" style={{ width: 800, height: 160 }} />
        </MarkerLayer>
    );
    return { ...result, onSeek, onMarkersChange };
}

describe("MarkerLayer — short click on empty area", () => {
    it("calls onSeek when clicking empty area in edit mode", async () => {
        const { getByTestId, onSeek } = renderLayer([]);
        const container = getByTestId("wave").parentElement!;
        // Simulate mousedown + immediate mouseup at x=400 (50% of 800px)
        fireEvent.mouseDown(container, { clientX: 400 });
        await act(async () => { fireEvent.mouseUp(container, { clientX: 400 }); });
        expect(onSeek).toHaveBeenCalled();
    });

    it("does NOT call onSeek in live mode", async () => {
        const { getByTestId, onSeek } = renderLayer([], { isLive: true });
        const container = getByTestId("wave").parentElement!;
        fireEvent.mouseDown(container, { clientX: 400 });
        await act(async () => { fireEvent.mouseUp(container, { clientX: 400 }); });
        expect(onSeek).not.toHaveBeenCalled();
    });
});

describe("MarkerLayer — short click on existing marker", () => {
    it("opens modal (does not seek) when clicking near a marker", async () => {
        // marker at posMs=60000 = 50% of 120s = x=400px on 800px wide
        const { getByTestId, onSeek } = renderLayer([makeMarker(60000)]);
        const container = getByTestId("wave").parentElement!;
        // getBoundingClientRect mock returns left=0, width=800
        Object.defineProperty(container, "getBoundingClientRect", {
            value: () => ({ left: 0, width: 800, right: 800, top: 0, bottom: 160, height: 160 }),
        });
        fireEvent.mouseDown(container, { clientX: 401 }); // 1px off center = within 12px tolerance
        await act(async () => { fireEvent.mouseUp(container, { clientX: 401 }); });
        // Modal opens, seek NOT called
        expect(onSeek).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
cd apps/web && pnpm test -- MarkerLayer
```
Expected: FAIL — "cannot find module './MarkerLayer'"

- [ ] **Step 3: Create MarkerLayer.tsx**

This component wraps the waveform div (passed as `children`) and overlays all marker UI.

```typescript
import React, { useCallback, useRef, useState } from "react";
import type { TrackMarker } from "../../types";
import { findNearbyMarker, getBubbleState } from "./markerUtils";
import { MarkerDot } from "./MarkerDot";
import { MarkerBubble } from "./MarkerBubble";
import { MarkerModal } from "./MarkerModal";

// Inject CSS keyframe once
const PULSE_STYLE = `
@keyframes markerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50%       { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}
`;
let pulseInjected = false;
function injectPulse() {
    if (pulseInjected || typeof document === "undefined") return;
    const el = document.createElement("style");
    el.textContent = PULSE_STYLE;
    document.head.appendChild(el);
    pulseInjected = true;
}

const LONG_PRESS_MS = 500;

interface MarkerLayerProps {
    children: React.ReactNode;
    markers: TrackMarker[];
    posMs: number;
    durationMs: number;
    isLive: boolean;
    onMarkersChange: (markers: TrackMarker[]) => void;
    /** Called for seek (short click on empty area). Only called when !isLive. */
    onSeek: (posMs: number) => void;
}

interface ModalState {
    marker: Partial<TrackMarker> & { posMs: number };
    mode: "new" | "edit" | "readonly";
}

export const MarkerLayer: React.FC<MarkerLayerProps> = ({
    children, markers, posMs, durationMs, isLive, onMarkersChange, onSeek,
}) => {
    injectPulse();

    const containerRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
    const isLongPress = useRef(false);
    const pendingPosMs = useRef(0);

    const [provisionalPosMs, setProvisionalPosMs] = useState<number | null>(null);
    const [modal, setModal] = useState<ModalState | null>(null);

    const getPosMs = useCallback((clientX: number): number => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return pct * durationMs;
    }, [durationMs]);

    const getClientX = useCallback((clientX: number): number => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        return clientX - rect.left;
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        isLongPress.current = false;

        if (!isLive) {
            const clickPosMs = getPosMs(e.clientX);
            pendingPosMs.current = clickPosMs;

            longPressTimer.current = setTimeout(() => {
                isLongPress.current = true;
                setProvisionalPosMs(clickPosMs);
            }, LONG_PRESS_MS);
        }
    }, [isLive, getPosMs]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!mouseDownPos.current || !longPressTimer.current) return;
        const dx = Math.abs(e.clientX - mouseDownPos.current.x);
        const dy = Math.abs(e.clientY - mouseDownPos.current.y);
        if (dx > 5 || dy > 5) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (isLongPress.current) {
            // Long press: open new marker modal
            setModal({ marker: { posMs: pendingPosMs.current }, mode: "new" });
            return;
        }

        // Short click: hit-test against existing markers
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const nearby = findNearbyMarker(clickX, rect.width, durationMs, markers);

        if (nearby) {
            setModal({
                marker: nearby,
                mode: isLive ? "readonly" : "edit",
            });
        } else if (!isLive) {
            // Seek
            onSeek(getPosMs(e.clientX));
        }

        setProvisionalPosMs(null);
        mouseDownPos.current = null;
        isLongPress.current = false;
    }, [durationMs, markers, isLive, onSeek, getPosMs]);

    // ── Modal handlers ───────────────────────────────────────────────────────
    const handleSave = useCallback((saved: TrackMarker) => {
        const existing = markers.find(m => m.id === saved.id);
        const updated = existing
            ? markers.map(m => m.id === saved.id ? saved : m)
            : [...markers, saved];
        onMarkersChange(updated);
        setModal(null);
        setProvisionalPosMs(null);
    }, [markers, onMarkersChange]);

    const handleDelete = useCallback((id: string) => {
        onMarkersChange(markers.filter(m => m.id !== id));
        setModal(null);
    }, [markers, onMarkersChange]);

    const handleNavigate = useCallback((marker: TrackMarker) => {
        setModal({ marker, mode: isLive ? "readonly" : "edit" });
    }, [isLive]);

    // ── Bubble stacking: group markers by posMs ──────────────────────────────
    // Group markers sharing the same posMs bucket (within 500ms)
    const bubbleGroups = new Map<string, TrackMarker[]>();
    for (const m of markers) {
        const bucket = Math.round(m.posMs / 500);
        const key = String(bucket);
        if (!bubbleGroups.has(key)) bubbleGroups.set(key, []);
        bubbleGroups.get(key)!.push(m);
    }

    return (
        <div
            ref={containerRef}
            style={{ position: "relative", userSelect: "none" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {children}

            {/* Provisional dot (during long press) */}
            {provisionalPosMs !== null && (
                <div style={{
                    position: "absolute",
                    left: `${(provisionalPosMs / durationMs) * 100}%`,
                    bottom: 0,
                    transform: "translateX(-50%)",
                    width: 8, height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    opacity: 0.5,
                    pointerEvents: "none",
                    zIndex: 10,
                }} />
            )}

            {/* Marker dots */}
            {markers.map(m => (
                <MarkerDot
                    key={m.id}
                    marker={m}
                    durationMs={durationMs}
                    onClick={marker => setModal({ marker, mode: isLive ? "readonly" : "edit" })}
                />
            ))}

            {/* Bubbles */}
            {markers.map(m => {
                const state = getBubbleState(m.posMs, posMs);
                if (state === "hidden") return null;
                // Find stack index within its group
                const bucket = String(Math.round(m.posMs / 500));
                const group = bubbleGroups.get(bucket) ?? [];
                const stackIndex = group.indexOf(m);
                return (
                    <MarkerBubble
                        key={m.id}
                        marker={m}
                        durationMs={durationMs}
                        playheadMs={posMs}
                        state={state}
                        stackIndex={stackIndex}
                    />
                );
            })}

            {/* Modal */}
            {modal && (
                <MarkerModal
                    marker={modal.marker}
                    markers={markers}
                    isReadOnly={modal.mode === "readonly"}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onNavigate={handleNavigate}
                    onClose={() => { setModal(null); setProvisionalPosMs(null); }}
                />
            )}
        </div>
    );
};
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Run MarkerLayer tests — verify they PASS**

```bash
cd apps/web && pnpm test -- MarkerLayer
```
Expected: all 3 interaction tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/common/MarkerLayer.tsx apps/web/src/components/common/MarkerLayer.test.tsx
git commit -m "feat(markers): add MarkerLayer with long-press detection and bubble orchestration"
```

---

### Task 7: Wire MarkerLayer into Player.tsx

**Files:**
- Modify: `apps/web/src/pages/Player.tsx`

- [ ] **Step 1: Add import**

At the top of `apps/web/src/pages/Player.tsx`, add after the existing imports:

```typescript
import { MarkerLayer } from "../components/common/MarkerLayer";
```

- [ ] **Step 2: Read current markers from track**

In the "Store Selectors" section, add:

```typescript
const updateTrackMetadata = useProjectStore(s => s.updateTrackMetadata);
```

Then in the "Logic" section (after `const qTot = ...`), add:

```typescript
const currentMarkers = ct?.markers ?? [];

const handleMarkersChange = useCallback((markers: typeof currentMarkers) => {
    if (!ct) return;
    updateTrackMetadata(ct.id, { markers });
}, [ct, updateTrackMetadata]);
```

Note: add `useCallback` to the React import if not already there.

- [ ] **Step 3: Wrap the waveform div with MarkerLayer**

Find this block in Player.tsx (the waveform container div, around line 233):

```tsx
<div onClick={seek} style={{
    height: performanceMode ? 240 : 160, ...
}}>
    <Wave ... />
    <div style={{ position: "absolute", ... }} />  {/* playhead line */}
    {isLive && playing && (...)}                   {/* live badge */}
</div>
```

Replace with:

```tsx
<MarkerLayer
    markers={currentMarkers}
    posMs={pos}
    durationMs={durMs}
    isLive={isLive}
    onMarkersChange={handleMarkersChange}
    onSeek={(newPosMs) => { if (!isLive && ct) setPos(newPosMs); }}
>
    <div style={{
        height: performanceMode ? 240 : 160, backgroundColor: "rgba(255,255,255,0.01)",
        border: `1px solid ${isLive ? THEME.colors.brand.cyan + "20" : THEME.colors.border}`,
        borderRadius: THEME.radius.xl, position: "relative",
        opacity: isLoadingWave ? 0.4 : 1, transition: "all 0.3s",
    }}>
        <Wave data={currentWave.length > 0 ? currentWave : Array(100).fill(0.15)} progress={prog} color={mCol} fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} fadeOutMs={fadeOutMs} totalMs={durMs} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${prog * 100}%`, width: 3, background: mCol, boxShadow: `0 0 20px ${mCol}`, zIndex: 5 }} />
        {isLive && playing && (
            <div style={{ position: "absolute", top: 12, left: 12, padding: "6px 14px", borderRadius: 6, background: THEME.colors.brand.cyan + "30", border: `1px solid ${THEME.colors.brand.cyan}50`, color: THEME.colors.brand.cyan, fontSize: 10, fontWeight: 900 }}>LIVE MODE PROTECTED</div>
        )}
    </div>
</MarkerLayer>
```

Note: remove the `onClick={seek}` from the inner div — MarkerLayer now handles all mouse events and calls `onSeek` for short clicks on empty areas.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Run full test suite**

```bash
cd apps/web && pnpm test
```
Expected: all existing tests still pass (markers add no regressions).

- [ ] **Step 6: Final commit**

```bash
git add apps/web/src/pages/Player.tsx
git commit -m "feat(markers): wire MarkerLayer into Player waveform — marker bubbles complete"
```

---

## Manual Verification Checklist

After implementation, test these flows in the browser:

- [ ] Short click on empty waveform → cabezal se mueve (seek funciona)
- [ ] Long press (~500ms) on waveform → dot provisional aparece → se abre modal con tiempo pre-llenado
- [ ] Escribir comentario en modal → Guardar → dot rojo aparece en posición exacta
- [ ] Short click sobre dot rojo existente → modal abre en modo editar con datos del marcador
- [ ] Modal prev/next → navega entre marcadores
- [ ] Eliminar → botón cambia a "¿Confirmar?" por 2s, segundo click elimina
- [ ] Reproducir canción → a 15s del marcador aparece burbuja con parpadeo lento
- [ ] A medida que se acerca → parpadeo se acelera
- [ ] Playhead pasa el marcador → burbuja se desvanece en 10s, dot rojo permanece
- [ ] Múltiples marcadores en posición similar → burbujas aparecen lado a lado
- [ ] Entrar a LIVE mode → click largo deshabilitado, burbujas visibles, click corto sobre dot abre modal read-only
- [ ] Cambiar de canción → marcadores son por canción (al volver, siguen ahí)
- [ ] Recargar página → marcadores persisten (guardados en localStorage via libraryStore)
