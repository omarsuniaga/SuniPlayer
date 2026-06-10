---
ruta: docs/funciones/00-catalogo-funciones.md
tipo: indice
origen: "[[INDEX]]"
estado: estable
---

# Catálogo de Funciones Lógicas

Este documento cataloga las operaciones e invocaciones lógicas principales del sistema Suniplayer V2.

---

## Catálogo de Operaciones Lógicas

| Operación | Qué hace (Responsabilidad) | Componente Dueño | Invocador Principal |
|---|---|---|---|
| `play(track)` | Inicializa y decodifica la reproducción de un audio específico. | [[01-audio-engine]] | [[02-vista-reproductor]], [[04-vista-show]] |
| `play()` | Reanuda la reproducción desde la posición de pausa activa. | [[01-audio-engine]] | [[02-vista-reproductor]], [[04-vista-show]] |
| `pause()` | Detiene temporalmente la reproducción salvando el estado del buffer. | [[01-audio-engine]] | [[02-vista-reproductor]], [[04-vista-show]], [[15-sesion-audio]] |
| `stop()` | Cancela el audio, detiene el cronómetro y vuelve al inicio personalizado. | [[01-audio-engine]] | [[02-vista-reproductor]], [[04-vista-show]] |
| `seek(time)` | Salta el cabezal de lectura al segundo especificado. | [[01-audio-engine]] | [[02-vista-reproductor]], [[06-grafica-ondas]] |
| `next()` | Avanza al siguiente track resolviendo la cola QuouList y el Set. | [[01-audio-engine]] | [[02-vista-reproductor]], [[04-vista-show]] |
| `prev()` | Retrocede a la canción previa o reinicia el track según posición. | [[01-audio-engine]] | [[02-vista-reproductor]], [[04-vista-show]] |
| `setVolume(v)` | Ajusta el nivel de ganancia de salida (0 a 100). | [[01-audio-engine]] | [[02-vista-reproductor]] |
| `mute()` | Silencio de pánico instantáneo (volumen a 0%) guardando volumen previo. | [[01-audio-engine]] | [[02-vista-reproductor]], [[04-vista-show]] |
| `shuffle()` | Alterna y mezcla el orden de playlists (no disponible en Sets). | [[02-modelo-colecciones]] | [[02-vista-reproductor]] |
| `ajustarTono(t)`| Transpone en semitonos el buffer de reproducción en caliente. | [[02-pitch-shifter]] | [[02-vista-reproductor]], [[05-vista-edit]] |
| `ajustarTempo(s)`| Modifica la velocidad (tempo) del audio estirando el buffer. | [[03-time-stretcher]] | [[02-vista-reproductor]], [[05-vista-edit]] |
| `ajustarEQ(b)` | Ajusta los decibelios de graves, medios y agudos en el Web Audio. | [[16-ecualizador]] | [[02-vista-reproductor]] |
| `analizarBPM(a)`| Analiza el audio para extraer su BPM y energía al importar. | [[04-bpm-analyzer]] | [[03-vista-libreria]] |
| `aplicarFade(t)` | Aplica rampas de volumen al iniciar, mezclar o terminar tracks. | [[05-fade-engine]] | [[01-audio-engine]] |
| `crearMarcador(t)`| Registra una marca de tiempo y comentario vinculados a un track. | [[07-marcadores]] | [[02-vista-reproductor]], [[06-grafica-ondas]] |
| `loopAB(a, b)` | Activa la repetición cíclica entre dos puntos de tiempo. | [[07-marcadores]] | [[02-vista-reproductor]] |
| `crearColeccion`| Persiste una nueva playlist o set creado por el usuario. | [[02-modelo-colecciones]] | [[01-vista-inicio]] |
| `eliminarColec`| Da de baja permanente una playlist o set del almacenamiento. | [[02-modelo-colecciones]] | [[01-vista-inicio]] |
| `importarAudio` | Copia audios externos y los inserta en IndexedDB. | [[03-vista-libreria]] | [[03-vista-libreria]] |
| `iniciarShow()` | Bloquea la UI, pasa a tema oscuro y activa el cronómetro en vivo. | [[03-modelo-sesion]] | [[05-vista-edit]] |
| `agregarACola()` | Inserta un track al final de la cola temporal dinámica. | [[02-modelo-colecciones]] | [[02-vista-reproductor]], [[04-vista-show]], [[03-vista-libreria]] |
| `activarMirror` | Enciende la cámara frontal en modo mini o medio para control. | [[08-mirror]] | [[04-vista-show]] |
| `abrirPartitura` | Abre el PDF/imagen de partitura en pantalla o pantalla partida. | [[09-partituras]] | [[02-vista-reproductor]], [[04-vista-show]] |
| `pasarPagina()` | Salta a la página siguiente de la partitura (táctil o pedal BT). | [[09-partituras]] | [[09-partituras]], [[15-sesion-audio]] |
| `syncBackup()` | Ejecuta el respaldo y descarga de metadatos contra la nube. | [[14-sync-engine]] | [[06-vista-perfil]] |
| `iniciarJam()` | Crea sala de red local, genera QR y expone señalización WebRTC. | [[17-jam-session]] | [[08-modelo-jam-session]] (FASE 2) |
| `unirseJam()` | Conecta por WebRTC/QR a la sala del anfitrión en LAN. | [[17-jam-session]] | [[08-modelo-jam-session]] (FASE 2) |
