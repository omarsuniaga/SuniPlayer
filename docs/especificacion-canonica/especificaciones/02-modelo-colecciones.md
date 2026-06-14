# Modelo de Colecciones

## ¿Qué es una Colección?

Es cualquier agrupación de canciones. En Suniplayer hay **cuatro tipos distintos** de colección, cada uno con su propósito y comportamiento.

---

## 1. Playlist (Lista de reproducción)

La colección más simple. Una lista ordenada de canciones que se reproducen una tras otra.

| Propiedad | Descripción |
|-----------|-------------|
| Nombre | El nombre que el usuario le da |
| Canciones | Lista ordenada de IDs de canciones |
| Canción actual | Índice de la canción que está sonando |
| Aleatorio | ¿Reproducir en orden aleatorio? (sí/no) |
| Repetir | ¿Repetir toda la lista al terminar? (sí/no) |

**Comportamiento:**
- Al llegar a la última canción, si Repetir está activo, vuelve a la primera.
- Si Aleatorio está activo, el orden se mezcla al iniciar la playlist.
- El usuario puede reordenar canciones manualmente.

---

## 2. QuouList (Cola dinámica)

Una lista temporal de canciones que se reproducen **después de la canción actual**. El nombre "QuouList" viene de "en cola" y es la herramienta estrella del modo Show.

| Propiedad | Descripción |
|-----------|-------------|
| Canciones en cola | Lista ordenada de IDs |
| Tiempo total restante | Suma de la duración de todas las canciones en cola |

**Comportamiento:**
- Solo existe durante una sesión de reproducción (no se guarda al cerrar la app).
- Al terminar la canción actual, arranca la primera de la cola automáticamente.
- El usuario puede agregar canciones mientras suena otra.
- Al agregar una canción, el contador de tiempo total se actualiza al instante.
- Se puede vaciar la cola completamente.
- Se puede reordenar la cola arrastrando items.

**Diferencia clave con Playlist:**
La Playlist es un plan fijo. La QuouList es improvisación durante un show. El músico decide sobre la marcha qué sigue.

---

## 3. Set (Preparación para show)

Es una playlist especial que el músico prepara **antes** de un show. Es el puente entre el modo Edit y el modo Show.

| Propiedad | Descripción |
|-----------|-------------|
| Nombre | "Show Sábado 15", "Ensayo Jueves", etc. |
| Canciones | Lista ordenada |
| Orden definitivo | No se puede aleatorizar — el orden lo decide el músico |
| Duración total | Suma calculada automáticamente |
| Canción de arranque | Por dónde empieza el show |

**Comportamiento en modo Edit:**
- Se puede agregar, quitar, reordenar canciones.
- Se pueden ajustar tono, tempo, in/out de cada canción.
- Se pueden configurar transiciones (fade) entre canciones.

**Comportamiento en modo Show:**
- El orden está bloqueado.
- Solo se puede interactuar con la QuouList para agregar canciones adicionales.
- Aparece un cronómetro general del show.

---

## 4. Colección Inteligente (Generación automática)

Una colección que Suniplayer **crea sola** basándose en el análisis de las canciones. El usuario no agrega canciones manualmente — el sistema las agrupa según su BPM y energía.

| Propiedad | Descripción |
|-----------|-------------|
| Nombre | Auto-generado ("Curva #3", "120 BPM Lineal") |
| Tipo de curva | Cómo se agruparon las canciones |
| Canciones | Lista calculada por el algoritmo |
| Rango de BPM | BPM mínimo y máximo de las canciones incluidas |
| Duración total | Suma calculada automáticamente |
| Regenerable | Se puede recalcular cuando se agregan nuevas canciones |

Las Colecciones Inteligentes se dividen en DOS familias de criterios:

---

#### Familia A: por curva de ánimo/BPM

Estas colecciones agrupan canciones según su progresión de BPM. El algoritmo que las genera se describe en `[[componentes/10-algoritmo-mood]]`.

| Curva | Comportamiento | Ejemplo de uso |
|-------|---------------|----------------|
| **Lineal** | Canciones con BPM parecido (±5 BPM) | Un set de techno constante |
| **Curva** | BPM bajo → sube → vuelve a bajar | Set con apertura suave, clímax, cierre |
| **Exponencial** | BPM aumenta progresivamente | Set que va de lo suave a lo intenso sin parar |

**¿Cómo se determinan?**

1. Suniplayer analiza todas las canciones disponibles y extrae su BPM.
2. Según el tipo de curva, el algoritmo agrupa canciones que encajan en esa progresión.
3. Se genera una colección con un nombre descriptivo.
4. El usuario puede explorar estas colecciones desde la vista de inicio.

---

#### Familia B: por contador de reproducciones

**Colección Inteligente: Más Reproducidas**

Agrupa automáticamente las N canciones con mayor contador de reproducciones en la librería del usuario. No usa BPM ni curvas de ánimo — su único criterio es cuántas veces se reprodujo cada canción.

| Propiedad | Descripción |
|-----------|-------------|
| Nombre | "Más Reproducidas" (fijo, no auto-generado) |
| Criterio | Contador de reproducciones de cada canción |
| Cantidad | Las 20 canciones con mayor contador (configurable) |
| Orden | De mayor a menor contador de reproducciones |
| Regeneración | Se recalcula automáticamente cada vez que cambia un contador |

**Comportamiento:**
- La colección se recalcula sola. No requiere intervención del usuario.
- Si dos canciones tienen el mismo contador, el desempate es por fecha de última reproducción (más reciente primero).
- Si la librería tiene menos de 20 canciones con al menos una reproducción, muestra todas las que hayan sonado al menos una vez.
- El usuario no puede editar ni reordenar esta colección manualmente.

---

## Comparación rápida

| Tipo | Lo crea | Persiste | Ordén editable | Aleatorio | Para qué |
|------|---------|----------|---------------|-----------|----------|
| Playlist | Usuario | Sí | Sí | Sí | Escucha diaria |
| QuouList | Usuario (en vivo) | No | Sí | No | Improvisar en show |
| Set | Usuario | Sí | Solo en Edit | No | Show planificado |
| Colección Inteligente | Sistema | Sí | No | No | Descubrimiento |

---

## Creación y eliminación de colecciones

### Crear una Playlist o Colección manualmente

El usuario puede crear una Playlist de forma manual seleccionando canciones desde la librería. El flujo de UI se describe en `[[vistas/01-vista-inicio]]` (sección "Crear Colección Inteligente o Playlist manualmente"). El modal tiene: cabecera (conteo + duración total), cuerpo (lista con acciones Agregar/Quitar), y pie (paginador + Guardar/Cerrar).

### Eliminar colecciones

El usuario puede eliminar una o más Playlists o Sets. El proceso requiere:
1. Seleccionar las colecciones a eliminar (casillas de selección múltiple).
2. Confirmar en un modal que lista las colecciones seleccionadas y advierte que la acción no se puede deshacer.
3. Las canciones NO se eliminan de la librería — solo se elimina la colección.

Las Colecciones Inteligentes (por curva o por contador) no se pueden eliminar manualmente — se regeneran automáticamente. El usuario puede forzar una regeneración con pull-to-refresh.

---

## Estado de una colección

Toda colección puede estar en uno de estos estados:

- **Vacía**: sin canciones.
- **Poblada**: tiene canciones.
- **En reproducción**: actualmente sonando desde esta colección.
- **Completa** (solo Sets): todas las transiciones y ajustes están configurados.
