# Time Stretcher (Cambio de Velocidad)

## ¿Qué es?

Un procesador de audio que cambia la **velocidad** de una canción **sin afectar su tono**. Es decir, podés hacer que suene más lenta o más rápida pero la voz sigue sonando natural.

---

## Rango de ajuste

```text
  ← LENTO                RÁPIDO →
  ──┼────────┼────────┼────────┼────────┼──
   50%      75%      100%     150%     200%
                      │
                Velocidad original
```

## Interfaz de usuario

```text
┌─────── AJUSTE DE VELOCIDAD ─────────────────────────────────┐
│                                                              │
│  ♫  Canción: Salsa Brava                                    │
│                                                              │
│  ─── VELOCIDAD ───────────────────────────────────────────── │
│                                                              │
│              [50%] ────●════════ [200%]                     │
│                          120%                                │
│                                                              │
│  ─── MODO ────────────────────────────────────────────────── │
│                                                              │
│  [✓] Preservar tono (recomendado)                           │
│      │                                                       │
│      ├─ ON:  La voz suena natural a cualquier velocidad      │
│      └─ OFF: Velocidad afecta el tono (efecto cassette)     │
│                                                              │
│  ─── DURACIÓN RESULTANTE ─────────────────────────────────── │
│                                                              │
│  Original:  03:45                                            │
│  Al 120%:   03:07  (38s más corto)                          │
│                                                              │
│  [↺ Restablecer]                    [✓ Aplicar y cerrar]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Preservar tono: ON vs OFF

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🎵  "Salsa Brava" cantada a diferentes velocidades        │
│                                                              │
│   ───────┬───────────────┬──────────────┬────────────────── │
│          │  Vel. 50%     │  Vel. 100%   │  Vel. 200%        │
│   ───────┼───────────────┼──────────────┼────────────────── │
│   ON     │  Lento pero   │  Normal      │  Rápido pero      │
│          │  voz natural  │              │  voz natural      │
│   ───────┼───────────────┼──────────────┼────────────────── │
│   OFF    │  Lento y      │  Normal      │  Rápido y agudo   │
│          │  grave (efecto│              │  (efecto          │
│          │  "demoníaco") │              │  "chipmunk")      │
│   ───────┴───────────────┴──────────────┴────────────────── │
│                                                              │
│   Default: ON  —  es lo que espera un músico.               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Calidad de sonido según rango

```text
Calidad del time-stretch:

  80%  ── 120%:  EXCELENTE  —  imperceptible
  50%  ──  80%:  BUENA      —  leves artefactos audibles
  120% ── 150%:  BUENA      —  suena ligeramente procesado
  150% ── 200%:  ACEPTABLE  —  artefactos más notorios
```

---

## Combinación con Pitch Shifter

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ENTRADA                          SALIDA                    │
│   ♫ audio crudo                    ♫ audio transformado     │
│        │                                 ▲                   │
│        ▼                                 │                   │
│   ┌──────────┐     ┌──────────┐          │                   │
│   │  Pitch   │────▶│  Time    │──────────┘                   │
│   │  Shifter │     │ Stretcher│                              │
│   │  (-3)    │     │  (85%)   │                              │
│   └──────────┘     └──────────┘                              │
│                                                              │
│   Orden: primero tono, luego velocidad.                      │
│   (el orden puede afectar la calidad final)                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
