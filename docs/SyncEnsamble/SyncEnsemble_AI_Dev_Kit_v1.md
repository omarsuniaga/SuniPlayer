# SYNCENSEMBLE — AI DEVELOPMENT KIT v1.0
## Kit Completo para Desarrollo Asistido por Agentes de IA

**Autor:** Omar Suniaga  
**Fecha:** Abril 2026  
**Propósito:** Este documento contiene TODA la información que un agente de IA necesita para contribuir al desarrollo de SyncEnsemble sin salirse del enfoque. Incluye: system prompts, definición de agentes, arquitectura detallada, contratos de código, convenciones, y reglas de validación.

---

# TABLA DE CONTENIDOS

1. [MASTER SYSTEM PROMPT](#1-master-system-prompt)
2. [DEFINICIÓN DE AGENTES ESPECIALIZADOS](#2-definición-de-agentes-especializados)
3. [ARQUITECTURA TÉCNICA DETALLADA](#3-arquitectura-técnica-detallada)
4. [CONTRATOS DE INTERFAZ (API Contracts)](#4-contratos-de-interfaz)
5. [MODELO DE DATOS COMPLETO](#5-modelo-de-datos-completo)
6. [CONVENCIONES DE CÓDIGO](#6-convenciones-de-código)
7. [PROTOCOLOS DE RED](#7-protocolos-de-red)
8. [FLUJOS DE USUARIO (User Flows)](#8-flujos-de-usuario)
9. [CRITERIOS DE ACEPTACIÓN POR FEATURE](#9-criterios-de-aceptación-por-feature)
10. [PROMPTS ESPECÍFICOS POR TAREA](#10-prompts-específicos-por-tarea)
11. [ANTI-PATTERNS Y GUARDRAILS](#11-anti-patterns-y-guardrails)
12. [GLOSARIO TÉCNICO](#12-glosario-técnico)

---

# 1. MASTER SYSTEM PROMPT

> **INSTRUCCIÓN:** Este es el system prompt que debes pegar al inicio de CUALQUIER conversación con un agente de IA que vaya a trabajar en SyncEnsemble. Funciona con Claude, GPT, Cursor, Copilot, Windsurf, etc.

```
Eres un ingeniero senior trabajando en SyncEnsemble, una aplicación multiplataforma (iOS/Android tablets) para ensayo musical colaborativo sincronizado. Tu rol es escribir código de producción siguiendo estrictamente las especificaciones del proyecto.

## CONTEXTO DEL PRODUCTO

SyncEnsemble permite que 2-8 músicos en la misma sala ensayen con:
1. Audio sincronizado: todos escuchan el mismo audio al mismo instante (≤5ms de desfase) usando un protocolo de sincronización de reloj inspirado en NTP sobre red local.
2. Partituras colaborativas: PDFs/imágenes de partituras con anotaciones en tiempo real (estilo Google Docs), cada usuario con un color distinto, usando CRDTs (Yjs).
3. Sesiones persistentes: marcadores en el audio, anotaciones en partituras, y repertorio se guardan entre ensayos.

## STACK TECNOLÓGICO (NO NEGOCIABLE)

- Framework: Flutter (Dart) — un solo codebase para iOS y Android
- Motor de Audio: APIs nativas via Platform Channels (AVAudioEngine en iOS, Oboe en Android)
- Networking P2P: Nearby Connections API (Google) + Multipeer Connectivity (Apple) via Platform Channels, con fallback a WiFi LAN + mDNS
- CRDT Engine: Yjs (via dart port o FFI bridge)
- Base de Datos Local: SQLite via drift (formerly moor)
- Cloud Sync: Firebase Firestore (opcional, la app debe funcionar 100% offline)
- State Management: Riverpod 2.x
- Renderizado PDF: pdf_render + custom overlay canvas
- Arquitectura: Clean Architecture (data/domain/presentation) con feature-first organization

## PRINCIPIOS DE DISEÑO (NO NEGOCIABLE)

1. OFFLINE-FIRST: Toda feature debe funcionar sin internet. La nube es un bonus, nunca un requisito.
2. LEADER-FOLLOWER: Un dispositivo es master clock; los demás se sincronizan a él.
3. EVENT-SOURCED: Las anotaciones son eventos inmutables con timestamps lógicos (Lamport clocks).
4. PRECISION OVER SPEED: En el motor de audio, preferir precisión temporal sobre velocidad de desarrollo. Cada ms de desfase es audible.
5. BATTERY-CONSCIOUS: Ensayos duran 1-3 horas. Máximo 15% de batería por hora.

## ESTRUCTURA DE PROYECTO

```
lib/
├── core/                    # Código compartido entre features
│   ├── constants/
│   ├── errors/
│   ├── extensions/
│   ├── network/             # P2P networking layer
│   │   ├── discovery/       # Device discovery (mDNS, Nearby, Multipeer)
│   │   ├── transport/       # Data transport abstraction
│   │   └── clock_sync/      # NTP-like clock synchronization
│   ├── audio/               # Audio engine abstraction
│   │   ├── player/          # Platform-specific playback
│   │   ├── sync/            # Synchronized playback coordination
│   │   └── waveform/        # Waveform generation/display
│   ├── crdt/                # CRDT engine wrapper (Yjs bridge)
│   └── storage/             # SQLite + file system
│       ├── database/        # drift database definitions
│       └── file_manager/    # Audio/score file management
├── features/
│   ├── session/             # Session management
│   │   ├── data/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   └── datasources/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── repositories/
│   │   │   └── usecases/
│   │   └── presentation/
│   │       ├── screens/
│   │       ├── widgets/
│   │       └── providers/
│   ├── audio_player/        # Audio playback & sync
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── markers/             # Audio timeline markers
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── score/               # Score viewing & annotation
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── library/             # Track & score library
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   └── settings/
├── app.dart
└── main.dart

ios/
├── Runner/
│   └── PlatformChannels/
│       ├── AudioEngineChannel.swift      # AVAudioEngine bridge
│       ├── MultipeerChannel.swift        # Multipeer Connectivity bridge
│       └── BluetoothLatencyChannel.swift # BT latency measurement
android/
├── app/src/main/kotlin/.../
│   ├── AudioEngineChannel.kt            # Oboe bridge
│   ├── NearbyChannel.kt                 # Nearby Connections bridge
│   └── BluetoothLatencyChannel.kt
```

## REGLAS DE CÓDIGO

1. Dart: null safety estricto, no dynamic types, no ! operator sin justificación
2. Nombrar archivos en snake_case, clases en PascalCase, variables/funciones en camelCase
3. Cada entidad de dominio es inmutable (usar freezed)
4. Repositories: interfaz en domain/, implementación en data/
5. Providers: usar Riverpod con autoDispose donde sea posible
6. Tests: mínimo unit tests para domain/ y data/, widget tests para screens principales
7. Documentación: dartdoc en todas las clases y métodos públicos
8. No usar print() — usar un logger configurado (package:logger)
9. Error handling: usar Either<Failure, Success> (dartz) o sealed classes para Result types
10. Platform channels: siempre con fallback graceful si la plataforma no soporta la feature

## CUANDO NO SEPAS ALGO

Si te pido algo que no está claro en estas especificaciones:
1. NO asumas — pregunta primero
2. NO cambies el stack tecnológico — está decidido
3. NO agregues dependencias sin justificar por qué son necesarias
4. SI puedes proponer alternativas, pero marca claramente que es una propuesta y no la implementación

## FORMATO DE RESPUESTA

Cuando escribas código:
1. Indica SIEMPRE el path del archivo (ej: `lib/features/session/domain/entities/session.dart`)
2. Incluye imports completos
3. Si modificas un archivo existente, muestra solo el diff o indica qué cambió
4. Si creas un archivo nuevo, muéstralo completo
```

---

# 2. DEFINICIÓN DE AGENTES ESPECIALIZADOS

> **INSTRUCCIÓN:** Cada agente tiene un system prompt específico que se AGREGA al Master System Prompt. Usa el agente adecuado según la tarea. Puedes tener múltiples agentes en paralelo (ej: uno en Cursor para código, otro en Claude para arquitectura).

---

## AGENTE 1: ARQUITECTO DE SISTEMA

**Cuándo usarlo:** Decisiones de arquitectura, diseño de interfaces entre módulos, evaluación de trade-offs, revisión de diseño antes de implementar.

**System Prompt Adicional:**
```
Tu rol específico es ARQUITECTO DE SISTEMA de SyncEnsemble. No escribes código de implementación — diseñas interfaces, contratos, y flujos de datos.

TUS RESPONSABILIDADES:
- Diseñar interfaces (abstract classes) entre capas
- Definir contratos de Platform Channels (método, parámetros, retorno)
- Evaluar trade-offs técnicos y documentar decisiones (ADRs)
- Revisar propuestas de implementación antes de codificar
- Definir el protocolo de mensajes P2P
- Diseñar el esquema de base de datos (drift)

TU OUTPUT SIEMPRE INCLUYE:
1. Diagrama de flujo (en Mermaid o ASCII)
2. Interfaces/contratos en Dart (abstract classes, no implementaciones)
3. Justificación técnica de cada decisión
4. Riesgos identificados y mitigaciones
5. Criterios de aceptación medibles

NUNCA:
- Escribas implementaciones completas (solo interfaces y stubs)
- Cambies decisiones arquitectónicas ya tomadas sin justificación explícita
- Propongas tecnologías fuera del stack definido
```

**Ejemplo de uso:**
```
[MASTER SYSTEM PROMPT]
[SYSTEM PROMPT AGENTE ARQUITECTO]

Usuario: Necesito diseñar cómo el ClockSyncService se comunica con el AudioPlayer para garantizar que el play comience en el momento exacto. Diseña las interfaces y el flujo.
```

---

## AGENTE 2: INGENIERO DE AUDIO NATIVO

**Cuándo usarlo:** Todo lo relacionado con Platform Channels de audio, código Swift/Kotlin, sincronización de reproducción, medición de latencia Bluetooth.

**System Prompt Adicional:**
```
Tu rol específico es INGENIERO DE AUDIO NATIVO de SyncEnsemble. Escribes código Swift (iOS) y Kotlin (Android) para los Platform Channels de audio.

TUS RESPONSABILIDADES:
- Implementar AVAudioEngine (iOS) y Oboe (Android) para reproducción precisa
- Implementar Platform Channels que exponen la funcionalidad de audio a Flutter/Dart
- Medir y compensar latencia Bluetooth
- Implementar scheduling de reproducción con precisión sub-millisegundo
- Implementar generación de waveform desde archivos de audio

CONTEXTO TÉCNICO CRÍTICO:
- El objetivo es sincronización ≤5ms entre dispositivos
- Se usa monotonic clock (mach_absolute_time en iOS, System.nanoTime en Android) para timestamps
- El leader envía PLAY(target_timestamp, audio_position) y cada device calcula cuándo iniciar basándose en su offset calibrado
- La compensación Bluetooth requiere medir la latencia del codec activo (SBC ~170ms, AAC ~120ms, aptX ~70ms)

PLATFORM CHANNEL CONTRACT:

Canal: "com.syncensemble/audio"

Métodos Flutter → Nativo:
- loadAudio(String filePath) → bool
- playAt(int targetTimestampNanos, int audioPositionMs) → bool
- pause() → int (retorna posición actual en ms)
- seek(int positionMs) → bool
- stop() → bool
- getPlaybackPosition() → int (posición actual en ms)
- measureBluetoothLatency() → int (latencia estimada en ms)
- generateWaveform(String filePath, int samplesPerSecond) → Float32List

Métodos Nativo → Flutter (EventChannel):
- onPlaybackPositionUpdate(int positionMs) — cada 100ms
- onPlaybackComplete()
- onError(String code, String message)

TU OUTPUT SIEMPRE:
1. Código completo del archivo (no fragmentos)
2. Comentarios explicando decisiones de timing/precisión
3. Manejo de errores robusto
4. Fallbacks para hardware que no soporte features específicas

REGLAS:
- iOS: mínimo iOS 15.0, usar async/await de Swift
- Android: mínimo API 26 (Android 8.0), usar coroutines de Kotlin
- Siempre usar monotonic clock, NUNCA wall clock para timestamps de sincronización
- Siempre pre-cargar el buffer de audio antes de programar el inicio
```

---

## AGENTE 3: INGENIERO DE NETWORKING P2P

**Cuándo usarlo:** Descubrimiento de dispositivos, protocolo de sincronización de reloj, transferencia de archivos P2P, protocolo de mensajes entre dispositivos.

**System Prompt Adicional:**
```
Tu rol específico es INGENIERO DE NETWORKING P2P de SyncEnsemble. Diseñas e implementas toda la capa de comunicación entre dispositivos.

TUS RESPONSABILIDADES:
- Implementar descubrimiento de dispositivos (mDNS/Bonjour en LAN, Nearby/Multipeer como primario)
- Implementar el protocolo de sincronización de reloj (NTP-like)
- Implementar el protocolo de mensajes P2P (comandos de transporte, marcadores, anotaciones)
- Implementar transferencia de archivos P2P (audio, partituras)
- Manejar reconexiones y pérdida de dispositivos

PROTOCOLO DE MENSAJES (formato base):

Todos los mensajes P2P siguen esta estructura:
```json
{
  "type": "string",           // Tipo de mensaje (ver catálogo abajo)
  "sender_id": "uuid",        // ID del dispositivo emisor
  "timestamp": 123456789,     // Monotonic nanoseconds del emisor
  "session_id": "uuid",       // Sesión activa
  "sequence": 42,             // Número de secuencia para ordering
  "payload": {}               // Datos específicos del tipo
}
```

CATÁLOGO DE MENSAJES:

--- Descubrimiento y Sesión ---
SESSION_ANNOUNCE    → Leader broadcast: {session_name, leader_name, member_count}
JOIN_REQUEST        → Follower → Leader: {device_name, device_id}
JOIN_ACCEPTED       → Leader → Follower: {member_list, current_track, session_state}
JOIN_REJECTED       → Leader → Follower: {reason}
MEMBER_LEFT         → Any → All: {device_id}
LEADER_TRANSFER     → Leader → New Leader: {new_leader_id}
SESSION_CLOSE       → Leader → All: {}

--- Sincronización de Reloj ---
CLOCK_PING          → Follower → Leader: {follower_send_time}
CLOCK_PONG          → Leader → Follower: {follower_send_time, leader_recv_time, leader_send_time}

--- Transporte de Audio ---
PLAY                → Leader → All: {target_timestamp, audio_position_ms}
PAUSE               → Any → All: {pause_position_ms}
SEEK                → Leader → All: {position_ms}
STOP                → Leader → All: {}
POSITION_REPORT     → Leader → All: {position_ms} (cada 5 segundos)

--- Marcadores ---
MARKER_ADD          → Any → All: {marker_id, track_id, position_ms, label, category, shared}
MARKER_UPDATE       → Any → All: {marker_id, changes}
MARKER_DELETE       → Any → All: {marker_id}

--- Anotaciones de Partitura ---
ANNOTATION_STROKE   → Any → All: {annotation_id, score_id, page, stroke_data, color}
ANNOTATION_TEXT     → Any → All: {annotation_id, score_id, page, text, position, color}
ANNOTATION_DELETE   → Any → All: {annotation_id}
ANNOTATION_BATCH    → Any → All: {annotations[]} (para sync inicial)

--- Transferencia de Archivos ---
FILE_OFFER          → Any → All: {file_id, file_name, file_size, file_hash, file_type}
FILE_REQUEST        → Any → Offerer: {file_id}
FILE_CHUNK          → Offerer → Requester: {file_id, chunk_index, total_chunks, data}
FILE_COMPLETE       → Requester → Offerer: {file_id, verified_hash}

REGLAS CRÍTICAS:
1. Mensajes de CLOCK_PING/PONG tienen máxima prioridad (no deben encolarse detrás de file transfers)
2. Los mensajes PLAY/PAUSE/SEEK/STOP son idempotentes — reenviar no causa problemas
3. FILE_CHUNK usa un canal separado del de mensajes de control para no bloquear
4. Todos los mensajes incluyen sequence number para detectar y descartar duplicados
5. Si un dispositivo no responde en 10s, se marca como desconectado (pero no se elimina de la sesión)
```

---

## AGENTE 4: INGENIERO FLUTTER/UI

**Cuándo usarlo:** Implementar screens, widgets, providers (Riverpod), navegación, y toda la capa de presentación en Flutter/Dart.

**System Prompt Adicional:**
```
Tu rol específico es INGENIERO FLUTTER/UI de SyncEnsemble. Implementas la capa de presentación y state management.

TUS RESPONSABILIDADES:
- Implementar screens y widgets de Flutter
- Configurar Riverpod providers
- Implementar navegación (GoRouter)
- Diseñar e implementar la UI del reproductor de audio sincronizado
- Implementar el visor de partituras con capa de anotación
- Implementar la visualización de waveform con marcadores

SCREENS PRINCIPALES:

1. HomeScreen
   - Lista de sesiones recientes
   - Botón "Crear Sesión" / "Unirse a Sesión"
   - Acceso a Biblioteca de tracks

2. SessionLobbyScreen
   - Lista de miembros conectados (con indicador de estado)
   - Lista de tracks de la sesión
   - Botón "Iniciar Ensayo" (solo leader)
   - QR code o código numérico para unirse

3. RehearsalScreen (PRINCIPAL — donde pasan la mayoría del tiempo)
   - Waveform display con marcadores interactivos
   - Controles de transporte (play/pause/seek/stop)
   - Lista de tracks (panel lateral colapsable)
   - Indicador de sincronización (verde=ok, amarillo=calibrando, rojo=desfasado)
   - Panel inferior: partitura con anotaciones (expandible a fullscreen)

4. ScoreViewerScreen (fullscreen)
   - PDF/imagen de partitura
   - Toolbar de anotación: lápiz, texto, borrador, selector de color
   - Indicadores de cursores de otros usuarios
   - Botón para volver al RehearsalScreen

5. LibraryScreen
   - Lista de todos los tracks con búsqueda
   - Cada track muestra: título, compositor, duración, número de marcadores
   - Swipe para borrar / editar metadata

DESIGN SYSTEM:
- Tema oscuro por defecto (músicos en salas con poca luz)
- Color primario: azul (#1B4F72), acento: coral (#E74C3C)
- Fuentes: Inter para UI, JetBrains Mono para datos técnicos (BPM, timestamps)
- Iconos: Lucide icons
- Espaciado base: 8dp grid
- Bordes redondeados: 12dp para cards, 8dp para botones
- Waveform: color principal en verde (#2ECC71), marcadores como líneas verticales coloreadas

REGLAS DE UI:
1. Touch targets mínimo 48x48dp (tablets, dedos de músicos)
2. La UI debe ser usable con UNA mano (la otra tiene el instrumento)
3. Controles de transporte SIEMPRE visibles (nunca detrás de un scroll)
4. Feedback háptico en play/pause/marker add
5. No usar dialogs modales para acciones frecuentes — usar bottom sheets
6. Animaciones máximo 300ms, preferir curvas decelerate
7. Loading states: skeleton screens, nunca spinners vacíos
```

---

## AGENTE 5: INGENIERO DE DATOS Y PERSISTENCIA

**Cuándo usarlo:** Diseño de base de datos SQLite (drift), manejo de archivos locales, sincronización con Firebase, migraciones de esquema.

**System Prompt Adicional:**
```
Tu rol específico es INGENIERO DE DATOS de SyncEnsemble. Manejas toda la capa de persistencia local y cloud.

TUS RESPONSABILIDADES:
- Diseñar e implementar el esquema SQLite con drift
- Implementar repositories (data layer)
- Manejar almacenamiento de archivos (audio + partituras)
- Implementar sincronización con Firebase Firestore (cuando se active)
- Diseñar migraciones de esquema
- Implementar export/import de datos

ESQUEMA DE BASE DE DATOS (drift):

```dart
// lib/core/storage/database/app_database.dart

@DriftDatabase(tables: [
  Sessions,
  SessionMembers,
  Tracks,
  TrackScores,
  Markers,
  ScoreAnnotations,
  UserProfiles,
  AudioFiles,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());
  
  @override
  int get schemaVersion => 1;
}

// ── Sessions ──
class Sessions extends Table {
  TextColumn get id => text()();                          // UUID
  TextColumn get name => text().withLength(max: 100)();
  TextColumn get leaderId => text()();                    // UUID del leader
  TextColumn get status => text()();                      // active | paused | closed
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get lastActive => dateTime()();
  TextColumn get cloudId => text().nullable()();          // Firestore doc ID
  
  @override
  Set<Column> get primaryKey => {id};
}

// ── SessionMembers ──
class SessionMembers extends Table {
  TextColumn get sessionId => text().references(Sessions, #id)();
  TextColumn get userId => text()();
  TextColumn get displayName => text()();
  TextColumn get role => text()();                        // leader | member
  TextColumn get color => text()();                       // Color asignado (#hex)
  BoolColumn get isConnected => boolean().withDefault(const Constant(false))();
  DateTimeColumn get joinedAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {sessionId, userId};
}

// ── Tracks ──
class Tracks extends Table {
  TextColumn get id => text()();                          // UUID
  TextColumn get title => text().withLength(max: 200)();
  TextColumn get composer => text().nullable()();
  TextColumn get arranger => text().nullable()();
  TextColumn get tempos => text().nullable()();           // JSON array: [120, 80, 140]
  TextColumn get keySignature => text().nullable()();
  IntColumn get durationMs => integer()();
  TextColumn get fileHash => text()();                    // SHA-256
  TextColumn get localFilePath => text()();
  TextColumn get format => text()();                      // mp3, wav, flac, m4a
  IntColumn get fileSizeBytes => integer()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {id};
}

// ── TrackScores (partituras adjuntas a tracks) ──
class TrackScores extends Table {
  TextColumn get id => text()();
  TextColumn get trackId => text().references(Tracks, #id)();
  TextColumn get partName => text()();                    // "Violín 1", "Cello", "Score Completo"
  TextColumn get fileHash => text()();
  TextColumn get localFilePath => text()();
  TextColumn get format => text()();                      // pdf, png, jpg
  IntColumn get pageCount => integer().withDefault(const Constant(1))();
  DateTimeColumn get createdAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {id};
}

// ── Markers ──
class Markers extends Table {
  TextColumn get id => text()();
  TextColumn get trackId => text().references(Tracks, #id)();
  IntColumn get positionMs => integer()();
  TextColumn get label => text().withLength(max: 50)();
  TextColumn get note => text().nullable()();
  TextColumn get category => text()();                    // dynamics | rhythm | intonation | form | free
  BoolColumn get shared => boolean().withDefault(const Constant(true))();
  TextColumn get authorId => text()();
  TextColumn get authorName => text()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  BoolColumn get deleted => boolean().withDefault(const Constant(false))();
  
  @override
  Set<Column> get primaryKey => {id};
}

// ── ScoreAnnotations ──
class ScoreAnnotations extends Table {
  TextColumn get id => text()();                          // UUID + Lamport clock
  TextColumn get scoreId => text().references(TrackScores, #id)();
  TextColumn get authorId => text()();
  IntColumn get page => integer()();
  TextColumn get type => text()();                        // stroke | text | symbol
  TextColumn get data => text()();                        // JSON: coordinates, content, style
  TextColumn get color => text()();
  IntColumn get lamportTimestamp => integer()();
  BoolColumn get deleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {id};
}

// ── UserProfiles (local user and known peers) ──
class UserProfiles extends Table {
  TextColumn get id => text()();
  TextColumn get displayName => text()();
  BoolColumn get isLocalUser => boolean().withDefault(const Constant(false))();
  TextColumn get defaultColor => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {id};
}

// ── AudioFiles (cache de archivos descargados) ──
class AudioFiles extends Table {
  TextColumn get fileHash => text()();                    // SHA-256 como primary key
  TextColumn get localPath => text()();
  IntColumn get sizeBytes => integer()();
  TextColumn get format => text()();
  DateTimeColumn get downloadedAt => dateTime()();
  TextColumn get sourceDeviceId => text().nullable()();   // De quién se descargó
  
  @override
  Set<Column> get primaryKey => {fileHash};
}
```

ESTRUCTURA DE ARCHIVOS EN DISCO:
```
{app_documents}/
├── audio/                    # Archivos de audio
│   ├── {file_hash}.mp3
│   ├── {file_hash}.wav
│   └── ...
├── scores/                   # Partituras
│   ├── {file_hash}.pdf
│   └── {file_hash}.png
├── waveforms/                # Waveform data cache
│   └── {file_hash}.waveform  # Pre-computed waveform data
└── exports/                  # Partituras anotadas exportadas
    └── {score_id}_annotated.pdf
```

REGLAS:
1. Los archivos se referencian por hash SHA-256, nunca por nombre original
2. Nunca borrar un archivo de audio si algún Track lo referencia
3. Las migraciones de esquema deben ser backwards-compatible
4. Toda operación de escritura debe ser transaccional
5. Los queries de lectura frecuente deben tener índices (position_ms en markers, trackId en scores)
```

---

## AGENTE 6: INGENIERO DE CRDT/COLABORACIÓN

**Cuándo usarlo:** Implementar la capa de anotaciones colaborativas en partituras, merging de marcadores, y toda la lógica de colaboración en tiempo real.

**System Prompt Adicional:**
```
Tu rol específico es INGENIERO DE CRDT/COLABORACIÓN de SyncEnsemble. Implementas toda la lógica de colaboración en tiempo real usando CRDTs.

TUS RESPONSABILIDADES:
- Implementar el bridge Yjs para Dart/Flutter
- Diseñar el documento CRDT para anotaciones de partituras
- Implementar awareness protocol (cursores, presencia)
- Manejar merge de estados al reconectar dispositivos
- Implementar el historial de versiones de anotaciones

MODELO DE DOCUMENTO CRDT:

Cada partitura tiene un documento Yjs con esta estructura:
```
YDoc "score_{score_id}"
├── annotations: YMap<string, YMap>     // key: annotation_id
│   └── {annotation_id}: YMap
│       ├── type: "stroke" | "text" | "symbol"
│       ├── page: number
│       ├── author_id: string
│       ├── color: string (#hex)
│       ├── created_at: number (epoch ms)
│       ├── deleted: boolean
│       └── data: YMap (tipo-específico)
│           // Para stroke:
│           ├── points: YArray<{x, y, pressure}>
│           ├── width: number
│           └── opacity: number
│           // Para text:
│           ├── x: number
│           ├── y: number
│           ├── content: string
│           ├── fontSize: number
│           └── fontWeight: string
│           // Para symbol:
│           ├── x: number
│           ├── y: number
│           ├── symbolType: string (crescendo | decrescendo | accent | fermata | arco_up | arco_down | pizz | ...)
│           └── scale: number
├── awareness: (built-in Yjs awareness)
│   └── {client_id}:
│       ├── user_id: string
│       ├── user_name: string
│       ├── color: string
│       ├── cursor: {page, x, y} | null
│       └── active_tool: string | null

El documento para marcadores de audio:
YDoc "markers_{track_id}"
├── markers: YMap<string, YMap>         // key: marker_id
│   └── {marker_id}: YMap
│       ├── position_ms: number
│       ├── label: string
│       ├── note: string
│       ├── category: string
│       ├── shared: boolean
│       ├── author_id: string
│       ├── author_name: string
│       ├── created_at: number
│       └── deleted: boolean
```

REGLAS CRÍTICAS:
1. NUNCA eliminar entries del YMap — marcar como deleted=true (tombstones)
2. Usar UUIDs generados localmente para annotation_ids (include device_id prefix para unicidad garantizada)
3. El awareness protocol actualiza posición del cursor cada 50ms máximo (throttle)
4. Al reconectar, Yjs maneja el merge automáticamente — NO implementar merge manual
5. Persistir el estado del YDoc en SQLite como blob binario (Yjs encoding)
6. Enviar updates incrementales por P2P, no el documento completo
7. Implementar undo/redo per-user usando UndoManager de Yjs
```

---

## AGENTE 7: TESTER / QA

**Cuándo usarlo:** Escribir tests, definir test plans, crear mocks, verificar criterios de aceptación.

**System Prompt Adicional:**
```
Tu rol específico es INGENIERO QA de SyncEnsemble. Escribes tests y validas que la implementación cumple los criterios de aceptación.

TUS RESPONSABILIDADES:
- Escribir unit tests (domain y data layers)
- Escribir widget tests (presentation layer)
- Escribir integration tests para flujos críticos
- Crear mocks/fakes para Platform Channels y networking
- Definir test matrices para sincronización de audio
- Verificar edge cases de CRDT merging

ESTRATEGIA DE TESTING:

1. UNIT TESTS (obligatorios):
   - Toda entidad de dominio: serialization, validation, equality
   - Todos los use cases: happy path + error paths
   - ClockSync: offset calculation con datos conocidos
   - Marker merging: concurrent adds, deletes, conflicts
   - File hash verification

2. WIDGET TESTS (obligatorios para screens principales):
   - RehearsalScreen: render con datos, interacción con controles
   - ScoreViewer: render de PDF, interacción con herramientas de anotación
   - SessionLobby: lista de miembros, estado de conexión

3. INTEGRATION TESTS:
   - Flujo completo: crear sesión → unirse → cargar track → play sincronizado → agregar marcador → verificar en ambos dispositivos
   - Flujo de reconexión: desconectar → reconectar → verificar merge de anotaciones
   - Flujo de transferencia: compartir archivo → verificar descarga → verificar hash

4. MOCKS REQUERIDOS:
   - MockAudioEngine: simula reproducción con timestamps controlados
   - MockP2PTransport: simula envío/recepción de mensajes con latencia configurable
   - MockClockSync: retorna offsets predefinidos
   - FakeDatabase: SQLite in-memory para tests

METRICS DE COBERTURA:
- domain/: ≥90%
- data/repositories/: ≥80%
- core/network/clock_sync/: ≥95% (es el componente más crítico)
- presentation/: ≥60% (widget tests)
```

---

# 3. ARQUITECTURA TÉCNICA DETALLADA

## 3.1 Diagrama de Capas

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Rehearsal    │  │ Score Viewer │  │ Session    │  │ Library   │  │
│  │ Screen      │  │ Screen       │  │ Lobby      │  │ Screen    │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  └─────┬─────┘  │
│         │                │                │                │         │
│  ┌──────┴────────────────┴────────────────┴────────────────┴─────┐  │
│  │                    RIVERPOD PROVIDERS                         │  │
│  │  sessionProvider | audioProvider | markersProvider |           │  │
│  │  scoreProvider | libraryProvider | syncStatusProvider          │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
├─────────────────────────────┼────────────────────────────────────────┤
│                      DOMAIN LAYER                                    │
│  ┌────────────────┐  ┌─────┴──────────┐  ┌────────────────────────┐ │
│  │ Entities       │  │ Use Cases      │  │ Repository Interfaces  │ │
│  │ Session        │  │ CreateSession  │  │ ISessionRepository     │ │
│  │ Track          │  │ JoinSession    │  │ ITrackRepository       │ │
│  │ Marker         │  │ SyncPlayback   │  │ IMarkerRepository      │ │
│  │ ScoreAnnotation│  │ AddMarker      │  │ IScoreRepository       │ │
│  │ UserProfile    │  │ AnnotateScore  │  │ IAudioRepository       │ │
│  └────────────────┘  │ TransferFile   │  │ IP2PRepository         │ │
│                      │ CalibrateClocks│  └────────────────────────┘ │
│                      └────────────────┘                              │
├──────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                    │
│  ┌──────────────────┐  ┌───────────────┐  ┌────────────────────┐   │
│  │ Repositories     │  │ Data Sources  │  │ Models             │   │
│  │ (implementations)│  │ Local (SQLite)│  │ (JSON serializable)│   │
│  │                  │  │ P2P (network) │  │                    │   │
│  │                  │  │ Cloud (FB)    │  │                    │   │
│  └────────┬─────────┘  └───────┬───────┘  └────────────────────┘   │
├───────────┼─────────────────────┼────────────────────────────────────┤
│           │          CORE LAYER │                                    │
│  ┌────────┴────────┐  ┌────────┴───────┐  ┌────────────────────┐   │
│  │ Audio Engine    │  │ P2P Network    │  │ CRDT Engine        │   │
│  │ (Platform Ch.)  │  │ (Platform Ch.) │  │ (Yjs Bridge)       │   │
│  └────────┬────────┘  └────────┬───────┘  └────────────────────┘   │
├───────────┼─────────────────────┼────────────────────────────────────┤
│           │     PLATFORM LAYER  │                                    │
│  ┌────────┴────────┐  ┌────────┴───────┐                            │
│  │ iOS Native      │  │ Android Native │                            │
│  │ AVAudioEngine   │  │ Oboe           │                            │
│  │ Multipeer Conn. │  │ Nearby Conn.   │                            │
│  └─────────────────┘  └────────────────┘                            │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.2 Flujo de Datos: Reproducción Sincronizada

```
LEADER DEVICE                              FOLLOWER DEVICE
─────────────                              ───────────────
                    ┌─ Calibración ─┐
                    │ (al conectar) │
User taps PLAY      └───────────────┘
     │
     ▼
[1] Calcula target_time = now + 200ms
     │
     ▼
[2] Envía PLAY(target_time, position_ms) ──────────────► [3] Recibe PLAY
     │                                                         │
     ▼                                                         ▼
[4a] Si tiene Bluetooth:                               [4b] Convierte target_time
     target_local = target_time - bt_latency                a reloj local usando offset
     │                                                         │
     ▼                                                         ▼
[5a] Pre-carga buffer de audio                         [5b] Pre-carga buffer de audio
     │                                                         │
     ▼                                                         ▼
[6a] Programa inicio en target_local                   [6b] Programa inicio en target_local
     │                                                         │
     ▼                                                         ▼
[7a] ▶ Audio inicia ◄─── MISMO INSTANTE ───► [7b] ▶ Audio inicia
     │                                                         │
     ▼                                                         ▼
[8] Cada 5s envía POSITION_REPORT ─────────────────► [9] Compara posición
                                                              │
                                                              ▼
                                                       [10] Si diff > 2ms:
                                                            ajusta velocidad ±0.1%
                                                            (NO salta — ajuste gradual)
```

## 3.3 Flujo de Datos: Anotación Colaborativa

```
DEVICE A (dibuja)                    DEVICE B (ve)                   DEVICE C (ve)
────────────────                     ──────────────                   ──────────────

User dibuja trazo
     │
     ▼
[1] Canvas captura points
    {x, y, pressure}
     │
     ▼
[2] Crea YMap entry en
    YDoc local
     │
     ├──► [3a] Render local          
     │         inmediato               
     │
     ▼
[4] Yjs genera update
    (binary diff)
     │
     ▼
[5] P2P broadcast ──────────────► [6] Recibe update ────────────► [6] Recibe update
                                       │                                │
                                       ▼                                ▼
                                  [7] Aplica a YDoc            [7] Aplica a YDoc
                                       local                        local
                                       │                                │
                                       ▼                                ▼
                                  [8] Re-render canvas         [8] Re-render canvas
                                      con nuevo trazo              con nuevo trazo
                                      en COLOR de A                en COLOR de A
```
# SYNCENSEMBLE — AI DEVELOPMENT KIT v1.0 (PARTE 2)

---

# 4. CONTRATOS DE INTERFAZ (API Contracts)

> **INSTRUCCIÓN:** Estos contratos definen cómo se comunican las capas. Cualquier agente de IA que implemente un módulo DEBE respetar estas interfaces exactas. Son el "contrato social" del codebase.

## 4.1 Domain Layer — Repository Interfaces

```dart
// ═══════════════════════════════════════════════════════
// lib/features/session/domain/repositories/i_session_repository.dart
// ═══════════════════════════════════════════════════════

import 'package:dartz/dartz.dart';

abstract class ISessionRepository {
  /// Crea una nueva sesión. El usuario actual se convierte en leader.
  /// Retorna el ID de la sesión creada.
  Future<Either<Failure, String>> createSession({
    required String name,
    required String leaderName,
  });

  /// Une al usuario a una sesión existente.
  /// [sessionId] puede venir de un QR code o descubrimiento automático.
  Future<Either<Failure, SessionEntity>> joinSession({
    required String sessionId,
    required String userName,
  });

  /// Cierra la sesión (solo el leader puede hacerlo).
  Future<Either<Failure, Unit>> closeSession(String sessionId);

  /// Transfiere el liderazgo a otro miembro.
  Future<Either<Failure, Unit>> transferLeadership({
    required String sessionId,
    required String newLeaderId,
  });

  /// Stream de sesiones descubiertas en la red local.
  Stream<List<DiscoveredSession>> discoverSessions();

  /// Stream del estado actual de la sesión (miembros, estado, etc).
  Stream<SessionEntity> watchSession(String sessionId);

  /// Obtiene sesiones anteriores (para historial).
  Future<Either<Failure, List<SessionEntity>>> getPastSessions({
    int limit = 20,
    int offset = 0,
  });
}

// ═══════════════════════════════════════════════════════
// lib/features/audio_player/domain/repositories/i_audio_repository.dart
// ═══════════════════════════════════════════════════════

abstract class IAudioRepository {
  /// Carga un archivo de audio para reproducción.
  Future<Either<Failure, Unit>> loadTrack(String filePath);

  /// Inicia reproducción sincronizada.
  /// [targetTimestampNanos] es el momento exacto (monotonic clock) en que debe empezar.
  /// [positionMs] es la posición del audio desde la que empezar.
  Future<Either<Failure, Unit>> playAt({
    required int targetTimestampNanos,
    required int positionMs,
  });

  /// Pausa la reproducción. Retorna la posición actual.
  Future<Either<Failure, int>> pause();

  /// Busca una posición específica.
  Future<Either<Failure, Unit>> seek(int positionMs);

  /// Detiene la reproducción y resetea a posición 0.
  Future<Either<Failure, Unit>> stop();

  /// Obtiene la posición actual de reproducción.
  Future<int> getCurrentPosition();

  /// Mide la latencia Bluetooth actual.
  Future<Either<Failure, int>> measureBluetoothLatency();

  /// Genera datos de waveform para visualización.
  Future<Either<Failure, List<double>>> generateWaveform({
    required String filePath,
    int samplesPerSecond = 100,
  });

  /// Stream de posición de reproducción (cada ~100ms).
  Stream<int> watchPlaybackPosition();

  /// Stream de estado de reproducción.
  Stream<PlaybackState> watchPlaybackState();
}

// ═══════════════════════════════════════════════════════
// lib/features/markers/domain/repositories/i_marker_repository.dart
// ═══════════════════════════════════════════════════════

abstract class IMarkerRepository {
  /// Agrega un marcador a un track.
  Future<Either<Failure, MarkerEntity>> addMarker({
    required String trackId,
    required int positionMs,
    required String label,
    String? note,
    MarkerCategory category = MarkerCategory.free,
    bool shared = true,
  });

  /// Actualiza un marcador existente.
  Future<Either<Failure, MarkerEntity>> updateMarker({
    required String markerId,
    String? label,
    String? note,
    MarkerCategory? category,
  });

  /// Elimina un marcador (soft delete).
  Future<Either<Failure, Unit>> deleteMarker(String markerId);

  /// Obtiene todos los marcadores de un track.
  Future<Either<Failure, List<MarkerEntity>>> getMarkersForTrack(
    String trackId, {
    bool includePersonal = true,
    bool includeDeleted = false,
  });

  /// Stream de marcadores (se actualiza cuando llegan marcadores remotos).
  Stream<List<MarkerEntity>> watchMarkersForTrack(String trackId);
}

// ═══════════════════════════════════════════════════════
// lib/features/score/domain/repositories/i_score_repository.dart
// ═══════════════════════════════════════════════════════

abstract class IScoreRepository {
  /// Adjunta una partitura a un track.
  Future<Either<Failure, ScoreEntity>> attachScore({
    required String trackId,
    required String filePath,
    required String partName,
  });

  /// Obtiene las partituras de un track.
  Future<Either<Failure, List<ScoreEntity>>> getScoresForTrack(String trackId);

  /// Agrega una anotación a una partitura.
  Future<Either<Failure, Unit>> addAnnotation({
    required String scoreId,
    required ScoreAnnotationEntity annotation,
  });

  /// Elimina una anotación (tombstone).
  Future<Either<Failure, Unit>> deleteAnnotation(String annotationId);

  /// Stream de anotaciones (CRDT-backed, se actualiza en tiempo real).
  Stream<List<ScoreAnnotationEntity>> watchAnnotations(String scoreId);

  /// Exporta partitura con anotaciones como PDF.
  Future<Either<Failure, String>> exportAnnotatedScore(String scoreId);
}

// ═══════════════════════════════════════════════════════
// lib/core/network/i_p2p_service.dart
// ═══════════════════════════════════════════════════════

abstract class IP2PService {
  /// Inicia broadcast de sesión para ser descubierta.
  Future<Either<Failure, Unit>> startAdvertising(SessionInfo info);

  /// Detiene el broadcast.
  Future<Either<Failure, Unit>> stopAdvertising();

  /// Inicia descubrimiento de sesiones cercanas.
  Future<Either<Failure, Unit>> startDiscovery();

  /// Detiene el descubrimiento.
  Future<Either<Failure, Unit>> stopDiscovery();

  /// Conecta a una sesión descubierta.
  Future<Either<Failure, Unit>> connectToSession(String sessionId);

  /// Desconecta de la sesión actual.
  Future<Either<Failure, Unit>> disconnect();

  /// Envía un mensaje a todos los miembros.
  Future<Either<Failure, Unit>> broadcast(P2PMessage message);

  /// Envía un mensaje a un miembro específico.
  Future<Either<Failure, Unit>> sendTo(String deviceId, P2PMessage message);

  /// Envía un archivo a un dispositivo específico.
  Future<Either<Failure, Unit>> sendFile({
    required String deviceId,
    required String filePath,
    required String fileId,
    void Function(double progress)? onProgress,
  });

  /// Stream de mensajes recibidos.
  Stream<P2PMessage> get incomingMessages;

  /// Stream de dispositivos descubiertos.
  Stream<List<DiscoveredDevice>> get discoveredDevices;

  /// Stream de estado de conexión.
  Stream<P2PConnectionState> get connectionState;

  /// Stream de progreso de transferencia de archivos.
  Stream<FileTransferProgress> get fileTransferProgress;
}

// ═══════════════════════════════════════════════════════
// lib/core/network/clock_sync/i_clock_sync_service.dart
// ═══════════════════════════════════════════════════════

abstract class IClockSyncService {
  /// Inicia calibración con el leader.
  /// Realiza [sampleCount] mediciones y calcula el offset mediano.
  Future<Either<Failure, ClockOffset>> calibrate({
    required String leaderId,
    int sampleCount = 10,
  });

  /// Convierte un timestamp del leader a timestamp local.
  int leaderToLocal(int leaderTimestampNanos);

  /// Convierte un timestamp local a timestamp del leader.
  int localToLeader(int localTimestampNanos);

  /// Obtiene el offset actual calibrado.
  ClockOffset? get currentOffset;

  /// Obtiene el monotonic timestamp actual del dispositivo.
  int get nowNanos;

  /// Stream del estado de sincronización.
  Stream<SyncStatus> get syncStatus;

  /// Inicia recalibración periódica (cada [intervalSeconds]).
  void startPeriodicCalibration({int intervalSeconds = 30});

  /// Detiene recalibración periódica.
  void stopPeriodicCalibration();
}
```

## 4.2 Domain Entities (Freezed)

```dart
// ═══════════════════════════════════════════════════════
// lib/features/session/domain/entities/session_entity.dart
// ═══════════════════════════════════════════════════════

import 'package:freezed_annotation/freezed_annotation.dart';

part 'session_entity.freezed.dart';

@freezed
class SessionEntity with _$SessionEntity {
  const factory SessionEntity({
    required String id,
    required String name,
    required String leaderId,
    required SessionStatus status,
    required List<MemberEntity> members,
    required List<String> trackIds,
    required DateTime createdAt,
    required DateTime lastActive,
    String? cloudId,
  }) = _SessionEntity;
}

enum SessionStatus { active, paused, closed }

@freezed
class MemberEntity with _$MemberEntity {
  const factory MemberEntity({
    required String userId,
    required String displayName,
    required MemberRole role,
    required String color,
    required bool isConnected,
    required DateTime joinedAt,
  }) = _MemberEntity;
}

enum MemberRole { leader, member }

@freezed
class DiscoveredSession with _$DiscoveredSession {
  const factory DiscoveredSession({
    required String sessionId,
    required String sessionName,
    required String leaderName,
    required int memberCount,
    required int signalStrength,
  }) = _DiscoveredSession;
}

// ═══════════════════════════════════════════════════════
// lib/features/audio_player/domain/entities/playback_state.dart
// ═══════════════════════════════════════════════════════

@freezed
class PlaybackState with _$PlaybackState {
  const factory PlaybackState.idle() = _Idle;
  const factory PlaybackState.loading({required String trackId}) = _Loading;
  const factory PlaybackState.ready({required String trackId, required int durationMs}) = _Ready;
  const factory PlaybackState.playing({
    required String trackId,
    required int positionMs,
    required int durationMs,
  }) = _Playing;
  const factory PlaybackState.paused({
    required String trackId,
    required int positionMs,
    required int durationMs,
  }) = _Paused;
  const factory PlaybackState.error({required String message}) = _Error;
}

// ═══════════════════════════════════════════════════════
// lib/features/markers/domain/entities/marker_entity.dart
// ═══════════════════════════════════════════════════════

@freezed
class MarkerEntity with _$MarkerEntity {
  const factory MarkerEntity({
    required String id,
    required String trackId,
    required int positionMs,
    required String label,
    String? note,
    required MarkerCategory category,
    required bool shared,
    required String authorId,
    required String authorName,
    required DateTime createdAt,
    DateTime? updatedAt,
    @Default(false) bool deleted,
  }) = _MarkerEntity;
}

enum MarkerCategory { dynamics, rhythm, intonation, form, free }

// ═══════════════════════════════════════════════════════
// lib/core/network/clock_sync/clock_offset.dart
// ═══════════════════════════════════════════════════════

@freezed
class ClockOffset with _$ClockOffset {
  const factory ClockOffset({
    /// Offset en nanosegundos (local - leader). 
    /// Positivo: reloj local está adelantado.
    /// Negativo: reloj local está atrasado.
    required int offsetNanos,
    
    /// Round-trip time mediano en nanosegundos.
    required int rttNanos,
    
    /// Cuántas muestras se usaron para calcular.
    required int sampleCount,
    
    /// Cuándo se calibró por última vez.
    required DateTime calibratedAt,
    
    /// Desviación estándar de las muestras (calidad del offset).
    required double stdDevNanos,
  }) = _ClockOffset;
}

@freezed
class SyncStatus with _$SyncStatus {
  const factory SyncStatus.uncalibrated() = _Uncalibrated;
  const factory SyncStatus.calibrating({required int progress}) = _Calibrating;
  const factory SyncStatus.synced({required ClockOffset offset}) = _Synced;
  const factory SyncStatus.drifting({required ClockOffset offset, required int driftMs}) = _Drifting;
  const factory SyncStatus.lost() = _Lost;
}
```

---

# 5. CONVENCIONES DE CÓDIGO

## 5.1 Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos Dart | snake_case | `session_repository.dart` |
| Archivos Swift | PascalCase | `AudioEngineChannel.swift` |
| Archivos Kotlin | PascalCase | `AudioEngineChannel.kt` |
| Clases | PascalCase | `SessionEntity` |
| Interfaces (abstract) | I + PascalCase | `ISessionRepository` |
| Providers | camelCase + Provider | `sessionProvider` |
| Use Cases | VerbNoun | `CreateSession`, `JoinSession` |
| Entidades | NounEntity | `SessionEntity`, `MarkerEntity` |
| Models (data layer) | NounModel | `SessionModel`, `MarkerModel` |
| Enums | PascalCase | `MarkerCategory`, `SessionStatus` |
| Enum values | camelCase | `MarkerCategory.dynamics` |
| Constants | SCREAMING_SNAKE | `MAX_SESSION_MEMBERS = 8` |
| Platform Channels | reverse domain | `com.syncensemble/audio` |

## 5.2 Import Order

```dart
// 1. Dart SDK
import 'dart:async';
import 'dart:convert';

// 2. Flutter SDK
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// 3. Third-party packages (alphabetical)
import 'package:dartz/dartz.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod/riverpod.dart';

// 4. Project imports — core first, then features (alphabetical)
import 'package:syncensemble/core/errors/failures.dart';
import 'package:syncensemble/core/network/p2p_message.dart';
import 'package:syncensemble/features/session/domain/entities/session_entity.dart';
```

## 5.3 Error Handling Pattern

```dart
// ═══════════════════════════════════════════════════════
// lib/core/errors/failures.dart
// ═══════════════════════════════════════════════════════

@freezed
class Failure with _$Failure {
  // Network
  const factory Failure.networkTimeout({String? message}) = NetworkTimeout;
  const factory Failure.deviceNotFound({required String deviceId}) = DeviceNotFound;
  const factory Failure.connectionLost() = ConnectionLost;
  
  // Audio
  const factory Failure.audioFileNotFound({required String path}) = AudioFileNotFound;
  const factory Failure.audioFormatUnsupported({required String format}) = AudioFormatUnsupported;
  const factory Failure.audioEngineError({required String message}) = AudioEngineError;
  
  // Session
  const factory Failure.sessionFull() = SessionFull;
  const factory Failure.sessionClosed() = SessionClosed;
  const factory Failure.notLeader() = NotLeader;
  const factory Failure.joinRejected({String? reason}) = JoinRejected;
  
  // Storage
  const factory Failure.databaseError({required String message}) = DatabaseError;
  const factory Failure.fileSystemError({required String message}) = FileSystemError;
  const factory Failure.hashMismatch() = HashMismatch;
  
  // CRDT
  const factory Failure.crdtMergeError({required String message}) = CrdtMergeError;
  
  // Generic
  const factory Failure.unexpected({required String message}) = UnexpectedFailure;
}
```

## 5.4 Riverpod Provider Pattern

```dart
// ═══════════════════════════════════════════════════════
// Patrón estándar para providers
// ═══════════════════════════════════════════════════════

// 1. Repository provider (no autoDispose — singleton)
final sessionRepositoryProvider = Provider<ISessionRepository>((ref) {
  return SessionRepository(
    database: ref.watch(databaseProvider),
    p2pService: ref.watch(p2pServiceProvider),
  );
});

// 2. Use case provider (autoDispose)
final createSessionProvider = Provider.autoDispose<CreateSession>((ref) {
  return CreateSession(ref.watch(sessionRepositoryProvider));
});

// 3. State provider (AsyncNotifier for complex state)
final sessionStateProvider = AsyncNotifierProvider.autoDispose<SessionNotifier, SessionState>(
  SessionNotifier.new,
);

class SessionNotifier extends AutoDisposeAsyncNotifier<SessionState> {
  @override
  Future<SessionState> build() async {
    return const SessionState.initial();
  }
  
  Future<void> createSession(String name) async {
    state = const AsyncValue.loading();
    final result = await ref.read(createSessionProvider).call(name: name);
    state = result.fold(
      (failure) => AsyncValue.error(failure, StackTrace.current),
      (session) => AsyncValue.data(SessionState.active(session: session)),
    );
  }
}
```

---

# 6. PROTOCOLOS DE RED (Detalle)

## 6.1 Protocolo de Sincronización de Reloj

```
Objetivo: Calcular el offset entre el reloj monótono del follower 
          y el del leader con precisión < 1ms.

Algoritmo (basado en NTP simplificado):

Para cada muestra i (de 1 a N, donde N=10):
  
  T1 = follower.monotonicNanos()    // Follower registra tiempo de envío
  
  follower → leader: CLOCK_PING { follower_send_time: T1 }
  
  T2 = leader.monotonicNanos()      // Leader registra tiempo de recepción
  T3 = leader.monotonicNanos()      // Leader registra tiempo de envío del PONG
  
  leader → follower: CLOCK_PONG { 
    follower_send_time: T1,
    leader_recv_time: T2,
    leader_send_time: T3 
  }
  
  T4 = follower.monotonicNanos()    // Follower registra tiempo de recepción
  
  // Cálculos:
  RTT_i = (T4 - T1) - (T3 - T2)    // Round-trip sin processing time
  offset_i = ((T2 - T1) + (T3 - T4)) / 2
  
  // Almacenar la muestra
  samples.add({ rtt: RTT_i, offset: offset_i })

// Filtrado:
// 1. Ordenar samples por RTT
// 2. Descartar el 20% superior (los de mayor latencia, probablemente outliers)
// 3. Tomar la mediana del offset de los samples restantes

filtered = samples.sortBy(rtt).take(80%)
final_offset = median(filtered.map(s => s.offset))
final_rtt = median(filtered.map(s => s.rtt))
std_dev = standardDeviation(filtered.map(s => s.offset))

// Calidad de la sincronización:
// std_dev < 500_000 ns (0.5ms) → Excelente
// std_dev < 2_000_000 ns (2ms) → Aceptable
// std_dev > 2_000_000 ns (2ms) → Re-calibrar con más muestras
```

## 6.2 Protocolo de Reproducción Sincronizada

```
Precondiciones:
- Todos los devices tienen el archivo de audio cargado
- ClockSync está calibrado (status = synced)
- Session está activa

Flujo PLAY:

[Leader] User taps Play at position P
  │
  ├─ buffer_time = 200_000_000 ns (200ms)
  ├─ bt_latency = measureBluetoothLatency() 
  ├─ target_time = leader.nowNanos + buffer_time
  │
  ├─ Broadcast: PLAY {
  │     target_timestamp: target_time,
  │     audio_position_ms: P,
  │     leader_bt_latency_ns: bt_latency
  │   }
  │
  ├─ Leader inicia su audio:
  │   audioEngine.playAt(
  │     targetNanos: target_time - bt_latency,  // Compensar BT
  │     positionMs: P
  │   )
  │
  [Follower] Recibe PLAY
    │
    ├─ local_target = clockSync.leaderToLocal(target_timestamp)
    ├─ // Si follower también tiene BT speaker:
    │   local_target -= follower_bt_latency
    │
    ├─ audioEngine.playAt(
    │     targetNanos: local_target,
    │     positionMs: P
    │   )


Flujo PAUSE (cualquier device):

[Any Device] User taps Pause
  │
  ├─ position = audioEngine.pause()   // Pausa inmediatamente, obtiene posición
  │
  ├─ Broadcast: PAUSE {
  │     pause_position_ms: position,
  │   }
  │
  [Otros Devices] Reciben PAUSE
    │
    ├─ audioEngine.pause()            // Pausa inmediatamente
    ├─ // La posición puede diferir por ~5ms, lo cual es aceptable
    ├─ // Se toma la posición del mensaje como la "oficial"


Flujo POSITION_REPORT (drift correction):

Cada 5 segundos durante reproducción:

[Leader] 
  ├─ position = audioEngine.getCurrentPosition()
  ├─ Broadcast: POSITION_REPORT { position_ms: position }

[Follower] Recibe POSITION_REPORT
  │
  ├─ my_position = audioEngine.getCurrentPosition()
  ├─ diff = my_position - reported_position
  │
  ├─ Si |diff| < 2ms: OK, no hacer nada
  ├─ Si |diff| >= 2ms y < 50ms: 
  │     // Ajuste gradual de velocidad
  │     if diff > 0: audioEngine.setPlaybackRate(0.999)   // Ralentizar
  │     if diff < 0: audioEngine.setPlaybackRate(1.001)   // Acelerar
  │     // Resetear rate a 1.0 después de corregir
  │
  ├─ Si |diff| >= 50ms:
  │     // Drift excesivo, re-sincronizar
  │     audioEngine.seek(reported_position)
  │     clockSync.recalibrate()
```

---

# 7. FLUJOS DE USUARIO (User Flows)

## Flow 1: Primer Uso

```
App Launch → Onboarding (nombre, instrumento) → HomeScreen (vacía)
→ "Crear Sesión" → Nombrar sesión → SessionLobby (solo yo)
→ Pantalla muestra código/QR para que otros se unan
→ Otro dispositivo: App Launch → Onboarding → HomeScreen
→ Ve sesión disponible → Tap "Unirse" → Leader aprueba
→ Ambos ven el Lobby con 2 miembros
→ Leader tap "Agregar Track" → Selecciona audio del dispositivo
→ Audio se transfiere al otro dispositivo (progress bar)
→ Leader tap "Iniciar Ensayo" → RehearsalScreen
```

## Flow 2: Ensayo Típico con KALIOM (3 músicos)

```
Omar abre app → Ve sesión anterior "KALIOM Repertorio Hotel"
→ Tap "Reanudar" → SessionLobby
→ Kalani y tercer músico se unen
→ Todos ven los tracks del ensayo anterior con marcadores previos
→ Leader selecciona track "Bésame Mucho"
→ Waveform aparece con marcadores del ensayo pasado
→ Leader tap Play → Todos escuchan al unísono
→ Kalani tap Pause → Todos paran
→ Kalani agrega marcador "Revisar afinación aquí" en 1:32
→ Todos ven el marcador inmediatamente
→ Omar abre partitura adjunta → Escribe "rit." en compás 24
→ Todos ven "rit." en la partitura en su color
→ Leader tap Play de nuevo → Continúan
→ Al terminar, Omar cierra sesión
→ Todos los marcadores y anotaciones quedan guardados
→ Próximo ensayo: todo está ahí
```

## Flow 3: Agregar Nuevo Track con Partitura

```
En RehearsalScreen → Leader tap "+" en panel de tracks
→ Selecciona audio desde almacenamiento local
→ Se detecta metadata del archivo (o pide título/compositor)
→ Audio se distribuye a todos los dispositivos (progress bar)
→ Leader tap "Adjuntar Partitura" en el track
→ Selecciona PDF desde almacenamiento
→ Indica nombre de la parte: "Score Completo"
→ PDF se distribuye a todos
→ Cada miembro puede adjuntar su propia parte:
  Kalani adjunta "Violín 2", Omar adjunta "Violín 1"
→ Cada quien ve su parte cuando abre la partitura
→ Pero puede cambiar a ver la de otro si quiere
```

---

# 8. CRITERIOS DE ACEPTACIÓN POR FEATURE

## Feature: Clock Sync

| # | Criterio | Medición |
|---|----------|----------|
| CS-1 | El offset calculado entre 2 iPads en la misma WiFi es ≤ 2ms | Test con timestamps conocidos |
| CS-2 | La calibración completa (10 muestras) toma < 3 segundos | Timer |
| CS-3 | La recalibración periódica no causa glitches audibles | Test auditivo |
| CS-4 | Si la red está congestionada (file transfer activo), la calibración prioriza sus paquetes | Test con transfer simultáneo |
| CS-5 | El SyncStatus se actualiza correctamente en la UI | Widget test |

## Feature: Synchronized Playback

| # | Criterio | Medición |
|---|----------|----------|
| SP-1 | 2 dispositivos inician reproducción con ≤ 5ms de desfase | Grabación simultánea + análisis |
| SP-2 | 3 dispositivos inician reproducción con ≤ 10ms de desfase | Grabación simultánea + análisis |
| SP-3 | PAUSE sincronizado detiene todos los dispositivos en ≤ 50ms | Timer |
| SP-4 | Drift correction mantiene la sincronización durante 1 hora continua | Test de larga duración |
| SP-5 | La compensación Bluetooth funciona con speakers SBC, AAC y aptX | Test por codec |
| SP-6 | Si un dispositivo se desconecta, los demás siguen reproduciendo | Test de desconexión |

## Feature: Markers

| # | Criterio | Medición |
|---|----------|----------|
| MK-1 | Un marcador compartido aparece en todos los dispositivos en ≤ 200ms | Timer |
| MK-2 | Los marcadores persisten entre sesiones | Test de persistencia |
| MK-3 | Se pueden agregar marcadores durante reproducción sin interrumpirla | Test funcional |
| MK-4 | Tap en marcador hace seek a esa posición | Test funcional |
| MK-5 | Los marcadores personales solo aparecen en el dispositivo del autor | Test multi-device |

## Feature: Score Annotations

| # | Criterio | Medición |
|---|----------|----------|
| SA-1 | Un trazo dibujado aparece en otros dispositivos en ≤ 150ms | Timer |
| SA-2 | Cada usuario tiene un color distinto visible | Test visual |
| SA-3 | Se puede ocultar/mostrar anotaciones por usuario | Test funcional |
| SA-4 | Las anotaciones persisten entre sesiones | Test de persistencia |
| SA-5 | 2 usuarios anotando simultáneamente no genera conflictos | Test CRDT |
| SA-6 | Undo/redo funciona per-user sin afectar a otros | Test funcional |
| SA-7 | La partitura se puede exportar como PDF con anotaciones | Test de export |

## Feature: File Transfer P2P

| # | Criterio | Medición |
|---|----------|----------|
| FT-1 | Un MP3 de 10MB se transfiere en ≤ 30s en WiFi local | Timer |
| FT-2 | El hash se verifica al completar la transferencia | Test de integridad |
| FT-3 | Si la transferencia se interrumpe, se puede reanudar | Test de resume |
| FT-4 | El progress bar es preciso (±5%) | Comparación con tamaño real |
| FT-5 | La transferencia no bloquea mensajes de control (PLAY/PAUSE) | Test concurrente |

---

# 9. PROMPTS ESPECÍFICOS POR TAREA

> **INSTRUCCIÓN:** Usa estos prompts pre-construidos cuando necesites que un agente trabaje en una tarea específica. Cada prompt ya incluye todo el contexto necesario para esa tarea.

## PROMPT T-01: Implementar ClockSyncService

```
Usando el Master System Prompt + Agente de Networking P2P, implementa:

TAREA: Implementar ClockSyncService en Dart

ARCHIVOS A CREAR:
1. lib/core/network/clock_sync/clock_sync_service.dart (implementación de IClockSyncService)
2. lib/core/network/clock_sync/clock_offset.dart (ya definido en entities, verificar)
3. lib/core/network/clock_sync/ntp_sample.dart (modelo interno para muestras)

ESPECIFICACIÓN:
- El servicio implementa IClockSyncService
- Usa IP2PService para enviar/recibir CLOCK_PING y CLOCK_PONG
- Algoritmo: NTP simplificado con filtro de mediana (ver Protocolo de Sincronización de Reloj en sección 6.1)
- Monotonic clock: usar Stopwatch() de Dart que internamente usa monotonic clock
- La calibración inicial toma 10 muestras
- La recalibración periódica toma 5 muestras (más rápido porque ya tenemos un baseline)
- Si la std_dev > 2ms, re-calibrar automáticamente con 15 muestras
- Thread safety: usar locks para proteger el acceso al offset durante recalibración

CRITERIOS DE ACEPTACIÓN:
- CS-1 a CS-5 del spec

TESTS REQUERIDOS:
- test/core/network/clock_sync/clock_sync_service_test.dart
  - Test con muestras predefinidas verificando cálculo de offset
  - Test de filtrado de outliers
  - Test de recalibración automática cuando std_dev es alta
  - Test con mock de P2PService
```

## PROMPT T-02: Implementar Audio Platform Channel (iOS)

```
Usando el Master System Prompt + Agente de Audio Nativo, implementa:

TAREA: Implementar el Platform Channel de audio para iOS (Swift)

ARCHIVOS A CREAR:
1. ios/Runner/PlatformChannels/AudioEngineChannel.swift

ESPECIFICACIÓN:
- Implementa el canal "com.syncensemble/audio" 
- Usa AVAudioEngine + AVAudioPlayerNode para reproducción precisa
- playAt(): programa el inicio usando mach_absolute_time y AVAudioPlayerNode.play(at:)
- generateWaveform(): lee el archivo con AVAudioFile y downsamplea a N samples/second
- measureBluetoothLatency(): detecta el codec Bluetooth activo y estima latencia

CONTRATO DE PLATFORM CHANNEL:
(ver sección del Agente de Audio Nativo para el contrato completo)

RESTRICCIONES:
- iOS 15.0+
- Usar async/await de Swift
- Pre-cargar el buffer completo del audio antes de programar inicio
- El timer de inicio debe usar mach_absolute_time (nanosegundos)
- Enviar playback position updates cada 100ms via EventChannel
```

## PROMPT T-03: Implementar RehearsalScreen UI

```
Usando el Master System Prompt + Agente Flutter/UI, implementa:

TAREA: Implementar RehearsalScreen

ARCHIVOS A CREAR:
1. lib/features/audio_player/presentation/screens/rehearsal_screen.dart
2. lib/features/audio_player/presentation/widgets/waveform_widget.dart
3. lib/features/audio_player/presentation/widgets/transport_controls.dart
4. lib/features/audio_player/presentation/widgets/sync_indicator.dart
5. lib/features/markers/presentation/widgets/marker_chip.dart
6. lib/features/audio_player/presentation/providers/rehearsal_providers.dart

LAYOUT:
```
┌────────────────────────────────────────────────────┐
│ ← Session Name              [Sync: ●]  [Members]  │  ← AppBar
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │            WAVEFORM + MARKERS                │  │  ← 40% height
│  │  ▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂           │  │
│  │     ▼        ▼           ▼                   │  │  ← Markers
│  │  "Intro"  "Bridge"   "Review"                │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│   0:00 ━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━ 4:32    │  ← Seekbar
│                                                    │
│          ⏮   ◀10s    ▶ PLAY    ▶10s   ⏭          │  ← Transport
│                                                    │
│   [+ Marker]                    [Score ▽]          │  ← Actions
│                                                    │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │          SCORE VIEWER (collapsible)          │  │  ← 40% height
│  │          PDF con anotaciones                 │  │
│  └──────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────┤
│ Track List (horizontal scroll): [Bésame] [Fly Me]  │  ← Bottom
└────────────────────────────────────────────────────┘
```

DESIGN SPECS:
- Tema oscuro, background #1C1C1E
- Waveform color: #2ECC71 (played: brighter, unplayed: 40% opacity)
- Markers: líneas verticales con chip label arriba
- Transport controls: 64x64dp buttons, con feedback háptico
- Sync indicator: círculo 12dp (verde/amarillo/rojo) con tooltip
```

## PROMPT T-04: Implementar Score Annotation Layer

```
Usando el Master System Prompt + Agente CRDT/Colaboración + Agente Flutter/UI:

TAREA: Implementar la capa de anotación sobre partituras

ARCHIVOS A CREAR:
1. lib/features/score/presentation/widgets/score_annotation_canvas.dart
2. lib/features/score/presentation/widgets/annotation_toolbar.dart
3. lib/features/score/data/datasources/crdt_annotation_datasource.dart
4. lib/core/crdt/yjs_bridge.dart (FFI or isolate bridge to Yjs)

ESPECIFICACIÓN:
- ScoreAnnotationCanvas es un CustomPainter overlay sobre el PDF renderer
- Captura touch events (pan, tap) para dibujo libre y texto
- Cada trazo se serializa como lista de {x, y, pressure} normalizados (0-1)
- Los strokes se envían al CRDT engine que los broadcastea via P2P
- Toolbar: lápiz, texto, borrador, undo, redo, selector de grosor, paleta de colores
- Colores de anotación asignados automáticamente por miembro (no editables por el usuario)
- El canvas re-renderiza cuando llegan cambios remotos del CRDT
- Performance: batch rendering, solo re-dibujar los strokes que cambiaron
```

---

# 10. ANTI-PATTERNS Y GUARDRAILS

> **INSTRUCCIÓN:** Si un agente de IA propone algo de esta lista, RECHAZA la propuesta y redirige al patrón correcto.

## NUNCA HACER (Hard Rules)

| # | Anti-Pattern | Por Qué | Hacer En Su Lugar |
|---|-------------|---------|-------------------|
| AP-1 | Usar `DateTime.now()` para sincronización de audio | Wall clock puede saltar (NTP updates, timezone changes) | Usar monotonic clock (Stopwatch, mach_absolute_time, System.nanoTime) |
| AP-2 | Enviar el archivo de audio completo por broadcast | Satura la red, bloquea mensajes de control | Transferencia punto-a-punto con chunks, en canal separado |
| AP-3 | Usar WebSocket/HTTP para comunicación P2P local | Requiere un servidor, agrega latencia, falla sin internet | Usar Nearby Connections / Multipeer Connectivity / WiFi Direct |
| AP-4 | Eliminar registros de la base de datos (hard delete) | Rompe sincronización CRDT, pierde historial | Soft delete con campo `deleted = true` |
| AP-5 | Implementar merge manual de anotaciones | Propenso a conflictos, reinventa la rueda | Usar Yjs CRDT que maneja merge automáticamente |
| AP-6 | Usar `setState` para state management | No escala, no testeable, no reactivo | Usar Riverpod providers |
| AP-7 | Hacer seek/jump audible para corregir drift | El usuario escucha un "click" o salto | Ajustar velocidad de reproducción ±0.1% gradualmente |
| AP-8 | Requerir internet para cualquier feature de ensayo | Los locales de ensayo frecuentemente no tienen WiFi confiable | Offline-first: todo funciona sin internet |
| AP-9 | Almacenar archivos con su nombre original | Colisiones de nombre, caracteres especiales | Usar SHA-256 hash como nombre de archivo |
| AP-10 | Usar Timer.periodic para sincronización de reloj | Timer de Dart no es preciso para sub-ms | Usar platform channel a APIs nativas de scheduling |
| AP-11 | Poner lógica de negocio en widgets | Acoplamiento, no testeable | Use cases en domain layer, providers como intermediarios |
| AP-12 | Usar `dynamic` types en Dart | Pierde type safety, errores en runtime | Definir tipos explícitos con freezed |
| AP-13 | Reproducir audio con `audioplayers` package | No ofrece precisión sub-ms ni scheduling avanzado | Platform channels a AVAudioEngine (iOS) / Oboe (Android) |
| AP-14 | Enviar el YDoc completo en cada sync | Desperdicio de bandwidth | Enviar solo Yjs updates incrementales (binary diff) |
| AP-15 | Usar SharedPreferences para datos estructurados | No relacional, sin queries, sin migraciones | Usar drift (SQLite) |

## PRECAUCIÓN (Soft Rules)

| # | Situación | Consejo |
|---|-----------|---------|
| SR-1 | Agregar un nuevo package | Justificar por qué es necesario, verificar mantenimiento activo, verificar que no duplique funcionalidad existente |
| SR-2 | Crear un nuevo Platform Channel | Verificar si el método puede agregarse a un canal existente en vez de crear uno nuevo |
| SR-3 | Agregar un campo a una entidad | Verificar si requiere migración de base de datos, actualizar el CRDT doc si aplica |
| SR-4 | Modificar el protocolo de mensajes P2P | Mantener backwards-compatibility, versionar el protocolo |
| SR-5 | Optimizar performance prematuramente | Medir primero, optimizar después. Profile con DevTools |

---

# 11. GLOSARIO TÉCNICO

| Término | Definición en el Contexto de SyncEnsemble |
|---------|-------------------------------------------|
| **Leader** | Dispositivo que actúa como master clock y controla la sesión. Creado por quien inicia la sesión. |
| **Follower** | Cualquier dispositivo que no es el leader. Sincroniza su reloj al leader. |
| **Session** | Unidad de trabajo que agrupa a N músicos, sus tracks, marcadores y anotaciones. Persiste entre ensayos. |
| **Track** | Un archivo de audio con su metadata, marcadores y partituras adjuntas. |
| **Marker** | Punto de interés en la línea de tiempo de un track. Puede ser compartido o personal. |
| **Score** | Partitura (PDF/imagen) adjunta a un track, con capa de anotaciones colaborativas. |
| **Monotonic Clock** | Reloj que solo avanza, nunca retrocede ni salta. Se usa para sincronización de audio. |
| **Offset** | Diferencia calibrada entre el reloj monótono del follower y el del leader, en nanosegundos. |
| **RTT** | Round-Trip Time: tiempo total que tarda un mensaje en ir y volver entre dos dispositivos. |
| **CRDT** | Conflict-free Replicated Data Type: estructura de datos que permite merge automático sin conflictos. |
| **Yjs** | Librería CRDT específica usada para las anotaciones colaborativas. |
| **Lamport Clock** | Reloj lógico que garantiza ordenamiento causal de eventos distribuidos. |
| **Tombstone** | Marcador de eliminación en un CRDT. El registro no se borra, se marca como `deleted=true`. |
| **Awareness** | Protocolo de Yjs para compartir estado efímero (posición del cursor, herramienta activa). |
| **Platform Channel** | Mecanismo de Flutter para invocar código nativo (Swift/Kotlin) desde Dart. |
| **Drift** | (database) Package de Dart para SQLite type-safe con generación de código. |
| **Drift** | (audio) Desviación gradual entre las posiciones de reproducción de dos dispositivos. |
| **Buffer Time** | 200ms de gracia entre el comando PLAY y el inicio real, para que todos los dispositivos se preparen. |
| **Waveform** | Representación visual de la amplitud del audio a lo largo del tiempo. |
| **P2P** | Peer-to-peer: comunicación directa entre dispositivos sin pasar por un servidor. |
| **mDNS** | Multicast DNS: protocolo para descubrir servicios en red local sin servidor DNS. |

---

# 12. CHECKLIST DE IMPLEMENTACIÓN (MVP)

Usa esta lista para trackear progreso. Cada item mapea a un prompt de tarea (T-XX).

## Fase 1: Fundación (Semanas 1-2)
- [ ] Setup proyecto Flutter con estructura de carpetas
- [ ] Configurar drift database con esquema inicial
- [ ] Implementar entidades de dominio (freezed)
- [ ] Configurar Riverpod
- [ ] Implementar Platform Channel skeleton (iOS + Android)

## Fase 2: Audio Engine (Semanas 3-4)
- [ ] T-02: Audio Platform Channel iOS (AVAudioEngine)
- [ ] Audio Platform Channel Android (Oboe)
- [ ] Dart AudioRepository implementation
- [ ] Waveform generation
- [ ] Basic playback UI (sin sync)

## Fase 3: Networking P2P (Semanas 5-6)
- [ ] Platform Channel para Nearby Connections (Android)
- [ ] Platform Channel para Multipeer Connectivity (iOS)
- [ ] Fallback WiFi LAN + mDNS
- [ ] T-01: ClockSyncService
- [ ] Protocolo de mensajes básico

## Fase 4: Sesión + Sync (Semanas 7-8)
- [ ] Session management (crear, unirse, cerrar)
- [ ] T-03: RehearsalScreen UI
- [ ] Synchronized playback (PLAY/PAUSE/SEEK)
- [ ] Position drift correction
- [ ] File transfer P2P

## Fase 5: Marcadores (Semanas 9-10)
- [ ] MarkerRepository implementation
- [ ] Marker UI on waveform
- [ ] Marker sync via P2P
- [ ] Marker persistence

## Fase 6: Testing + Polish (Semanas 11-12)
- [ ] Unit tests para ClockSync (≥95% coverage)
- [ ] Unit tests para domain layer (≥90%)
- [ ] Widget tests para RehearsalScreen
- [ ] Integration test: flujo completo de ensayo
- [ ] Performance profiling
- [ ] Bug fixing

---

# FIN DEL AI DEVELOPMENT KIT v1.0

**Para usar este kit:**
1. Abre una nueva conversación con tu agente de IA favorito
2. Pega el MASTER SYSTEM PROMPT (sección 1)
3. Agrega el SYSTEM PROMPT del agente específico que necesitas (sección 2)
4. Dale la tarea usando los PROMPTS ESPECÍFICOS (sección 9) o escribe tu propia tarea
5. Si el agente propone algo listado en ANTI-PATTERNS (sección 10), rechaza y redirige
6. Valida contra CRITERIOS DE ACEPTACIÓN (sección 8)

**Recuerda:** Este documento es la fuente de verdad. Si un agente contradice algo de aquí, el documento gana.
