# SERVICIO: AUDIO ENGINE (Motor de Renderizado Sonoro)

## Propósito
El **Audio Engine** es el responsable de la generación física del sonido. Actúa como una capa de abstracción sobre la **Web Audio API** (web) y los drivers nativos (móvil), permitiendo un control quirúrgico sobre cada muestra de audio.

## Arquitectura de Nodos (Grafo de Audio)
SuniPlayer construye un grafo de nodos para procesar el sonido antes de que llegue a los parlantes:
1. **Source Node**: El buffer de audio cargado desde el archivo.
2. **Gain Node (Track)**: Aplica la compensación individual (`gainOffset`).
3. **Fader Node**: Maneja los desvanecimientos automáticos (Fade In/Out).
4. **Master Gain Node**: Controlado por el slider de volumen maestro.
5. **Analyser Node**: Extrae datos en tiempo real para alimentar la Waveform y el medidor SPL.
6. **Destination**: La salida física (parlantes o auriculares).

## Capacidades Técnicas
- **Precisión de Milisegundos**: Utiliza el reloj de hardware del sistema (`audioContext.currentTime`) para asegurar que los saltos y fades sean exactos, independientemente del lag de la interfaz.
- **Resampleo Automático**: Ajusta la frecuencia de muestreo del archivo a la del sistema de salida para evitar cambios de tono (Pitch) accidentales.
- **Gestión de Suspensión**: Monitorea el estado del contexto de audio para reanudarlo automáticamente tras una interacción del usuario (requisito de seguridad de los navegadores modernos).

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Blobs de audio y comandos de nivel de volumen.
- **Acciones (Output)**: Stream de audio estéreo y datos de análisis de frecuencia para la UI.

---
*El Audio Engine es el que garantiza que SuniPlayer no solo reproduzca música, sino que la interprete con fidelidad audiófila.*
