# FUNCIONAMIENTO TÉCNICO: MARCADORES BURBUJA (Marker Engine)

## Propósito
El **Marker Engine** es el sistema encargado de posicionar, renderizar e interactuar con los puntos de referencia (Cue Points) sobre la waveform. Su diseño está optimizado para la legibilidad a distancia y la precisión táctil.

## Lógica Interna y Detalles de Implementación

### 1. Sistema de Posicionamiento y Hit-Testing
- **Conversión de Espacio**: El motor traduce coordenadas de píxeles (`clientX`) a tiempo de audio (`ms`) basándose en el ancho del contenedor (`rect.width`) y la duración total del track.
- **Margen de Tolerancia (12px)**: Al hacer clic, el sistema ejecuta un "Hit-Test". Si el clic ocurre a menos de 12 píxeles de un marcador existente, prioriza la interacción con el marcador (abrir edición) sobre el salto de reproducción (Seek).

### 2. Capa de Visualización (Marker Layer)
- **Burbujas vs Puntos**: 
    - **MarkerDot**: Un punto fijo en la línea de tiempo.
    - **MarkerBubble**: Una etiqueta flotante que muestra el comentario del marcador.
- **Apilamiento Inteligente (Stacking)**: Si múltiples marcadores residen en la misma posición temporal o muy cercana, el motor calcula un `stackIndex` para desplazarlos verticalmente y evitar que se solapen.

### 3. Animación de Anticipación (Pulse Effect)
- **Lógica de Cercanía**: Las burbujas calculan la `distanceSec` (distancia en segundos hasta el cabezal de reproducción).
- **Parpadeo Preventivo**: Cuando el cabezal está a menos de X segundos (definido en `markerUtils`), la burbuja activa una animación CSS `@keyframes markerPulse` que aumenta su brillo y tamaño, alertando al músico de un cambio inminente (ej: "Solo de Guitarra").

### 4. Ciclo de Vida del Marcador
- **Creación**: Se activa mediante un "Long Press" sobre la waveform. El sistema captura la posición en milisegundos y abre el `MarkerModal`.
- **Edición/Navegación**: El modal permite saltar entre marcadores anteriores y siguientes sin cerrar la interfaz, facilitando la revisión rápida de secciones.
- **Persistencia**: Los marcadores se guardan como un array de objetos dentro de la metadata del track en IndexedDB.

## Estructura de Datos (TrackMarker)
```typescript
{
  id: string;      // UUID único
  posMs: number;   // Posición exacta en milisegundos
  comment: string; // Texto de la burbuja (ej: "Intro", "Corte")
  color?: string;  // Color opcional para categorización visual
}
```

---
*Los marcadores burbuja son el sistema de señalización vial de SuniPlayer, permitiendo al músico "ver el futuro" de la canción antes de que ocurra.*
