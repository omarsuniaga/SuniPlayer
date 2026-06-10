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

## Salida

- BPM y nivel de energía de la canción → [[01-modelo-audio]]
- BPM y energía para agrupación de colecciones → [[10-algoritmo-mood]]

## Errores

- **Lógico:** se solicita analizar una canción que ya fue borrada del filesystem antes de que el análisis pudiera iniciar — el archivo no existe; se registra el error en el modelo de audio y se notifica al usuario.
- **Semántico:** una canción de música ambient con largos silencios y sin pulso definido es enviada al análisis — el analizador no puede detectar picos rítmicos con confianza suficiente; el BPM queda en "—" y la canción no participa en colecciones inteligentes, lo cual es correcto por diseño.

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
