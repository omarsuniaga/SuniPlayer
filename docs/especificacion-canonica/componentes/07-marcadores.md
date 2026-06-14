# Marcadores y Comentarios

## ¿Qué es?

Un sistema que permite al músico **dejar notas** en puntos específicos de una canción. Se ven como pins de colores en la gráfica de ondas.

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

```text
  🟢 Verde    →  "Entrada, inicio, algo positivo"
  🔴 Rojo     →  "Peligro, sección difícil, atención"
  🟡 Amarillo →  "Transición, cambio, neutral"
  🔵 Azul     →  "Información, referencia, nota"
```

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

  El músico ve la información JUSTO cuando la necesita:
  a 3 segundos de distancia, el texto aparece solo.
```

---

## Atajo rápido

```text
Para crear un marcador sin abrir el panel:

  → Tocar DOS VECES sobre la gráfica de ondas
  → Se crea un marcador rápido en esa posición
  → Color: 🟡 Amarillo (default)
  → Texto: "Marcador en MM:SS"
  → Se puede editar después desde el panel
```

---

## Estados

```text
┌─────────────────┬────────────────────────────────────────────┐
│  Estado         │  Comportamiento                            │
├─────────────────┼────────────────────────────────────────────┤
│  Sin            │  Panel: "No hay marcadores.                │
│  marcadores     │  Tocá + para agregar uno."                 │
├─────────────────┼────────────────────────────────────────────┤
│  Con            │  Lista visible + pins en la gráfica.       │
│  marcadores     │                                            │
├─────────────────┼────────────────────────────────────────────┤
│  Cabezal cerca  │  Tooltip aparece automáticamente.          │
│  de marcador    │  El pin brilla suavemente.                 │
├─────────────────┼────────────────────────────────────────────┤
│  Editando       │  Overlay de edición con campos.            │
├─────────────────┼────────────────────────────────────────────┤
│  Modo Show      │  Marcadores visibles pero NO editables.    │
└─────────────────┴────────────────────────────────────────────┘
```
