# SERVICIO: ANALYSIS WORKER (Procesamiento en Segundo Plano)

## Propósito
Realizar tareas de análisis de audio computacionalmente costosas sin degradar la fluidez de la interfaz de usuario (60fps). Utiliza **Web Workers** para delegar el trabajo pesado a hilos secundarios del procesador.

## Tareas del Worker
Cuando un nuevo track entra al sistema, el Worker se activa y realiza:
1. **Extracción de Picos (Waveform Generation)**: Escanea todo el archivo para encontrar los niveles máximos de amplitud y generar el array de datos para la gráfica.
2. **Detección de Transitorios (BPM Detection)**: Aplica filtros de paso bajo y algoritmos de correlación para encontrar el "golpe" constante de la música.
3. **Cálculo de Loudness (RMS)**: Determina el volumen promedio para la normalización automática.

## Flujo de Trabajo
- **Mensajería (PostMessage)**: El hilo principal envía el `AudioBuffer` al Worker.
- **Procesamiento Aislado**: El Worker realiza los cálculos matemáticos usando la potencia de la CPU disponible.
- **Retorno de Datos**: Una vez finalizado, devuelve un objeto con los resultados (BPM sugerido, array de picos, volumen promedio).

## Optimización
- **Transferencia de Buffers**: Utiliza la capacidad de "Transferable Objects" de JavaScript para mover grandes bloques de memoria entre hilos con costo casi cero, evitando la copia lenta de datos.
- **Cola de Prioridad**: Si el usuario importa 20 archivos a la vez, el sistema los encola y procesa de a uno para no saturar el sistema.

---
*El Analysis Worker es la "sala de máquinas" que hace el trabajo sucio para que el músico vea resultados inmediatos.*
