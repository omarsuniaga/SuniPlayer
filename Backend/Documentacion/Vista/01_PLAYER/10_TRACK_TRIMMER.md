# COMPONENTE: TRACK TRIMMER (Editor de Recortes)

## Propósito
Permitir al músico definir quirúrgicamente los puntos de inicio y fin de una canción. Es vital para eliminar silencios, intros largas o finales innecesarios sin alterar el archivo original.

## Características y Funcionalidades Detalladas

### 1. Interfaz de Edición Visual
- **Mini-Waveform**: Muestra una representación compacta de la onda completa del track.
- **Handles de Recorte (Start/End)**: Dos barras verticales que el músico arrastra para definir la "ventana de reproducción" activa.

### 2. Precisión Temporal
- **Time Scrubbing**: Al arrastrar los handles, se muestra el tiempo exacto (min:seg:ms) de la posición.
- **Zoom de Edición**: Permite ampliar la vista de los extremos para encontrar el punto exacto de un golpe de batería o el inicio de una voz.

### 3. Pre-escucha de Recorte
- **Play from Trim**: Botón para reproducir específicamente los primeros 5 segundos desde el nuevo punto de inicio, permitiendo validar el recorte rápidamente.

## Comportamiento (UX)
- **Persistencia No Destructiva**: Los valores de recorte se guardan en la metadata del track (`startTime`, `endTime`), pero el archivo original permanece intacto. El motor de audio simplemente ignora las partes fuera de este rango.
- **Protección**: Asegura que el punto de "Fin" nunca se posicione antes del punto de "Inicio".

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Los milisegundos de inicio y fin actuales.
- **Acciones (Output)**: Llama a `setTrackTrim` para actualizar el almacenamiento local.

---
*El Track Trimmer es la tijera de precisión que asegura que cada canción empiece y termine exactamente cuando el show lo requiere.*
