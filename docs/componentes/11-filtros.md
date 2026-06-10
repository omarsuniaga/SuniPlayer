---
ruta: docs/componentes/11-filtros.md
tipo: componente
origen: "[[01-vista-inicio]]"
estado: estable
---

# Sistema de Filtros

## Función

Filtrar y ordenar colecciones de canciones y listas de la librería según criterios estructurales (BPM, duración, tipo de curva, formato, cache local); y entregar los conjuntos filtrados resultantes a las vistas correspondientes.

## Entrada

- Propiedades físicas y de análisis del modelo de audio ← [[01-modelo-audio]]
- Criterios de filtrado seleccionados por el usuario desde la pantalla principal ← [[01-vista-inicio]]
- Criterios de filtrado de canciones seleccionados desde la biblioteca ← [[03-vista-libreria]]

## Proceso

1. **Recopilación:** Recibe el conjunto completo de datos (canciones o colecciones) a procesar.
2. **Evaluación de Reglas:** Aplica las reglas lógicas seleccionadas mediante evaluación condicional (AND lógico):
   - **Duración:** Rango min/max en minutos.
   - **Curva de Energía:** Filtra por lineal, campana o exponencial (sólo para Colecciones Inteligentes).
   - **BPM/Energía:** Rangos de BPM clasificados (Suave `60-85`, Media `86-115`, Alta `116-140`, Muy Alta `141-200`).
   - **Formatos y Persistencia:** Filtra canciones según formato de archivo (.mp3, .wav, etc.) o estado de cache local (IndexedDB/física).
3. **Ordenamiento:** Aplica el criterio de ordenamiento secundario (por fecha, reproducciones, BPM o alfabético).
4. **Retorno:** Si el conjunto resultante está vacío, notifica un estado sin resultados para renderizar un aviso de limpieza de filtros.

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  RECIBIR DATOS   │
  │  (canciones o    │
  │   colecciones)   │
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  EVALUAR      │
    │  DURACIÓN     │
    │  ¿rango ok?   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  EVALUAR      │
    │  CURVA/ENERGÍA│
    │  ¿coincide?   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  EVALUAR      │
    │  FORMATO/     │
    │  PERSISTENCIA │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  APLICAR      │
    │  ORDENAMIENTO │
    │  (fecha, BPM, │
    │   reproducc.) │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  ¿RESULTADO  │
    │  VACÍO?      │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ NOTIFIC│ │ DEVOLVER      │
 │AR "SIN │ │ CONJUNTO      │
 │ COINCI │ │ FILTRADO      │
 │ DENCIAS│ │               │
 │" +     │ │               │
 │ sugerir│ │               │
 │ limpiar│ │               │
 │ filtros│ │               │
 └────────┘ └──────────────┘
```

## Salida

- Colecciones filtradas y ordenadas para renderizar → [[01-vista-inicio]]
- Lista de canciones filtradas para la biblioteca → [[03-vista-libreria]]

## Errores

- **Lógico:** se envían criterios de filtrado contradictorios (ej: duración máxima menor que duración mínima)
  - *Resolución:* el componente corrige el rango forzando a que `max = min` y ejecuta la consulta de forma segura.
- **Semántico:** la consulta resulta en cero coincidencias
  - *Resolución:* el componente devuelve un arreglo vacío (`[]`) y activa la bandera visual de error semántico de "Sin Coincidencias" en la UI.

Catálogo global: [[07-modelo-errores]]

---

## Tipos de filtro

### 1. Filtro por duración

Muestra solo colecciones que duran dentro de un rango específico.

```text
┌── FILTRO POR DURACIÓN ─────────────┐
│                                     │
│  Mostrar colecciones que duren:     │
│                                     │
│  [ 30 min ] a [ 45 min ]           │
│  ═══════════●══════════════════     │
│                                     │
│  Resultados: 3 colecciones          │
└─────────────────────────────────────┘
```

### 2. Filtro por tipo de curva

Muestra solo colecciones que tienen un tipo específico de curva de energía.

```text
[✓] Lineal
[✓] Curva
[ ] Exponencial
```

### 3. Filtro por energía

Muestra colecciones cuyo rango de BPM cae dentro de una categoría de energía.

- **Suave:** 60-85 BPM
- **Media:** 86-115 BPM
- **Alta:** 116-140 BPM
- **Muy Alta:** 141-200 BPM

---

## Dónde aparece cada filtro

| Vista | Filtros disponibles |
|-------|-------------------|
| Inicio (sección colecciones inteligentes) | Por tipo de curva, por duración, por energía |
| Inicio (sección playlists) | Por duración, por cantidad de canciones |
| Librería | Por formato, por energía, por BPM, por estado de cache |
| Reproductor | Filtro rápido de búsqueda |

---

## Interacción

**Tipo:** checkbox (filtros booleanos: tipo curva, formato) + range-slider (duración min/max) + chip-selector (energía: 🟢🟡🔶🔴) + dropdown (ordenamiento) + button (limpiar filtros)

**Estados y transiciones:**
- Sin filtros → [seleccionar criterio] → Filtro activo
- Filtro activo → [agregar criterio] → Filtro compuesto (AND)
- Filtro compuesto → [quitar criterio] → Filtro activo (simplificado)
- Filtro activo → [resultado = 0] → Sin coincidencias
- Sin coincidencias → [limpiar filtros] → Sin filtros
- Sin coincidencias → [ajustar criterios] → Filtro activo (nuevos params)

**Comportamiento por estado:**
- **Sin filtros:** Todos los checkboxes sin marcar. Sliders en rango completo. Muestra total de elementos sin filtrar.
- **Filtro activo:** Checkbox marcado. Slider en posición específica. Resultados filtrados. Badge con cantidad: «12 resultados».
- **Filtro compuesto:** Múltiples criterios activos. Cada criterio tiene un ✕ para quitarlo individualmente.
- **Sin coincidencias:** Mensaje «No hay resultados con estos filtros». Botón «Limpiar filtros» destacado.
- **Aplicando:** Los resultados se actualizan en tiempo real mientras se ajustan los sliders (con debounce).

---

## Estilos CSS

**.ui-filter-panel**
- display: flex; flex-direction: column; gap: 12px; padding: 16px
- border-radius: 12px
- .theme-dark: background: rgba(255,255,255,0.03)
- .theme-light: background: rgba(0,0,0,0.02)

**.ui-filter-section-title**
- font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px
- .theme-dark: color: rgba(255,255,255,0.4)
- .theme-light: color: rgba(0,0,0,0.4)

**.ui-filter-checkbox**
- display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px
- .theme-dark: color: rgba(255,255,255,0.8)
- .theme-light: color: rgba(0,0,0,0.8)
- accent-color: #FF9800

**.ui-filter-range-slider**
- width: 100%; accent-color: #FF9800

**.ui-filter-chip-group**
- display: flex; gap: 6px; flex-wrap: wrap

**.ui-filter-chip**
- padding: 4px 12px; border-radius: 16px; font-size: 12px; cursor: pointer
- border: 1px solid transparent; transition: all 0.2s
- .theme-dark: background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.1)
- .theme-light: background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.6); border-color: rgba(0,0,0,0.1)

**.ui-filter-chip--selected**
- border-color: #FF9800; color: #FF9800
- .theme-dark: background: rgba(255,152,0,0.15)
- .theme-light: background: rgba(255,152,0,0.1)

**.ui-filter-chip--suave**    { &.ui-filter-chip--selected: border-color: #4CAF50; color: #4CAF50 }
**.ui-filter-chip--media**    { &.ui-filter-chip--selected: border-color: #FFEB3B; color: #FFEB3B }
**.ui-filter-chip--alta**     { &.ui-filter-chip--selected: border-color: #FF9800; color: #FF9800 }
**.ui-filter-chip--muy-alta** { &.ui-filter-chip--selected: border-color: #F44336; color: #F44336 }

**.ui-filter-dropdown**
- padding: 6px 12px; border-radius: 8px; font-size: 13px
- .theme-dark: background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15)
- .theme-light: background: rgba(0,0,0,0.04); color: #333; border: 1px solid rgba(0,0,0,0.12)

**.ui-filter-badge**
- font-size: 12px; padding: 2px 10px; border-radius: 10px; font-weight: 500
- .theme-dark: background: rgba(255,152,0,0.15); color: #FF9800
- .theme-light: background: rgba(255,152,0,0.1); color: #E65100

**.ui-filter-empty**
- text-align: center; padding: 24px; font-size: 14px
- .theme-dark: color: rgba(255,255,255,0.4)
- .theme-light: color: rgba(0,0,0,0.4)

**.ui-filter-clear-btn**
- padding: 6px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; border: none
- .theme-dark: background: rgba(244,67,54,0.15); color: #F44336
- .theme-light: background: rgba(244,67,54,0.1); color: #D32F2F
- &:hover: background: rgba(244,67,54,0.25)
- &:active: transform: scale(0.97)
