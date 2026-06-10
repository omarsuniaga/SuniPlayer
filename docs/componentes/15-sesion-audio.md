---
ruta: docs/componentes/15-sesion-audio.md
tipo: componente
origen: "[[03-modelo-sesion]]"
estado: estable
---

# Sesión de Audio del Sistema

## Función

Integrar Suniplayer con la API de audio del sistema operativo (Media Session API); gestionar la reproducción en segundo plano, controles físicos y carátulas virtuales del sistema; interceptar interrupciones y desconexiones de hardware; e interpretar los inputs de pedaleras Bluetooth físicas para mapearlos a comandos.

## Entrada

- Señales físicas del sistema operativo (botones físicos de auriculares, desconexión de conector Jack o desvinculación de Bluetooth A2DP) (físico)
- Señales de pedalera Bluetooth física (Key Events de hardware) (físico)
- Políticas de interrupción por modo de uso ← [[03-modelo-sesion]]
- Matriz de mapeo de comandos de pedales Bluetooth ← [[06-vista-perfil]]

## Proceso

1. **Integración con Media Session API:**
   - Registra metadatos de la canción en reproducción (Título, Artista constante `"Suniplayer"`, Duración) en el widget de control nativo del SO (notificaciones y lock screen).
   - Mapea los botones nativos del sistema operativo (Play, Pause, Stop, Next, Prev) para ejecutar las llamadas del reproductor.
2. **Monitoreo de Salida Física de Audio:**
   - Escucha el evento `ondevicechange` o equivalentes del SO. Si los auriculares o parlantes Bluetooth se desconectan físicos, envía señal inmediata de pausa para evitar reproducir audio por el altavoz integrado del dispositivo.
3. **Gestión de Interrupciones de Audio:**
   - Detecta llamadas entrantes, alarmas o eventos del SO. Aplica la política de interrupción resuelta por [[03-modelo-sesion]]:
     - En Modo Escucha/Edit: Pausa el audio y lo reanuda automáticamente al terminar la llamada.
     - En Modo Show: Pausa el audio y se bloquea en ese estado, requiriendo que el músico presione Play manualmente para continuar.
4. **Mapeo de Pedaleras Bluetooth:**
   - Captura eventos de teclado/pedalera Bluetooth física (Keyboard Event Listeners a nivel de aplicación).
   - Traduce los eventos físicos recibidos (ej: tecla `PageUp` o código de tecla específico) según el mapa activo guardado en [[06-vista-perfil]].
   - Ejecuta la acción mapeada (ej: enviar "Pasar Página" a [[09-partituras]]).

## Salida

- Comandos de reproducción simplificados (pausa forzada, reanudación) y eventos mapeados → [[01-audio-engine]]
- Comando de pasaje de página para la visualización de partituras → [[09-partituras]]
- Eventos críticos del sistema operativo que afectan al estado del modo → [[03-modelo-sesion]]

## Errores

- **Lógico:** el sistema operativo no soporta la Media Session API (navegadores antiguos o embebidos).
  - *Resolución:* El componente corre en modo silenciado (bypass de API nativa), controlando el audio exclusivamente a través del reproductor Web Audio API interno de Suniplayer.
- **Semántico (Pedalera BT Desvinculada):** La pedalera se apaga o pierde el enlace Bluetooth en medio del Show.
  - *Resolución:* El componente detecta el fin de entrada. Deshabilita los comandos asignados para evitar lecturas fantasma (los pedales dejan de responder, NUNCA disparan comandos por error) y notifica un error del sistema de tipo `PEDAL_DISCONNECTED` a la vista.

Catálogo global: [[07-modelo-errores]]
