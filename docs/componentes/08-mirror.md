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

## Salida

- Feed renderizado como visor flotante o elemento embebido en la vista → [[04-vista-show]]

## Errores

- **Lógico:** el dispositivo no posee cámara física disponible — la interfaz muestra una pantalla negra con el mensaje "Cámara no encontrada".
- **Semántico:** el usuario deniega el permiso de cámara a nivel de sistema operativo — el componente captura la excepción `NotAllowedError`, aborta la inicialización y notifica en pantalla: "Permiso denegado: Suniplayer requiere acceso a la cámara para el visor".

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
