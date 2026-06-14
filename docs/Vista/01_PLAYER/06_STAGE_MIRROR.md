# FUNCIONAMIENTO TÉCNICO: STAGE MIRROR (Espejo de Escenario)

## Propósito
El **Stage Mirror** es un sistema de monitoreo visual mediante cámara. Su misión es permitir al músico verse en pantalla (efecto espejo) para controlar su lenguaje corporal, técnica o interacción con el público, sin salir de la interfaz de SuniPlayer.

## Características y Funcionalidades Detalladas

### 1. Acceso al Hardware de Video
- **WebRTC / MediaDevices**: El componente solicita permisos de cámara al navegador mediante `navigator.mediaDevices.getUserMedia({ video: true })`.
- **Gestión de Recursos**: Asegura que la cámara se apague (deteniendo los `tracks` de video) cuando el componente se desmonta para ahorrar batería y CPU.

### 2. Modos de Visualización
- **Modo Docked (Anclado)**: Se integra como una sección fija dentro del layout del Player, ideal para monitoreo constante.
- **Modo Floating (Flotante)**: Se abre como un "Picture-in-Picture" interno, permitiendo al músico mover la ventana de video sobre la waveform si así lo desea.

### 3. Efecto Espejo (Mirroring)
- **Inversión Horizontal**: Aplica una transformación CSS `transform: scaleX(-1)` al elemento `<video>` para que el músico se vea reflejado de forma natural, como en un espejo real.
- **Toggle de Espejo**: Permite desactivar la inversión si el músico quiere usar la cámara para mostrar algo al público de forma no invertida.

### 4. Optimización de Performance
- **Low Latency**: El stream de video se inyecta directamente en un elemento de video con `playsInline` y `muted` para minimizar el retraso entre la realidad y la pantalla.
- **Control de Aspect Ratio**: Ajusta el video para que quepa en un círculo o cuadrado redondeado (según el diseño) sin deformar la imagen.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Comandos de activación (`isMirrorOpen`) y modo (`mirrorMode`) desde el **PlayerStore**.
- **Acciones (Output)**: Informa al sistema sobre el estado de la cámara (si hay error de permisos o si está activa).

---
*El Stage Mirror es el reflejo de la performance del músico, integrado en su estación de mando.*
