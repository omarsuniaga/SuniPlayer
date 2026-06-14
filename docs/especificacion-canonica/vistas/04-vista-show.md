# Vista Show

## ¿Qué es?

El modo **presentación en vivo**. Es la pantalla más importante de Suniplayer porque es donde el músico se juega frente a su audiencia. Todo está diseñado para que nada salga mal.

---

## ¿Cómo se entra al modo Show?

```text
╔══════════════════════════════════════════════════════╗
║              🎯  INICIAR SHOW                        ║
║                                                      ║
║  Set: Show Sábado 15                                ║
║  Duración: 34:21  |  12 canciones                   ║
║                                                      ║
║  ┌──────────────────────────────────────────────────┐║
║  │  ¿Estás listo para empezar el show?              │║
║  │  Una vez iniciado, no se puede editar el set.    │║
║  │                                                  │║
║  │       [Cancelar]      [🎯 Iniciar Show]          │║
║  └──────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════╝
```

**No se puede entrar a Show sin un set preparado.** Si el usuario intenta, la app dice: "Prepará un set primero desde la vista Edit."

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████████ │
│  █  🔴  EN VIVO                  SHOW: Sábado 15         █ │
│  ████████████████████████████████████████████████████████████ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │              ╔══════════════════════════╗                │ │
│  │              ║      ⏱  43:21           ║                │ │
│  │              ║      ─────────           ║                │ │
│  │              ║      + Cola: 10:47       ║                │ │
│  │              ║      = Total: 54:08      ║                │ │
│  │              ╚══════════════════════════╝                │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── AHORA SUENA ──────────────────────────────────────────── │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │   ♫  Salsa Brava                                        │ │
│  │   Tono: +3  |  Tempo: 110%                              │ │
│  │                                                          │ │
│  │   ══════════════════════════════════════════════════     │ │
│  │   ████████████████████████████████░░░░░░░░░░░░░░░░░     │ │
│  │   ══════════════════════════════════════════════════     │ │
│  │                                                          │ │
│  │                    02:34 / 03:45                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── SIGUIENTES (QuouList Activa) ─────────────────────────── │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  ╔══  1.  Merengón.wav       ══  03:12  ✕  ══╗          │ │
│  │  ║     BPM: 135  |  Tono: 0               ║          │ │
│  │  ╚═════════════════════════════════════════╝          │ │
│  │  ╔══  2.  Bachata Rosa.flac  ══  03:34  ✕  ══╗          │ │
│  │  ║     BPM: 118  |  Tono: -2              ║          │ │
│  │  ╚═════════════════════════════════════════╝          │ │
│  │  ╔══  3.  Jazz Suave.mp3     ══  05:10  ✕  ══╗          │ │
│  │  ║     BPM: 85   |  Tono: 0               ║          │ │
│  │  ╚═════════════════════════════════════════╝          │ │
│  │                                                          │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  Tiempo en cola:  10:47                                 │ │
│  │                                                          │ │
│  │  [+ Agregar desde librería...]                           │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── CONTROLES ────────────────────────────────────────────── │
│                                                              │
│           [⏮️]      [⏹]      [▶⏸]      [⏭️]                 │
│                                                              │
│              Tiempo restante del set: 21:34                  │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────┘
```

---

## Secciones de la vista

### 1. Barra superior "EN VIVO"

- Indicador rojo 🔴 con texto "EN VIVO".
- Nombre del set actual ("Show Sábado 15").
- No hay botón de volver atrás. No hay navegación inferior.

### 2. Cronómetro de show

El elemento central y más grande de la pantalla.

```text
╔══════════════════════════╗
║      ⏱  43:21           ║
║      ─────────           ║
║      + Cola: 10:47       ║
║      = Total: 54:08      ║
╚══════════════════════════╝
```

**Muestra:**
- **Tiempo transcurrido** desde que arrancó el show (grande, visible desde lejos).
- **Tiempo en cola**: suma de las canciones agregadas a la QuouList.
- **Tiempo total estimado**: transcurrido + cola.

**Comportamiento:**
- El cronómetro arranca en 00:00 al iniciar el show.
- No se puede pausar. No se puede reiniciar.
- Sigue corriendo aunque la música esté en pausa.

### 3. Canción actual (Now Playing)

```text
   ♫  Salsa Brava
   Tono: +3  |  Tempo: 110%

   ══════════════════════════════════════════════════
   ████████████████████████████████░░░░░░░░░░░░░░░░░
   ══════════════════════════════════════════════════

                    02:34 / 03:45
```

- Nombre de la canción que está sonando.
- Ajustes activos (tono, tempo).
- Barra de progreso con cabezal (bloques ██ = reproducido, ░░ = restante).
- Tiempo transcurrido / duración total.

No se muestran controles de tono/tempo porque están bloqueados en modo Show.

### 4. QuouList activa (zona de cola)

```text
╔══  1.  Merengón.wav       ══  03:12  ✕  ══╗
║     BPM: 135  |  Tono: 0               ║
╚═════════════════════════════════════════╝
```

**Muestra:**
- Lista de canciones en cola para sonar después de la actual.
- Cada fila muestra: orden, nombre, duración, BPM, ajustes.
- Botón ✕ para quitar de la cola.
- Botón "+" para agregar canciones desde la librería.

**Comportamiento:**
- Al terminar la canción actual, arranca automáticamente la primera de la cola.
- Si la cola está vacía, sigue con la siguiente del set original, siempre que NO sea la última canción del set.
- Si la cola está vacía Y es la última canción del set: la reproducción SE DETIENE. El motor vuelve al inicio de esa canción en estado detenido. No avanza ni repite automáticamente. Nada suena por sorpresa en medio de un show.

**Nota sobre tono/tempo en la QuouList:** Las canciones que aparecen en la cola muestran el tono/tempo que ya tenían guardado previamente (por ejemplo, "Tono: -2"). Ese valor es de solo lectura durante el Show. No se puede editar tono ni tempo en vivo. Show está bloqueado para edición — lo que se ve es el valor heredado, no un campo editable.

### 5. Controles de reproducción

```text
     [⏮️]      [⏹]      [▶⏸]      [⏭️]

        Tiempo restante del set: 21:34
```

- **⏮️ Anterior**: canción previa del set.
- **⏹ Stop**: detiene TODO. Muestra confirmación: "¿Terminar el show?".
- **▶⏸ Play/Pause**: pausa sin detener el cronómetro.
- **⏭️ Siguiente**: salta a la siguiente (primero cola, después set).

**No hay:** volumen slider, repetir, ni aleatorio.

---

## ¿Qué NO se puede hacer en modo Show?

```text
❌ Editar tono o tempo de una canción
❌ Editar marcadores
❌ Crear o editar playlists
❌ Navegar a otras vistas (Inicio, Librería, Edit)
❌ Recibir notificaciones del sistema
❌ Apagar la pantalla (brillo forzado)
❌ Salir sin confirmar
```

---

## ¿Cómo se sale del modo Show?

```text
1. Usuario toca ⏹ (Stop)
2. Modal de confirmación:

   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │   ¿Terminar el show?                                    │
   │                                                         │
   │   ╔══════════════════════════╗                          │
   │   ║  Tiempo total: 43:01    ║                          │
   │   ║  Canciones: 12          ║                          │
   │   ║  Cola agregada: 3       ║                          │
   │   ╚══════════════════════════╝                          │
   │                                                         │
   │      [Seguir show]          [Terminar Show]             │
   └─────────────────────────────────────────────────────────┘

3. Al confirmar:
   - El cronómetro se detiene.
   - El modo Show se desactiva.
   - La app vuelve a modo Escucha.
   - Los datos se guardan en el historial.
```

---

## Estados de la vista

| Estado | Qué se ve |
|--------|-----------|
| **Reproduciendo con cola** | Todo funcional, cronómetro corriendo, cola visible |
| **Reproduciendo sin cola** | "Cola vacía. Tocá + para agregar canciones" |
| **Canción en pausa** | Cabezal detenido, cronómetro sigue, botón ▶ |
| **Última canción del set** | "Última canción del set. ¿Agregar más a la cola?" |
| **Set completado** | "Set completado. ¿Terminar show o agregar más canciones?" |

---

## Diferencia clave con la vista Reproductor normal

| Aspecto | Reproductor normal | Vista Show |
|---------|-------------------|------------|
| Cronómetro | No visible (opcional) | SIEMPRE visible, grande |
| QuouList | Panel modal opcional | Siempre visible |
| Tono/Tempo | Ajustable | Bloqueado |
| Navegación | Libre | Bloqueada |
| Notificaciones | Normales | Bloqueadas |
| Brillo de pantalla | Automático | Forzado al máximo |
