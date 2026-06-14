# FUNCIONAMIENTO TÉCNICO: GRÁFICA DE ONDA (Waveform Engine)

## Propósito
La **Gráfica de Onda** es la interfaz de navegación táctil y visual del audio. Su misión es representar la intensidad sonora (amplitud) y permitir el control preciso del cabezal de reproducción.

## Características y Funcionalidades Detalladas

### 1. Representación Dinámica de Amplitud
- **Muestreo (Sampling)**: El audio se procesa para extraer los picos de amplitud (RMS). La gráfica dibuja estos picos en un elemento `<canvas>` para garantizar 60fps sin sobrecargar el procesador.
- **Colores de Estado (Theming)**: La onda cambia de color según el estado:
    - **Progreso (Past)**: Color vibrante (Cyan/Violet) indicando lo ya reproducido.
    - **Futuro (Remaining)**: Color atenuado o grisáceo.
    - **Zonas de Trim**: Áreas oscurecidas que indican audio recortado que no sonará.

### 2. Navegación y Posicionamiento (Seek Logic)
- **Mapeo de Coordenadas**: Al hacer clic, el motor captura la `x` del evento y calcula:  
  `nuevaPos = (clicX / anchoContenedor) * duracionTotal`.
- **Interacción elástica**: El cabezal de reproducción se desplaza instantáneamente a la nueva posición, sincronizando el motor de audio (`audio.currentTime`) con la visualización.

### 3. Sistema de Zoom (In/Out)
- **Zoom Quirúrgico**: Permite al músico expandir la onda para ver detalles mínimos (ej: un golpe de batería específico) o contraerla para ver el track completo.
- **Ventana de Datos (Sliding Window)**: Cuando el zoom está activo, la gráfica solo renderiza una sección del audio. El scroll lateral permite navegar por esta ventana de tiempo ampliada.
- **Ajuste de Precisión**: El sistema de Seek detecta el nivel de zoom para que un clic en la pantalla corresponda exactamente al milisegundo visualizado, sin importar cuánto aumento tenga la onda.

### 4. Bloqueo de Seguridad (Modo Show)
- **Blindaje de Edición**: Cuando el **Modo Show** está activo, se bloquean las funciones de arrastre de marcadores y edición de recortes (Trims).
- **Protección contra Toques Accidentales**: Se puede configurar una zona muerta o requerir un toque más preciso para el Seek, evitando que un roce accidental en el escenario cambie la posición de la canción.
- **Fijación de Vista**: En Modo Show, el zoom suele resetearse o bloquearse para que el músico siempre tenga la perspectiva completa del track y sepa cuánto falta para terminar.

## Especificaciones de Interacción
- **Click/Tap**: Salto de reproducción (Seek).
- **Double Click (Modo Edit)**: Crear marcador en esa posición.
- **Pinch/Wheel**: Control del nivel de Zoom (si el hardware lo permite).

---
*La gráfica de SuniPlayer no es una imagen estática, es un radar de alta precisión que permite al músico navegar el tiempo de forma física.*
