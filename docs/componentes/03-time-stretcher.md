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

- Buffer de audio (ya transpuesto por [[02-pitch-shifter]] si corresponde) y porcentaje de velocidad ← [[01-audio-engine]]

- Buffer de audio transpuesto desde el pitch-shifter ← [[02-pitch-shifter]]
## Proceso

1. El procesador recibe un buffer de audio (ya procesado por pitch shifter) y el porcentaje de velocidad deseado.
2. Si el porcentaje es 100%, el buffer pasa sin modificación (modo bypass).
3. Si el porcentaje es distinto de 100%, aplica la transformación temporal: estira o comprime el eje temporal sin alterar el eje frecuencial.
4. Si "Preservar tono" está activo (default), el tono permanece igual a cualquier velocidad.
5. Si "Preservar tono" está desactivado, la velocidad afecta el tono como en un cassette (efecto chipmunk/demoníaco).
6. El buffer procesado se envía al [[16-ecualizador]] (siguiente eslabón de la cadena).
7. El ajuste se guarda automáticamente con la canción en [[04-almacenamiento]].

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  RECIBE BUFFER   │
  │  + velocidad %   │
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  ¿% == 100?  │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌────────────────┐
 │ BYPASS │ │ TRANSFORMACIÓN │
 │ (pasa  │ │ TEMPORAL       │
 │  igual)│ │ (estira/comprime│
 └───┬────┘ │  eje temporal)  │
     │      └───────┬────────┘
     │              │
     │       ┌──────┴──────┐
     │       │             │
     │   ┌───┴───┐   ┌────┴───┐
     │   │ TONO  │   │ TONO   │
     │   │ PRES. │   │ VARÍA  │
     │   │ (ON)  │   │ (OFF)  │
     │   └───┬───┘   └────┬───┘
     │       │             │
     └───┬───┴──────┬─────┘
         │          │
         ▼          ▼
   ┌──────────────────────┐
   │  BUFFER → 16 EQ       │
   └──────────────────────┘
```

## Salida

- Buffer de audio con la velocidad ajustada → [[01-audio-engine]]

## Errores

- **Lógico:** se recibe un porcentaje de velocidad fuera del rango soportado (50%–200%)
  - *Resolución:* el slider lo impide, pero si el valor llega por otro canal, se rechaza y se usa el límite más cercano con aviso.
- **Semántico:** el músico activa "Preservar tono: OFF" durante un show en vivo
  - *Resolución:* en ese contexto, el efecto de cassette distorsiona la voz del cantante que usa la pista como referencia de afinación; la app no bloquea la acción pero advierte "Efecto de cassette activo: el tono varía con la velocidad".

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
*La UI del slider de velocidad vive en [[02-vista-reproductor]]. Este componente es el procesador interno.*

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

---

## Estados

```text
┌────────────────┬──────────────────────────────────────────────┐
│   Estado       │  Comportamiento                              │
├────────────────┼──────────────────────────────────────────────┤
│  Bypass (100%) │  Sin procesamiento. Buffer pasa directo.     │
├────────────────┼──────────────────────────────────────────────┤
│  Estirando     │  Velocidad < 100%. Canción más lenta.       │
├────────────────┼──────────────────────────────────────────────┤
│  Comprimiendo  │  Velocidad > 100%. Canción más rápida.      │
├────────────────┼──────────────────────────────────────────────┤
│  Cambiando     │  Recalculando en tiempo real (slider activo) │
├────────────────┼──────────────────────────────────────────────┤
│  Límite        │  Valor truncado a 50% o 200%. Notificado.   │
└────────────────┴──────────────────────────────────────────────┘

       ┌──────────┐
       │  BYPASS  │
       └────┬─────┘
            │ set % != 100
            ▼
       ┌──────────┐
       │  ACTIVO  │
       └────┬─────┘
            │
       ┌────┴──────────┐
       │               │
       ▼               ▼
  ┌──────────┐  ┌──────────────┐
  │ESTIRANDO │  │COMPRIMIENDO  │
  │ (< 100%) │  │ (> 100%)     │
  └────┬─────┘  └──────┬───────┘
       │               │
       └───────┬───────┘
        │ set % = 100
                ▼
           ┌──────────┐
           │  BYPASS  │
           └──────────┘
```

---

## Interacción

**Tipo:** slider (porcentaje de velocidad) + toggle (preservar tono) + button (restablecer)

**Estados y transiciones:**
- Bypass (100%) → [ajustar slider] → Activo (% ≠ 100)
- Activo → [ajustar slider] → Cambiando (arrastre en curso)
- Cambiando → [soltar slider] → Activo (valor fijo)
- Activo → [set % = 100] → Bypass
- Activo (% < 100) → Estirando
- Activo (% > 100) → Comprimiendo
- Cualquiera → [% fuera de rango] → Límite alcanzado
- Toggle Preservar tono → ON/OFF en cualquier estado

**Comportamiento por estado:**
- **Bypass (100%):** Slider centrado en 100%. Sin procesamiento. Audio pasa directo.
- **Estirando (% < 100):** Canción más lenta. Se muestra duración resultante aumentada.
- **Comprimiendo (% > 100):** Canción más rápida. Se muestra duración resultante reducida.
- **Cambiando:** Slider siendo arrastrado. El audio se actualiza en TIEMPO REAL.
- **Límite alcanzado:** Slider en 50% o 200%. Tooltip: «Límite de velocidad».
- **Preservar tono OFF:** Efecto cassette activo. Advertencia visual.

---

## Estilos CSS

**.ui-stretch-slider--bypass**
- accent-color: #888; opacity: 0.5
- .theme-dark: accent-color: #666; .theme-light: accent-color: #aaa

**.ui-stretch-slider--stretching**
- accent-color: #9C27B0 (morado sugiere desaceleración)
- .theme-dark: accent-color: #CE93D8; .theme-light: accent-color: #7B1FA2

**.ui-stretch-slider--compressing**
- accent-color: #FF5722 (naranja/rojo sugiere aceleración)
- .theme-dark: accent-color: #FF8A65; .theme-light: accent-color: #D84315

**.ui-stretch-slider--changing**
- accent-color: #FF9800; transition: none

**.ui-stretch-toggle**
- appearance: switch; cursor: pointer
- .theme-dark: accent-color: #4CAF50; .theme-light: accent-color: #388E3C
- &:disabled: opacity: 0.4; cursor: not-allowed

**.ui-stretch-label--duration**
- font-size: 13px; text-align: center
- .theme-dark: color: rgba(255,255,255,0.7); .theme-light: color: rgba(0,0,0,0.7)

**.ui-stretch-warning--cassette**
- font-size: 12px; padding: 4px 8px; border-radius: 6px
- background: rgba(255,152,0,0.15); color: #FF9800; border: 1px solid rgba(255,152,0,0.3)

**.show-mode .ui-stretch-slider**
- display: none (en modo show no se ajusta velocidad)

