# Plan de Inteligencia Musical y Trackeo (SuniAnalytics)

## Objetivo
El objetivo de **SuniAnalytics** es permitir que el sistema aprenda de forma autónoma los gustos y hábitos del usuario. A través del seguimiento de interacciones con las pistas, el sistema calcula un `affinityScore` que ayuda a priorizar canciones en recomendaciones, búsquedas y generación de sets automáticos.

## Métricas Clave

| Métrica | Descripción |
|---------|-------------|
| `playCount` | Número total de veces que una pista ha comenzado a reproducirse. |
| `completePlays` | Número de veces que una pista se ha reproducido hasta el final (o casi hasta el final). |
| `skips` | Número de veces que el usuario ha saltado la pista antes de completarla. |
| `affinityScore` | Valor numérico (0-100) que representa la afinidad del usuario con la pista. 50 es el valor neutral inicial. |

## Lógica de Cálculo

### La Regla del 30% (Skips)
Para evitar falsos positivos en los "skips", se aplica la regla del 30%:
- Si el usuario salta la pista **antes del 30%** de su duración total, se contabiliza como un `skip` real (penaliza afinidad).
- Si el usuario salta la pista **después del 30%**, se considera una escucha parcial aceptable y no se penaliza como un `skip` negativo, aunque tampoco cuenta como `completePlay`.

### Evolución de la Afinidad (`affinityScore`)
La afinidad es un cálculo dinámico basado en el ratio de éxito:
- **Subida**: Cada `completePlay` aumenta el ratio de éxito, moviendo el score hacia 100.
- **Bajada**: Cada `skip` (según la regla del 30%) aumenta la tasa de abandono, moviendo el score hacia 0.
- **Fórmula Base**: `(completePlays / (completePlays + skips)) * 100`.
- **Nuevas Pistas**: Comienzan con un score base de 50 para permitir que el algoritmo les dé una oportunidad inicial.

## Eventos

Los eventos se disparan tanto en la versión Web (Vite/React) como en la versión Native (Expo/React Native).

- `trackStart`: Se dispara inmediatamente cuando el audio comienza a sonar. Incrementa `playCount`.
- `trackEnd`: Se dispara cuando la pista llega a su fin natural. Incrementa `completePlays` y recalcula `affinityScore`.
- `trackSkip`: Se dispara cuando el usuario cambia de pista manualmente. Dependiendo de la posición actual (Regla del 30%), incrementa `skips` y recalcula `affinityScore`.

## Arquitectura

El sistema está centralizado para garantizar consistencia entre plataformas:
1. **Núcleo**: El `AnalyticsService` reside en `@suniplayer/core`. Contiene toda la lógica de cálculo y actualización del estado.
2. **Consumo**: Tanto la App Web como la App Native importan y utilizan este servicio a través del `usePlayerStore` o directamente desde el core.
3. **Persistencia**: Los datos de analíticas se guardan junto con los metadatos de la pista en el almacenamiento local (LocalStorage / AsyncStorage), persistiendo entre sesiones.
