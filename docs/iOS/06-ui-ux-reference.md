# 06 — UI/UX Reference: Web → SwiftUI

## Design Tokens

### Colors (from `src/data/theme.ts`)

| Token | Hex | SwiftUI |
|---|---|---|
| Background | `#0A0E14` | `Color(hex: "0A0E14")` |
| Surface | `rgba(255,255,255,0.02)` | `Color.white.opacity(0.02)` |
| Border | `rgba(255,255,255,0.04)` | `Color.white.opacity(0.04)` |
| Text primary | `#F0F4F8` | `Color(hex: "F0F4F8")` |
| Text secondary | `rgba(255,255,255,0.4)` | `Color.white.opacity(0.4)` |
| Text muted | `rgba(255,255,255,0.25)` | `Color.white.opacity(0.25)` |
| Brand cyan | `#06B6D4` | `Color(hex: "06B6D4")` |
| Brand violet | `#8B5CF6` | `Color(hex: "8B5CF6")` |
| Brand pink | `#EC4899` | `Color(hex: "EC4899")` |
| Status success | `#10B981` | `Color(hex: "10B981")` |
| Status warning | `#F59E0B` | `Color(hex: "F59E0B")` |
| Status error | `#EF4444` | `Color(hex: "EF4444")` |

### Typography (from `src/data/theme.ts`)

| Usage | Web | SwiftUI |
|---|---|---|
| Body | `DM Sans` | `.body` with custom font or SF Pro |
| Mono | `JetBrains Mono` | `.system(.body, design: .monospaced)` |
| Track title | 36px, weight 900 | `.largeTitle.bold()` |
| Section header | 32px, weight 700 | `.title.bold()` |
| Track row label | 16px, weight 600 | `.headline` |

### Border Radius

| Token | Value | SwiftUI |
|---|---|---|
| sm | 6px | `.cornerRadius(6)` |
| md | 8px | `.cornerRadius(8)` |
| lg | 10px | `.cornerRadius(10)` |
| xl | 12px | `.cornerRadius(12)` |
| full | 99px | `.clipShape(Capsule())` |

---

## Screen Layouts

### Screen 1: Player

```
┌─────────────────────────────┐
│  ← [back]     SUNI    [⚙️]  │  ← NavigationBar
├─────────────────────────────┤
│                             │
│  ████  Track Title          │  ← HStack: artwork + VStack(title, artist)
│        Artist Name          │    title: largeTitle.bold, cyan accent
│        [KEY] [BPM] [♩ 1.0x] │    badges: capsule, border color
│                             │
│  ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░  │  ← Waveform + scrubber (custom view)
│  1:23              3:45     │    position left, duration right, muted text
│                             │
│  [◀◀]  [⏸]  [▶▶]          │  ← HStack, iconSize 44pt, brand cyan
│  [FADE] [CROSS] [LOOP]     │  ← mode toggles, smaller, secondary text
│                             │
│  ────── QUEUE ──────────── │  ← Section header
│  ○ Song 2    Artist   3:12  │  ← List rows
│  ○ Song 3    Artist   4:05  │
└─────────────────────────────┘
```

**Key interactions:**
- Tap waveform to seek
- Swipe track row to remove from queue
- Long-press track row to see profile modal
- Pull down for now-playing fullscreen

---

### Screen 2: Library

```
┌─────────────────────────────┐
│  Tu Biblioteca Local        │  ← Large title
│  Sincronizada con: /music   │  ← Subtitle, muted
│              [+ Importar]   │  ← Brand cyan button
├─────────────────────────────┤
│  🔍 Buscar...               │  ← Search bar
├─────────────────────────────┤
│  ● Song Title          ●   │  ← TrackRow
│    Artist  •  3:45  •  C♯  │    key badge in cyan
│    [▶ Preview] [✎] [+Queue]│    action buttons
│  ─────────────────────────  │
│  ● Song Title 2        ●   │
│    Artist  •  4:12  •  G   │
└─────────────────────────────┘
```

**TrackRow actions (swipe or context menu):**
- Add to queue
- Edit profile (pitch, tempo, trim, notes)
- View sheet music

---

### Screen 3: Set Builder

```
┌─────────────────────────────┐
│  Constructor de Sets        │  ← Title
├─────────────────────────────┤
│  Duración objetivo          │
│  [−] ──●──────── [+]  45min │  ← Slider, brand cyan
│                             │
│  Venue    [Lobby ▾]         │  ← Picker
│  Curva    [Estable ▾]       │  ← Picker
│  BPM      [80 – 140]        │  ← Range slider
│                             │
│       [GENERAR SET]         │  ← Large brand button, gradient bg
├─────────────────────────────┤
│  Set Generado (45:12)       │  ← Section header with duration
│  1. Song Title    3:45 C♯  │  ← Ordered list
│  2. Song Title 2  4:12 G   │
│  3. ...                     │
│                             │
│  [REPRODUCIR] [GUARDAR]     │  ← Action buttons
└─────────────────────────────┘
```

---

### Screen 4: Track Profile Modal

```
┌─────────────────────────────┐
│  [✕]  Perfil: Song Title    │  ← Modal header
├─────────────────────────────┤
│  🎵 PREVIEW  [▶ 30s]        │  ← Play 30-second preview
├─────────────────────────────┤
│  Tono          [−] 0 [+]    │  ← Pitch in semitones, stepper
│  Tempo         [−●──] 1.0x  │  ← Tempo slider 0.8–1.2
│  Inicio        00:00        │  ← Trim start, time picker
│  Fin           03:45        │  ← Trim end
│  Notas         [campo texto]│
│  Tonalidad     C Major      │  ← Display only
│  BPM           128          │  ← Display only
├─────────────────────────────┤
│  Partitura                  │
│  [+ Agregar PDF]            │
│  [doc.pdf] [✕]             │
├─────────────────────────────┤
│           [GUARDAR]         │
└─────────────────────────────┘
```

---

### Navigation Structure

```
TabView (bottom tabs)
├── Player (▶️)
├── Library (🎵)
├── Builder (🎚️)
└── History (📋)
```

Web uses `BottomNav.tsx` with 4 items. iOS uses `TabView` with equivalent structure.

---

## SwiftUI Color Extension

```swift
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// Usage:
Color(hex: "06B6D4")  // brand cyan
Color(hex: "8B5CF6")  // brand violet
Color(hex: "0A0E14")  // background
```
