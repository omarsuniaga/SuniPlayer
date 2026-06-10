---
ruta: docs/componentes/03-time-stretcher.md
tipo: componente
origen: "[[01-audio-engine]]"
estado: estable
---

# Time Stretcher (Cambio de Velocidad)

## Función

Modificar la velocidad de reproducción de un buffer de audio en un porcentaje (50%–200%) sin alterar el tono, y devolver el buffer estirado al motor de reproducción.

## Entrada

- Buffer de audio y porcentaje de velocidad ← [[01-audio-engine]]

## Proceso

El procesador recibe un buffer de audio (ya transpuesto por [[02-pitch-shifter]] si corresponde) y el porcentaje de velocidad deseado. Aplica la transformación temporal: si el modo "Preservar tono" está activo (default), el tono permanece igual a cualquier velocidad; si está desactivado, la velocidad afecta el tono como en un cassette. El ajuste se aplica en tiempo real y se guarda automáticamente con la canción.

## Salida

- Buffer de audio con la velocidad ajustada → [[01-audio-engine]]

## Errores

- **Lógico:** se recibe un porcentaje de velocidad fuera del rango soportado (50%–200%) — el slider lo impide, pero si el valor llega por otro canal, se rechaza y se usa el límite más cercano con aviso.
- **Semántico:** el músico activa "Preservar tono: OFF" durante un show en vivo — en ese contexto, el efecto de cassette distorsiona la voz del cantante que usa la pista como referencia de afinación; la app no bloquea la acción pero advierte "Efecto de cassette activo: el tono varía con la velocidad".

Catálogo global: [[07-modelo-errores]]

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
