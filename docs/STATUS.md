# SuniPlayer — Estado del Proyecto

Última actualización: 2026-03-29

---

## ✅ Web App (`apps/web`) — Production-ready

### Audio Engine (`useAudio.ts`)
- Dual-channel A/B para crossfade seamless (dos HTMLAudioElement, canales A y B)
- Fade in/out configurable: `fadeEnabled`, `fadeInMs`, `fadeOutMs`; `fadeTimersRef` es un `Map` por canal, NO un ref único
- Crossfade mode: canal A fade-out mientras canal B fade-in, controlado por `crossfadeMs`
- Volume con autoGain: `gainOffset` por track aplicado sobre master volume
- Seeking funcional
- Analytics hooks integrados: `trackStart`, `trackEnd`, `trackSkip`

### AudioStreamerService (`AudioStreamerService.ts`)
- Fetch con progress tracking (barra de carga)
- Blob URL short-circuit: si el track ya tiene blob URL cargado, no re-fetcha
- IndexedDB recovery: si el fetch falla, intenta recuperar audio desde almacenamiento local

### Blob URL Policy
- `blob_url` en `Track` es EFÍMERO — se crea en runtime, NUNCA persiste a localStorage
- `partialize` en stores excluye explícitamente `blob_url`

### Set Builder (`setBuilderService.ts`)
- Algoritmo Monte Carlo (600 iteraciones) + Greedy fallback
- Filtros: BPM range, venue energy bias, mood transitions
- Graceful fallback: si filtros dejan < 3 tracks, usa el catálogo completo (diseño intencional)
- `setTrackTrim()` recalcula `tTarget` desde cero via `getEffectiveDuration()` — no es un delta

### Analytics (`AnalyticsService.ts`)
- Métricas: `playCount`, `completePlays`, `skips`, `affinityScore`
- `affinityScore` usa Laplace smoothing para evitar cold-start bias
- Integrado en `useAudio` — se dispara automáticamente durante reproducción

### Stores (5 dominios, `packages/core/src/store/`)
- `usePlayerStore` — estado de reproducción actual
- `useSettingsStore` — configuración, pedal bindings (`PedalAction`, `PedalBinding`, `PedalBindings`)
- `useBuilderStore` — estado del set builder
- `useHistoryStore` — historial de shows/sets
- `useLibraryStore` — biblioteca de tracks custom
- `useProjectStore` — API composite que combina todos los stores (conveniente pero no usar en código crítico)

### Pedal Bindings
- Learn Mode funcional
- 6 acciones disponibles
- Persistido en `suniplayer-settings`

### UI Completa
- Player page con waveform canvas (`Wave`), marcadores (`MarkerLayer`), SPL meter UI
- Builder page para generar sets
- Library page para gestión de tracks custom
- History page para ver shows anteriores
- Modales: `TrackProfileModal`, `TrackTrimmer`, `SheetMusicViewer`
- SPL Meter: solo UI — NO mide audio real (requeriría Web Audio AnalyserNode)

---

## ⚠️ App Nativa (`apps/native`) — Beta / Work in Progress

### ExpoAudioEngine (`ExpoAudioEngine.ts`) — Implementado
- `load`, `play`, `pause`, `seek`, `fadeVolume`, `setVolume`, `getPosition`
- `setTempo` funcional via `TrackPlayer.setRate(rate)`; mantiene `_currentRate` para tracking interno
- `setPitch` — no-op explícito con `console.warn`; RNTP v4 no soporta pitch shift (requiere lib externa)
- Callbacks: `onPositionUpdate`, `onBufferUpdate`, `onBufferingChange`, `onEnded`, `onError`
- Analytics a nivel de engine: `trackStart`, `trackEnd`, `trackSkip` (regla del 30% para detectar skips)

### LocalFileAccess — Implementado con seguridad
- Whitelist de MIME types y extensiones
- Límite de 200MB por archivo
- Sanitización de paths

### SQLiteStorage — Completamente implementado
- Funciona para: datos de análisis de tracks + datos de waveform
- Almacenamiento binario de audio: `saveAudioFile`, `getAudioFile`, `deleteAudioFile`, `getAllStoredTrackIds` implementados
- Archivos guardados en `documentDirectory/audio_storage/`
- Path registrado en tabla `audio_files` de SQLite
- Conversión base64 ↔ Blob para transferencia nativo ↔ web

### PlayerScreen — Funcional básico
- Play/Pause, Next/Prev
- Volume control
- Fade controls
- Buffering bar
- Waveform (`Waveform.tsx` — componente presente, integración en progreso)

---

## ❌ Gaps pendientes

| Feature | Notas |
|---------|-------|
| Pitch shift | `setPitch` es no-op explícito en `ExpoAudioEngine`; requiere librería externa (e.g., soundtouchjs) |
| SPL meter real | Solo UI web; requiere `Web Audio AnalyserNode` — no disponible en React Native |

---

## Tests

| Plataforma | Runner | Archivos | Cobertura |
|------------|--------|----------|-----------|
| Web | Vitest 4 + @testing-library/react | 25 archivos | F1–F9 acceptance tests |
| Native | Jest | 3 archivos | ExpoAudioEngine, LocalFileAccess, SQLiteStorage |

**Áreas de tests web (F1–F9):**
- F1: Library — gestión de tracks custom
- F2: Builder — generación de sets
- F3: Player — reproducción y controles
- F4: Live — modo en vivo
- F5: History — historial de shows
- F6: Customization — waveforms, marcadores, sheet music
- F7: Session — gestión de sesión
- F8: Pedal — bindings de pedal bluetooth
- F9: Settings — configuración general

**Notas críticas de testing:**
- `globals: true` en `vitest.config.ts` — requerido para auto-cleanup de `@testing-library/react`
- Reset de stores: `localStorage.clear()` + `store.setState(store.getInitialState(), true)`
- Usar `queryAllByText()` no `queryByText()` cuando pueden matchear múltiples elementos

---

## Arquitectura de Plataformas

```
packages/core/
  src/
    types.ts              — Track, Show, SetEntry, TrackMarker (tipos compartidos)
    store/                — 5 domain stores (Zustand)
    services/             — setBuilderService, AnalyticsService
    platform/
      interfaces/
        IAudioEngine.ts   — Contrato de audio (web + native implementan esto)
        IStorage.ts       — Contrato de storage

apps/web/                 — React 18, Vite, Vitest
  src/
    services/
      useAudio.ts         — Motor de audio web (implementa IAudioEngine)
      AudioStreamerService.ts

apps/native/              — React Native + Expo
  src/
    platform/
      ExpoAudioEngine.ts  — Motor de audio nativo (implementa IAudioEngine)
      SQLiteStorage.ts    — Storage nativo (implementa IStorage, completo)
    screens/
      PlayerScreen.tsx
```

**Tipos principales:**
```typescript
Track {
  id, title, artist, duration_ms, file_path,
  blob_url?,        // EPHEMERAL — nunca persiste a localStorage
  bpm?, key?, energy?, mood?, genre?, tags?, notes?,
  isCustom?, waveform?, gainOffset?, startTime?, endTime?,
  sheetMusic?, markers?,
  playCount?, completePlays?, skips?, affinityScore?, totalPlayTimeMs?, lastPlayedAt?
}

Show { id, name, createdAt, sets: SetEntry[] }
SetEntry { id, label, tracks, durationMs, builtAt }
TrackMarker { id, posMs, comment }
```
