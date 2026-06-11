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

### Diagrama de flujo

```text
           ┌──────────────────┐
           │  EVENTO EXTERNO  │
           └────────┬─────────┘
                    │
              ┌─────┴──────────────────┐
              │           │            │
              ▼           ▼            ▼
       ┌──────────┐ ┌────────┐ ┌──────────┐
       │ MEDIA    │ │SALIDA  │ │ PEDALERA │
       │ SESSION  │ │FÍSICA  │ │ BT KEY   │
       │ (SO      │ │descon. │ │ EVENT    │
       │  widget) │ │        │ │          │
       └────┬─────┘ └───┬────┘ └────┬─────┘
            │           │           │
            ▼           ▼           ▼
       ┌────────┐ ┌────────┐ ┌────────────────────┐
       │Mapear  │ │PAUSA   │ │ BUSCAR MAPEO       │
       │botones │ │INMEDIA-│ │ EN                 │
       │nativos │ │TA para │ │[[06-vista-perfil]] │
       │del SO  │ │evitar  │ └──────┬─────────────┘
       └───┬────┘ │altavoz │        │
           │      │integrad│        ▼
           │      └────────┘  ┌──────────────┐
           │                  │  ¿HAY MAPEO  │
           │                  │  PARA ESTA   │
           │                  │  TECLA?      │
           │                  └──────┬───────┘
           │                         │
           │                    ┌────┴─────────────────┐
           │                    │                      │
           │                 [SÍ]▼                      ▼[NO]
           │                    ┌────────────────────────┐ ┌──────────┐
           │                    │EJECUTAR ACCIÓN MAPEADA │ │ IGNORAR  │
           │                    │→ [[09-partituras]] o   │ │ (tecla no│
           │                    │[[02-vista-reproductor]]│ │ mapeada) │
           │                    └────────────────────────┘ └──────────┘
           │
           ▼
    ┌──────────────┐
    │  ¿INTERRUPCIÓN│
    │  DEL SO?      │
    └──────┬───────┘
           │
      ┌────┴────┐
      │         │
   [SÍ]▼         ▼[NO]
  ┌────────┐ ┌──────────────┐
  │ ¿MODO  │ │ SEGUIR       │
  │ SHOW?  │ │ REPRODUCIENDO│
  └───┬────┘ └──────────────┘
      │
  ┌────┴────┐
  │         │
  [SÍ]▼      ▼[NO]
  ┌────────┐ ┌──────────────┐
  │ PAUSA +│ │ PAUSA +      │
  │ BLOQUEO│ │ REANUDACIÓN  │
  │ (manual│ │ AUTOMÁTICA   │
  │ play   │ │ (al terminar  │
  │ req.)  │ │  llamada)    │
  └────────┘ └──────────────┘
```

## Salida

- Comandos de reproducción simplificados (pausa forzada, reanudación) y eventos mapeados → [[01-audio-engine]]
- Comando de pasaje de página para la visualización de partituras → [[09-partituras]]
- Eventos críticos del sistema operativo que afectan al estado del modo → [[03-modelo-sesion]]
- Comandos mapeados de la pedalera → [[02-vista-reproductor]]

## Errores

- **Lógico:** el sistema operativo no soporta la Media Session API (navegadores antiguos o embebidos).
  - *Resolución:* El componente corre en modo silenciado (bypass de API nativa), controlando el audio exclusivamente a través del reproductor Web Audio API interno de Suniplayer.
- **Semántico (Pedalera BT Desvinculada):** La pedalera se apaga o pierde el enlace Bluetooth en medio del Show.
  - *Resolución:* El componente detecta el fin de entrada. Deshabilita los comandos asignados para evitar lecturas fantasma (los pedales dejan de responder, NUNCA disparan comandos por error) y notifica un error del sistema de tipo `PEDAL_DISCONNECTED` a la vista.

Catálogo global: [[07-modelo-errores]]

---

## Interacción

**Tipo:** badge (estado de conexión de pedalera) + icon-button (configurar mapeo de pedales) + display (notificación de interrupción del SO)

**Estados y transiciones:**
- Sesión normal → [llamada entrante] → Interrupción (pausa)
- Interrupción → [Modo Escucha] → Pausa + reanudación automática
- Interrupción → [Modo Show] → Pausa + bloqueo (requiere play manual)
- Sesión normal → [desconexión auriculares/BT] → Pausa inmediata
- Sesión normal → [pedalera conectada] → Pedalera activa
- Pedalera activa → [presionar pedal no mapeado] → Ignorado (sin acción)
- Pedalera activa → [presionar pedal mapeado] → Acción ejecutada
- Pedalera activa → [pedalera desconectada] → Pedalera desconectada (badge rojo)
- Pedalera desconectada → [reconexión BT] → Pedalera activa

**Comportamiento por estado:**
- **Sesión normal:** Sin indicadores especiales. Media Session registrada en SO.
- **Interrupción:** Badge temporal «📞 Llamada en curso» + el audio se pausa.
- **Show bloqueado:** Badge «🔴 Show pausado» + botón play destellante pidiendo intervención manual.
- **Auriculares desconectados:** Badge «🎧 Sin auriculares» rojo. Pausa forzada.
- **Pedalera activa:** Badge verde «🔗 Pedalera conectada» + cantidad de pedales detectados.
- **Pedalera desconectada:** Badge rojo «⛓️ Pedalera desconectada». Los comandos dejan de responder.
- **Configurando mapeo:** Modal con lista de pedales detectados + dropdown de acción asignada.

---

## Guía de Estilos CSS

**.ui-audio-session-badge**
- display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 10px; font-size: 11px

**.ui-audio-session-badge--normal**
- .theme-dark: background: rgba(76,175,80,0.1); color: #4CAF50
- .theme-light: background: rgba(76,175,80,0.08); color: #2E7D32

**.ui-audio-session-badge--interrupted**
- .theme-dark: background: rgba(33,150,243,0.15); color: #2196F3
- .theme-light: background: rgba(33,150,243,0.1); color: #1565C0

**.ui-audio-session-badge--show-blocked**
- .theme-dark: background: rgba(244,67,54,0.15); color: #F44336; animation: pulse 1.5s infinite
- .theme-light: background: rgba(244,67,54,0.1); color: #C62828

**.ui-audio-session-badge--disconnected**
- .theme-dark: background: rgba(255,152,0,0.1); color: #FF9800
- .theme-light: background: rgba(255,152,0,0.08); color: #E65100

**.ui-audio-session-badge--pedal-connected**
- background: rgba(76,175,80,0.15); color: #4CAF50

**.ui-audio-session-badge--pedal-disconnected**
- background: rgba(244,67,54,0.15); color: #F44336

**.ui-audio-session-pedal-config-btn**
- padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; border: none
- .theme-dark: background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6)
- .theme-light: background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.6)
- &:hover: .theme-dark: background: rgba(255,255,255,0.12)

**.ui-audio-session-pedal-list**
- display: flex; flex-direction: column; gap: 6px; padding: 0; list-style: none

**.ui-audio-session-pedal-item**
- display: flex; align-items: center; justify-content: space-between; padding: 6px 12px
- border-radius: 6px; font-size: 12px
- .theme-dark: background: rgba(255,255,255,0.04)
- .theme-light: background: rgba(0,0,0,0.03)

**.ui-audio-session-pedal-action**
- padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; border: 1px solid
- .theme-dark: background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.12)
- .theme-light: background: rgba(0,0,0,0.03); color: rgba(0,0,0,0.6); border-color: rgba(0,0,0,0.12)

---

## Notas de Implementación

- **Hardening de Audio en Segundo Plano (Native)**: Para evitar micro-cortes y stutters al suspender la app o bloquear el dispositivo:
  - Se exigen permisos a nivel de OS en `AndroidManifest.xml`: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` (Android 14+) y `WAKE_LOCK`.
  - Se configuran los buffers de la API nativa de audio (`TrackPlayer` / RNTP) con valores defensivos: `minBuffer = 15s`, `maxBuffer = 50s`, y `backBuffer = 30s`.
