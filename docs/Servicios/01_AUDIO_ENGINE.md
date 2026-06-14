# SERVICIO: AUDIO ENGINE (Motor de Renderizado Sonoro)

## Propósito
El **Audio Engine** es el responsable de la generación física del sonido. Actúa como una capa de abstracción de alto rendimiento sobre la **Web Audio API**, permitiendo un control quirúrgico sobre el tono y el tiempo de cada muestra de audio.

## 🏗️ Arquitectura Técnica (Engine 4.0)

El motor opera bajo un modelo de **Canales A/B** independientes para permitir crossfades perfectos y pre-carga proactiva.

### 1. Motor de Procesamiento (Ferraris)
- **Tecnología**: `AudioWorkletNode` (vía `@soundtouchjs/audio-worklet`).
- **Aislamiento**: El procesamiento ocurre en un hilo de audio dedicado, garantizando inmunidad ante bloqueos de la UI.
- **Algoritmo**: WSOLA para control independiente de **Pitch** (tono) y **Tempo** (velocidad).
- **Capacidades**: 
    - Cambio de tono en tiempo real (±12 semitonos).
    - Time Stretching sin afectar el tono (0.5x - 2.0x).

### 2. Capa de Almacenamiento (Persistence)
- **Binarios**: Origin Private File System (**OPFS**). Almacenamiento directo en disco del navegador para máximo rendimiento.
- **Metadata**: **IndexedDB** (v2). Guarda exclusivamente BPM, Key, Waveforms y Marcadores.

### 3. Grafo de Nodos
`[Buffer (OPFS)] -> [AudioWorklet (Pitch/Tempo)] -> [GainNode (Master/Fade)] -> [AnalyserNode] -> [Destination]`

## Principios de Operación (Reglas de Oro)

1. **Soberanía del Audio**: El motor de audio es sagrado. Ningún cambio de vista o apertura de modal puede detener el audio activo, a menos que sea un comando explícito de transporte.
2. **Reproducción Atómica (`quickPlay`)**: Los cambios de track se gestionan centralmente para asegurar que la limpieza y el arranque ocurran en una transacción única.
3. **Normalización Inteligente**: Aplica compensación de ganancia (`gainOffset`) por track para mantener un nivel de salida coherente en todo el show.
4. **Handoff Invisible**: Las transiciones entre el Builder y el Player no deben causar micro-cortes.

---
*El Audio Engine es el que garantiza que SuniPlayer no solo reproduzca música, sino que la interprete con fidelidad audiófila.*
