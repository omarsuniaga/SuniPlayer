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

## Salida

- Timestamp resultante de la interacción táctil (seek) → [[02-vista-reproductor]]
- Eventos de interacción de alta frecuencia → [[02-vista-reproductor]]

## Errores

- **Lógico:** se intenta renderizar la onda de una canción con datos corruptos o de duración cero — el componente dibuja una línea plana horizontal (bypass visual) y notifica error.
- **Semántico:** en Modo Show con seek bloqueado, el usuario pulsa la onda para cambiar de posición — la operación se ignora para evitar saltos accidentales en vivo.

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
