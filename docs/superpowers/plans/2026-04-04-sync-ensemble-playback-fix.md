# SyncEnsemble — Reproducción Sincronizada Completa

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que los followers realmente reproduzcan audio sincronizado con el líder, incluyendo transferencia AirDrop-like para dispositivos que no tienen el archivo.

**Architecture:** Tres fixes encadenados: (1) corregir el sistema de timestamps para que use `Date.now()` en lugar de `performance.now()` que es local a cada pestaña; (2) desacoplar la orden de play de la carga del audio usando `scheduledPlay` en el store; (3) agregar transferencia de archivos vía WebRTC Data Channel con progreso de buffer.

**Tech Stack:** TypeScript, Zustand, WebRTC (simple-peer), Firebase Firestore (signaling), Web Audio API, Cache API / IndexedDB.

---

## Diagnóstico de los Bugs Raíz

Antes de tocar código, entendé esto:

### Bug #1 — CRÍTICO: `performance.now()` es local a cada pestaña (no cross-device)

En `SyncEnsembleOrchestrator.ts`:
```typescript
const targetTimeMs = performance.now() + bufferTimeMs; // ← INCORRECTO para cross-device
```

`performance.now()` mide milisegundos desde que cargó la pestaña. Si el líder tiene la pestaña abierta hace 300 segundos, manda `300004000`. El follower tiene su pestaña abierta hace 5 segundos, calcula `delayMs = 300004000 - 5000 = 299999000ms ≈ 83 horas`. Por eso aparece "OFFSET CRÍTICO".

**Fix**: Usar `Date.now()` (Unix epoch) para scheduling cross-device. La diferencia entre relojes de pared de distintos dispositivos es típicamente <2 segundos — aceptable para música. La corrección de drift del ClockSyncService sigue siendo útil para ajustes continuos.

### Bug #2 — CRÍTICO: Race condition entre carga de track y llamada a `playAt`

En el handler del mensaje `PLAY` (en `SyncEnsembleOrchestrator.initialize()`):
```typescript
case 'PLAY':
    if (msg.payload.trackId) {
        this.handleRemoteTrackChange(msg.payload.trackId); // ← setCi() dispara carga async
    }
    this.handleRemotePlay(msg.payload.targetTimeMs, msg.payload.positionMs); // ← engine.playAt() INMEDIATO
    break;
```

`handleRemoteTrackChange` hace `setCi()` que trigerea un `useEffect` en `useAudio.ts` que carga el audio de forma **asíncrona**. Pero `handleRemotePlay` llama `engine.playAt()` en el mismo tick, antes de que el audio esté cargado. El engine llama `play()` en un stream vacío → silencio.

**Fix**: `handleRemotePlay` no debe llamar `engine.playAt()` directamente. Debe escribir un `scheduledPlay` en el store. `useAudio.ts` lo lee DESPUÉS de cargar el audio y ahí sí llama `engine.playAt()`.

### Bug #3 — MENOR: POSITION_REPORT cada 5 segundos

```typescript
this.reportInterval = setInterval(async () => { ... }, 5000); // muy lento
```

Con 5 segundos entre reportes, el drift puede llegar a 500ms antes de detectarse. Debe ser cada 1 segundo.

---

## Mapa de Archivos

| Archivo | Cambio |
|---------|--------|
| `packages/core/src/network/types.ts` | +3 nuevos `P2PMessageType`: `AUDIO_REQUEST`, `AUDIO_CHUNK`, `AUDIO_CHUNK_DONE` |
| `packages/core/src/store/usePlayerStore.ts` | +2 campos: `scheduledPlay` y `clearScheduledPlay` |
| `packages/core/src/network/SyncEnsembleOrchestrator.ts` | Fix Bug#1 (Date.now), Fix Bug#2 (scheduledPlay), Fix Bug#3 (1s interval), + lógica de file transfer |
| `apps/web/src/services/useAudio.ts` | +1 `useEffect` que reacciona a `scheduledPlay` post-carga, modificar condición de play para ignorar countdown en modo follower |
| `apps/web/src/services/network/FirestoreTransport.ts` | +`sendBinary()`, +`onBinary()` para transferencia de chunks vía Data Channel |

---

## Chunk 1: Fundación — Tipos y Store

### Task 1: Agregar tipos de mensajes para transferencia de audio

**Files:**
- Modify: `packages/core/src/network/types.ts`

- [ ] **Step 1: Leer el archivo actual**

Verificar el contenido de `packages/core/src/network/types.ts` antes de editar.

- [ ] **Step 2: Agregar los nuevos P2PMessageType**

Reemplazar la unión de `P2PMessageType` existente para agregar:

```typescript
export type P2PMessageType =
    | 'CLOCK_PING'
    | 'CLOCK_PONG'
    | 'PLAY'
    | 'PAUSE'
    | 'SEEK'
    | 'STOP'
    | 'POSITION_REPORT'
    | 'SESSION_ANNOUNCE'
    | 'JOIN_REQUEST'
    | 'JOIN_ACCEPTED'
    | 'YJS_UPDATE'
    | 'TRACK_CHANGE'
    | 'MEMBER_READY'
    | 'AUDIO_REQUEST'    // follower → leader: "Dame el archivo de este trackId"
    | 'AUDIO_CHUNK'      // leader → follower: chunk binario del archivo
    | 'AUDIO_CHUNK_DONE'; // leader → follower: fin de la transferencia
```

También agregar la interfaz de payload para estos mensajes al final del archivo:

```typescript
/** Payload para AUDIO_REQUEST */
export interface AudioRequestPayload {
    trackId: string;
}

/** Payload para AUDIO_CHUNK */
export interface AudioChunkPayload {
    trackId: string;
    chunkIndex: number;
    totalChunks: number;
    data: string; // base64
}

/** Payload para AUDIO_CHUNK_DONE */
export interface AudioChunkDonePayload {
    trackId: string;
    totalChunks: number;
}
```

- [ ] **Step 3: Verificar que compila**

```bash
cd C:/Users/omare/.claude/projects/SuniPlayer
npx tsc --noEmit -p packages/core/tsconfig.json
```

Expected: sin errores de tipos en `types.ts`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/network/types.ts
git commit -m "feat(sync): add AUDIO_REQUEST/CHUNK/DONE message types for AirDrop-like transfer"
```

---

### Task 2: Agregar `scheduledPlay` al PlayerStore

**Files:**
- Modify: `packages/core/src/store/usePlayerStore.ts`

**Por qué:** El `scheduledPlay` es el contrato entre el Orchestrator (que recibe el PLAY del líder) y `useAudio.ts` (que ejecuta el play real después de cargar el audio). Sin este intermediario, hay race condition.

- [ ] **Step 1: Leer el archivo actual**

Leer `packages/core/src/store/usePlayerStore.ts` para entender la estructura existente.

- [ ] **Step 2: Agregar la interfaz `ScheduledPlay`**

Al inicio del archivo, después de los imports, agregar:

```typescript
export interface ScheduledPlay {
    targetWallMs: number;  // Date.now() del momento de play — comparable cross-device
    positionMs: number;    // Posición del audio en ms
    trackId: string;       // ID del track a reproducir
}
```

- [ ] **Step 3: Agregar `scheduledPlay` al `PlayerState`**

Dentro de la interfaz `PlayerState`, después de `countdown`:

```typescript
/** Synchronized play command pending execution — set by Orchestrator, consumed by useAudio */
scheduledPlay: ScheduledPlay | null;
clearScheduledPlay: () => void;
```

- [ ] **Step 4: Agregar la implementación en `create()`**

En el objeto de implementación del store, después de `setCountdown`:

```typescript
scheduledPlay: null,
clearScheduledPlay: () => set({ scheduledPlay: null }),
```

- [ ] **Step 5: Asegurar que `scheduledPlay` NO se persiste**

Buscar la función `partialize` en el store (o el objeto `persist`) y confirmar que `scheduledPlay` y `clearScheduledPlay` no están incluidos. Son estado de runtime, no deben persistirse. Si `partialize` no existe y se usa `persist` sin filtro, verificar que no rompe nada (el valor `null` en JSON es inofensivo, pero mejor excluirlo).

Si existe un `partialize`, agregar:

```typescript
// Asegurar que las claves de runtime están excluidas
// scheduledPlay es ephemeral — nunca persiste
```

Si no existe `partialize`, no es necesario hacer nada (el valor null se serializa bien).

- [ ] **Step 6: Exportar la interfaz**

Asegurarse de que `ScheduledPlay` está exportada desde `packages/core/src/index.ts`. Buscar si `PlayerState` ya está exportado — si sí, `ScheduledPlay` debe exportarse junto.

Verificar `packages/core/src/index.ts` y agregar si falta:

```typescript
export type { ScheduledPlay } from './store/usePlayerStore';
```

- [ ] **Step 7: Verificar que compila**

```bash
npx tsc --noEmit -p packages/core/tsconfig.json
```

Expected: 0 errores.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/store/usePlayerStore.ts packages/core/src/index.ts
git commit -m "feat(sync): add scheduledPlay to PlayerStore for decoupled sync execution"
```

---

## Chunk 2: Fix del Orchestrator

### Task 3: Corregir `SyncEnsembleOrchestrator` — Bug #1 (timestamps), Bug #2 (scheduledPlay), Bug #3 (interval)

**Files:**
- Modify: `packages/core/src/network/SyncEnsembleOrchestrator.ts`

**Por qué:** Este archivo tiene los tres bugs principales. Hay que:
1. Cambiar `performance.now() + buffer` → `Date.now() + buffer` en `startGlobalPlayback`
2. En `handleRemotePlay`, setear `scheduledPlay` en el store en lugar de llamar `engine.playAt()`
3. Cambiar el interval de reportes de 5000ms → 1000ms

- [ ] **Step 1: Leer el archivo actual**

Leer `packages/core/src/network/SyncEnsembleOrchestrator.ts` completo.

- [ ] **Step 2: Fix Bug #1 — Cambiar performance.now() a Date.now() en startGlobalPlayback**

Localizar el método `startGlobalPlayback`. Cambiar:

```typescript
// ANTES (incorrecto — performance.now() es local a la pestaña):
const targetTimeMs = performance.now() + bufferTimeMs;
const playMsg = {
    type: 'PLAY',
    payload: {
        targetTimeMs,    // ← performance.now() del líder
        positionMs,
        trackId: currentTrack.id
    }
};
// ...
await this.audioEngine.playAt(targetTimeMs, positionMs);
```

```typescript
// DESPUÉS (correcto — Date.now() es comparable entre dispositivos):
const targetWallMs = Date.now() + bufferTimeMs;
const playMsg = {
    type: 'PLAY',
    payload: {
        targetWallMs,   // ← wall clock, igual en todos los dispositivos
        positionMs,
        trackId: currentTrack.id
    }
};
// ...
// El líder también usa scheduledPlay para consistencia
usePlayerStore.setState({
    scheduledPlay: {
        targetWallMs,
        positionMs,
        trackId: currentTrack.id
    }
});
this.startLocalCountdown(countdownSeconds);
```

Notar que el líder ya **no llama** `this.audioEngine.playAt()` directamente — delega al `scheduledPlay` igual que los followers. Esto garantiza que el comportamiento sea idéntico en todos los dispositivos.

- [ ] **Step 3: Fix Bug #2 — handleRemotePlay usa scheduledPlay en lugar de engine.playAt()**

Reemplazar el método completo:

```typescript
public async handleRemotePlay(
    targetWallMs: number,
    audioPositionMs: number,
    trackId: string
): Promise<void> {
    if (this.sessionManager.getIsLeader()) return;

    const delayMs = targetWallMs - Date.now();

    // Cuenta regresiva visual solo si el delay es significativo
    if (delayMs > 500) {
        this.startLocalCountdown(Math.round(delayMs / 1000));
    }

    // Despachar al store — useAudio.ts lo ejecutará después de cargar el audio
    usePlayerStore.setState({
        scheduledPlay: {
            targetWallMs,
            positionMs: audioPositionMs,
            trackId
        }
    });
}
```

- [ ] **Step 4: Fix el handler de PLAY en initialize()**

Actualizar el switch-case para pasar `trackId` a `handleRemotePlay` y usar el nuevo campo `targetWallMs`:

```typescript
case 'PLAY':
    if (msg.payload.trackId) {
        this.handleRemoteTrackChange(msg.payload.trackId);
    }
    this.handleRemotePlay(
        msg.payload.targetWallMs,
        msg.payload.positionMs,
        msg.payload.trackId
    );
    break;
```

- [ ] **Step 5: Fix Bug #3 — position reporting interval 5000ms → 1000ms**

En `startPositionReporting()`:

```typescript
// ANTES:
this.reportInterval = setInterval(async () => { ... }, 5000);

// DESPUÉS:
this.reportInterval = setInterval(async () => { ... }, 1000);
```

- [ ] **Step 6: Agregar handlers para AUDIO_REQUEST y AUDIO_CHUNK_DONE**

En el switch de `initialize()`, agregar:

```typescript
case 'AUDIO_REQUEST':
    if (this.sessionManager.getIsLeader()) {
        this.handleAudioRequest(msg.senderId, msg.payload.trackId);
    }
    break;
case 'AUDIO_CHUNK_DONE':
    // Follower recibe esta señal del leader — track listo para reproducir
    // useAudio.ts ya enviará MEMBER_READY cuando cargue el blob
    console.log(`[SyncOrchestrator] Audio transfer complete for track: ${msg.payload.trackId}`);
    break;
```

- [ ] **Step 7: Agregar el método handleAudioRequest (file transfer — líder)**

Agregar este método en la clase:

```typescript
/**
 * Maneja una solicitud de audio de un follower que no tiene el track.
 * Transfiere el archivo en chunks de 64KB vía Data Channel.
 */
private async handleAudioRequest(requesterId: string, trackId: string): Promise<void> {
    console.log(`[SyncOrchestrator] Follower ${requesterId} solicita audio de: ${trackId}`);

    // Buscar el blob URL del track en el engine actual
    const currentUrl = this.audioEngine.currentUrl;
    if (!currentUrl) {
        console.warn(`[SyncOrchestrator] No hay URL cargada en el engine para enviar.`);
        return;
    }

    try {
        // Descargar el blob del URL cargado en el engine
        const response = await fetch(currentUrl);
        const arrayBuffer = await response.arrayBuffer();

        const CHUNK_SIZE = 65536; // 64KB por chunk
        const totalChunks = Math.ceil(arrayBuffer.byteLength / CHUNK_SIZE);

        console.log(`[SyncOrchestrator] Enviando ${totalChunks} chunks (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB) a ${requesterId}`);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, arrayBuffer.byteLength);
            const chunk = arrayBuffer.slice(start, end);

            // Convertir a base64 para enviar como JSON sobre el Data Channel
            const base64 = btoa(String.fromCharCode(...new Uint8Array(chunk)));

            const chunkMsg: Omit<P2PMessage, 'sequence'> = {
                type: 'AUDIO_CHUNK',
                senderId: this.sessionManager['userId'],
                timestamp: performance.now(),
                sessionId: this.sessionManager.getSessionId()!,
                payload: {
                    trackId,
                    chunkIndex: i,
                    totalChunks,
                    data: base64
                }
            };

            await this.sessionManager['transport']?.sendTo(requesterId, chunkMsg as P2PMessage);

            // Pequeño yield para no bloquear el thread en archivos grandes
            if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // Señal de fin de transferencia
        const doneMsg: Omit<P2PMessage, 'sequence'> = {
            type: 'AUDIO_CHUNK_DONE',
            senderId: this.sessionManager['userId'],
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: { trackId, totalChunks }
        };
        await this.sessionManager['transport']?.sendTo(requesterId, doneMsg as P2PMessage);

        console.log(`[SyncOrchestrator] Transferencia completa a ${requesterId}`);
    } catch (err) {
        console.error(`[SyncOrchestrator] Error en handleAudioRequest:`, err);
    }
}
```

- [ ] **Step 8: Agregar método público para que followers pidan el audio**

```typescript
/**
 * Solicita el archivo de audio al líder (cuando el follower no lo tiene).
 */
public requestAudioFromLeader(trackId: string): void {
    if (this.sessionManager.getIsLeader()) return;

    const msg: Omit<P2PMessage, 'sequence'> = {
        type: 'AUDIO_REQUEST',
        senderId: this.sessionManager['userId'],
        timestamp: performance.now(),
        sessionId: this.sessionManager.getSessionId()!,
        payload: { trackId }
    };
    this.sessionManager['transport']?.broadcast(msg as P2PMessage);
    console.log(`[SyncOrchestrator] Solicitando audio de ${trackId} al líder.`);
}
```

- [ ] **Step 9: Verificar que compila**

```bash
npx tsc --noEmit -p packages/core/tsconfig.json
```

Expected: 0 errores.

- [ ] **Step 10: Commit**

```bash
git add packages/core/src/network/SyncEnsembleOrchestrator.ts
git commit -m "fix(sync): use Date.now() for cross-device scheduling, scheduledPlay dispatch, 1s position reports"
```

---

## Chunk 3: Fix de useAudio.ts — El Consumidor del scheduledPlay

### Task 4: Conectar `scheduledPlay` con el ciclo de reproducción en `useAudio.ts`

**Files:**
- Modify: `apps/web/src/services/useAudio.ts`

**Por qué:** Este es el "último metro" del fix. El `scheduledPlay` está en el store, el audio está cargado, pero nadie llama `engine.playAt()`. Este `useEffect` cierra el circuito.

También hay que manejar el caso de followers que no tienen el archivo — deben pedirlo al líder antes de intentar reproducir.

- [ ] **Step 1: Leer el archivo actual completo**

Leer `apps/web/src/services/useAudio.ts` completo para entender la estructura exacta.

- [ ] **Step 2: Agregar suscripción a `scheduledPlay` en los imports del hook**

Al inicio de `useAudio()`, agregar:

```typescript
const scheduledPlay = usePlayerStore(s => s.scheduledPlay);
const clearScheduledPlay = usePlayerStore(s => s.clearScheduledPlay);
const sessionId = usePlayerStore(s => s.sessionId);
const isLeader = usePlayerStore(s => s.isLeader);
```

- [ ] **Step 3: Agregar el `useEffect` de scheduled play**

Este efecto se ejecuta cuando hay un `scheduledPlay` pendiente Y el audio del track correcto está listo en el engine. Agregar después del `useEffect` de volumen:

```typescript
// ── SCHEDULED PLAY (SyncEnsemble) ──
// Ejecuta el play exactamente sincronizado cuando el track está listo.
useEffect(() => {
    if (!scheduledPlay) return;

    // Solo ejecutar si el track en el engine coincide con el pedido
    // (el useEffect de ci habrá cargado el track previamente)
    const currentTrack = pQueue[ci];
    if (!currentTrack || currentTrack.id !== scheduledPlay.trackId) return;

    const delayMs = scheduledPlay.targetWallMs - Date.now();

    if (delayMs < -2000) {
        // El tiempo ya pasó hace más de 2s — tarde, reproducir inmediato
        console.warn(`[useAudio] Scheduled play llegó tarde por ${Math.abs(delayMs)}ms. Reproduciendo al instante.`);
        engine.seek(scheduledPlay.positionMs);
        engine.play();
        clearScheduledPlay();
        return;
    }

    const waitMs = Math.max(0, delayMs);
    console.log(`[useAudio] Scheduled play en ${waitMs.toFixed(0)}ms para track ${scheduledPlay.trackId}`);

    const timer = setTimeout(() => {
        engine.seek(scheduledPlay.positionMs);
        engine.play();
        usePlayerStore.setState({ playing: true });
        clearScheduledPlay();
    }, waitMs);

    return () => {
        clearTimeout(timer);
    };
}, [scheduledPlay, ci, pQueue, engine, clearScheduledPlay]);
```

- [ ] **Step 4: Modificar el ciclo de reproducción para no interferir con `scheduledPlay`**

En el `useEffect` principal de `// ── CICLO DE REPRODUCCIÓN ──`, buscar la sección que llama `engine.play()` cuando `countdown !== null`:

```typescript
// ANTES:
if (currentPlaying || currentCountdown !== null) {
    if (!engine.isPlaying && currentPlaying) {
        if (currentFadeEnabled) engine.fadeVolume(currentVol, currentFadeInMs);
        engine.play();
    }
}
```

```typescript
// DESPUÉS:
// Si hay un scheduledPlay pendiente (modo sync), NO tocamos el engine aquí
// El efecto de scheduledPlay se encarga de ejecutar el play en el momento exacto
const hasPendingScheduledPlay = usePlayerStore.getState().scheduledPlay !== null;

if (currentPlaying || currentCountdown !== null) {
    if (!engine.isPlaying && currentPlaying && !hasPendingScheduledPlay) {
        if (currentFadeEnabled) engine.fadeVolume(currentVol, currentFadeInMs);
        engine.play();
    }
}
```

- [ ] **Step 5: Agregar la lógica de AUDIO_REQUEST en el ciclo de carga**

Cuando el follower carga un track en modo sync y no tiene el archivo local, debe pedirlo al líder. Buscar el bloque `.catch(err => {...})` en el ciclo de reproducción y modificar el flujo para que, en modo follower de una sesión sync, si la carga falla, pida el audio al líder:

En el `.then(async (objectUrl) => {...})`, después de `sendReadySignal()`:

```typescript
// Notificar al leader que estamos listos
const state = usePlayerStore.getState();
if (state.sessionId && !state.isLeader) {
    syncEnsemble.orchestrator.sendReadySignal();
}
```

Y en el `.catch(err => {...})`:

```typescript
.catch(err => {
    console.error("[useAudio] Error cargando track:", err);

    // Si estamos en sesión sync y somos follower, pedir el audio al líder
    const state = usePlayerStore.getState();
    if (state.sessionId && !state.isLeader && ct) {
        console.log(`[useAudio] Solicitando audio al líder para: ${ct.id}`);
        syncEnsemble.orchestrator.requestAudioFromLeader(ct.id);
    } else {
        updateTrackMetadata(ct.id, { sourceMissing: true });
    }
});
```

- [ ] **Step 6: Verificar compilación**

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

Expected: 0 errores.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/services/useAudio.ts
git commit -m "fix(sync): consume scheduledPlay in useAudio after track load, add audio request fallback"
```

---

## Chunk 4: Recepción de Chunks en el Lado del Follower

### Task 5: Manejar AUDIO_CHUNK en el Orchestrator (follower)

**Files:**
- Modify: `packages/core/src/network/SyncEnsembleOrchestrator.ts`

**Por qué:** El líder ya envía chunks (Task 3). El follower necesita recibirlos, ensamblarlos y crear un blob URL que `useAudio.ts` pueda cargar.

- [ ] **Step 1: Agregar estado para acumular chunks en la clase**

Al inicio de la clase `SyncEnsembleOrchestrator`, agregar:

```typescript
// Buffer de chunks recibidos durante transferencia de audio
private audioChunkBuffers: Map<string, { chunks: string[]; totalChunks: number }> = new Map();
```

- [ ] **Step 2: Agregar handler para AUDIO_CHUNK en initialize()**

En el switch de mensajes, agregar:

```typescript
case 'AUDIO_CHUNK':
    if (!this.sessionManager.getIsLeader()) {
        this.handleAudioChunk(
            msg.payload.trackId,
            msg.payload.chunkIndex,
            msg.payload.totalChunks,
            msg.payload.data
        );
    }
    break;
```

- [ ] **Step 3: Implementar handleAudioChunk**

Agregar el método:

```typescript
/**
 * Recibe y ensambla chunks de audio enviados por el líder.
 * Cuando están todos, crea un blob URL e inyecta el track en el store.
 */
private handleAudioChunk(
    trackId: string,
    chunkIndex: number,
    totalChunks: number,
    base64Data: string
): void {
    // Inicializar buffer si no existe
    if (!this.audioChunkBuffers.has(trackId)) {
        this.audioChunkBuffers.set(trackId, {
            chunks: new Array(totalChunks).fill(''),
            totalChunks
        });
        console.log(`[SyncOrchestrator] Iniciando recepción de ${totalChunks} chunks para ${trackId}`);
    }

    const buffer = this.audioChunkBuffers.get(trackId)!;
    buffer.chunks[chunkIndex] = base64Data;

    // Progreso
    const received = buffer.chunks.filter(c => c !== '').length;
    if (received % 10 === 0 || received === totalChunks) {
        console.log(`[SyncOrchestrator] Audio transfer: ${received}/${totalChunks} chunks (${Math.round(received / totalChunks * 100)}%)`);
    }

    // Verificar si todos los chunks llegaron
    const allReceived = buffer.chunks.every(c => c !== '');
    if (!allReceived) return;

    // Ensamblar el ArrayBuffer completo
    console.log(`[SyncOrchestrator] Ensamblando audio completo para ${trackId}`);

    try {
        const byteArrays = buffer.chunks.map(b64 => {
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        });

        const totalSize = byteArrays.reduce((acc, b) => acc + b.length, 0);
        const combined = new Uint8Array(totalSize);
        let offset = 0;
        for (const bytes of byteArrays) {
            combined.set(bytes, offset);
            offset += bytes.length;
        }

        // Crear blob URL — el tipo MIME es audio/* genérico (funciona para MP3/WAV/etc.)
        const blob = new Blob([combined.buffer], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);

        // Inyectar el blob URL en el track del store
        const { pQueue, setPQueue } = usePlayerStore.getState();
        const updatedQueue = pQueue.map(t =>
            t.id === trackId ? { ...t, blob_url: blobUrl } : t
        );
        setPQueue(updatedQueue);

        // Limpiar el buffer
        this.audioChunkBuffers.delete(trackId);

        console.log(`[SyncOrchestrator] ✅ Audio de ${trackId} listo como blob URL`);

        // Ahora que tenemos el audio, el efecto en useAudio.ts se re-ejecutará
        // porque blob_url cambió en el store, y podrá cargar el audio.
        // sendReadySignal se llama automáticamente desde useAudio al cargar.

    } catch (err) {
        console.error(`[SyncOrchestrator] Error ensamblando audio:`, err);
        this.audioChunkBuffers.delete(trackId);
    }
}
```

- [ ] **Step 4: Verificar compilación**

```bash
npx tsc --noEmit -p packages/core/tsconfig.json
```

Expected: 0 errores.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/network/SyncEnsembleOrchestrator.ts
git commit -m "feat(sync): implement audio chunk assembly on follower side for AirDrop-like transfer"
```

---

## Chunk 5: Asegurar que getTrackUrl usa blob_url cuando está disponible

### Task 6: Verificar `getTrackUrl` en core

**Files:**
- Read only: `packages/core/src/types.ts` y donde esté definido `getTrackUrl`

**Por qué:** El follower recibe el track con `blob_url` inyectado. `useAudio.ts` llama `getTrackUrl(ct)` para obtener la URL. Hay que asegurarse de que `getTrackUrl` prioriza `blob_url` sobre la URL original.

- [ ] **Step 1: Buscar la definición de `getTrackUrl`**

```bash
rg "getTrackUrl" packages/core/src --include="*.ts" -l
```

Leer el archivo donde está definida.

- [ ] **Step 2: Verificar la implementación**

La función debería verse así (o similar):

```typescript
export function getTrackUrl(track: Track): string {
    if (track.blob_url) return track.blob_url;  // ← debe estar primero
    return track.url;
}
```

Si `blob_url` NO está siendo priorizado, corregirlo.

- [ ] **Step 3: Verificar que `blob_url` existe en el tipo `Track`**

```bash
rg "blob_url" packages/core/src/types.ts
```

Si no existe, agregar al tipo `Track`:

```typescript
blob_url?: string; // Ephemeral — creado en runtime, nunca persiste
```

- [ ] **Step 4: Commit si hubo cambios**

```bash
git add packages/core/src/types.ts
git commit -m "fix(sync): ensure getTrackUrl prioritizes blob_url for transferred audio"
```

---

## Chunk 6: Test Manual y Verificación End-to-End

### Task 7: Test manual del flujo completo

**Por qué:** Este es el smoke test real. Antes de celebrar, hay que verificar que el sistema funciona con dos dispositivos (o dos tabs del mismo browser con URLs distintas).

- [ ] **Step 1: Arrancar el servidor de desarrollo**

```bash
cd C:/Users/omare/.claude/projects/SuniPlayer
pnpm dev
```

En otra terminal, si el servidor de señalización se usa:

```bash
node scripts/signaling-server.js
```

- [ ] **Step 2: Abrir dos tabs/dispositivos**

- Tab A: Líder → crea sesión → anota el código
- Tab B: Follower → ingresa el código → se une

Verificar en Tab B que `syncStatus` pasa a `CALIBRATING` y luego a `SYNCED`.

- [ ] **Step 3: Test Flujo 1 — Ambos tienen el track**

1. Tab A: Seleccionar un track del catálogo built-in (que esté en `public/audio/`)
2. Tab A: En SyncPanel, presionar "Tutti Play"
3. Verificar: Tab A muestra countdown 4...3...2...1 → reproduce
4. Verificar: Tab B muestra countdown → reproduce al mismo tiempo (±200ms)

**Si falla**: Revisar la consola del Tab B para ver si:
- Llega el mensaje PLAY (buscar `[SyncOrchestrator]`)
- Se setea `scheduledPlay` en el store (usar `window.usePlayerStore?.getState().scheduledPlay`)
- El `useEffect` de scheduled play se ejecuta

- [ ] **Step 4: Test Flujo 2 — Follower NO tiene el track**

1. Tab A: Importar un archivo de audio local (que no esté en el catálogo)
2. Tab A: Seleccionar el track importado
3. Verificar: Tab B recibe TRACK_CHANGE, intenta cargar → falla → pide AUDIO_REQUEST
4. Verificar: Tab A recibe AUDIO_REQUEST → empieza a enviar chunks
5. Verificar: Tab B recibe chunks → ensambla → el track aparece en el queue con `blob_url`
6. Tab A: Presionar "Tutti Play"
7. Verificar: ambas tabs reproducen sincronizadas

- [ ] **Step 5: Test Flujo 3 — Drift correction**

1. Iniciar reproducción sincronizada
2. En Tab B, abrir DevTools → Console
3. Ejecutar: `window.syncEnsemble.audioEngine.seek(window.syncEnsemble.audioEngine.durationMs * 0.5)` para forzar desfase
4. Esperar 2-3 segundos
5. Verificar: el Orchestrator detecta el drift (`diff > 15ms`) y corrige la velocidad de reproducción automáticamente

---

## Notas de Implementación

### ¿Por qué no usamos `performance.now()` para nada cross-device?

`performance.now()` es un contador monotónico que empieza desde 0 cuando carga la pestaña. Es preciso (sub-milisegundo) pero solo tiene sentido dentro del mismo proceso. Entre dispositivos distintos, los valores son incomparables.

`Date.now()` usa el reloj de pared (UTC epoch). Entre dispositivos con NTP, la diferencia es generalmente <100ms. Para music sync donde ±200ms es imperceptible, es perfecto.

El `ClockSyncService` sigue siendo útil para medir el offset exacto (corrección de drift durante reproducción), pero el `targetWallMs` para el arranque inicial usa `Date.now()`.

### ¿Por qué base64 y no ArrayBuffer directo en el Data Channel?

`simple-peer` sí soporta envío de `ArrayBuffer` directamente en `peer.send()`. Sin embargo, la serialización JSON que usa el broadcast (`JSON.stringify(message)`) no puede contener ArrayBuffers. Como los mensajes van envueltos en el `P2PMessage` tipo JSON, se usa base64 para el chunk.

Una mejora futura sería un canal de datos binario separado del canal de mensajes JSON.

### ¿Qué pasa si el buffer se corta a la mitad?

El sistema actual no tiene re-transmisión. Si la conexión WebRTC cae durante la transferencia, el buffer queda incompleto. Mejora futura: implementar acknowledgments y re-pedido de chunks faltantes. Por ahora, el usuario puede hacer re-join a la sesión para reiniciar.
