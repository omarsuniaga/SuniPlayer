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

El procesador recibe un buffer de audio crudo con el valor de desplazamiento en semitonos (rango -12 a +12). Aplica la transformación frecuencial en tiempo real: estira o comprime la forma de onda en el eje frecuencial sin alterar el eje temporal. Si el ajuste es 0, el buffer pasa sin modificación (modo bypass). El cambio se escucha de inmediato mientras el usuario mueve el slider. El ajuste resultante se guarda automáticamente con la canción.

## Salida

- Buffer de audio con la tonalidad transpuesta → [[01-audio-engine]]

## Errores

- **Lógico:** se recibe un valor de semitonos fuera del rango permitido (-12 a +12) — el slider impide llegar ahí, pero si el valor llega por otro canal, se rechaza y se usa el límite más cercano con aviso.
- **Semántico:** la canción ya tiene `tono_ajuste = +12` guardado y el músico intenta agregar +3 adicionales desde el panel — el tono resultante excedería el rango soportado; la operación se rechaza con aviso "Límite alcanzado: no se puede superar +12 semitonos".

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
│  Sin ajuste  │  El procesador está desactivado (bypass).    │
│  (0)         │  El audio pasa directo a la salida.          │
├──────────────┼──────────────────────────────────────────────┤
│  Con ajuste  │  El procesador está activo en la cadena.     │
├──────────────┼──────────────────────────────────────────────┤
│  Cambiando   │  Se actualiza el tono en tiempo real         │
│  (slider)    │  mientras el usuario arrastra.               │
├──────────────┼──────────────────────────────────────────────┤
│  Límite      │  Se impide ir más allá de ±12 semitonos.    │
│  alcanzado   │  El slider "choca" contra el borde.          │
└──────────────┴──────────────────────────────────────────────┘
```
