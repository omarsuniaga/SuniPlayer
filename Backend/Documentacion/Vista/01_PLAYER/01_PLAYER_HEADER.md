# COMPONENTE: PLAYER HEADER (Cabecera del Show)

## Propósito
El **Player Header** es el centro de conciencia del setlist. Su misión es mostrar la información macro del show en vivo, permitiendo al músico saber en todo momento qué set está tocando y cuánto tiempo de "vuelo" le queda.

## Elementos y Funcionalidades Detalladas

### 1. Identificación del Setlist
- **Nombre del Show**: Muestra el título del set generado (ej: "Evento Hotel Sheraton - 45min").
- **Metadata de Lugar (Venue)**: Indica el tipo de recinto configurado, lo cual afecta la atmósfera visual.

### 2. Contadores de Tiempo Global (Show Progress)
- **Total Duration**: Tiempo total programado para el setlist completo.
- **Elapsed Total**: Cronómetro que suma el tiempo transcurrido desde la primera canción.
- **Remaining Total**: Cuenta regresiva del tiempo que falta para terminar el show completo. Vital para cumplir con los horarios del escenario.

### 3. Accesos Rápidos de Performance
- **Mirror Toggle**: Botón para encender/apagar la cámara frontal rápidamente.
- **Setlist Queue Toggle**: Permite abrir o cerrar la vista lateral de la cola de reproducción.
- **Track Profile Shortcut**: Acceso directo a la edición de la canción que está sonando actualmente.

### 4. Visor de Partituras (Sheet Music Indicator)
- **Badge de Disponibilidad**: Si el track actual tiene partituras o letras cargadas, se muestra un icono vibrante que permite abrirlas con un solo toque.

## Comportamiento (UX)
- **Contraste Extremo**: El texto es blanco puro sobre fondo oscuro para ser legible bajo luces de escenario intensas.
- **Actualización Reactiva**: Los contadores de tiempo se actualizan cada segundo en sincronía con el motor de audio.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Metadata del setlist desde el **PlayerStore**.
- **Acciones (Output)**: Dispara los estados de visibilidad de los paneles laterales y modales.

---
*El Player Header es el tablero de instrumentos del músico, donde se lee el estado vital del concierto.*
