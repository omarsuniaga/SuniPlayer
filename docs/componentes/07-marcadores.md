---
ruta: docs/componentes/07-marcadores.md
tipo: componente
origen: "[[02-vista-reproductor]]"
estado: estable
---

# Marcadores y Comentarios (Loop A-B)

## Función

Administrar los comentarios asociados a marcas de tiempo (pins) de una canción; monitorear el cabezal de reproducción para gatillar avisos visuales en pantalla (tooltips); y gestionar la lógica de repetición de tramos (Loop A-B) para práctica instrumental.

## Entrada

- Comandos de alta, modificación, borrado e interacción de marcadores ← [[02-vista-reproductor]]
- Posición en tiempo real (milisegundos) del cabezal de audio ← [[01-audio-engine]]

## Proceso

1. **Gestión de Datos:** Los marcadores se agregan especificando un timestamp (segundos con centésimas), texto del comentario, color visual (verde, rojo, amarillo, azul) y un campo extendido opcional.
2. **Monitoreo de Tiempo Real:** El componente evalúa constantemente la diferencia entre la posición actual de reproducción y el timestamp de los marcadores.
   - Si la diferencia es menor o igual a 3.00 segundos previos al marcador, se gatilla un evento de visualización en la UI.
   - Cuando la posición supera el timestamp del marcador, el tooltip desaparece.
3. **Lógica de Loop A-B (Práctica):**
   - El músico puede seleccionar un marcador existente como Punto A (inicio de bucle) y otro como Punto B (fin de bucle). También puede ingresar marcas libres en caliente.
   - Mientras el loop esté activo, al alcanzar la posición del Punto B, el componente envía inmediatamente un comando `seek(PuntoA)` a [[01-audio-engine]], repitiendo la sección de forma cíclica e indefinida.
   - Es combinable con el componente [[03-time-stretcher]] para ensayar tramos rápidos a velocidad reducida.
4. **Modo Show:** Durante el show en vivo, se bloquean todas las funciones de escritura (agregar, borrar o mover marcadores), permitiendo únicamente la lectura y renderizado.

### Diagrama de flujo

```text
       ┌──────────────────┐
       │  USUARIO         │
       │  DOBLE TAP       │
       │  EN ONDA         │
       └────────┬─────────┘
                │
                ▼
         ┌──────────────┐
         │  ¿MODO SHOW  │
         │  ACTIVO?     │
         └──────┬───────┘
                │
          ┌─────┴─────┐
          │           │
       [SÍ]▼           ▼[NO]
      ┌────────┐ ┌──────────────┐
      │ BLOQUE │ │ CREAR        │
      │ ESCRIT │ │ MARCADOR     │
      │ URA    │ │ (pos actual, │
      │ (solo  │ │ color default│
      │ lectura)│ │ + texto)     │
      └────────┘ └──────┬───────┘
                        │
                        ▼
           ┌────────────────────────┐
           │ PERSISTIR              │
           │ → [[04-almacenamiento]]│
           └─────────────┬──────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │ RENDERIZAR PIN       │
            │ EN ONDA              │
            │ → [[06-grafica-ondas]]│
            └────────────┬─────────┘
                        │
                        ▼
            ┌──────────────────┐
            │  MONITOREAR      │
            │  CABEZAL vs.     │
            │  MARCAS          │
            └────────┬─────────┘
                     │
                     ▼
              ┌──────────────┐
              │  ¿DIF. ≤ 3s  │
              │  AL MARCADOR?│
              └──────┬───────┘
                     │
               ┌─────┴─────┐
               │           │
            [SÍ]▼           ▼[NO]
           ┌────────┐ ┌──────────────┐
           │ MOSTRAR│ │ SEGUIR       │
           │ TOOLTIP│ │ MONITOREANDO │
           │ flotant│ │              │
           └───┬────┘ └──────────────┘
               │
               ▼
         ┌──────────────┐
         │  ¿ES LOOP    │
         │  A-B ACTIVO? │
         └──────┬───────┘
                │
           ┌────┴────┐
           │         │
        [SÍ, es B]▼   ▼[NO]
       ┌────────┐ ┌──────────┐
       │ seek() │ │ SEGUIR   │
       │ a Punto│ │ REPRO-   │
       │ A      │ │ DUCIENDO │
       │ (repite│ └──────────┘
       │ tramo) │
       └────────┘
```

## Salida

- Coordenadas y colores de los pins a renderizar en la línea de tiempo → [[06-grafica-ondas]]
- Órdenes de persistencia (guardar/borrar registros) → [[04-almacenamiento]]
- Comandos de salto para Loop A-B (`seek()`) → [[01-audio-engine]]
- Comentarios y tooltips a renderizar → [[02-vista-reproductor]]

## Errores

- **Lógico:** el usuario intenta activar un Loop A-B pero la canción no tiene duración o está vacía
  - *Resolución:* la operación se ignora.
- **Semántico:**
  - El Punto B de un loop se define en una marca de tiempo anterior o igual al Punto A (ej: A = `01:30`, B = `01:10`)
    - *Resolución:* la operación se rechaza con aviso: "El punto de fin (B) debe ser posterior al punto de inicio (A)".
  - El Punto A o B caen fuera de los límites recortados de la canción (inicio/fin personalizado)
    - *Resolución:* se fuerza el ajuste a los límites correspondientes y se notifica en pantalla.

Catálogo global: [[07-modelo-errores]]

---

## ¿Cómo se ve en la gráfica?

```text
─────────────────🟢──────🔴───────────🟡────────────
                  │       │            │
                  │       │            └─ "preparar final"
                  │       │
                  │       └─ "sube volumen, viene el coro"
                  │
                  └─ "entra guitarra"
```

Cada marcador es un **pin de color** en la línea de tiempo. Al acercarse el cabezal (●), el texto aparece como tooltip.

---

## Panel de marcadores

```text
┌─────── MARCADORES ──────────────────────────────────────────┐
│                                                              │
│  ♫  Salsa Brava                                              │
│                                                              │
│  [+ Agregar marcador en posición actual]                     │
│                                                              │
│  ─── 4 MARCADORES ────────────────────────────────────────── │
│                                                              │
│  🟢  00:23  "Entra guitarra"                      [✕] [✏️] │
│               —————————————————————                           │
│               Primer solo, subir volumen.                    │
│                                                              │
│  🔴  01:15  "Sube volumen, viene el coro"         [✕] [✏️] │
│               —————————————————————                           │
│               Cambio de ritmo, atento a la entrada.          │
│                                                              │
│  🟡  02:47  "Preparar final"                      [✕] [✏️] │
│               —————————————————————                           │
│               Último coro, preparar fade out.                │
│                                                              │
│  🔵  03:10  "Cambio de ritmo"                      [✕] [✏️] │
│               —————————————————————                           │
│               Sección instrumental, relax.                   │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  💡  Los marcadores se ven en la gráfica de ondas como      │
│      pins de colores. Al acercarse el cabezal, aparece       │
│      el texto automáticamente.                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Propiedades de un marcador

| Propiedad | Descripción | Default |
|-----------|-------------|---------|
| Timestamp | Posición en la canción (segundos) | ⏱ Posición actual al crear |
| Texto | Lo que el músico quiere recordar | "Marcador en 01:23" |
| Descripción | Texto extendido (opcional) | (vacío) |
| Color | Categoría visual | 🟡 Amarillo |

### Colores disponibles

- **🟢 Verde:** "Entrada, inicio, algo positivo".
- **🔴 Rojo:** "Peligro, sección difícil, atención".
- **🟡 Amarillo:** "Transición, cambio, neutral".
- **🔵 Azul:** "Información, referencia, nota".

---

## Comportamiento durante reproducción

```text
⏱  Línea de tiempo:

  ──────🟢───────────●───────────🔴───────
         │            │            │
         │       a menos de        │
         │     3s del marcador:   │
         │     aparece tooltip    │
         │     "Entra guitarra"   │
         │                        │
         │                  cuando pasa,
         │              el tooltip
         │              desaparece
```

El músico ve la información JUSTO cuando la necesita: a 3 segundos de distancia, el texto aparece solo.

---

## Atajo rápido

Para crear un marcador sin abrir el panel:
- Tocar DOS VECES sobre la gráfica de ondas (en Modo Edit).
- Se crea un marcador rápido en esa posición.
- Color: 🟡 Amarillo (default).
- Texto: "Marcador en MM:SS".
- Se puede editar después desde el panel.

---

## Interacción

**Tipo:** gesture (doble tap para crear marcador) + button (agregar, editar ✏️, borrar ✕) + toggle (loop A-B ON/OFF) + modal-trigger (selector de color, campo de texto)

**Estados y transiciones:**
- Sin marcadores → [doble tap en onda] → Marcador rápido creado (default 🟡)
- Marcador existente → [tap ✏️] → Editando (modal con campos)
- Editando → [guardar] → Marcador actualizado
- Editando → [cancelar] → Marcador sin cambios
- Marcador existente → [tap ✕] → Confirmar borrado → Eliminado
- Marcador → [asignar como Punto A] → Loop A pendiente de B
- Loop A pendiente → [asignar otro como Punto B] → Loop A-B activo
- Loop A-B activo → [toggle OFF] → Loop desactivado (marcadores intactos)
- Modo Show → [cualquier escritura] → Bloqueado (solo lectura)

**Comportamiento por estado:**
- **Sin marcadores:** Línea de tiempo vacía. Tooltip: «Doble toque para crear marcador».
- **Marcador visible:** Pin de color en línea de tiempo. Tooltip aparece a 3s del marcador.
- **Editando:** Modal con campo de texto, selector de color, timestamp (solo lectura). Botones: Guardar/Cancelar.
- **Loop A-B activo:** Indicador visual «🔁 Loop: 01:23 → 02:45» en barra superior. Cabezal rebota de B a A.
- **Bloqueado (Show):** Pins visibles pero sin controles ✕/✏️. Tooltips siguen funcionando.
- **Confirmar borrado:** Brief modal «¿Eliminar marcador?» con Confirmar/Cancelar.

---

## Guía de Estilos CSS

**.ui-marker-pin**
- position: absolute; width: 10px; height: 10px; border-radius: 50%
- transform: translate(-50%, 0); cursor: pointer; z-index: 5
- transition: transform 0.15s
- &:hover: transform: translate(-50%, 0) scale(1.4)
- &:active: transform: translate(-50%, 0) scale(0.9)

**.ui-marker-pin--green**   { background: #4CAF50; box-shadow: 0 0 4px rgba(76,175,80,0.5); }
**.ui-marker-pin--red**     { background: #F44336; box-shadow: 0 0 4px rgba(244,67,54,0.5); }
**.ui-marker-pin--yellow**  { background: #FFEB3B; box-shadow: 0 0 4px rgba(255,235,59,0.5); }
**.ui-marker-pin--blue**    { background: #2196F3; box-shadow: 0 0 4px rgba(33,150,243,0.5); }

**.ui-marker-pin--loop-a**
- width: 12px; height: 12px; border: 2px solid #4CAF50; animation: pulse-a 1.5s infinite
- @keyframes pulse-a { 0%,100% { box-shadow: 0 0 4px #4CAF50; } 50% { box-shadow: 0 0 12px #4CAF50; } }

**.ui-marker-pin--loop-b**
- width: 12px; height: 12px; border: 2px solid #F44336; animation: pulse-b 1.5s infinite
- @keyframes pulse-b { 0%,100% { box-shadow: 0 0 4px #F44336; } 50% { box-shadow: 0 0 12px #F44336; } }

**.ui-marker-tooltip**
- position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%)
- padding: 4px 10px; border-radius: 6px; font-size: 11px; white-space: nowrap
- z-index: 10; pointer-events: none; animation: fadeIn 0.2s
- .theme-dark: background: rgba(0,0,0,0.85); color: #fff
- .theme-light: background: rgba(255,255,255,0.9); color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.15)

**.ui-marker-panel**
- border-radius: 12px; padding: 16px
- .theme-dark: background: rgba(255,255,255,0.03)
- .theme-light: background: rgba(0,0,0,0.02)

**.ui-marker-list-item**
- display: flex; align-items: flex-start; gap: 8px; padding: 8px 0
- border-bottom: 1px solid
- .theme-dark: border-color: rgba(255,255,255,0.06)
- .theme-light: border-color: rgba(0,0,0,0.06)

**.ui-marker-actions**
- display: flex; gap: 4px; margin-left: auto
- button: width: 24px; height: 24px; border-radius: 50%; border: none; cursor: pointer; font-size: 12px
- .theme-dark: background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6)
- .theme-light: background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.6)

**.ui-marker-add-btn**
- padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500
- .theme-dark: background: rgba(76,175,80,0.15); color: #4CAF50
- .theme-light: background: rgba(76,175,80,0.1); color: #2E7D32
- &:hover: background: #4CAF50; color: #fff

**.ui-marker-loop-indicator**
- display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 8px; font-size: 11px
- .theme-dark: background: rgba(76,175,80,0.15); color: #4CAF50
- .theme-light: background: rgba(76,175,80,0.1); color: #2E7D32

**.show-mode .ui-marker-actions**
- display: none (sin edición en show)

**.show-mode .ui-marker-add-btn**
- display: none

---

## Notas de Implementación

- **Interacción de Timeline nativa**: Wires directos con la UI del waveform con snapping (umbral de `12px`) y drag interactivo en la pantalla del reproductor principal.
