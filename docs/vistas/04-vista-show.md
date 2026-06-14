---
ruta: docs/vistas/04-vista-show.md
tipo: vista
origen: "[[05-vista-edit]]"
estado: estable
---

# Vista Show

## Función

Proveer la interfaz táctil de alta visibilidad para presentaciones en vivo (Modo Show); forzar el bloqueo absoluto de controles propensos a errores accidentales (edición de tono, tempo, seek de ondas, shuffle); e integrar el mute de pánico, la visualización de partituras, el feed de cámara espejada y la propuesta del completador de sets.

## Entrada

- Lanzamiento del show desde el editor de sets ← [[05-vista-edit]]
- Políticas y reglas restrictivas del modo de sesión ← [[03-modelo-sesion]]
- Indicador de modo Show en footer (estado MINI_LOCKED) ← [[19-minireproductor]]
- Cronómetros en tiempo real, cuenta regresiva y alertas visuales de hito ← [[12-cronometro]]
- Feed de cámara local superpuesta ← [[08-mirror]]
- Renderizado de páginas de partitura en vivo ← [[09-partituras]]
- Propuesta de tracks recomendados para cubrir el tiempo restante ← [[18-completador-set]]
- Forzado de variables de color del tema oscuro activo ← [[13-tema]]

## Proceso

1. **Activación de Blindaje (Modo Show):**
   - La vista bloquea la barra de navegación del sistema (clase `.nav-locked`).
   - Forzar la clase `.theme-dark-forced` mediante [[13-tema]] y fija el brillo al máximo en hardware compatible.
   - Remueve los sliders de tono y tempo, mostrando el tono actual y BPM como valores estáticos de lectura.
   - Deshabilita el gesto de seek táctil sobre el waveform de [[06-grafica-ondas]] (clase `.waveform-disabled-seek`).
   - Oculta el botón Shuffle (`display: none`).
2. **Visualización de Cronómetro y Alertas (Hitos):**
   - Renderiza en tipografía masiva el tiempo de show transcurrido.
   - Si se activa el modo de cuenta regresiva (countdown), escucha eventos de [[12-cronometro]]. Aplica clases CSS `.alert-time-warning` (amarillo, a falta de 10 min) y `.alert-time-danger` (rojo, a falta de 5 min) en base a las señales del cronómetro.
3. **Controles Permitidos en Vivo:**
   - **Play/Pausa (`[▶/⏸]`):** Manda comandos a [[01-audio-engine]].
   - **Mute de Pánico (`[🔇 PÁNICO]`):** Silencia instantáneamente el motor de audio a 0% de ganancia en caso de acople o error sin detener los cronómetros.
   - **Visor de Partituras (`[📖]`):** Renderiza la partitura asociada en pantalla partida. Soporta el pasaje automático y manual (táctil o vía pedalera Bluetooth física integrada).
   - **Completador de Set (`[⏱ Completar Set]`):** Llama a [[18-completador-set]] para proponer canciones cuyo tiempo sume exactamente lo que falta para cumplir el countdown, y las añade a la QuouList si el músico pulsa confirmar.
4. **Cierre de Show:** Al pulsar Stop (`⏹`), exige una confirmación con doble tap rápido. Al confirmar, detiene la sesión de show, persiste el registro a [[04-almacenamiento]] y retorna a Modo Escucha.

## Salida

- Comandos de reproducción simplificados y Mute de Pánico → [[01-audio-engine]]
- Encendido y apagado de la cámara flotante → [[08-mirror]]
- Solicitud de combinación de tracks para rellenar tiempo restante → [[18-completador-set]]
- Visualización e interacción de partitura en vivo → [[09-partituras]]
- Evento de navegación entre vistas → [[19-minireproductor]]

## Errores

- **Lógico:** el temporizador del show se detiene o pierde sincronía en segundo plano.
  - *Resolución:* La vista corrige la diferencia horaria consultando la marca de tiempo absoluta provista por [[12-cronometro]] en cada ciclo de actualización.
- **Semántico:** el músico pulsa accidentalmente "Siguiente" o "Anterior" en medio de un tema.
  - *Resolución:* La UI intercepta el comando aplicando una zona muerta de confirmación (el botón exige ser pulsado durante 0.5s continuos antes de ejecutar la acción).

Catálogo global: [[07-modelo-errores]]

---

## Layout de la Pantalla en Vivo

```text
┌──────────────────────────────────────────────────────────────┐
│  🔴 EN VIVO                  SHOW: Sábado 15                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              ╔══════════════════════════╗                    │
│              ║      ⏱  43:21           ║                    │
│              ║      ─────────           ║                    │
│              ║      Restante: -06:39    ║                    │
│              ║      = Total: 50:00      ║                    │
│              ╚══════════════════════════╝                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│   NOW PLAYING (Seek Desactivado)                             │
│   ♫ Salsa Brava  (Tono: La M [+2] | Tempo: 90%)              │
│   ████████████████████████████████░░░░░░░░░░░░░░░░░          │
│   02:34 / 03:45                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│   SIGUIENTES EN SET Y COLA (QuouList)                        │
│   [+] Agregar desde biblioteca    [⏱ Completar Set]          │
│                                                              │
│   1. Merengón.wav         03:12 (Tono: 0)                 ✕  │
│   2. Bachata Rosa.flac    03:34 (Tono: -2)                ✕  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│   CONTROLES FÍSICOS                                          │
│                                                              │
│       [⏮️]        [⏹]        [▶/⏸]        [⏭️]   [🔇 PÁNICO]  │
└──────────────────────────────────────────────────────────────┘
```

---

## Diferencia de Controles (Show vs. Escucha)

- **Cronómetro:** Siempre visible en tamaño grande y de alto contraste en Show.
- **Volumen y Fades:** Slider de volumen oculto en Show (se previene toque erróneo; se delega en volumen físico del hardware o consola); transiciones automáticas de fade actúan solas.
- **Tono/Tempo:** Completamente bloqueados para edición. Solo se visualiza el valor estático heredado.
- **Barra de Navegación:** Totalmente bloqueada bajo la clase `.nav-locked`.
- **Brillo de Pantalla:** Fijado al máximo a través de APIs de PWA (Wake Lock API) para evitar suspensión del dispositivo.

---

## Interacción

### Tipo
toggle (play/pause) + button (stop con confirmación) + button (next/prev con hold 0.5s) + toggle (mute) + split-view (sheet viewer) + button (completador trigger)

### Estados del componente
- `.btn-play-pause.playing` — reproduciendo en vivo
- `.btn-play-pause.paused` — pausado en vivo
- `.btn-next.hold-delay` — botón siguiente con retardo de 0.5s
- `.btn-prev.hold-delay` — botón anterior con retardo de 0.5s
- `.btn-mute.muted` — mute de pánico activo
- `.nav-locked` — navegación inferior bloqueada
- `.theme-dark-forced` — tema oscuro forzado al máximo brillo
- `.waveform-disabled-seek` — seek táctil deshabilitado en waveform
- `.alert-time-warning` — alerta de tiempo restante (10 min, amarillo)
- `.alert-time-danger` — alerta de tiempo restante (5 min, rojo)

### Transiciones
- De idle a activo: el usuario inicia el show desde el editor de sets
- De activo a idle: el usuario detiene el show con confirmación doble tap

---

## Guía de Estilos CSS

### Contenedor principal
- `.vista-show` — layout base de la vista show

### Botón Play/Pausa
- `.btn-play-pause` — estado base
- `.btn-play-pause.playing` — verde brillante, icono ⏸
- `.btn-play-pause.paused` — gris, icono ▶

### Botón Stop
- `.btn-stop` — estado base, requiere confirmación doble tap

### Botón Siguiente / Anterior
- `.btn-next` — botón de siguiente track
- `.btn-next.hold-delay` — requiere 0.5s de presión continua
- `.btn-prev` — botón de anterior track
- `.btn-prev.hold-delay` — requiere 0.5s de presión continua

### Botón Mute / Pánico
- `.btn-mute` — estado base
- `.btn-mute.muted` — rojo parpadeante

### Indicadores de modo
- `.nav-locked` — navegación inferior bloqueada
- `.theme-dark-forced` — tema oscuro forzado, brillo máximo
- `.waveform-disabled-seek` — seek táctil deshabilitado

### Alertas de cronómetro
- `.alert-time-warning` — faltan 10 min, color amarillo
- `.alert-time-danger` — faltan 5 min, color rojo

### Estados de contenido
- `.view-empty` — sin show activo

### Temas
- `.theme-dark` — overrides para modo oscuro
- `.theme-light` — overrides para modo claro

---

### Modal: Completador de Set
- **Trigger:** tap en botón "⏱ Completar Set"
- **Campos:**
  - `propuesta` (list) — lista de tracks sugeridos para cubrir el tiempo restante
  - `tiempo_restante` (display) — tiempo faltante del countdown
- **Acciones:** confirmar (agregar a QuouList) / descartar
- **Valores recolectados:** `{ tracksAgregados: string[] }`
