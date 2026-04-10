# Architecture Overview — SuniPlayer

**Agente Responsable:** Agent 02 — Audio Systems Architect

---

## 1. Current architectural reality

SuniPlayer now uses a **monorepo architecture**.

- `apps/web` contains the PWA and remains the most mature surface today.
- `apps/native` contains the Expo / React Native app for iOS and Android.
- `packages/core` contains shared domain logic, Zustand stores, data contracts, and reusable services.

---

## 2. Layer responsibilities

### 2.1 `packages/core`
Owns shared domain logic, including the new **SyncEnsemble** engine.
- `network/`: NTP Clock Sync, Session Orchestration, P2P Interfaces.
- `store/`: Centralized state management (Zustand).
- `platform/interfaces/`: Contracts for Audio, Storage, and File Access.

### 2.2 `apps/web`
Implements web-specific adapters:
- `BrowserAudioEngine`: SoundTouchJS integration.
- `FirestoreTransport`: Firebase Signaling + simple-peer WebRTC.

---

## 3. Capa de Red y Sincronía (SyncEnsemble)

Para la colaboración en tiempo real, implementamos una arquitectura **P2P Híbrida** (Signaling via Firestore + Data via WebRTC):

*   **ISyncClockService**: Algoritmo NTP adaptado. Calcula el offset temporal entre dispositivos con filtros de Mediana y EMA (Exponential Moving Average) para lograr una precisión de ≤5ms.
*   **IP2PTransport**: Abstracción de bajo nivel. Usa `FirestoreTransport` para señalización serverless y `simple-peer` para canales de datos directos.
*   **SessionManager**: Orquestador de la presencia. Maneja creación de salas, unión de miembros y rastreo de conectividad (mecanismo de nombres legendarios como Hendrix/Charly).
*   **SyncEnsembleOrchestrator**: El "Cerebro". Intercepta el transporte de audio para coordinar el `playAt` global, el conteo regresivo de 5s y la corrección activa de *drift* (±0.1%).
*   **YjsStore**: Motor de CRDT para sincronizar anotaciones y estado compartido sin conflictos.

---

## 4. State architecture

El estado es persistente y reactivo:
- **usePlayerStore**: Ahora persiste `sessionId`, `isLeader` y `userId` para permitir re-conexiones automáticas tras un refresco de página.
- **Countdown State**: Nuevo estado para coordinar el pre-roll de 5 segundos en toda la banda.

---

## 5. Audio architecture (High Precision)

Evolucionamos el contrato `IAudioEngine` para soportar:
- `playAt(targetTimeMs, positionMs)`: Permite programar arranques sincronizados a futuro.
- `setPlaybackRate(rate)`: Ajuste fino para corrección de drift sin artefactos audibles.

---

## 6. Decision summary

SuniPlayer es ahora una herramienta de **colaboración profesional**. La arquitectura soporta sincronía de alta precisión (<10ms) y persistencia de sesión, preparada para ser desplegada en entornos Serverless (Netlify + Firebase).
