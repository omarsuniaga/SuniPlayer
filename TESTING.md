# TESTING.md — SuniPlayer Testing Strategy

## Filosofia de Testing

SuniPlayer es una herramienta de performance en vivo. Un crash durante un show
no es un "bug menor" — es un desastre profesional. La estrategia de testing
refleja esta realidad.

### Prioridades de testing (en orden)

1. **Zero-crash guarantee**: la app no puede cerrarse inesperadamente
2. **Audio reliability**: la reproduccion no puede interrumpirse
3. **Data integrity**: los sets y la biblioteca no pueden corromperse
4. **UI correctness**: los controles deben hacer lo que dicen

---

## Tipos de Tests

### 1. Unit Tests

Cobertura minima objetivo: 80%

Que cubren:
- Servicios (SetBuilderService, AudioService, DatabaseService)
- Stores de Zustand (audioStore, queueStore, setStore)
- Funciones utilitarias (formateo de tiempo, validaciones, algoritmos)

Donde viven:
```
__tests__/
  services/
    SetBuilderService.test.ts
    AudioService.test.ts
    DatabaseService.test.ts
    SuggestionService.test.ts
  stores/
    audioStore.test.ts
    queueStore.test.ts
    setStore.test.ts
    libraryStore.test.ts
  utils/
    time.test.ts
    duration.test.ts
    validation.test.ts
```

Herramientas:
- Jest 29
- @testing-library/react-native (para componentes)

Ejecucion:
```bash
npm run test              # una vez
npm run test:watch        # modo watch
npm run test:coverage     # con reporte de cobertura
```

### 2. Integration Tests

Que cubren:
- Flujo completo: generar set > cargar en player > reproducir
- Persistencia: guardar set > cerrar app > reabrir > set existe
- Audio: cargar track > play > pause > seek > verificar posicion

Donde viven:
```
__tests__/
  integration/
    set-builder-flow.test.ts
    player-flow.test.ts
    persistence.test.ts
```

### 3. Smoke Tests

Tests rapidos que verifican que la app arranca sin crash.
Se ejecutan en CI en cada push.

```
__tests__/
  smoke/
    app-launches.test.ts
    navigation-works.test.ts
```

### 4. Manual Testing Checklist

Antes de cada "release" (instalar en el telefono para un show):

```
[ ] App abre sin crash
[ ] Puedo ver mi biblioteca de canciones
[ ] Puedo generar un set de 45 minutos
[ ] El set suma correctamente la duracion
[ ] Puedo enviar el set al player
[ ] Play/pause funcionan
[ ] Next/previous funcionan
[ ] El timer cuenta correctamente
[ ] El timer cambia de color a los 5 min y 2 min
[ ] Modo LIVE bloquea la cola
[ ] La app no se cierra al bloquear pantalla
[ ] La app no se cierra al recibir una llamada
[ ] Audio continua con la app en background
[ ] Bateria no se drena excesivamente (>3h de uso)
```

---

## Configuracion de Jest

### jest.config.js

```javascript
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types/**',
    '!src/**/constants/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### jest.setup.js

```javascript
// Mock expo modules that don't work in test environment
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(),
  AudioPlayer: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  readDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));
```

---

## Tests Criticos del SetBuilderService

Estos tests son los mas importantes porque validan el core del producto:

```typescript
describe('SetBuilderService', () => {
  test('genera set dentro de tolerancia de +- 90 segundos', () => {
    const result = buildSet(tracks, 2700, { tolerance: 90 });
    const total = result.reduce((s, t) => s + t.duration, 0);
    expect(total).toBeGreaterThanOrEqual(2610);
    expect(total).toBeLessThanOrEqual(2790);
  });

  test('nunca genera set vacio si hay tracks disponibles', () => {
    const result = buildSet(tracks, 2700);
    expect(result.length).toBeGreaterThan(0);
  });

  test('respeta el maximo de tracks', () => {
    const result = buildSet(tracks, 7200, { max: 10 });
    expect(result.length).toBeLessThanOrEqual(10);
  });

  test('ordena por energia ascendente cuando se pide', () => {
    const result = buildSet(tracks, 2700, { curve: 'ascending' });
    for (let i = 1; i < result.length; i++) {
      expect(result[i].energy).toBeGreaterThanOrEqual(result[i-1].energy);
    }
  });

  test('ordena por energia descendente cuando se pide', () => {
    const result = buildSet(tracks, 2700, { curve: 'descending' });
    for (let i = 1; i < result.length; i++) {
      expect(result[i].energy).toBeLessThanOrEqual(result[i-1].energy);
    }
  });

  test('no repite tracks en el mismo set', () => {
    const result = buildSet(tracks, 2700);
    const ids = result.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

---

## Metricas de Calidad

| Metrica | Objetivo | Donde se mide |
|---------|----------|---------------|
| Cobertura de tests | > 80% lineas | `npm run test:coverage` |
| Zero crashes en show | 0 crashes por show | Testing manual |
| Tiempo de build CI | < 3 minutos | GitHub Actions |
| TypeScript errors | 0 | `npm run typecheck` |
| Lint warnings | 0 | `npm run lint` |
