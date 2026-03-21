# Marker Bubbles — Design Doc
**Fecha:** 2026-03-21

## Problema
El músico necesita dejar recordatorios en momentos exactos de una canción (e.g. "aquí sube el volumen", "coda en 3:23") que sean visibles mientras reproduce el set.

## Solución
Marcadores por canción: puntos rojos en el waveform con comentarios de texto. Al acercarse el cabezal, aparece una burbuja animada con el texto. Click largo en el waveform crea un marcador; click corto sobre un marker existente lo edita.

---

## Modelo de datos

```typescript
interface TrackMarker {
  id: string;       // uuid generado al crear
  posMs: number;    // posición exacta en ms dentro de la canción
  comment: string;  // máx 140 caracteres
}
```

**Persistencia:** Se agrega `markers?: TrackMarker[]` al tipo `Track` en `packages/core/src/types.ts`. Se guarda vía `updateTrackMetadata(trackId, { markers: [...] })` → `useLibraryStore.trackOverrides`. Los marcadores sobreviven entre sesiones y se asocian permanentemente a la canción hasta que el usuario los borre.

---

## Arquitectura de componentes

```
Player.tsx
└── <MarkerLayer>
    ├── children (div waveform + <Wave>)
    ├── <MarkerDot>       × N markers
    ├── <MarkerBubble>    × markers activos (cercanos al playhead)
    └── <MarkerModal>     (portal, abre al crear/editar)
```

### MarkerLayer
- `position: relative` sobre el contenedor del waveform
- Props: `markers`, `posMs`, `durationMs`, `trackId`, `isLive`, `onMarkersChange`
- Intercepta eventos de mouse para distinguir click corto vs largo
- Hit-test: tolerancia ±12px en x para detectar clicks sobre markers existentes

### MarkerDot
- Círculo rojo 8px, `position: absolute`, `left: (posMs / durationMs * 100)%`
- Siempre visible mientras dure la canción
- Hover: tooltip con comment truncado (1 línea)

### MarkerBubble
- Aparece cuando `|posMs - playheadMs| ≤ 15000` (15 segundos)
- Posición: sobre el dot, fija (no sigue el playhead)
- Tamaño: proporcional al texto, ancho 120–280px, máx 3 líneas (overflow hidden)
- Borde animado con parpadeo: velocidad interpolada según distancia
  - A 15s → 1 blink cada 2s (`animation-duration: 2s`)
  - A 0s → 4 blinks/s (`animation-duration: 0.25s`)
- Post-paso: cuando `playheadMs > posMs + 10000` → opacity desvanece de 1 a 0 durante 1s
- Múltiples burbujas en misma posición: `translateX(n * (bubbleWidth + 8px))`

### MarkerModal
- Portal fuera del waveform, centrado en pantalla
- Campos:
  - Tiempo (mm:ss, read-only, pre-llenado)
  - Textarea (comentario, límite 140 chars, contador visible)
- Botones: **Guardar** / **Cancelar** / **Eliminar** (confirma inline 2s)
- Navegación: **← Anterior** / **Siguiente →** (ordenados por posMs)
- Solo disponible en modo edit (isLive=false)

---

## Flujo de interacción

### Click corto en waveform
1. `onMouseUp` llega antes de 500ms → es click corto
2. Calcular `clickPosMs = clickX / waveformWidth * durationMs`
3. Hit-test: ¿hay marker con `|marker.posMs - clickPosMs| < tolerancia`?
   - **Sí** → abrir MarkerModal en modo **editar** con datos del marker
   - **No** → seek normal (`setPos(clickPosMs)`)

### Click largo en waveform (modo edit)
1. `onMouseDown` inicia timer 500ms
2. Si mouse se mueve > 5px → cancelar timer (es arrastre)
3. Si timer se cumple → cancelar seek, mostrar dot rojo provisional en esa posición
4. `onMouseUp` → abrir MarkerModal en modo **nuevo** con `posMs` pre-llenado
5. Si usuario cancela modal → eliminar dot provisional

### Modo live
- Click largo deshabilitado
- Click corto sobre marker existente → abre modal en modo **solo lectura**
- Burbujas visibles normalmente

---

## Animación de parpadeo (CSS)

```ts
// distanceSec: segundos hasta el marker (0 cuando coincide)
const blinkDuration = Math.max(0.25, 2 - (15 - distanceSec) * (1.75 / 15));
// 15s → 2s, 0s → 0.25s
```

CSS keyframe:
```css
@keyframes markerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50%       { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}
```

---

## Archivos a modificar / crear

| Archivo | Acción |
|---------|--------|
| `packages/core/src/types.ts` | Agregar `TrackMarker` interface + `markers?` a `Track` |
| `apps/web/src/components/common/MarkerLayer.tsx` | Crear — wrapper con lógica de click |
| `apps/web/src/components/common/MarkerDot.tsx` | Crear — punto rojo con tooltip |
| `apps/web/src/components/common/MarkerBubble.tsx` | Crear — burbuja animada |
| `apps/web/src/components/common/MarkerModal.tsx` | Crear — modal crear/editar |
| `apps/web/src/pages/Player.tsx` | Envolver waveform en `<MarkerLayer>` |

---

## Restricciones y edge cases

- **Máx 140 chars** en comment; textarea rechaza input adicional
- **Burbuja:** máx 3 líneas visibles (`overflow: hidden`, `WebkitLineClamp: 3`)
- **Texto dentro del borde:** padding interno mínimo 12px en todos los lados
- **Markers simultáneos** (mismo posMs exacto): burbujas lado a lado sin overlap
- **Sin markers:** MarkerLayer es transparente, no interfiere con seek normal
- **Modo live:** ninguna interacción de escritura; burbujas visibles en read-only
