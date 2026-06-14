---
ruta: docs/diccionario/01-diccionario-datos.md
tipo: diccionario
origen: "[[04-almacenamiento]]"
estado: estable
---

# Diccionario de Datos

Este documento detalla la estructura física campo por campo de la base de datos local de Suniplayer, mapeando responsabilidades de escritura y lectura.

---

## Tablas de la Base de Datos Local

### 1. Tabla: canciones
Almacena la unidad básica de reproducción física y configuraciones de usuario.
- **Escritor principal:** [[03-vista-libreria]] (al importar), [[05-vista-edit]] (al ajustar).
- **Lector principal:** [[01-audio-engine]], [[02-vista-reproductor]], [[03-vista-libreria]].

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | String | PK (Único) | Identificador UUID autogenerado del track. |
| `ruta_archivo` | String | Obligatorio | Ruta de acceso física en el dispositivo. |
| `nombre` | String | Obligatorio | Nombre de fantasía visible en la UI. |
| `nombre_original` | String | Obligatorio | Nombre original del archivo en disco. |
| `duracion` | Decimal | ≥ 0 | Duración física del track en segundos. |
| `formato` | String | mp3/wav/flac/ogg/m4a | Extensión o códec detectado. |
| `bpm` | Integer | 60 a 200 | Pulsos por minuto calculados por [[04-bpm-analyzer]]. |
| `tono_original` | String | A, Am, B, C, etc. | Clave musical fundamental estimada. |
| `volumen` | Integer | 0 a 100 (Default: 75) | Nivel de ganancia por defecto del track. |
| `tono_ajuste` | Integer | -12 a +12 (Default: 0) | Semitonos transpuestos persistidos. |
| `tempo_ajuste` | Integer | 50 a 200 (Default: 100) | Porcentaje de velocidad de reproducción. |
| `inicio_personalizado` | Decimal | ≥ 0 (Default: 0) | Timestamp de inicio efectivo de reproducción. |
| `fin_personalizado` | Decimal | ≤ duracion | Timestamp de fin efectivo de reproducción. |
| `fade_in` | Decimal | ≥ 0 (Default: 0) | Duración en segundos de la rampa de subida. |
| `fade_out` | Decimal | ≥ 0 (Default: 0) | Duración en segundos de la rampa de bajada. |
| `contador` | Integer | ≥ 0 | Conteo total de reproducciones acumuladas. |
| `fecha_agregado` | Timestamp | Obligatorio | Fecha de importación a la biblioteca. |
| `ultima_reproduccion`| Timestamp | Opcional | Fecha de la última reproducción activa. |
| `imagen_adjunta` | String | Opcional | Ruta de acceso a partitura PDF/imagen vinculada. |
| `cache_local` | String | Opcional | Ruta del archivo duplicado en el caché interno. |

---

### 2. Tabla: marcadores
Guarda marcas de tiempo y comentarios asociados a cada track.
- **Escritor principal:** [[02-vista-reproductor]] (Modo Edit), [[07-marcadores]].
- **Lector principal:** [[06-grafica-ondas]], [[02-vista-reproductor]], [[07-marcadores]].

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | String | PK (Único) | Identificador del marcador. |
| `cancion_id` | String | FK (canciones.id) | ID de la canción asociada. |
| `timestamp` | Decimal | 0 a duración | Ubicación en segundos en el audio. |
| `texto` | String | Máx 140 cars | Comentario rápido a renderizar. |
| `color` | String | verde/rojo/amarillo/azul | Código de color del pin visual. |

---

### 3. Tabla: playlists
Registra agrupaciones manuales y automáticas (playlists, sets).
- **Escritor principal:** [[01-vista-inicio]], [[05-vista-edit]].
- **Lector principal:** [[01-vista-inicio]], [[02-modelo-colecciones]].

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | String | PK (Único) | Identificador de la colección. |
| `nombre` | String | Obligatorio | Nombre visible. |
| `tipo` | String | playlist/set/inteligente | Tipo de colección. |
| `tipo_curva` | String | lineal/curva/exponencial/null | Progresión rítmica si es inteligente. |
| `creado_en` | Timestamp | Obligatorio | Fecha de instanciación. |
| `ultima_modificacion`| Timestamp| Obligatorio | Fecha de modificación (clave para sync). |
| `duracion_total` | Decimal | ≥ 0 | Suma calculada de las canciones. |
| `cantidad_canciones` | Integer | ≥ 0 | Conteo de items. |

---

### 4. Tabla: playlist_canciones
Relación estructurada (de ordenación) entre colecciones y canciones.
- **Escritor principal:** [[01-vista-inicio]], [[05-vista-edit]].
- **Lector principal:** [[02-modelo-colecciones]], [[01-audio-engine]].

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | String | PK (Único) | Identificador. |
| `playlist_id` | String | FK (playlists.id) | ID de la colección contenedora. |
| `cancion_id` | String | FK (canciones.id) | ID de la canción asignada. |
| `orden` | Integer | ≥ 0 | Posición ordinal en la lista. |
| `transicion` | String | fade_in/fade_out/fade_mix/ninguna | Configuración de transición con el siguiente. |

---

### 5. Tabla: historial_shows
Guarda el registro de presentaciones en vivo al finalizar el show.
- **Escritor principal:** [[04-vista-show]] (a través de [[12-cronometro]]).
- **Lector principal:** [[06-vista-perfil]], [[05-telemetria]].

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | String | PK (Único) | Identificador del show. |
| `fecha` | Timestamp | Obligatorio | Instante de inicio del show en vivo. |
| `nombre_set` | String | Obligatorio | Nombre del set ejecutado. |
| `duracion` | Decimal | ≥ 0 | Duración del show registrada por [[12-cronometro]]. |
| `cantidad_canciones` | Integer | ≥ 0 | Tracks del set original reproducidos. |
| `canciones_cola_extra`| Integer | ≥ 0 | Canciones insertadas en vivo desde QuouList. |
