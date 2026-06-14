# SYNCENSEMBLE — AI DEVELOPMENT KIT v2.0
## Especificación Técnica: Anotaciones Colaborativas en Partituras + Marcadores Compartidos
## Stack: React + Firebase + Netlify

**Autor:** Omar Suniaga  
**Fecha:** Abril 2026  
**Stack:** React 18+ · TypeScript · Firebase (Firestore + Storage + Auth) · Netlify · Yjs + y-fire  
**Enfoque:** Este documento se concentra exclusivamente en dos sistemas técnicos:
1. **Score Annotation Layer** — Dibujar sobre PDFs/imágenes de partituras con sincronización colaborativa en tiempo real
2. **Shared Timeline Markers** — Marcadores de texto posicionados en zonas específicas del audio, compartidos entre dispositivos

---

# TABLA DE CONTENIDOS

1. [STACK TECNOLÓGICO CONFIRMADO](#1-stack-tecnológico-confirmado)
2. [SISTEMA 1: SCORE ANNOTATION LAYER](#2-sistema-1-score-annotation-layer)
3. [SISTEMA 2: SHARED TIMELINE MARKERS](#3-sistema-2-shared-timeline-markers)
4. [MODELO DE DATOS FIREBASE](#4-modelo-de-datos-firebase)
5. [ARQUITECTURA DE COMPONENTES REACT](#5-arquitectura-de-componentes-react)
6. [MASTER SYSTEM PROMPT v2](#6-master-system-prompt-v2)
7. [AGENTES ESPECIALIZADOS v2](#7-agentes-especializados-v2)
8. [PROMPTS DE TAREA ESPECÍFICOS](#8-prompts-de-tarea-específicos)
9. [CONTRATOS DE INTERFAZ (TypeScript)](#9-contratos-de-interfaz-typescript)
10. [ANTI-PATTERNS v2](#10-anti-patterns-v2)
11. [CRITERIOS DE ACEPTACIÓN](#11-criterios-de-aceptación)
12. [FLUJOS DE USUARIO DETALLADOS](#12-flujos-de-usuario-detallados)

---

# 1. STACK TECNOLÓGICO CONFIRMADO

| Componente | Tecnología | Versión | Propósito |
|-----------|-----------|---------|----------|
| UI Framework | React | 18.x+ | Interfaz de usuario |
| Lenguaje | TypeScript | 5.x | Type safety estricto |
| Build/Deploy | Vite + Netlify | Latest | Build rápido, deploy automático |
| Auth | Firebase Auth | v9+ modular | Autenticación de usuarios |
| Database | Firestore | v9+ modular | Persistencia de sesiones, tracks, metadata |
| File Storage | Firebase Storage | v9+ modular | Archivos de audio y partituras |
| CRDT Engine | Yjs | 13.x | Sincronización de anotaciones sin conflictos |
| CRDT ↔ Firebase | y-fire | Latest | Provider Yjs que persiste en Firestore |
| PDF Rendering | react-pdf (wojtekmaj) + PDF.js | 10.x | Renderizar páginas de PDF en canvas |
| Drawing Canvas | HTML5 Canvas API (nativo) | — | Capa de dibujo sobre el PDF |
| State Management | Zustand o Jotai | Latest | Estado global ligero |
| Styling | Tailwind CSS | 3.x | Estilos utilitarios |
| Audio Player | Howler.js o HTML5 Audio API | Latest | Reproducción de audio |

### Decisión Arquitectónica Clave: ¿Por qué NO modificar el PDF?

**NUNCA se modifica el PDF original.** Las anotaciones son una capa de vectores almacenada de forma independiente en un documento CRDT (Yjs → Firestore). El PDF se renderiza como imagen estática en un `<canvas>`, y sobre él se superpone un segundo `<canvas>` transparente donde ocurre todo el dibujo. Esto tiene estas ventajas:

1. **Performance:** No re-generar PDFs cada vez que alguien dibuja un trazo
2. **Colaboración:** Los vectores se sincronizan como datos estructurados, no como archivos binarios
3. **Reversibilidad:** Se puede volver a la partitura limpia en cualquier momento
4. **Independencia:** El mismo sistema funciona para PDFs e imágenes (PNG/JPG)
5. **Offline:** Los vectores se pueden cachear localmente sin necesidad de re-descargar el PDF

---

# 2. SISTEMA 1: SCORE ANNOTATION LAYER

## 2.1 Concepto: El Modelo de Capas

```
┌─────────────────────────────────────────────────────┐
│                   CAPA 5: UI Controls               │  ← Toolbar, zoom, page nav
│                   (React components)                │
├─────────────────────────────────────────────────────┤
│                   CAPA 4: Cursor Layer              │  ← Cursores de otros usuarios
│                   (CSS positioned divs)             │     (awareness protocol)
├─────────────────────────────────────────────────────┤
│                   CAPA 3: Drawing Canvas            │  ← AQUÍ OCURRE EL DIBUJO
│                   (HTML5 Canvas, transparent)       │     Strokes, texto, símbolos
├─────────────────────────────────────────────────────┤
│                   CAPA 2: Text Layer                │  ← Selección de texto del PDF
│                   (PDF.js text layer, optional)     │     (opcional en partituras)
├─────────────────────────────────────────────────────┤
│                   CAPA 1: PDF/Image Render          │  ← Partitura renderizada
│                   (PDF.js canvas o <img>)           │     Solo lectura, nunca se modifica
└─────────────────────────────────────────────────────┘
```

**Principio fundamental:** Las capas 1 y 2 son de solo lectura. Toda la interacción del usuario ocurre en las capas 3-5. La capa 3 (Drawing Canvas) es la que se sincroniza via CRDT.

## 2.2 Cómo Funciona el Dibujo Técnicamente

### 2.2.1 Coordenadas Normalizadas (0-1)

**CRÍTICO:** Todos los puntos de dibujo se almacenan en coordenadas normalizadas (0 a 1), NO en píxeles. Esto garantiza que las anotaciones se vean correctamente en cualquier resolución, zoom, o tamaño de pantalla.

```typescript
// Cuando el usuario toca la pantalla:
const canvasRect = canvas.getBoundingClientRect();
const rawX = event.clientX - canvasRect.left;  // Píxeles
const rawY = event.clientY - canvasRect.top;   // Píxeles

// NORMALIZAR a 0-1:
const normalizedX = rawX / canvasRect.width;   // 0.0 a 1.0
const normalizedY = rawY / canvasRect.height;  // 0.0 a 1.0

// Cuando se renderiza en otro dispositivo con diferente resolución:
const renderX = normalizedX * otherCanvas.width;   // Se adapta automáticamente
const renderY = normalizedY * otherCanvas.height;
```

### 2.2.2 Estructura de un Stroke (Trazo)

Cada trazo que dibuja un usuario se compone de:

```typescript
interface Stroke {
  id: string;                    // UUID v4 (generado localmente)
  scoreId: string;               // ID de la partitura
  page: number;                  // Página del PDF (0-indexed)
  authorId: string;              // Firebase Auth UID
  authorName: string;            // Display name
  color: string;                 // Hex color asignado al usuario (#3B82F6)
  type: 'freehand' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'text' | 'symbol';
  
  // Para freehand:
  points: Array<{
    x: number;                   // 0.0 a 1.0 (normalizado)
    y: number;                   // 0.0 a 1.0 (normalizado)
    pressure: number;            // 0.0 a 1.0 (presión del stylus, 0.5 si no hay stylus)
  }>;
  
  // Para texto:
  textContent?: string;          // El texto escrito
  fontSize?: number;             // Tamaño relativo (0.01 a 0.1 del height)
  position?: { x: number; y: number };  // Posición normalizada
  
  // Para symbol (símbolos musicales predefinidos):
  symbolType?: 'crescendo' | 'decrescendo' | 'accent' | 'fermata' 
    | 'arco_up' | 'arco_down' | 'pizz' | 'forte' | 'piano' 
    | 'sforzando' | 'staccato' | 'tenuto' | 'trill' | 'mordent'
    | 'turn' | 'breath_mark' | 'caesura' | 'coda' | 'segno'
    | 'dal_segno' | 'da_capo' | 'repeat_sign';
  symbolPosition?: { x: number; y: number };
  symbolScale?: number;          // 0.5 a 2.0 (tamaño relativo)
  
  // Para formas geométricas (line, arrow, rect, ellipse):
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  
  // Metadata:
  strokeWidth: number;           // Grosor relativo (0.001 a 0.01 del width)
  opacity: number;               // 0.0 a 1.0
  createdAt: number;             // Epoch milliseconds
  deleted: boolean;              // Tombstone para soft-delete
}
```

### 2.2.3 Flujo Completo: Del Dedo al Otro Dispositivo

```
DISPOSITIVO A (Omar dibuja "rit." sobre compás 24)
═══════════════════════════════════════════════════

[1] TOUCH START
    │ Captura evento pointer/touch
    │ Calcula coordenadas normalizadas
    │ Crea nuevo Stroke con ID único
    │ Inicia acumulación de puntos
    │
[2] TOUCH MOVE (cada ~16ms, throttled)
    │ Acumula punto {x, y, pressure}
    │ Renderiza en canvas LOCAL inmediatamente (optimistic)
    │ NO espera a sync — el usuario ve su trazo sin latencia
    │
[3] TOUCH END
    │ Finaliza el stroke
    │ Escribe el stroke completo al YDoc (Yjs)
    │
[4] Yjs detecta cambio en YDoc
    │ y-fire genera un update incremental (binary diff ~100-500 bytes)
    │ y-fire escribe el update en Firestore (batch write)
    │
[5] Firestore propaga el update via onSnapshot listener
    │
    ▼
DISPOSITIVO B (Kalani ve el "rit." aparecer)
═══════════════════════════════════════════════════

[6] y-fire recibe update de Firestore via onSnapshot
    │ Aplica update al YDoc local (merge automático CRDT)
    │
[7] YDoc emite evento 'update'
    │ React re-renderiza el canvas de anotaciones
    │
[8] El canvas dibuja TODOS los strokes del YDoc:
    │ - Los de Omar en AZUL
    │ - Los de Kalani en VERDE
    │ - Los del tercer músico en NARANJA
    │
[9] Kalani ve "rit." en azul sobre el compás 24
    │ Latencia total: ~100-300ms (Firestore roundtrip)
```

### 2.2.4 Algoritmo de Renderizado del Canvas

```typescript
function renderAnnotations(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  canvasWidth: number,
  canvasHeight: number,
  visibleAuthors: Set<string>,  // Para filtrar por usuario
  currentPage: number
) {
  // 1. Limpiar canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // 2. Filtrar strokes: solo página actual, no eliminados, autores visibles
  const visibleStrokes = strokes.filter(s => 
    s.page === currentPage && 
    !s.deleted && 
    visibleAuthors.has(s.authorId)
  );
  
  // 3. Ordenar por timestamp de creación (mantiene orden visual consistente)
  visibleStrokes.sort((a, b) => a.createdAt - b.createdAt);
  
  // 4. Dibujar cada stroke
  for (const stroke of visibleStrokes) {
    ctx.save();
    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.strokeWidth * canvasWidth; // Denormalizar grosor
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    switch (stroke.type) {
      case 'freehand':
        renderFreehand(ctx, stroke.points, canvasWidth, canvasHeight);
        break;
      case 'text':
        renderText(ctx, stroke, canvasWidth, canvasHeight);
        break;
      case 'symbol':
        renderSymbol(ctx, stroke, canvasWidth, canvasHeight);
        break;
      case 'line':
      case 'arrow':
        renderLine(ctx, stroke, canvasWidth, canvasHeight);
        break;
      case 'rect':
      case 'ellipse':
        renderShape(ctx, stroke, canvasWidth, canvasHeight);
        break;
    }
    
    ctx.restore();
  }
}

function renderFreehand(
  ctx: CanvasRenderingContext2D,
  points: Array<{x: number; y: number; pressure: number}>,
  w: number, h: number
) {
  if (points.length < 2) return;
  
  ctx.beginPath();
  
  // Primer punto
  ctx.moveTo(points[0].x * w, points[0].y * h);
  
  // Interpolación cuadrática para suavizar el trazo
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x * w + points[i + 1].x * w) / 2;
    const yc = (points[i].y * h + points[i + 1].y * h) / 2;
    
    // Ajustar grosor según presión del stylus
    ctx.lineWidth = ctx.lineWidth * points[i].pressure;
    
    ctx.quadraticCurveTo(
      points[i].x * w,
      points[i].y * h,
      xc, yc
    );
  }
  
  // Último punto
  const last = points[points.length - 1];
  ctx.lineTo(last.x * w, last.y * h);
  ctx.stroke();
}
```

## 2.3 Sincronización CRDT con Yjs + y-fire + Firestore

### 2.3.1 Estructura del Documento Yjs

```typescript
import * as Y from 'yjs';
import { FireProvider } from 'y-fire';
import { initializeApp } from 'firebase/app';

// ══════════════════════════════════════════
// Inicialización del YDoc para una partitura
// ══════════════════════════════════════════

function createScoreCollaborationDoc(
  firebaseApp: FirebaseApp,
  scoreId: string,
  userId: string,
  userName: string,
  userColor: string
) {
  const ydoc = new Y.Doc();
  
  // ── Estructura del YDoc ──
  
  // YMap de strokes: cada key es el stroke ID, value es un YMap con los datos
  const yStrokes: Y.Map<Y.Map<any>> = ydoc.getMap('strokes');
  
  // YMap de metadata de la partitura (título, páginas, etc.)
  const yMeta: Y.Map<any> = ydoc.getMap('meta');
  
  // ── Provider de Firebase ──
  // y-fire sincroniza el YDoc con Firestore automáticamente
  const provider = new FireProvider({
    firebaseApp,
    ydoc,
    path: `scores/${scoreId}/crdt`,  // Path en Firestore
    maxUpdatesThreshold: 20,          // Batch updates para eficiencia
    maxWaitTime: 100,                 // ms antes de flush
    maxWaitFirestoreTime: 3000,       // ms antes de persist a Firestore
  });
  
  // ── Awareness (cursores y presencia) ──
  // Awareness es efímero: NO se persiste en Firestore
  // Solo se comparte mientras los usuarios están conectados
  provider.awareness.setLocalState({
    user: {
      id: userId,
      name: userName,
      color: userColor,
    },
    cursor: null,          // Se actualiza cuando el usuario mueve el mouse
    activeTool: 'pen',     // pen | text | eraser | select | symbol
    currentPage: 0,
  });
  
  return { ydoc, provider, yStrokes, yMeta };
}
```

### 2.3.2 Operaciones CRUD sobre Strokes en el YDoc

```typescript
// ══════════════════════════════════════════
// AGREGAR un stroke
// ══════════════════════════════════════════
function addStroke(yStrokes: Y.Map<Y.Map<any>>, stroke: Stroke) {
  const yStroke = new Y.Map();
  
  // Transacción Yjs: todas las escrituras son atómicas
  yStrokes.doc!.transact(() => {
    yStroke.set('id', stroke.id);
    yStroke.set('scoreId', stroke.scoreId);
    yStroke.set('page', stroke.page);
    yStroke.set('authorId', stroke.authorId);
    yStroke.set('authorName', stroke.authorName);
    yStroke.set('color', stroke.color);
    yStroke.set('type', stroke.type);
    yStroke.set('strokeWidth', stroke.strokeWidth);
    yStroke.set('opacity', stroke.opacity);
    yStroke.set('createdAt', stroke.createdAt);
    yStroke.set('deleted', false);
    
    // Points se almacena como JSON string para eficiencia
    // (YArray de YMaps sería más correcto pero mucho más pesado)
    if (stroke.points) {
      yStroke.set('points', JSON.stringify(stroke.points));
    }
    if (stroke.textContent) {
      yStroke.set('textContent', stroke.textContent);
      yStroke.set('fontSize', stroke.fontSize);
      yStroke.set('position', JSON.stringify(stroke.position));
    }
    if (stroke.symbolType) {
      yStroke.set('symbolType', stroke.symbolType);
      yStroke.set('symbolPosition', JSON.stringify(stroke.symbolPosition));
      yStroke.set('symbolScale', stroke.symbolScale);
    }
    if (stroke.startPoint) {
      yStroke.set('startPoint', JSON.stringify(stroke.startPoint));
      yStroke.set('endPoint', JSON.stringify(stroke.endPoint));
    }
    
    yStrokes.set(stroke.id, yStroke);
  });
}

// ══════════════════════════════════════════
// ELIMINAR un stroke (soft-delete via tombstone)
// ══════════════════════════════════════════
function deleteStroke(yStrokes: Y.Map<Y.Map<any>>, strokeId: string) {
  const yStroke = yStrokes.get(strokeId);
  if (yStroke) {
    yStroke.set('deleted', true);
    // NUNCA hacer yStrokes.delete(strokeId) — rompe CRDT merge
  }
}

// ══════════════════════════════════════════
// LEER todos los strokes (para renderizar)
// ══════════════════════════════════════════
function getAllStrokes(yStrokes: Y.Map<Y.Map<any>>): Stroke[] {
  const strokes: Stroke[] = [];
  
  yStrokes.forEach((yStroke, id) => {
    const pointsStr = yStroke.get('points');
    const positionStr = yStroke.get('position');
    const symbolPosStr = yStroke.get('symbolPosition');
    const startStr = yStroke.get('startPoint');
    const endStr = yStroke.get('endPoint');
    
    strokes.push({
      id: yStroke.get('id'),
      scoreId: yStroke.get('scoreId'),
      page: yStroke.get('page'),
      authorId: yStroke.get('authorId'),
      authorName: yStroke.get('authorName'),
      color: yStroke.get('color'),
      type: yStroke.get('type'),
      points: pointsStr ? JSON.parse(pointsStr) : undefined,
      textContent: yStroke.get('textContent'),
      fontSize: yStroke.get('fontSize'),
      position: positionStr ? JSON.parse(positionStr) : undefined,
      symbolType: yStroke.get('symbolType'),
      symbolPosition: symbolPosStr ? JSON.parse(symbolPosStr) : undefined,
      symbolScale: yStroke.get('symbolScale'),
      startPoint: startStr ? JSON.parse(startStr) : undefined,
      endPoint: endStr ? JSON.parse(endStr) : undefined,
      strokeWidth: yStroke.get('strokeWidth'),
      opacity: yStroke.get('opacity'),
      createdAt: yStroke.get('createdAt'),
      deleted: yStroke.get('deleted') || false,
    });
  });
  
  return strokes;
}

// ══════════════════════════════════════════
// OBSERVAR cambios (para re-renderizar el canvas)
// ══════════════════════════════════════════
function observeStrokes(
  yStrokes: Y.Map<Y.Map<any>>,
  callback: (strokes: Stroke[]) => void
) {
  // Deep observe: detecta cambios en los YMaps internos también
  yStrokes.observeDeep((events) => {
    callback(getAllStrokes(yStrokes));
  });
}
```

### 2.3.3 Undo/Redo Per-User

```typescript
import { UndoManager } from 'yjs';

// El UndoManager trackea solo los cambios del usuario local
const undoManager = new UndoManager(yStrokes, {
  // Solo trackear cambios hechos por este usuario
  trackedOrigins: new Set([ydoc.clientID]),
  // Agrupar cambios que ocurren dentro de 500ms como una sola operación
  captureTimeout: 500,
});

// Undo: deshace el último stroke del usuario actual
// NO afecta los strokes de otros usuarios
undoManager.undo();

// Redo: rehace lo deshecho
undoManager.redo();

// Verificar si hay operaciones disponibles
undoManager.canUndo();  // boolean
undoManager.canRedo();  // boolean
```

## 2.4 Persistencia: Cómo se Guarda en Firestore

### 2.4.1 Estructura en Firestore

```
firestore/
├── sessions/
│   └── {sessionId}/
│       ├── name: "KALIOM Repertorio Hotel"
│       ├── leaderId: "uid_omar"
│       ├── status: "active"
│       ├── members: { uid_omar: {...}, uid_kalani: {...} }
│       └── tracks/
│           └── {trackId}/
│               ├── title: "Bésame Mucho"
│               ├── composer: "Consuelo Velázquez"
│               ├── audioUrl: "gs://bucket/audio/{hash}.mp3"
│               ├── durationMs: 272000
│               └── scores/
│                   └── {scoreId}/
│                       ├── partName: "Violín 1"
│                       ├── fileUrl: "gs://bucket/scores/{hash}.pdf"
│                       ├── pageCount: 3
│                       └── crdt/          ← y-fire escribe aquí
│                           ├── updates/   ← Yjs binary updates
│                           │   ├── 0: { data: Uint8Array, ... }
│                           │   ├── 1: { data: Uint8Array, ... }
│                           │   └── ...
│                           └── meta/
│                               └── clock: 42 (Lamport counter)
│
├── tracks/                    ← Índice global de tracks (biblioteca)
│   └── {trackId}/
│       ├── title, composer, arranger, tempo, key...
│       ├── audioUrl
│       ├── durationMs
│       └── markers/           ← Sub-colección de marcadores
│           └── {markerId}/
│               ├── positionMs: 92000
│               ├── label: "Revisar afinación"
│               ├── note: "El cello entra medio tono abajo"
│               ├── category: "intonation"
│               ├── shared: true
│               ├── authorId: "uid_kalani"
│               ├── authorName: "Kalani"
│               ├── createdAt: Timestamp
│               └── deleted: false
│
└── users/
    └── {uid}/
        ├── displayName: "Omar"
        ├── instrument: "Violín"
        ├── color: "#3B82F6"
        └── createdAt: Timestamp
```

### 2.4.2 Por Qué y-fire y No Firestore Directo para Anotaciones

| Aspecto | Firestore Directo | Yjs + y-fire |
|---------|------------------|-------------|
| Conflictos simultáneos | Posibles (last-write-wins) | Imposibles (CRDT merge) |
| Offline support | Limitado (Firestore cache) | Completo (Yjs almacena localmente) |
| Granularidad de sync | Documento completo | Solo diffs incrementales (~100 bytes) |
| Merge al reconectar | Manual (propenso a bugs) | Automático (CRDT garantizado) |
| Undo/Redo | Hay que implementar desde cero | Built-in con UndoManager |
| Awareness (cursores) | Hay que implementar con realtime DB | Built-in con Yjs awareness |
| Bandwidth | Alto (re-envía todo) | Bajo (solo cambios) |

**Los marcadores SÍ usan Firestore directo** (no CRDT) porque son operaciones discretas (add/edit/delete) que no tienen el problema de edición simultánea en el mismo dato.

---

# 3. SISTEMA 2: SHARED TIMELINE MARKERS

## 3.1 Concepto

Un marcador es un punto de interés en la línea de tiempo del audio, visible como un indicador vertical sobre el waveform con una etiqueta de texto. Los marcadores pueden ser compartidos (todos los ven) o personales (solo el autor los ve).

```
Waveform del audio:
──────────────────────────────────────────────────────────
▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁
──────────────────────────────────────────────────────────
     │              │                    │
     ▼              ▼                    ▼
  ┌──────┐    ┌──────────┐        ┌────────────┐
  │Intro │    │Rev. afin.│        │Corte final │
  │Omar  │    │ Kalani   │        │  Omar      │
  │🔵    │    │ 🟢       │        │  🔵        │
  └──────┘    └──────────┘        └────────────┘
```

## 3.2 Modelo de Datos del Marcador

```typescript
interface Marker {
  id: string;                     // UUID v4
  trackId: string;                // Track al que pertenece
  positionMs: number;             // Posición en milisegundos
  label: string;                  // Etiqueta corta (máx 50 chars)
  note: string | null;            // Nota extendida (opcional)
  category: MarkerCategory;
  shared: boolean;                // true = todos lo ven, false = solo el autor
  authorId: string;               // Firebase Auth UID
  authorName: string;
  authorColor: string;            // Color hex del autor
  createdAt: Timestamp;           // Firebase Timestamp
  updatedAt: Timestamp | null;
  deleted: boolean;               // Soft-delete
}

type MarkerCategory = 
  | 'dynamics'      // f, p, crescendo, etc.
  | 'rhythm'        // Subdivisión, tempo, rubato
  | 'intonation'    // Afinación, intervalos
  | 'form'          // Estructura: intro, A, B, coda
  | 'articulation'  // Staccato, legato, marcato
  | 'rehearsal'     // Notas de ensayo genéricas
  | 'free';         // Sin categoría
```

## 3.3 Sincronización de Marcadores via Firestore

A diferencia de las anotaciones de partitura (que usan CRDT), los marcadores usan **Firestore directo con onSnapshot listeners**. Esto es suficiente porque:

1. Los marcadores son operaciones atómicas (un usuario agrega UN marcador)
2. No hay edición simultánea del mismo marcador
3. Firestore maneja bien las writes concurrentes a diferentes documentos
4. El listener onSnapshot propaga cambios en ~100-500ms

```typescript
import { 
  collection, doc, addDoc, updateDoc, onSnapshot, 
  query, where, orderBy, Timestamp 
} from 'firebase/firestore';

// ══════════════════════════════════════════
// AGREGAR marcador
// ══════════════════════════════════════════
async function addMarker(
  db: Firestore,
  trackId: string,
  marker: Omit<Marker, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const markersRef = collection(db, 'tracks', trackId, 'markers');
  const docRef = await addDoc(markersRef, {
    ...marker,
    createdAt: Timestamp.now(),
    updatedAt: null,
    deleted: false,
  });
  return docRef.id;
}

// ══════════════════════════════════════════
// ACTUALIZAR marcador
// ══════════════════════════════════════════
async function updateMarker(
  db: Firestore,
  trackId: string,
  markerId: string,
  updates: Partial<Pick<Marker, 'label' | 'note' | 'category' | 'positionMs'>>
): Promise<void> {
  const markerRef = doc(db, 'tracks', trackId, 'markers', markerId);
  await updateDoc(markerRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// ══════════════════════════════════════════
// ELIMINAR marcador (soft-delete)
// ══════════════════════════════════════════
async function deleteMarker(
  db: Firestore,
  trackId: string,
  markerId: string
): Promise<void> {
  const markerRef = doc(db, 'tracks', trackId, 'markers', markerId);
  await updateDoc(markerRef, {
    deleted: true,
    updatedAt: Timestamp.now(),
  });
}

// ══════════════════════════════════════════
// ESCUCHAR marcadores en tiempo real
// ══════════════════════════════════════════
function subscribeToMarkers(
  db: Firestore,
  trackId: string,
  currentUserId: string,
  callback: (markers: Marker[]) => void
): () => void {
  const markersRef = collection(db, 'tracks', trackId, 'markers');
  
  // Query: marcadores no eliminados, que sean compartidos O del usuario actual
  const q = query(
    markersRef,
    where('deleted', '==', false),
    orderBy('positionMs', 'asc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const markers: Marker[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Marker;
      // Filtrar: mostrar compartidos + propios
      if (data.shared || data.authorId === currentUserId) {
        markers.push({ ...data, id: doc.id });
      }
    });
    callback(markers);
  });
  
  return unsubscribe;  // Llamar para desuscribirse
}
```

## 3.4 Interacción del Marcador con el Waveform

```typescript
// ══════════════════════════════════════════
// Renderizar marcadores sobre el waveform
// ══════════════════════════════════════════
function renderMarkersOnWaveform(
  ctx: CanvasRenderingContext2D,
  markers: Marker[],
  canvasWidth: number,
  canvasHeight: number,
  audioDurationMs: number,
  viewStartMs: number,        // Si el waveform está en zoom
  viewEndMs: number
) {
  const visibleMarkers = markers.filter(m => 
    m.positionMs >= viewStartMs && m.positionMs <= viewEndMs
  );
  
  for (const marker of visibleMarkers) {
    // Calcular posición X proporcional
    const progress = (marker.positionMs - viewStartMs) / (viewEndMs - viewStartMs);
    const x = progress * canvasWidth;
    
    // Línea vertical
    ctx.beginPath();
    ctx.strokeStyle = marker.authorColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);  // Línea punteada
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Chip de etiqueta arriba
    const chipHeight = 20;
    const chipPadding = 6;
    const textWidth = ctx.measureText(marker.label).width;
    const chipWidth = textWidth + chipPadding * 2;
    
    // Background del chip
    ctx.fillStyle = marker.authorColor;
    ctx.beginPath();
    ctx.roundRect(x - chipWidth / 2, 2, chipWidth, chipHeight, 4);
    ctx.fill();
    
    // Texto del chip
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(marker.label, x, 16);
  }
}

// ══════════════════════════════════════════
// Detectar click en un marcador (para seek)
// ══════════════════════════════════════════
function findMarkerAtPosition(
  clickX: number,
  canvasWidth: number,
  markers: Marker[],
  audioDurationMs: number,
  viewStartMs: number,
  viewEndMs: number,
  hitRadius: number = 10  // Píxeles de tolerancia
): Marker | null {
  for (const marker of markers) {
    const progress = (marker.positionMs - viewStartMs) / (viewEndMs - viewStartMs);
    const markerX = progress * canvasWidth;
    
    if (Math.abs(clickX - markerX) <= hitRadius) {
      return marker;
    }
  }
  return null;
}
```

---

# 4. MODELO DE DATOS FIREBASE (Completo)

## 4.1 Reglas de Seguridad de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios autenticados pueden leer/escribir su perfil
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    
    // Sesiones: cualquier miembro puede leer, solo leader puede modificar sesión
    match /sessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.leaderId;
      
      // Tracks dentro de sesión
      match /tracks/{trackId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
        
        // Scores dentro de tracks
        match /scores/{scoreId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null;
          
          // CRDT data (y-fire escribe aquí)
          match /crdt/{document=**} {
            allow read, write: if request.auth != null;
          }
        }
      }
    }
    
    // Tracks globales (biblioteca)
    match /tracks/{trackId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      
      // Marcadores
      match /markers/{markerId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        // Solo el autor puede editar/eliminar su marcador
        allow update: if request.auth != null 
          && request.auth.uid == resource.data.authorId;
      }
    }
  }
}
```

---

# 5. ARQUITECTURA DE COMPONENTES REACT

```
src/
├── components/
│   ├── ScoreViewer/                    ← SISTEMA 1: Partitura colaborativa
│   │   ├── ScoreViewer.tsx             ← Componente principal
│   │   ├── PDFRenderer.tsx             ← Capa 1: renderiza PDF con react-pdf
│   │   ├── DrawingCanvas.tsx           ← Capa 3: canvas de dibujo
│   │   ├── CursorOverlay.tsx           ← Capa 4: cursores de otros usuarios
│   │   ├── AnnotationToolbar.tsx       ← Capa 5: herramientas de dibujo
│   │   ├── SymbolPicker.tsx            ← Picker de símbolos musicales
│   │   ├── AuthorFilter.tsx            ← Mostrar/ocultar anotaciones por autor
│   │   ├── hooks/
│   │   │   ├── useScoreCRDT.ts         ← Hook: conecta Yjs + y-fire para una partitura
│   │   │   ├── useDrawing.ts           ← Hook: lógica de dibujo (pointer events → strokes)
│   │   │   ├── useAwareness.ts         ← Hook: cursores y presencia de otros usuarios
│   │   │   └── useUndoRedo.ts          ← Hook: undo/redo con UndoManager de Yjs
│   │   └── utils/
│   │       ├── renderStrokes.ts        ← Algoritmo de renderizado del canvas
│   │       ├── normalizeCoords.ts      ← Helpers de coordenadas normalizadas
│   │       └── symbolSVGs.ts           ← SVG paths de símbolos musicales
│   │
│   ├── AudioPlayer/                    ← Reproductor de audio
│   │   ├── AudioPlayer.tsx             ← Componente principal
│   │   ├── WaveformDisplay.tsx         ← Canvas del waveform
│   │   ├── TransportControls.tsx       ← Play/Pause/Stop/Seek
│   │   ├── MarkerChip.tsx              ← Chip visual de un marcador
│   │   ├── MarkerEditor.tsx            ← Modal/popover para editar marcador
│   │   ├── hooks/
│   │   │   ├── useAudioPlayer.ts       ← Hook: Howler.js wrapper
│   │   │   ├── useMarkers.ts           ← Hook: Firestore CRUD + listener de marcadores
│   │   │   └── useWaveform.ts          ← Hook: generación de datos de waveform
│   │   └── utils/
│   │       ├── renderWaveform.ts       ← Algoritmo de renderizado del waveform
│   │       └── renderMarkers.ts        ← Renderizar marcadores sobre el waveform
│   │
│   ├── Session/
│   │   ├── SessionLobby.tsx
│   │   ├── MemberList.tsx
│   │   └── hooks/
│   │       └── useSession.ts
│   │
│   └── Library/
│       ├── TrackList.tsx
│       └── TrackCard.tsx
│
├── services/
│   ├── firebase.ts                     ← Firebase init + exports
│   ├── auth.ts                         ← Auth helpers
│   ├── firestore.ts                    ← Firestore helpers genéricos
│   ├── storage.ts                      ← Firebase Storage (upload/download archivos)
│   └── crdt.ts                         ← Factory de YDocs + providers
│
├── stores/
│   ├── sessionStore.ts                 ← Zustand: estado de sesión activa
│   ├── playerStore.ts                  ← Zustand: estado del reproductor
│   └── uiStore.ts                      ← Zustand: estado de UI (tema, sidebar, etc.)
│
├── types/
│   ├── stroke.ts                       ← Tipos de Stroke
│   ├── marker.ts                       ← Tipos de Marker
│   ├── session.ts                      ← Tipos de Session
│   ├── track.ts                        ← Tipos de Track
│   └── score.ts                        ← Tipos de Score
│
└── utils/
    ├── colors.ts                       ← Paleta de colores para usuarios
    ├── uuid.ts                         ← Generador de UUID
    └── time.ts                         ← Formateo de tiempos (ms → mm:ss)
```

---

# 6. MASTER SYSTEM PROMPT v2

```
Eres un ingeniero senior trabajando en SyncEnsemble, una aplicación web para ensayo musical colaborativo. Tu rol es escribir código de producción en React + TypeScript + Firebase.

## CONTEXTO DEL PRODUCTO

SyncEnsemble permite que 2-8 músicos ensayen juntos con:
1. Partituras colaborativas: PDFs/imágenes con anotaciones en tiempo real (dibujo libre, texto, símbolos musicales), cada usuario con un color. Las anotaciones se sincronizan via CRDT (Yjs + y-fire → Firestore).
2. Marcadores compartidos: puntos de interés en la línea de tiempo del audio, con etiqueta, nota, y categoría. Se sincronizan via Firestore onSnapshot.
3. Reproductor de audio sincronizado con waveform visual.

## STACK TECNOLÓGICO (NO NEGOCIABLE)

- React 18+ con TypeScript estricto
- Vite como bundler
- Firebase: Auth + Firestore + Storage (modular SDK v9+)
- Yjs 13.x como CRDT engine
- y-fire como provider Yjs → Firestore
- react-pdf (wojtekmaj) para renderizar PDFs
- HTML5 Canvas API para la capa de dibujo
- Zustand para state management global
- Howler.js para reproducción de audio
- Tailwind CSS para estilos
- Netlify para deploy

## PRINCIPIOS ARQUITECTÓNICOS (NO NEGOCIABLE)

1. LAS ANOTACIONES NUNCA MODIFICAN EL PDF. Son una capa de vectores independiente almacenada en un YDoc (CRDT). El PDF se renderiza como imagen estática.
2. COORDENADAS NORMALIZADAS (0-1). Todos los puntos de dibujo se almacenan normalizados para que funcionen en cualquier resolución/zoom.
3. SOFT-DELETE SIEMPRE. Nunca eliminar datos del CRDT ni de Firestore. Marcar como deleted=true.
4. OPTIMISTIC UI. El usuario ve sus cambios inmediatamente; la sincronización ocurre en background.
5. OFFLINE-CAPABLE. Yjs y Firestore tienen cache local. La app debe funcionar sin internet y sincronizar cuando vuelva la conexión.

## ESTRUCTURA DEL PROYECTO
[ver sección 5 del dev kit]

## REGLAS DE CÓDIGO

1. TypeScript estricto: no any, no as casting innecesario, no !
2. Componentes funcionales con hooks, nunca clases
3. Custom hooks para toda lógica reutilizable (prefijo use)
4. Zustand stores para estado global, useState para estado local de UI
5. Firestore queries SIEMPRE con onSnapshot para real-time
6. Yjs: SIEMPRE usar transact() para writes atómicos
7. Canvas: SIEMPRE limpiar con clearRect antes de re-dibujar
8. Coordenadas: SIEMPRE normalizar (0-1) antes de guardar en CRDT
9. Tests: Vitest para unit tests, React Testing Library para components
10. No console.log — usar un logger configurado

## FORMATO DE RESPUESTA

Cuando escribas código:
1. Indica SIEMPRE el path del archivo
2. Incluye imports completos
3. Incluye tipos TypeScript completos (no interfaces parciales)
4. Si modificas un archivo existente, muestra el diff
```

---

# 7. AGENTES ESPECIALIZADOS v2

## AGENTE A: Ingeniero de Score Collaboration

```
[AGREGAR AL MASTER PROMPT]

Tu rol específico: implementar el sistema de anotaciones colaborativas sobre partituras.

COMPONENTES BAJO TU RESPONSABILIDAD:
- ScoreViewer y todos sus sub-componentes
- Hooks: useScoreCRDT, useDrawing, useAwareness, useUndoRedo
- Utils: renderStrokes, normalizeCoords, symbolSVGs
- Servicio: crdt.ts

CONOCIMIENTO TÉCNICO REQUERIDO:
- PDF.js layers (canvas, text, annotation, structural)
- react-pdf: Document, Page, onRenderSuccess
- HTML5 Canvas API: beginPath, moveTo, lineTo, quadraticCurveTo, clearRect
- Yjs: Y.Doc, Y.Map, UndoManager, awareness protocol
- y-fire: FireProvider, path configuration
- Pointer Events API (para presión de stylus)
- requestAnimationFrame para rendering suave

MODELO DE CAPAS:
Capa 1 (PDF): react-pdf <Page> renderiza en un <canvas>
Capa 3 (Drawing): un segundo <canvas> absoluto superpuesto, mismo tamaño
Capa 4 (Cursors): divs posicionados con CSS absolute
Capa 5 (Toolbar): componentes React sobre todo

REGLAS ESPECÍFICAS:
- El canvas de dibujo SIEMPRE tiene pointer-events: auto
- El canvas del PDF SIEMPRE tiene pointer-events: none
- Al cambiar de página, re-renderizar solo los strokes de esa página
- Al hacer zoom, re-calcular el tamaño del canvas de dibujo para que coincida con el PDF
- Throttle los eventos de pointer a 60fps máximo (requestAnimationFrame)
- Los strokes en progreso (while drawing) se renderizan SOLO localmente hasta touch end
- Solo en touch end se escribe al YDoc (evita overhead de sync en cada punto)
```

## AGENTE B: Ingeniero de Audio + Markers

```
[AGREGAR AL MASTER PROMPT]

Tu rol específico: implementar el reproductor de audio con waveform y marcadores compartidos.

COMPONENTES BAJO TU RESPONSABILIDAD:
- AudioPlayer y todos sus sub-componentes
- Hooks: useAudioPlayer, useMarkers, useWaveform
- Utils: renderWaveform, renderMarkers

CONOCIMIENTO TÉCNICO REQUERIDO:
- Howler.js: Howl constructor, play(), pause(), seek(), on('end'), duration()
- HTML5 Canvas API para waveform
- Web Audio API: AudioContext, AnalyserNode, decodeAudioData (para generar waveform)
- Firestore: collection, addDoc, updateDoc, onSnapshot, query, where, orderBy

WAVEFORM GENERATION:
1. Cargar el archivo con fetch() → ArrayBuffer
2. Decodificar con AudioContext.decodeAudioData()
3. Downsample a N samples (ej: 1000 para un audio de 4 minutos)
4. Almacenar como Float32Array normalizada (-1 a 1)
5. Cachear en IndexedDB para no re-procesar

RENDERING DEL WAVEFORM:
- Cada sample se dibuja como una línea vertical
- Color: verde claro (#2ECC71) para la parte ya reproducida, gris para el resto
- La línea de progreso es una línea vertical blanca que avanza con el audio
- Los marcadores se dibujan ENCIMA del waveform como líneas verticales punteadas con chips

MARCADORES - FIRESTORE:
- Path: tracks/{trackId}/markers/{markerId}
- Escuchar con onSnapshot (real-time)
- Filtrar client-side: mostrar compartidos + propios del usuario
- Al hacer click en un marcador: seek del audio a esa posición
- Al hacer long-press en el waveform: abrir editor de marcador nuevo en esa posición
```

## AGENTE C: Ingeniero de Infraestructura Firebase

```
[AGREGAR AL MASTER PROMPT]

Tu rol específico: configurar Firebase, reglas de seguridad, storage, y deploy en Netlify.

RESPONSABILIDADES:
- Firebase project configuration
- Firestore security rules
- Firebase Storage rules y CORS
- Firebase Auth (anonymous o Google sign-in para MVP)
- Cloud Functions si son necesarias
- Netlify deploy configuration
- Environment variables management

REGLAS DE FIRESTORE: ver sección 4.1 del dev kit
ESTRUCTURA DE DATOS: ver sección 4 del dev kit
```

---

# 8. PROMPTS DE TAREA ESPECÍFICOS

## PROMPT T-01v2: Implementar ScoreViewer con Drawing Canvas

```
Implementa el componente ScoreViewer que renderiza un PDF y permite dibujar sobre él.

ARCHIVOS A CREAR:
1. src/components/ScoreViewer/ScoreViewer.tsx
2. src/components/ScoreViewer/PDFRenderer.tsx
3. src/components/ScoreViewer/DrawingCanvas.tsx
4. src/components/ScoreViewer/hooks/useDrawing.ts
5. src/utils/normalizeCoords.ts

ESPECIFICACIÓN:

ScoreViewer.tsx:
- Props: { scoreId, fileUrl, pageCount, userId, userName, userColor }
- Renderiza PDFRenderer + DrawingCanvas stacked con CSS position absolute
- Maneja el estado de página actual (paginación)
- Controles: prev/next page, zoom (75%, 100%, 125%, 150%)

PDFRenderer.tsx:
- Usa react-pdf: <Document> + <Page>
- Renderiza una sola página a la vez
- onRenderSuccess: captura las dimensiones del canvas renderizado
- pointer-events: none (no intercepta clicks)

DrawingCanvas.tsx:
- Canvas HTML5 superpuesto al PDF, mismo tamaño exacto
- Escucha pointer events (pointerdown, pointermove, pointerup)
- Durante drawing: renderiza el trazo en progreso localmente
- En pointerup: finaliza el stroke, escribe al YDoc
- Re-renderiza cuando el YDoc cambia (observer)
- pointer-events: auto

useDrawing.ts:
- Maneja el estado del trazo en progreso (currentStroke)
- Acumula puntos con throttle a 60fps
- Normaliza coordenadas antes de almacenar
- Expone: startStroke, continueStroke, endStroke, setTool, setStrokeWidth

CRITERIOS:
- El trazo aparece instantáneamente mientras se dibuja (sin esperar sync)
- Al soltar, el trazo se persiste en el YDoc
- Otro dispositivo ve el trazo en <500ms
- Al cambiar de página, solo se ven los strokes de esa página
- Al hacer zoom, las anotaciones escalan proporcionalmente
```

## PROMPT T-02v2: Implementar Hook useScoreCRDT

```
Implementa el hook que conecta un ScoreViewer con Yjs + y-fire.

ARCHIVOS A CREAR:
1. src/components/ScoreViewer/hooks/useScoreCRDT.ts
2. src/services/crdt.ts
3. src/types/stroke.ts

ESPECIFICACIÓN:

useScoreCRDT.ts:
- Input: { scoreId, userId, userName, userColor }
- Crea un Y.Doc y lo conecta con y-fire al path scores/{scoreId}/crdt
- Expone:
  - strokes: Stroke[] (reactivo, se actualiza cuando el YDoc cambia)
  - addStroke(stroke): void
  - deleteStroke(strokeId): void
  - undoManager: { undo, redo, canUndo, canRedo }
  - awareness: { peers: PeerInfo[], updateCursor: (pos) => void }
  - isConnected: boolean
  - isSynced: boolean
- Cleanup: destruye el provider y el YDoc on unmount

crdt.ts:
- Factory function: createScoreProvider(firebaseApp, scoreId)
- Retorna { ydoc, provider }
- Maneja configuración de y-fire

stroke.ts:
- Interface Stroke completa (ver sección 2.2.2)
- Type guards y helpers

REGLAS:
- El YDoc se crea una sola vez por scoreId (no re-crear en cada render)
- Si el usuario cambia de partitura, destruir el provider anterior y crear uno nuevo
- El awareness se actualiza con throttle (máx cada 50ms)
- Los strokes se leen del YMap como un array ordenado por createdAt
```

## PROMPT T-03v2: Implementar Markers con Firestore Real-time

```
Implementa el sistema de marcadores compartidos sobre el waveform.

ARCHIVOS A CREAR:
1. src/components/AudioPlayer/hooks/useMarkers.ts
2. src/components/AudioPlayer/MarkerChip.tsx
3. src/components/AudioPlayer/MarkerEditor.tsx
4. src/components/AudioPlayer/utils/renderMarkers.ts
5. src/types/marker.ts

ESPECIFICACIÓN:

useMarkers.ts:
- Input: { trackId, currentUserId }
- Suscribe a Firestore: tracks/{trackId}/markers con onSnapshot
- Filtra: shared=true OR authorId=currentUserId, deleted=false
- Expone:
  - markers: Marker[] (ordenados por positionMs)
  - addMarker(positionMs, label, category, shared): Promise<string>
  - updateMarker(markerId, updates): Promise<void>
  - deleteMarker(markerId): Promise<void>
  - isLoading: boolean
- Cleanup: unsubscribe del onSnapshot on unmount

MarkerChip.tsx:
- Props: { marker, isSelected, onClick, onLongPress }
- Renderiza: chip con label + color del autor
- onClick: seek del audio a marker.positionMs
- onLongPress: abrir MarkerEditor

MarkerEditor.tsx:
- Props: { marker?, positionMs, trackId, onClose }
- Si marker existe: modo edición. Si no: modo creación.
- Campos: label (input), note (textarea), category (select), shared (toggle)
- Bottom sheet o popover (no modal dialog)
- Submit escribe/actualiza en Firestore

renderMarkers.ts:
- Función pura que dibuja marcadores sobre un canvas context
- Input: ctx, markers, canvasWidth, canvasHeight, viewRange
- Dibuja líneas verticales punteadas + chips de etiqueta
```

## PROMPT T-04v2: Implementar Awareness (Cursores de Otros Usuarios)

```
Implementa la visualización de cursores de otros usuarios sobre la partitura.

ARCHIVOS A CREAR:
1. src/components/ScoreViewer/CursorOverlay.tsx
2. src/components/ScoreViewer/hooks/useAwareness.ts

ESPECIFICACIÓN:

useAwareness.ts:
- Input: { provider (y-fire), userId, userName, userColor }
- Lee el awareness state de todos los peers conectados
- Expone:
  - peers: Array<{ id, name, color, cursor: {page, x, y} | null, activeTool, currentPage }>
  - updateCursor(page, x, y): void (throttled a 50ms)
  - updateTool(tool): void
  - updatePage(page): void

CursorOverlay.tsx:
- Props: { peers, currentPage, containerWidth, containerHeight }
- Renderiza un div posicionado absolutamente por cada peer que está en la misma página
- Cada cursor: un círculo de 12px en el color del usuario + label con su nombre
- Cursor desaparece si el peer no ha movido el mouse en 5 segundos (fade out)
- Transición suave (CSS transition) para que el cursor no salte
- pointer-events: none (no interfiere con el dibujo)
```

---

# 9. CONTRATOS DE INTERFAZ (TypeScript)

```typescript
// ═══════════════════════════════════════════
// src/types/stroke.ts
// ═══════════════════════════════════════════

export type StrokeType = 'freehand' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'text' | 'symbol';

export type MusicalSymbol = 
  | 'crescendo' | 'decrescendo' | 'accent' | 'fermata' 
  | 'arco_up' | 'arco_down' | 'pizz' | 'forte' | 'piano' 
  | 'sforzando' | 'staccato' | 'tenuto' | 'trill' | 'mordent'
  | 'turn' | 'breath_mark' | 'caesura' | 'coda' | 'segno'
  | 'dal_segno' | 'da_capo' | 'repeat_sign';

export interface Point {
  x: number;       // 0.0 a 1.0
  y: number;       // 0.0 a 1.0
  pressure: number; // 0.0 a 1.0
}

export interface Stroke {
  id: string;
  scoreId: string;
  page: number;
  authorId: string;
  authorName: string;
  color: string;
  type: StrokeType;
  points?: Point[];
  textContent?: string;
  fontSize?: number;
  position?: { x: number; y: number };
  symbolType?: MusicalSymbol;
  symbolPosition?: { x: number; y: number };
  symbolScale?: number;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  strokeWidth: number;
  opacity: number;
  createdAt: number;
  deleted: boolean;
}

// ═══════════════════════════════════════════
// src/types/marker.ts
// ═══════════════════════════════════════════

export type MarkerCategory = 
  | 'dynamics' | 'rhythm' | 'intonation' | 'form' 
  | 'articulation' | 'rehearsal' | 'free';

export interface Marker {
  id: string;
  trackId: string;
  positionMs: number;
  label: string;
  note: string | null;
  category: MarkerCategory;
  shared: boolean;
  authorId: string;
  authorName: string;
  authorColor: string;
  createdAt: any;        // Firebase Timestamp
  updatedAt: any | null;
  deleted: boolean;
}

// ═══════════════════════════════════════════
// src/types/score.ts
// ═══════════════════════════════════════════

export interface Score {
  id: string;
  trackId: string;
  partName: string;      // "Violín 1", "Score Completo"
  fileUrl: string;       // Firebase Storage URL
  fileHash: string;
  pageCount: number;
  createdAt: any;
}

// ═══════════════════════════════════════════
// Hook interfaces
// ═══════════════════════════════════════════

export interface UseScoreCRDTReturn {
  strokes: Stroke[];
  addStroke: (stroke: Omit<Stroke, 'id' | 'createdAt' | 'deleted'>) => void;
  deleteStroke: (strokeId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  peers: PeerInfo[];
  updateCursor: (page: number, x: number, y: number) => void;
  isConnected: boolean;
  isSynced: boolean;
}

export interface PeerInfo {
  id: number;           // Yjs client ID
  userId: string;
  userName: string;
  color: string;
  cursor: { page: number; x: number; y: number } | null;
  activeTool: string | null;
  currentPage: number;
}

export interface UseMarkersReturn {
  markers: Marker[];
  addMarker: (positionMs: number, label: string, category: MarkerCategory, shared: boolean, note?: string) => Promise<string>;
  updateMarker: (markerId: string, updates: Partial<Pick<Marker, 'label' | 'note' | 'category' | 'positionMs'>>) => Promise<void>;
  deleteMarker: (markerId: string) => Promise<void>;
  isLoading: boolean;
}

export interface UseDrawingReturn {
  isDrawing: boolean;
  currentTool: StrokeType;
  currentStrokeWidth: number;
  setTool: (tool: StrokeType) => void;
  setStrokeWidth: (width: number) => void;
  handlePointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
}
```

---

# 10. ANTI-PATTERNS v2

| # | NUNCA HACER | POR QUÉ | HACER EN SU LUGAR |
|---|------------|---------|-------------------|
| AP-1 | Modificar el PDF para agregar anotaciones | Lento, no colaborativo, irreversible | Capa de vectores independiente sobre canvas |
| AP-2 | Guardar coordenadas en píxeles | No escalan entre dispositivos/zoom | Coordenadas normalizadas (0-1) |
| AP-3 | Escribir al YDoc en cada pointermove | Genera cientos de updates por segundo | Acumular puntos localmente, escribir al YDoc solo en pointerup |
| AP-4 | Usar YArray para los puntos de un stroke | Cada punto genera un update CRDT | JSON.stringify el array completo en un solo campo |
| AP-5 | Eliminar entries del YMap (yMap.delete) | Rompe CRDT merge en reconexión | Soft-delete: set('deleted', true) |
| AP-6 | Usar Firestore para anotaciones en vez de CRDT | Last-write-wins genera conflictos | Yjs + y-fire para anotaciones colaborativas |
| AP-7 | Usar CRDT para marcadores en vez de Firestore | Overhead innecesario para datos discretos | Firestore directo con onSnapshot |
| AP-8 | Renderizar el PDF en un `<img>` tag | Pierde resolución al hacer zoom | react-pdf con canvas rendering |
| AP-9 | Re-generar el waveform en cada session | Costoso (AudioContext decode) | Cachear en IndexedDB |
| AP-10 | Usar wall clock para ordering de strokes | Dispositivos tienen relojes distintos | createdAt como epoch ms (suficiente para ordering visual) |
| AP-11 | Sincronizar awareness via Firestore | Demasiadas writes para datos efímeros | Awareness es solo in-memory via Yjs provider |
| AP-12 | Usar canvas 2D para todo (waveform + PDF + drawing) | Un solo canvas no permite layers | Canvas separados stacked con CSS position |
| AP-13 | Hacer fetch del PDF en cada cambio de página | Lento, desperdicia bandwidth | react-pdf carga el PDF una vez, renderiza páginas on-demand |
| AP-14 | Poner lógica de Firestore en componentes | Acoplamiento, no testeable | Custom hooks + services layer |

---

# 11. CRITERIOS DE ACEPTACIÓN

## Score Annotations

| # | Criterio | Medición |
|---|----------|----------|
| SA-1 | Un trazo dibujado aparece localmente sin latencia perceptible | <16ms (1 frame) |
| SA-2 | Un trazo dibujado aparece en otro dispositivo | <500ms via Firestore |
| SA-3 | Las anotaciones persisten después de cerrar y reabrir la app | Test de persistencia |
| SA-4 | Cada usuario tiene un color distinto y consistente | Visual |
| SA-5 | Se puede ocultar/mostrar anotaciones por autor | Checkbox per-author |
| SA-6 | Undo deshace solo los strokes del usuario actual | Test funcional |
| SA-7 | Al hacer zoom, las anotaciones escalan proporcionalmente | Visual en 75%-150% |
| SA-8 | Dos usuarios anotando la misma página simultáneamente no genera conflictos | Test CRDT |
| SA-9 | Al cambiar de página, se ven solo las anotaciones de esa página | Test funcional |
| SA-10 | Los símbolos musicales se renderizan correctamente | Visual |

## Markers

| # | Criterio | Medición |
|---|----------|----------|
| MK-1 | Un marcador compartido aparece en otros dispositivos | <500ms via Firestore |
| MK-2 | Marcadores personales solo aparecen para el autor | Test multi-usuario |
| MK-3 | Click en marcador hace seek del audio a esa posición | Test funcional |
| MK-4 | Se pueden agregar marcadores durante reproducción | Test funcional |
| MK-5 | Los marcadores persisten entre sesiones | Test de persistencia |
| MK-6 | Se puede editar label, nota, y categoría de un marcador propio | Test funcional |
| MK-7 | Se puede eliminar un marcador propio (soft-delete) | Test funcional |
| MK-8 | Los marcadores se visualizan como indicadores en el waveform | Visual |

---

# 12. FLUJOS DE USUARIO DETALLADOS

## Flow A: Omar dibuja "rit." en la partitura

```
1. Omar está en RehearsalScreen con track "Bésame Mucho" activo
2. Toca el panel inferior de partitura → se expande a ~50% de pantalla
3. Navega a página 2 de la partitura (compás 24)
4. Selecciona herramienta "Texto" en la toolbar
5. Toca sobre el compás 24 → aparece cursor de texto
6. Escribe "rit." → el texto aparece en AZUL (color de Omar)
7. Toque fuera del texto → se confirma y escribe al YDoc
8. Yjs → y-fire → Firestore propaga el cambio
9. En el iPad de Kalani: aparece "rit." en AZUL sobre compás 24 (~300ms)
10. Kalani puede ocultar las anotaciones de Omar si quiere (toggle en AuthorFilter)
```

## Flow B: Kalani agrega marcador "Revisar afinación"

```
1. Kalani está en RehearsalScreen, audio en pausa en 1:32
2. Long-press en la posición 1:32 del waveform
3. Aparece MarkerEditor como bottom sheet:
   - Label: [Revisar afinación]
   - Nota: [El cello entra medio tono abajo aquí]
   - Categoría: [Afinación ▼]
   - Compartido: [✓]
4. Toca "Guardar"
5. Firestore write: tracks/{trackId}/markers/{newId}
6. En el iPad de Omar: aparece marcador verde "Revisar afinación" en 1:32 (~200ms)
7. Omar toca el marcador → audio hace seek a 1:32
8. Omar toca Play → audio arranca desde 1:32
```

## Flow C: Ensayo desde cero (primer uso)

```
1. Omar abre la app → Login con Google
2. Crea nueva sesión "KALIOM Hotel Conrad"
3. Comparte el código/link con Kalani y tercero
4. Ellos se unen → aparecen en el lobby con colores asignados (azul, verde, naranja)
5. Omar toca "Agregar Track" → selecciona MP3 de su dispositivo
6. MP3 sube a Firebase Storage, se genera waveform
7. Omar toca "Adjuntar Partitura" → selecciona PDF
8. PDF sube a Storage, se registra en Firestore
9. Omar toca "Iniciar Ensayo" → todos van a RehearsalScreen
10. Todos ven el waveform vacío (sin marcadores) y la partitura limpia (sin anotaciones)
11. Omar toca Play → audio arranca para todos (en esta versión web, cada quien controla su propio audio)
12. Durante el ensayo van agregando marcadores y anotaciones
13. Al cerrar, todo queda guardado en Firebase
14. Próximo ensayo: abren la sesión, todo está ahí
```

---

# FIN DEL AI DEVELOPMENT KIT v2.0

**Cambios respecto a v1:**
- Stack actualizado a React + Firebase + Netlify (no Flutter)
- Detalle técnico profundo en: cómo dibujar sobre PDF, cómo sincronizar vectores via CRDT, cómo renderizar strokes en canvas
- Sistema de marcadores con Firestore directo (no CRDT)
- Código TypeScript concreto y funcional en cada sección
- Componentes React con estructura de archivos lista para implementar
- y-fire como puente entre Yjs y Firestore (serverless, sin WebSocket server)
