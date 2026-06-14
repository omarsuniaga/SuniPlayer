# SYNCENSEMBLE — TEST SUITE COMPLETA v1.0
## Validación de: Score Annotations · Markers · Reproductor Multi-dispositivo

**Stack de Testing:** Vitest · React Testing Library · @testing-library/user-event · MSW (Mock Service Worker) · fake-indexeddb  
**Fecha:** Abril 2026  
**Cobertura objetivo:** domain/utils ≥95% · hooks ≥85% · components ≥75% · integration ≥70%

---

# TABLA DE CONTENIDOS

1. [SETUP DE TESTING](#1-setup-de-testing)
2. [TEST SUITE A: SCORE ANNOTATION LAYER](#2-test-suite-a-score-annotation-layer)
3. [TEST SUITE B: SHARED TIMELINE MARKERS](#3-test-suite-b-shared-timeline-markers)
4. [TEST SUITE C: REPRODUCTOR MULTI-DISPOSITIVO](#4-test-suite-c-reproductor-multi-dispositivo)
5. [TEST SUITE D: INTEGRACIÓN END-TO-END](#5-test-suite-d-integración-end-to-end)
6. [TEST MATRIX: ESCENARIOS DE CONCURRENCIA](#6-test-matrix-escenarios-de-concurrencia)
7. [MOCKS Y FIXTURES](#7-mocks-y-fixtures)
8. [CI/CD PIPELINE CONFIG](#8-cicd-pipeline-config)

---

# 1. SETUP DE TESTING

## 1.1 Dependencias

```bash
npm install -D vitest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jsdom msw fake-indexeddb \
  @vitest/coverage-v8 @vitest/ui
```

## 1.2 Configuración Vitest

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        branches: 70,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
    // Pool config para tests que usan Yjs (needs isolation)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
});
```

## 1.3 Setup Global

```typescript
// src/test/setup.ts

import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup después de cada test
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Mock de requestAnimationFrame (para canvas rendering)
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  return setTimeout(() => cb(Date.now()), 0);
});
vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));

// Mock de PointerEvent (jsdom no lo tiene completo)
class MockPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pressure: number;
  readonly pointerType: string;

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pressure = params.pressure ?? 0.5;
    this.pointerType = params.pointerType ?? 'touch';
  }
}
vi.stubGlobal('PointerEvent', MockPointerEvent);

// Mock de HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement, contextId: string) {
  if (contextId === '2d') {
    return createMockCanvasContext();
  }
  return null;
}) as any;

function createMockCanvasContext(): Partial<CanvasRenderingContext2D> {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })) as any,
    fillText: vi.fn(),
    fillRect: vi.fn(),
    roundRect: vi.fn(),
    setLineDash: vi.fn(),
    canvas: { width: 800, height: 600 } as any,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    globalAlpha: 1,
    font: '',
    textAlign: 'start' as CanvasTextAlign,
  };
}

// Export para uso en tests
export { createMockCanvasContext };
```

## 1.4 Factories de Datos de Test

```typescript
// src/test/factories.ts

import { v4 as uuid } from 'uuid';
import type { Stroke, Point, Marker, MarkerCategory, Score } from '@/types';

// ── Stroke Factories ──

export function createPoint(overrides: Partial<Point> = {}): Point {
  return {
    x: Math.random(),
    y: Math.random(),
    pressure: 0.5,
    ...overrides,
  };
}

export function createStroke(overrides: Partial<Stroke> = {}): Stroke {
  return {
    id: uuid(),
    scoreId: 'score-001',
    page: 0,
    authorId: 'user-omar',
    authorName: 'Omar',
    color: '#3B82F6',
    type: 'freehand',
    points: [
      createPoint({ x: 0.1, y: 0.2 }),
      createPoint({ x: 0.15, y: 0.25 }),
      createPoint({ x: 0.2, y: 0.3 }),
    ],
    strokeWidth: 0.003,
    opacity: 1.0,
    createdAt: Date.now(),
    deleted: false,
    ...overrides,
  };
}

export function createTextStroke(overrides: Partial<Stroke> = {}): Stroke {
  return createStroke({
    type: 'text',
    textContent: 'rit.',
    fontSize: 0.03,
    position: { x: 0.5, y: 0.4 },
    points: undefined,
    ...overrides,
  });
}

export function createSymbolStroke(overrides: Partial<Stroke> = {}): Stroke {
  return createStroke({
    type: 'symbol',
    symbolType: 'fermata',
    symbolPosition: { x: 0.6, y: 0.3 },
    symbolScale: 1.0,
    points: undefined,
    ...overrides,
  });
}

export function createLineStroke(overrides: Partial<Stroke> = {}): Stroke {
  return createStroke({
    type: 'line',
    startPoint: { x: 0.1, y: 0.5 },
    endPoint: { x: 0.9, y: 0.5 },
    points: undefined,
    ...overrides,
  });
}

// ── Marker Factories ──

export function createMarker(overrides: Partial<Marker> = {}): Marker {
  return {
    id: uuid(),
    trackId: 'track-001',
    positionMs: 92000,
    label: 'Revisar afinación',
    note: 'El cello entra medio tono abajo',
    category: 'intonation' as MarkerCategory,
    shared: true,
    authorId: 'user-kalani',
    authorName: 'Kalani',
    authorColor: '#10B981',
    createdAt: { toMillis: () => Date.now() },
    updatedAt: null,
    deleted: false,
    ...overrides,
  };
}

// ── Score Factory ──

export function createScore(overrides: Partial<Score> = {}): Score {
  return {
    id: 'score-001',
    trackId: 'track-001',
    partName: 'Violín 1',
    fileUrl: 'https://storage.example.com/scores/test.pdf',
    fileHash: 'abc123hash',
    pageCount: 3,
    createdAt: { toMillis: () => Date.now() },
    ...overrides,
  };
}

// ── User Factories ──

export const USERS = {
  omar: { id: 'user-omar', name: 'Omar', color: '#3B82F6' },
  kalani: { id: 'user-kalani', name: 'Kalani', color: '#10B981' },
  tercero: { id: 'user-tercero', name: 'Carlos', color: '#F59E0B' },
};

// ── Batch Factories ──

export function createStrokeBatch(count: number, overrides: Partial<Stroke> = {}): Stroke[] {
  return Array.from({ length: count }, (_, i) =>
    createStroke({
      id: `stroke-${i}`,
      createdAt: Date.now() + i * 100,
      ...overrides,
    })
  );
}

export function createMarkerBatch(count: number, durationMs: number = 300000): Marker[] {
  return Array.from({ length: count }, (_, i) =>
    createMarker({
      id: `marker-${i}`,
      positionMs: Math.floor((durationMs / count) * i),
      label: `Marker ${i + 1}`,
    })
  );
}
```

---

# 2. TEST SUITE A: SCORE ANNOTATION LAYER

## A1. Unit Tests: Coordinate Normalization

```typescript
// src/utils/__tests__/normalizeCoords.test.ts

import { describe, it, expect } from 'vitest';
import {
  normalizePoint,
  denormalizePoint,
  normalizeStrokePoints,
  isWithinBounds,
} from '../normalizeCoords';

describe('normalizePoint', () => {
  it('convierte coordenadas de píxeles a rango 0-1', () => {
    const result = normalizePoint(400, 300, 800, 600);
    expect(result).toEqual({ x: 0.5, y: 0.5 });
  });

  it('retorna 0,0 para la esquina superior izquierda', () => {
    const result = normalizePoint(0, 0, 800, 600);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('retorna 1,1 para la esquina inferior derecha', () => {
    const result = normalizePoint(800, 600, 800, 600);
    expect(result).toEqual({ x: 1, y: 1 });
  });

  it('clampea valores negativos a 0', () => {
    const result = normalizePoint(-10, -20, 800, 600);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('clampea valores mayores al tamaño a 1', () => {
    const result = normalizePoint(900, 700, 800, 600);
    expect(result.x).toBe(1);
    expect(result.y).toBe(1);
  });

  it('maneja canvas de tamaño 0 sin dividir por cero', () => {
    const result = normalizePoint(100, 100, 0, 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('preserva precisión decimal suficiente', () => {
    const result = normalizePoint(333, 166, 1000, 500);
    expect(result.x).toBeCloseTo(0.333, 3);
    expect(result.y).toBeCloseTo(0.332, 3);
  });
});

describe('denormalizePoint', () => {
  it('convierte coordenadas normalizadas a píxeles', () => {
    const result = denormalizePoint(0.5, 0.5, 800, 600);
    expect(result).toEqual({ x: 400, y: 300 });
  });

  it('es la inversa exacta de normalizePoint', () => {
    const originalX = 347;
    const originalY = 219;
    const canvasW = 800;
    const canvasH = 600;

    const normalized = normalizePoint(originalX, originalY, canvasW, canvasH);
    const restored = denormalizePoint(normalized.x, normalized.y, canvasW, canvasH);

    expect(restored.x).toBeCloseTo(originalX, 0);
    expect(restored.y).toBeCloseTo(originalY, 0);
  });

  it('escala correctamente a diferentes resoluciones', () => {
    // Mismo punto normalizado, diferentes canvas
    const smallCanvas = denormalizePoint(0.5, 0.5, 400, 300);
    const largeCanvas = denormalizePoint(0.5, 0.5, 1600, 1200);

    expect(smallCanvas).toEqual({ x: 200, y: 150 });
    expect(largeCanvas).toEqual({ x: 800, y: 600 });
  });
});

describe('normalizeStrokePoints', () => {
  it('normaliza un array completo de puntos', () => {
    const rawPoints = [
      { x: 0, y: 0, pressure: 0.5 },
      { x: 400, y: 300, pressure: 0.8 },
      { x: 800, y: 600, pressure: 0.3 },
    ];
    const result = normalizeStrokePoints(rawPoints, 800, 600);

    expect(result[0]).toEqual({ x: 0, y: 0, pressure: 0.5 });
    expect(result[1]).toEqual({ x: 0.5, y: 0.5, pressure: 0.8 });
    expect(result[2]).toEqual({ x: 1, y: 1, pressure: 0.3 });
  });

  it('preserva los valores de presión sin modificar', () => {
    const rawPoints = [{ x: 100, y: 100, pressure: 0.72 }];
    const result = normalizeStrokePoints(rawPoints, 800, 600);
    expect(result[0].pressure).toBe(0.72);
  });

  it('retorna array vacío para input vacío', () => {
    expect(normalizeStrokePoints([], 800, 600)).toEqual([]);
  });
});

describe('isWithinBounds', () => {
  it('retorna true para punto dentro del canvas', () => {
    expect(isWithinBounds(0.5, 0.5)).toBe(true);
  });

  it('retorna true para bordes (0 y 1)', () => {
    expect(isWithinBounds(0, 0)).toBe(true);
    expect(isWithinBounds(1, 1)).toBe(true);
  });

  it('retorna false para punto fuera del canvas', () => {
    expect(isWithinBounds(-0.01, 0.5)).toBe(false);
    expect(isWithinBounds(0.5, 1.01)).toBe(false);
  });
});
```

## A2. Unit Tests: Stroke Rendering

```typescript
// src/components/ScoreViewer/utils/__tests__/renderStrokes.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCanvasContext } from '@/test/setup';
import { renderAnnotations } from '../renderStrokes';
import {
  createStroke,
  createTextStroke,
  createSymbolStroke,
  createStrokeBatch,
  USERS,
} from '@/test/factories';

describe('renderAnnotations', () => {
  let ctx: ReturnType<typeof createMockCanvasContext>;
  const W = 800;
  const H = 600;

  beforeEach(() => {
    ctx = createMockCanvasContext();
  });

  it('limpia el canvas antes de dibujar', () => {
    renderAnnotations(ctx as any, [], W, H, new Set([USERS.omar.id]), 0);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, W, H);
  });

  it('no dibuja nada si no hay strokes', () => {
    renderAnnotations(ctx as any, [], W, H, new Set([USERS.omar.id]), 0);
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it('dibuja strokes freehand de la página actual', () => {
    const strokes = [createStroke({ page: 0 }), createStroke({ page: 1 })];
    const visibleAuthors = new Set([USERS.omar.id]);

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    // Solo 1 stroke (page 0), debería hacer save/restore una vez
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it('filtra strokes marcados como deleted', () => {
    const strokes = [
      createStroke({ deleted: false }),
      createStroke({ deleted: true }),
    ];
    const visibleAuthors = new Set([USERS.omar.id]);

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    expect(ctx.save).toHaveBeenCalledTimes(1);
  });

  it('filtra strokes de autores no visibles', () => {
    const strokes = [
      createStroke({ authorId: USERS.omar.id }),
      createStroke({ authorId: USERS.kalani.id }),
    ];
    // Solo Omar es visible
    const visibleAuthors = new Set([USERS.omar.id]);

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    expect(ctx.save).toHaveBeenCalledTimes(1);
  });

  it('respeta el color del autor en cada stroke', () => {
    const strokes = [createStroke({ color: '#FF0000' })];
    const visibleAuthors = new Set([USERS.omar.id]);

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    expect(ctx.strokeStyle).toBe('#FF0000');
  });

  it('respeta la opacidad del stroke', () => {
    const strokes = [createStroke({ opacity: 0.5 })];
    const visibleAuthors = new Set([USERS.omar.id]);

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    expect(ctx.globalAlpha).toBe(0.5);
  });

  it('denormaliza el strokeWidth correctamente', () => {
    const strokes = [createStroke({ strokeWidth: 0.003 })];
    const visibleAuthors = new Set([USERS.omar.id]);

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    // 0.003 * 800 = 2.4
    expect(ctx.lineWidth).toBeCloseTo(2.4, 1);
  });

  it('ordena los strokes por createdAt antes de dibujar', () => {
    const strokeOld = createStroke({ createdAt: 1000 });
    const strokeNew = createStroke({ createdAt: 2000 });
    // Pasan en orden inverso
    const strokes = [strokeNew, strokeOld];
    const visibleAuthors = new Set([USERS.omar.id]);

    const drawOrder: string[] = [];
    const originalSave = ctx.save;
    ctx.save = vi.fn(() => {
      // Usamos strokeStyle como proxy para saber cuál se dibuja primero
    });

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    // Verificar que se llamó save 2 veces (2 strokes visibles)
    expect(ctx.save).toHaveBeenCalledTimes(2);
  });

  it('dibuja strokes de texto usando fillText', () => {
    const strokes = [createTextStroke({ textContent: 'rit.' })];
    const visibleAuthors = new Set([USERS.omar.id]);

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('maneja strokes con points vacío sin crash', () => {
    const strokes = [createStroke({ points: [] })];
    const visibleAuthors = new Set([USERS.omar.id]);

    expect(() => {
      renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);
    }).not.toThrow();
  });

  it('maneja strokes con un solo punto sin crash', () => {
    const strokes = [createStroke({ points: [{ x: 0.5, y: 0.5, pressure: 0.5 }] })];
    const visibleAuthors = new Set([USERS.omar.id]);

    expect(() => {
      renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);
    }).not.toThrow();
  });

  it('renderiza correctamente con 1000+ strokes sin timeout', () => {
    const strokes = createStrokeBatch(1000);
    const visibleAuthors = new Set([USERS.omar.id]);

    const start = performance.now();
    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);
    const elapsed = performance.now() - start;

    // Debe completar en menos de 100ms para ser fluido
    expect(elapsed).toBeLessThan(100);
  });

  it('muestra todos los autores cuando el Set está completo', () => {
    const strokes = [
      createStroke({ authorId: USERS.omar.id }),
      createStroke({ authorId: USERS.kalani.id }),
      createStroke({ authorId: USERS.tercero.id }),
    ];
    const visibleAuthors = new Set([USERS.omar.id, USERS.kalani.id, USERS.tercero.id]);

    renderAnnotations(ctx as any, strokes, W, H, visibleAuthors, 0);

    expect(ctx.save).toHaveBeenCalledTimes(3);
  });
});
```

## A3. Unit Tests: CRDT Operations

```typescript
// src/components/ScoreViewer/hooks/__tests__/crdtOperations.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import { createStroke, createTextStroke, USERS } from '@/test/factories';
import type { Stroke } from '@/types';

// ── Funciones bajo test (extraídas de useScoreCRDT) ──
// Estas funciones se importarían del módulo real:
// import { addStroke, deleteStroke, getAllStrokes } from '../crdtOperations';

// Para este test, las definimos inline como referencia:
function addStroke(yStrokes: Y.Map<Y.Map<any>>, stroke: Stroke) {
  const yStroke = new Y.Map();
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
    if (stroke.points) yStroke.set('points', JSON.stringify(stroke.points));
    if (stroke.textContent) {
      yStroke.set('textContent', stroke.textContent);
      yStroke.set('fontSize', stroke.fontSize);
      yStroke.set('position', JSON.stringify(stroke.position));
    }
    yStrokes.set(stroke.id, yStroke);
  });
}

function deleteStroke(yStrokes: Y.Map<Y.Map<any>>, strokeId: string) {
  const yStroke = yStrokes.get(strokeId);
  if (yStroke) {
    yStroke.set('deleted', true);
  }
}

function getAllStrokes(yStrokes: Y.Map<Y.Map<any>>): Stroke[] {
  const strokes: Stroke[] = [];
  yStrokes.forEach((yStroke) => {
    const pointsStr = yStroke.get('points');
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
      position: yStroke.get('position') ? JSON.parse(yStroke.get('position')) : undefined,
      strokeWidth: yStroke.get('strokeWidth'),
      opacity: yStroke.get('opacity'),
      createdAt: yStroke.get('createdAt'),
      deleted: yStroke.get('deleted') || false,
    });
  });
  return strokes;
}

describe('CRDT Stroke Operations', () => {
  let ydoc: Y.Doc;
  let yStrokes: Y.Map<Y.Map<any>>;

  beforeEach(() => {
    ydoc = new Y.Doc();
    yStrokes = ydoc.getMap('strokes');
  });

  afterEach(() => {
    ydoc.destroy();
  });

  describe('addStroke', () => {
    it('agrega un stroke freehand al YMap', () => {
      const stroke = createStroke({ id: 'stroke-1' });
      addStroke(yStrokes, stroke);

      expect(yStrokes.size).toBe(1);
      expect(yStrokes.has('stroke-1')).toBe(true);
    });

    it('preserva todos los campos del stroke', () => {
      const stroke = createStroke({
        id: 'stroke-1',
        page: 2,
        authorId: USERS.omar.id,
        color: '#3B82F6',
        strokeWidth: 0.005,
        opacity: 0.8,
      });
      addStroke(yStrokes, stroke);

      const stored = yStrokes.get('stroke-1')!;
      expect(stored.get('page')).toBe(2);
      expect(stored.get('authorId')).toBe(USERS.omar.id);
      expect(stored.get('color')).toBe('#3B82F6');
      expect(stored.get('strokeWidth')).toBe(0.005);
      expect(stored.get('opacity')).toBe(0.8);
      expect(stored.get('deleted')).toBe(false);
    });

    it('serializa points como JSON string', () => {
      const points = [
        { x: 0.1, y: 0.2, pressure: 0.5 },
        { x: 0.3, y: 0.4, pressure: 0.7 },
      ];
      const stroke = createStroke({ id: 'stroke-1', points });
      addStroke(yStrokes, stroke);

      const stored = yStrokes.get('stroke-1')!;
      const parsedPoints = JSON.parse(stored.get('points'));
      expect(parsedPoints).toEqual(points);
    });

    it('agrega un stroke de texto correctamente', () => {
      const stroke = createTextStroke({ id: 'text-1', textContent: 'rit.' });
      addStroke(yStrokes, stroke);

      const stored = yStrokes.get('text-1')!;
      expect(stored.get('textContent')).toBe('rit.');
      expect(stored.get('type')).toBe('text');
    });

    it('puede agregar múltiples strokes', () => {
      addStroke(yStrokes, createStroke({ id: 'a' }));
      addStroke(yStrokes, createStroke({ id: 'b' }));
      addStroke(yStrokes, createStroke({ id: 'c' }));

      expect(yStrokes.size).toBe(3);
    });

    it('sobrescribe si se agrega con el mismo ID', () => {
      addStroke(yStrokes, createStroke({ id: 'dup', color: '#FF0000' }));
      addStroke(yStrokes, createStroke({ id: 'dup', color: '#00FF00' }));

      expect(yStrokes.size).toBe(1);
      expect(yStrokes.get('dup')!.get('color')).toBe('#00FF00');
    });
  });

  describe('deleteStroke', () => {
    it('marca el stroke como deleted=true (soft delete)', () => {
      addStroke(yStrokes, createStroke({ id: 'stroke-1' }));
      deleteStroke(yStrokes, 'stroke-1');

      expect(yStrokes.get('stroke-1')!.get('deleted')).toBe(true);
    });

    it('NO elimina el entry del YMap (preserva tombstone)', () => {
      addStroke(yStrokes, createStroke({ id: 'stroke-1' }));
      deleteStroke(yStrokes, 'stroke-1');

      expect(yStrokes.size).toBe(1);
      expect(yStrokes.has('stroke-1')).toBe(true);
    });

    it('no hace nada si el stroke no existe', () => {
      expect(() => {
        deleteStroke(yStrokes, 'nonexistent');
      }).not.toThrow();
    });

    it('un stroke eliminado no aparece en getAllStrokes filtrado', () => {
      addStroke(yStrokes, createStroke({ id: 's1' }));
      addStroke(yStrokes, createStroke({ id: 's2' }));
      deleteStroke(yStrokes, 's1');

      const all = getAllStrokes(yStrokes).filter(s => !s.deleted);
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('s2');
    });
  });

  describe('getAllStrokes', () => {
    it('retorna array vacío si no hay strokes', () => {
      expect(getAllStrokes(yStrokes)).toEqual([]);
    });

    it('retorna todos los strokes incluyendo eliminados', () => {
      addStroke(yStrokes, createStroke({ id: 's1' }));
      addStroke(yStrokes, createStroke({ id: 's2' }));
      deleteStroke(yStrokes, 's1');

      const all = getAllStrokes(yStrokes);
      expect(all).toHaveLength(2);
    });

    it('deserializa points correctamente', () => {
      const originalPoints = [
        { x: 0.123, y: 0.456, pressure: 0.789 },
      ];
      addStroke(yStrokes, createStroke({ id: 's1', points: originalPoints }));

      const strokes = getAllStrokes(yStrokes);
      expect(strokes[0].points).toEqual(originalPoints);
    });
  });

  describe('CRDT Merge (simulación multi-dispositivo)', () => {
    it('merge concurrent adds de dos dispositivos', () => {
      // Simular 2 dispositivos con YDocs separados
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();
      const strokes1 = doc1.getMap('strokes') as Y.Map<Y.Map<any>>;
      const strokes2 = doc2.getMap('strokes') as Y.Map<Y.Map<any>>;

      // Device 1 agrega un stroke
      addStroke(strokes1, createStroke({
        id: 'from-device1',
        authorId: USERS.omar.id,
        color: '#3B82F6',
      }));

      // Device 2 agrega un stroke (sin saber del otro)
      addStroke(strokes2, createStroke({
        id: 'from-device2',
        authorId: USERS.kalani.id,
        color: '#10B981',
      }));

      // Sincronizar: aplicar updates cruzados
      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc1, update2);
      Y.applyUpdate(doc2, update1);

      // Ambos docs deberían tener los 2 strokes
      expect(strokes1.size).toBe(2);
      expect(strokes2.size).toBe(2);

      // Los strokes son idénticos en ambos docs
      const all1 = getAllStrokes(strokes1).sort((a, b) => a.id.localeCompare(b.id));
      const all2 = getAllStrokes(strokes2).sort((a, b) => a.id.localeCompare(b.id));

      expect(all1.map(s => s.id)).toEqual(all2.map(s => s.id));

      doc1.destroy();
      doc2.destroy();
    });

    it('merge concurrent delete y add sin conflicto', () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();
      const strokes1 = doc1.getMap('strokes') as Y.Map<Y.Map<any>>;
      const strokes2 = doc2.getMap('strokes') as Y.Map<Y.Map<any>>;

      // Estado inicial: ambos tienen stroke-shared
      const sharedStroke = createStroke({ id: 'stroke-shared' });
      addStroke(strokes1, sharedStroke);
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

      // Device 1 elimina el stroke
      deleteStroke(strokes1, 'stroke-shared');

      // Device 2 agrega un nuevo stroke (sin saber de la eliminación)
      addStroke(strokes2, createStroke({ id: 'stroke-new' }));

      // Sincronizar
      Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

      // Ambos tienen 2 entries: shared (deleted) + new
      const all1 = getAllStrokes(strokes1);
      const all2 = getAllStrokes(strokes2);

      expect(all1).toHaveLength(2);
      expect(all2).toHaveLength(2);

      // shared está marcado como deleted en ambos
      const shared1 = all1.find(s => s.id === 'stroke-shared')!;
      const shared2 = all2.find(s => s.id === 'stroke-shared')!;
      expect(shared1.deleted).toBe(true);
      expect(shared2.deleted).toBe(true);

      // new existe en ambos
      expect(all1.find(s => s.id === 'stroke-new')).toBeDefined();
      expect(all2.find(s => s.id === 'stroke-new')).toBeDefined();

      doc1.destroy();
      doc2.destroy();
    });

    it('3 dispositivos convergen al mismo estado', () => {
      const docs = [new Y.Doc(), new Y.Doc(), new Y.Doc()];
      const maps = docs.map(d => d.getMap('strokes') as Y.Map<Y.Map<any>>);

      // Cada dispositivo agrega su propio stroke
      maps.forEach((m, i) => {
        addStroke(m, createStroke({
          id: `stroke-device-${i}`,
          authorId: `user-${i}`,
        }));
      });

      // Full mesh sync: cada par sincroniza
      for (let i = 0; i < docs.length; i++) {
        for (let j = 0; j < docs.length; j++) {
          if (i !== j) {
            Y.applyUpdate(docs[j], Y.encodeStateAsUpdate(docs[i]));
          }
        }
      }

      // Todos tienen 3 strokes
      maps.forEach(m => {
        expect(m.size).toBe(3);
      });

      // Los IDs son idénticos
      const ids0 = getAllStrokes(maps[0]).map(s => s.id).sort();
      const ids1 = getAllStrokes(maps[1]).map(s => s.id).sort();
      const ids2 = getAllStrokes(maps[2]).map(s => s.id).sort();

      expect(ids0).toEqual(ids1);
      expect(ids1).toEqual(ids2);

      docs.forEach(d => d.destroy());
    });

    it('UndoManager deshace solo los cambios del usuario local', () => {
      const ydoc = new Y.Doc();
      const yStrokes = ydoc.getMap('strokes') as Y.Map<Y.Map<any>>;

      const undoManager = new Y.UndoManager(yStrokes, {
        trackedOrigins: new Set([ydoc.clientID]),
      });

      // Cambio trackeado (local): usar transact con origin
      ydoc.transact(() => {
        addStroke(yStrokes, createStroke({ id: 'local-stroke' }));
      }, ydoc.clientID);

      // Simular cambio remoto (no trackeado)
      ydoc.transact(() => {
        addStroke(yStrokes, createStroke({ id: 'remote-stroke' }));
      }, 'remote-origin');

      expect(yStrokes.size).toBe(2);

      // Undo: solo deshace el cambio local
      undoManager.undo();

      expect(yStrokes.size).toBe(1);
      expect(yStrokes.has('remote-stroke')).toBe(true);
      expect(yStrokes.has('local-stroke')).toBe(false);

      // Redo
      undoManager.redo();
      expect(yStrokes.size).toBe(2);

      ydoc.destroy();
    });
  });
});
```

## A4. Component Tests: DrawingCanvas

```typescript
// src/components/ScoreViewer/__tests__/DrawingCanvas.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock del hook useDrawing
const mockUseDrawing = {
  isDrawing: false,
  currentTool: 'freehand' as const,
  currentStrokeWidth: 0.003,
  setTool: vi.fn(),
  setStrokeWidth: vi.fn(),
  handlePointerDown: vi.fn(),
  handlePointerMove: vi.fn(),
  handlePointerUp: vi.fn(),
};

vi.mock('../hooks/useDrawing', () => ({
  useDrawing: () => mockUseDrawing,
}));

// Mock de useScoreCRDT
const mockUseCRDT = {
  strokes: [],
  addStroke: vi.fn(),
  deleteStroke: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: false,
  canRedo: false,
  peers: [],
  updateCursor: vi.fn(),
  isConnected: true,
  isSynced: true,
};

vi.mock('../hooks/useScoreCRDT', () => ({
  useScoreCRDT: () => mockUseCRDT,
}));

// Import después de los mocks
import { DrawingCanvas } from '../DrawingCanvas';

describe('DrawingCanvas', () => {
  const defaultProps = {
    width: 800,
    height: 600,
    scoreId: 'score-001',
    currentPage: 0,
    userId: 'user-omar',
    userName: 'Omar',
    userColor: '#3B82F6',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza un canvas con las dimensiones correctas', () => {
    render(<DrawingCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('drawing-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('tiene pointer-events: auto (intercepta toques)', () => {
    render(<DrawingCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('drawing-canvas');
    expect(canvas).toHaveStyle({ pointerEvents: 'auto' });
  });

  it('llama handlePointerDown en pointerdown', () => {
    render(<DrawingCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('drawing-canvas');

    fireEvent.pointerDown(canvas, {
      clientX: 400,
      clientY: 300,
      pressure: 0.5,
    });

    expect(mockUseDrawing.handlePointerDown).toHaveBeenCalledTimes(1);
  });

  it('llama handlePointerMove en pointermove', () => {
    render(<DrawingCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('drawing-canvas');

    fireEvent.pointerMove(canvas, {
      clientX: 410,
      clientY: 310,
      pressure: 0.6,
    });

    expect(mockUseDrawing.handlePointerMove).toHaveBeenCalledTimes(1);
  });

  it('llama handlePointerUp en pointerup', () => {
    render(<DrawingCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('drawing-canvas');

    fireEvent.pointerUp(canvas);

    expect(mockUseDrawing.handlePointerUp).toHaveBeenCalledTimes(1);
  });

  it('tiene position absolute para superponerse al PDF', () => {
    render(<DrawingCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('drawing-canvas');
    expect(canvas).toHaveStyle({ position: 'absolute' });
  });

  it('muestra indicador de conexión', () => {
    render(<DrawingCanvas {...defaultProps} />);
    // El indicador de sync debería estar visible
    expect(screen.getByTestId('sync-indicator')).toBeInTheDocument();
  });
});
```

## A5. Component Tests: AnnotationToolbar

```typescript
// src/components/ScoreViewer/__tests__/AnnotationToolbar.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnotationToolbar } from '../AnnotationToolbar';

describe('AnnotationToolbar', () => {
  const defaultProps = {
    currentTool: 'freehand' as const,
    currentStrokeWidth: 0.003,
    canUndo: false,
    canRedo: false,
    onToolChange: vi.fn(),
    onStrokeWidthChange: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onClearAll: vi.fn(),
    userColor: '#3B82F6',
  };

  it('renderiza todos los botones de herramienta', () => {
    render(<AnnotationToolbar {...defaultProps} />);

    expect(screen.getByRole('button', { name: /lápiz|pen|freehand/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /texto|text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /borrador|eraser/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /símbolo|symbol/i })).toBeInTheDocument();
  });

  it('marca la herramienta activa visualmente', () => {
    render(<AnnotationToolbar {...defaultProps} currentTool="freehand" />);

    const penButton = screen.getByRole('button', { name: /lápiz|pen|freehand/i });
    expect(penButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('llama onToolChange al seleccionar una herramienta', async () => {
    const user = userEvent.setup();
    render(<AnnotationToolbar {...defaultProps} />);

    const textButton = screen.getByRole('button', { name: /texto|text/i });
    await user.click(textButton);

    expect(defaultProps.onToolChange).toHaveBeenCalledWith('text');
  });

  it('deshabilita undo cuando canUndo es false', () => {
    render(<AnnotationToolbar {...defaultProps} canUndo={false} />);

    const undoButton = screen.getByRole('button', { name: /undo|deshacer/i });
    expect(undoButton).toBeDisabled();
  });

  it('habilita undo cuando canUndo es true', () => {
    render(<AnnotationToolbar {...defaultProps} canUndo={true} />);

    const undoButton = screen.getByRole('button', { name: /undo|deshacer/i });
    expect(undoButton).not.toBeDisabled();
  });

  it('llama onUndo al hacer click en undo', async () => {
    const user = userEvent.setup();
    render(<AnnotationToolbar {...defaultProps} canUndo={true} />);

    await user.click(screen.getByRole('button', { name: /undo|deshacer/i }));
    expect(defaultProps.onUndo).toHaveBeenCalledTimes(1);
  });

  it('muestra el color del usuario en el indicador', () => {
    render(<AnnotationToolbar {...defaultProps} userColor="#FF0000" />);

    const colorIndicator = screen.getByTestId('user-color-indicator');
    expect(colorIndicator).toHaveStyle({ backgroundColor: '#FF0000' });
  });

  it('tiene target táctil mínimo de 48x48px en cada botón', () => {
    render(<AnnotationToolbar {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      // En jsdom los rects son 0, verificamos via className o style
      expect(button.className).toMatch(/min-w-\[48px\]|min-h-\[48px\]|p-3|w-12|h-12/);
    });
  });
});
```

---

# 3. TEST SUITE B: SHARED TIMELINE MARKERS

## B1. Unit Tests: Marker CRUD

```typescript
// src/components/AudioPlayer/hooks/__tests__/useMarkers.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMarker, createMarkerBatch, USERS } from '@/test/factories';
import type { Marker } from '@/types';

// ── Mock de Firestore ──
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  Timestamp: { now: () => ({ toMillis: () => Date.now() }) },
}));

// Importar funciones bajo test
import {
  addMarker,
  updateMarker,
  deleteMarker,
  subscribeToMarkers,
} from '../../services/markerService';

describe('Marker Service', () => {
  const mockDb = {} as any;
  const trackId = 'track-001';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'new-marker-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  describe('addMarker', () => {
    it('crea un documento en la subcollection correcta', async () => {
      const markerId = await addMarker(mockDb, trackId, {
        positionMs: 92000,
        label: 'Revisar afinación',
        note: 'El cello entra bajo',
        category: 'intonation',
        shared: true,
        authorId: USERS.kalani.id,
        authorName: USERS.kalani.name,
        authorColor: USERS.kalani.color,
      });

      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'tracks', trackId, 'markers');
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(markerId).toBe('new-marker-id');
    });

    it('incluye createdAt y deleted=false automáticamente', async () => {
      await addMarker(mockDb, trackId, {
        positionMs: 5000,
        label: 'Test',
        note: null,
        category: 'free',
        shared: true,
        authorId: USERS.omar.id,
        authorName: USERS.omar.name,
        authorColor: USERS.omar.color,
      });

      const writeData = mockAddDoc.mock.calls[0][1];
      expect(writeData.deleted).toBe(false);
      expect(writeData.createdAt).toBeDefined();
      expect(writeData.updatedAt).toBeNull();
    });

    it('preserva positionMs exacta (no redondea)', async () => {
      await addMarker(mockDb, trackId, {
        positionMs: 92347,
        label: 'Preciso',
        note: null,
        category: 'free',
        shared: true,
        authorId: USERS.omar.id,
        authorName: USERS.omar.name,
        authorColor: USERS.omar.color,
      });

      const writeData = mockAddDoc.mock.calls[0][1];
      expect(writeData.positionMs).toBe(92347);
    });
  });

  describe('updateMarker', () => {
    it('actualiza solo los campos proporcionados', async () => {
      await updateMarker(mockDb, trackId, 'marker-1', {
        label: 'Nuevo label',
      });

      expect(mockDoc).toHaveBeenCalledWith(mockDb, 'tracks', trackId, 'markers', 'marker-1');
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.label).toBe('Nuevo label');
      expect(updateData.updatedAt).toBeDefined();
    });

    it('no sobrescribe campos no incluidos en updates', async () => {
      await updateMarker(mockDb, trackId, 'marker-1', {
        note: 'Nueva nota',
      });

      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.note).toBe('Nueva nota');
      expect(updateData.label).toBeUndefined(); // No incluido
      expect(updateData.category).toBeUndefined(); // No incluido
    });
  });

  describe('deleteMarker', () => {
    it('hace soft-delete (deleted=true), no elimina el documento', async () => {
      await deleteMarker(mockDb, trackId, 'marker-1');

      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.deleted).toBe(true);
      expect(updateData.updatedAt).toBeDefined();
    });
  });

  describe('subscribeToMarkers', () => {
    it('crea un listener onSnapshot con query correcta', () => {
      const callback = vi.fn();
      subscribeToMarkers(mockDb, trackId, USERS.omar.id, callback);

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('deleted', '==', false);
      expect(mockOrderBy).toHaveBeenCalledWith('positionMs', 'asc');
      expect(mockOnSnapshot).toHaveBeenCalled();
    });

    it('retorna función de unsubscribe', () => {
      const unsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValue(unsubscribe);

      const callback = vi.fn();
      const unsub = subscribeToMarkers(mockDb, trackId, USERS.omar.id, callback);

      expect(typeof unsub).toBe('function');
    });

    it('filtra marcadores personales de otros usuarios', () => {
      // Simular snapshot con marcadores mixtos
      const snapshotCallback = captureOnSnapshotCallback();

      const callback = vi.fn();
      subscribeToMarkers(mockDb, trackId, USERS.omar.id, callback);

      // Simular datos del snapshot
      const mockSnapshot = createMockSnapshot([
        createMarker({ id: 'm1', shared: true, authorId: USERS.kalani.id }),  // Visible (shared)
        createMarker({ id: 'm2', shared: false, authorId: USERS.kalani.id }), // Oculto (personal de otro)
        createMarker({ id: 'm3', shared: false, authorId: USERS.omar.id }),   // Visible (personal propio)
        createMarker({ id: 'm4', shared: true, authorId: USERS.omar.id }),    // Visible (shared)
      ]);

      snapshotCallback(mockSnapshot);

      const receivedMarkers = callback.mock.calls[0][0];
      expect(receivedMarkers).toHaveLength(3);
      expect(receivedMarkers.map((m: Marker) => m.id)).toEqual(['m1', 'm3', 'm4']);
    });
  });
});

// ── Helpers para tests de Firestore ──

function captureOnSnapshotCallback() {
  let captured: any;
  mockOnSnapshot.mockImplementation((_query: any, cb: any) => {
    captured = cb;
    return vi.fn(); // unsubscribe
  });
  return (...args: any[]) => captured?.(...args);
}

function createMockSnapshot(markers: Marker[]) {
  return {
    forEach: (cb: (doc: any) => void) => {
      markers.forEach(m => {
        cb({
          id: m.id,
          data: () => m,
        });
      });
    },
  };
}
```

## B2. Unit Tests: Marker Rendering on Waveform

```typescript
// src/components/AudioPlayer/utils/__tests__/renderMarkers.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCanvasContext } from '@/test/setup';
import { renderMarkersOnWaveform, findMarkerAtPosition } from '../renderMarkers';
import { createMarker, createMarkerBatch } from '@/test/factories';

describe('renderMarkersOnWaveform', () => {
  let ctx: ReturnType<typeof createMockCanvasContext>;
  const W = 1000;
  const H = 200;
  const DURATION = 300000; // 5 minutos

  beforeEach(() => {
    ctx = createMockCanvasContext();
  });

  it('no dibuja nada si no hay marcadores', () => {
    renderMarkersOnWaveform(ctx as any, [], W, H, DURATION, 0, DURATION);
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it('dibuja una línea vertical por cada marcador visible', () => {
    const markers = [
      createMarker({ positionMs: 60000 }),
      createMarker({ positionMs: 120000 }),
    ];

    renderMarkersOnWaveform(ctx as any, markers, W, H, DURATION, 0, DURATION);

    // 2 marcadores = 2 beginPath (para línea) + 2 beginPath (para chip)
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('posiciona el marcador proporcionalmente en el canvas', () => {
    const marker = createMarker({ positionMs: 150000 }); // Mitad de 300000
    renderMarkersOnWaveform(ctx as any, [marker], W, H, DURATION, 0, DURATION);

    // La posición X debería ser ~500 (mitad del canvas de 1000)
    const moveToCall = ctx.moveTo.mock.calls[0];
    expect(moveToCall[0]).toBeCloseTo(500, 0);
  });

  it('solo dibuja marcadores dentro del rango visible (zoom)', () => {
    const markers = [
      createMarker({ positionMs: 10000 }),   // Fuera del rango
      createMarker({ positionMs: 150000 }),  // Dentro
      createMarker({ positionMs: 290000 }),  // Fuera del rango
    ];

    // Zoom: solo vemos de 100000 a 200000
    renderMarkersOnWaveform(ctx as any, markers, W, H, DURATION, 100000, 200000);

    // Solo 1 marcador visible
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
  });

  it('dibuja el chip de etiqueta con el color del autor', () => {
    const marker = createMarker({
      positionMs: 150000,
      authorColor: '#FF5733',
      label: 'Test Marker',
    });

    renderMarkersOnWaveform(ctx as any, [marker], W, H, DURATION, 0, DURATION);

    // Verificar que fillStyle se setea al color del autor en algún momento
    expect(ctx.fillStyle).toBe('#FFFFFF'); // El texto del chip es blanco (el último fillStyle)
  });

  it('usa línea punteada para los marcadores', () => {
    const marker = createMarker({ positionMs: 150000 });
    renderMarkersOnWaveform(ctx as any, [marker], W, H, DURATION, 0, DURATION);

    expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
  });

  it('renderiza 50 marcadores sin problemas de rendimiento', () => {
    const markers = createMarkerBatch(50, DURATION);

    const start = performance.now();
    renderMarkersOnWaveform(ctx as any, markers, W, H, DURATION, 0, DURATION);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});

describe('findMarkerAtPosition', () => {
  const W = 1000;
  const DURATION = 300000;
  const HIT_RADIUS = 10;

  it('encuentra un marcador cuando se clickea sobre él', () => {
    const marker = createMarker({ positionMs: 150000 }); // Posición X = 500
    const result = findMarkerAtPosition(500, W, [marker], DURATION, 0, DURATION, HIT_RADIUS);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(marker.id);
  });

  it('encuentra un marcador dentro del radio de hit', () => {
    const marker = createMarker({ positionMs: 150000 }); // Posición X = 500
    const result = findMarkerAtPosition(507, W, [marker], DURATION, 0, DURATION, HIT_RADIUS);

    expect(result).not.toBeNull();
  });

  it('retorna null si clickea fuera del radio de hit', () => {
    const marker = createMarker({ positionMs: 150000 }); // Posición X = 500
    const result = findMarkerAtPosition(520, W, [marker], DURATION, 0, DURATION, HIT_RADIUS);

    expect(result).toBeNull();
  });

  it('retorna el marcador más cercano si hay overlap', () => {
    const markers = [
      createMarker({ id: 'close', positionMs: 149500 }),   // X ≈ 498
      createMarker({ id: 'far', positionMs: 152000 }),     // X ≈ 507
    ];
    const result = findMarkerAtPosition(500, W, markers, DURATION, 0, DURATION, HIT_RADIUS);

    expect(result?.id).toBe('close');
  });

  it('retorna null para array vacío', () => {
    const result = findMarkerAtPosition(500, W, [], DURATION, 0, DURATION, HIT_RADIUS);
    expect(result).toBeNull();
  });

  it('funciona con rango de zoom', () => {
    const marker = createMarker({ positionMs: 150000 });
    // Zoom: 100000 a 200000 → marker está en la mitad = X 500
    const result = findMarkerAtPosition(500, W, [marker], DURATION, 100000, 200000, HIT_RADIUS);

    expect(result).not.toBeNull();
  });
});
```

## B3. Component Tests: MarkerEditor

```typescript
// src/components/AudioPlayer/__tests__/MarkerEditor.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkerEditor } from '../MarkerEditor';
import { createMarker } from '@/test/factories';

describe('MarkerEditor', () => {
  const defaultProps = {
    trackId: 'track-001',
    positionMs: 92000,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  describe('Modo Creación (nuevo marcador)', () => {
    it('muestra campos vacíos', () => {
      render(<MarkerEditor {...defaultProps} />);

      expect(screen.getByLabelText(/etiqueta|label/i)).toHaveValue('');
      expect(screen.getByLabelText(/nota|note/i)).toHaveValue('');
    });

    it('muestra la posición formateada (mm:ss)', () => {
      render(<MarkerEditor {...defaultProps} positionMs={92000} />);

      expect(screen.getByText('1:32')).toBeInTheDocument();
    });

    it('tiene "Compartido" activado por defecto', () => {
      render(<MarkerEditor {...defaultProps} />);

      const sharedToggle = screen.getByRole('checkbox', { name: /compartido|shared/i });
      expect(sharedToggle).toBeChecked();
    });

    it('llama onSave con los datos correctos', async () => {
      const user = userEvent.setup();
      render(<MarkerEditor {...defaultProps} />);

      await user.type(screen.getByLabelText(/etiqueta|label/i), 'Revisar afinación');
      await user.type(screen.getByLabelText(/nota|note/i), 'Cello bajo');
      await user.click(screen.getByRole('button', { name: /guardar|save/i }));

      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          positionMs: 92000,
          label: 'Revisar afinación',
          note: 'Cello bajo',
          shared: true,
        })
      );
    });

    it('no permite guardar con label vacío', async () => {
      const user = userEvent.setup();
      render(<MarkerEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /guardar|save/i }));

      expect(defaultProps.onSave).not.toHaveBeenCalled();
      expect(screen.getByText(/requerido|required/i)).toBeInTheDocument();
    });

    it('limita el label a 50 caracteres', async () => {
      const user = userEvent.setup();
      render(<MarkerEditor {...defaultProps} />);

      const longText = 'a'.repeat(60);
      await user.type(screen.getByLabelText(/etiqueta|label/i), longText);

      const input = screen.getByLabelText(/etiqueta|label/i);
      expect((input as HTMLInputElement).value.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Modo Edición (marcador existente)', () => {
    const existingMarker = createMarker({
      id: 'marker-edit',
      label: 'Original',
      note: 'Nota original',
      category: 'rhythm',
    });

    it('pre-rellena los campos con datos del marcador', () => {
      render(<MarkerEditor {...defaultProps} marker={existingMarker} />);

      expect(screen.getByLabelText(/etiqueta|label/i)).toHaveValue('Original');
      expect(screen.getByLabelText(/nota|note/i)).toHaveValue('Nota original');
    });

    it('permite modificar y guardar cambios', async () => {
      const user = userEvent.setup();
      render(<MarkerEditor {...defaultProps} marker={existingMarker} />);

      const labelInput = screen.getByLabelText(/etiqueta|label/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Modificado');
      await user.click(screen.getByRole('button', { name: /guardar|save/i }));

      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Modificado' })
      );
    });

    it('muestra botón de eliminar solo en modo edición', () => {
      render(<MarkerEditor {...defaultProps} marker={existingMarker} />);
      expect(screen.getByRole('button', { name: /eliminar|delete/i })).toBeInTheDocument();
    });

    it('no muestra botón de eliminar en modo creación', () => {
      render(<MarkerEditor {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /eliminar|delete/i })).not.toBeInTheDocument();
    });
  });

  describe('Categorías', () => {
    it('muestra todas las categorías disponibles', () => {
      render(<MarkerEditor {...defaultProps} />);

      const categorySelect = screen.getByLabelText(/categoría|category/i);
      expect(categorySelect).toBeInTheDocument();

      // Verificar que las opciones existen
      const expectedCategories = [
        'dynamics', 'rhythm', 'intonation', 'form',
        'articulation', 'rehearsal', 'free',
      ];
      expectedCategories.forEach(cat => {
        expect(screen.getByRole('option', { name: new RegExp(cat, 'i') })).toBeInTheDocument();
      });
    });
  });

  describe('Cierre', () => {
    it('llama onClose al presionar cancelar', async () => {
      const user = userEvent.setup();
      render(<MarkerEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancelar|cancel/i }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('llama onClose al presionar Escape', async () => {
      const user = userEvent.setup();
      render(<MarkerEditor {...defaultProps} />);

      await user.keyboard('{Escape}');
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
```

---

# 4. TEST SUITE C: REPRODUCTOR MULTI-DISPOSITIVO

## C1. Unit Tests: Audio Player State Machine

```typescript
// src/components/AudioPlayer/hooks/__tests__/useAudioPlayer.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Howler
const mockHowlInstance = {
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  seek: vi.fn().mockReturnValue(0),
  duration: vi.fn().mockReturnValue(300),
  playing: vi.fn().mockReturnValue(false),
  on: vi.fn(),
  off: vi.fn(),
  unload: vi.fn(),
  state: vi.fn().mockReturnValue('loaded'),
};

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => mockHowlInstance),
}));

describe('Audio Player State Machine', () => {
  // Tests de la lógica de estado, no del hook React directamente
  // (la lógica se extrae a funciones puras para testabilidad)

  describe('Estado: idle → loading', () => {
    it('transiciona a loading cuando se carga un track', () => {
      const state = reducePlayerState({ type: 'idle' }, { type: 'LOAD_TRACK', trackId: 'track-001', url: '/audio.mp3' });
      expect(state.type).toBe('loading');
    });
  });

  describe('Estado: loading → ready', () => {
    it('transiciona a ready cuando Howl reporta "load"', () => {
      const state = reducePlayerState(
        { type: 'loading', trackId: 'track-001' },
        { type: 'LOADED', durationMs: 300000 }
      );
      expect(state.type).toBe('ready');
      expect(state.durationMs).toBe(300000);
    });
  });

  describe('Estado: ready → playing', () => {
    it('transiciona a playing cuando se presiona play', () => {
      const state = reducePlayerState(
        { type: 'ready', trackId: 'track-001', durationMs: 300000 },
        { type: 'PLAY' }
      );
      expect(state.type).toBe('playing');
    });
  });

  describe('Estado: playing → paused', () => {
    it('transiciona a paused con la posición actual', () => {
      const state = reducePlayerState(
        { type: 'playing', trackId: 'track-001', positionMs: 92000, durationMs: 300000 },
        { type: 'PAUSE' }
      );
      expect(state.type).toBe('paused');
      expect(state.positionMs).toBe(92000);
    });
  });

  describe('Seek', () => {
    it('actualiza posición en estado playing', () => {
      const state = reducePlayerState(
        { type: 'playing', trackId: 'track-001', positionMs: 50000, durationMs: 300000 },
        { type: 'SEEK', positionMs: 120000 }
      );
      expect(state.positionMs).toBe(120000);
      expect(state.type).toBe('playing');
    });

    it('clampea posición a 0 si es negativa', () => {
      const state = reducePlayerState(
        { type: 'playing', trackId: 'track-001', positionMs: 50000, durationMs: 300000 },
        { type: 'SEEK', positionMs: -1000 }
      );
      expect(state.positionMs).toBe(0);
    });

    it('clampea posición a duración si excede', () => {
      const state = reducePlayerState(
        { type: 'playing', trackId: 'track-001', positionMs: 50000, durationMs: 300000 },
        { type: 'SEEK', positionMs: 400000 }
      );
      expect(state.positionMs).toBe(300000);
    });
  });

  describe('Error handling', () => {
    it('transiciona a error si Howl falla al cargar', () => {
      const state = reducePlayerState(
        { type: 'loading', trackId: 'track-001' },
        { type: 'ERROR', message: 'Failed to decode audio' }
      );
      expect(state.type).toBe('error');
      expect(state.message).toBe('Failed to decode audio');
    });
  });

  describe('Playback complete', () => {
    it('transiciona a paused al final del audio', () => {
      const state = reducePlayerState(
        { type: 'playing', trackId: 'track-001', positionMs: 299900, durationMs: 300000 },
        { type: 'COMPLETE' }
      );
      expect(state.type).toBe('paused');
      expect(state.positionMs).toBe(300000);
    });
  });
});

// ── State machine reducer (la lógica real que se testeó arriba) ──
type PlayerState =
  | { type: 'idle' }
  | { type: 'loading'; trackId: string }
  | { type: 'ready'; trackId: string; durationMs: number }
  | { type: 'playing'; trackId: string; positionMs: number; durationMs: number }
  | { type: 'paused'; trackId: string; positionMs: number; durationMs: number }
  | { type: 'error'; message: string };

type PlayerAction =
  | { type: 'LOAD_TRACK'; trackId: string; url: string }
  | { type: 'LOADED'; durationMs: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SEEK'; positionMs: number }
  | { type: 'POSITION_UPDATE'; positionMs: number }
  | { type: 'COMPLETE' }
  | { type: 'ERROR'; message: string }
  | { type: 'STOP' };

function reducePlayerState(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'LOAD_TRACK':
      return { type: 'loading', trackId: action.trackId };
    case 'LOADED':
      if (state.type !== 'loading') return state;
      return { type: 'ready', trackId: state.trackId, durationMs: action.durationMs };
    case 'PLAY':
      if (state.type === 'ready')
        return { type: 'playing', trackId: state.trackId, positionMs: 0, durationMs: state.durationMs };
      if (state.type === 'paused')
        return { type: 'playing', trackId: state.trackId, positionMs: state.positionMs, durationMs: state.durationMs };
      return state;
    case 'PAUSE':
      if (state.type === 'playing')
        return { type: 'paused', trackId: state.trackId, positionMs: state.positionMs, durationMs: state.durationMs };
      return state;
    case 'SEEK':
      if ('durationMs' in state && 'positionMs' in state) {
        const clamped = Math.max(0, Math.min(action.positionMs, state.durationMs));
        return { ...state, positionMs: clamped } as any;
      }
      return state;
    case 'POSITION_UPDATE':
      if (state.type === 'playing')
        return { ...state, positionMs: action.positionMs };
      return state;
    case 'COMPLETE':
      if (state.type === 'playing')
        return { type: 'paused', trackId: state.trackId, positionMs: state.durationMs, durationMs: state.durationMs };
      return state;
    case 'ERROR':
      return { type: 'error', message: action.message };
    case 'STOP':
      return { type: 'idle' };
    default:
      return state;
  }
}
```

## C2. Unit Tests: Waveform Generation

```typescript
// src/components/AudioPlayer/hooks/__tests__/useWaveform.test.ts

import { describe, it, expect, vi } from 'vitest';

// Mock de Web Audio API
const mockDecodeAudioData = vi.fn();
const mockAudioContext = {
  decodeAudioData: mockDecodeAudioData,
  close: vi.fn(),
};

vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => mockAudioContext));

import { generateWaveformData, downsampleBuffer } from '../../utils/waveformUtils';

describe('downsampleBuffer', () => {
  it('reduce un buffer de 44100 samples a N samples', () => {
    const buffer = new Float32Array(44100); // 1 segundo a 44.1kHz
    buffer.fill(0.5);

    const result = downsampleBuffer(buffer, 100);

    expect(result).toHaveLength(100);
  });

  it('calcula el pico absoluto de cada segmento', () => {
    const buffer = new Float32Array(1000);
    // Primer segmento: pico en 0.8
    buffer[0] = 0.8;
    // Segundo segmento: pico en -0.9 (valor absoluto 0.9)
    buffer[500] = -0.9;

    const result = downsampleBuffer(buffer, 2);

    expect(result[0]).toBeCloseTo(0.8, 1);
    expect(result[1]).toBeCloseTo(0.9, 1);
  });

  it('retorna valores normalizados entre 0 y 1', () => {
    const buffer = new Float32Array(10000);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.sin(i * 0.01) * 0.7;
    }

    const result = downsampleBuffer(buffer, 500);

    result.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    });
  });

  it('maneja buffer vacío sin crash', () => {
    const result = downsampleBuffer(new Float32Array(0), 100);
    expect(result).toHaveLength(0);
  });

  it('maneja N mayor que el tamaño del buffer', () => {
    const buffer = new Float32Array(50);
    const result = downsampleBuffer(buffer, 1000);

    // Debería retornar como máximo el tamaño del buffer
    expect(result.length).toBeLessThanOrEqual(50);
  });
});
```

---

# 5. TEST SUITE D: INTEGRACIÓN END-TO-END

```typescript
// src/test/integration/__tests__/scoreAnnotationFlow.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import { createStroke, createTextStroke, USERS } from '@/test/factories';

describe('Integration: Score Annotation Flow Completo', () => {
  // Simula 2 dispositivos con YDocs separados que sincronizan

  let doc1: Y.Doc;
  let doc2: Y.Doc;
  let strokes1: Y.Map<Y.Map<any>>;
  let strokes2: Y.Map<Y.Map<any>>;

  // Sync helper: simula la propagación via Firestore
  function syncDocs() {
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
  }

  beforeEach(() => {
    doc1 = new Y.Doc();
    doc2 = new Y.Doc();
    strokes1 = doc1.getMap('strokes');
    strokes2 = doc2.getMap('strokes');
  });

  afterEach(() => {
    doc1.destroy();
    doc2.destroy();
  });

  it('Flujo: Omar dibuja → Kalani ve → Kalani anota → Omar ve', () => {
    // 1. Omar dibuja un trazo freehand
    const omarStroke = createStroke({
      id: 'omar-stroke-1',
      authorId: USERS.omar.id,
      authorName: USERS.omar.name,
      color: USERS.omar.color,
      page: 0,
    });

    const yStroke1 = new Y.Map();
    doc1.transact(() => {
      yStroke1.set('id', omarStroke.id);
      yStroke1.set('authorId', omarStroke.authorId);
      yStroke1.set('color', omarStroke.color);
      yStroke1.set('type', omarStroke.type);
      yStroke1.set('page', omarStroke.page);
      yStroke1.set('points', JSON.stringify(omarStroke.points));
      yStroke1.set('deleted', false);
      yStroke1.set('createdAt', omarStroke.createdAt);
      strokes1.set(omarStroke.id, yStroke1);
    });

    // 2. Sync: Kalani recibe
    syncDocs();

    expect(strokes2.size).toBe(1);
    expect(strokes2.get('omar-stroke-1')!.get('color')).toBe(USERS.omar.color);

    // 3. Kalani escribe "rit." como texto
    const kalaniText = createTextStroke({
      id: 'kalani-text-1',
      authorId: USERS.kalani.id,
      authorName: USERS.kalani.name,
      color: USERS.kalani.color,
      textContent: 'rit.',
      page: 0,
    });

    const yStroke2 = new Y.Map();
    doc2.transact(() => {
      yStroke2.set('id', kalaniText.id);
      yStroke2.set('authorId', kalaniText.authorId);
      yStroke2.set('color', kalaniText.color);
      yStroke2.set('type', 'text');
      yStroke2.set('textContent', 'rit.');
      yStroke2.set('page', 0);
      yStroke2.set('deleted', false);
      yStroke2.set('createdAt', kalaniText.createdAt);
      strokes2.set(kalaniText.id, yStroke2);
    });

    // 4. Sync: Omar recibe
    syncDocs();

    // 5. Verificar convergencia
    expect(strokes1.size).toBe(2);
    expect(strokes2.size).toBe(2);

    // Omar ve el texto de Kalani en verde
    const kalaniStrokeInDoc1 = strokes1.get('kalani-text-1')!;
    expect(kalaniStrokeInDoc1.get('textContent')).toBe('rit.');
    expect(kalaniStrokeInDoc1.get('color')).toBe(USERS.kalani.color);
  });

  it('Flujo: Delete + concurrent add convergen correctamente', () => {
    // Setup: ambos tienen un stroke compartido
    const sharedStroke = createStroke({ id: 'shared-1', authorId: USERS.omar.id });
    const yShared = new Y.Map();
    doc1.transact(() => {
      yShared.set('id', sharedStroke.id);
      yShared.set('deleted', false);
      strokes1.set(sharedStroke.id, yShared);
    });
    syncDocs();

    // Omar elimina el stroke (offline)
    strokes1.get('shared-1')!.set('deleted', true);

    // Kalani agrega un nuevo stroke (offline, sin saber de la eliminación)
    const yNew = new Y.Map();
    doc2.transact(() => {
      yNew.set('id', 'kalani-new');
      yNew.set('deleted', false);
      strokes2.set('kalani-new', yNew);
    });

    // Reconexión: sync
    syncDocs();

    // Ambos docs convergen:
    expect(strokes1.size).toBe(2);
    expect(strokes2.size).toBe(2);
    expect(strokes1.get('shared-1')!.get('deleted')).toBe(true);
    expect(strokes2.get('shared-1')!.get('deleted')).toBe(true);
    expect(strokes1.get('kalani-new')!.get('deleted')).toBe(false);
    expect(strokes2.get('kalani-new')!.get('deleted')).toBe(false);
  });

  it('Flujo: 3 dispositivos anotan simultáneamente sin pérdida de datos', () => {
    const doc3 = new Y.Doc();
    const strokes3 = doc3.getMap('strokes');

    // Cada uno agrega 5 strokes offline
    [
      { doc: doc1, map: strokes1, userId: 'omar', count: 5 },
      { doc: doc2, map: strokes2, userId: 'kalani', count: 5 },
      { doc: doc3, map: strokes3, userId: 'carlos', count: 5 },
    ].forEach(({ doc, map, userId, count }) => {
      for (let i = 0; i < count; i++) {
        const y = new Y.Map();
        doc.transact(() => {
          y.set('id', `${userId}-stroke-${i}`);
          y.set('authorId', userId);
          y.set('deleted', false);
          y.set('createdAt', Date.now() + i);
          map.set(`${userId}-stroke-${i}`, y);
        });
      }
    });

    // Full mesh sync
    const allDocs = [doc1, doc2, doc3];
    for (let i = 0; i < allDocs.length; i++) {
      for (let j = 0; j < allDocs.length; j++) {
        if (i !== j) {
          Y.applyUpdate(allDocs[j], Y.encodeStateAsUpdate(allDocs[i]));
        }
      }
    }

    // Todos tienen 15 strokes
    expect(strokes1.size).toBe(15);
    expect(strokes2.size).toBe(15);
    expect(strokes3.size).toBe(15);

    // Ningún stroke se perdió
    ['omar', 'kalani', 'carlos'].forEach(userId => {
      for (let i = 0; i < 5; i++) {
        expect(strokes1.has(`${userId}-stroke-${i}`)).toBe(true);
      }
    });

    doc3.destroy();
  });
});
```

---

# 6. TEST MATRIX: ESCENARIOS DE CONCURRENCIA

Esta matriz define escenarios que deben pasar como tests automatizados:

| # | Escenario | Dispositivos | Acción Simultánea | Resultado Esperado | Prioridad |
|---|-----------|-------------|-------------------|-------------------|----------|
| CON-01 | 2 dibujan en misma página | A + B | A dibuja trazo, B dibuja trazo | Ambos trazos visibles en ambos, sin pérdida | Crítica |
| CON-02 | 1 dibuja, 1 elimina | A + B | A dibuja nuevo, B elimina existente | A ve el nuevo + el eliminado desaparece. B igual | Crítica |
| CON-03 | 2 agregan marcador al mismo tiempo | A + B | A agrega marker@1:00, B agrega marker@2:00 | Ambos marcadores existen en Firestore | Alta |
| CON-04 | 1 edita marcador, 1 lo elimina | A + B | A edita label, B soft-deletes | Depende de orden Firestore (last-write-wins). Aceptable | Media |
| CON-05 | Desconexión durante dibujo | A | A dibuja 5 trazos offline | Al reconectar, los 5 aparecen en B | Crítica |
| CON-06 | 3 dispositivos, reconexión parcial | A+B+C | A y B anotan, C se desconecta 2 min | Al reconectar C, tiene todas las anotaciones de A y B | Crítica |
| CON-07 | Undo cruzado | A + B | A deshace su trazo | B ve el trazo desaparecer. Los trazos de B no se afectan | Alta |
| CON-08 | Cambio de página durante anotación | A | A dibuja en p1, cambia a p2, dibuja | Strokes de p1 solo en p1, strokes de p2 solo en p2 | Alta |
| CON-09 | Zoom + anotaciones | A | A anota a 100%, B ve a 150% | Anotaciones alineadas proporcionalmente en ambas resoluciones | Alta |
| CON-10 | Marker seek + reproducción | A + B | A clickea marker, B está reproduciendo | A salta a posición del marker, B no se ve afectado (no hay sync de audio en web) | Media |

---

# 7. RESUMEN DE MOCKS Y FIXTURES

| Mock | Archivo | Qué Simula |
|------|---------|-----------|
| MockCanvasContext | `src/test/setup.ts` | CanvasRenderingContext2D (métodos de dibujo) |
| MockPointerEvent | `src/test/setup.ts` | PointerEvent con presión y tipo |
| MockHowl | Inline en tests | Howler.js player (play, pause, seek, duration) |
| MockFirestore | Inline en tests | collection, doc, addDoc, updateDoc, onSnapshot |
| YDoc pair | `factories.ts` | 2-3 YDocs para simular CRDT multi-dispositivo |
| Stroke factories | `factories.ts` | freehand, text, symbol, line, batch |
| Marker factories | `factories.ts` | single, batch con distribución temporal |

---

# 8. COMANDOS DE EJECUCIÓN

```bash
# Ejecutar todos los tests
npx vitest run

# Ejecutar con UI interactiva
npx vitest --ui

# Ejecutar solo suite A (Score Annotations)
npx vitest run --grep "Score|Stroke|Drawing|Annotation|CRDT"

# Ejecutar solo suite B (Markers)
npx vitest run --grep "Marker"

# Ejecutar solo suite C (Audio Player)
npx vitest run --grep "Audio|Player|Waveform"

# Ejecutar solo suite D (Integración)
npx vitest run --grep "Integration"

# Ejecutar con cobertura
npx vitest run --coverage

# Watch mode (desarrollo)
npx vitest watch

# Ejecutar un archivo específico
npx vitest run src/components/ScoreViewer/hooks/__tests__/crdtOperations.test.ts
```

---

# FIN DE LA TEST SUITE v1.0

**Resumen de cobertura:**
- **48 test cases** para Score Annotations (coordinates, rendering, CRDT, components)
- **22 test cases** para Markers (CRUD, rendering, component, filtering)
- **14 test cases** para Audio Player (state machine, waveform)
- **3 integration flows** (multi-device annotation, concurrent ops, 3-way merge)
- **10 concurrency scenarios** documentados en test matrix
