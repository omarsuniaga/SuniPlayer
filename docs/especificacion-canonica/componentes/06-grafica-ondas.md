# Gráfica de Ondas (Waveform)

## ¿Qué es?

Una representación visual de la **forma de onda** del audio que se está reproduciendo. Herramienta funcional que permite al músico **ver** la estructura de la canción y navegar por ella.

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
│  [⏮️]  [▶⏸]  [⏭️]                   00:42 / 03:45            │
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
- Se puede **arrastrar** para saltar a otra posición.
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

```text
┌───────────────┬──────────────────────────────────────────────┐
│  Modo         │  Descripción                                 │
├───────────────┼──────────────────────────────────────────────┤
│  NORMAL       │  Onda completa de la canción,                │
│               │  escala al ancho de la pantalla.             │
├───────────────┼──────────────────────────────────────────────┤
│  COMPRIMIDO   │  Toda la canción en una línea fina           │
│               │  (vista panorámica para navegación rápida).  │
├───────────────┼──────────────────────────────────────────────┤
│  ZOOM         │  Acerca una sección para ver detalles        │
│               │  (ideal para marcar puntos precisos).        │
│               │  Se hace con gesto de pellizco (touch).      │
├───────────────┼──────────────────────────────────────────────┤
│  COMPLETO     │  Toda la pantalla dedicada a la onda.        │
│               │  En modo Show, opcional.                     │
└───────────────┴──────────────────────────────────────────────┘
```

---

## Estados

```text
┌───────────────────┬──────────────────────────────────────────┐
│  Estado           │  Comportamiento                          │
├───────────────────┼──────────────────────────────────────────┤
│  Sin canción      │  Línea recta en centro, sin cabezal.     │
│                   │  "Seleccioná una canción"                │
├───────────────────┼──────────────────────────────────────────┤
│  Cargando         │  Onda gris difuminada + spinner.         │
├───────────────────┼──────────────────────────────────────────┤
│  Cargada (pausa)  │  Onda visible, cabezal estático.        │
├───────────────────┼──────────────────────────────────────────┤
│  Reproduciendo    │  Onda visible, cabezal animado.          │
├───────────────────┼──────────────────────────────────────────┤
│  Con marcadores   │  Pins de colores sobre línea de tiempo. │
├───────────────────┼──────────────────────────────────────────┤
│  Con zoom         │  Onda ampliada, scroll horizontal.      │
└───────────────────┴──────────────────────────────────────────┘
```
