# SERVICIO: PEDAL PROTOCOL (Integración de Periféricos)

## Propósito
Permitir el control de SuniPlayer sin usar las manos. Este servicio escucha y traduce señales provenientes de pedales Bluetooth, teclados USB o cualquier dispositivo de entrada HID (Human Interface Device).

## Lógica de Detección (HID Emulation)
La mayoría de los pedales para músicos (ej: AirTurn, PageTurner) funcionan emulando pulsaciones de teclas estándar (Flechas, Barra espaciadora, teclas numéricas). 
- **Escucha Global**: El servicio registra un "EventListener" en el objeto global de la ventana para capturar cualquier tecla presionada.
- **Filtrado de Ruido**: Ignora entradas si hay un campo de texto (Input) enfocado, evitando que el pedal "escriba" accidentalmente en la metadata de un track.

## Mapeo Dinámico (Bindings)
El usuario puede definir qué hace cada pedal en el panel de **Settings**:
- **Flecha Arriba / Pedal 1**: Play / Pause.
- **Flecha Abajo / Pedal 2**: Skip Next.
- **Flecha Izquierda / Pedal 3**: Reiniciar Track.
- **Flecha Derecha / Pedal 4**: Abrir Partitura.

## Seguridad en Escenario
- **Prevención de Repetición**: Filtra pulsaciones múltiples muy rápidas (de-bounce físico) para evitar que un pie pesado dispare dos canciones seguidas.
- **Modo Show**: En este modo, el sistema de pedales se vuelve prioritario, asegurando que la acción se ejecute incluso si la app no está en el foco absoluto del sistema (en la medida que el navegador lo permita).

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Eventos de `keydown` del sistema operativo.
- **Acciones (Output)**: Dispara funciones en el **Playback Engine** o cambia la vista de la UI.

---
*El Pedal Protocol es el puente que permite al músico controlar la tecnología con la misma naturalidad con la que pisa un pedal de efectos.*
