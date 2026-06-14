# CLAUDE — Alineación para Suniplayer (actualizado Jun 2026)

Leé esto COMPLETO al inicio de cada sesión. Es tu brújula.

---

## 1. Estado actual del proyecto

### Branch activa: `main`
La app estable está deployada en main (commit `5712d9f` → Netlify). Tu código anterior está en `retrofit-arquitectura-documental`.

### Stack confirmado (NO cambiar, NO cuestionar)
| Capa | Decisión | 
|------|----------|
| UI | **React 18** |
| Estado | **Zustand 4** |
| Tests | **Vitest + RTL + jsdom** |
| Audio | Web Audio API + AudioWorklet |
| DSP | **signalsmith-stretch** (WASM) |
| Persistencia | **Dexie** (IndexedDB) |
| Build | Vite 5 |

### Tests: 317 tests, 35 files, todo verde ✅
```bash
cd app && npx vitest run
```

### Tu código anterior
Implementaste sobre `retrofit-arquitectura-documental`, se mergeó a `main` en `5712d9f`:
- **ErrorBoundary** (`ui/atoms/ErrorBoundary.tsx`)
- **InstallButton** (PWA, `ui/atoms/InstallButton.tsx`)
- **TrackProfileModal** (`ui/atoms/TrackProfileModal.tsx`)
- **TrackProfile hook** (`ui/hooks/useTrackProfileModal.ts`)
- **stopAll** (global kill switch en `useAudioEngine.ts`)
- **updateTrack** (Dexie)
- **Pitch/tempo chip** + varios test fixes

Está TODO commit, nada se perdió. ✅

---

## 2. Lo que pasó mientras dormías

### Resumen de la sesión de recuperación
1. Se hiceron deploys incorrectos de versiones draft a main (monorepo, vanilla JS)
2. Se restauró TU versión estable (standalone rebuild) a main
3. Se limpió: stashes borrados, PR #5 y #6 cerrados, dispatch.log ignorado
4. Se investigó multi-device audio sync (ver Engram `handoff/claude` y STATUS.md)

### 3 backups desaparecieron
Había directorios con trabajo sin commit de Claude dentro del repo que se perdieron. No hay forma de recuperarlos. Lo que estaba commit se salvó.

---

## 3. Cómo trabajamos ahora

### VOS (Claude) — Arquitecto + Implementador
El rol flexible que tenías antes funciona bien. Cuando tengas contexto fresco, implementá directamente. Cuando el cambio es grande (>4 archivos o arquitectónico), pasá por SDD o delegá.

### Gentle AI / OpenCode — Orquestador
Mantiene STATUS.md, CLAUDE.md, Engram, y ejecuta tareas delegadas / SDD.

### Reglas que aplican
1. **Commits en inglés, convencionales.** `feat:`, `fix:`, `chore:`.
2. **Testeá TODO.** Sin test aprobado no hay código.
3. **Engram es el bus.** Todo discovery, decisión o bugfix va a Engram vía `mem_save`.
4. **NUNCA toques docs/ sin permiso.** Lo maneja el orquestador.
5. **NUNCA inventes stack decisions.** Lo que está arriba es ley.
6. **Ahorrá tokens.** Usá `grep`/`glob` quirúrgico, no leas archivos enteros al pedo.

---

## 4. Feature investigado: Multi-device audio sync

Se investigó a fondo (ver STATUS.md y Engram `handoff/claude`).

**Recomendación: WebSocket server + NTP sync**
- Server Bun liviano
- Master (DJ) controla, slaves siguen
- No transmitir audio (ya está en cada dispositivo vía IndexedDB)
- Sync de: play, pause, seek, loadTrack, **tempo**, **pitch**

**Alternativa estudiada:** Beatsync (github.com/freeman-jiang/beatsync) — 3k estrellas, MIT, open source, hace exactamente esto. Vale la pena estudiar su approach.

---

## 5. STARTUP RÁPIDO (cada sesión nueva)

Para arrancar sin inflar contexto:

```
1. mem_search(topic_key: "handoff/claude", project: "suniplayer_v2")
   → handoffs pendientes

2. cat STATUS.md | head -60
   → estado actual del proyecto

3. cat AGENTS.md | head -40
   → reglas cross-agent

4. cd app && npx vitest run
   → verificar que todo está verde antes de arrancar

5. Si hay "handoff/claude" en Engram → prioridad #1
```
