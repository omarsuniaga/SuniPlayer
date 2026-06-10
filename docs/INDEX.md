---
created: 2026-06-10
modified: 2026-06-10
---

# 🎵 Suniplayer — Mapa de Contenido

> *Un reproductor de audio con esteroides para músicos, cantantes e intérpretes.*

---

## 📐 Especificaciones (el modelo de dominio)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| [[especificaciones/00-vision-general]] | Visión, público, diferenciación | Estable |
| [[especificaciones/01-modelo-audio]] | La entidad Canción y sus propiedades | Estable |
| [[especificaciones/02-modelo-colecciones]] | Playlist, QuouList, Set, Colección Inteligente | Estable |
| [[especificaciones/03-modelo-sesion]] | Modos Escucha, Edit, Show | Estable |
| [[especificaciones/04-almacenamiento]] | DB local, cache, persistencia | Estable |
| [[especificaciones/05-telemetria]] | Datos de uso locales y privacidad | Estable |
| [[especificaciones/06-modelo-backup-sync]] | Modelo del backup y sincronización en la nube (opt-in) | Estable |
| [[especificaciones/07-modelo-errores]] | Mapa global de contención y catálogo de excepciones | Estable |
| [[especificaciones/08-modelo-jam-session]] | Modelo de la sesión multi-dispositivo | Borrador (Fase 2) |

## 🖥️ Vistas (pantallas de la app)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| [[vistas/01-vista-inicio]] | Home, colecciones inteligentes, filtros, buscador | Estable |
| [[vistas/02-vista-reproductor]] | Now playing (sin portadas), controles visuales, partituras | Estable |
| [[vistas/03-vista-libreria]] | Biblioteca local, importador masivo y menú contextual | Estable |
| [[vistas/04-vista-show]] | Modo presentación en vivo (blindado) y cuenta regresiva | Estable |
| [[vistas/05-vista-edit]] | Backstage de preparación y configuración de transiciones | Estable |
| [[vistas/06-vista-perfil]] | Preferencias, estadísticas locales y pedalera Bluetooth | Estable |

## ⚙️ Componentes (features atómicos)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| [[componentes/01-audio-engine]] | Motor y API de reproducción | Estable |
| [[componentes/02-pitch-shifter]] | Cambio de tono (Web Audio API) | Estable |
| [[componentes/03-time-stretcher]] | Cambio de velocidad (Web Audio API) | Estable |
| [[componentes/04-bpm-analyzer]] | Analizador de pulsos y energía al importar | Estable |
| [[componentes/05-fade-engine]] | Transiciones progresivas FadeIn/Out/Mix | Estable |
| [[componentes/06-grafica-ondas]] | Renderizado e interacción táctil del Waveform | Estable |
| [[componentes/07-marcadores]] | Bucle Loop A-B y comentarios del timeline | Estable |
| [[componentes/08-mirror]] | Feed de cámara frontal espejada flotante | Estable |
| [[componentes/09-partituras]] | Carga de PDF/imagen y giros de página sincronizados | Estable |
| [[componentes/10-algoritmo-mood]] | Algoritmo de agrupamiento de tempos | Estable |
| [[componentes/11-filtros]] | Sistema de filtros estructurales | Estable |
| [[componentes/12-cronometro]] | Cronómetro de show, countdown y hitos visuales | Estable |
| [[componentes/13-tema]] | Estilos Dark, Light e inyección de variables CSS | Estable |
| [[componentes/14-sync-engine]] | Motor de transacciones de backup y red | Estable |
| [[componentes/15-sesion-audio]] | Media Session API nativa del SO y pedalera Bluetooth | Estable |
| [[componentes/16-ecualizador]] | Ajuste de ganancia de 3-5 bandas frecuencias | Estable |
| [[componentes/17-jam-session]] | Servidor/Cliente WebRTC LAN para sincronía de red | Borrador (Fase 2) |
| [[componentes/18-completador-set]] | Sugerencia de relleno por duración efectiva | Estable |
| [[componentes/19-minireproductor]] | Footer persistente con controles mínimos de reproducción entre vistas | Estable |

## 📚 Diccionarios e Índices Transversales

| Archivo | Descripción |
|---------|-------------|
| [[diccionario/00-diccionario-dominio]] | Glosario canónico de conceptos de Suniplayer |
| [[diccionario/01-diccionario-datos]] | Diccionario de datos campo por campo de la base de datos |
| [[funciones/00-catalogo-funciones]] | Catálogo global de operaciones lógicas y APIs |

---

## 📖 Glosario canónico
Para conocer los términos oficiales de Suniplayer (QuouList, Set, Tempo vs. BPM, etc.) y evitar ambigüedades, consultá directamente el **[[diccionario/00-diccionario-dominio|Diccionario de Dominio]]**.

---

## 📊 Estado del proyecto

- ✅ **Especificaciones**: 9/9 completas (8 estables, 1 borrador de Fase 2)
- ✅ **Vistas**: 6/6 completas
- ✅ **Componentes**: 19/19 completos (18 estables, 1 borrador de Fase 2)
- ✅ **Diccionarios e Índices**: 3/3 completos
- ⏳ **Código**: Pendiente (próxima fase)

---

## 🔗 Relaciones entre documentos

```text
INDEX.md
 │
 ├──► 00-diccionario-dominio
 ├──► 00-catalogo-funciones
 │
 └──► 00-vision-general
       │
       ▼
 01-modelo-audio ◀────────────────── 04-bpm-analyzer
       │                                   │
       ▼                                   ▼
 02-modelo-colecciones ◀─────────── 10-algoritmo-mood
       │
       ├─► 01-vista-inicio ◀── 11-filtros
       │
       ├─► 02-vista-reproductor ◀── 07-marcadores (Loop A-B)
       │                            09-partituras
       │                            16-ecualizador
       │
       ▼
 03-modelo-sesion ────┬──► 04-vista-show ◀── 08-mirror
       │             │                       12-cronometro
       │             │                       18-completador-set
       │             │
       │             └──► 05-vista-edit  ──► 05-fade-engine
       │
       ├─► 04-almacenamiento ──► 01-diccionario-datos
       │      │
       │      ▼
       │   06-modelo-backup-sync ──► 14-sync-engine
       │      │
       │      ▼
       │   08-modelo-jam-session ──► 17-jam-session (Fase 2)
       │
       ├─► 05-telemetria ──► 06-vista-perfil ◀── 15-sesion-audio (SO / Pedalera)
       └─► 13-tema

19-minireproductor ◀──── 01-audio-engine
       │          ◀──── 02-modelo-colecciones
       │          ◀──── 03-modelo-sesion
       │
       ├──► 01-vista-inicio
       ├──► 03-vista-libreria
       ├──► 04-vista-show   (estado MINI_LOCKED)
       ├──► 05-vista-edit
       └──► 06-vista-perfil
```
