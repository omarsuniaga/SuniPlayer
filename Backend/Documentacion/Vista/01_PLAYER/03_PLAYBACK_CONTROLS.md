# COMPONENTE: PLAYBACK CONTROLS (Controles de Transporte)

## Propósito
Proporcionar al músico el control físico directo sobre el flujo del audio. Son los botones de mayor uso durante la performance y deben ser infalibles.

## Elementos y Funcionalidades Detalladas

### 1. Botón PLAY / PAUSE (El Protagonista)
- **Función**: Inicia o detiene la reproducción del track actual.
- **Feedback Visual**: Cambia de icono dinámicamente. En modo "Play", el botón suele pulsar sutilmente o cambiar de color para indicar actividad.
- **Lógica de Entrada/Salida**: Implementa micro-fades para una audición placentera.

### 2. Botones NEXT (Saltar) / PREV (Volver)
- **Next**: Salta al inicio del siguiente track en la cola. Si está en el último track, se detiene o reinicia según la configuración.
- **Prev**: Si el track lleva más de 3 segundos sonando, reinicia el track actual. Si lleva menos, salta al track anterior.

### 3. Botón STOP (Parada Total)
- **Función**: Detiene la reproducción y resetea el cabezal al inicio del track (o al punto de Trim Start).
- **Seguridad**: En Modo Show, este botón puede requerir una doble pulsación para evitar paradas accidentales.

## Comportamiento (UX)
- **Touch Targets Gigantes**: Cada botón tiene un área de impacto mínima de 48dp para ser accionado con guantes o dedos sudorosos.
- **Respuesta Instantánea**: Latencia cero entre el clic y la acción visual.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Estado de reproducción (`playing`) desde el store.
- **Acciones (Output)**: Llama al **Playback Engine** para ejecutar las acciones físicas de audio.

---
*Los controles de transporte son el acelerador y el freno del show en SuniPlayer.*
