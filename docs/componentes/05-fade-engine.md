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

Al recibir un evento de transición del motor de audio, el componente aplica la operación configurada sobre el buffer de audio en curso: FadeIn sube el volumen de 0% al nivel normal en N segundos; FadeOut lo baja del nivel normal a 0%; FadeMix superpone las dos canciones durante N segundos mientras una sube y la otra baja. Si no hay configuración, el cambio es corte seco. La configuración puede ser por canción individual (FadeIn/FadeOut propios) o por transición específica en un set (se aplica entre dos canciones consecutivas).

## Salida

- Transición de audio aplicada → [[01-audio-engine]]

## Errores

- **Lógico:** se recibe un evento de FadeMix pero solo hay una canción en cola (no hay siguiente) — no es posible superponer dos canciones; se aplica FadeOut simple en su lugar y se notifica.
- **Semántico:** se configura un FadeMix de 15 segundos para dos canciones donde la más corta dura 8 segundos — la superposición cubriría casi toda la canción más corta, lo que distorsiona la intención musical; la app advierte "El FadeMix supera la duración de una de las canciones" y permite ajustar.

Catálogo global: [[07-modelo-errores]]

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
