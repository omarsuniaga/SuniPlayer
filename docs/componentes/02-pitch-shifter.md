---
ruta: docs/componentes/02-pitch-shifter.md
tipo: componente
origen: "[[01-audio-engine]]"
estado: estable
---

# Pitch Shifter (Cambio de Tono)

## Función

Desplazar la tonalidad de un buffer de audio en semitonos, sin afectar su velocidad ni duración, y devolver el buffer procesado al motor de reproducción.

## Entrada

- Buffer de audio y cantidad de semitonos a desplazar ← [[01-audio-engine]]

## Proceso

1. El procesador recibe un buffer de audio crudo con el valor de desplazamiento en semitonos (rango -12 a +12).
2. Si el ajuste es 0, el buffer pasa sin modificación (modo bypass).
3. Si el ajuste es distinto de 0, aplica la transformación frecuencial: estira o comprime la forma de onda en el eje frecuencial sin alterar el eje temporal.
4. El cambio se escucha de inmediato mientras el usuario mueve el slider (el slider es UI del reproductor, el procesador responde en tiempo real).
5. El buffer procesado se envía al [[03-time-stretcher]] (siguiente eslabón de la cadena).
6. El ajuste se guarda automáticamente con la canción en [[04-almacenamiento]].

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  RECIBE BUFFER   │
  │  + semitonos (N) │
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  ¿N == 0?    │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌────────────────┐
 │ BYPASS │ │ TRANSFORMACIÓN │
 │ (pasa  │ │ FRECUENCIAL    │
 │  igual)│ │ (estira/comprime│
 └───┬────┘ │  eje frecuencial│
     │      └───────┬────────┘
     │              │
     └──────┬───────┘
            ▼
   ┌─────────────────┐
   │  BUFFER → 03    │
   │  time-stretcher  │
   └─────────────────┘
```

## Salida

- Buffer de audio con la tonalidad transpuesta → [[01-audio-engine]]
- Buffer de audio transpuesto para encadenar velocidad → [[03-time-stretcher]]

## Errores

- **Lógico:** se recibe un valor de semitonos fuera del rango permitido (-12 a +12)
  - *Resolución:* el slider impide llegar ahí, pero si el valor llega por otro canal, se rechaza y se usa el límite más cercano con aviso.
- **Semántico:** la canción ya tiene `tono_ajuste = +12` guardado y el músico intenta agregar +3 adicionales desde el panel
  - *Resolución:* el tono resultante excedería el rango soportado; la operación se rechaza con aviso "Límite alcanzado: no se puede superar +12 semitonos".

Catálogo global: [[07-modelo-errores]]

---

## ¿Cómo funciona en lenguaje natural?

Imaginá una cinta magnética reproduciéndose.

- Si la hacés girar **más rápido**, el tono sube (voz aguda) y la canción termina antes.
- Si la hacés girar **más lento**, el tono baja (voz grave) y la canción dura más.

El pitch shifter **rompe esa relación**: estira o comprime la forma de onda en el eje frecuencial sin tocar el eje temporal.

---

## Rango de ajuste

```text
  ↓ GRAVE                    AGUDO ↑
  ──┼──────┼──────┼──────┼──────┼──────┼──────┼──
   -12     -8     -4      0     +4     +8    +12
                           │
                     Tono original
                    (Do Mayor)
```

## Interfaz de usuario
*La UI del slider de tono vive en [[02-vista-reproductor]]. Este componente es el procesador interno.*

```text
┌─────── AJUSTE DE TONO ──────────────────────────────────────┐
│                                                              │
│  ♫  Canción: Salsa Brava                                    │
│                                                              │
│  ─── TONO ORIGINAL ──────────────────────────────────────── │
│  Do Mayor                                                    │
│                                                              │
│  ─── AJUSTE ──────────────────────────────────────────────── │
│                                                              │
│        [-12]  [-]  [ ● ]  [+]  [+12]                       │
│               ──────●══════      +3                         │
│                                                              │
│  ─── TONO RESULTANTE ─────────────────────────────────────── │
│  Re Mayor  (+3 semitonos)                                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  ⚠️  Arriba de +8 semitonos pueden aparecer artefactos  ││
│  │      audibles (sonido "metálico").                      ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [↺ Restablecer]                    [✓ Aplicar y cerrar]    │
└──────────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- El cambio se escucha en **tiempo real** mientras se mueve el slider.
- Muestra el tono original y el tono resultante.
- El ajuste se **guarda automáticamente** en la DB.

## Calidad de sonido

```text
Calidad del pitch shift según rango:

  ±0  ── ±4  semitonos:  Excelente (transparente)
  ±4  ── ±8  semitonos:  Buena (mínimos artefactos)
  ±8  ── ±12 semitonos:  Aceptable (artefactos notorios pero funcional)

  ⚠️  Más de ±12 semitonos no está soportado.
```

---

## Relación: Pitch + Time Stretch

```text
Escenario real:
"Esta canción está en Sol Mayor pero yo canto en Mi.
Y además la quiero un toque más lenta para practicar."

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │   Pitch Shifter   ═══►   -3 semitonos  (Sol → Mi)     │
  │                                                         │
  │   Time Stretcher  ═══►   85% velocidad  (más lenta)    │
  │                                                         │
  │   ▶ Ambos activos al mismo tiempo                      │
  │   ▶ La canción suena en MI y más lenta, con calidad    │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

---

## Estados

```text
┌──────────────┬──────────────────────────────────────────────┐
│   Estado     │  Comportamiento                              │
├──────────────┼──────────────────────────────────────────────┤
│  Sin ajuste  │  Bypass: el buffer pasa sin modificar.       │
│  (0)         │  Sin carga de procesamiento.                 │
├──────────────┼──────────────────────────────────────────────┤
│  Con ajuste  │  Procesador activo. Transformación aplicada  │
├──────────────┼──────────────────────────────────────────────┤
│  Cambiando   │  Recalculando en tiempo real mientras el     │
│  (slider)    │  usuario arrastra.                           │
├──────────────┼──────────────────────────────────────────────┤
│  Límite      │  Valor truncado al límite ±12. Se notifica.  │
│  alcanzado   │                                               │
└──────────────┴──────────────────────────────────────────────┘

       ┌──────────┐
       │  BYPASS  │
       └────┬─────┘
            │ set N != 0
            ▼
       ┌──────────┐
       │  ACTIVO  │
       └────┬─────┘
            │
       ┌────┴────┐
       │         │
       ▼         ▼
  ┌────────┐ ┌──────────┐
  │ ESTABLE│ │CAMBIANDO │
  │ (N fij)│ │(N móvil) │
  └────────┘ └──────────┘
       │         │
       └────┬────┘
            │ set N = 0
            ▼
        ┌──────────┐
        │  BYPASS  │
        └──────────┘
```

---

## Interacción

**Tipo:** slider (desplazamiento en semitonos) + button (restablecer)

**Estados y transiciones:**
- Bypass (N=0) → [ajustar slider] → Activo (N≠0)
- Activo → [ajustar slider] → Cambiando (arrastre en curso)
- Cambiando → [soltar slider] → Activo (valor fijo)
- Activo → [set N=0] → Bypass
- Cualquiera → [N fuera de rango] → Límite alcanzado (truncado)

**Comportamiento por estado:**
- **Bypass (0):** Slider centrado en 0. Sin carga de procesamiento. Audio pasa directo.
- **Activo:** Slider en posición distinta de 0. Transformación activa. Se muestra tono resultante.
- **Cambiando:** Slider siendo arrastrado. El audio se actualiza en TIEMPO REAL.
- **Límite alcanzado:** Slider en ±12. Freno visual («choca» contra el borde). Tooltip: «Límite alcanzado».
- **Disabled:** No hay canción cargada. Slider gris, sin respuesta al tacto.

---

## Estilos CSS

**.ui-pitch-slider--bypass**
- accent-color: #888; opacity: 0.5
- .theme-dark: accent-color: #666; .theme-light: accent-color: #aaa

**.ui-pitch-slider--active**
- accent-color: #4CAF50
- .theme-dark: accent-color: #66BB6A; .theme-light: accent-color: #388E3C

**.ui-pitch-slider--changing**
- accent-color: #FF9800; transition: none (respuesta inmediata)
- .theme-dark: accent-color: #FFB74D; .theme-light: accent-color: #F57C00

**.ui-pitch-reset**
- width: 32px; height: 32px; border-radius: 50%
- cursor: pointer; transition: transform 0.15s
- .theme-dark: background: rgba(255,255,255,0.1); color: #fff
- .theme-light: background: rgba(0,0,0,0.06); color: #333
- &:hover: transform: scale(1.1)
- &:active: transform: scale(0.95)

**.ui-pitch-display--result**
- font-size: 14px; font-weight: bold; text-align: center
- .theme-dark: color: #e0e0e0; .theme-light: color: #333

**.show-mode .ui-pitch-slider**
- display: none (en modo show no se ajusta tono) 

