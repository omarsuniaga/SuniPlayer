# SuniPlayer — AI Manifest (Amarre Estructural)

Este archivo es la fuente de verdad para la navegación y el contexto de cualquier IA. 
**Regla de Oro:** Ninguna funcionalidad existe si no está registrada acá.

---

## 🗺️ Mapa de Funcionalidades (Features)

| Feature | Código Base | Skill de Gobierno | Spec / Documentación | Estado |
|---|---|---|---|---|
| **Library (Command Center)** | `apps/web/src/features/library/` | `library-management` | `docs/Vista/04_LIBRARY/01_LIBRARY_MAIN.md` | IN_PROGRESS |
| **Playback Engine** | `packages/core/src/services/audio/` | `audio-engine` | `docs/Servicios/01_AUDIO_ENGINE.md` | STABLE |
| **Set Builder** | `packages/core/src/services/builder/` | `set-builder` | `docs/00_GENERAL/MVP_SCOPE.md` | STABLE |
| **State (Zustand)** | `packages/core/src/store/` | `state-governance` | `docs/Core/02_STATE_MANAGEMENT.md` | STABLE |
| **Metronome** | `apps/web/src/features/metronome/` | `metronome-logic` | `docs/Specs/SPEC_METRONOMO.md` | DONE |

---

## 🛠️ Protocolo de Desarrollo Asistido

1. **Investigación**: Leer este manifiesto y el `registry.md`.
2. **Localización**: Identificar el "Código Base" y la "Skill de Gobierno".
3. **Validación**: Activar la skill correspondiente antes de proponer cambios.
4. **Anclaje**: Asegurarse de que cada archivo nuevo o modificado incluya el bloque `@ai-context`.

---

## 🔗 Dependencias de Dominio

- **Audio -> State**: El motor de audio solo lee del `usePlayerStore`.
- **UI -> ProjectStore**: Los componentes no tocan stores individuales, usan la fachada `useProjectStore`.
- **Persistence -> Core**: La persistencia es un adaptador inyectado desde la app al core.

---
*Este manifiesto asegura que SuniPlayer sea un sistema coherente, predecible y amarrado.*
