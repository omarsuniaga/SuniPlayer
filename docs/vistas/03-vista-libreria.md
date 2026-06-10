# Vista Librería

## ¿Qué es?

El explorador de archivos de Suniplayer. Desde acá el usuario navega el sistema de archivos de su dispositivo, selecciona audios para importar, y administra su biblioteca musical.

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████████ │
│  █  ← Volver            📂  LIBRERÍA                    █ │
│  ████████████████████████████████████████████████████████████ │
│                                                              │
│  ┌─ Buscar ─────────────────────────────────────────────────┐ │
│  │  🔍  Buscar en tu librería...                            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── 📁  Ruta: /Music/Importadas/ ─────────────────────────── │
│                                                              │
│  ╔══  ♫  Salsa Brava.mp3        ══  03:45  🔶128   ⭐  ══╗ │
│  ║   Nombre: Salsa Brava                  Agregado: 10/06  ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│  ╔══  ♫  Merengón.wav           ══  04:01  🔶135   ⭐  ══╗ │
│  ║   Nombre: Merengón                      Agregado: 09/06  ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│  ╔══  ♫  Bachata Rosa.flac      ══  03:34  🔶118      ══╗ │ │
│  ║   Nombre: Bachata Rosa                   Agregado: 08/06  ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│  ╔══  ♫  Rock Pesado.ogg        ══  03:21  🔶145   ⭐  ══╗ │
│  ║   Nombre: Rock Pesado                    Agregado: 07/06  ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│  ╔══  ♫  Jazz Suave.mp3         ══  05:10  🔶85       ══╗ │ │
│  ║   Nombre: Jazz Suave                     Agregado: 06/06  ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│                                                              │
│  ─── 47 canciones  |  Pág 1 de 5  ──  [◀] [1] [2] [3] ▶  ─ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [📂 + Importar archivos del dispositivo]                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Modos de la Librería

### Modo 1: Librería importada (vista principal)

Muestra todas las canciones que ya fueron importadas a Suniplayer.

```text
╔══  ♫  Salsa Brava.mp3        ══  03:45  🔶128   ⭐  ══╗
║   Nombre: Salsa Brava                  Agregado: 10/06  ║
╚══════════════════════════════════════════════════════════╝
```

**Cada fila muestra:**
- ♫  → ícono de canción.
- Nombre del archivo original.
- Duración.
- Indicador de energía por color + BPM:
  - 🟢 Suave (60–85 BPM)
  - 🟡 Media (86–115 BPM)
  - 🔶 Alta (116–140 BPM)
  - 🔴 Muy Alta (141–200 BPM)
- ⭐ → si está guardada en cache local.

**Se puede ordenar por:** nombre, fecha de importación, BPM, duración, más reproducidas.

**Se puede filtrar por:** formato (mp3/wav/flac/ogg), rango de BPM, energía.

**Al tocar una canción →** va al reproductor con esa canción cargada.

**Acciones desde el menú contextual (tocar y mantener):**

| Acción | Qué hace |
|--------|----------|
| Reproducir | Abre el reproductor con esta canción |
| Agregar a playlist | Muestra lista de playlists para elegir |
| Agregar a cola | Pone la canción en la QuouList |
| Editar info | Abre un modal para cambiar el nombre visible y la imagen asociada. El nombre visible es el que aparece en la UI de Suniplayer y puede ser diferente al nombre del archivo original. El archivo físico en el filesystem no se toca ni se renombra — solo cambia cómo se muestra en la app. |
| Ajustar tono/tempo | Abre los paneles de ajuste (atajo directo) |
| Guardar en app | Cachea el archivo localmente para acceso offline |
| Eliminar de librería | Quita la canción de la biblioteca (no borra el archivo original) |

**Si no hay canciones importadas:**

```text
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              ╔══════════════════════════╗                │
│              ║    Tu librería está      ║                │
│              ║         vacía            ║                │
│              ║                          ║                │
│              ║  Importá canciones       ║                │
│              ║  desde tu dispositivo    ║                │
│              ║                          ║                │
│              ║   [📂 Importar archivos] ║                │
│              ╚══════════════════════════╝                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Modo 2: Explorador de archivos (importación)

Se activa al tocar "Importar archivos". Permite navegar el filesystem del dispositivo.

```text
┌─────── EXPLORADOR DE ARCHIVOS ───────────────────────────┐
│                                                          │
│  📁  /Music/                                             │
│                                                          │
│  📂  📁 Sets/                        12/06  24 files     │
│  📂  📁 Ensayos/                     10/06  8 files      │
│  📂  📁 Grabaciones/                 05/06  3 files      │
│  📂  📁 Backing Tracks/              01/06  15 files     │
│                                                          │
│  Archivos seleccionados: 0                              │
│                                                          │
│  [Cancelar]                    [Importar seleccionados]  │
└──────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Muestra la estructura de carpetas del dispositivo.
- Solo muestra archivos de formatos soportados (mp3, wav, flac, ogg, m4a).
- El usuario puede seleccionar uno o varios archivos.
- Al confirmar, los archivos se importan a la librería.

**Flujo completo de importación:**
```text
1. Usuario toca "Importar archivos"
2. Se abre el explorador nativo o el navegador de carpetas
3. Usuario selecciona archivo(s)
4. Suniplayer lee los metadatos y analiza BPM
5. Aparece una barra de progreso:

   ┌─────────────────────────────────────────────────────────┐
   │  Importando 3 canciones...                              │
   │  ████████████████░░░░░░░░░░░░░  65%                     │
   │  ✔  Salsa Brava.mp3  —  BPM: 128                      │
   │  ⟳  Merengón.wav     —  Analizando...                  │
   │  ⏳  Bachata Rosa.flac —  Pendiente                    │
   └─────────────────────────────────────────────────────────┘

6. Las canciones aparecen en la librería
```

---

## Organización de la librería

### Vistas de ordenamiento

| Vista | Descripción |
|-------|-------------|
| **Lista** | Vista por defecto: nombre, duración, BPM, ⭐ |
| **Por BPM** | Ordenado de mayor a menor BPM 🔶 |
| **Por fecha** | Más recientes primero 📅 |
| **Por duración** | De más larga a más corta ⏱ |
| **Más reproducidas** | Las que tienen mayor contador 🔥 |

### Vistas de filtro

| Filtro | Comportamiento |
|--------|---------------|
| Por formato | Solo mp3, solo wav, etc. |
| Por energía | Suave (🟢 60–85), Media (🟡 86–115), Alta (🔶 116–140), Muy Alta (🔴 141–200) |
| Por rango de BPM | Slider con mínimo y máximo |
| Guardadas en app | Solo ⭐ cacheadas localmente |
| Sin analizar | Canciones sin BPM |

---

## Estados de la librería

| Estado | Qué se ve |
|--------|-----------|
| **Vacía (sin importaciones)** | Banner de bienvenida + botón de importación grande |
| **Con canciones** | Lista normal con filtros y búsqueda |
| **Importando** | Overlay con barra de progreso por cada canción |
| **Analizando BPM** | Spinner ⟳ junto a la canción siendo analizada |
| **Error de importación** | Canción en gris con ⚠️ "Formato no soportado" |
| **Buscar sin resultados** | "No se encontraron canciones" |
| **Filtro sin resultados** | "Ninguna canción cumple con este filtro. Probá con otro." |

---

## Lo que NO está en esta vista

- No están los controles de reproducción (están en el reproductor).
- No está la creación de playlists (está en Inicio y en Edit).
- No está el modo Show.
- No se pueden editar marcadores acá (hay que ir al reproductor).
