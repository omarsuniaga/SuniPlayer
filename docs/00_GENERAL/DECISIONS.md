# Architecture & Product Decisions (ADR)

Este log registra las decisiones críticas tomadas por los agentes para evitar regresiones.

---

## [2026-03-10] ADR 001: Implementación de Generatividad y Diseño Expresivo
**Agente:** Product Architect / UX Designer
**Contexto:** El usuario solicitó una línea visual coherente y técnica.
**Decisión:** 
- Se instalaron las skills `expressive-design` y `generativity`.
- Se refactorizó la app en una estructura modular de "Shell" (`SuniShell`).
- Se definió un objeto de diseño centralizado (`THEME`).

## [2026-03-10] ADR 002: Sincronización de Tiempos a Milisegundos
**Agente:** State & Data Engineer
**Contexto:** Había discrepancias entre la duración en segundos y milisegundos entre el Builder y el Player.
**Decisión:** 
- Se estandarizó el uso de `duration_ms` en las interfaces.
- Los cálculos algorítmicos se realizan en milisegundos para evitar errores de redondeo en sets largos.

## [2026-03-10] ADR 003: Jerarquía documental y validación base del repositorio
**Agente:** Product Architect / Technical Documenter
**Contexto:** La documentación mezclaba estado actual del repo con visión futura de plataforma, y el proyecto todavía no tenía quality gates mínimos explícitos.
**Decisión:**
- `MVP_SCOPE.md` se establece como fuente principal de verdad para alcance.
- `DECISIONS.md` se usa para registrar excepciones y transiciones aprobadas.
- Se alinearon `README.md`, `ROADMAP.md`, `TASKS.md` y `TESTING.md` con el estado real del repo web.
- Se añadieron scripts base de `lint`, `typecheck`, `test` y `validate` para soportar una autonomía operativa más honesta.

## [2026-03-10] ADR 004: Persistencia inicial para la etapa web
**Agente:** State & Data Engineer / Product Architect
**Contexto:** El MVP necesita persistencia local minima, pero el repo actual sigue siendo una app web y aun no existe una decision formal de migracion de plataforma.
**Decisión:**
- La persistencia inicial del MVP web debe apoyarse en `localStorage` para configuracion, historial y estado ligero.
- `IndexedDB` queda como siguiente opcion si la biblioteca musical, metadata o volumen de sets supera lo razonable para almacenamiento simple.
- `SQLite` permanece fuera de la etapa web actual y solo debe reconsiderarse despues de una decision formal de plataforma.
- La implementacion de `T-011` debe comenzar por contratos y limites de persistencia en web antes de cualquier migracion de tecnologia.

## [2026-03-11] ADR 005: Transposicion tonal por perfil de cancion
**Agente:** Audio Systems Architect / State & Data Engineer
**Contexto:** El producto necesita guardar la intencion musical de tocar una cancion en otro tono sin perder el tono original detectado o configurado.
**Decisión:**
- Cada track puede guardar `key`, `targetKey` y `transposeSemitones`.
- `key` representa el tono base/original conocido de la cancion.
- `targetKey` representa el tono deseado para performance.
- `transposeSemitones` se calcula automaticamente desde esos dos valores y se persiste como parte del perfil del track.
- En la etapa web actual, la reproduccion aplica esta transposicion mediante `playbackRate`, aceptando que pitch y tempo cambian juntos.
- Una futura etapa de audio avanzado podra reemplazar este comportamiento por pitch shifting con preservacion de tempo.

## [2026-03-11] ADR 006: Recovery de sesion para shows en PWA
**Agente:** QA / Scenario Tester / State & Data Engineer
**Contexto:** Una recarga inesperada en iPad durante un show no puede borrar la cola ni el contexto critico de reproduccion.
**Decisión:**
- SuniPlayer guarda snapshots de show en `IndexedDB` ademas de la persistencia ligera existente.
- El snapshot incluye builder, player, history, metadata de library y settings relevantes para restaurar una sesion de escenario.
- La restauracion vuelve siempre en pausa para evitar playback sorpresivo.
- Los tracks importados localmente se restauran como metadata de sesion y se consideran candidatos a reconexion porque `blob_url` no es confiable despues de una recarga en iPad.
- La app intenta solicitar `navigator.storage.persist()`, pero esa solicitud no elimina las limitaciones de iPadOS.

---

## [2026-04-03] ADR 002: Soberanía del Audio y Reproducción Atómica
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** Se detectaron inconsistencias donde la UI (modales, navegación) interrumpía el audio activo de forma injustificada.
**Decisión:**
1. **Soberanía del Audio**: Ningún componente de navegación o configuración (Modales, Repertoire, Settings) tiene permitido emitir comandos `stop()` o `pause()` al motor de audio principal, excepto si es una acción explícita de "Preview" controlada.
2. **Acciones Atómicas**: Se implementó `quickPlay(track)` en el `ProjectStore` como el único punto de entrada para cambios de track inmediatos. Esto asegura que el `stop()`, `load()` y `play()` ocurran en una única transacción de estado, evitando limbos de silencio.
3. **Blindaje de Cola**: Las acciones de "Append to Queue" deben ser inertes al transporte; añadir temas no debe afectar el estado de `playing`.

---

## [2026-04-03] ADR 003: Protocolo de Amarre Estructural de IA (SIP)
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** Necesidad de que cualquier modelo de IA entienda el proyecto y sus reglas de forma automática.
**Decisión:**
1. **Manifiesto de Amarre**: Se creó `.agents/manifest.md` como mapa central que vincula: `Feature -> Código -> Skill -> Spec`.
2. **Skills Obligatorias**: Toda funcionalidad mayor debe estar gobernada por una Skill en `.agents/skills/`.
3. **Anclajes de Contexto**: Se establece el uso de bloques `@ai-context` en los archivos clave para guiar a la IA.
**Impacto:** Mejora drástica en la precisión de las IAs y reduce la probabilidad de regresiones arquitectónicas.

---

## [2026-04-03] ADR 004: Inteligencia Avanzada de DJ (Cerebro Autónomo)
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** El Builder de Sets generaba listas basadas solo en BPM plano, sin considerar la musicalidad ni la fluidez profesional de un show.
**Decisión:**
1. **Mezcla Armónica**: Implementar un flag para obligar al algoritmo a seguir el Círculo de Quintas (Camelot), asegurando transiciones sin choques de tono.
2. **Suavizado de Transiciones (BPM Step)**: Introducir un límite configurable (`maxBpmJump`) para evitar cambios de tempo bruscos que rompan el ritmo del escenario.
3. **Continuidad de Energía (Mood Flow)**: Establecer una regla de progresión de `Mood` para mantener una narrativa energética coherente durante el set.
4. **Diagnóstico en Tiempo Real**: Mostrar el "Universo Disponible" en los ajustes para dar feedback inmediato sobre el impacto de los filtros.
**Impacto:** SuniPlayer pasa de ser un reproductor a ser un asistente de curaduría profesional.

---

## [2026-04-03] ADR 005: Motor de Generación con Restricciones (Anchors)
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** El músico necesitaba fijar temas en posiciones específicas (ej: un vals en el minuto 40) y que el algoritmo construyera el set alrededor.
**Decisión:** Reescritura del servicio `buildSet` para soportar anclajes (📌). El algoritmo ahora identifica "gaps" entre temas fijos y usa Monte Carlo para optimizar las transiciones (BPM y Key) hacia esos puntos.

---

## [2026-04-03] ADR 006: Interfaz de Alta Densidad (Cockpit UI)
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** Necesidad de operar la app en vivo con mínima fricción y visibilidad máxima en pantallas pequeñas.
**Decisión:** Implementación del lenguaje visual "Cockpit":
1. Filas comprimidas a 32px-40px.
2. Botones de acción agrupados con micro-espaciado.
3. Eliminación de scroll en el contenedor principal; uso de scroll interno y desvanecimientos (fades) estéticos.
4. Layout adaptativo (Mobile-First) con touch-targets de 48px en móviles.

---

## [2026-04-03] ADR 007: Modernización del Motor de Audio (AudioWorklet + OPFS)
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** El uso de `ScriptProcessorNode` causaba micro-cortes y warnings de obsolescencia. IndexedDB sufría bloqueos al guardar archivos grandes.
**Decisión:** 
1. **AudioWorklet**: Migración a `@soundtouchjs/audio-worklet`.
2. **OPFS (Origin Private File System)**: El audio binario ahora se guarda en el sistema de archivos privado del navegador.
3. **Smart Replace**: Lógica de reemplazo quirúrgico.

**⚠️ ADVERTENCIAS DE IMPLEMENTACIÓN (Lecciones Aprendidas):**
- **Aislamiento de Hilo**: El `AudioWorkletProcessor` corre en un hilo totalmente separado. No tiene acceso a `window`, ni a librerías externas, ni al prototipo de clases definidas en el hilo principal. TODO el código del algoritmo (WSOLA, Buffers) DEBE estar contenido en un solo archivo independiente (`soundtouch-processor.js`).
- **Sintaxis Nativa vs Wrapper**: La versión moderna de SoundTouchJS NO usa el método `.on()`. La comunicación es exclusivamente vía `MessagePort` (`port.onmessage` / `postMessage`).
- **Singleton de Contexto**: Los navegadores limitan drásticamente la cantidad de `AudioContext` activos. Se DEBE usar un Singleton global para evitar el error `No execution context available`.
- **Visibilidad de Métodos**: Al definir clases dentro del procesador, asegurarse de que los métodos (como `receive()` o `put()`) estén vinculados correctamente para evitar errores de `TypeError`.

---

## [2026-04-04] ADR 008: Sincronía Serverless con Firebase Firestore
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** Netlify no soporta servidores persistentes (WebSockets) necesarios para el signaling de WebRTC.
**Decisión:** Utilizar Firebase Firestore como canal de señalización.
**Fundamento:** Firestore permite suscripciones en tiempo real (`onSnapshot`) que sirven como un "buzón" para el apretón de manos de WebRTC. Esto nos permite una arquitectura 100% serverless, escalable y preparada para PWA sin servidores dedicados.

## [2026-04-04] ADR 009: Sincronía de Play vía "Future Scheduling" (Countdown)
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** La latencia de red hace que los comandos de Play lleguen en tiempos distintos a cada dispositivo.
**Decisión:** Implementar `playAt(targetTimeMs)` con un conteo regresivo obligatorio de 5 segundos.
**Fundamento:** Al programar el arranque en un punto del futuro lejano (5s), garantizamos que todos los dispositivos hayan recibido el mensaje, cargado el audio y ajustado sus relojes antes del instante de disparo. El uso de `AudioContext.currentTime` garantiza precisión de fase sub-milisegundo.

## [2026-04-04] ADR 010: Identidad Persistente de Músico
**Agente:** Gemini CLI (Senior Architect)
**Contexto:** Las recargas de página generaban nuevas identidades, rompiendo la sesión de ensamble y el rol de Líder.
**Decisión:** Persistir `userId`, `sessionId` e `isLeader` en el store.
**Fundamento:** Al fijar la identidad en el disco local, el motor de sincronía puede re-conectarse automáticamente a la misma sala de Firestore con el mismo rol tras un refresco de página, manteniendo la continuidad del ensayo sin intervención humana.

---
*Fin del registro actual.*
