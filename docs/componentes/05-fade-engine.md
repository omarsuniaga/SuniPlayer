---
ruta: docs/componentes/05-fade-engine.md
tipo: componente
origen: "[[01-audio-engine]]"
estado: estable
---

# Motor de Fades (FadeIn, FadeOut, FadeMix)

## Función

Aplicar transiciones de volumen suaves (FadeIn, FadeOut, FadeMix) entre canciones o al inicio/final de cada canción, transformando cambios bruscos en transiciones musicales fluidas.

## Entrada

- Evento de transición (inicio o fin de canción) ← [[01-audio-engine]]
- Configuración de fades y gap por canción o por transición de set ← [[05-vista-edit]]

## Proceso

1. El motor de audio dispara un evento de transición: inicio de canción, fin de canción, o cambio entre canciones.
2. Se consulta la configuración: ¿hay configuración por canción individual? Si sí, se usa esa. Si no, ¿hay configuración por transición de set? Si sí, se usa esa. Si no hay configuración, se aplica corte seco.
3. Se determina el tipo de fade a aplicar:
   - Si es inicio de canción → FadeIn (sube volumen de 0% a normal en N segundos).
   - Si es fin de canción sin siguiente → FadeOut (baja volumen de normal a 0%).
   - Si es fin de canción CON siguiente:
     - Si el tipo configurado es Fundido → FadeOut + Gap + FadeIn.
     - Si es Mezcla → FadeMix (ambas suenan juntas N segundos).
     - Si es Corte Seco → cambio instantáneo.
4. Se aplica la transición al buffer de audio en curso.
5. Se notifica al motor de audio que la transición está completa.
6. El buffer procesado se envía a la salida de audio.

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  EVENTO DE       │
  │  TRANSICIÓN      │
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  ¿HAY CONF.  │
    │  POR CANCIÓN?│
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ USAR   │ │ ¿HAY CONF.  │
 │ conf.  │ │ POR SET?     │
 │ canción│ └──────┬───────┘
 └───┬────┘        │
     │        ┌────┴────┐
     │        │         │
     │    [SÍ]▼         ▼[NO]
     │  ┌────────┐ ┌──────────┐
     │  │ USAR   │ │ CORTE   │
     │  │ conf.  │ │ SECO     │
     │  │ set    │ └──────────┘
     │  └───┬────┘
     │      │
     └──┬───┘
        │
        ▼
  ┌──────────────┐
  │  DETERMINAR  │
  │  TIPO FADE   │
  └──────┬───────┘
         │
    ┌────┴──────────────────┐
    │                       │
    ▼                       ▼
┌──────────┐        ┌──────────────┐
│ INICIO   │        │ FIN CANCIÓN  │
│ CANCIÓN  │        │ CON SIGUIENTE│
└────┬─────┘        └──────┬───────┘
     │                     │
     ▼                ┌────┴──────────────┐
┌──────────┐          │        │          │
│ FADEIN   │     FUNDIDO   MEZCLA   CORTE│
└────┬─────┘     │ FadeOut  │FadeMix │SECO│
     │           │ +Gap     │        │    │
     │           │ +FadeIn  │        │    │
     │           └────┬─────┘────┬───┘────┘
     │                │          │
     └────────┬───────┘          │
              │                  │
              ▼                  ▼
       ┌──────────────┐  ┌──────────────┐
       │  TRANSICIÓN   │  │  TRANSICIÓN  │
       │  COMPLETA     │  │  COMPLETA    │
       └──────┬───────┘  └──────┬───────┘
              │                 │
              └────────┬────────┘
                       ▼
                ┌──────────────┐
                │  NOTIFICAR   │
                │  AL MOTOR    │
                │  (01-audio-  │
                │   engine)    │
                └──────────────┘
```

## Salida

- Transición de audio aplicada → [[01-audio-engine]]

## Errores

- **Lógico:** se recibe un evento de FadeMix pero solo hay una canción en cola (no hay siguiente)
  - *Resolución:* no es posible superponer dos canciones; se aplica FadeOut simple en su lugar y se notifica.
- **Semántico:** se configura un FadeMix de 15 segundos para dos canciones donde la más corta dura 8 segundos
  - *Resolución:* la superposición cubriría casi toda la canción más corta, lo que distorsiona la intención musical; la app advierte "El FadeMix supera la duración de una de las canciones" y permite ajustar.

Catálogo global: [[07-modelo-errores]]

---

## Interacción

**Tipo:** segmented-control (selector de tipo de fade: Corte Seco | Fundido | Mezcla) + slider (duración) + toggle (activación) + dropdown (gap)

**Estados y transiciones:**
- Corte Seco → [seleccionar Fundido] → Fundido (FadeOut + Gap + FadeIn)
- Fundido → [seleccionar Mezcla] → Mezcla (FadeMix)
- Mezcla → [seleccionar Corte Seco] → Corte Seco
- Cualquier estado → [toggle OFF] → Desactivado (sin fade)
- Desactivado → [toggle ON] → último tipo activo

**Comportamiento por estado:**
- **Corte Seco:** Sin fade, sin gap. Cambio instantáneo. Sliders de duración ocultos/deshabilitados.
- **Fundido:** Muestra slider de duración FadeOut + slider de gap + slider de duración FadeIn. Default: 3s + 1s + 2s.
- **Mezcla:** Muestra slider de duración FadeMix + slider de mix point (%). Default: 4s, 50/50.
- **Desactivado (toggle OFF):** Todos los controles grises. Texto: «Sin transición».
- **Límite:** Slider de duración al máximo (10s en FadeIn/Out, 15s en FadeMix). Freno visual y tooltip.

**Comportamiento especial:**
- Si se selecciona FadeMix cuando no hay siguiente canción → warning: «No hay siguiente canción para mezclar. Se aplicará FadeOut.»

---

## Guía de Estilos CSS

**.ui-fade-segmented-control**
- display: flex; gap: 0; border-radius: 8px; overflow: hidden
- .theme-dark: background: rgba(255,255,255,0.08)
- .theme-light: background: rgba(0,0,0,0.05)

**.ui-fade-segmented-option**
- padding: 6px 14px; font-size: 13px; cursor: pointer; border: none
- transition: background 0.2s, color 0.2s
- .theme-dark: color: rgba(255,255,255,0.6); background: transparent
- .theme-light: color: rgba(0,0,0,0.6); background: transparent
- &:hover: background: rgba(255,255,255,0.1)

**.ui-fade-segmented-option--selected**
- .theme-dark: background: #4CAF50; color: #fff
- .theme-light: background: #388E3C; color: #fff

**.ui-fade-slider**
- width: 100%; height: 6px; border-radius: 3px
- accent-color: #4CAF50
- .theme-dark: accent-color: #66BB6A; .theme-light: accent-color: #388E3C

**.ui-fade-slider--disabled**
- opacity: 0.4; pointer-events: none

**.ui-fade-toggle**
- appearance: switch; cursor: pointer
- .theme-dark: accent-color: #4CAF50; .theme-light: accent-color: #388E3C

**.ui-fade-dropdown**
- padding: 4px 8px; border-radius: 6px; font-size: 13px
- .theme-dark: background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15)
- .theme-light: background: rgba(0,0,0,0.04); color: #333; border: 1px solid rgba(0,0,0,0.12)

**.ui-fade-label**
- font-size: 12px; font-weight: 500
- .theme-dark: color: rgba(255,255,255,0.7)
- .theme-light: color: rgba(0,0,0,0.7)

**.show-mode .ui-fade-controls**
- display: none (en modo show no se configura transición)
- Si se necesita FadeMix precargado, se configura antes del show

---

## FadeIn

```text
Volumen
100% ──────────────────────────────────────────────────
 75%
 50%
 25%
  0%  ──╔══════════╗────────────────────────────────────
         ║  SUBE   ║
         ║ gradual ║
         ╚══════════╝
      Inicio      Fin fade
      fade        (ej: 5s)

  El volumen va de 0% → nivel normal en N segundos.
```

**¿Cuándo se usa?**
- Al inicio de una canción para evitar que arranque de golpe.
- Al empezar un set, apertura suave.

**Configuración:** Duración: 0-10s (default 0 = desactivado).

---

## FadeOut

```text
Volumen
100% ────────────────────────────╔══════════╗──────────
 75%                              ║  BAJA   ║
 50%                              ║ gradual ║
 25%                              ╚══════════╝
  0%  ─────────────────────────────────────────────────
                           Inicio    Fin fade
                           fade      (ej: 4s)

  El volumen va del nivel normal → 0% en N segundos.
```

**¿Cuándo se usa?**
- Al final de una canción para que no termine de golpe.
- Antes de la siguiente canción en un set.

---

## FadeMix (Superposición)

```text
CANCIÓN A ────────────────────────╗
                                   ║
                                   ║
CANCIÓN B ════════════════════════╝═══════════════════

           ◄──── FadeMix 4s ────►

  Las dos canciones suenan juntas durante N segundos.
  La canción A se desvanece mientras la B aparece.
```

**¿Cuándo se usa?**
- Transiciones de DJ (mezclar una canción con la siguiente).
- Sets sin silencio entre canciones.
- Mantener la energía constante.

**Configuración:** Duración: 0-15s. Mix point: qué porcentaje de cada una.

---

## ¿Dónde se configura?

### Por canción individual (FadeIn / FadeOut)

```text
┌──────────────────────────────────────────────────────────────┐
│  ♫  Salsa Brava  —  Ajustes de fade                         │
│                                                              │
│  FadeIn:   [3s]  ──●═══──  al inicio                        │
│  FadeOut:  [4s]  ──●═══──  al final                         │
│                                                              │
│  Estos fades se guardan con la canción y se aplican          │
│  siempre que suene, sin importar la playlist o set.          │
└──────────────────────────────────────────────────────────────┘
```

### Entre canciones de un set (Transiciones)

```text
┌──────────────────────────────────────────────────────────────┐
│  ▶  Transición:  Salsa Brava  →  Merengón                   │
│                                                              │
│  ┌─ Opción 1: FUNDIDO ───────────────────────────────────┐  │
│  │  FadeOut:  3s    Gap:  1s    FadeIn:  2s              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Opción 2: MEZCLA ─────────────────────────────────────┐  │
│  │  FadeMix:  4s  (suenan juntas)                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Opción 3: CORTE SECO ─────────────────────────────────┐  │
│  │  Sin fade, sin gap. Cambio instantáneo.                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Aplicar a todas las transiciones del set]                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Diagrama de transición completa

```text
CANCIÓN A                     Gap     CANCIÓN B
══════════════════════════════ ═══════ ════════════════════════
                      ── ── ── ── ── ── ── ──
                     ↘           ↗
                   FadeOut      FadeIn
                     3s          2s

  Con FadeMix, el Gap desaparece y las canciones se superponen:
  CANCIÓN A ───────────────────────╗
                                    ║
                                    ║   ← ambas suenan juntas
                                    ║
  CANCIÓN B ═══════════════════════╝══════════════════════════
              ◄──── FadeMix 4s ────►
```
