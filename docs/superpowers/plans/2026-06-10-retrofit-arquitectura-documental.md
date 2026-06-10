# Retrofit Arquitectura Documental — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir los ~25 documentos de lenguaje natural de Suniplayer en un grafo Obsidian contractual y circular (frontmatter + Función/Entrada/Proceso/Salida/Errores), crear 10 documentos nuevos y validar cero huecos.

**Architecture:** Trabajo 100% documental (NINGÚN código de aplicación). Cada batch retrofitea una carpeta siguiendo la plantilla del design doc y el Mapa de Aristas de este plan. La validación final verifica las 5 reglas de circularidad con búsquedas (Grep) y produce un informe de huecos que se corrige hasta dar cero.

**Tech Stack:** Markdown + frontmatter YAML, wikilinks Obsidian `[[...]]`, git (commits convencionales, sin co-author).

**Spec:** `docs/superpowers/specs/2026-06-10-arquitectura-documental-design.md` (leer ANTES de ejecutar cualquier task — contiene la plantilla del contrato y su semántica).

---

## Reglas operativas (aplican a TODOS los tasks)

1. **Plantilla del contrato**: la define la Sección 1 del spec. Frontmatter (`ruta`, `tipo`, `origen`, `estado`) + secciones `## Función`, `## Entrada`, `## Proceso`, `## Salida`, `## Errores`. El contenido existente (wireframes, tablas, estados) se conserva DEBAJO del contrato, reorganizado dentro de Proceso o como secciones propias. NO se borra contenido — se reordena.
2. **Mapa de Aristas**: las flechas de Entrada/Salida de cada documento salen de la tabla de este plan. Un redactor puede AGREGAR aristas si el contenido lo justifica, pero entonces debe agregar la flecha recíproca en el otro documento del mismo batch o anotarla en `docs/superpowers/plans/aristas-pendientes.md` para el batch correspondiente.
3. **Reciprocidad acotada**: la regla de reciprocidad (regla 3 del spec) aplica entre nodos de producto (`tipo: especificacion | vista | componente`). Los nodos `tipo: indice | diccionario` (INDEX, diccionarios, catálogo de funciones) leen y referencian SIN exigir flecha de vuelta — son índices transversales. Esto evita boilerplate en 19 componentes.
4. **Mundo físico sin wikilink**: salidas/entradas hacia parlantes, pantalla, cámara, sistema operativo, filesystem o BD externa se escriben en texto plano (sin `[[...]]`).
5. **Errores en dos niveles**: cada componente y vista declara `## Errores` con al menos 1 error lógico y 1 semántico. Además, cada `## Errores` cierra con la línea: `Catálogo global: [[07-modelo-errores]]`.
6. **estado**: `estable` para todo, salvo `08-modelo-jam-session.md` y `17-jam-session.md` que llevan `estado: borrador` y un banner `> ⚠️ FASE 2 — borrador. No bloquea el MVP.`
7. **Idioma**: español. Sin anglicismos colados fuera de términos canónicos (QuouList, FadeIn/Out/Mix, etc.).
8. **Commits**: convencionales, SIN co-author ni atribución a IA. Uno por task como mínimo.

---

## Mapa de Aristas (fuente de verdad de Entrada/Salida)

Formato: `←` entradas (productor), `→` salidas (consumidor). Solo las aristas principales; el redactor redacta la descripción de cada flecha según el contenido real del documento.

### Especificaciones

| Doc | origen | ← Entradas | → Salidas |
|---|---|---|---|
| 00-vision-general | [[INDEX]] | INDEX | 01-modelo-audio, 02-modelo-colecciones, 03-modelo-sesion, 04-almacenamiento, 05-telemetria, 06-modelo-backup-sync, 08-modelo-jam-session |
| 01-modelo-audio | [[00-vision-general]] | 00-vision-general, 04-bpm-analyzer (BPM/energía analizados), 03-vista-libreria (canciones importadas) | 01-audio-engine (canción y propiedades), 02-modelo-colecciones (unidades a agrupar), 04-almacenamiento (qué persistir), 09-partituras (archivo asociado), 11-filtros (propiedades filtrables) |
| 02-modelo-colecciones | [[00-vision-general]] | 00-vision-general, 01-modelo-audio, 10-algoritmo-mood (colecciones de curva), 03-vista-libreria (asignación a colecciones) | 01-audio-engine (fuente de reproducción), 01-vista-inicio (colecciones a mostrar), 05-vista-edit (sets), 04-almacenamiento, 08-modelo-jam-session (base de la cola compartida) |
| 03-modelo-sesion | [[00-vision-general]] | 00-vision-general, 15-sesion-audio (eventos del sistema que afectan al modo) | 04-vista-show, 05-vista-edit, 12-cronometro (inicio/fin de modos), 04-almacenamiento, 15-sesion-audio (política de interrupciones por modo) |
| 04-almacenamiento | [[00-vision-general]] | 00-vision-general, 01-modelo-audio, 02-modelo-colecciones, 03-modelo-sesion, 12-cronometro (historial_shows), 13-tema (preferencia), 07-marcadores (persistencia), 16-ecualizador (config), 06-vista-perfil (preferencias) | 14-sync-engine (datos a respaldar), 05-telemetria (datos locales de uso) |
| 05-telemetria | [[00-vision-general]] | 00-vision-general, 04-almacenamiento (datos locales de uso), 12-cronometro (tiempos acumulados) | 06-vista-perfil (estadísticas) |
| 06-modelo-backup-sync (NUEVO) | [[00-vision-general]] | 00-vision-general, 04-almacenamiento (qué respaldar) | 14-sync-engine (contrato del backup), 06-vista-perfil (opciones de configuración), 08-modelo-jam-session (señalización reutilizada) |
| 07-modelo-errores (NUEVO) | [[00-vision-general]] | (índice transversal: lee las secciones Errores de todos los componentes y vistas — sin reciprocidad, regla operativa 3... PERO este doc es `tipo: especificacion`; ver nota abajo) | INDEX |
| 08-modelo-jam-session (NUEVO, borrador) | [[00-vision-general]] | 00-vision-general, 02-modelo-colecciones, 06-modelo-backup-sync | 17-jam-session (contrato de la sesión) |

**Nota 07-modelo-errores**: se declara `tipo: especificacion` pero funciona como catálogo; la línea `Catálogo global: [[07-modelo-errores]]` en cada `## Errores` (regla operativa 5) ES la arista de entrada — el doc lista como Entrada: "← secciones Errores de componentes y vistas (ver índice interno)". No exige flechas individuales de vuelta más allá de esa línea estándar.

### Componentes

| Doc | origen | ← Entradas | → Salidas |
|---|---|---|---|
| 01-audio-engine | [[02-vista-reproductor]] | 01-modelo-audio, 02-modelo-colecciones (fuente), 02-vista-reproductor (órdenes), 04-vista-show (órdenes limitadas), 15-sesion-audio (pausa/reanudar del sistema), 07-marcadores (puntos de Loop A-B), 17-jam-session (arranque programado) | 02-pitch-shifter, 03-time-stretcher, 16-ecualizador, 05-fade-engine (cadena de procesamiento), 06-grafica-ondas (posición/datos), 02-vista-reproductor (estado), 17-jam-session (estado para sincronía) |
| 02-pitch-shifter | [[01-audio-engine]] | 01-audio-engine (buffer + semitonos) | 01-audio-engine (buffer transpuesto) |
| 03-time-stretcher | [[01-audio-engine]] | 01-audio-engine (buffer + porcentaje) | 01-audio-engine (buffer estirado) |
| 04-bpm-analyzer | [[01-modelo-audio]] | 03-vista-libreria (audio al importar) | 01-modelo-audio (BPM, energía), 10-algoritmo-mood |
| 05-fade-engine | [[01-audio-engine]] | 01-audio-engine (evento de transición), 05-vista-edit (configuración de fades/gap) | 01-audio-engine (transición aplicada) |
| 06-grafica-ondas | [[02-vista-reproductor]] | 01-audio-engine (datos de onda, posición), 07-marcadores (pins), 02-vista-reproductor (interacción táctil para seek) | 02-vista-reproductor (gráfica interactiva, seek) |
| 07-marcadores | [[02-vista-reproductor]] | 02-vista-reproductor (alta/edición/borrado), 01-audio-engine (posición del cabezal) | 06-grafica-ondas (pins), 04-almacenamiento (persistencia), 01-audio-engine (puntos de Loop A-B) |
| 08-mirror | [[04-vista-show]] | cámara del dispositivo (físico), 04-vista-show (activación/posición) | 04-vista-show (visor flotante) |
| 09-partituras | [[02-vista-reproductor]] | 01-modelo-audio (imagen/PDF asociado), 15-sesion-audio (pasar página por pedalera) | 02-vista-reproductor (visualización), 04-vista-show (visualización en vivo) |
| 10-algoritmo-mood | [[02-modelo-colecciones]] | 04-bpm-analyzer (BPM/energía) | 02-modelo-colecciones (colecciones de curva), 01-vista-inicio (tarjetas) |
| 11-filtros | [[01-vista-inicio]] | 01-modelo-audio (propiedades filtrables), 01-vista-inicio (criterios), 03-vista-libreria (criterios) | 01-vista-inicio (resultados), 03-vista-libreria (resultados) |
| 12-cronometro | [[03-modelo-sesion]] | 03-modelo-sesion (inicio/fin de modos) | 04-vista-show (crono de show), 06-vista-perfil (estadísticas), 04-almacenamiento (historial_shows), 05-telemetria (tiempos acumulados) |
| 13-tema | [[06-vista-perfil]] | 06-vista-perfil (selección), sistema operativo (preferencia dark/light, físico) | 04-almacenamiento (persistencia), todas las vistas (estilos — cada vista declara `← [[13-tema]]`) |
| 14-sync-engine (NUEVO) | [[06-modelo-backup-sync]] | 06-modelo-backup-sync (contrato), 04-almacenamiento (datos locales), 06-vista-perfil (activación) | BD externa (físico), 06-vista-perfil (estado de sincronización), 17-jam-session (señalización) |
| 15-sesion-audio (NUEVO) | [[03-modelo-sesion]] | sistema operativo (interrupciones, desconexión de salida, botones físicos, pedalera BT — físico), 03-modelo-sesion (política por modo) | 01-audio-engine (órdenes pausa/reanudar), 09-partituras (pasar página), 03-modelo-sesion (eventos que afectan al modo) |
| 16-ecualizador (NUEVO) | [[01-audio-engine]] | 01-audio-engine (buffer + ajustes de bandas) | 01-audio-engine (buffer ecualizado), 04-almacenamiento (configuración) |
| 17-jam-session (NUEVO, borrador) | [[08-modelo-jam-session]] | 08-modelo-jam-session (contrato), 01-audio-engine (estado), 14-sync-engine (señalización) | 01-audio-engine (arranque programado en instante T) |

### Vistas

| Doc | origen | ← Entradas | → Salidas |
|---|---|---|---|
| 01-vista-inicio | [[INDEX]] | 02-modelo-colecciones, 10-algoritmo-mood (tarjetas), 11-filtros (resultados), 13-tema | 02-vista-reproductor (abrir reproducción), 03-vista-libreria, 11-filtros (criterios) |
| 02-vista-reproductor | [[01-vista-inicio]] | 01-vista-inicio, 01-audio-engine (estado), 06-grafica-ondas (gráfica), 13-tema | 01-audio-engine (órdenes: play/pause/stop/next/prev/seek/volumen/MUTE/SHUFFLE + ajustes tono/tempo/EQ — los paneles de la vista hablan SOLO con el motor, que delega en los procesadores), 07-marcadores (gestión), 09-partituras (abrir), 06-grafica-ondas (interacción táctil para seek) |
| 03-vista-libreria | [[01-vista-inicio]] | filesystem del dispositivo (físico), 01-vista-inicio, 11-filtros (resultados), 13-tema | 01-modelo-audio (canciones importadas), 04-bpm-analyzer (análisis al importar), 02-modelo-colecciones (asignación), 11-filtros (criterios) |
| 04-vista-show | [[05-vista-edit]] | 05-vista-edit (única entrada al modo Show), 03-modelo-sesion (reglas del modo), 12-cronometro (crono), 08-mirror (visor), 09-partituras (visualización), 13-tema | 01-audio-engine (órdenes limitadas + MUTE de pánico), 08-mirror (activación) |
| 05-vista-edit | [[01-vista-inicio]] | 02-modelo-colecciones (sets), 03-modelo-sesion, 13-tema | 04-vista-show (iniciar show), 05-fade-engine (configuración de transiciones) |
| 06-vista-perfil | [[01-vista-inicio]] | 05-telemetria (estadísticas), 12-cronometro (tiempos), 14-sync-engine (estado), 06-modelo-backup-sync (opciones de configuración), 13-tema | 13-tema (selección de tema), 14-sync-engine (activación de backup), 04-almacenamiento (preferencias) |

### Diccionarios e índices (sin reciprocidad — regla operativa 3)

| Doc | tipo | origen | Contenido/aristas |
|---|---|---|---|
| INDEX.md | indice | (raíz, sin origen) | → todos los documentos (mapa completo). Glosario actual se reemplaza por puntero a [[00-diccionario-dominio]] |
| diccionario/00-diccionario-dominio (NUEVO) | diccionario | [[INDEX]] | Términos: QuouList, Colección Inteligente (curvas + Más Reproducidas), Set, Playlist, Tempo vs BPM, Gap, Modo Escucha/Edit/Show, Cronómetro de Sesión vs acumulado, Marcador, Loop A-B, Jam Session, Mute de pánico, Energía (4 niveles), FadeIn/Out/Mix, Mirror, Inicio/Fin personalizado. Cada término linkea a su doc dueño |
| diccionario/01-diccionario-datos (NUEVO) | diccionario | [[04-almacenamiento]] | Campo por campo: tablas canciones, marcadores, playlists, playlist_canciones, configuracion, historial_shows (de 04-almacenamiento y 12-cronometro) + estructura del backup externo (de 06-modelo-backup-sync). Por campo: qué guarda, quién lo escribe, quién lo lee |
| funciones/00-catalogo-funciones (NUEVO) | indice | [[INDEX]] | Tabla de TODAS las operaciones lógicas: play, pause, stop, seek, next, prev, setVolume, mute, shuffle, ajustarTono, ajustarTempo, ajustarEQ, analizarBPM, aplicarFade, crearMarcador, loopAB, crearColeccion, eliminarColeccion, importarAudio, iniciarShow, agregarACola, activarMirror, abrirPartitura, pasarPagina, sincronizarBackup, iniciarJam, unirseJam. Por función: qué hace (1 frase), componente dueño (wikilink), desde dónde se invoca (wikilink) |

---

## Task 1: Retrofit de especificaciones (6 archivos existentes)

**Files (Modify):** `docs/especificaciones/00-vision-general.md`, `01-modelo-audio.md`, `02-modelo-colecciones.md`, `03-modelo-sesion.md`, `04-almacenamiento.md`, `05-telemetria.md`

- [ ] **Paso 1: Leer spec + este plan** (plantilla Sección 1 del spec; aristas de la tabla Especificaciones).
- [ ] **Paso 2: Retrofitear los 6 archivos.** Por archivo: frontmatter, contrato (Función/Entrada/Proceso/Salida/Errores) con las aristas de la tabla, contenido existente reordenado debajo. Particularidades:
  - `03-modelo-sesion.md`: agregar la **política de interrupciones por modo** (decisión del spec): en Modo Escucha, una interrupción transitoria (llamada corta, alarma) pausa y REANUDA al terminar; en Modo Show, pausa y QUEDA pausado esperando orden manual del músico (sin sorpresas). Desconexión de salida (cable/Bluetooth): pausa inmediata en TODOS los modos.
  - `00-vision-general.md`: agregar fila "Ecualizador" a la tabla de diferenciación y mención de Jam Session como fase 2.
  - Wikilinks existentes del contenido se conservan.
- [ ] **Paso 3: Verificar.** `grep -L "^## Función" docs/especificaciones/*.md` → esperado: solo `07-modelo-errores.md` y `08-modelo-jam-session.md` ausentes (aún no existen). `grep -c "ruta:" docs/especificaciones/*.md` → 1 por archivo.
- [ ] **Paso 4: Commit.** `git add docs/especificaciones && git commit -m "docs(especificaciones): retrofit contractual con frontmatter y aristas"`

## Task 2: Retrofit de componentes (13 archivos existentes)

**Files (Modify):** `docs/componentes/01-audio-engine.md` … `13-tema.md` (los 13 existentes)

- [ ] **Paso 1: Leer spec + tabla Componentes del plan.**
- [ ] **Paso 2: Retrofitear los 13.** Particularidades:
  - `01-audio-engine.md`: incorporar el EQ a la cadena de procesamiento (pitch → stretch → EQ → fades) y las órdenes entrantes de `15-sesion-audio` (pausa por interrupción/desconexión). La cadena de resolución de next() NO se toca (ya está decidida).
  - `07-marcadores.md`: agregar sección **Loop A-B**: el usuario marca punto A y punto B (dos marcadores existentes o nuevos), el tramo se repite en bucle, combinable con tempo reducido; salida → 01-audio-engine (puntos de salto). Errores semánticos: B anterior a A, A/B fuera de la zona recortada (inicio/fin personalizado).
  - Cada `## Errores`: mínimo 1 lógico + 1 semántico + línea `Catálogo global: [[07-modelo-errores]]`.
- [ ] **Paso 3: Verificar.** `grep -L "^## Errores" docs/componentes/*.md` → vacío (los 13 la tienen). `grep -l "07-modelo-errores" docs/componentes/*.md | wc -l` → 13.
- [ ] **Paso 4: Commit.** `git commit -m "docs(componentes): retrofit contractual + loop A-B en marcadores"`

## Task 3: Retrofit de vistas (6 archivos existentes)

**Files (Modify):** `docs/vistas/01-vista-inicio.md` … `06-vista-perfil.md`

- [ ] **Paso 1: Leer spec + tabla Vistas del plan.**
- [ ] **Paso 2: Retrofitear las 6.** Particularidades (decisiones del spec):
  - `02-vista-reproductor.md`: agregar botón **MUTE** (un toque silencia, otro restaura el volumen previo) junto al volumen; botón **SHUFFLE** junto a Repetir (nota: deshabilitado cuando la fuente es un Set — orden definitivo); botón **EQ** en la fila de herramientas con su panel modal (3-5 bandas). Actualizar el wireframe ASCII de controles para incluir los tres.
  - `04-vista-show.md`: agregar **MUTE de pánico** a los controles permitidos (actualizar wireframe y la lista de lo que SÍ se puede hacer).
  - Los wireframes ASCII se conservan y actualizan, nunca se eliminan.
- [ ] **Paso 3: Verificar.** `grep -l "MUTE\|Mute" docs/vistas/02-vista-reproductor.md docs/vistas/04-vista-show.md | wc -l` → 2. `grep -L "^## Errores" docs/vistas/*.md` → vacío.
- [ ] **Paso 4: Commit.** `git commit -m "docs(vistas): retrofit contractual + mute, shuffle y panel EQ"`

## Task 4: Creación de los 10 documentos nuevos + INDEX

**Files (Create):** `docs/especificaciones/06-modelo-backup-sync.md`, `07-modelo-errores.md`, `08-modelo-jam-session.md`; `docs/componentes/14-sync-engine.md`, `15-sesion-audio.md`, `16-ecualizador.md`, `17-jam-session.md`; `docs/diccionario/00-diccionario-dominio.md`, `01-diccionario-datos.md`; `docs/funciones/00-catalogo-funciones.md`
**Files (Modify):** `docs/INDEX.md`

- [ ] **Paso 1: Crear los 7 docs de producto** con contrato completo según el Mapa de Aristas y el contenido descripto en la Sección 2 del spec. Los 2 de Jam Session con `estado: borrador` y banner FASE 2. `07-modelo-errores.md` cataloga los errores por categoría (archivo, formato, procesamiento, sistema, sincronización, datos) y linkea las secciones Errores de cada doc.
- [ ] **Paso 2: Crear los 2 diccionarios y el catálogo de funciones** según la tabla "Diccionarios e índices". El diccionario de datos se construye LEYENDO `04-almacenamiento.md` y `12-cronometro.md` retrofiteados (no inventar campos).
- [ ] **Paso 3: Actualizar `INDEX.md`**: agregar secciones Diccionario y Funciones a las tablas, los 7 docs nuevos de producto, reemplazar el glosario por un puntero a `[[diccionario/00-diccionario-dominio]]`, actualizar el grafo ASCII de relaciones y el estado del proyecto.
- [ ] **Paso 4: Verificar.** `ls docs/diccionario docs/funciones` → 3 archivos. `grep -c "borrador" docs/especificaciones/08-modelo-jam-session.md docs/componentes/17-jam-session.md` → ≥1 cada uno.
- [ ] **Paso 5: Commit.** `git commit -m "docs: agrega backup-sync, sesion-audio, EQ, jam session (fase 2), diccionarios y catalogo de funciones"`

## Task 5: Validación de circularidad (hasta cero huecos)

**Files:** todos los `.md` de `docs/` (salvo `docs/superpowers/`); **Create:** `docs/superpowers/plans/informe-huecos.md`

- [ ] **Paso 1: Links rotos.** Extraer todos los `[[...]]` de docs de producto y verificar que el archivo destino existe. Registrar cada roto en el informe.
- [ ] **Paso 2: Huérfanos.** Para cada doc de producto, verificar que aparece como wikilink en la Salida o Entrada de al menos OTRO doc de producto. Registrar huérfanos.
- [ ] **Paso 3: Reciprocidad.** Para cada flecha `→ [[X]]` en una Salida, verificar que X declara `← [[origen]]` en su Entrada (solo entre nodos de producto). Registrar flechas sin par.
- [ ] **Paso 4: Entradas sin productor.** Para cada `← [[Y]]`, verificar que Y declara la salida correspondiente. Registrar.
- [ ] **Paso 5: Errores obligatorios.** `grep -L "^## Errores" docs/componentes/*.md docs/vistas/*.md` → debe dar vacío.
- [ ] **Paso 6: Corregir y repetir.** Aplicar correcciones de los pasos 1-5 y volver a correr hasta que el informe dé CERO en todas las categorías. Guardar el informe final en `docs/superpowers/plans/informe-huecos.md`.
- [ ] **Paso 7: Commit final.** `git commit -m "docs: validacion de circularidad — grafo cerrado sin huecos"`

---

## Criterio de cierre

Informe de huecos en cero; grafo Obsidian con ~35 nodos conectados; `INDEX.md` alcanza todo; los 2 docs de Jam Session en `borrador`/FASE 2; historial git con 5+ commits convencionales.
