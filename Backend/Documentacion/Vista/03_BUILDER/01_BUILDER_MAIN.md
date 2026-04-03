# VISTA: BUILDER (Generador Inteligente de Sets)

## Propósito
El **Builder** es el cerebro estratégico de SuniPlayer. Su misión es construir automáticamente un setlist balanceado y coherente basándose en parámetros de tiempo, energía y contexto (lugar), eliminando la fatiga de decisión del músico.

## Elementos y Funcionalidades Principales

### 1. Motor de Generación Monte Carlo
- **Algoritmo Probabilístico**: No elige temas al azar; realiza miles de simulaciones para encontrar la combinación de canciones que mejor se ajuste a la duración solicitada y a la curva de energía elegida.
- **Validación de Restricciones**: Asegura que el tiempo total no exceda el margen de error permitido y que no se repitan canciones en el mismo set.

### 2. Configuración de Escenario
- **Target Duration**: Define cuánto debe durar el show (ej: 45 minutos).
- **Curva de Energía**: Define el arco emocional del set (ej: empezar suave y terminar arriba).
- **Venue Type**: Ajusta la agresividad de la selección según el lugar (ej: Lobby de Hotel vs Club Nocturno).

### 3. Vista Previa y Edición
- **Set Generado**: Muestra la lista de temas resultante con su orden y duración parcial.
- **Acción "To Player"**: Una vez que el músico está conforme, el set se envía al reproductor para iniciar el show.

## Comportamiento (UX)
- **Generación Instantánea**: El proceso de cálculo es extremadamente rápido, permitiendo al músico probar diferentes configuraciones en segundos.
- **Feedback Visual**: Un gráfico dinámico muestra la curva de intensidad del set proyectado.

---
*El Builder es el curador digital que prepara el terreno para una performance perfecta.*
