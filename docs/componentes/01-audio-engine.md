---
ruta: docs/componentes/01-audio-engine.md
tipo: componente
origen: "[[02-vista-reproductor]]"
estado: estable
---

# Motor de Reproducción (Audio Engine)

## Función

Cargar, decodificar y reproducir archivos de audio; mantener la cola de reproducción; gestionar la cadena de procesamiento (pitch → stretch → EQ → fades); responder a órdenes del sistema operativo mediadas por la sesión de audio.

## Entrada

- Canción con todas sus propiedades ← [[01-modelo-audio]]
- Fuente de reproducción (playlist, set, colección) ← [[02-modelo-colecciones]]
- Órdenes de reproducción (play/pause/stop/next/prev/seek/volumen/mute/shuffle) ← [[02-vista-reproductor]]
- Órdenes limitadas en modo Show (siguiente, mute de pánico) ← [[04-vista-show]]
- Pausa o reanudación por interrupción del sistema o desconexión de salida ← [[15-sesion-audio]]
- Puntos de salto para Loop A-B ← [[07-marcadores]]
- Arranque programado en instante T para sincronía ← [[17-jam-session]]

## Proceso

1. Se recibe una solicitud de reproducción (usuario o sistema).
2. El motor busca el archivo: en caché local primero, luego en la ruta original del filesystem.
3. El archivo se decodifica a un buffer de audio en memoria.
4. Si la canción tiene ajuste de tono, el buffer pasa por [[02-pitch-shifter]] (semitonos).
5. Si la canción tiene ajuste de tempo, el buffer pasa por [[03-time-stretcher]] (porcentaje).
6. El buffer procesado pasa por [[16-ecualizador]] (ajuste de bandas en tiempo real).
7. Al inicio o final de una canción, se aplica [[05-fade-engine]] (FadeIn, FadeOut o FadeMix).
8. El buffer resultante se envía a la salida de audio del dispositivo (parlantes o auriculares).
9. Durante la reproducción, el motor reporta posición, estado y fin de canción a [[06-grafica-ondas]] y [[02-vista-reproductor]].
10. Si [[15-sesion-audio]] señala una interrupción transitoria (llamada, alarma), se pausa según la política definida en [[03-modelo-sesion]]; al cesar la interrupción, se reanuda o queda pausado según el modo activo.
11. Si [[15-sesion-audio]] señala desconexión de salida (cable o Bluetooth), se pausa inmediatamente en cualquier modo.
12. Si hay un Loop A-B activo (puntos marcados por [[07-marcadores]]), al llegar al punto B el motor salta de regreso al punto A y repite el tramo indefinidamente hasta que se cancele.

### Diagrama de flujo

```text
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│          │     │          │     │          │     │          │
│ SOLICITUD│──▶ │  CARGA   │──▶ │DECODIFIC.│──▶ │TRANSFOR. │
│ (usuario │    │ (archivo │    │  (buffer) │    │ (tono/   │
│  o sist.)│    │  o cache)│    │           │    │  tempo)  │
│          │     │          │     │           │    │          │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
                                                        ▼
                                               ┌──────────────┐
                                               │  ECUALIZADOR │
                                               │  (bandas)    │
                                               └──────┬───────┘
                                                      │
                                                      ▼
                    ┌──────────┐     ┌──────────┐
                    │          │     │          │
                    │  SALIDA  │◀────│  FADES   │
                    │(parlantes│     │(FadeIn/  │
                    │/auricular│     │ FadeOut/ │
                    │  físico) │     │ FadeMix) │
                    └──────────┘     └──────────┘
                                           │
                                           ▼
                    ┌────────────────────────────────────┐
                    │  MONITOREO (reporta posición,      │
                    │  estado, fin de canción)           │
                    └────────────────────────────────────┘
```

### Flujo de transición (resolución de next())

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

## Salida

- Buffer al procesador de tono → [[02-pitch-shifter]]
- Buffer al procesador de velocidad → [[03-time-stretcher]]
- Buffer al ecualizador para ajuste de bandas → [[16-ecualizador]]
- Evento de transición al motor de fades → [[05-fade-engine]]
- Datos de onda y posición del cabezal → [[06-grafica-ondas]]
- Estado de reproducción (modo, posición, canción activa) → [[02-vista-reproductor]]
- Estado de reproducción para sincronía multi-dispositivo → [[17-jam-session]]
- Señal de audio procesada → parlantes o auriculares (físico)

## Errores

- **Lógico:** se ordena `play()` sin que haya una canción cargada o sin fuente activa — el motor no tiene contexto de qué reproducir; la operación se ignora y se reporta estado `IDLE`.
- **Semántico:** se activa Loop A-B mientras la canción está en pausa total (no hay cabezal en movimiento) — el loop requiere reproducción activa para tener sentido; la operación se rechaza con aviso al usuario.

Catálogo global: [[07-modelo-errores]]

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
