# FUNCIONAMIENTO TÉCNICO: PLAYBACK ENGINE (Motor de Transporte)

## Propósito
El **Playback Engine** orquesta el ciclo de vida de la reproducción (Carga -> Buffer -> Play -> Skip). Su diseño asegura que la transición entre estados sea fluida y sin ruidos técnicos (clics o cortes).

## Lógica Interna y Detalles de Implementación

### 1. Inicio y Pausa "Graceful" (Elegante)
- **Fading Automático**: Al presionar Play o Pause, el sistema no corta el audio de forma binaria. Ejecuta un micro-fade (definido en milisegundos) para evitar picos de corriente en los parlantes y hacer que la entrada/salida sea suave al oído.
- **Gestión de Estado**: Sincroniza el estado visual (`playing: true/false`) con el estado real del hardware de audio, manejando las promesas del navegador para evitar errores de "Autoplay".

### 2. Lógica de Salto (Skip Next/Prev)
- **Preparación de Buffer**: Antes de saltar, el motor verifica si el siguiente track ya está cargado en el canal secundario (A/B).
- **Reset de Posición**: Al saltar, el `ci` (Current Index) se actualiza y la posición (`pos`) vuelve a 0 de forma atómica.
- **Auto-Stop**: Si el track es el último de la lista y el modo "Flow" está apagado, el motor detiene la reproducción y limpia los buffers.

### 3. Sistema de "Flow" (Auto-Next)
- **Detección de Final**: El motor monitorea el tiempo restante (`Remaining`). Cuando llega a 0 (o al punto de Fade Out), dispara automáticamente el comando `SkipNext`.
- **Gapless Playback**: Si no hay crossfade activo, intenta que el silencio entre canciones sea el mínimo posible (determinado por el `playbackGapMs`).

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Comandos desde `PlaybackControls.tsx` y estados del `ProjectStore`.
- **Acciones (Output)**: Manipula directamente los objetos de audio del navegador o del sistema nativo.

---
*El Playback Engine es el director de orquesta que asegura que la música nunca se detenga de forma accidentada.*
