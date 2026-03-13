# Bluetooth Pedal Bindings Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let musicians configure a Bluetooth page-turn pedal to control SuniPlayer (next/prev song, play/pause, volume) using a Learn Mode — press a pedal, the app captures the keystroke automatically.

**Architecture:** A global `keydown` listener in `usePedalBindings` dispatches player actions. Learn mode state (`learningAction`) lives in `useSettingsStore` as non-persisted UI state so that the hook (mounted in AppViewport) and `PedalConfig` UI (mounted in SettingsPanel — a sibling, not a child) can both read/write it without React context machinery. The pedal bindings themselves (`pedalBindings`) are persisted in localStorage under the same `suniplayer-settings` key as all other settings.

**Tech Stack:** React 18, Zustand 4, Vitest 4, @testing-library/react 16, TypeScript 5

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/store/useSettingsStore.ts` | Modify | Add `PedalAction`, `PedalBinding`, `PedalBindings` types + store fields |
| `src/store/useSettingsStore.test.ts` | Create | Test persistence and mutation of pedalBindings |
| `src/services/usePedalBindings.ts` | Create | Global keydown listener + learn mode logic + action dispatch |
| `src/services/usePedalBindings.test.ts` | Create | Unit tests for all binding behaviors (8 tests) |
| `src/components/settings/PedalConfig.tsx` | Create | Settings UI: 5 rows with Aprender/Cambiar, listening state, conflict |
| `src/components/settings/PedalConfig.test.tsx` | Create | Render tests for the UI component |
| `src/app/AppViewport.tsx` | Modify | Mount `usePedalBindings()` once globally |
| `src/components/layout/SettingsPanel.tsx` | Modify | Import and render `<PedalConfig />` section |

---

## Chunk 1: Store Extension + Hook Logic

### Task 1: Extend useSettingsStore with pedal binding state

**Files:**
- Modify: `src/store/useSettingsStore.ts`
- Create: `src/store/useSettingsStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/store/useSettingsStore.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./useSettingsStore";

const resetStore = () => {
    localStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("useSettingsStore — pedal bindings", () => {
    beforeEach(() => {
        resetStore();
    });

    it("starts with empty bindings", () => {
        const { pedalBindings } = useSettingsStore.getState();
        expect(pedalBindings).toEqual({});
    });

    it("setPedalBinding saves a binding for an action", () => {
        const { setPedalBinding } = useSettingsStore.getState();
        setPedalBinding("next", { key: "ArrowRight", label: "→" });

        const { pedalBindings } = useSettingsStore.getState();
        expect(pedalBindings.next).toEqual({ key: "ArrowRight", label: "→" });
    });

    it("clearPedalBindings resets all bindings to {}", () => {
        const { setPedalBinding, clearPedalBindings } = useSettingsStore.getState();
        setPedalBinding("next", { key: "ArrowRight", label: "→" });
        setPedalBinding("prev", { key: "ArrowLeft", label: "←" });
        clearPedalBindings();

        expect(useSettingsStore.getState().pedalBindings).toEqual({});
    });

    it("pedalBindings are persisted in localStorage under suniplayer-settings", () => {
        const { setPedalBinding } = useSettingsStore.getState();
        setPedalBinding("play_pause", { key: " ", label: "Espacio" });

        const stored = localStorage.getItem("suniplayer-settings");
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored ?? "{}");
        expect(parsed.state.pedalBindings?.play_pause).toEqual({ key: " ", label: "Espacio" });
    });

    it("learningAction is NOT persisted (ephemeral UI state)", () => {
        const { setLearningAction } = useSettingsStore.getState();
        setLearningAction("vol_up");

        const stored = localStorage.getItem("suniplayer-settings");
        const parsed = JSON.parse(stored ?? "{}");
        expect(parsed.state.learningAction).toBeUndefined();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd C:\Users\omare\.claude\projects\SuniPlayer
npm test -- useSettingsStore
```

Expected: FAIL — `setPedalBinding is not a function` (or similar — these fields don't exist yet)

- [ ] **Step 3: Add types and extend the store**

At the top of `src/store/useSettingsStore.ts`, add the types (before the `interface SettingsState`):

```typescript
// ── Pedal Bindings ────────────────────────────────────────────────────────────
export type PedalAction = 'next' | 'prev' | 'play_pause' | 'vol_up' | 'vol_down'

export interface PedalBinding {
    key: string    // event.key value: "ArrowRight", "Space", " ", "PageDown", etc.
    label: string  // Human-readable: "→", "Espacio", "Pág↓"
}

export type PedalBindings = Partial<Record<PedalAction, PedalBinding>>
```

Add to the `SettingsState` interface (after `splMeterExpanded`):

```typescript
    // Pedal bindings
    pedalBindings: PedalBindings;
    setPedalBinding: (action: PedalAction, binding: PedalBinding) => void;
    clearPedalBindings: () => void;

    // Learn mode (non-persisted UI state — which action is currently listening)
    learningAction: PedalAction | null;
    setLearningAction: (action: PedalAction | null) => void;
```

Add to the `create()(persist(...))(set => ({...})` body (after `setSplMeterExpanded`):

```typescript
            pedalBindings: {},
            setPedalBinding: (action, binding) =>
                set((state) => ({
                    pedalBindings: { ...state.pedalBindings, [action]: binding },
                })),
            clearPedalBindings: () => set({ pedalBindings: {} }),

            learningAction: null,
            setLearningAction: (learningAction) => set({ learningAction }),
```

Add `pedalBindings` to the `partialize` object (add after `bpmMax`):

```typescript
                pedalBindings: state.pedalBindings,
```

> Note: `learningAction` is intentionally NOT in `partialize` — it resets to `null` on every page load.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- useSettingsStore
```

Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/useSettingsStore.ts src/store/useSettingsStore.test.ts
git commit -m "feat: add pedalBindings and learningAction to useSettingsStore"
```

---

### Task 2: Create usePedalBindings hook

**Files:**
- Create: `src/services/usePedalBindings.ts`
- Create: `src/services/usePedalBindings.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/services/usePedalBindings.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePedalBindings } from "./usePedalBindings";
import { useSettingsStore } from "../store/useSettingsStore";
import { usePlayerStore } from "../store/usePlayerStore";

const resetStores = () => {
    localStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
};

const fireKey = (key: string, target?: EventTarget) => {
    const event = new KeyboardEvent("keydown", { key, bubbles: true });
    if (target) {
        Object.defineProperty(event, "target", { value: target, writable: false });
    }
    window.dispatchEvent(event);
};

describe("usePedalBindings", () => {
    beforeEach(() => {
        resetStores();
    });

    it("'next' binding advances ci by 1", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });
        usePlayerStore.setState({ pQueue: [{ id: "t1" } as any, { id: "t2" } as any], ci: 0 });

        renderHook(() => usePedalBindings());

        act(() => { fireKey("ArrowRight"); });

        expect(usePlayerStore.getState().ci).toBe(1);
    });

    it("'next' at last track does not advance (no wrap)", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });
        usePlayerStore.setState({ pQueue: [{ id: "t1" } as any], ci: 0 });

        renderHook(() => usePedalBindings());

        act(() => { fireKey("ArrowRight"); });

        expect(usePlayerStore.getState().ci).toBe(0);
    });

    it("'prev' at ci=0 stays at 0 (no-op)", () => {
        useSettingsStore.getState().setPedalBinding("prev", { key: "ArrowLeft", label: "←" });
        usePlayerStore.setState({ pQueue: [{ id: "t1" } as any, { id: "t2" } as any], ci: 0 });

        renderHook(() => usePedalBindings());

        act(() => { fireKey("ArrowLeft"); });

        expect(usePlayerStore.getState().ci).toBe(0);
    });

    it("'play_pause' toggles playing state", () => {
        useSettingsStore.getState().setPedalBinding("play_pause", { key: " ", label: "Espacio" });
        usePlayerStore.setState({ playing: false });

        renderHook(() => usePedalBindings());

        act(() => { fireKey(" "); });
        expect(usePlayerStore.getState().playing).toBe(true);

        act(() => { fireKey(" "); });
        expect(usePlayerStore.getState().playing).toBe(false);
    });

    it("ignores keypresses when target is an INPUT element", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });
        usePlayerStore.setState({ pQueue: [{ id: "t1" } as any, { id: "t2" } as any], ci: 0 });

        renderHook(() => usePedalBindings());

        const input = document.createElement("input");
        act(() => {
            const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
            Object.defineProperty(event, "target", { value: input, writable: false });
            window.dispatchEvent(event);
        });

        expect(usePlayerStore.getState().ci).toBe(0); // unchanged
    });

    it("learn mode: Escape cancels without saving", () => {
        useSettingsStore.getState().setLearningAction("next");

        renderHook(() => usePedalBindings());

        act(() => { fireKey("Escape"); });

        expect(useSettingsStore.getState().learningAction).toBeNull();
        expect(useSettingsStore.getState().pedalBindings.next).toBeUndefined();
    });

    it("learn mode: non-Escape key saves binding and clears learningAction", () => {
        useSettingsStore.getState().setLearningAction("vol_up");

        renderHook(() => usePedalBindings());

        act(() => { fireKey("PageUp"); });

        expect(useSettingsStore.getState().learningAction).toBeNull();
        expect(useSettingsStore.getState().pedalBindings.vol_up).toEqual({
            key: "PageUp",
            label: "Pág↑",
        });
    });

    it("conflict: saving a key already assigned to another action still saves, allowing PedalConfig to detect the duplicate", () => {
        // Pre-assign 'next' to ArrowRight
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });
        // Now learn 'prev' and press ArrowRight (same key)
        useSettingsStore.getState().setLearningAction("prev");

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        renderHook(() => usePedalBindings());

        act(() => { fireKey("ArrowRight"); });

        // The binding should still be saved — conflict resolution is the UI's job
        expect(useSettingsStore.getState().pedalBindings.prev).toEqual({
            key: "ArrowRight",
            label: "→",
        });
        // And the store should now have two actions sharing the same key
        // PedalConfig's useEffect will detect this and show the conflict UI
        expect(useSettingsStore.getState().pedalBindings.next?.key).toBe("ArrowRight");

        warnSpy.mockRestore();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- usePedalBindings
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement usePedalBindings**

Create `src/services/usePedalBindings.ts`:

```typescript
import { useEffect } from "react";
import { useSettingsStore, PedalAction } from "../store/useSettingsStore";
import { usePlayerStore } from "../store/usePlayerStore";

/** Maps raw event.key values to human-readable labels */
function keyLabel(key: string): string {
    const map: Record<string, string> = {
        ArrowRight: "→",
        ArrowLeft: "←",
        ArrowUp: "↑",
        ArrowDown: "↓",
        " ": "Espacio",
        PageUp: "Pág↑",
        PageDown: "Pág↓",
        Enter: "Enter",
        Escape: "Esc",
    };
    return map[key] ?? key;
}

/** Returns true if the key event originated from a text input element */
function isTypingTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return true;
    if (target.isContentEditable) return true;
    return false;
}

/**
 * usePedalBindings — mount once globally in AppViewport.
 *
 * Listens for keydown events on the window.
 * - In learn mode: captures the next key press as a binding.
 * - In normal mode: dispatches the mapped player action.
 *
 * learningAction state lives in useSettingsStore (non-persisted)
 * so PedalConfig (a sibling component) can read/write it too.
 */
export function usePedalBindings() {
    const pedalBindings = useSettingsStore((s) => s.pedalBindings);
    const learningAction = useSettingsStore((s) => s.learningAction);
    const setPedalBinding = useSettingsStore((s) => s.setPedalBinding);
    const setLearningAction = useSettingsStore((s) => s.setLearningAction);

    const ci = usePlayerStore((s) => s.ci);
    const pQueue = usePlayerStore((s) => s.pQueue);
    const playing = usePlayerStore((s) => s.playing);
    const vol = usePlayerStore((s) => s.vol);
    const setCi = usePlayerStore((s) => s.setCi);
    const setPlaying = usePlayerStore((s) => s.setPlaying);
    const setVol = usePlayerStore((s) => s.setVol);

    useEffect(() => {
        // Use refs to avoid stale closure issues — always read latest state
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isTypingTarget(event.target)) return;

            // ── Learn mode ──────────────────────────────────────────────────
            const currentLearning = useSettingsStore.getState().learningAction;
            if (currentLearning !== null) {
                event.preventDefault();
                if (event.key === "Escape") {
                    setLearningAction(null);
                } else {
                    setPedalBinding(currentLearning, {
                        key: event.key,
                        label: keyLabel(event.key),
                    });
                    setLearningAction(null);
                }
                return;
            }

            // ── Normal mode — find matching binding ──────────────────────────
            const bindings = useSettingsStore.getState().pedalBindings;
            const matchedAction = (
                Object.entries(bindings) as [PedalAction, { key: string }][]
            ).find(([, b]) => b.key === event.key)?.[0];

            if (!matchedAction) return;
            event.preventDefault();

            const { ci: currentCi, pQueue: currentQueue, playing: currentPlaying, vol: currentVol } =
                usePlayerStore.getState();

            switch (matchedAction) {
                case "next":
                    if (currentCi < currentQueue.length - 1) {
                        setCi(currentCi + 1);
                    }
                    break;
                case "prev":
                    if (currentCi > 0) {
                        setCi(currentCi - 1);
                    }
                    break;
                case "play_pause":
                    setPlaying(!currentPlaying);
                    break;
                case "vol_up":
                    setVol(Math.min(currentVol + 0.05, 1));
                    break;
                case "vol_down":
                    setVol(Math.max(currentVol - 0.05, 0));
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps: reads latest state from store directly — no stale closure
}
```

> **Architecture note:** `handleKeyDown` reads from store directly via `useSettingsStore.getState()` and `usePlayerStore.getState()` inside the handler — this avoids stale closure problems without needing to re-register the listener on every state change. The `useEffect` runs once on mount.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- usePedalBindings
```

Expected: 8 tests PASS (7 behavior tests + 1 conflict detection test)

- [ ] **Step 5: Run full suite to make sure nothing broke**

```bash
npm test
```

Expected: all 31 + 5 + 7 = 43 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/usePedalBindings.ts src/services/usePedalBindings.test.ts
git commit -m "feat: implement usePedalBindings hook with learn mode and global keydown dispatch"
```

---

## Chunk 2: UI Component + Integration

### Task 3: Create PedalConfig component

**Files:**
- Create: `src/components/settings/PedalConfig.tsx`
- Create: `src/components/settings/PedalConfig.test.tsx`

- [ ] **Step 1: Write the failing render tests**

Create `src/components/settings/PedalConfig.test.tsx`:

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { PedalConfig } from "./PedalConfig";

const resetStore = () => {
    localStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("PedalConfig", () => {
    beforeEach(() => {
        resetStore();
        cleanup();
    });

    it("renders 5 action rows with their Spanish labels", () => {
        render(<PedalConfig />);

        expect(screen.getByText("Siguiente canción")).toBeTruthy();
        expect(screen.getByText("Canción anterior")).toBeTruthy();
        expect(screen.getByText("Play / Pause")).toBeTruthy();
        expect(screen.getByText("Volumen +")).toBeTruthy();
        expect(screen.getByText("Volumen −")).toBeTruthy();
    });

    it("shows 'Aprender' buttons for all unbound actions", () => {
        render(<PedalConfig />);

        const buttons = screen.getAllByText("Aprender");
        expect(buttons.length).toBe(5);
    });

    it("shows 'Cambiar' for a bound action and hides its Aprender button", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });

        render(<PedalConfig />);

        expect(screen.getByText("Cambiar")).toBeTruthy();
        expect(screen.queryByText("Aprender")).toBeTruthy(); // other 4 still show Aprender
        expect(screen.getAllByText("Aprender").length).toBe(4);
    });

    it("shows the bound key label for a configured action", () => {
        useSettingsStore.getState().setPedalBinding("play_pause", { key: " ", label: "Espacio" });

        render(<PedalConfig />);

        expect(screen.getByText("Espacio")).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- PedalConfig
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement PedalConfig component**

Create `src/components/settings/PedalConfig.tsx`:

```tsx
import React from "react";
import { useSettingsStore, PedalAction, PedalBinding } from "../../store/useSettingsStore";
import { THEME } from "../../data/theme";

// ── Action definitions ────────────────────────────────────────────────────────
const PEDAL_ACTIONS: { action: PedalAction; label: string }[] = [
    { action: "next",       label: "Siguiente canción" },
    { action: "prev",       label: "Canción anterior" },
    { action: "play_pause", label: "Play / Pause" },
    { action: "vol_up",     label: "Volumen +" },
    { action: "vol_down",   label: "Volumen −" },
];

// ── Conflict detection ────────────────────────────────────────────────────────
function findConflict(
    bindings: Partial<Record<PedalAction, PedalBinding>>,
    forAction: PedalAction,
    candidateKey: string
): PedalAction | null {
    for (const [action, binding] of Object.entries(bindings) as [PedalAction, PedalBinding][]) {
        if (action !== forAction && binding.key === candidateKey) return action;
    }
    return null;
}

// ── PedalConfig ───────────────────────────────────────────────────────────────
export const PedalConfig: React.FC = () => {
    const pedalBindings = useSettingsStore((s) => s.pedalBindings);
    const setPedalBinding = useSettingsStore((s) => s.setPedalBinding);
    const clearPedalBindings = useSettingsStore((s) => s.clearPedalBindings);
    const learningAction = useSettingsStore((s) => s.learningAction);
    const setLearningAction = useSettingsStore((s) => s.setLearningAction);

    // Conflict state: { forAction, conflictingWith, proposedBinding }
    const [pendingConflict, setPendingConflict] = React.useState<{
        forAction: PedalAction;
        conflictsWith: PedalAction;
        binding: PedalBinding;
    } | null>(null);

    // Conflict detection: watch pedalBindings for duplicate keys after each save
    React.useEffect(() => {
        for (const { action } of PEDAL_ACTIONS) {
            const binding = pedalBindings[action];
            if (!binding) continue;
            const conflict = findConflict(pedalBindings, action, binding.key);
            if (conflict && !pendingConflict) {
                setPendingConflict({
                    forAction: action,
                    conflictsWith: conflict,
                    binding,
                });
                return;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pedalBindings]);

    // Activity flash: briefly show a cyan dot when a bound key fires
    const [activityFlash, setActivityFlash] = React.useState(false);
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const match = Object.values(pedalBindings).some((b) => b?.key === e.key);
            if (match) {
                setActivityFlash(true);
                setTimeout(() => setActivityFlash(false), 300);
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [pedalBindings]);

    const actionLabel = (action: PedalAction): string =>
        PEDAL_ACTIONS.find((a) => a.action === action)?.label ?? action;

    return (
        <div>
            {/* Section header */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "20px 0 8px",
            }}>
                <span style={{ fontSize: 18 }}>🦶</span>
                <span style={{
                    fontSize: 11, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    color: THEME.colors.text.muted, flex: 1,
                }}>
                    Pedalera Bluetooth
                </span>
                {activityFlash && (
                    <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        backgroundColor: THEME.colors.brand.cyan,
                        boxShadow: `0 0 6px ${THEME.colors.brand.cyan}`,
                        display: "inline-block",
                    }} />
                )}
            </div>
            <p style={{ fontSize: 12, color: THEME.colors.text.muted, margin: "0 0 12px" }}>
                Conecta tu pedalera y asigna cada pedal
            </p>

            {/* Listening banner */}
            {learningAction && (
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: `${THEME.colors.brand.cyan}12`,
                    border: `1px solid ${THEME.colors.brand.cyan}40`,
                    borderRadius: THEME.radius.md,
                    marginBottom: 12,
                    animation: "pedalPulse 1s ease-in-out infinite",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            backgroundColor: "#EF4444",
                            boxShadow: "0 0 6px #EF4444",
                        }} />
                        <span style={{ fontSize: 13, color: THEME.colors.text.primary }}>
                            Presiona un pedal...
                        </span>
                    </div>
                    <button
                        onClick={() => setLearningAction(null)}
                        style={{
                            background: "none", border: "none",
                            cursor: "pointer", fontSize: 13,
                            color: THEME.colors.text.muted, padding: "4px 8px",
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Conflict warning */}
            {pendingConflict && (
                <div style={{
                    padding: "12px 16px",
                    backgroundColor: `${THEME.colors.status.warning}12`,
                    border: `1px solid ${THEME.colors.status.warning}40`,
                    borderRadius: THEME.radius.md,
                    marginBottom: 12,
                }}>
                    <div style={{ fontSize: 13, color: THEME.colors.status.warning, marginBottom: 8 }}>
                        ⚠️ Tecla ya asignada a &quot;{actionLabel(pendingConflict.conflictsWith)}&quot;
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={() => {
                                setPedalBinding(pendingConflict.forAction, pendingConflict.binding);
                                // Remove the old binding for conflicting action
                                const current = useSettingsStore.getState().pedalBindings;
                                const next = { ...current };
                                delete next[pendingConflict.conflictsWith];
                                useSettingsStore.setState({ pedalBindings: next });
                                setPendingConflict(null);
                            }}
                            style={{
                                padding: "6px 12px", borderRadius: THEME.radius.sm,
                                border: `1px solid ${THEME.colors.status.warning}`,
                                backgroundColor: "transparent",
                                color: THEME.colors.status.warning,
                                cursor: "pointer", fontSize: 12, fontWeight: 700,
                            }}
                        >
                            Reasignar aquí
                        </button>
                        <button
                            onClick={() => setPendingConflict(null)}
                            style={{
                                padding: "6px 12px", borderRadius: THEME.radius.sm,
                                border: `1px solid ${THEME.colors.border}`,
                                backgroundColor: "transparent",
                                color: THEME.colors.text.muted,
                                cursor: "pointer", fontSize: 12,
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Action rows */}
            {PEDAL_ACTIONS.map(({ action, label }) => {
                const binding = pedalBindings[action];
                const isLearning = learningAction === action;
                const isDimmed = learningAction !== null && !isLearning;

                return (
                    <div
                        key={action}
                        style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom: `1px solid ${THEME.colors.border}`,
                            opacity: isDimmed ? 0.35 : 1,
                            transition: "opacity 0.2s",
                        }}
                    >
                        {/* Label */}
                        <span style={{
                            fontSize: 14, fontWeight: 600,
                            color: THEME.colors.text.primary, flex: 1,
                        }}>
                            {label}
                        </span>

                        {/* Binding badge */}
                        <div style={{
                            padding: "4px 10px",
                            backgroundColor: binding
                                ? `${THEME.colors.brand.cyan}15`
                                : "rgba(255,255,255,0.04)",
                            border: `1px solid ${binding
                                ? THEME.colors.brand.cyan + "40"
                                : THEME.colors.border}`,
                            borderRadius: THEME.radius.sm,
                            fontSize: 12,
                            fontFamily: THEME.fonts.mono,
                            color: binding ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                            minWidth: 90,
                            textAlign: "center",
                            marginRight: 8,
                        }}>
                            {binding ? binding.label : "sin asignar"}
                        </div>

                        {/* Action button */}
                        <button
                            onClick={() => {
                                if (!isDimmed) setLearningAction(action);
                            }}
                            disabled={isDimmed}
                            style={{
                                padding: "6px 12px",
                                borderRadius: THEME.radius.sm,
                                border: `1px solid ${isLearning
                                    ? THEME.colors.brand.cyan
                                    : THEME.colors.border}`,
                                backgroundColor: isLearning
                                    ? `${THEME.colors.brand.cyan}20`
                                    : "transparent",
                                color: isLearning
                                    ? THEME.colors.brand.cyan
                                    : THEME.colors.text.muted,
                                cursor: isDimmed ? "default" : "pointer",
                                fontSize: 12, fontWeight: 700,
                                minWidth: 72,
                            }}
                        >
                            {binding ? "Cambiar" : "Aprender"}
                        </button>
                    </div>
                );
            })}

            {/* Clear all */}
            <div style={{ paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => { clearPedalBindings(); setPendingConflict(null); }}
                    style={{
                        padding: "6px 12px",
                        borderRadius: THEME.radius.sm,
                        border: `1px solid ${THEME.colors.status.error}40`,
                        backgroundColor: "transparent",
                        color: THEME.colors.status.error,
                        cursor: "pointer", fontSize: 12,
                    }}
                >
                    Borrar todo
                </button>
            </div>

            {/* Pulse animation for listening state */}
            <style>{`
                @keyframes pedalPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div>
    );
};
```

> **Conflict note:** When the user clicks "Aprender/Cambiar" the `learningAction` is set in the store. The actual key capture happens in `usePedalBindings` (which is mounted in AppViewport). After capture, the hook saves via `setPedalBinding`. The `PedalConfig` component uses a `useEffect` to detect conflicts in real time after the store updates — for simplicity, conflicts are resolved via `pendingConflict` local state if user tries to reasign a key that's already used, detected in the binding badge render.

> **Conflict detection in learn mode:** The current architecture has the hook capture the key and save it immediately. For full conflict detection in PedalConfig, the component watches `pedalBindings` changes (via Zustand subscription) and checks for duplicate keys after each save. A simpler approach: on the "Aprender" button click, wrap `setLearningAction` to also register a listener that checks for conflicts after binding is saved. For MVP, the conflict check can be done post-save in a `useEffect` watching `pedalBindings`. The spec allows either approach.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- PedalConfig
```

Expected: 4 tests PASS

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/PedalConfig.tsx src/components/settings/PedalConfig.test.tsx
git commit -m "feat: add PedalConfig component with learn mode UI and conflict detection"
```

---

### Task 4: Wire usePedalBindings into AppViewport

**Files:**
- Modify: `src/app/AppViewport.tsx`

- [ ] **Step 1: Add the hook call**

In `src/app/AppViewport.tsx`, add the import at the top (alongside the `useAudio` import):

```typescript
import { usePedalBindings } from "../services/usePedalBindings";
```

Add the hook call directly below `useAudio()`:

```typescript
    useAudio();
    usePedalBindings();
```

The diff is minimal — just 2 lines change.

- [ ] **Step 2: Run full suite**

```bash
npm test
```

Expected: all tests still pass (the hook does nothing in the test environment since no bindings are configured by default)

- [ ] **Step 3: Commit**

```bash
git add src/app/AppViewport.tsx
git commit -m "feat: mount usePedalBindings globally in AppViewport"
```

---

### Task 5: Render PedalConfig in SettingsPanel

**Files:**
- Modify: `src/components/layout/SettingsPanel.tsx`

- [ ] **Step 1: Add the import**

At the top of `src/components/layout/SettingsPanel.tsx`, add:

```typescript
import { PedalConfig } from "../settings/PedalConfig";
```

- [ ] **Step 2: Add the section in the content area**

Inside the scrollable content `<div>` (after the `{/* ── Set Builder ── */}` section, before `{/* ── Audio Files ── */}`), insert:

```tsx
                    {/* ── Pedalera Bluetooth ── */}
                    <PedalConfig />
```

The exact insertion point in `SettingsPanel.tsx` is after line 329 (`</SliderRow>` for BPM máximo), before line 331 (`{/* ── Audio Files ── */}`):

```tsx
                    {/* existing BPM slider row above this */}

                    {/* ── Pedalera Bluetooth ── */}
                    <PedalConfig />

                    {/* ── Audio Files ── */}
```

- [ ] **Step 3: Run full suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/SettingsPanel.tsx
git commit -m "feat: render PedalConfig in SettingsPanel between Set Builder and Audio Files sections"
```

---

## Final Verification

- [ ] **Run full test suite one last time**

```bash
npm test
```

Expected output:
```
✓ src/store/useSettingsStore.test.ts (5 tests)
✓ src/services/usePedalBindings.test.ts (8 tests)
✓ src/components/settings/PedalConfig.test.tsx (4 tests)
... all previous 31 tests ...
Test Files: 14 passed
Tests:      48 passed
```

- [ ] **Typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Final commit (if any stray changes)**

```bash
git log --oneline -6
```

Expected commits (newest first):
```
feat: render PedalConfig in SettingsPanel between Set Builder and Audio Files sections
feat: mount usePedalBindings globally in AppViewport
feat: add PedalConfig component with learn mode UI and conflict detection
feat: implement usePedalBindings hook with learn mode and global keydown dispatch
feat: add pedalBindings and learningAction to useSettingsStore
```

---

## Success Criteria Checklist

- [ ] Musician connects pedal → Settings → "Pedalera Bluetooth" section visible
- [ ] Clicks "Aprender" next to "Siguiente canción", presses right pedal → key captured and shown
- [ ] During performance, right pedal press advances to next song reliably
- [ ] Settings survive app reload (persisted in localStorage under `suniplayer-settings`)
- [ ] All 31 existing tests still pass
- [ ] 17 new tests cover the pedal binding logic (5 store + 8 hook + 4 UI)

---

## iOS / React Native Notes

The `PedalBindings` config objects (key string + label) are stored identically on all platforms. Only the listener changes:

| Platform | Swap `window.addEventListener('keydown', ...)` with |
|---|---|
| iOS SwiftUI | `UIKeyCommand` registered on root `UIViewController` |
| React Native | `onKeyPress` on root `<View accessible>` |

See `docs/superpowers/specs/2026-03-12-pedal-bindings-design.md` for iOS-specific details.
