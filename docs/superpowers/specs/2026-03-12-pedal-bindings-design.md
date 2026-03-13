# Bluetooth Pedal Bindings — Design Spec
**Date:** 2026-03-12
**Status:** Approved
**Author:** Brainstorming session with Omar

---

## Problem

Musicians using SuniPlayer in live performance need to advance songs hands-free while playing. They already own a Bluetooth page-turn pedal (used for sheet music PDF apps). These pedals act as Bluetooth keyboards — each pedal press sends a keystroke. The specific key sent depends on the pedal's mode selector. The user doesn't always know which key each pedal sends.

## Goal

Let the musician configure their Bluetooth pedal to control SuniPlayer (next song, previous song, play/pause, volume up/down) using a **Learn Mode** — press a pedal, the app captures the key automatically. No technical knowledge required.

## Approach: Learn Mode + Global Keyboard Hook

A `usePedalBindings` hook listens globally for `keydown` events and dispatches actions to `usePlayerStore`. A `PedalConfig` UI component in `SettingsPanel` provides per-action "Aprender" buttons that enter listening mode — the next key press is captured and saved as that action's binding.

---

## Data Model

Added to `useSettingsStore`:

```typescript
// Pedal action identifiers
type PedalAction = 'next' | 'prev' | 'play_pause' | 'vol_up' | 'vol_down'

// A single binding: which key triggers which action
interface PedalBinding {
    key: string    // event.key value: "ArrowRight", "Space", "PageDown", etc.
    label: string  // Human-readable: "→", "Espacio", "Pág↓"
}

// Full bindings map — partial: not all actions need a binding
type PedalBindings = Partial<Record<PedalAction, PedalBinding>>
```

Default: `{}` (no bindings — user must configure).
Persisted in localStorage under `suniplayer-settings` (same key as other settings).

### Action Dictionary

| Action | Label (ES) | Effect |
|---|---|---|
| `next` | Siguiente canción | `setCi(min(ci + 1, queueLen - 1))` |
| `prev` | Canción anterior | `setCi(max(ci - 1, 0))` |
| `play_pause` | Play / Pause | `setPlaying(!playing)` |
| `vol_up` | Volumen + | `setVol(clamp(vol + 0.05, 0, 1))` |
| `vol_down` | Volumen − | `setVol(clamp(vol - 0.05, 0, 1))` |

---

## Architecture

### New files

| File | Responsibility |
|---|---|
| `src/services/usePedalBindings.ts` | Global `keydown` listener + learn mode state + action dispatch |
| `src/components/settings/PedalConfig.tsx` | UI section for SettingsPanel: binding rows, learn button, conflict detection |

### Modified files

| File | Change |
|---|---|
| `src/store/useSettingsStore.ts` | Add `pedalBindings`, `setPedalBinding`, `clearPedalBindings`, persisted |
| `src/components/layout/SettingsPanel.tsx` | Import and render `<PedalConfig />` section |
| `src/app/AppViewport.tsx` (or root) | Mount `usePedalBindings()` hook once globally |

---

## `usePedalBindings` Hook Logic

```
onMount:
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)

handleKeyDown(event):
  1. Skip if target is INPUT | TEXTAREA | [contenteditable]
  2. If learningAction !== null:
       if key === 'Escape' → cancelLearning()
       else → saveBinding(learningAction, { key: event.key, label: keyLabel(event.key) })
              setLearningAction(null)
       event.preventDefault(); return
  3. Find matching binding in pedalBindings
  4. If found → execute action → event.preventDefault()

keyLabel(key):
  'ArrowRight' → '→'  |  'ArrowLeft' → '←'
  'ArrowUp'   → '↑'  |  'ArrowDown' → '↓'
  ' '         → 'Espacio'
  'PageUp'    → 'Pág↑' | 'PageDown' → 'Pág↓'
  'Enter'     → 'Enter' | 'Escape' → 'Esc'
  default     → key (raw)
```

### Learn mode state (local to hook, not in store)
```typescript
const [learningAction, setLearningAction] = useState<PedalAction | null>(null)
// Exposed via context or prop drilling to PedalConfig
```

---

## UI — `PedalConfig` Component

### Normal state
```
┌─────────────────────────────────────────────────────┐
│  🦶 Pedalera Bluetooth                              │
│  Conecta tu pedalera y asigna cada pedal            │
├─────────────────────────────────────────────────────┤
│  Siguiente canción   [ → ArrowRight ✓ ]  [Cambiar]  │
│  Canción anterior    [ ← ArrowLeft  ✓ ]  [Cambiar]  │
│  Play / Pause        [ ␣ Espacio    ✓ ]  [Cambiar]  │
│  Volumen +           [ sin asignar  ]    [Aprender]  │
│  Volumen −           [ sin asignar  ]    [Aprender]  │
│                                    [Borrar todo]    │
└─────────────────────────────────────────────────────┘
```

### Listening state (one row at a time)
```
│  ┌───────────────────────────────────────────────┐  │
│  │  🔴  Presiona un pedal...        [Cancelar]   │  │
│  └───────────────────────────────────────────────┘  │
```
- Cyan pulse animation on the listening row
- All other rows dimmed
- `Escape` cancels

### Conflict detected
```
│  Canción anterior    [ → ArrowRight ]  [Cambiar]    │
│  ⚠️ Tecla ya asignada a "Siguiente canción"         │
│     [Reasignar aquí]  [Cancelar]                    │
```

### Activity indicator
A small cyan dot appears briefly in the section header when any mapped pedal key is received — confirms the pedal is connected and sending signal.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| User presses Escape during learn | Cancel, no change |
| Duplicate key assigned to 2 actions | Show conflict warning, offer to reassign |
| Pedal sends modifier+key (e.g. Shift+F6) | Capture `event.key` only (ignores modifiers) |
| Queue is empty when `next`/`prev` fires | No-op silently |
| `next` at end of queue | No-op (don't wrap around) |

---

## Testing

| Test | What to verify |
|---|---|
| `usePedalBindings` unit test | `next` action dispatches `setCi(ci+1)` |
| `usePedalBindings` unit test | Ignored when focus is on `<input>` |
| `usePedalBindings` unit test | Learn mode captures next key, ignores Escape |
| `usePedalBindings` unit test | Conflict: same key for two actions shows conflict |
| `PedalConfig` render test | Renders 5 action rows |
| `useSettingsStore` unit test | `pedalBindings` persists and clears |

---

## iOS / React Native Notes

The `PedalBindings` config format is platform-agnostic. Only the listener changes:

| Platform | Listener |
|---|---|
| Web / PWA | `window.addEventListener('keydown', ...)` |
| iOS SwiftUI | `UIKeyCommand` registered on root ViewController |
| React Native | `onKeyPress` on root `<View>` with `accessible` |

The same `PedalBinding` objects (key string + label) are stored identically on all platforms. See `docs/iOS/` for iOS-specific implementation.

---

## Out of Scope

- MIDI input (pedal doesn't send MIDI)
- Gamepad API (pedal doesn't register as gamepad)
- Modifier key combinations (Shift+key, Ctrl+key)
- More than 5 configurable actions (YAGNI)

---

## Success Criteria

1. Musician connects pedal, opens Settings → Pedalera section visible.
2. Clicks "Aprender" next to "Siguiente canción", presses right pedal → key captured and shown.
3. During performance, right pedal press advances to next song reliably.
4. Settings survive app reload (persisted in localStorage).
5. All existing 31 tests still pass.
6. 6 new tests cover the pedal binding logic.
