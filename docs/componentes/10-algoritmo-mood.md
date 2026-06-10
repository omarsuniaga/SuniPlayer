# Algoritmo de Ánimo (Mood/Energy Algorithm)

## ¿Qué es?

El cerebro detrás de las **Colecciones Inteligentes de curva de BPM**. Toma todas las canciones analizadas y las agrupa según su **energía rítmica** para crear experiencias musicales coherentes.

> **Alcance de este algoritmo:** este componente es EXCLUSIVO para las colecciones basadas en curva de BPM (Lineal, Curva, Exponencial). No tiene ninguna relación con la Colección Inteligente: Más Reproducidas, que es una colección separada basada en el contador de reproducciones de cada canción — no en ánimo ni en BPM. Las dos lógicas son completamente independientes.

---

## ¿Cómo funciona en lenguaje natural?

El algoritmo recibe una lista de canciones con sus BPM y las organiza en grupos que **funcionan bien juntos**.

Pensalo como un DJ organizando su set:
- No pondría una balada lenta después de un tema de drum & bass.
- Buscaría canciones que fluyan naturalmente de una a otra.
- Querría saber cómo sería un set que sube gradualmente de intensidad.

El algoritmo hace exactamente eso, pero automático.

---

## Entrada del algoritmo

```text
Lista de canciones con BPM analizado:
[
  { nombre: "Balada Triste.mp3",  bpm: 72,  duracion: 210 },
  { nombre: "Salsa Brava.mp3",    bpm: 128, duracion: 225 },
  { nombre: "Merengón.wav",       bpm: 135, duracion: 241 },
  { nombre: "Rock Pesado.ogg",    bpm: 145, duracion: 201 },
  { nombre: "Bachata Rosa.flac",  bpm: 118, duracion: 214 },
  { nombre: "Jazz Suave.mp3",     bpm: 85,  duracion: 310 },
]
```

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
- Una playlist para estudiar/trabajar sin cambios bruscos.
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
- Cuando querés llevar al oyente de un estado de ánimo a otro y volver.

### 3. Exponencial (Escalada)

Canciones donde el BPM **aumenta progresivamente** sin bajar.

```text
BPM: 72 → 85 → 100 → 118 → 128 → 135 → 145
     (cada canción es más rápida que la anterior)
```

**Para qué sirve:**
- Sets que van de lo suave a lo intenso.
- Calentamiento musical (empezás relajado y terminás agitado).
- Sesiones de ejercicio o baile.

---

## Salida del algoritmo

```text
Colecciones Inteligentes generadas:
[
  {
    nombre: "120 BPM Lineal #1",
    tipo: "lineal",
    canciones: 8,
    duracion: "28:34",
    rango_bpm: "118-123"
  },
  {
    nombre: "Curva de Energía #3",
    tipo: "curva",
    canciones: 12,
    duracion: "41:12",
    rango_bpm: "72-145"
  },
  {
    nombre: "Escalada Exponencial #1",
    tipo: "exponencial",
    canciones: 6,
    duracion: "21:05",
    rango_bpm: "72-145"
  }
]
```

---

## Criterios para generar una colección

| Factor | Qué evalúa | Condición |
|--------|-----------|-----------|
| Cantidad mínima | ¿Hay suficientes canciones? | Mínimo 4 canciones por colección |
| Coherencia de BPM | ¿Los BPM son consistentes? | Lineal: ±5 BPM; Curva: progresión suave |
| Duración mínima | ¿La colección tiene sentido? | Mínimo 10 minutos de música |
| Sin solapamiento | ¿Una canción ya está en otra colección similar? | Una canción puede estar en múltiples colecciones |

---

## Regeneración

Las colecciones inteligentes se regeneran cuando:

1. **Se importan canciones nuevas** → el algoritmo se ejecuta de nuevo.
2. **El usuario hace pull-to-refresh** → fuerza regeneración.
3. **Se elimina una canción** → la colección se actualiza.
4. **El usuario re-analiza el BPM de una canción** → el BPM cambia, la colección puede cambiar.

---

## Limitaciones

- Una canción sin BPM analizado (confianza < 50%) no entra en ninguna colección inteligente.
- Si hay menos de 4 canciones analizadas, no se generan colecciones (la app muestra "Importá más canciones para generar colecciones").
- El algoritmo no considera género musical (solo BPM). Dos canciones de distinto género pueden terminar juntas si tienen BPM similar.
- El algoritmo no considera clave musical. Futura mejora posible.

---

## Relación con otros componentes

| Componente | Relación |
|-----------|----------|
| BPM Analyzer | El algoritmo consume el BPM de cada canción |
| Colecciones (modelo) | Las colecciones inteligentes son un tipo de colección |
| Vista Inicio | Las colecciones inteligentes se muestran en la sección principal de inicio |

---

## Estados

| Estado | Comportamiento |
|--------|---------------|
| Sin datos | Menos de 4 canciones analizadas → no se generan colecciones |
| Generando | Procesando agrupaciones (rápido, < 1 segundo) |
| Generado | Colecciones disponibles y visibles |
| Actualizado | Se agregaron/quitaron canciones → colecciones recalculadas |
| Vacío | Hay canciones pero ninguna cumple los criterios mínimos |
