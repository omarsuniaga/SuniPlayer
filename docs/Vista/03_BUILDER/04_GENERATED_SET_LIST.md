# COMPONENTE: GENERATED SET LIST (Lista del Set Proyectado)

## Propósito
Mostrar al músico el resultado detallado de la generación automática. Permite validar el orden de las canciones, la duración acumulada y realizar ajustes manuales antes de confirmar el show.

## Elementos y Funcionalidades Detalladas

### 1. Visualización de Tracks
- **Orden Cronológico**: Cada track tiene un número de orden que representa su posición en el set.
- **Timestamp de Inicio**: Calcula y muestra a qué minuto y segundo del show empezará cada canción (ej: 00:00, 03:45, 07:12).
- **Indicador de Energía**: Muestra sutilmente el nivel de intensidad de cada tema elegido para contrastarlo con el gráfico de curva.

### 2. Contadores de Validación
- **Total Tracks**: Cantidad de canciones seleccionadas.
- **Total Duration**: Suma exacta de las duraciones (respetando los Trims).
- **Desviación (Gap)**: Indica cuánto se alejó el resultado de la duración objetivo (ej: "+1:24 min" o "-0:45 min").

### 3. Edición Rápida
- **Remover Track**: Permite quitar un tema que no convence. El motor recalcula automáticamente los tiempos del resto del set.
- **Reordenar (Drag & Drop)**: Permite cambiar la posición de un tema si el músico prefiere otro orden específico.

## Comportamiento (UX)
- **Scroll Independiente**: La lista puede crecer mucho, por lo que tiene su propia área de scroll para no perder de vista los controles superiores.
- **Acción Maestro**: Incluye el botón **"SEND TO PLAYER"**, que es el puente final para pasar de la planificación a la ejecución.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: El array de tracks `genSet` desde el **BuilderStore**.
- **Acciones (Output)**: Llama a `setPQueue` para transferir los temas al reproductor activo.

---
*La lista generada es el borrador final del show, donde el algoritmo y la intuición del músico se encuentran.*
