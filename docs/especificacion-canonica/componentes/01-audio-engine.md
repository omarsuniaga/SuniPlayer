# Motor de Reproducción (Audio Engine)

## ¿Qué es?

El corazón de Suniplayer. Es el componente encargado de **cargar, decodificar y reproducir** archivos de audio. También maneja la cola de reproducción y los saltos entre canciones.

**No es una UI.** Este componente funciona por detrás. El reproductor (vista) le dice "reproducí X canción" y el motor hace que suene.

---

## Flujo de reproducción

```text
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│          │     │          │     │          │     │          │
│  SOLICITUD │──▶│  CARGA   │──▶│DECODIFIC.│──▶│TRANSFOR. │
│  (usuario │   │  (archivo│   │  (buffer) │   │ (tono/   │
│   o sist.)│   │   o cache)│   │          │   │  tempo)  │
│          │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                       │
                                                       ▼
                    ┌──────────┐     ┌──────────┐
                    │          │     │          │
                    │  SALIDA  │◀────│REPRODUC. │
                    │ (altavoz)│     │ (en vivo)│
                    │          │     │          │
                    └──────────┘     └──────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────┐
                    │  MONITOREO (reporta posición,    │
                    │  estado, fin de canción)         │
                    └──────────────────────────────────┘
```

### Paso a paso

```text
1. SOLICITUD: Algo (usuario o sistema) pide reproducir una canción
       │
       ▼
2. CARGA: El motor busca el archivo:
   a. ¿Está en cache local? → lo carga desde ahí
   b. ¿No? → lo carga desde la ruta original del filesystem
       │
       ▼
3. DECODIFICACIÓN: El archivo se decodifica a un buffer de audio
       │
       ▼
4. TRANSFORMACIONES: Si la canción tiene ajustes de tono/tempo,
   se aplican al buffer ANTES de empezar a reproducir
       │
       ▼
5. REPRODUCCIÓN: El buffer transformado empieza a sonar
       │
       ▼
6. MONITOREO: El motor reporta periódicamente:
   - Posición actual (timestamp)
   - Estado (reproduciendo / pausado / detenido)
   - Si llegó al final de la canción
```

---

## Transiciones entre canciones

```text
Canción A                   Gap     Canción B
════════════════════════════ ═══════ ════════════════════════
                     ── ── ── ── ── ── ── ── ──
                    ↘           ↗
                  FadeOut      FadeIn
                    3s         2s

Sin fades:
Canción A                  Canción B
═══════════════════════════║════════════════════════════
                           ║
                       Corte abrupto

Con FadeMix:
Canción A ───────────────────╗
                              ║
Canción B ═══════════════════╝════════════════════════
                              ║
                         FadeMix
                           4s
```

### Flujo de transición:

```text
1. El motor detecta que la canción actual está por terminar
   (o llegó al fin personalizado)
       │
       ▼
2. ¿Hay FadeOut configurado? → lo aplica en los últimos N segundos
       │
       ▼
3. ¿Hay Gap configurado? → espera N segundos (default: 1s; es config
   de transición/Set, no propiedad de la canción individual)
       │
       ▼
4. RESOLUCIÓN DE SIGUIENTE (cadena de prioridad de next()):
   │
   ├─ ¿La QuouList tiene items?
   │    → SÍ: reproduce el primero de la cola (y lo quita de la cola)
   │    → NO: continúa al paso siguiente
   │
   ├─ ¿Hay una canción siguiente en la fuente (playlist/set)?
   │    → SÍ: reproduce esa canción
   │    → NO: es la última canción de la fuente → continúa al paso siguiente
   │
   └─ Es la última de la fuente Y la cola está vacía:
        → En Modo Escucha: se respeta el control Repetir
            · "Repetir playlist": vuelve a la primera canción de la fuente
            · "Repetir 1": repite la canción actual
            · "Sin repetición": la reproducción SE DETIENE
        → En Modo Show: la reproducción SE DETIENE siempre
            · El motor vuelve al inicio de la canción actual, estado detenido
            · No repite ni avanza automáticamente
            · NADA suena por sorpresa en medio de un show
       │
       ▼
5. ¿Hay FadeIn configurado? → lo aplica al inicio
       │
       ▼
6. Empieza la reproducción de la siguiente canción
```

---

## Controles del motor

```text
┌──────────────────────────────────────────────────────────────┐
│                     AUDIO ENGINE API                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  play(cancion)     →  "Reproducí esta canción específica"   │
│  play()            →  "Reanudá desde donde estaba pausado"  │
│  pause()           →  "Pausá, pero acordate la posición"    │
│  stop()            →  "Detené todo y volvé al inicio"       │
│  seek(timestamp)   →  "Saltá a esta posición"               │
│  next()            →  "Siguiente (cola → fuente)"           │
│  prev()            →  "Anterior (vuelve en la fuente)"      │
│  setVolume(nivel)  →  "Ajustá el volumen a X%"              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Manejo de errores

```text
┌────── ERROR ──────┬─────────── CAUSA ───────────┬── COMPORTAMIENTO ────┐
│                   │                              │                      │
│  Archivo no       │  El archivo fue movido       │  "Archivo no         │
│  encontrado       │  o borrado del dispositivo   │  encontrado.         │
│                   │                              │  ¿Buscarlo de nuevo?"│
├───────────────────┼──────────────────────────────┼──────────────────────┤
│                   │                              │                      │
│  Formato no       │  Códec que no podemos        │  Saltea la canción   │
│  soportado        │  decodificar (.wma, .aiff)   │  y avisa al usuario  │
│                   │                              │                      │
├───────────────────┼──────────────────────────────┼──────────────────────┤
│                   │                              │                      │
│  Archivo          │  El archivo está dañado       │  Marca la canción     │
│  corrupto         │  o incompleto                │  como "corrupta"     │
│                   │                              │  en la DB            │
├───────────────────┼──────────────────────────────┼──────────────────────┤
│                   │                              │                      │
│  Error de         │  El archivo es válido pero   │  Reintenta 1 vez,    │
│  decodificación   │  hubo un error al leerlo     │  si falla, saltea    │
│                   │                              │                      │
└───────────────────┴──────────────────────────────┴──────────────────────┘
```

---

## Diagrama de estados

```text
                    ┌─────────┐
                    │         │
       ┌───────────▶│  IDLE   │◀──────────────────┐
       │            │         │                   │
       │            └────┬────┘                   │
       │                 │                        │
       │          play() │                        │
       │                 ▼                        │
       │            ┌─────────┐                   │
       │            │         │                   │
       │            │ LOADING │                   │
       │            │         │                   │
       │            └────┬────┘                   │
       │                 │                        │
       │          carga ok│                       │
       │                 ▼                        │
       │            ┌─────────┐                   │
       │            │  READY  │                   │
       │            └────┬────┘                   │
       │                 │                        │
       │           play() │                       │
       │                 ▼                        │
       │  ┌───────────────────────────────┐       │
       │  │                               │       │
       │  │    ┌──────────┐    pause()    │       │
       │  │    │          │───────────────┼───┐   │
       │  ├───▶│ PLAYING  │              │   │   │
       │  │    │          │◀─────────────┼───┘   │
       │  │    └──────────┘    play()    │       │
       │  │         │   ▲                │       │
       │  │    stop()│   │end of song    │       │
       │  │         ▼   │               │       │
       │  │    ┌──────────┐              │       │
       │  │    │ STOPPED  │              │       │
       │  │    └──────────┘              │       │
       │  └───────────────────────────────┘      │
       │            │                            │
       └────────────┘                            │
                                                 │
            ┌─────────┐                          │
            │  ERROR  │──────────────────────────┘
            └─────────┘    stop()
```
