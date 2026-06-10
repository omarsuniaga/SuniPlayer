---
ruta: docs/componentes/16-ecualizador.md
tipo: componente
origen: "[[01-audio-engine]]"
estado: estable
---

# Ecualizador (EQ)

## Función

Procesar un stream de audio aplicando ganancia o atenuación sobre bandas de frecuencia específicas (3 a 5 bandas); y devolver el flujo ecualizado en tiempo real al motor de audio.

## Entrada

- Nodo de audio/buffer de origen y ganancias de banda (dB) ← [[01-audio-engine]]

## Proceso

1. **Inserción en la Cadena de Audio:** El ecualizador se conecta en serie en la cadena de procesamiento de [[01-audio-engine]]:
   `Pitch Shifter ➔ Time Stretcher ➔ **Ecualizador (EQ)** ➔ Fade Engine ➔ Salida física`.
2. **Configuración de Bandas:** Configura 3 o 5 filtros en serie:
   - Banda de Graves (Low Shelf): Frecuencia de corte ~100Hz.
   - Banda de Medios-Graves (Peaking): Frecuencia central ~400Hz.
   - Banda de Medios (Peaking): Frecuencia central ~1000Hz (1kHz).
   - Banda de Medios-Agudos (Peaking): Frecuencia central ~3000Hz (3kHz).
   - Banda de Agudos (High Shelf): Frecuencia de corte ~8000Hz (8kHz).
3. **Aplicación de Ganancia:** Por cada banda, aplica ganancia en dB (rango -10dB a +10dB).
4. **Tiempo Real:** Los cambios se aplican de inmediato mientras el usuario arrastra los sliders.
5. **Persistencia:** Al confirmar, las ganancias se guardan en [[04-almacenamiento]] (por track o global).
6. **Bypass:** Si todas las bandas están en 0dB, el buffer pasa sin modificación.

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  RECIBE BUFFER   │
  │  + ganancias (N) │
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  ¿todas 0dB? │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌────────────────┐
 │ BYPASS │ │ APLICAR FILTROS│
 │ (pasa  │ │ por banda:     │
 │  igual)│ │  ┌─ Low Shelf  │
 └───┬────┘ │  ├─ Peaking 400│
     │      │  ├─ Peaking 1K │
     │      │  ├─ Peaking 3K │
     │      │  └─ High Shelf │
     │      └───────┬────────┘
     │              │
     └──────┬───────┘
            ▼
   ┌─────────────────┐
   │  BUFFER → 05     │
   │  fade-engine      │
   └─────────────────┘
```

## Salida

- Buffer de audio con ecualización aplicada → [[01-audio-engine]]
- Preferencias de ganancia de bandas para persistir → [[04-almacenamiento]]

## Errores

- **Lógico:** el nodo de audio entrante no está inicializado o la Web Audio API es inaccesible en el navegador.
  *Resolución:* El componente entra en modo bypass, pasando el buffer original sin modificaciones para evitar cortes de audio.
- **Semántico:** los valores de ganancia de las bandas exceden el rango físico permitido (-10dB a +10dB).
  *Resolución:* Se truncan los valores a los límites y se notifica el error.

Catálogo global: [[07-modelo-errores]]

---

## Interacción

**Tipo:** slider-multibanda (5 sliders verticales independientes)

**Estados y transiciones:**

```text
  ┌──────────┐
  │ BYPASS   │ ──[ajustar banda]──▶ ┌──────────┐
  │ (0dB all)│                      │ ACTIVO   │
  └──────────┘ ◀──[0dB all]─────── │ (ECUALIZ.)│
                                    └────┬─────┘
                                         │
                                    ┌────┴────┐
                                    │         │
                                    ▼         ▼
                               ┌────────┐ ┌──────────┐
                               │ ESTABLE│ │CAMBIANDO │
                               │ (dB ok)│ │(arrastre) │
                               └────────┘ └──────────┘
```

**Comportamiento por estado:**
- **Bypass:** Todos los sliders en 0. Línea plana en la visualización. Sin carga de procesamiento.
- **Activo:** Sliders en posición distinta de 0. Procesamiento activo.
- **Cambiando:** Slider siendo arrastrado. El audio se actualiza en tiempo real.
- **Límite:** Slider llega a -10dB o +10dB. Freno visual ("choca" contra el borde).

---

## Estilos CSS

```css
/* Panel de EQ — contenedor */
.ui-eq-panel {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.theme-dark .ui-eq-panel {
  background: rgba(255, 255, 255, 0.05);
}

.theme-light .ui-eq-panel {
  background: rgba(0, 0, 0, 0.04);
}

/* Slider individual */
.ui-eq-slider {
  width: 32px;
  height: 120px;
  accent-color: #4CAF50;
  writing-mode: vertical-lr;
}

.theme-dark .ui-eq-slider {
  accent-color: #66BB6A;
}

.theme-light .ui-eq-slider {
  accent-color: #388E3C;
}

/* Etiqueta de frecuencia debajo del slider */
.ui-eq-label {
  font-size: 10px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.theme-dark .ui-eq-label {
  color: rgba(255, 255, 255, 0.5);
}

.theme-light .ui-eq-label {
  color: rgba(0, 0, 0, 0.5);
}

/* Valor dB sobre el slider */
.ui-eq-value {
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  color: #ffffff;
}

.theme-dark .ui-eq-value {
  color: #e0e0e0;
}

.theme-light .ui-eq-value {
  color: #333333;
}

.ui-eq-value--boost {
  color: #4CAF50;
}

.ui-eq-value--cut {
  color: #FF5722;
}
```

---

## Wireframe

```text
┌─────────── PANEL EQ ────────────────────────────────────┐
│                                                          │
│  [+6]  [+3]  [ 0]  [-2]  [-4]                          │
│   │     │     │     │     │                             │
│   ║     ║     ║     ║     ║                             │
│   ║     ║     ║     ║     ║                             │
│   ║     ║     ─     ║     ║                             │
│   ║     ║     ─     ─     ║                             │
│   ║     ║     ─     ─     ─                             │
│   ║     ║     ─     ─     ─                             │
│   ║     ─     ─     ─     ─                             │
│   ─     ─     ─     ─     ─                             │
│   ─     ─     ─     ─     ─                             │
│   ─     ─     ─     ─     ─                             │
│  ───    ───   ───   ───   ───                           │
│ ───── ───── ───── ───── ─────                            │
│ │     │     │     │     │                                │
│ 100Hz 400Hz 1KHz  3KHz  8KHz                            │
│ Graves                Agudos                             │
│                                                          │
│ [↺ Restablecer]                  [✓ Aplicar y cerrar]   │
└──────────────────────────────────────────────────────────┘
```
