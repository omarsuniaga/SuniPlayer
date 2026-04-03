# FUNCIONAMIENTO TÉCNICO: AUDIO MIXER (Mezclador A/B y Ganancia)

## Propósito
El **Audio Mixer** es el componente que gestiona el volumen, los balances y la transición sonora entre tracks. Su misión es garantizar que el show suene profesional, sin saltos de volumen bruscos y con mezclas perfectas.

## Lógica Interna y Detalles de Implementación

### 1. El Motor A/B (Doble Canal)
- **Canales Fantasma**: SuniPlayer mantiene dos canales de audio virtuales operativos en paralelo.
- **Pre-carga Inteligente**: Mientras el canal A está reproduciendo, el Mixer ya está cargando el siguiente track en el canal B de forma silenciosa.
- **Crossfade Engine**: Cuando ocurre un cambio de track, el Mixer baja el volumen del canal A (`fade out`) al mismo tiempo que sube el del canal B (`fade in`). El cruce de estas dos curvas de volumen crea la sensación de una mezcla ininterrumpida.

### 2. Normalización y Gain Offset
- **Compensación de Ganancia**: Cada track puede tener un valor de `gainOffset` (ej: +2dB, -3dB).
- **Aplicación en Tiempo Real**: El Mixer aplica este offset de forma aditiva al volumen maestro. 
  `VolumenFinal = (MasterVol * TrackGain) * AutoGainFactor`.
- **Auto Gain (Opcional)**: Si el análisis de audio determinó que un track está muy bajo, el Mixer puede subirlo automáticamente para que se equipare al promedio de la lista.

### 3. Fades Dinámicos (In/Out)
- **Inicio Suave**: Al arrancar un track, el Mixer puede empezar desde 0 y subir hasta el volumen objetivo en X milisegundos (Fade In).
- **Final Natural**: Al llegar al final (definido por el trim o la duración real), el Mixer inicia un desvanecimiento (Fade Out) para que la música no se corte de forma "seca" si el músico así lo prefiere.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Valores de `gainOffset` desde el **TrackProfile** y `masterVolume` desde el `VolumeControl`.
- **Acciones (Output)**: Controla directamente los nodos de ganancia (`GainNode`) en la Web Audio API o las propiedades de volumen en el motor nativo.

---
*El Audio Mixer es el ingeniero de sonido invisible de SuniPlayer, manteniendo la consistencia sonora durante todo el show.*
