# Analizador de BPM

## ¿Qué es?

Un componente que **escucha** el archivo de audio, detecta su ritmo, y calcula los **Beats Per Minute** (BPM). También clasifica la canción según su energía.

Sin este componente, las Colecciones Inteligentes no existirían.

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
