# ADR 0001 — Stack Tecnológico de Suniplayer

**Estado:** Aceptado · 2026-06-10 (Revisado)
**Decisión:** PWA con React + TypeScript, empaquetada con Capacitor para Android/iOS. Desktop vía PWA instalable.

## Contexto

Suniplayer debe correr en Android, iOS y desktop. La documentación (37+ archivos
en `docs/`) especifica desde su visión general que la app es una **PWA**, y las
vistas/componentes están especificados con **guías de estilos CSS** e
interaction patterns web. El usuario eligió React como estándar de la industria
para poder contratar desarrolladores en el futuro.

## Decisión

| Capa | Elección | Por qué |
|------|----------|---------|
| Lenguaje | TypeScript (estricto) | Tipado fuerte para el dominio ya especificado |
| Build | Vite | Estándar actual, HMR instantáneo |
| UI | React 18+ + Zustand | Estado global simple y tipado; React es el estándar de contratación de la industria |
| Audio | Web Audio API + AudioWorklet; DSP pitch/stretch vía WASM (signalsmith-stretch) | Procesamiento por sample DENTRO del navegador; probado en producción por Moises.ai, BandLab y Soundtrap |
| Persistencia | IndexedDB vía Dexie | Modelo de `04-almacenamiento` mapea directo |
| PWA | vite-plugin-pwa (Workbox) | Offline-first según la visión |
| Móvil (stores) | Capacitor 6 | Mismo código web; plugins nativos para audio en segundo plano, media session y archivos |
| Desktop | PWA instalable (Tauri como opción futura) | Cero código extra hoy |
| Backup/Jam señalización | Supabase (opcional, opt-in) | Coincide con `06-modelo-backup-sync`; señalización WebRTC para Jam Session fase 2 |
| Tests | Vitest + React Testing Library | TDD estricto desde el primer archivo |
| Sync multi-device | WebRTC (fase 2) | Jam Session es literalmente territorio nativo de la web |

## Por qué NO Flutter

1. **La documentación es web**: 37+ archivos especifican PWA, CSS por vista y
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
4. **React es el estándar de contratación**: el usuario prioriza poder sumar
   desarrolladores al proyecto sin depender de un nicho. Flutter+Dart reduce
   el mercado laboral disponible drásticamente.

**Mitigación de riesgo:** la Fase 0 del código incluye un SPIKE de validación:
pitch ±12 semitonos + tempo 50-200% en AudioWorklet+WASM medido en un
dispositivo Android de gama media (Moto G / Samsung A) y un iPhone. Si el
spike falla en calidad o estabilidad, se reevalúa la estrategia de audio
(pre-procesado al importar como fallback, o Flutter + C++ engine nativo) ANTES
de construir UI.

## Arquitectura del código

Hexagonal/Screaming, en `src/`:

```text
src/
  domain/          ← lógica pura (sin DOM, sin React, sin Zustand, sin Dexie): modelos,
                     resolución de next(), completador de set, curvas de mood
  application/     ← casos de uso que orquestan dominio + puertos
  infrastructure/  ← adaptadores: Dexie (storage), WebAudio (engine),
                     MediaSession (sesión-audio), FileSystem
  ui/              ← React: atoms/molecules/organisms (atomic design),
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
- El scaffold inicial se creó con Vue 3 como placeholder y debe migrarse a
  React + Zustand. El código de dominio puro (`domain/`) es 100% reutilizable.
- `19-minireproductor` y todo doc nuevo siguen alimentando el mismo contrato.
