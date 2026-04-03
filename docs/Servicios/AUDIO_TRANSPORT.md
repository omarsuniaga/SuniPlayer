# SERVICIO: AUDIO TRANSPORT (Transporte de Audio)

## Propósito
Este servicio es el "controlador de tráfico" de los comandos de reproducción. Su trabajo es asegurar que cuando el músico toca "Play" o "Skip", el motor de audio reaccione de forma natural y segura.

## Funciones Principales
1. **Toggle Playback Gracefully**: Alterna entre reproducir y pausar, pero de forma elegante (puede incluir pequeños fades para no saturar el oído).
2. **Skip Next**: Salta a la siguiente canción del setlist. Maneja la lógica de cargar el nuevo archivo y preparar la reproducción.
3. **Seek (Posicionamiento)**: Permite al músico saltar a cualquier punto de la canción tocando la waveform.
4. **Auto-Next (Flow)**: Cuando una canción termina, este servicio decide si empieza la siguiente automáticamente o si espera a que el músico dé la señal.

## Dependencias
- Se conecta directamente con el **BrowserAudioEngine** (en la web) o el **NativeAudioEngine** (en móvil).
- Lee el estado del **ProjectStore** para saber cuál es el track actual.

---
*El transporte de audio en SuniPlayer no solo mueve el cabezal, mueve el show.*
