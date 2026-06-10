---
ruta: docs/vistas/05-vista-edit.md
tipo: vista
origen: "[[01-vista-inicio]]"
estado: estable
---

# Vista Edit

## Función

Proveer la interfaz de preparación y configuración de Sets (Modo Edit); permitir el reordenamiento drag-and-drop de canciones; proveer controles para la edición en caliente de tono, tempo, marcas de corte in/out y asociación de partituras; y configurar las transiciones y fundidos (fades/gap).

## Entrada

- Modelos de Set y listas de canciones ← [[02-modelo-colecciones]]
- Políticas y reglas de transición del modo de sesión ← [[03-modelo-sesion]]
- Estilos y variables CSS del tema activo ← [[13-tema]]

## Proceso

1. **Selección y Carga de Set:** Carga las canciones asociadas al Set elegido desde [[02-modelo-colecciones]].
2. **Edición Estructural ( back-stage ):**
   - Reordenamiento interactivo mediante arrastre.
   - Panel de edición para el track seleccionado: slider de tono (±12 semitonos), slider de tempo (50%-200%), e ingreso numérico para marcas de Inicio y Fin personalizado.
   - Vinculación de archivos de partitura PDF o imágenes (cargando recursos en [[09-partituras]]).
   - *No se manejan ni visualizan portadas estéticas en esta pantalla.*
3. **Cálculo y Validación de Duración:**
   - Suma la duración efectiva de cada track (Fin - Inicio).
   - Compara el resultado con la duración objetivo del Set y aplica clases CSS de hito: `.time-ok` (verde), `.time-warning` (amarillo, 90%), `.time-danger` (rojo, excedido).
4. **Configuración de Transición:**
   - Define el comportamiento de fundido entre tracks (Corte seco, Desvanecer, Fundido encadenado), mapeando los segundos de FadeIn, FadeOut y Gap.
5. **Navegación:** Permite lanzar el Modo Show de inmediato enviando los datos del Set a [[04-vista-show]].

## Salida

- Lanzamiento e inicialización de la pantalla en vivo → [[04-vista-show]]
- Parámetros de fundido y gap entre canciones de la lista → [[05-fade-engine]]

## Errores

- **Lógico:** el set editado no contiene canciones e intenta iniciar el show.
  - *Resolución:* El botón de iniciar show se bloquea visualmente (clase `.btn-show-disabled`) y la UI muestra un tooltip de error: "Agrega al menos una canción al set".
- **Semántico:** la marca de Fin personalizado del track es menor o igual a la de Inicio.
  - *Resolución:* La UI rechaza el cambio, mantiene los valores previos y parpadea el campo en rojo (clase `.input-error`).

Catálogo global: [[07-modelo-errores]]

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ← Volver           ✏️  MODO EDIT                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ─── SET: Show Sábado 15 ─── [▼ Cambiar] ─────────────────── │
│                                                              │
│  ╔══════════════════════════════════════════════════════════╗ │
│  ║  12 canciones  |  Duración: 34:21  |  🟢  Entra en 40min ║│
│  ║                                                          ║│
│  ║     [🎯 Iniciar Show]              [💾 Guardar]          ║│
│  ╚══════════════════════════════════════════════════════════╝ │
│                                                              │
│  ─── ORDEN DEL SET (arrastrar ↕) ──────────────────────────── │
│                                                              │
│  ╔══  ≣  1.  ♫  Salsa Brava.mp3    ══  03:45  🎵⏱📌 ══╗ │ │
│  ║          Tono: +3  |  Tempo: 110%              ║ │ │
│  ╚══════════════════════════════════════════════════╝ │ │
│  ╔══  ≣  2.  ♫  Merengón.wav        ══  04:01  🎵⏱   ══╗ │ │
│  ║          Tono: 0   |  Tempo: 100%              ║ │ │
│  ╚══════════════════════════════════════════════════╝ │ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [+ Agregar canciones desde librería]                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── CANCIÓN SELECCIONADA: Salsa Brava ────────────────────── │
│                                                              │
│  ┌───────────────────────┐  ┌───────────────────────────────┐│
│  │  🎵 Tono:             │  │  ▶ TRANSICIÓN A SIGUIENTE    ││
│  │   ═══●═══  [+3]      │  │                               ││
│  │  Do → Re              │  │  FadeOut: [3s]  Gap: [1s]   ││
│  │                       │  │  FadeIn:  [2s]               ││
│  │  ⏱ Tempo:             │  │  ─────────────────           ││
│  │   ═══●═══  [110%]    │  │  [Corte seco] [Desvanecer]   ││
│  │                       │  │  [Mezcla]     [Fundido enc.]  ││
│  │  ✂ Inicio:  [00:23]  │  │                               ││
│  │  ✂ Final:   [03:30]  │  └───────────────────────────────┘│
│  │                       │                                   │
│  │  📂 Partitura: [Ver]  │                                   │
│  │  📌 Marcadores: 3     │                                   │
│  └───────────────────────┘                                   │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Tipos de transición pre-configurados

| Tipo | FadeOut | Gap | FadeIn | Cuándo usarlo |
|------|---------|-----|--------|---------------|
| Corte seco | 0s | 0s | 0s | Cambio abrupto |
| Desvanecer | 3s | 1s | 2s | Transición suave |
| Fundido encadenado | 3s | 0s | 3s | Transición de radio |

---

## Interacción

### Tipo
drag-and-drop (reorder tracks) + slider (tono, tempo) + text-input (inicio/fin) + dropdown (tipo transición) + button-group (fade type) + button (iniciar show, guardar)

### Estados del componente
- `.track-row.dragging` — fila siendo arrastrada
- `.slider-tono` — slider de transposición
- `.slider-tempo` — slider de velocidad
- `.input-error` — campo con valor inválido
- `.dropdown-transition` — selector de tipo de transición
- `.btn-show-disabled` — botón de iniciar show deshabilitado
- `.time-ok` — duración del set dentro del objetivo (verde)
- `.time-warning` — duración al 90% del objetivo (amarillo)
- `.time-danger` — duración excede el objetivo (rojo)

### Transiciones
- De idle a activo: el usuario selecciona un set para editar
- De activo a idle: el usuario guarda o inicia el show

---

## Guía de Estilos CSS

### Contenedor principal
- `.vista-edit` — layout base del editor de sets

### Filas de track (reordenables)
- `.track-row` — fila base de canción en el set
- `.track-row.dragging` — fila siendo arrastrada (sombra, opacidad reducida)
- `.track-row:active` — feedback al presionar

### Sliders
- `.slider-tono` — control de transposición (±12 semitonos)
- `.slider-tempo` — control de velocidad (50%-200%)

### Campos de texto
- `.input-time` — campo de marca de tiempo (inicio/fin)
- `.input-error` — campo con valor inválido (parpadeo rojo)

### Dropdown de transición
- `.dropdown-transition` — selector desplegable de tipo de transición

### Botones de fade type
- `.btn-fade` — botón base de tipo de fade
- `.btn-fade.active` — tipo de fade seleccionado

### Botones de acción
- `.btn-show` — botón de iniciar show
- `.btn-show-disabled` — botón deshabilitado (tooltip: "Agrega al menos una canción")

### Indicadores de duración
- `.time-ok` — duración dentro del objetivo (verde)
- `.time-warning` — duración al 90% (amarillo)
- `.time-danger` — duración excedida (rojo)

### Temas
- `.theme-dark` — overrides para modo oscuro
- `.theme-light` — overrides para modo claro

---

### Modal: Agregar Canciones desde Librería
- **Trigger:** tap en botón "+ Agregar canciones desde librería"
- **Campos:**
  - `busqueda` (text) — búsqueda de tracks en la librería
  - `seleccion` (checkbox-list) — lista de tracks con checkboxes
- **Acciones:** confirmar (agregar al set) / cancelar
- **Valores recolectados:** `{ trackIds: string[] }`
