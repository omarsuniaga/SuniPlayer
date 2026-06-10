---
ruta: docs/componentes/06-grafica-ondas.md
tipo: componente
origen: "[[02-vista-reproductor]]"
estado: estable
---

# Gráfica de Ondas (Waveform)

## Función

Procesar y renderizar visualmente la forma de onda de amplitud de un buffer de audio; animar el avance del cabezal en base al tiempo actual; posicionar y renderizar marcadores de tiempo (pins); y procesar las interacciones táctiles/de click del usuario para calcular el seek temporal.

## Entrada

- Datos de decodificación de audio y eventos de posición actual ← [[01-audio-engine]]
- Marcadores (pins y colores) a renderizar ← [[07-marcadores]]
- Interacciones táctiles o de click (arrastre del cabezal, doble toque) ← [[02-vista-reproductor]]

## Proceso

1. Al importar la canción, el componente calcula la amplitud promedio de bloques de audio (downsampling) y genera un arreglo de picos de volumen que representan el perfil del track.
2. Renderiza la onda de forma proporcional al ancho del contenedor (usando barras verticales u SVG).
3. Recibe la posición de reproducción (milisegundos) desde el motor y desplaza la posición del cabezal (`●`) correspondientemente.
4. Renderiza los pins de los marcadores asociados en la línea de tiempo en base a su posición en segundos.
5. Permite interacciones de arrastre del cabezal o pulsar en la onda, convirtiendo la posición `X` del cursor/toque en un timestamp de salida.
6. En Modo Show, aplica la restricción de bloqueo de seek, ignorando las pulsaciones accidentales sobre la onda.

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  IMPORTAR        │
  │  CANCIÓN         │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  PRECALCULAR     │
  │  AMPLITUD        │
  │  (downsampling)  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  RENDERIZAR      │
  │  ONDA (barras    │
  │  verticales/SVG) │
  └────────┬─────────┘
           │
           ▼
┌────────────────────────┐
│  RECIBIR POSICIÓN      │
│  ← [[01-audio-engine]] │
└──────────┬─────────────┘
           │
           ▼
  ┌──────────────────┐
  │  ANIMAR CABEZAL  │
  │  (● + línea)     │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  RENDERIZAR PINS │
  │ [[07-marcadores]]│
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ¿INTERACCIÓN    │
  │  TÁCTIL?         │
  └──────┬───────────┘
         │
    ┌────┴────┐
    │         │
 [SÍ]▼         ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ ¿MODO  │ │ SEGUIR       │
 │ SHOW Y │ │ REPRODUCIENDO│
 │ SEEK   │ │              │
 │ BLOQUE │ └──────────────┘
 │ ADO?   │
 └───┬────┘
     │
 ┌────┴────┐
 │         │
 [SÍ]▼      ▼[NO]
 ┌──────┐ ┌──────────┐
 │IGNORAR│ │ CONVERTIR│
 │TOQUE  │ │ X → time │
 │(seg.  │ │ → seek() │
 │show)  │ └────┬─────┘
 └──────┘      │
               ▼
   ┌────────────────────────┐
   │ ENVIAR TIMESTAMP       │
   │ →                      │
   │[[02-vista-reproductor]]│
   └────────────────────────┘
```

## Salida

- Timestamp resultante de la interacción táctil (seek) → [[02-vista-reproductor]]
- Eventos de interacción de alta frecuencia → [[02-vista-reproductor]]

## Errores

- **Lógico:** se intenta renderizar la onda de una canción con datos corruptos o de duración cero
  - *Resolución:* el componente dibuja una línea plana horizontal (bypass visual) y notifica error.
- **Semántico:** en Modo Show con seek bloqueado, el usuario pulsa la onda para cambiar de posición
  - *Resolución:* la operación se ignora para evitar saltos accidentales en vivo.

Catálogo global: [[07-modelo-errores]]

---

## Visualización completa

```text
┌──────────────────────────────────────────────────────────────┐
│  BPM: 128 🔶  |  Canción: Salsa Brava                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                        ▄▄▄▄▄▄▄▄                              │
│                    ▄▄▄███████████▄▄▄                          │
│       ▄▄▄▄▄▄▄▄▄▄████████████████████▄▄▄▄▄▄                   │
│     ▄███████████████████████████████████████▄                 │
│    ████████████████████████████████████████████               │
│    ████████████████████████████████████████████               │
│    ████████████████████████████████████████████               │
│    ████████████████████████████████████████████               │
│    ████████████████████████████████████████████               │
│         ░░░░░░░░░░░░░░░░░░░░░░                                │
│         ░░░░░░░░░░░░░░░░░░░░░░                                │
│         ░░░░░░░░     ░░░░░░░░░░                               │
│                                                              │
│    🟢                  🔴                      🟡            │
│  00:00 ●────────────────●─────────────────────────● 03:45    │
│       intro           guitarra                  coro         │
│       │                                             │        │
│    [inicio                                        fin]       │
│    personalizado                              personalizado  │
│                                                              │
│  ──────────────────────────────────────────────────────────── │
│  [⏮️]  [▶/⏸]  [⏭️]                   00:42 / 03:45            │
└──────────────────────────────────────────────────────────────┘
```

---

## Elementos visuales

### 1. La forma de onda

```text
Representación de la amplitud del audio:

  ▄▄▄▄                     →  volumen bajo (pasajes suaves)
  ██████                   →  volumen medio
  ████████████             →  volumen alto (golpes, coros)

  ░░░░                     →  zona atenuada (fuera de límites
                              personalizados in/out)
```

**Comportamiento:**
- Se precalcula al cargar la canción (no en tiempo real).
- El color varía según tema (dark: verde/azul neón; light: oscuro).

### 2. El cabezal (posición actual)

```text
                        ●
                        │
  ──────────────────────●──────────────────────────
                        │
                   Cabezal (línea vertical brillante)
```

**Comportamiento:**
- Se mueve suavemente mientras la canción avanza.
- Se puede **arrastrar** para saltar a otra posición (en Modo Edit).
- Al arrastrar, muestra tooltip con el timestamp exacto.

### 3. Marcadores en la línea de tiempo

```text
  🟢                  🔴                      🟡
  ●────────────────────●─────────────────────────●
  "entra             "sube                  "preparar
  guitarra"          volumen"               final"
```

- 🟢 Verde: entrada, inicio.
- 🔴 Rojo: sección difícil, atención.
- 🟡 Amarillo: transición.
- 🔵 Azul: información general.

### 4. Límites personalizados

```text
  ░░░░░░│████████████████████████████████│░░░░░░
        ↑                                ↑
    inicio                            fin personalizado
    personalizado                     (lo que sobra se atenúa)
    (corte de intro)
```

---

## Modos de visualización

- **NORMAL:** Onda completa de la canción, escala al ancho de la pantalla.
- **COMPRIMIDO:** Toda la canción en una línea fina (vista panorámica para navegación rápida).
- **ZOOM:** Acerca una sección para ver detalles (ideal para marcar puntos precisos). Se hace con gesto de pellizco (touch).
- **COMPLETO:** Toda la pantalla dedicada a la onda. En modo Show, opcional.

---

## Estados

- **Sin canción:** Línea recta en centro, sin cabezal. "Seleccioná una canción".
- **Cargando:** Onda gris difuminada + spinner.
- **Cargada (pausa):** Onda visible, cabezal estático.
- **Reproduciendo:** Onda visible, cabezal animado.
- **Con marcadores:** Pins de colores sobre línea de tiempo.
- **Con zoom:** Onda ampliada, scroll horizontal.

---

## Interacción

**Tipo:** gesture (arrastre de cabezal, tap para seek, doble tap para marcar, pellizco para zoom) + display animado (onda + cabezal)

**Estados y transiciones:**
- Sin canción → [cargar canción] → Cargando
- Cargando → [decodificación ok] → Cargada (pausa)
- Cargada (pausa) → [play] → Reproduciendo
- Reproduciendo → [pause] → Cargada (pausa)
- Cualquiera → [tap en onda] → Seek (reposiciona cabezal)
- Cualquiera → [doble tap] → Crear marcador en posición
- Cualquiera → [arrastrar cabezal] → Arrastrando (tooltip timestamp)
- Cualquiera → [pellizcar] → Zoom (acercar/alejar)
- Modo Show con seek bloqueado → [tap/arrastre] → ignorado (sin cambio de estado)

**Comportamiento por estado:**
- **Sin canción:** Línea plana centrada. Texto: «Seleccioná una canción». Sin cabezal, sin interacción.
- **Cargando:** Onda en gris difuminado + spinner de carga. Sin interacción.
- **Cargada (pausa):** Onda visible, cabezal estático en posición. Se puede arrastrar.
- **Reproduciendo:** Onda visible, cabezal animado siguiendo el playback. Se puede arrastrar.
- **Arrastrando (seek):** Cabezal sigue el dedo/ cursor. Tooltip flotante con timestamp: «01:23 / 03:45».
- **Zoom:** Onda ampliada. Scroll horizontal. Gesto de pellizco para ajustar.
- **Crear marcador:** Al soltar doble tap, aparece pin temporal con selector de color.

---

## Guía de Estilos CSS

**.ui-waveform-container**
- width: 100%; height: 120px; position: relative; overflow: hidden
- border-radius: 8px; cursor: pointer
- .theme-dark: background: rgba(255,255,255,0.03)
- .theme-light: background: rgba(0,0,0,0.02)

**.ui-waveform-canvas**
- width: 100%; height: 100%; display: block

**.ui-waveform-wave--dark**
- fill: #4CAF50 (verde neón)
- @media (prefers-color-scheme: light): fill: #1B5E20

**.ui-waveform-wave--light**
- fill: #333333

**.ui-waveform-playhead**
- position: absolute; top: 0; width: 2px; height: 100%
- transition: left 0.1s linear
- .theme-dark: background: #FF9800; box-shadow: 0 0 6px rgba(255,152,0,0.5)
- .theme-light: background: #E65100; box-shadow: 0 0 4px rgba(230,81,0,0.3)

**.ui-waveform-playhead--dragging**
- width: 3px; background: #FF5722
- box-shadow: 0 0 10px rgba(255,87,34,0.6)

**.ui-waveform-pin**
- position: absolute; width: 10px; height: 10px; border-radius: 50%
- transform: translate(-50%, 0); cursor: pointer
- transition: transform 0.15s
- &:hover: transform: translate(-50%, 0) scale(1.3)

**.ui-waveform-pin--green**   { background: #4CAF50; }
**.ui-waveform-pin--red**     { background: #F44336; }
**.ui-waveform-pin--yellow**  { background: #FFEB3B; }
**.ui-waveform-pin--blue**    { background: #2196F3; }

**.ui-waveform-tooltip**
- position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%)
- padding: 2px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap
- .theme-dark: background: rgba(0,0,0,0.8); color: #fff
- .theme-light: background: rgba(255,255,255,0.9); color: #333

**.ui-waveform-zone--muted**
- opacity: 0.3 (límites personalizados in/out)

**.ui-waveform--loading**
- filter: blur(4px); pointer-events: none

**.show-mode .ui-waveform-container**
- cursor: default (seek bloqueado)
- .show-mode .ui-waveform-playhead: cursor: default; pointer-events: none
