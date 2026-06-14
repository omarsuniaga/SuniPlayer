---
ruta: docs/especificaciones/03-modelo-sesion.md
tipo: especificacion
origen: "[[00-vision-general]]"
estado: estable
---

# Modelo de Sesión

## Función

Definir los tres modos de uso de Suniplayer (Escucha, Edit, Show), las reglas de transición entre ellos, la política de interrupciones por modo y el comportamiento de los cronómetros de sesión.

## Entrada

- Marco de referencia del sistema ← [[00-vision-general]]
- Eventos del sistema operativo que afectan al modo activo ← [[15-sesion-audio]]

## Proceso

El modelo de sesión determina qué puede hacer el músico en cada momento. El modo activo restringe o habilita controles, define qué se persiste al salir y establece cómo la app reacciona ante interrupciones externas (llamadas, alarmas, desconexión de audio). Las transiciones entre modos son unidireccionales según el flujo Edit → Show → Escucha.

### Política de interrupciones por modo

El comportamiento ante interrupciones externas (llamadas, alarmas, desconexión de audio) varía según el modo activo. En Escucha y Edit la app reanuda automáticamente; en Show el sistema queda pausado y espera orden manual del músico para evitar sorpresas en escenario. La gestión de bajo nivel la ejecuta [[15-sesion-audio]] (ver tabla de política de interrupciones más abajo).

## Salida

- Modo activo y sus restricciones → [[04-vista-show]]
- Modo activo y sus restricciones → [[05-vista-edit]]
- Señal de inicio/fin de modos para los cronómetros → [[12-cronometro]]
- Qué datos de sesión persistir → [[04-almacenamiento]]
- Política de interrupciones por modo → [[15-sesion-audio]]
- Estado de modo activo (Escucha/Edit/Show) para UI persistente → [[19-minireproductor]]

## Errores

- **Lógico:** se intenta iniciar el modo Show sin un Set activo (no hay canciones preparadas) — la transición se bloquea con aviso al usuario.
- **Semántico:** el sistema intenta reanudar automáticamente después de una interrupción mientras el modo activo es Show — la política prohíbe reanudar sin orden manual; se ignora la señal de reanudación y se mantiene el estado pausado.

Catálogo global: [[07-modelo-errores]]

---

## ¿Qué es una Sesión?

Es el **contexto** en el que el músico usa Suniplayer. No es lo mismo estar ensayando solo en casa que estar en un escenario con 500 personas mirando. La sesión define qué se puede hacer, qué se ve, y cómo se comporta la app.

---

## Los tres modos de sesión

### 1. Modo Escucha

El modo por defecto. Es el reproductor "normal".

**Propósito:** Disfrutar música, explorar la librería, analizar canciones.

**Comportamiento:**
- Todos los botones están disponibles.
- Se puede navegar entre vistas libremente.
- Se pueden crear y editar playlists.
- El contador de reproducciones aumenta.
- No hay restricciones.

**¿Cuándo se usa?**
- Descubriendo música nueva.
- Escuchando mientras se hace otra cosa.
- Analizando el BPM de una canción nueva.

---

### 2. Modo Edit (Preparación)

**Propósito:** Preparar un set antes de subir al escenario.

**Comportamiento:**
- Se pueden crear y editar Sets.
- Se pueden ajustar tono, tempo, in/out de cada canción.
- Se pueden configurar transiciones (fade) entre canciones.
- Se pueden ensayar canciones sueltas con los ajustes aplicados.
- Se pueden cargar partituras y ajustar marcadores.
- El cronómetro del set muestra la duración total planificada.
- NO hay restricciones de botones — todo está disponible.

**¿Cuándo se usa?**
- Antes de un show, en el camerino o en casa.
- Preparando el orden y los ajustes de cada canción.
- Calculando si el set entra en el tiempo asignado.

---

### 3. Modo Show (Presentación en vivo)

**Propósito:** Ejecutar el set frente a una audiencia. **Nada puede salir mal ni distraer.**

**Comportamiento:**
- **Botones bloqueados:** no se puede salir de la vista Show a menos que se detenga el modo.
- **Interfaz limpia:** sin distracciones, sin menús, solo los controles esenciales.
- **Cronómetro activo:** muestra cuánto tiempo lleva el show desde que arrancó.
- **QuouList activa:** el músico puede agregar canciones a la cola sobre la marcha.
- **Contador de tiempo proyectado:** muestra "tiempo actual + tiempo de canciones en cola".
- **Sin notificaciones:** el modo Show bloquea notificaciones del sistema.
- **Transiciones automáticas:** los fades configurados en Edit se ejecutan solos.
- **Brillo de pantalla fijo:** no se atenúa la pantalla durante el show.

**Lo que NO se puede hacer en modo Show:**
- Agregar canciones nuevas a la librería.
- Editar ajustes de tono/tempo de una canción. Al agregar una canción a la QuouList durante el Show, esa canción usa el tono/tempo previamente guardado. NO se puede ajustar tono/tempo en vivo — Show está bloqueado para edición.
- Cambiar el orden del set.
- Abrir la librería.
- Salir de la app sin confirmar "¿Terminar show?".

**¿Cuándo se usa?**
- En el escenario durante una presentación.
- En un ensayo general donde se simula el show en vivo.

---

## Diagrama de flujo entre modos

```text
                         +-----------+
                         |  ESCUCHA  |
                         +-----+-----+
                               |
                     +---------+---------+
                     |                   |
               +-----v-----+     +------v------+
               |   EDIT    |     |   SHOW      |
               | (preparar) |     | (ejecutar)  |
               +-----+-----+     +------+------+
                     |                   |
                     +---------+---------+
                               |
                         +-----v-----+
                         |  ESCUCHA  |
                         +-----------+
```

- Desde Escucha se puede ir a Edit o a Show.
- Desde Edit se vuelve a Escucha.
- Desde Edit se puede lanzar Show (el set está listo).
- Desde Show se vuelve a Escucha (show terminó).
- **No se puede ir de Show a Edit directamente.** Hay que cerrar el show primero.

---

## Política de interrupciones por modo

El comportamiento ante una interrupción del sistema (llamada entrante, alarma, notificación de audio) depende del modo activo en ese momento:

| Modo | Interrupción transitoria (llamada corta, alarma) | Desconexión de salida de audio (cable / Bluetooth) |
|------|--------------------------------------------------|-----------------------------------------------------|
| Escucha | Pausa y **reanuda automáticamente** al terminar la interrupción | Pausa inmediata |
| Edit | Pausa y **reanuda automáticamente** al terminar la interrupción | Pausa inmediata |
| Show | Pausa y **queda pausado** esperando orden manual del músico (sin sorpresas en vivo) | Pausa inmediata |

> **Razón del comportamiento Show:** en un escenario, una reanudación automática inesperada puede ser catastrófica. El músico recupera el control y decide cuándo reanudar.

La gestión de bajo nivel de estas interrupciones (detección de eventos del sistema operativo, pausa/reanudación del motor) la ejecuta [[15-sesion-audio]], que devuelve la política al modelo de sesión para que éste la aplique según el modo.

---

## Cronómetros de sesión

### Cronómetro de Sesión
- Cuenta el tiempo total que el usuario lleva usando la app desde que la abrió.
- Es volátil: se reinicia al cerrar la app. No se persiste en la base de datos.
- El **tiempo total acumulado** (el que muestra el Perfil, ej. "124 horas") es un dato separado, persistido en la DB, que se incrementa al cerrar la sesión. Son dos métricas distintas: la sesión actual (volátil) y el histórico total (persistido).
- No se muestra a menos que el usuario lo active.

### Cronómetro de Show
- Arranca cuando se inicia el modo Show.
- Se muestra SIEMPRE en grande durante el show.
- Muestra: `[tiempo transcurrido] + [tiempo de cola] = [tiempo total estimado]`
- Ejemplo: Llevás 32 minutos de show, agregaste 3 canciones que suman 12 minutos → ves "32:00 + 12:00 = 44:00".

### Cronómetro de Set (en Edit)
- Muestra la duración total de las canciones del set.
- Es informativo, no corre en tiempo real.
- Ayuda al músico a saber si su set entra en el tiempo asignado (ej: "30 min de show, tu set dura 28 min ✅").

---

## Persistencia de la sesión

| Modo | ¿Se guarda al cerrar? | ¿Se restaura al abrir? |
|------|----------------------|----------------------|
| Escucha | No (vuelve al inicio) | No |
| Edit | El set sí, el modo no | No (abre en Escucha) |
| Show | No (es en vivo) | No |
