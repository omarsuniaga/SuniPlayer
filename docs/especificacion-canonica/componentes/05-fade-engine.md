# Motor de Fades (FadeIn, FadeOut, FadeMix)

## ¿Qué es?

Un procesador de audio que **suaviza las transiciones** entre canciones y las entradas/salidas de cada canción. Gestiona tres tipos de operaciones: FadeIn (el audio aparece gradualmente desde el silencio), FadeOut (el audio desvanece hasta el silencio), y FadeMix (dos canciones se superponen mientras una sube y la otra baja). Es el componente que transforma un cambio brusco de canción en una transición musical fluida.

**No es una UI.** El motor de fades opera sobre el buffer de audio y se configura desde el panel de transiciones en la vista Edit o desde los ajustes individuales de cada canción.

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
