# Almacenamiento y Persistencia

## ¿Qué datos maneja Suniplayer?

No todos los datos se guardan igual. Algunos son críticos (ajustes del músico), otros son temporales (cola de reproducción), otros son cacheados (archivos de audio).

---

## Estrategia general

Usar **tres capas** de almacenamiento, cada una para un propósito distinto:

### Capa 1: Base de datos local (IndexedDB o SQLite)

Para datos estructurados que deben persistir y ser consultables.

**¿Qué va acá?**

| Dato | Por qué |
|------|---------|
| Canciones importadas | Necesito buscar, filtrar, ordenar por BPM, nombre, etc. |
| Ajustes de cada canción (tono, tempo, in/out) | Deben recordarse siempre |
| Playlists y Sets | Estructura compleja con relaciones |
| Marcadores y comentarios | Asociados a canciones específicas |
| Contadores de reproducción | Deben persistir entre sesiones |
| Preferencias de tema (dark/light) | Preferencia del usuario |
| Colecciones Inteligentes generadas | Se regeneran, pero es bueno cachearlas |

### Capa 2: Cache de audio (opcional, a elección del usuario)

Para archivos de audio que el usuario quiere tener disponibles sin depender del filesystem.

**¿Qué va acá?**
- Copias cacheadas de canciones seleccionadas.
- No es obligatorio — si el usuario prefiere acceder siempre desde el filesystem, se respeta.

**Comportamiento:**
- El usuario elige qué canciones "guardar en la app".
- Suniplayer copia el archivo al almacenamiento interno de la app.
- Esto permite reproducir aunque el archivo original se haya movido o borrado.
- Se puede eliminar la cache por canción individual o completamente.

### Capa 3: En memoria (solo durante la sesión)

Para datos que no necesitan sobrevivir al cierre de la app.

**¿Qué va acá?**
- QuouList actual.
- Canción que está sonando ahora.
- Posición actual de reproducción.
- Cronómetros activos.
- Resultados de análisis de BPM reciente (no guardado aún).

---

## Estructura de la base de datos

### Tabla: canciones
Una fila por cada canción importada.

```text
id (único)
ruta_archivo          → Ruta al archivo de audio
nombre                → Nombre visible (el usuario puede cambiarlo)
nombre_original       → Nombre del archivo original
duracion              → En segundos
formato               → mp3, wav, ogg, flac, m4a
bpm                   → Beats per minute (analizado)
tono_original         → Tonalidad estimada
volumen               → 0 a 100 (default 75)
tono_ajuste           → -12 a +12 semitonos (default 0)
tempo_ajuste          → 50 a 200 porcentaje (default 100)
inicio_personalizado  → Timestamp en segundos (default 0)
fin_personalizado     → Timestamp en segundos (default duración)
fade_in               → Segundos (default 0)
fade_out              → Segundos (default 0)
contador              → Número de reproducciones
fecha_agregado        → Timestamp de importación
ultima_reproduccion   → Timestamp de la última vez que sonó
imagen_adjunta        → Ruta a imagen/PDF asociado (o null)
cache_local           → Ruta en cache si está guardada localmente (o null)
```

### Tabla: marcadores
Uno por cada marcador en una canción.

```text
id (único)
cancion_id            → FK a canciones
timestamp             → Posición en segundos
texto                 → Lo que el músico quiere recordar
color                 → Opcional (rojo, verde, amarillo, azul)
```

### Tabla: playlists
Una fila por cada playlist o set.

```text
id (único)
nombre                → "Show Sábado", "Favoritos", etc.
tipo                  → playlist | set | inteligente
tipo_curva            → lineal | curva | exponencial | null (solo para inteligente)
creado_en             → Timestamp
ultima_modificacion   → Timestamp
duracion_total        → Suma calculada de sus canciones
cantidad_canciones    → Conteo de items
```

### Tabla: playlist_canciones
Relación entre playlists y canciones (ordenada).

```text
id (único)
playlist_id           → FK a playlists
cancion_id            → FK a canciones
orden                 → Posición en la lista
transicion            → fade_in | fade_out | fade_mix | ninguna (default)
```

### Tabla: historial_shows
Una fila por cada show completado (se crea al confirmar "Terminar Show").

```text
id (único)
fecha                 → Timestamp de inicio del show
nombre_set            → Nombre del set ejecutado
duracion              → Tiempo total transcurrido (segundos)
cantidad_canciones    → Canciones del set reproducidas
canciones_cola_extra  → Canciones agregadas desde la QuouList durante el show
```

Este registro alimenta las estadísticas del Perfil (shows realizados, tiempo en shows, promedio por show). El dato "tiempo total acumulado en shows" se obtiene sumando el campo `duracion` de todas las filas de esta tabla.

### Tabla: configuracion
Pares clave-valor para preferencias globales.

```text
clave                 → "tema", "volumen_global", "brillo_show", etc.
valor                 → El valor correspondiente
```

---

## Flujo de importación de una canción

```text
1. Usuario selecciona archivo(s) desde el explorador del dispositivo
       ↓
2. Suniplayer lee el archivo y extrae metadatos básicos (duración, formato)
       ↓
3. Suniplayer analiza BPM y energía (puede tomar algunos segundos)
       ↓
4. Se crea un registro en la tabla "canciones"
       ↓
5. La canción aparece disponible en la librería
       ↓
6. El usuario puede ajustar tono, tempo, nombre, etc.
       ↓
7. Los cambios se guardan automáticamente en la DB local
```

## ¿Qué NO se almacena?

- No se sube nada a la nube.
- No se comparten datos entre dispositivos.
- No se envía información personal a ningún servidor (la telemetría es local).
