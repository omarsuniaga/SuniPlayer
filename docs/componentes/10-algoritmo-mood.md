---
ruta: docs/componentes/10-algoritmo-mood.md
tipo: componente
origen: "[[02-modelo-colecciones]]"
estado: estable
---

# Algoritmo de Ánimo (Mood/Energy Algorithm)

## Función

Clasificar y agrupar canciones de forma automatizada según su BPM y niveles de energía estimados; calcular progresiones de tempo (curvas lineal, campana y exponencial); y generar Colecciones Inteligentes coherentes rítmicamente para el usuario.

## Entrada

- BPM y clasificación de energía estimadas por track ← [[04-bpm-analyzer]]

## Proceso

1. **Recolección de Datos:** Lee los metadatos físicos y analizados de todas las canciones registradas en la librería. Descarta tracks que no posean un BPM válido (confianza < 50%).
2. **Criterios de Agrupación (Progresiones):**
   - **Lineal (BPM Constante):** Agrupa canciones cuyo BPM varía en un rango de ±5. Crea bloques uniformes de tempo constante.
   - **Curva (Campana):** Ordena un conjunto de canciones comenzando por tempo lento, ascendiendo paulatinamente hasta un clímax (BPM máximo) y descendiendo simétricamente hacia el final.
   - **Exponencial (Escalada):** Ordena las canciones en una secuencia estrictamente ascendente de BPM.
3. **Validación de Criterios Mínimos:**
   - Cada colección debe contener un mínimo de 4 canciones.
   - La duración total acumulada de la colección debe superar los 10 minutos.
   - Si no se cumplen estos requisitos, la colección no se expone a la UI.
4. **Regeneración:** El algoritmo se vuelve a disparar ante importación de tracks, reanálisis de BPM, gestos de pull-to-refresh en la UI o borrado de tracks.

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  EVENTO          │
  │  (importación,   │
  │  reanálisis,     │
  │  pull-to-refresh,│
  │  borrado)        │
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  LEER ALL    │
    │  TRACKS      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  DESCARTAR   │
    │  BPM < 50%   │
    │  confianza   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  ¿QUÉDAN ≥4  │
    │  CANCIONES?  │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ GENERAR│ │ ABORTAR      │
 │ COLECC.│ │ estado       │
 │ según  │ │ SIN_DATOS    │
 │ tipo   │ └──────────────┘
 └───┬────┘
     │
     ▼
  ┌──────────────────┐
  │  GENERAR LINEAL  │
  │  (BPM ±5)        │
  │  SIEMPRE         │
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  ¿HAY DATOS  │
    │  PARA CURVA? │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ GENERAR│ │ SOLO LINEALES│
 │ CURVA  │ │ reportar     │
 │ +      │ │ SÓLO_LINEALES│
 │ ESCAL. │ └──────────────┘
 └───┬────┘
     │
     ▼
    ┌──────────────┐
    │  VALIDAR     │
    │  DURACIÓN ≥  │
    │  10 min      │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ EXPONER│ │ NO EXPONER   │
 │ EN UI  │ │ EN UI        │
 └────────┘ └──────────────┘
```

## Salida

- Estructura y tracks de las Colecciones Inteligentes generadas → [[02-modelo-colecciones]]
- Tarjetas de colecciones auto-generadas a renderizar → [[01-vista-inicio]]

## Errores

- **Lógico:** el número de canciones analizadas en la librería es inferior a 4
  - *Resolución:* el algoritmo aborta la ejecución de forma limpia y reporta estado `SIN_DATOS`.
- **Semántico:** todas las canciones de la librería tienen el mismo BPM exacto
  - *Resolución:* el algoritmo no puede calcular curvas de progresión (Campana o Escalada); únicamente genera colecciones de tipo Lineal y reporta estado `SÓLO_LINEALES`.

Catálogo global: [[07-modelo-errores]]

---

## Tipos de colección que genera

### 1. Lineal (BPM constante)

Canciones con BPM **similar** (±5 BPM). La colección más simple.

```text
Entrada: canciones con BPM 118, 120, 123, 119, 121
Resultado: Colección "120 BPM Lineal" — todas suenan a tempo parecido
```

**Para qué sirve:**
- Un set de música bailable constante.
- Mezcla continua sin sobresaltos.

### 2. Curva (Campana)

Canciones que empiezan suaves, suben a un pico, y vuelven a bajar.

```text
BPM:  72 → 85 → 118 → 135 → 145 → 128 → 85 → 72
      (inicio suave)  ↗ pico  ↘  (vuelta a lo suave)
```

**Para qué sirve:**
- Un show con apertura, clímax y cierre.
- Una experiencia musical narrativa (como un concierto tradicional).

### 3. Exponencial (Escalada)

Canciones donde el BPM **aumenta progresivamente** sin bajar.

```text
BPM: 72 → 85 → 100 → 118 → 128 → 135 → 145
     (cada canción es más rápida que la anterior)
```

**Para qué sirve:**
- Sets que va de lo suave a lo intenso.
- Calentamiento musical.

---

## Criterios para generar una colección

| Factor | Qué evalúa | Condición |
|--------|-----------|-----------|
| Cantidad mínima | ¿Hay suficientes canciones? | Mínimo 4 canciones por colección |
| Coherencia de BPM | ¿Los BPM son consistentes? | Lineal: ±5 BPM; Curva: progresión suave |
| Duración mínima | ¿La colección tiene sentido? | Mínimo 10 minutos de música |
| Sin solapamiento | ¿Una canción ya está en otra colección similar? | Una canción puede estar en múltiples colecciones |
