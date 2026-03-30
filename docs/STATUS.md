# SuniPlayer — Estado del Proyecto (2026-03-29)

## Resumen Ejecutivo

| Plataforma | Estado | Descripción |
|-----------|--------|-------------|
| **Web** | ✅ Production-ready | Audio engine dual-channel, set builder, analytics, pedal |
| **Native (Android/iOS)** | ⚠️ Beta funcional | Player completo, sin pitch shift nativo |

---

## Features Implementadas

### 🎵 Audio Engine

| Feature | Web | Native |
|---------|-----|--------|
| Reproducción básica | ✅ | ✅ |
| Dual-channel A/B | ✅ | N/A (RNTP) |
| Fade In/Out configurable | ✅ | ✅ |
| Crossfade | ✅ | N/A |
| Seeking | ✅ | ✅ |
| Tempo shift | ✅ (soundtouchjs) | ✅ (RNTP rate) |
| Pitch shift | ✅ (soundtouchjs) | ❌ Stub |
| Volume + autoGain | ✅ | ✅ |
| Background audio | ✅ (WakeLock) | ✅ (iOS + Android config) |
| Barra de buffering | ✅ | ✅ |

### 📚 Biblioteca & Importación

| Feature | Web | Native |
|---------|-----|--------|
| Tracks built-in (catalog) | ✅ `tracks.json` | ✅ (via streaming) |
| Import archivos locales | ✅ (File API) | ✅ (expo-document-picker) |
| Análisis BPM/Key (librosa) | ✅ | ✅ (core) |
| Waveform visual | ✅ (canvas) | ✅ (componente) |
| Marcadores en waveform | ✅ | ✅ |
| Sheet Music Viewer (PDF) | ✅ | ✅ |
| Persistencia (IDB/SQLite) | ✅ IndexedDB | ✅ SQLiteStorage |
| Binary audio storage | ✅ IDB | ✅ Base64 SQLite |

### 🎛 Set Builder

| Feature | Web | Native |
|---------|-----|--------|
| Algoritmo Monte Carlo | ✅ (600 iteraciones) | ✅ (via core) |
| Greedy fallback | ✅ | ✅ |
| Filtros BPM / mood | ✅ | ✅ |
| Venue energy bias | ✅ | ✅ |
| Multi-set Shows | ✅ | ✅ (via core) |
| Historial de shows | ✅ | ✅ |
| affinityScore influence | 🔶 Pendiente integración | 🔶 Pendiente |

### 📊 Analytics (SuniAnalytics)

| Métrica | Estado | Notas |
|---------|--------|-------|
| `playCount` | ✅ | Incrementa en trackStart |
| `completePlays` | ✅ | Incrementa en trackEnd natural |
| `skips` | ✅ | Regla del 30%: solo < 30% del track |
| `affinityScore` | ✅ | Laplace smoothing, base 50 |
| Persistencia | ✅ | En Track.* via useLibraryStore |
| Influir en Builder | 🔶 Pendiente | Integrar topTracks() en buildSet() |

### 🎮 Controles & UX

| Feature | Web | Native |
|---------|-----|--------|
| Pedal Bluetooth (HID) | ✅ Learn Mode | N/A |
| Modo Show (live) | ✅ | ✅ |
| SPL Meter | ⚠️ UI only | ❌ |
| Transiciones automáticas | ✅ | ✅ |
| Auto-fade en play/pause | ✅ | ✅ |
| PWA (installable) | ✅ | N/A |

---

## Pendientes Clave

### 🔴 Críticos
| Item | Plataforma | Descripción |
|------|-----------|-------------|
| Pitch shift nativo | Native | `setPitch()` es stub. Necesita librería externa (soundtouchjs-rn o similar) |
| Audio files en `/public/audio/` | Web | Carpeta vacía — tracks demo no funcionan sin deploy a Netlify |

### 🟡 Mejoras importantes
| Item | Plataforma | Descripción |
|------|-----------|-------------|
| Analytics → Builder | Both | `topTracks()` no influye aún en generación de sets |
| SPL Meter real | Web | Necesita `AudioContext.createAnalyser()` conectado al engine |
| Waveform nativa integración | Native | `Waveform.tsx` existe pero no está completamente integrado |

### 🟢 Planes documentados (sin ejecutar)
| Plan | Archivo | Estado |
|------|---------|--------|
| Edit Modal Auto-Pause | `2026-03-24-edit-modal-auto-pause.md` | ❌ Pendiente |
| Energy Curve Toggle | `2026-03-22-energy-curve-toggle.md` | ❌ Pendiente |

---

## Arquitectura

```
SuniPlayer/
├── apps/web/          → React 18 + Vite + Vitest (producción)
├── apps/native/       → React Native + Expo SDK 55 (beta)
└── packages/core/     → Tipos, stores, servicios compartidos
```

### Stores Zustand (packages/core/src/store/)
- `usePlayerStore` — queue, posición, modo play/live
- `useBuilderStore` — sets generados, config de venue/curve/BPM, Shows
- `useLibraryStore` — tracks custom, repertoire, analytics
- `useHistoryStore` — historial de shows (migración legacy)
- `useSettingsStore` — fade/crossfade, pedal bindings, SPL, energy curve

### Audio Engines
- **Web**: `useAudio.ts` — Dual-channel HTML5 Audio, fade timer por canal (Map)
- **Native**: `ExpoAudioEngine.ts` — react-native-track-player v4, foreground service

---

## Tests

| Suite | Runner | Tests |
|-------|--------|-------|
| `apps/web/__tests__/features.test.ts` | Vitest 4 | F1-F9, ~800 líneas |
| `apps/native/__tests__/ExpoAudioEngine.test.ts` | Jest | engine lifecycle, analytics |
| `apps/native/__tests__/LocalFileAccess.test.ts` | Jest | whitelist, 200MB limit |
| `apps/native/__tests__/SQLiteStorage.test.ts` | Jest | análisis, waveform, audio binary |

---

## Deploy

| Target | URL | Trigger |
|--------|-----|---------|
| Web (Netlify) | https://suniplayer.netlify.app | Push a `main` |
| Android APK (EAS) | Ver EAS dashboard | `eas build --platform android --profile preview` |
| iOS (EAS) | Requiere Apple Developer Account | `eas build --platform ios --profile preview` |
