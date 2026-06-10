---
created: 2026-06-10
modified: 2026-06-10
---

# 🎵 Suniplayer — Mapa de Contenido

> *Un reproductor de audio con esteroides para músicos, cantantes e intérpretes.*

---

## 📐 Especificaciones (el modelo de dominio)

| Archivo | Descripción |
|---------|-------------|
| [[especificaciones/00-vision-general]] | Visión, público, diferenciación |
| [[especificaciones/01-modelo-audio]] | La entidad Canción y sus propiedades |
| [[especificaciones/02-modelo-colecciones]] | Playlist, QuouList, Set, Colección Inteligente |
| [[especificaciones/03-modelo-sesion]] | Modos Escucha, Edit, Show |
| [[especificaciones/04-almacenamiento]] | DB local, cache, persistencia |
| [[especificaciones/05-telemetria]] | Datos de uso locales y privacidad |

## 🖥️ Vistas (pantallas de la app)

| Archivo | Descripción |
|---------|-------------|
| [[vistas/01-vista-inicio]] | Home, colecciones inteligentes, filtros |
| [[vistas/02-vista-reproductor]] | Now playing, gráfica, controles |
| [[vistas/03-vista-libreria]] | Explorador de archivos e importación |
| [[vistas/04-vista-show]] | Modo presentación en vivo |
| [[vistas/05-vista-edit]] | Preparación de sets y transiciones |
| [[vistas/06-vista-perfil]] | Configuración y estadísticas |

## ⚙️ Componentes (features atómicos)

| Archivo | Descripción |
|---------|-------------|
| [[componentes/01-audio-engine]] | Motor de reproducción |
| [[componentes/02-pitch-shifter]] | Cambio de tono |
| [[componentes/03-time-stretcher]] | Cambio de velocidad |
| [[componentes/04-bpm-analyzer]] | Analizador de BPM |
| [[componentes/05-fade-engine]] | FadeIn, FadeOut, FadeMix |
| [[componentes/06-grafica-ondas]] | Waveform |
| [[componentes/07-marcadores]] | Comentarios en línea de tiempo |
| [[componentes/08-mirror]] | Cámara superpuesta |
| [[componentes/09-partituras]] | Sheet music |
| [[componentes/10-algoritmo-mood]] | Algoritmo de ánimo |
| [[componentes/11-filtros]] | Sistema de filtros |
| [[componentes/12-cronometro]] | Cronómetros de sesión y show |
| [[componentes/13-tema]] | Dark/Light/System |

---

```text
╔════════════════════════════════════════════════════╗
║                                                    ║
║   ███████╗██╗   ██╗███╗   ██╗██╗██████╗           ║
║   ██╔════╝██║   ██║████╗  ██║██║██╔══██╗          ║
║   ███████╗██║   ██║██╔██╗ ██║██║██████╔╝          ║
║   ╚════██║██║   ██║██║╚██╗██║██║██╔═══╝           ║
║   ███████║╚██████╔╝██║ ╚████║██║██║               ║
║   ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝               ║
║                                                    ║
║   D O C S   —   Lenguaje Natural                   ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

## 📖 Glosario canónico

| Término oficial | Qué es | No confundir con |
|----------------|--------|-----------------|
| **Colección Inteligente** | Agrupación de canciones generada automáticamente por el sistema, ya sea por curva de BPM o por contador de reproducciones | "álbum", "álbum automático", "generador de álbumes" — esos términos están deprecados |
| **QuouList** | La cola de reproducción dinámica: lista temporal de canciones que suenan después de la canción actual | El panel UI que la muestra puede titularse "Cola (QuouList)", pero el concepto se llama siempre QuouList |
| **Modo Escucha** | El modo de reproducción normal y por defecto | "Listen" — variante en inglés no utilizada |
| **Modo Edit** | El modo de preparación de sets antes de un show | — |
| **Modo Show** | El modo de presentación en vivo, bloqueado para edición | — |
| **Tempo** | Velocidad de reproducción expresada como porcentaje (50%–200%) | BPM — el BPM es una propiedad analizada del archivo de audio; el Tempo es el ajuste que hace el músico sobre la velocidad de reproducción. Son cosas distintas |
| **Cronómetro de Sesión** | Tiempo de la sesión actual, volátil, se reinicia al cerrar la app | El tiempo total acumulado (persistido en la DB), que muestra el Perfil (ej. "124 horas") |

---

## 📊 Estado del proyecto

- ✅ **Especificaciones**: 6/6 completas
- ✅ **Vistas**: 6/6 completas
- ✅ **Componentes**: 13/13 completos
- ⏳ **Código**: Pendiente (próxima fase)

## 🔗 Relaciones entre documentos

```text
00-vision-general
       │
       ▼
01-modelo-audio ◀────────────────── 04-bpm-analyzer
       │                                   │
       ▼                                   ▼
02-modelo-colecciones ◀─────────── 10-algoritmo-mood
       │
       ├──► 01-vista-inicio ◀── 11-filtros
       │
       ▼
03-modelo-sesion ────┬──► 04-vista-show
       │             └──► 05-vista-edit
       │
       ▼
05-vista-perfil ◀── 12-cronometro
                    13-tema
```
