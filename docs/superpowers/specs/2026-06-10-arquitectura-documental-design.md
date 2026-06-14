---
ruta: docs/superpowers/specs/2026-06-10-arquitectura-documental-design.md
tipo: indice
origen: "[[INDEX]]"
estado: estable
---

# Diseño: Arquitectura Documental Contractual de Suniplayer

> Design doc aprobado el 2026-06-10. Define cómo evoluciona el sistema de
> especificación en lenguaje natural hacia un grafo Obsidian cerrado, sin
> huecos, ANTES de cualquier fase de código (SDD/TDD).

## Contexto

Suniplayer V2 se especifica 100% en lenguaje natural antes de escribir código.
El estado actual: 6 especificaciones, 6 vistas, 13 componentes e `INDEX.md`,
auditados y coherentes (auditoría 2026-06-10). Este diseño agrega la capa
contractual que convierte esos documentos sueltos en un sistema circular
navegable con el grafo de Obsidian.

## Decisiones de producto tomadas en este diseño

| Decisión | Resolución |
|----------|-----------|
| Base de datos externa | **Backup/sync opcional en la nube.** La app sigue siendo offline-first; el usuario PUEDE respaldar configuración, contadores y colecciones. Si no lo activa, todo queda local. No rompe el principio offline ni la decisión de telemetría local. |
| Diccionario | **Ambos**: diccionario de términos del dominio + diccionario de datos (campo por campo). |
| Pipeline de desarrollo | **Docs naturales → SDD → TDD estricto → código.** "STT" no es una fase estándar; la fase que sigue a SDD es TDD (test primero). El entorno ya tiene Strict TDD Mode activado. |
| Formato del contrato | **Híbrido**: frontmatter YAML (metadata consultable) + secciones markdown con wikilinks en el cuerpo (garantizan las aristas del grafo). |

## Sección 1 — El contrato de cada archivo

Todo `.md` del sistema (los 25 existentes + los nuevos) cumple esta estructura.
El contenido rico existente (wireframes ASCII, tablas, estados) NO se pierde:
el contrato se integra arriba y el detalle queda debajo.

```markdown
---
ruta: docs/componentes/01-audio-engine.md
tipo: componente        # especificacion | vista | componente | diccionario | indice
origen: "[[02-vista-reproductor]]"   # quién lo invoca o le da razón de existir
estado: estable         # estable | borrador
---

# Audio Engine

## Función
UNA responsabilidad sólida, en una o dos frases.
Si necesita "y además", es otro componente.

## Entrada
- Qué recibe ← [[de-quién-viene]]   (cada entrada declara su productor)

## Proceso
La lógica en lenguaje natural, numerada, paso a paso.

## Salida
- Qué produce → [[hacia-dónde-va]]   (cada salida declara su consumidor)

## Errores
- Lógicos: entrada faltante, inválida o fuera de momento.
- Semánticos: entrada válida pero sin sentido
  (ej.: tono +12 sobre una canción ya transpuesta a +12).

(... contenido detallado existente: wireframes, tablas, estados ...)
```

### Semántica de los campos

- **ruta**: path real del archivo dentro del proyecto.
- **tipo**: uno de `especificacion | vista | componente | diccionario | indice`.
  Los diccionarios usan `diccionario`; el catálogo de funciones e `INDEX.md`
  usan `indice` (son nodos transversales/raíz).
- **origen**: el documento que lo invoca o le da razón de existir ("¿quién me
  necesita?"). Wikilink obligatorio salvo en `INDEX.md` (raíz).
- **estado**: `estable` (validado) o `borrador` (en construcción).
- **Función**: responsabilidad única. Criterio: si la describís con "y además",
  hay que partir el documento.
- **Entrada / Salida**: las flechas `←` / `→` con wikilinks son las aristas del
  grafo. Salidas hacia el mundo físico (parlantes, pantalla) no llevan wikilink.
- **Errores**: obligatoria en componentes y vistas (regla 5 de circularidad).
- Las vistas conservan sus wireframes ASCII dentro de Proceso o como sección
  propia debajo del contrato.

## Sección 2 — Documentos nuevos

| Documento | Contenido |
|-----------|-----------|
| `docs/diccionario/00-diccionario-dominio.md` | Todos los términos del dominio (QuouList, Colección Inteligente, Tempo, Gap, Modo Show…) con definición completa. Absorbe y expande el glosario de `INDEX.md`. |
| `docs/diccionario/01-diccionario-datos.md` | Cada campo de cada tabla (locales + externa de backup): qué guarda, quién lo escribe, quién lo lee. |
| `docs/especificaciones/06-modelo-backup-sync.md` | Modelo del backup/sync opcional: qué se respalda, cuándo, qué pasa sin conexión, privacidad, resolución de conflictos a nivel de modelo. |
| `docs/componentes/14-sync-engine.md` | Componente ejecutor del backup/restore: entrada (datos locales), proceso (sincronización), salida (BD externa), errores (conflictos, sin red, sesión expirada). |
| `docs/funciones/00-catalogo-funciones.md` | Catálogo de TODAS las funciones lógicas del sistema (play, next, seek, analizarBPM, fadeMix, crearColección…) con su componente dueño. Índice transversal del grafo. |
| `docs/especificaciones/07-modelo-errores.md` | Mapa global de errores lógicos y semánticos; enlaza la sección Errores de cada componente. |
| `docs/componentes/15-sesion-audio.md` | Integración con el sistema operativo: reproducción en segundo plano, controles y metadata en pantalla bloqueada/notificación, interrupciones (llamadas, alarmas), desconexión de salida (cable/Bluetooth → pausa inmediata), botones físicos de auriculares. Ecos en `04-vista-show.md`, `01-audio-engine.md` y `03-modelo-sesion.md`. |
| `docs/componentes/16-ecualizador.md` | EQ básico de 3-5 bandas como ajuste en tiempo real. Se integra a la cadena del motor de audio (junto a pitch/tempo). Configuración persistente por canción o global (a definir en su spec). |
| `docs/especificaciones/08-modelo-jam-session.md` | **FASE 2 — borrador.** Modelo de la sesión multi-dispositivo: roles (anfitrión/invitados), código de sala + QR, cola compartida (anfitrión = fuente de verdad, invitados proponen), préstamo efímero de audios (cache de sesión, se borra al cerrar). |
| `docs/componentes/17-jam-session.md` | **FASE 2 — borrador.** Componente de sincronización: descubrimiento vía señalización (reutiliza el backend opcional de backup), conexión directa entre dispositivos en LAN (WebRTC), sincronización de relojes estilo NTP, arranque programado "reproducí en el instante T" con compensación de latencia de salida (~10-20ms de precisión), precarga de audio antes de sonar. |
| `docs/componentes/18-completador-set.md` | Completador de tiempo restante: propone combinaciones de canciones cuya duración efectiva (fin − inicio personalizado) suma exactamente el tiempo que falta del show (tolerancia configurable), excluyendo las ya reproducidas. PROPONE, el músico confirma — nada se autoejecuta en vivo. |

`INDEX.md` se actualiza como nodo raíz: todo documento es alcanzable desde ahí.
El glosario de `INDEX.md` pasa a ser un puntero al diccionario de dominio.

### Decisiones de la evaluación contra reproductor estándar (2026-06-10)

Resultado de evaluar componentes y vistas contra los elementos básicos de un
reproductor estándar:

- **Sesión de audio del sistema**: hueco crítico detectado (segundo plano,
  lock screen, interrupciones, desconexión de salida, botones físicos).
  Se cubre con el nuevo componente `15-sesion-audio.md`.
- **Mute instantáneo (silencio de pánico)**: SÍ — botón en vista Reproductor
  y vista Show. Un toque silencia, otro restaura el volumen previo.
- **Shuffle**: el control vive como botón en la vista Reproductor, junto a
  Repetir. Opera sobre la fuente actual; NUNCA disponible en Sets (orden
  definitivo del músico).
- **Ecualizador**: SE INCLUYE como componente `16-ecualizador.md` (3-5 bandas).
  Decisión del usuario: para músicos en vivo, moldear el sonido suma valor real.

Estos comportamientos se incorporan durante el retrofit en los documentos
afectados: `02-vista-reproductor.md` (mute + shuffle + acceso a EQ),
`04-vista-show.md` (mute), `01-audio-engine.md` (cadena de audio con EQ,
órdenes de la sesión de audio) y `03-modelo-sesion.md` (política de
interrupciones por modo).

### Decisiones de usabilidad (2026-06-10)

- **Jam Session (FASE 2)**: reproducción sincronizada multi-dispositivo por
  WiFi local, modelo cast (control separado de reproducción) + multi-room
  sincronizado. Se documenta AHORA con `estado: borrador` y etiqueta FASE 2
  para blindar la idea sin retrasar el MVP. La fase 1 no depende de ella.
- **Loop A-B entre marcadores (FASE 1)**: repetir el tramo entre dos
  marcadores, combinable con tempo reducido — herramienta de práctica.
  Se incorpora como sección en `07-marcadores.md` durante el retrofit.
- **Pedalera Bluetooth (FASE 1)**: pedales BT como extensión de los botones
  físicos del componente `15-sesion-audio.md`. Mapeo CONFIGURABLE: el usuario
  sincroniza la pedalera y asigna a cada pedal (típicamente 2) el comando que
  quiera de una lista (siguiente, anterior, play/pausa, mute, pasar página,
  crear marcador). Se configura en la vista Perfil.
- **Cuenta regresiva de set (FASE 1)**: el cronómetro de Show suma un modo
  countdown con duración objetivo personalizable (típico 45/90 min) y alertas
  visuales de hitos (faltan 10, faltan 5, tiempo cumplido). Vive en
  `12-cronometro.md` y se muestra en la vista Show.
- **Completador de set (FASE 1)**: nuevo componente `18-completador-set.md` —
  llena el tiempo restante del show con tracks que suman exactamente ese
  tiempo (por duración efectiva). Propone; el músico confirma.
- **Gap con precisión fina**: el tiempo de espera entre canciones (Flujo
  Automático) es configurable en segundos con precisión de milisegundos.
- Verificado contra ideas del usuario: el "efecto Mezcla" YA está cubierto por
  FadeMix (`05-fade-engine.md`) y el visualizador de partituras por
  `09-partituras.md` — no se duplican.

## Sección 3 — Reglas de circularidad (cero huecos)

Alcance: estas reglas aplican al grafo del producto (`docs/especificaciones/`,
`docs/vistas/`, `docs/componentes/`, `docs/diccionario/`, `docs/funciones/` e
`INDEX.md`). La carpeta meta `docs/superpowers/` (specs de diseño y planes)
queda fuera del grafo y no cuenta para huérfanos ni reciprocidad.

1. **Sin links rotos**: toda Salida con wikilink apunta a un archivo existente.
2. **Sin huérfanos**: todo documento (salvo `INDEX.md`) es salida de al menos
   otro documento. Si nadie lo referencia: falta el link o el doc sobra.
3. **Reciprocidad**: si A declara `Salida → B`, B declara `Entrada ← A`.
   Las flechas van de a pares.
4. **Toda entrada tiene productor**: si un documento declara recibir algo
   (ej. "BPM de la canción"), otro documento debe declararlo como salida.
   Nada aparece de la nada.
5. **Errores obligatorios**: todo componente y vista declara al menos sus
   errores lógicos y semánticos. Sin sección Errores, el doc está incompleto.

### Validación

Al final del retrofit se corre una pasada de verificación (búsqueda sobre
todos los wikilinks y secciones) que produce un **informe de huecos**:
links rotos, huérfanos, flechas sin par, entradas sin productor, docs sin
Errores. Se corrige y se repite hasta que el informe dé cero.

## Plan de ejecución (resumen)

Batches delegados a sub-agentes redactores, en este orden:

1. Retrofit de `docs/especificaciones/` (6 archivos) al contrato.
2. Retrofit de `docs/componentes/` (13 archivos) al contrato.
3. Retrofit de `docs/vistas/` (6 archivos) al contrato.
4. Creación de los 11 documentos nuevos (Sección 2; los 2 de Jam Session
   nacen con `estado: borrador`) + actualización de `INDEX.md`.
5. Validación de circularidad + informe de huecos + correcciones hasta cero.

El detalle por batch vive en el plan de implementación (writing-plans).

## Qué NO incluye este diseño

- Código de la aplicación (ni una línea — la fase de código llega tras SDD/TDD).
- Elección del stack tecnológico ni del proveedor concreto del backup.
- Cambios de comportamiento del producto más allá de la decisión de
  backup/sync opcional documentada arriba.

## Criterio de éxito

El grafo de Obsidian muestra los ~36 documentos conectados, sin nodos sueltos;
el informe de huecos da cero; cualquier persona (o IA) puede recorrer desde
`INDEX.md` hasta cualquier componente siguiendo entradas y salidas sin
encontrar una referencia que no exista.
