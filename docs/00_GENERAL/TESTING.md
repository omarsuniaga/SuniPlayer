# TESTING.md — SuniPlayer Testing Strategy

## Propósito

SuniPlayer es una herramienta de performance en vivo. Un fallo en flujo crítico no es un detalle: afecta la experiencia de escenario. Esta guía separa la validación **realmente disponible hoy** de la estrategia objetivo.

---

## 1. Estado actual de validación

La base de validación operativa del repo hoy gira alrededor de `pnpm`.

### Scripts disponibles

- `pnpm lint:web`
- `pnpm typecheck:web`
- `pnpm test:web`
- `pnpm build:web`
- `pnpm validate:core`
- `pnpm validate:web`
- `pnpm validate:native`
- `pnpm validate`

### Qué valida cada uno

- **core**: typecheck + tests del dominio compartido
- **web**: lint + typecheck + test + build
- **native**: typecheck + test + `expo doctor`
- **validate**: ejecuta core + web + native como gate principal

### Qué NO asumir

- `build` raíz **no** equivale a un build nativo completo
- `validate:native` no reemplaza una prueba real en dispositivo
- una validación verde no elimina la necesidad de revisar escenarios de show

---

## 2. Estrategia mínima inmediata

Antes de considerar aceptable un cambio importante, debería quedar cubierto al menos esto:

- la app arranca sin errores visibles
- el builder genera un set dentro de tolerancia
- el set se puede enviar al player
- play / pause / next / previous funcionan
- el timer avanza correctamente
- el historial conserva el contexto esperado
- la recarga no borra silenciosamente una sesión de show
- los contratos compartidos no se rompen entre web y native

---

## 3. Escenarios críticos manuales

### Builder

- generar un set de 45 minutos
- respetar tolerancia y filtros de venue / BPM / mood
- evitar duplicación de tracks dentro del mismo show

### Player

- recibir el set desde el builder
- navegar la cola sin inconsistencias
- mantener timer y track actual en sincronía

### Persistencia

- conservar contexto ligero del player
- conservar shows o sets guardados
- restaurar la última sesión sin reanudar playback automáticamente

### Native

- `expo doctor` no reporta problemas del repo
- `typecheck` y tests de native siguen limpios
- el flujo principal no depende de supuestos de web-only

---

## 4. Estrategia objetivo

### Prioridades

1. zero-crash en flujo crítico
2. integridad de datos
3. exactitud del set builder
4. fiabilidad del player
5. coherencia de UI entre superficies

### Tipos de tests objetivo

#### Unit tests

Cubren:

- servicios de generación de sets
- stores compartidos
- utilidades de tiempo y formato
- mapeos de datos y contratos

#### Integration tests

Cubren:

- generar set > enviar al player > reproducir
- guardar show > recuperar historial
- cambiar track > mantener cola y timer

#### Smoke tests

Cubren:

- la app arranca
- las vistas principales renderizan
- el flujo principal no se rompe de inmediato

#### Manual scenario tests

Cubren:

- set de 45 min
- cambio de track en mitad del flujo
- reordenamiento o selección de cola
- reinicio de sesión
- recuperación de estado

---

## 5. Definition of Done de validación

Una tarea no debería considerarse lista si no cumple lo siguiente, según el alcance afectado:

- pasa el script de validación correspondiente
- el flujo manual afectado fue comprobado
- no contradice `MVP_SCOPE.md`
- no rompe contratos documentados en `DATA_MODEL.md` o `DECISIONS.md`
- si cambió comportamiento o arquitectura, se actualizó documentación

---

## 6. Primeros tests recomendados

### Core

- `buildSet` genera sets dentro de tolerancia
- no devuelve sets vacíos si hay material disponible
- respeta máximos y filtros de venue / BPM / mood
- no repite tracks dentro de un mismo show

### Builder store

- enviar set al player resetea estado esperado
- guardar set agrega entrada al historial / show
- cambiar el show activo actualiza exclusiones
- persistir contexto ligero no reanuda playback automáticamente

### Player / audio

- renderiza estado vacío correctamente
- renderiza metadata del track actual cuando hay cola
- mantiene progreso, timer y navegación consistentes

### Utilidades

- formato de tiempo consistente
- conversión de duraciones consistente
- detección de archivos soportados
- cálculo de semitonos consistente

---

## 7. Métricas objetivo

| Métrica | Objetivo inicial | Estado actual |
|---------|------------------|---------------|
| Build web estable | 100% en cambios normales | Operativo |
| Type errors | 0 | Operativo |
| Lint warnings | 0 | Operativo |
| Cobertura de tests | Creciendo, empezando por core | Inicial |
| Fallos críticos de flujo | 0 en prueba manual seria | Pendiente |
