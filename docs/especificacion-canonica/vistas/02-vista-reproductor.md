# Vista Reproductor

## ¿Qué es?

La pantalla principal de reproducción. Muestra la canción que está sonando, sus controles, su gráfica de ondas y los ajustes en tiempo real.

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████████ │
│  █  ← Volver       AHORA SUENA: Curva #3        🔴 SHOW █ │
│  ████████████████████████████████████████████████████████████ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │              ╔══════════════════════╗                    │ │
│  │              ║    🎵   Salsa Brava  ║                    │ │
│  │              ║   ┌──────────────┐   ║                    │ │
│  │              ║   │  🎨 Portada  │   ║                    │ │
│  │              ║   │  (o waveform)│   ║                    │ │
│  │              ║   └──────────────┘   ║                    │ │
│  │              ║                      ║                    │ │
│  │              ║  Archivo: salsa.mp3  ║                    │ │
│  │              ║  Tono: +3  Tempo:110%║                    │ │
│  │              ╚══════════════════════╝                    │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── BPM: 128 🔶 ─────────────────────────────────────────── │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    ▄▄▄▄▄▄▄▄▄▄▄▄                         │ │
│  │    ▄▄▄▄▄▄▄▄▄▄▄▄█████████████████▄▄▄▄▄▄▄▄▄▄▄▄            │ │
│  │  ▄████████████████████████████████████████████▄▄         │ │
│  │  ████████████████████████████████████████████████▄▄      │ │
│  │  ██████████████████████████████████████████████████      │ │
│  │  ██████████████████████████████████████████████████      │ │
│  │  ██████████████████████████████████████████████████      │ │
│  │         ░░░░░░░░░░░░░░░░░░░░░░░░░░                       │ │
│  │         ░░░░░░░░░░░░░░░░░░░░░░░░░░                       │ │
│  │         🟢      🔴              🟡                        │ │
│  │ 00:00 ●────●─────────●─────────────●────● 03:45          │ │
│  │       intro        guitarra    coro        fin           │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── CONTROLES ────────────────────────────────────────────── │
│                                                              │
│      [⏮️]   [⏹]   [▶⏸]   [⏭️]   [🔁 Una]                   │
│                                                              │
│      ──────●══════════════════════●────── 75%                │
│      ──────●══════════════════════●──────                    │
│                                                              │
│  ─── HERRAMIENTAS ─────────────────────────────────────────── │
│                                                              │
│  [🎵 Tono]  [⏱ Tempo]  [📌 Marcos]  [↕ Cola]  [⚙️  Más]    │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Secciones de la vista

### 1. Barra superior

- **← Volver**: vuelve a la vista anterior (Inicio o Librería, según de dónde vino).
- **Contexto**: muestra de dónde viene la reproducción ("Desde: Curva #3", "Desde: Show Sábado").
- Indicador de modo: si está en modo Show, muestra 🔴 SHOW.

### 2. Info de la canción (card central)

```text
╔══════════════════════╗
║    🎵   Salsa Brava  ║
║   ┌──────────────┐   ║
║   │  🎨 Portada  │   ║
║   │  (o waveform)│   ║
║   └──────────────┘   ║
║                      ║
║  Archivo: salsa.mp3  ║
║  Tono: +3  Tempo:110%║
╚══════════════════════╝
```

- **Portada**: si la canción tiene imagen asociada, se muestra grande. Si no, se muestra un waveform animado genérico.
- **Nombre**: el nombre visible de la canción (lo que el usuario puso, no necesariamente el nombre del archivo).
- **Archivo original**: nombre del archivo físico (en chico, secundario).
- **Estado de tono/tempo**: resumen de los ajustes activos.

### 3. Gráfica de ondas (Waveform)

```text
┌──────────────────────────────────────────────────────────┐
│                    ▄▄▄▄▄▄▄▄▄▄▄▄                         │
│    ▄▄▄▄▄▄▄▄▄▄▄▄█████████████████▄▄▄▄▄▄▄▄▄▄▄▄            │
│  ▄████████████████████████████████████████████▄▄         │
│  ████████████████████████████████████████████████▄▄      │
│  ██████████████████████████████████████████████████      │
│  ██████████████████████████████████████████████████      │
│  ██████████████████████████████████████████████████      │
│         ░░░░░░░░░░░░░░░░░░░░░░░░░░                       │
│         ░░░░░░░░░░░░░░░░░░░░░░░░░░                       │
│         🟢      🔴              🟡                        │
│ 00:00 ●────●─────────●─────────────●────● 03:45          │
│       intro        guitarra    coro        fin           │
└──────────────────────────────────────────────────────────┘
```

**Qué muestra:**
- La forma de onda completa de la canción (con bloques ▄▄ y ██ según intensidad).
- Un **cabezal** (●) que avanza mientras suena.
- El **tiempo transcurrido** a la izquierda del cabezal.
- El **tiempo restante** a la derecha del cabezal.
- **Marcadores** visualizados como pins de colores (🟢 🔴 🟡 🔵) en la línea de tiempo.
- **Secciones cortadas** (inicio y fin personalizados) marcadas con zonas atenuadas (░░).

**Comportamiento:**
- El usuario puede tocar en cualquier punto de la gráfica para saltar a esa posición.
- Al acercarse a un marcador (ej: a menos de 3 segundos), aparece un tooltip con el texto del marcador.
- La gráfica se actualiza en tiempo real mientras el cabezal avanza.

### 4. Controles de reproducción

```text
    [⏮️]   [⏹]   [▶⏸]   [⏭️]   [🔁 Una]

    ──────●══════════════════════●────── 75%
```

| Control | Comportamiento |
|---------|---------------|
| ⏮️ Anterior | Vuelve a la canción anterior en la fuente actual. Si no hay, reinicia la canción actual. |
| ⏹ Stop | Detiene la reproducción y vuelve al inicio de la canción. |
| ▶⏸ Play/Pause | Alterna entre reproducir y pausar. Muestra ▶ si está en pausa, ⏸ si está sonando. |
| ⏭️ Siguiente | Va a la siguiente canción. Si hay QuouList, salta al primer item de la cola. |
| 🔁 Repetir | Cicla entre: Repetir playlist / Repetir 1 / Sin repetición. |

### 5. Barra de volumen

- Control deslizante con ● que se arrastra.
- Rango visible (──────●══════●──────).

### 6. Botones de herramientas

```text
[🎵 Tono]  [⏱ Tempo]  [📌 Marcos]  [↕ Cola]  [⚙️  Más]
```

| Botón | Abre |
|-------|------|
| 🎵 Tono | Panel de ajuste de tono (-12 a +12 semitonos) |
| ⏱ Tempo | Panel de ajuste de velocidad (50% a 200%) |
| 📌 Marcos | Panel de marcadores de la canción actual |
| ↕ Cola | Panel de la QuouList para agregar/quitar canciones |
| ⚙ Más | Menú con opciones: Fade, Partitura, Info, Agregar a playlist |

---

## Paneles modales

### Panel de Tono

```text
┌─────── AJUSTE DE TONO ─────────────────────────────────┐
│                                                         │
│  Canción: Salsa Brava                                   │
│  Tono original: Do Mayor                                │
│                                                         │
│       ╔═══════════════════════════════════╗             │
│       ║   [-12]  [-]  [ ● ]  [+]  [+12]  ║             │
│       ║          ───●═══───               ║             │
│       ║     Ajuste: +3 semitonos          ║             │
│       ║     Tono actual: Re Mayor         ║             │
│       ╚═══════════════════════════════════╝             │
│                                                         │
│  [↺ Restablecer]                          [✓ Listo]    │
└─────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- El ajuste se aplica en tiempo real mientras se mueve el slider.
- Muestra el tono resultante (ej: "Do Mayor → Re Mayor").
- "Restablecer" vuelve a 0.

### Panel de Tempo

```text
┌─────── AJUSTE DE VELOCIDAD ────────────────────────────┐
│                                                         │
│       ╔═══════════════════════════════════╗             │
│       ║     Velocidad: 120%              ║             │
│       ║  [50%] ────●═══════─── [200%]   ║             │
│       ║                                   ║             │
│       ║  [✓] Preservar tono              ║             │
│       ║      (el tono no cambia)         ║             │
│       ╚═══════════════════════════════════╝             │
│                                                         │
│  [↺ Restablecer]                          [✓ Listo]    │
└─────────────────────────────────────────────────────────┘
```

### Panel de Marcadores

```text
┌─────── MARCADORES ──────────────────────────────────────┐
│                                                         │
│  [+ Agregar marcador en 01:23]                          │
│                                                         │
│  🟢  00:23  "Entra guitarra"                        ✕  │
│  🔴  01:15  "Sube volumen, viene el coro"           ✕  │
│  🟡  02:47  "Preparar final"                        ✕  │
│  🔵  03:10  "Cambio de ritmo"                       ✕  │
│                                                         │
│  Total: 4 marcadores                                    │
└─────────────────────────────────────────────────────────┘
```

### Panel de QuouList

```text
┌─────── COLA DE REPRODUCCIÓN ───────────────────────────┐
│                                                         │
│  🔊 AHORA: Salsa Brava (03:45)                          │
│                                                         │
│  ─── SIGUIENTES ─────────────────────────────────────── │
│                                                         │
│  ╔══ 1. Merengón.wav        ══ 03:12  ✕  ══╗          │
│  ║   BPM: 135  |  Tono: 0   ══           ║          │
│  ╚════════════════════════════════════════╝          │
│  ╔══ 2. Bachata Rosa.flac   ══ 03:34  ✕  ══╗          │
│  ║   BPM: 118  |  Tono: -2  ══           ║          │
│  ╚════════════════════════════════════════╝          │
│  ╔══ 3. Jazz Suave.mp3      ══ 05:10  ✕  ══╗          │
│  ║   BPM: 85   |  Tono: 0   ══           ║          │
│  ╚════════════════════════════════════════╝          │
│                                                         │
│  ═══════════════════════════════════════════             │
│  Tiempo total en cola:  11:56                           │
│  Tiempo total estimado: 15:41                           │
│                                                         │
│  [+ Agregar desde librería]    [✕ Vaciar cola]          │
└─────────────────────────────────────────────────────────┘
```

---

## Estados de la vista

| Estado | Qué se ve |
|--------|-----------|
| **Sin reproducción activa** | La gráfica está plana (sin onda), los controles están deshabilitados excepto Play, muestra "Seleccioná una canción para empezar" |
| **Cargando** | Spinner sobre la gráfica, controles deshabilitados, muestra "Preparando audio..." |
| **Reproduciendo** | Todo funcional, cabezal moviéndose, onda animada |
| **En pausa** | Cabezal detenido, onda estática, botón muestra ▶ |
| **Error de reproducción** | Mensaje "No se pudo reproducir este archivo. ¿Está corrupto o fue movido?" con acción "Buscar archivo" |

---

## Lo que NO está en esta vista

- No está la gestión de playlists ni la creación de sets (está en Edit).
- No está el explorador de archivos ni la importación de canciones (está en Librería).
- No está el cronómetro de show ni la QuouList en modo presentación permanente (está en Vista Show).
- No están las estadísticas ni configuración global del usuario (están en Perfil).
- No está la configuración de transiciones entre canciones del set (está en Edit).
