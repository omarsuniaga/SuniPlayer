# Pitch Shifter (Cambio de Tono)

## ¿Qué es?

Un procesador de audio que cambia el **tono** de una canción sin afectar su **velocidad**. Es decir, podés subir o bajar la tonalidad y la canción sigue durando lo mismo y sonando al mismo tempo.

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
