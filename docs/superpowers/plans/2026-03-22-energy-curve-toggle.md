# Energy Curve Toggle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent show/hide toggle for the Energy Curve panel in the Player tab, persist its expand state, and move the TABLET UI button from the superpoderes row into the Settings panel.

**Architecture:** Two new boolean fields (`curveVisible`, `curveExpanded`) are added to `useSettingsStore` and persisted via `partialize`. Player.tsx reads them from the store (removing local `useState`), renders a `CURVE` button in the superpoderes row only when a set curve exists, and passes `curveVisible` to Dashboard. SettingsPanel gets a new Toggle row for `performanceMode`.

**Tech Stack:** React 18, Zustand 4 + persist middleware, TypeScript 5, Vitest 4

**Spec:** `docs/superpowers/specs/2026-03-22-energy-curve-toggle-design.md`

---

## Chunk 1: Store — add curveVisible + curveExpanded

### Task 1: Add fields to useSettingsStore

**Files:**
- Modify: `apps/web/src/store/useSettingsStore.ts`
- Modify: `apps/web/src/store/useSettingsStore.test.ts`

- [ ] **Step 1: Write failing tests**

Open `apps/web/src/store/useSettingsStore.test.ts` and add a new `describe` block at the end:

```typescript
describe("useSettingsStore — curve panel visibility", () => {
    beforeEach(() => {
        resetStore();
    });

    it("curveVisible defaults to true", () => {
        const { curveVisible } = useSettingsStore.getState();
        expect(curveVisible).toBe(true);
    });

    it("setCurveVisible toggles visibility", () => {
        const { setCurveVisible } = useSettingsStore.getState();
        setCurveVisible(false);
        expect(useSettingsStore.getState().curveVisible).toBe(false);
        setCurveVisible(true);
        expect(useSettingsStore.getState().curveVisible).toBe(true);
    });

    it("curveExpanded defaults to true", () => {
        const { curveExpanded } = useSettingsStore.getState();
        expect(curveExpanded).toBe(true);
    });

    it("setCurveExpanded toggles expansion", () => {
        const { setCurveExpanded } = useSettingsStore.getState();
        setCurveExpanded(false);
        expect(useSettingsStore.getState().curveExpanded).toBe(false);
    });

    it("curveVisible and curveExpanded are persisted in localStorage", () => {
        const { setCurveVisible, setCurveExpanded } = useSettingsStore.getState();
        setCurveVisible(false);
        setCurveExpanded(false);
        const stored = localStorage.getItem("suniplayer-settings");
        const parsed = JSON.parse(stored ?? "{}");
        expect(parsed.state.curveVisible).toBe(false);
        expect(parsed.state.curveExpanded).toBe(false);
    });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/web && pnpm exec vitest run src/store/useSettingsStore.test.ts
```

Expected: 4 new tests FAIL with `curveVisible is not a function` or `undefined`.

- [ ] **Step 3: Add fields to the store interface**

In `apps/web/src/store/useSettingsStore.ts`, add to the `SettingsState` interface after the `splMeterExpanded` block (line 63, before `// Pedal bindings`):

```typescript
// Energy Curve panel
curveVisible: boolean;
setCurveVisible: (v: boolean) => void;
curveExpanded: boolean;
setCurveExpanded: (v: boolean) => void;
```

- [ ] **Step 4: Add initial state and setters**

In the same file, inside the `create` call, add after the `splMeterExpanded` block (after line ~121):

```typescript
curveVisible: true,
setCurveVisible: (curveVisible) => set({ curveVisible }),
curveExpanded: true,
setCurveExpanded: (curveExpanded) => set({ curveExpanded }),
```

- [ ] **Step 5: Add to partialize**

In the `partialize` function (around line ~160), add after `splMeterExpanded: state.splMeterExpanded,`:

```typescript
curveVisible: state.curveVisible,
curveExpanded: state.curveExpanded,
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd apps/web && pnpm exec vitest run src/store/useSettingsStore.test.ts
```

Expected: All tests PASS including the 4 new ones.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/store/useSettingsStore.ts apps/web/src/store/useSettingsStore.test.ts
git commit -m "feat(store): add curveVisible + curveExpanded to useSettingsStore"
```

---

## Chunk 2: Dashboard — accept curveVisible prop

### Task 2: Update Dashboard.tsx interface and render condition

**Files:**
- Modify: `apps/web/src/components/player/Dashboard.tsx`

- [ ] **Step 1: Add `curveVisible` to DashboardProps interface**

In `apps/web/src/components/player/Dashboard.tsx`, find the `DashboardProps` interface (around line 12) and add after `setCurveExpanded`:

```typescript
/** When false, the Energy Curve section is hidden regardless of curve value */
curveVisible: boolean;
```

- [ ] **Step 2: Add `curveVisible` to the destructured props**

Find the `export const Dashboard: React.FC<DashboardProps> = ({` destructuring (around line 150) and add `curveVisible` to the list.

- [ ] **Step 3: Update the Energy Curve render condition**

Find the line:
```typescript
{curve && (
```
inside the `{/* ── ENERGY CURVE ── */}` section (around line 317) and change it to:
```typescript
{curve && curveVisible && (
```

- [ ] **Step 4: TypeScript check**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: Error about `curveVisible` missing from the call site in `Player.tsx` — that's fine, we fix it next. No other errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/player/Dashboard.tsx
git commit -m "feat(dashboard): add curveVisible prop to control Energy Curve panel visibility"
```

---

## Chunk 3: Player.tsx — wire store, add CURVE button, remove TABLET UI button

### Task 3: Update Player.tsx

**Files:**
- Modify: `apps/web/src/pages/Player.tsx`

- [ ] **Step 1: Replace local curveExpanded useState with store**

Find this line (around line 67):
```typescript
const [curveExpanded, setCurveExpanded] = useState(true);
```

Remove it. Then, in the store selectors section, add alongside the existing `useSettingsStore` reads (near `performanceMode` at line ~60):

```typescript
const curveVisible = useSettingsStore(s => s.curveVisible);
const setCurveVisible = useSettingsStore(s => s.setCurveVisible);
const curveExpanded = useSettingsStore(s => s.curveExpanded);
const setCurveExpanded = useSettingsStore(s => s.setCurveExpanded);
```

- [ ] **Step 2: Add curveVisible prop to the Dashboard call**

Find the `<Dashboard` JSX (around line 226) and add `curveVisible={curveVisible}` to its props.

- [ ] **Step 3: Remove the TABLET UI button from the superpoderes row**

Find and remove this entire button element in the superpoderes row (around line 222):
```typescript
<button onClick={() => setPerformanceMode(!performanceMode)} style={{ padding: "10px 16px", borderRadius: THEME.radius.md, border: `1px solid ${performanceMode ? THEME.colors.brand.pink : "rgba(255,255,255,0.1)"}`, background: performanceMode ? THEME.colors.brand.pink + "20" : "transparent", color: performanceMode ? THEME.colors.brand.pink : THEME.colors.text.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }} title="Modo Tablet/Performance">TABLET UI</button>
```

- [ ] **Step 4: Add the CURVE button to the superpoderes row**

In the same superpoderes row `<div>`, add the `CURVE` button after `METER` and before the queue toggle button (`setShowQueue`). It should only render when `curve` has a value:

```typescript
{curve && (
    <button
        onClick={() => setCurveVisible(!curveVisible)}
        style={{
            padding: "10px 16px",
            borderRadius: THEME.radius.md,
            border: `1px solid ${curveVisible ? THEME.colors.brand.violet : "rgba(255,255,255,0.1)"}`,
            background: curveVisible ? THEME.colors.brand.violet + "20" : "transparent",
            color: curveVisible ? THEME.colors.brand.violet : THEME.colors.text.muted,
            fontSize: 11, fontWeight: 900, cursor: "pointer"
        }}
        title="Curva de Energía del Set"
    >
        CURVE
    </button>
)}
```

- [ ] **Step 5: TypeScript check**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/Player.tsx
git commit -m "feat(player): add persistent CURVE toggle, remove TABLET UI from superpoderes row"
```

---

## Chunk 4: SettingsPanel — add Tablet UI toggle

### Task 4: Add performanceMode Toggle to SettingsPanel

**Files:**
- Modify: `apps/web/src/components/layout/SettingsPanel.tsx`

- [ ] **Step 1: Read performanceMode from the store**

In `SettingsPanel.tsx`, `performanceMode` is currently NOT read from the store (it was only controlled from Player.tsx). Add these two lines after the `resetApp` selector (around line 118):

```typescript
const performanceMode = useSettingsStore(s => s.performanceMode);
const setPerformanceMode = useSettingsStore(s => s.setPerformanceMode);
```

Add the import for `useSettingsStore` at the top of the file (it is not currently imported):
```typescript
import { useSettingsStore } from "../../store/useSettingsStore";
```

- [ ] **Step 2: Add the Toggle row in the Reproducción section**

Find the last `<Toggle>` in the "Reproducción" section — it is the Sonómetro toggle (around line 255). After the `{splMeterEnabled && (...)}` conditional block (around line 283), add:

```typescript
<Toggle
    label="Modo Tablet / Escenario"
    description="Aumenta el tamaño de fuentes y controles para uso en escenario"
    checked={performanceMode}
    onChange={setPerformanceMode}
/>
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run full test suite**

```bash
cd apps/web && pnpm exec vitest run
```

Expected: All tests pass (113+ tests, 0 failures).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/SettingsPanel.tsx
git commit -m "feat(settings): add Tablet UI toggle in Configuración panel"
```

---

## Chunk 5: Manual verification checklist

- [ ] **Step 1: Start dev server**

```bash
cd apps/web && pnpm dev
```

- [ ] **Step 2: Verify CURVE button behavior**

1. Open Player tab
2. If no set is built (no curve): confirm the `CURVE` button does NOT appear in the superpoderes row
3. Go to Builder, generate a set with any energy curve (e.g. "Ascending"), go back to Player
4. Confirm `CURVE` button appears, styled in violet
5. Click it: Energy Curve panel should disappear from Dashboard
6. Click again: panel reappears
7. Reload the page: confirm the visibility state persisted (if you hid it, it stays hidden)

- [ ] **Step 3: Verify curveExpanded persistence**

1. With the CURVE panel visible, click the panel header chevron to collapse it
2. Reload — confirm it stays collapsed (previously it always reopened as `useState(true)`)

- [ ] **Step 4: Verify TABLET UI is gone from superpoderes row**

Confirm the `TABLET UI` button no longer appears in the Player page toolbar.

- [ ] **Step 5: Verify Tablet UI toggle in Settings**

1. Open Settings (gear icon)
2. Scroll to "Reproducción" section
3. Confirm "Modo Tablet / Escenario" toggle is present
4. Toggle it on: Player UI should switch to large-font performance mode
5. Reload: confirm it persists

- [ ] **Step 6: Final commit if any cleanup needed, then done**

```bash
git log --oneline -5
```
