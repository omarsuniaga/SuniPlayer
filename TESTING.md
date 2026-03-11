# TESTING.md — SuniPlayer Testing Strategy

## Proposito

SuniPlayer es una herramienta orientada a performance en vivo. Un fallo durante un show no es un bug menor: es un riesgo de producto. Esta estrategia separa claramente lo que hoy puede validarse en el repo de lo que se quiere alcanzar en la siguiente etapa.

---

## 1. Estado actual de validacion

Hoy el repositorio cuenta con una validacion automatizada base ya operativa.

### Disponible hoy

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run validate`
- GitHub Actions base ejecutando `npm run validate`

### No implementado aun como sistema estable de validacion

- CI automatizada para quality gates

### Implicacion

Hoy la validacion real del proyecto depende principalmente de:

- lint, typecheck, test y build exitosos
- revision manual
- comprobacion funcional del flujo principal en desarrollo

---

## 2. Gaps actuales

Antes de hablar de autonomia fuerte o calidad repetible, el proyecto necesita:

1. ampliar la cobertura de tests automatizados
2. cubrir mejor flujos de player y persistencia
3. endurecer los quality gates para cambios de arquitectura
4. incorporar reportes mas claros de regresion
5. sumar pruebas de escenarios mas cercanos a show real

Hasta entonces, cualquier afirmacion de calidad debe entenderse como parcial.

---

## 3. Estrategia minima inmediata

Esta es la estrategia recomendada para la etapa actual del proyecto.

### 3.1 Validacion tecnica minima

- lint, typecheck, test y build deben pasar siempre
- cambios de contratos de datos deben revisarse manualmente
- cambios en flujo builder > player > history deben verificarse manualmente

### 3.2 Escenarios manuales criticos actuales

Antes de considerar aceptable un cambio importante, deberia comprobarse manualmente:

- [ ] la app abre sin errores visibles
- [ ] puedo generar un set de 45 minutos
- [ ] el set cae dentro de la tolerancia esperada
- [ ] puedo enviar el set al player
- [ ] play / pause funcionan en la simulacion actual
- [ ] next / previous funcionan
- [ ] el timer avanza correctamente
- [ ] historial guarda y muestra sets del prototipo
- [ ] no se rompe el flujo al cambiar entre builder, player e historial

### 3.3 Areas mas sensibles hoy

- algoritmo de set builder
- consistencia de tiempos y duraciones
- store global y flujo de cola
- integridad del historial
- legibilidad de la UI en modo escenario

---

## 4. Estrategia objetivo de testing

Con la base actual de validacion ya disponible, la estrategia debe evolucionar a este modelo.

### 4.1 Prioridades de testing

1. zero-crash en flujo critico
2. integridad de datos
3. exactitud del set builder
4. fiabilidad del player
5. correccion de la UI

### 4.2 Tipos de tests objetivo

#### Unit tests

Cubren:

- servicios de generacion de sets
- stores de Zustand
- utilidades de tiempo y formato
- mapeos de datos y contratos

#### Integration tests

Cubren:

- generar set > enviar al player > reproducir
- guardar set > recuperar historial
- cambiar track > mantener consistencia de cola y timer

#### Smoke tests

Cubren:

- la app arranca
- las vistas principales renderizan
- el flujo principal no se rompe de inmediato

#### Manual scenario tests

Cubren:

- set de 45 min
- cambio de track en mitad del flujo
- reordenamiento o seleccion de cola
- reinicio de sesion
- recuperacion de estado
- importacion de archivos o carpeta local sin romper el builder

---

## 5. Definition of Done de validacion

Una tarea no deberia considerarse totalmente validada si no cumple lo siguiente, segun las capacidades disponibles del repo.

### Hoy

- `npm run build` pasa
- el flujo manual afectado fue comprobado
- no contradice `MVP_SCOPE.md`
- no rompe contratos documentados en `DATA_MODEL.md` o `DECISIONS.md`

### Objetivo proximo

- `npm run lint` pasa
- `npm run typecheck` pasa
- `npm run test` pasa
- `npm run build` pasa
- se actualizaron docs si hubo cambio estructural

---

## 6. Escenarios criticos del MVP

Estos escenarios vienen del caracter de herramienta de escenario y deben protegerse incluso antes de tener gran cobertura automatizada.

- generar un set de 45 min dentro de tolerancia
- enviar el set al player sin perder datos
- reproducir y navegar por la cola sin inconsistencias
- mostrar tiempo restante del set
- conservar sets guardados en el flujo oficial
- evitar errores catastroficos en mitad del uso

---

## 7. Primeros tests recomendados

Cuando se incorpore el runner de tests, los primeros casos deberian concentrarse en el core del producto.

### Set builder

- genera set dentro de tolerancia
- no devuelve set vacio si hay tracks
- respeta maximo de tracks
- respeta curvas de energia
- no repite tracks en el mismo set

### Store principal

- enviar set al player resetea posicion y timer correctamente
- guardar set agrega entrada al historial
- cambiar track actual actualiza el estado esperado
- persistir contexto ligero del player sin reanudar playback automaticamente

### Audio hook

- entra en modo simulacion cuando falla `play()` del navegador
- sale de simulacion cuando el track emite `canplay`

### Player

- renderiza estado vacio sin queue cargada
- renderiza metadata del track actual cuando hay queue

### Utilidades

- formato de tiempo consistente
- conversion de duraciones consistente
- deteccion de archivos de audio soportados y parsing de nombres

---

## 8. Metricas objetivo

| Metrica | Objetivo inicial | Estado actual |
|---------|------------------|---------------|
| Build estable | 100% en cambios normales | Operativo |
| Type errors | 0 | Operativo |
| Lint warnings | 0 | Operativo |
| Cobertura de tests | > 80% en core con el tiempo | Inicial |
| Fallos criticos de flujo | 0 en prueba manual seria | Pendiente |

---

## 9. Nota de plataforma

Si el proyecto migra formalmente a Expo / React Native, esta estrategia debera adaptarse a esa plataforma. Hasta que esa decision quede tomada en `DECISIONS.md`, este documento debe priorizar la realidad actual del repo.
