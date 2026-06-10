---
ruta: docs/vistas/02-vista-reproductor.md
tipo: vista
origen: "[[01-vista-inicio]]"
estado: estable
---

# Vista Reproductor

## Función

Mostrar la interfaz de control de reproducción de alto rendimiento en tiempo real, proveyendo al músico control visual de alta visibilidad de los metadatos críticos del track (título, duración, tonalidad, tempo/BPM) y control absoluto sobre los componentes de procesamiento de audio, marcadores, partituras sincronizadas y pedalera.

## Entrada

- Navegación al reproducir un track ← [[01-vista-inicio]]
- Estado de reproducción, posición y streams de audio ← [[01-audio-engine]]
- Marcadores y comentarios de la línea de tiempo ← [[07-marcadores]]
- Configuración de tema visual (Dark/Light/System) ← [[13-tema]]
- Entrada de comandos mapeados de pedalera física ← [[15-sesion-audio]]

## Proceso

La vista organiza los elementos de control y visualización en una interfaz optimizada para lectura rápida en escenarios con baja iluminación. Prioriza la información del track y la partitura sobre cualquier elemento estético como portadas.

### 1. Panel de Metadatos Críticos para Escenario (Alto Contraste)
Reemplaza cualquier elemento de portada o diseño de álbum por un bloque de texto consolidado en tipografía monoespaciada o de alta legibilidad:
- **Título del Track:** Nombre editable de la canción en tamaño gigante (mínimo 24pt).
- **Reloj de Tiempo Dual:** Muestra el tiempo actual del track. Un tap sobre este elemento alterna su comportamiento y su clase CSS asociada:
  - Clase `.time-elapsed`: Muestra el tiempo transcurrido `MM:SS.CC` (minutos, segundos, centésimas).
  - Clase `.time-remaining`: Muestra el tiempo restante `-MM:SS.CC` (basado en el fin personalizado del track, si está configurado).
- **Tonalidad Activa (Key Info):** Muestra el tono fundamental original y, si está transpuesto, el ajuste en un color de advertencia de alto contraste:
  - Ej: `Tono original: Sol M | Ajustado: La M (+2 semitonos)` (clase CSS `.key-modified`).
- **Tempo/BPM Activo:** Muestra el pulso original calculado y el actual modificado por el tempo:
  - Ej: `BPM original: 120 | Actual: 108 BPM (90% de velocidad)` (clase CSS `.bpm-modified`).
- **Indicador de Protocolo de Modo:** Muestra en la esquina superior derecha de forma persistente:
  - `🔴 MODO SHOW` (clase CSS `.mode-show-pill`, animación de parpadeo de seguridad).
  - `✏️ MODO EDIT` (clase CSS `.mode-edit-pill`).

### 2. Layout de la Interfaz

```text
┌──────────────────────────────────────────────────────────────┐
│  ← Volver       DESDE: Set Sábado Noche            🔴 SHOW   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   🎵 Salsa Brava (03:45.00)                                  │
│   ⏱ RESTANTE: -02:15.20                                     │
│   🎹 TONO: La M (+2) [Orig: Sol M]                           │
│   🥁 TEMPO: 108 BPM (90%) [Orig: 120]                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  WAVEFORM GRÁFICA & MARCADORES (Loop A-B activo)             │
│                                                              │
│       ▲ [A] 00:30.00                       ▼ [B] 01:45.00    │
│  ░░░░░█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█░░░░░░░░░░░░░░░  │
│       ●───────🟢─────────🔴─────────────🟡                    │
│     00:30    Intro      Coro 1         Solo                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  CONTROLES DE ACCIÓN                                         │
│                                                              │
│   [⏮️]     [⏹]     [▶/⏸]     [⏭️]     [🔇 PÁNICO]            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  HERRAMIENTAS MÚSICO                                         │
│                                                              │
│   [🎵 Tono]   [⏱ Tempo]   [📌 Marcos]   [📖 Partitura]   [EQ]│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 3. Especificación de Botones y Reacciones en Cadena

#### A. Botón Play/Pausa (`[▶/⏸]`)
- **Requisitos para actuar:** Debe existir un track cargado y seleccionado en el reproductor.
- **Clases de CSS de Estado:**
  - `.btn-play-pause`: Clase base.
  - `.playing`: Aplicada cuando el audio está activo. El icono cambia a `⏸` en color verde brillante.
  - `.paused`: Aplicada cuando el audio está pausado. El icono cambia a `▶` en color de espera (gris/blanco).
- **Reacción en Cadena (Pausa ➔ Play):**
  1. Envía señal `play()` a [[01-audio-engine]].
  2. Dispara el cronómetro ascendente y de show en [[12-cronometro]].
  3. Inicia la animación del cabezal de lectura y los pins en [[06-grafica-ondas]] a la velocidad del tempo actual.
  4. Dispara el `FadeIn` progresivo en [[05-fade-engine]] (arranca el volumen en 0% y lo incrementa linealmente en el lapso de segundos configurado hasta el volumen seteado de la canción).
  5. Activa el preloader en [[02-modelo-colecciones]] para descargar y cachear en memoria el buffer del siguiente track de la QuouList.
  6. Dispara el hilo de escucha de [[07-marcadores]] para actualizar el visor de comentarios a medida que el timestamp avanza.
  7. Si el track tiene una partitura asignada, abre el panel de visualización de [[09-partituras]] y activa el monitor de cambio automático de página.
- **Reacción en Cadena (Play ➔ Pausa):**
  1. Envía señal `pause()` a [[01-audio-engine]].
  2. Detiene temporalmente el incremento del cabezal y pausa los cronómetros de [[12-cronometro]].
  3. Mantiene intacto el buffer de audio y la posición actual de lectura.
  4. Quita la clase `.playing` y añade la clase `.paused` al botón en la UI.

#### B. Botón Stop (`[⏹]`)
- **Requisitos para actuar:** Track cargado.
- **Clases de CSS de Estado:** `.btn-stop`.
- **Reacción en Cadena:**
  1. Envía señal `stop()` a [[01-audio-engine]].
  2. Vuelve la posición del reproductor al punto de `Inicio personalizado` del track (o `00:00.00` por defecto).
  3. Reinicia a cero el contador de duración del track en la UI y detiene el cronómetro del show.
  4. Limpia cualquier tooltip de marcador activo en la pantalla.
  5. Remueve la clase `.playing` y activa `.paused` en el botón Play/Pausa.

#### C. Botón Mute de Pánico (`[🔇 PÁNICO]`)
- **Requisitos para actuar:** Audio activo reproduciéndose.
- **Clases de CSS de Estado:**
  - `.btn-mute`: Clase base.
  - `.muted`: Si está silenciado. El botón parpadea en color rojo brillante y muestra una campana tachada.
- **Reacción en Cadena:**
  1. Envía comando a [[01-audio-engine]] para establecer instantáneamente el volumen de salida a `0%` (mute físico).
  2. Guarda en memoria temporal el nivel de volumen previo al mute (ej. `75%`).
  3. El reproductor física y lógicamente sigue corriendo (el cabezal de ondas y el cronómetro avanzan).
  4. Al presionar nuevamente, envía el volumen guardado en memoria al motor de audio y remueve la clase `.muted`.

#### D. Botón Siguiente (`[⏭️]`) y Anterior (`[⏮️]`)
- **Reacción en Cadena (Siguiente):**
  1. Solicita el track siguiente en la QuouList a [[02-modelo-colecciones]].
  2. Si hay un `FadeMix` configurado, [[05-fade-engine]] mezcla la salida del track actual con la entrada del siguiente durante el tiempo establecido.
  3. Si no hay transition o está en Modo Show, detiene el track actual de golpe e inicia la reproducción inmediata del siguiente.
- **Reacción en Cadena (Anterior):**
  1. Si el cabezal de reproducción está a más de `03.00` segundos del inicio del track, reinicia el track actual al punto de inicio personalizado.
  2. Si está a menos de `03.00` segundos, solicita al motor cargar el track anterior de la QuouList.

#### E. Botón Partitura (`[📖 Partitura]`)
- **Requisitos para actuar:** El track actual debe poseer un archivo PDF o imagen asignada en [[01-modelo-audio]].
- **Clases de CSS de Estado:**
  - `.btn-sheet`: Clase base.
  - `.has-sheet`: Activo si hay partitura (color azul).
  - `.disabled-opacity`: Deshabilitado si no hay partitura asignada (el botón no reacciona al tap).
  - `.sheet-split-active`: Aplicada cuando el visor está abierto en pantalla dividida.
- **Reacción en Cadena (Apertura del Visor):**
  1. Divide la pantalla principal del reproductor en dos paneles verticales (Waveform + Metadatos a la izquierda; Visor de Partitura a la derecha).
  2. Envía el ID del recurso de partitura a [[09-partituras]] para renderizar la página inicial.
  3. Lee la configuración persistente de **Cambio Automático de Página** vinculada al track.
- **Cambio Automático de Página Sincronizado:**
  - El panel del visor permite al usuario pulsar "Editar Páginas" (sólo en Modo Edit) para configurar timestamps exactos de transición de página.
  - *Modelo de datos persistente:* Estructura de marcas guardadas en la DB local (`configuracion_partituras`):
    - `id_track` (String), `timestamp_salto` (Decimal, ej: `214.40`), `pagina_destino` (Integer, ej: `2`).
  - *Proceso de Transición:*
    1. A medida que el cabezal en [[01-audio-engine]] avanza y cruza el `timestamp_salto`, la vista envía una señal a [[09-partituras]] para cargar de inmediato la `pagina_destino` sin intervención del músico.
    2. Si el músico presiona un pedal Bluetooth configurado en su pedalera física, [[15-sesion-audio]] envía una señal manual de "Pasar Página". La vista ejecuta el salto de página y suspende la transición automática configurada para ese timestamp específico durante el resto de la ejecución actual, para dar prioridad al control humano.

---

### 4. Protocolo Estricto de Modos

#### A. Modo Edit (Preparación)
- El interruptor en la esquina superior está en `.mode-edit-pill`.
- **Acciones Permitidas:**
  - Cambiar el tono en caliente usando el slider del panel modal.
  - Alterar la velocidad de reproducción (Tempo) libremente.
  - Tocar en la gráfica de ondas para cambiar la posición (seek táctil activo).
  - Crear, mover y eliminar marcadores en la línea de tiempo.
  - Configurar las transiciones de página de partituras y asociar nuevos PDF/imágenes.
  - Reordenar la cola QuouList de canciones.

#### B. Modo Show (Ejecución en Vivo — Blindado)
- El interruptor está en `.mode-show-pill` (parpadeando).
- **Protocolo de Bloqueo Estricto:**
  1. **Bloqueo de Navegación:** La barra inferior de navegación (Inicio, Librería, Perfil, Edit) se bloquea (añade la clase CSS `.nav-locked`). Si el usuario intenta pulsar un botón de salida, la UI muestra una ventana modal de advertencia en pantalla completa: `"¿CONFIRMAS SALIR DEL MODO SHOW? (Presiona dos veces rápido)"` (clase `.panic-modal-confirm`).
  2. **Bloqueo de Transposición/Pitch:** El botón `[🎵 Tono]` y el control de `[⏱ Tempo]` se deshabilitan totalmente visual y lógicamente (`.btn-disabled`). La canción se reproduce exactamente con la transposición y velocidad pre-guardadas en la base de datos para ese track.
  3. **Bloqueo de Desplazamiento Accidental (Seek Lock):** Se deshabilita la capacidad de cambiar la posición de reproducción al tocar sobre la Waveform física. Rozar la pantalla por accidente no alterará la canción que está sonando.
  4. **Bloqueo de Edición:** El panel de marcadores queda en modo "Solo lectura". Es imposible añadir o borrar pins de la línea de tiempo.
  5. **Ocultamiento de Shuffle:** El botón de reproducción aleatoria `[🔀]` se remueve de la barra de controles (`display: none`), asegurando que las listas de reproducción sigan estrictamente el orden decidido por el artista.
  6. **Controles Habilitados en Show:** Únicamente Play/Pausa, Stop, Siguiente/Anterior (con confirmación anti-tap accidental de 0.5s de retardo), Mute de Pánico, y el visor de partituras (con transición manual o por pedal Bluetooth).

## Salida

- Llamadas de control de reproducción y procesamiento de señales → [[01-audio-engine]]
- Registro y actualización de marcadores → [[07-marcadores]]
- Renderizado de hojas de música → [[09-partituras]]
- Desplazamiento físico del cabezal de reproducción → [[06-grafica-ondas]]

## Errores

- **Lógico (Sin track activo):** El usuario intenta arrancar la reproducción pero la QuouList está vacía.
  - *Resolución:* La UI oculta los controles interactivos principales, añade la clase `.view-empty` al layout y despliega un banner central en color amarillo de alta visibilidad: `"SELECCIONÁ UNA CANCIÓN EN LA LIBRERÍA PARA COMENZAR"`.
- **Semántico (Ajuste de tono excedido):** El usuario arrastra el slider de tono en Modo Edit superando el rango permitido (-12 o +12 semitonos).
  - *Resolución:* El slider frena físicamente en los extremos. Si el usuario intenta forzar el comando mediante atajos, la UI muestra un tooltip temporal en la herramienta: `"Rango límite de transposición alcanzado"`.
- **Sistema (Fallo de pedalera BT en vivo):** La pedalera física configurada pierde conexión en medio de una canción.
  - *Resolución:* La vista recibe el evento de desconexión de [[15-sesion-audio]]. Muestra un icono de alerta pequeño en amarillo al lado de la partitura (clase `.alert-pedal-lost`) pero NO detiene el audio ni altera el visor de partituras. Los comandos del pedal se ignoran limpiamente para evitar lecturas fantasma.

Catálogo global: [[07-modelo-errores]]
