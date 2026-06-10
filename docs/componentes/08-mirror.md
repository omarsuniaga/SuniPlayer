---
ruta: docs/componentes/08-mirror.md
tipo: componente
origen: "[[04-vista-show]]"
estado: estable
---

# Mirror (Cámara superpuesta)

## Función

Inicializar la cámara del dispositivo en tiempo real; renderizar el feed de video local espejado en un contenedor flotante o de pantalla dividida para que el músico observe su postura, digitación o interpretación; y suspender/liberar el hardware de cámara de forma segura al apagarse.

## Entrada

- Feed de video de la cámara física del dispositivo (físico)
- Señales de activación, posición, modo de vista y alternancia de cámara ← [[04-vista-show]]

## Proceso

1. Al recibir la señal de activación, solicita acceso a la API de hardware de la cámara (`navigator.mediaDevices.getUserMedia`).
2. Si se otorga permiso, inicializa el stream de video de la cámara seleccionada (por defecto la frontal).
3. Aplica un filtro CSS horizontal (`transform: scaleX(-1)`) para mostrar la imagen espejada, simulando un espejo físico (espejado reactivo).
4. Renderiza el stream en un elemento `<video>` flotante sobre la interfaz según el modo seleccionado:
   - **Modo Mini:** Contenedor de 120x160px flotante, arrastrable táctilmente en pantalla.
   - **Modo Medio:** Contenedor fijo que ocupa el 50% superior o inferior de la pantalla.
   - **Modo PIP:** Deriva el feed a la API Picture-in-Picture del navegador si está soportada.
5. Al recibir la señal de apagado, detiene todas las pistas del stream de video (`track.stop()`) para liberar el hardware del dispositivo.

### Diagrama de flujo

```text
  ┌──────────────────┐
  │ SEÑAL DE         │
  │ ACTIVACIÓN       │
  │ ←                │
  │ [[04-vista-show]]│
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  SOLICITAR   │
    │  PERMISO     │
    │  CÁMARA      │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ INICIAR│ │ MOSTRAR      │
 │ STREAM │ │ ERROR        │
 │ +      │ │ "Permiso     │
 │ espejar│ │ denegado"    │
 └───┬────┘ └──────────────┘
     │
     ▼
  ┌──────────────────┐
  │  RENDERIZAR SEGÚN│
  │  MODO            │
  └──────┬───────────┘
         │
    ┌────┴──────────────────┐
    │         │              │
    ▼         ▼              ▼
┌────────┐ ┌────────┐ ┌──────────┐
│ MINI   │ │ MEDIO  │ │ PIP      │
│ 120x160│ │ 50%    │ │ (SO API) │
│ flot.  │ │ pant.  │ │          │
└───┬────┘ └───┬────┘ └────┬─────┘
    │         │              │
    └────┬────┘              │
         │                   │
         ▼                   │
  ┌──────────────┐           │
  │ SEÑAL DE     │◀──────────┘
  │ APAGADO      │
  └──────┬───────┘
         │
         ▼
   ┌──────────────┐
   │ DETENER      │
   │ TODAS LAS    │
   │ PISTAS       │
   │ track.stop() │
   └──────────────┘
```

## Salida

- Feed renderizado como visor flotante o elemento embebido en la vista → [[04-vista-show]]

## Errores

- **Lógico:** el dispositivo no posee cámara física disponible
  - *Resolución:* la interfaz muestra una pantalla negra con el mensaje "Cámara no encontrada".
- **Semántico:** el usuario deniega el permiso de cámara a nivel de sistema operativo
  - *Resolución:* el componente captura la excepción `NotAllowedError`, aborta la inicialización y notifica en pantalla: "Permiso denegado: Suniplayer requiere acceso a la cámara para el visor".

Catálogo global: [[07-modelo-errores]]

---

## Tres modos de visualización

### Modo 1: Mini (esquina flotante)

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│           ┌──────────────────────┐                           │
│           │  ┌──┐               │  ← botón ✕ cerrar         │
│           │  │🎥│               │  ← botón 🔄 cámara        │
│           │  └──┘               │                           │
│           │                     │                           │
│           │   📷 FEED DE        │                           │
│           │   CÁMARA            │                           │
│           │   (120x160px)      │                           │
│           │                     │                           │
│           │   ≣ (arrastrar)     │                           │
│           └──────────────────────┘                           │
│                                                              │
│  [Controles de reproducción...]                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Tamaño: ~120x160px.
- **Arrastrable** a cualquier posición de la pantalla.
- Botón ✕ para cerrar, 🎥 para cambiar cámara frontal/trasera.
- ≣ para arrastrar.
- Permanece visible al navegar entre vistas.

### Modo 2: Medio (mitad de pantalla)

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌────────────────────────────────────────────────────────┐│
│   │                                                        ││
│   │                📷  CÁMARA                              ││
│   │                                                        ││
│   │          [ocupa el 50% superior]                       ││
│   │                                                        ││
│   │                   ──┐                                  ││
│   │  [✕]           [🔄] │ ← minimizar a mini              ││
│   └────────────────────────────────────────────────────────┘│
│                                                              │
│   ────────────────────────────────────────────────────────── │
│                                                              │
│   [⏮️]  [▶/⏸]  [⏭️]           ♫  Salsa Brava                │
│   Vol: ────●══════───         03:45 / 03:45                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Ideal para modo Show (el músico se ve grande mientras toca).
- Se puede mover entre mitad superior o inferior.
- Los controles quedan en la mitad opuesta.

### Modo 3: PIP (Picture-in-Picture del SO)

```text
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │   SUNIPLAYER                                           │
  │                                                        │
  │   ♫  Sonando: Salsa Brava                              │
  │                                                   ┌──┐ │
  │   ▶/⏸   ⏭️    ⏮️                                  │📷│ │
  │                                                  └──┘ │
  │   [feed de cámara flotando como PIP]                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## Controles del mirror

- **✕ Cerrar:** Apaga la cámara completamente y libera el recurso.
- **🔄 Cambiar cámara:** Alterna entre cámara frontal y trasera si existen.
- **≣ Mover:** Arrastrar táctilmente a cualquier cuadrante en modo Mini.
- **⬜ Expandir:** Cambia visualización de Mini a Medio.
- **─ Contraer:** Cambia de Medio a Mini.

---

## Privacidad y Seguridad

- **Uso Local:** La cámara solo se activa bajo demanda explícita.
- **Cero almacenamiento:** Suniplayer es offline y NO almacena, graba ni transmite el feed.
- **Liberación:** Detiene físicamente los sensores de cámara al cerrarse.
- **Alerta visual:** Muestra un icono de grabación 🔴 en la barra superior mientras está activo.

---

## Interacción

**Tipo:** toggle (encender/apagar cámara) + gesture (arrastrar contenedor mini) + icon-button (cambiar cámara, cerrar) + button (expandir/contraer)

**Estados y transiciones:**
- Apagado → [toggle ON] → Solicitando permiso
- Solicitando permiso → [permiso concedido] → Mini (default)
- Solicitando permiso → [permiso denegado] → Error
- Mini → [tap expandir] → Medio
- Medio → [tap contraer] → Mini
- Mini/Medio → [tap PIP] → PIP (si soportado)
- PIP → [tap volver] → Mini
- Cualquiera → [tap ✕] → Apagado (libera hardware)
- Cualquiera → [tap 🔄] → Alternando cámara (frontal/trasera)
- Mini → [arrastrar ≣] → Arrastrando (sigue al dedo)

**Comportamiento por estado:**
- **Apagado:** Sin indicador de cámara. Sin consumo de hardware.
- **Solicitando permiso:** Spinner + texto «Solicitando acceso a cámara…».
- **Mini:** Contenedor 120x160px flotante. Arrastrable. Botones ✕, 🔄, ⬜.
- **Medio:** 50% de la pantalla. Botones ✕, 🔄, ─ (contraer).
- **PIP:** Ventana flotante del SO. Controles mínimos.
- **Arrastrando:** Contenedor semi-transparente que sigue al dedo. Al soltar, queda en nueva posición.
- **Error:** Pantalla negra con mensaje según tipo de error.

---

## Estilos CSS

**.ui-mirror-container**
- position: fixed; z-index: 1000; border-radius: 12px; overflow: hidden
- transition: width 0.3s, height 0.3s, opacity 0.3s
- box-shadow: 0 4px 20px rgba(0,0,0,0.3)

**.ui-mirror-container--mini**
- width: 120px; height: 160px; bottom: 16px; right: 16px; cursor: grab

**.ui-mirror-container--medium**
- width: 100%; height: 50%; top: 0; left: 0; border-radius: 0

**.ui-mirror-container--pip**
- border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.4)

**.ui-mirror-container--hidden**
- opacity: 0; pointer-events: none; width: 0; height: 0

**.ui-mirror-container--dragging**
- opacity: 0.8; cursor: grabbing; transition: none

**.ui-mirror-video**
- width: 100%; height: 100%; object-fit: cover
- transform: scaleX(-1) (espejado)

**.ui-mirror-controls**
- position: absolute; top: 4px; right: 4px; display: flex; gap: 4px; z-index: 1

**.ui-mirror-btn**
- width: 28px; height: 28px; border-radius: 50%; border: none
- cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center
- .theme-dark: background: rgba(0,0,0,0.5); color: #fff
- .theme-light: background: rgba(255,255,255,0.7); color: #333
- &:hover: transform: scale(1.1)
- &:active: transform: scale(0.9)

**.ui-mirror-btn--close**
- .theme-dark: background: rgba(244,67,54,0.7); color: #fff
- .theme-light: background: rgba(244,67,54,0.8); color: #fff

**.ui-mirror-error**
- width: 100%; height: 100%; display: flex; align-items: center; justify-content: center
- font-size: 12px; text-align: center; padding: 8px
- .theme-dark: background: #1a1a1a; color: rgba(255,255,255,0.6)
- .theme-light: background: #f5f5f5; color: rgba(0,0,0,0.6)

**.ui-mirror-recording-indicator**
- position: fixed; top: 8px; right: 8px; z-index: 999
- font-size: 10px; padding: 2px 8px; border-radius: 10px
- .theme-dark: background: rgba(244,67,54,0.2); color: #F44336
- .theme-light: background: rgba(244,67,54,0.1); color: #D32F2F
