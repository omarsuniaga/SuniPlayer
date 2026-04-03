# COMPONENTE: VISUALIZER SECTION (Visualizador de Onda)

## Propósito
Es el centro de retroalimentación visual de SuniPlayer. Su misión es permitir al músico "ver" la música a través de una representación gráfica de la onda sonora (Waveform), facilitando la navegación y la anticipación de cambios rítmicos.

## Elementos y Funcionalidades

### 1. Representación de Onda (Waveform)
- **Renderizado de Alta Performance**: Muestra la amplitud del audio de forma detallada.
- **Progreso Visual**: Una barra o cambio de color que indica exactamente qué parte de la canción está sonando.
- **Interacción (Seek)**: El músico puede tocar cualquier punto de la onda para saltar instantáneamente a esa posición.

### 2. Indicadores de Recorte (Trim Indicators)
- **Zonas de Silencio**: Visualiza las áreas que han sido recortadas (al inicio y al final) mediante el Track Profile, sombreando las partes que no sonarán.

### 3. Marcadores de Performance (Markers)
- **Cue Points**: Muestra líneas verticales sobre la onda que indican secciones críticas (ej: "Solo", "Drop", "Outro").
- **Labels Dinámicos**: Si un marcador tiene nombre, se muestra al pasar el cursor o el cabezal de reproducción.

### 4. Animación de Volumen (RMS/SPL)
- **Respuesta Elástica**: La onda o su contorno pueden pulsar levemente en sincronía con la intensidad del audio (Glow effect).

## Comportamiento (UX)
- **Fluidez**: La animación del progreso debe ser a 60fps para que se sienta natural.
- **Precisión**: El cabezal de reproducción debe estar perfectamente sincronizado con el motor de audio.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Datos de la onda (`waveform_data`), posición actual (`pos`) y duración (`duration_ms`).
- **Acciones (Output)**: Envía comandos de posicionamiento (`setPos`) al motor de audio cuando el músico interactúa con la onda.

---
*La Waveform en SuniPlayer no es un adorno, es la partitura visual del músico moderno.*
