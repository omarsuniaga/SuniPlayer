---
ruta: docs/especificaciones/07-modelo-errores.md
tipo: especificacion
origen: "[[00-vision-general]]"
estado: estable
---

# Modelo Global de Errores

## Función

Catalogar y clasificar todos los fallos lógicos, semánticos y de sistema de Suniplayer V2; proveer una estrategia de contención y notificación; y servir de índice para las secciones de Errores de todos los componentes.

## Entrada

- Secciones de errores de componentes y vistas (ver índice interno)

## Proceso

El sistema clasifica las excepciones y fallos del sistema en tres niveles de severidad para mitigar riesgos en vivo:
1. **Críticos (Bloqueantes en Show):**
   - Fallos de decodificación en vivo, corrupción de almacenamiento.
   - *Acción:* Activación de silencio de pánico, salto rápido a pista siguiente, y visualización de modal anti-pánico.
2. **Advertencias (Edit y Preparación):**
   - Ajustes de tono fuera de rango, colisiones de pedales Bluetooth, sets que exceden la duración.
   - *Acción:* Alertas visuales no obstructivas (banners de alto contraste), limitación física en sliders.
3. **Informativos/Recuperables:**
   - Fallos temporales de red para backup, logs locales de telemetría llenos.
   - *Acción:* Reintento silencioso en background.

## Salida

- Mapa de errores para navegación e INDEX → [[INDEX]]

## Errores

- **Lógico:** el gestor de excepciones no puede escribir en el log local — reporta por consola y continúa operando en memoria.
- **Semántico:** un componente reporta un ID de error inexistente — el gestor lo cataloga como `ERROR_DESCONOCIDO` de severidad crítica.

---

## Catálogo de Excepciones del Sistema

### 1. Archivo y Decodificación (Severidad: Crítica)
- **FILE_NOT_FOUND (Lógico):** Archivo de audio inaccesible en disco.
- **DECODE_FAILED (Lógico):** Buffer de audio corrupto o códec incompatible.
- *Resolución:* Salta al siguiente de la cola; en Modo Show, detiene la reproducción y previene distorsión.

### 2. Parámetros de Procesamiento (Severidad: Advertencia)
- **PITCH_OUT_OF_RANGE (Lógico):** Ajuste de tono mayor a +12 o menor a -12.
- **TEMPO_OUT_OF_RANGE (Lógico):** Ajuste de velocidad fuera del rango 50%-200%.
- *Resolución:* Acota el valor en los límites y notifica en pantalla.

### 3. Sincronización y Pedales (Severidad: Informativa/Advertencia)
- **PEDAL_DISCONNECTED (Sistema):** Pedalera BT pierde comunicación.
- **SYNC_CONFLICT_TIME (Semántico):** Reloj local en el futuro para backup.
- *Resolución:* Ignora comandos fantasmas del pedal; usa reloj del servidor para orden de sincronización.
