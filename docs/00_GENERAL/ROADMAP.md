# Roadmap — SuniPlayer

**Version:** 0.4 (Alpha Técnica — SyncEnsemble Ready)  
**Agente Responsable:** Agent 01 — Product Architect

---

## Fase 0 — Consolidación (100% Completada)
- [x] Estructura de monorepo pnpm configurada.
- [x] `packages/core` como base compartida de verdad.
- [x] Sistema de agentes y skills activos.
- [x] Unificación de tipos y contratos de datos.

## Fase 1 — MVP de Escenario (En curso - 90%)
**Enfoque:** Convertir la app en una herramienta de grado industrial para uso real.

- [x] **Motor de Audio Pro**: Migración a `AudioWorklet` + `SoundTouchJS` (Pitch/Tempo independiente).
- [x] **Persistencia Híbrida**: Implementación de `OPFS` para audios binarios y `IndexedDB v2` para metadata.
- [x] **Biblioteca Cockpit**: Rediseño integral con Batch Mode, multiselección y gestión de repertorio.
- [x] **Generador Inteligente**: Algoritmo Monte Carlo con soporte para anclajes (📌), Smart Replace y DJ Brain.
- [x] **Hispanización Total**: UI nativa en español para máxima comodidad en el escenario.
- [ ] **Native Parity**: Portar los nuevos motores de audio y persistencia a la app de Expo.

## Fase 2 — SyncEnsemble (Iniciada - 20%)
**Enfoque:** Transformar la app individual en una plataforma colaborativa para ensambles.

- [x] **Reloj Maestro**: Implementación de `ClockSyncService` (Protocolo NTP sub-5ms).
- [x] **Indicadores de Sync**: Visualización de estado de sincronía en tiempo real.
- [ ] **Networking P2P**: Implementación de WebRTC DataChannels para conexión local sin internet.
- [ ] **Partituras Colaborativas**: Integración de CRDT (Yjs) para anotaciones compartidas.

## Fase 3 — Consolidación y Nube
- [ ] Sincronización asíncrona con Firebase/Supabase para backups.
- [ ] Historial de sesiones de ensayo detallado.
- [ ] Análisis inteligente de performance (AI feedback).

---

## Criterios de Calidad
- Precisión de sincronía ≤ 5ms.
- Latencia de interfaz ≤ 100ms.
- Offline-first absoluto para el escenario.

---
*SuniPlayer ya no es un reproductor; es el corazón del ensamble.*
