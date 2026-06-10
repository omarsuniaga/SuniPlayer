# ADR 0001 — Stack Tecnológico de Suniplayer

**Estado:** Aceptado · 2026-06-10
**Decisión:** PWA con Vue 3 + TypeScript, empaquetada con Capacitor para Android/iOS. Desktop vía PWA instalable.

## Contexto

Suniplayer debe correr en Android, iOS y desktop. La documentación (37 archivos
en `docs/`) especifica desde su visión general que la app es una **PWA**, y las
vistas/componentes están especificados con **guías de estilos CSS** e
interaction patterns web. Una exploración paralela (engram #2119) comparó
Flutter, React Native, KMP, Capacitor y Expo, y favoreció Flutter por DSP a
nivel de sample vía FFI.

## Decisión

| Capa | Elección | Por qué |
|------|----------|---------|
| Lenguaje | TypeScript (estricto) | Tipado fuerte para el dominio ya especificado |
| Build | Vite | Estándar actual, HMR instantáneo |
| UI | Vue 3 (Composition API) + Pinia | Ecosistema dominado por el equipo (proyectos SOI PWA/Vue); atomic design y container-presentational según los docs |
| Audio | Web Audio API + AudioWorklet; DSP pitch/stretch vía WASM (signalsmith-stretch o soundtouch-wasm) | Procesamiento por sample DENTRO del navegador; probado en producción por apps de música web |
| Persistencia | IndexedDB vía Dexie | Modelo de `04-almacenamiento` mapea directo |
| PWA | vite-plugin-pwa (Workbox) | Offline-first según la visión |
| Móvil (stores) | Capacitor 6 | Mismo código web; plugins nativos para audio en segundo plano, media session y archivos |
| Desktop | PWA instalable (Tauri como opción futura) | Cero código extra hoy |
| Backup/Jam señalización | Supabase (opcional, opt-in) | Coincide con `06-modelo-backup-sync`; señalización WebRTC para Jam Session fase 2 |
| Tests | Vitest + Vue Test Utils | TDD estricto desde el primer archivo |
| Sync multi-device | WebRTC (fase 2) | Jam Session es literalmente territorio nativo de la web |

## Por qué NO Flutter (resolución del conflicto con engram #2119)

1. **La documentación es web**: 37 archivos especifican PWA, CSS por vista y
   componente, interaction patterns de DOM. Flutter invalidaría esa capa de
   especificación entera y el principio de la visión general.
2. **El argumento DSP está sobredimensionado para nuestro caso**: Suniplayer
   transforma REPRODUCCIÓN de archivos (pitch/tempo/EQ/fades sobre buffers ya
   decodificados), no procesa input en vivo con monitoreo. La latencia de
   salida (~10-20ms) es irrelevante al reproducir; AudioWorklet + WASM da
   procesamiento por sample real y lo usan productos comerciales (Moises web,
   BandLab, Soundtrap).
3. **Pedalera BT**: los pedales de músicos (AirTurn, PageFlip) se presentan
   como TECLADOS Bluetooth HID — llegan como eventos de teclado al navegador,
   también en iOS. La limitación de HID crudo en iOS no nos afecta.
4. **Velocidad del equipo**: el ecosistema del proyecto (SOI) es Vue+PWA; la
   curva de Flutter+Dart retrasaría el MVP sin beneficio para el caso de uso.

**Mitigación de riesgo:** la Fase 0 del código incluye un SPIKE de validación:
pitch ±12 semitonos + tempo 50-200% en AudioWorklet+WASM medido en un
dispositivo Android de gama media y un iPhone. Si el spike falla en calidad o
estabilidad, se reevalúa Flutter ANTES de construir UI (solo se habría perdido
el spike, no la app).

## Arquitectura del código

Hexagonal/Screaming, en `app/`:

```text
app/src/
  domain/          ← lógica pura (sin DOM, sin Vue, sin Dexie): modelos,
                     resolución de next(), completador de set, curvas de mood
  application/     ← casos de uso que orquestan dominio + puertos
  infrastructure/  ← adaptadores: Dexie (storage), WebAudio (engine),
                     MediaSession (sesión-audio), FileSystem
  ui/              ← Vue: atoms/molecules/organisms (atomic design),
                     containers (lógica) vs presentational (render)
```

Regla de oro: `domain/` no importa NADA de las otras capas. Los docs de
`docs/componentes/` son el contrato de cada módulo; cada módulo de código
referencia en su cabecera el doc que implementa.

## Consecuencias

- El MVP (fase 1) se construye y prueba en navegador; Capacitor entra cuando
  haya UI navegable.
- Identificadores y comentarios de código en inglés; términos propios del
  dominio (QuouList) se conservan como nombres propios.
- `19-minireproductor` y todo doc nuevo siguen alimentando el mismo contrato.
