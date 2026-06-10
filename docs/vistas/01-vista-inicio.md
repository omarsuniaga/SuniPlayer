# Vista de Inicio

## ¿Qué es?

La pantalla principal de Suniplayer. Es lo que el usuario ve al abrir la app. Debe dar acceso rápido a **todo** sin abrumar.

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████████ │
│  █  🎵 Suniplayer                    ⚙️  👤 Perfil       █ │
│  ████████████████████████████████████████████████████████████ │
│                                                              │
│  ┌─ Buscar ─────────────────────────────────────────────────┐ │
│  │  🔍  Buscar canciones, playlists...                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── COLECCIONES INTELIGENTES ─────────────────────────────── │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ ╔══════╗ │  │ ╔══════╗ │  │ ╔══════╗ │  │ ╔══════╗ │    │
│  │ ║ CURVA ║ │  │ ║LINEAL║ │  │ ║ EXPO ║ │  │ ║ MÁS  ║ │    │
│  │ ║  #3   ║ │  │ ║120BPM║ │  │ ║  #1  ║ │  │ ║REPROD.║│    │
│  │ ╚══════╝ │  │ ╚══════╝ │  │ ╚══════╝ │  │ ╚══════╝ │    │
│  │ 12 canc. │  │ 8 canc.  │  │ 15 canc. │  │ 20 canc. │    │
│  │ 34 min   │  │ 22 min   │  │ 41 min   │  │ (contad.)│    │
│  │ ⟡ Curva  │  │ ⟡ Lineal │  │ ⟡ Expon. │  │ 🔥 Plays │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ─── REPRODUCIENDO AHORA ──────────────────────────────────── │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ═══╗                             ╔══                    │ │
│  │  ═══╝  Salsa Brava.mp3            ╚══   ▶  Continuar    │ │
│  │  BPM: 128  |  Tono: +3  |  Tempo: 110%                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── TUS PLAYLISTS ────────────────────────────────────────── │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 📋 Show  │  │ 📋 Favo- │  │ ┌──────┐ │                  │
│  │   Sábado │  │   ritos  │  │ │➕    │ │                  │
│  │ 8 canc.  │  │ 23 canc. │  │ │Nueva │ │                  │
│  │ 27 min   │  │ 72 min   │  │ │      │ │                  │
│  │          │  │          │  │ └──────┘ │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
│  ─────────────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────┘
```

---

## Secciones de la vista

### 1. Barra superior

**Logo + acceso a perfil/configuración.** Simple, sin distracciones.

### 2. Buscador

Un campo de texto que filtra instantáneamente:
- Canciones por nombre.
- Playlists por nombre.
- Colecciones inteligentes por tipo.

Al escribir, la vista muestra solo los resultados que coinciden.

### 3. Colecciones Inteligentes (zona destacada)

Muestra hasta 4 colecciones generadas automáticamente. Es la sección principal de descubrimiento.

```text
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ ╔══════╗ │     │ ╔══════╗ │     │ ╔══════╗ │     │ ╔══════╗ │
│ ║ CURVA ║ │     │ ║LINEAL║ │     │ ║ EXPO ║ │     │ ║ MÁS  ║ │
│ ║  #3   ║ │     │ ║120BPM║ │     │ ║  #1  ║ │     │ ║REPROD.║│
│ ╚══════╝ │     │ ╚══════╝ │     │ ╚══════╝ │     │ ╚══════╝ │
│ 12 canc. │     │ 8 canc.  │     │ 15 canc. │     │ 20 canc. │
│ 34 min   │     │ 22 min   │     │ 41 min   │     │ (contad.)│
│ ⟡ Curva  │     │ ⟡ Lineal │     │ ⟡ Expon. │     │ 🔥 Plays │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

**¿Qué se ve?**
- Cada colección se muestra como una **tarjeta tipo folder** con borde doble.
- Las primeras tres tarjetas son Colecciones Inteligentes de curva de BPM (Curva, Lineal, Exponencial).
- La cuarta tarjeta es la **Colección Inteligente: Más Reproducidas**, que agrupa las canciones con mayor contador de reproducciones. No usa BPM ni curva de ánimo — su criterio es el contador de plays.
- La tarjeta muestra: nombre, criterio ("🔥 Plays"), cantidad de canciones.
- Al tocar una tarjeta → se abre la vista de reproducción con la colección cargada.
- Al final hay un botón "Ver más" que lleva a la lista completa de colecciones inteligentes.

**Comportamiento:**
- Se regeneran automáticamente cuando se agregan canciones nuevas.
- El usuario puede forzar regeneración con pull-to-refresh.
- Si no hay canciones analizadas, la sección muestra un mensaje: "Importá canciones para ver tus colecciones inteligentes".

### 4. Play reciente

```text
┌──────────────────────────────────────────────────────────┐
│  ═══╗                             ╔══                    │
│  ═══╝  Salsa Brava.mp3            ╚══   ▶  Continuar    │
│  BPM: 128  |  Tono: +3  |  Tempo: 110%                 │
└──────────────────────────────────────────────────────────┘
```

Si el usuario estaba escuchando algo y cerró la app (o la app estaba en segundo plano), acá aparece un acceso directo a la última canción que sonaba.

**Comportamiento:**
- Muestra: nombre de la canción, BPM, ajustes activos, y un botón ▶.
- Si el usuario no ha reproducido nada, esta sección no aparece.

### 5. Crear Colección Inteligente o Playlist manualmente

El usuario puede crear una Colección Inteligente o Playlist de forma manual desde esta vista. Al tocar "+ nueva" se abre un modal con la siguiente estructura:

```text
╔══════════════════════════════════════════════════════════╗
║  CABECERA                                                ║
║  Total: 0 canciones  |  Duración: 0:00                  ║
║  [Crear]  [Editar]                                       ║
╠══════════════════════════════════════════════════════════╣
║  CUERPO — Lista de canciones de la librería              ║
║  #   Título                Duración   [Agregar|Quitar]   ║
║  1.  Salsa Brava.mp3       03:45      [+ Agregar]        ║
║  2.  Merengón.wav          04:01      [+ Agregar]        ║
║  3.  Bachata Rosa.flac     03:34      [+ Agregar]        ║
║  4.  Jazz Suave.mp3        05:10      [Quitar]           ║
╠══════════════════════════════════════════════════════════╣
║  PIE DE PÁGINA                                           ║
║  ◀ [1] [2] [3] ▶              [Guardar]  [Cerrar]       ║
╚══════════════════════════════════════════════════════════╝
```

**Comportamiento:**
- La cabecera actualiza el total de canciones y la duración a medida que el usuario agrega o quita canciones.
- El cuerpo muestra la lista de la librería con paginador (pie de página).
- Cada fila tiene un botón "Agregar" si la canción no está en la colección, o "Quitar" si ya fue agregada.
- "Guardar" persiste la colección con el nombre que el usuario ingresó.
- "Cerrar" descarta los cambios con confirmación si ya se agregaron canciones.

### Eliminar colecciones

El usuario puede eliminar una o más playlists o colecciones desde la vista de inicio.

```text
[✓] Show Sábado 15    8 canc.   27 min
[✓] Favoritos         23 canc.  72 min
[ ] Ensayo Martes     6 canc.   18 min

[Eliminar seleccionadas]
```

Al confirmar la eliminación, se muestra un modal:

```text
╔══════════════════════════════════════════════╗
║  ¿Eliminar las colecciones seleccionadas?   ║
║                                              ║
║  · Show Sábado 15                            ║
║  · Favoritos                                 ║
║                                              ║
║  Esta acción no se puede deshacer.           ║
║  Las canciones NO se eliminan de la librería.║
║                                              ║
║      [Cancelar]    [Eliminar]                ║
╚══════════════════════════════════════════════╝
```

### 5. Tus Playlists

Lista de playlists y sets que el usuario ha creado manualmente.

```text
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 📋 Show  │     │ 📋 Favo- │     │ ┌──────┐ │
│   Sábado │     │   ritos  │     │ │➕    │ │
│ 8 canc.  │     │ 23 canc. │     │ │Nueva │ │
│ 27 min   │     │ 72 min   │     │ │      │ │
│          │     │          │     │ └──────┘ │
└──────────┘     └──────────┘     └──────────┘
```

**¿Qué se ve?**
- Cada playlist se muestra como tarjeta con nombre y cantidad de canciones.
- Al tocar → abre la playlist en la vista de reproducción.
- Botón "+ nueva" para crear una playlist desde cero.
- Si no hay playlists, muestra: "Aún no tenés playlists. Tocá + para crear una."

### 6. Navegación inferior

```text
[🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]
```

Barra fija con 4 íconos:
- **Inicio** → esta vista.
- **Reproductor** → la vista now playing.
- **Librería** → explorador de archivos del dispositivo.
- **Edit** → modo preparación de sets.

---

## Estados de la vista

### Estado: Primer uso (sin canciones)

```text
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              ╔══════════════════════════╗                │
│              ║   🎵  Bienvenido a       ║                │
│              ║      Suniplayer          ║                │
│              ║                          ║                │
│              ║  Empezá importando       ║                │
│              ║  canciones desde la      ║                │
│              ║  Librería.               ║                │
│              ║                          ║                │
│              ║     [📂 Importar]        ║                │
│              ╚══════════════════════════╝                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- La sección de colecciones inteligentes no aparece.
- La sección de playlists no aparece.
- La sección de play reciente no aparece.
- Aparece un mensaje central: "Bienvenido a Suniplayer. Empezá importando canciones desde la Librería."
- La navegación inferior tiene un badge parpadeante en "Librería".

### Estado: Con canciones, sin playlists
- Las colecciones inteligentes aparecen automáticamente (apenas haya al menos 3 canciones analizadas).
- Playlists muestra "Aún no tenés playlists."

### Estado: Con todo poblado
- Todas las secciones visibles.
- Scroll vertical para navegar.

### Estado: Búsqueda activa
- Las secciones desaparecen y solo se ven resultados de búsqueda.
- Al borrar el texto de búsqueda, vuelven las secciones.

---

## Acciones posibles desde esta vista

1. **Tocar una colección inteligente** → abre el reproductor con esa colección como fuente.
2. **Tocar una playlist** → abre el reproductor con esa playlist.
3. **Tocar "+" en playlists** → modal para crear nueva playlist (nombre + opcional: agregar canciones).
4. **Tocar play reciente** → continúa reproduciendo donde se quedó.
5. **Tocar perfil** → abre configuración y estadísticas.
6. **Buscar** → filtra contenido en tiempo real.
7. **Pull to refresh** → regenera colecciones inteligentes.
8. **Tocar navegación inferior** → cambia de vista.

---

## Lo que NO está en esta vista

- No está el reproductor en sí (los controles están en la vista Reproductor).
- No está el explorador de archivos (está en Librería).
- No está la configuración detallada de cada canción (está en Edit).
