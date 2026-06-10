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

## Salida

- Coordenadas y colores de los pins a renderizar en la línea de tiempo → [[06-grafica-ondas]]
- Órdenes de persistencia (guardar/borrar registros) → [[04-almacenamiento]]
- Comandos de salto para Loop A-B (`seek()`) → [[01-audio-engine]]

## Errores

- **Lógico:** el usuario intenta activar un Loop A-B pero la canción no tiene duración o está vacía — la operación se ignora.
- **Semántico:**
  - El Punto B de un loop se define en una marca de tiempo anterior o igual al Punto A (ej: A = `01:30`, B = `01:10`) — la operación se rechaza con aviso: "El punto de fin (B) debe ser posterior al punto de inicio (A)".
  - El Punto A o B caen fuera de los límites recortados de la canción (inicio/fin personalizado) — se fuerza el ajuste a los límites correspondientes y se notifica en pantalla.

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
