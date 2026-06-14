---
ruta: docs/componentes/04-bpm-analyzer.md
tipo: componente
origen: "[[01-modelo-audio]]"
estado: estable
---

# Analizador de BPM

## Función

Analizar el audio de una canción recién importada para calcular su BPM y clasificar su nivel de energía, y publicar ese resultado en el modelo de audio y en el algoritmo de mood.

## Entrada

- Audio de la canción al momento de importación ← [[03-vista-libreria]]

## Proceso

El analizador recibe el archivo de audio al importarse a la librería. Divide la señal en segmentos (ventaneo), detecta los picos rítmicos (golpes) y calcula la distancia temporal entre ellos para estimar el BPM. Luego clasifica la energía según el rango de BPM resultante. Si la confianza del cálculo supera el 80%, el BPM se usa automáticamente; entre 50% y 79% se marca como estimado; por debajo de 50%, la canción no entra en colecciones inteligentes.

### Diagrama de flujo

```text
┌────────────────────────┐
│  AUDIO CRUDO           │
│  al importar           │
│  ←                     │
│  [[03-vista-libreria]] │
└──────────┬─────────────┘
           │
           ▼
    ┌──────────────┐
    │  VENTANEO     │
    │  (dividir en  │
    │   segmentos)  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  DETECTAR     │
    │  PICOS        │
    │  RÍTMICOS     │
    │  (golpes)     │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  CALCULAR     │
    │  BPM          │
    │  (distancia   │
    │   entre picos)│
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  CLASIFICAR   │
    │  ENERGÍA      │
    │  SEGÚN BPM    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  EVALUAR      │
    │  CONFIANZA    │
    └──────┬───────┘
           │
     ┌─────┴──────────────────┐
     │           │            │
  [≥80%]▼    [50-79%]▼      ▼[<50%]
 ┌────────┐ ┌────────┐ ┌──────────────┐
 │ BPM    │ │ BPM    │ │ NO ENTRA    │
 │ AUTO   │ │MARCADO │ │ EN COLECC.  │
 │ (colecc│ │"ESTIMA-│ │ INTELIGENTES│
 │ intel.)│ │DO"     │ │ BPM: "—"    │
 └────────┘ └────────┘ └──────────────┘
```

## Salida

- BPM y nivel de energía de la canción → [[01-modelo-audio]]
- BPM y energía para agrupación de colecciones → [[10-algoritmo-mood]]

## Errores

- **Lógico:** se solicita analizar una canción que ya fue borrada del filesystem antes de que el análisis pudiera iniciar
  - *Resolución:* el archivo no existe; se registra el error en el modelo de audio y se notifica al usuario.
- **Semántico:** una canción de música ambient con largos silencios y sin pulso definido es enviada al análisis
  - *Resolución:* el analizador no puede detectar picos rítmicos con confianza suficiente; el BPM queda en "—" y la canción no participa en colecciones inteligentes, lo cual es correcto por diseño.

Catálogo global: [[07-modelo-errores]]

---

## Proceso de análisis

```text
  ┌──────────┐     ┌──────────────┐     ┌──────────────┐
  │          │     │              │     │              │
  │  AUDIO   │────▶│  VENTANEO    │────▶│  DETECCIÓN   │
  │  crudo   │     │  (dividir en │     │  DE PICOS    │
  │          │     │   segmentos) │     │  (golpes)    │
  └──────────┘     └──────────────┘     └──────┬───────┘
                                               │
                                               ▼
                                      ┌──────────────┐
                                      │              │
                                      │  CÁLCULO     │
                                      │  DE BPM      │
                                      │  (distancia  │
                                      │   entre      │
                                      │   picos)     │
                                      └──────┬───────┘
                                             │
                                             ▼
                               ┌─────────────────────────┐
                               │                         │
                               │  CLASIFICACIÓN          │
                               │  ┌───────────────────┐  │
                               │  │ BPM: 128          │  │
                               │  │ Energía: Alta 🔶  │  │
                               │  │ Confianza: 94%    │  │
                               │  └───────────────────┘  │
                               │                         │
                               └─────────────────────────┘
```

---

## Mapa de energía por BPM

```text
  BPM        ENERGÍA        GÉNEROS TÍPICOS
  ─────────────────────────────────────────────────
  60 ── 85   🟢 Suave       Balada, Bossa Nova, Bolero
  86 ── 115  🟡 Media       Pop, Rock, Salsa
  116 ─ 140  🔶 Alta        Electrónica, Merengue, Cumbia
  141 ─ 200  🔴 Muy Alta    Drum & Bass, Hardcore, Metal
```

## Interfaz de usuario

### Durante el análisis:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│         ╔════════════════════════════════════╗               │
│         ║  Analizando: Salsa Brava.mp3       ║               │
│         ║                                     ║               │
│         ║  ████████████████████░░░░░░░  65%   ║               │
│         ║  Detectando pulso musical...        ║               │
│         ║                                     ║               │
│         ║  ♫  Procesando frecuencias...       ║               │
│         ╚════════════════════════════════════╝               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Resultado:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ╔════════════════════════════════════════════════╗         │
│   ║                                                ║         │
│   ║              BPM:  128  🔶                    ║         │
│   ║              ──────────────                    ║         │
│   ║              Energía: Alta                     ║         │
│   ║              Confianza: 94%                    ║         │
│   ║                                                ║         │
│   ║     ┌───┬───┬───┬───┬───┬───┬───┬───┐         ║         │
│   ║     │ █ │ █ │   │ █ │ █ │   │ █ │ █ │         ║         │
│   ║     │ █ │ █ │ █ │ █ │ █ │ █ │ █ │ █ │         ║         │
│   ║     │ █ │ █ │ █ │ █ │ █ │ █ │ █ │ █ │         ║         │
│   ║     │ █ │ █ │ █ │ █ │ █ │ █ │ █ │ █ │         ║         │
│   ║     └───┴───┴───┴───┴───┴───┴───┴───┘         ║         │
│   ║      60     85    115    140     200            ║         │
│   ║     🟢      🟡     🔶     🔴                     ║         │
│   ║                                                ║         │
│   ╚════════════════════════════════════════════════╝         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Niveles de confianza

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   80% ── 100%:  ✅ BPM CONFIABLE                             │
│                 Se usa automáticamente para colecciones      │
│                 inteligentes.                                 │
│                                                              │
│   50% ──  79%:  ⚠️  BPM ESTIMADO                             │
│                 Se usa pero se marca "(estimado)" en la UI.  │
│                                                              │
│    0% ──  49%:  ❌ NO SE PUDO DETERMINAR                     │
│                 La canción no entra en colecciones.          │
│                 Se muestra "BPM: —"                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**¿Por qué falla el análisis?**
- Canciones con mucho silencio o sin ritmo definido.
- Audio de muy baja calidad (grabaciones ambientales).
- Canciones con cambios de tempo drásticos.

---

## Estados

```text
┌──────────────────┬────────────────────────────────────────────┐
│   Estado         │  Comportamiento                            │
├──────────────────┼────────────────────────────────────────────┤
│  Sin analizar    │  Canción recién importada, pendiente       │
│                  │  de análisis.                               │
├──────────────────┼────────────────────────────────────────────┤
│  Analizando      │  Barra de progreso + indicador ⟳.         │
│                  │  Puede tomar 1-5 segundos.                  │
├──────────────────┼────────────────────────────────────────────┤
│  Analizado       │  BPM visible, la canción participa en      │
│                  │  colecciones inteligentes.                  │
├──────────────────┼────────────────────────────────────────────┤
│  Error           │  BPM desconocido (confianza < 50%).        │
│                  │  La canción queda excluida de colecciones.  │
├──────────────────┼────────────────────────────────────────────┤
│  Re-analizando   │  El usuario pidió recalcular.              │
└──────────────────┴────────────────────────────────────────────┘
```

---

## Estrategia

### Algoritmo propuesto
Autocorrelación (función ACF en dominio temporal). Simple, eficiente, bien documentado. Alternativa: Onset Detection + histograma de intervalos (mejor para música con mucha variación rítmica).

### Fork técnico / Alternativas
- **Opción A (Autocorrelación directa):** O(n²) en el dominio temporal. Precisa y determinista. Ideal para archivos <10 min.
- **Opción B (FFT + detección espectral):** O(n log n). Más rápida para archivos largos. Puede confundir armónicos con el pulso fundamental.

### Decisión
Autocorrelación para archivos <10 min (caso típico de canciones individuales). FFT para archivos largos (mezclas, sesiones en vivo). Frame rate: ~100 fps para tiempo real, batch para importación.

### Dependencias técnicas
- Frecuencia de muestreo: 44100 Hz
- Frame size: 2048 samples
- Hop size: 512 samples
- Rango BPM detectable: 60-200
- Umbral de confianza: ≥80% automático, 50-79% estimado, <50% descartado

---

## Interacción

**Tipo:** badge (display de BPM automático) + icon-button (re-análisis manual) + progress-bar (durante análisis)

**Estados y transiciones:**
- Sin analizar → [importación completa] → Analizando
- Analizando → [análisis ok] → Analizado
- Analizando → [confianza < 50%] → Error
- Error → [tap re-analizar] → Re-analizando
- Re-analizando → [análisis ok] → Analizado
- Re-analizando → [confianza < 50%] → Error
- Analizado → [tap re-analizar] → Re-analizando

**Comportamiento por estado:**
- **Sin analizar:** Badge gris con texto «— BPM». Sin indicador de energía.
- **Analizando:** Progress-bar animada + texto «Analizando…». El badge muestra ⟳.
- **Analizado:** Badge con color según energía (🟢🟡🔶🔴). Tooltip: «Confianza: 94%».
- **Error:** Badge gris con texto «BPM: —». Tooltip: «No se pudo determinar el BPM».
- **Re-analizando:** Misma UI que Analizando pero con tooltip «Recalculando…».

---

## Guía de Estilos CSS

**.ui-bpm-badge**
- display: inline-flex; align-items: center; gap: 4px
- padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: bold

**.ui-bpm-badge--analyzing**
- background: rgba(255,152,0,0.15); color: #FF9800
- .theme-dark: background: rgba(255,152,0,0.2); .theme-light: background: rgba(255,152,0,0.1)

**.ui-bpm-badge--analyzed**
- transition: background 0.3s, color 0.3s

**.ui-bpm-badge--error**
- background: rgba(244,67,54,0.15); color: #F44336
- .theme-dark: background: rgba(244,67,54,0.2); .theme-light: background: rgba(244,67,54,0.1)

**.ui-bpm-energy--suave**
- color: #4CAF50
- .theme-dark: color: #66BB6A; .theme-light: color: #388E3C

**.ui-bpm-energy--media**
- color: #FFEB3B
- .theme-dark: color: #FFF176; .theme-light: color: #FBC02D

**.ui-bpm-energy--alta**
- color: #FF9800
- .theme-dark: color: #FFB74D; .theme-light: color: #F57C00

**.ui-bpm-energy--muy-alta**
- color: #F44336
- .theme-dark: color: #EF9A9A; .theme-light: color: #D32F2F

**.ui-bpm-progress-bar**
- width: 100%; height: 4px; border-radius: 2px
- .theme-dark: background: rgba(255,255,255,0.1)
- .theme-light: background: rgba(0,0,0,0.08)
- &::-webkit-progress-value: background: #FF9800; border-radius: 2px

**.ui-bpm-reanalyze-btn**
- width: 28px; height: 28px; border-radius: 50%
- cursor: pointer; border: none
- .theme-dark: background: rgba(255,255,255,0.08); color: #fff
- .theme-light: background: rgba(0,0,0,0.05); color: #333
- &:hover: background: rgba(255,152,0,0.2)
- &:active: transform: scale(0.9)

