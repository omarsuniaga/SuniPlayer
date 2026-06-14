---
ruta: docs/especificaciones/08-modelo-jam-session.md
tipo: especificacion
origen: "[[00-vision-general]]"
estado: borrador
---

# Modelo Jam Session (Multi-Dispositivo)

> ⚠️ **FASE 2 — borrador.** Esta especificación define características de la Fase 2 (sincronización multi-dispositivo) y no bloquea el desarrollo del MVP de la Fase 1.

## Función

Definir las políticas de comunicación, roles y sincronización para la reproducción simultánea de audio en múltiples dispositivos conectados a una red local; establecer el control de cola compartida; y coordinar el préstamo efímero de buffers de audio.

## Entrada

- Principio de compartir música entre músicos ← [[00-vision-general]]
- Colecciones y cola de reproducción de la QuouList ← [[02-modelo-colecciones]]
- Capa de señalización y descubrimiento ← [[06-modelo-backup-sync]]

## Proceso

1. **Roles del Sistema:**
   - **Anfitrión (Host):** Única fuente de verdad de reproducción (Play, Pausa, Seek) y dueño de la QuouList activa.
   - **Invitados (Guests):** Se sincronizan al reloj de reproducción del Anfitrión. Pueden sugerir canciones para agregar a la QuouList compartida.
2. **Conexión y Descubrimiento:**
   - El Anfitrión genera un código de sala alfanumérico y un código QR.
   - Los Invitados escanean el QR para establecer conexión directa vía WebRTC en LAN (con fallback en WebSocket usando el sync-engine de backup).
3. **Préstamo Efímero de Audio:**
   - Si un Invitado no posee el archivo físico que el Anfitrión va a reproducir, el Anfitrión transmite el buffer de audio de forma fragmentada a través de canales de datos WebRTC.
   - *Regla de Seguridad:* Los buffers prestados se guardan en la memoria volátil del Invitado y se eliminan automáticamente al finalizar la reproducción o cerrar la sala, protegiendo los derechos de autor de los archivos.

## Salida

- Contrato de ejecución de la sesión en red → [[17-jam-session]]

## Errores

- **Lógico:** el Anfitrión abandona repentinamente la sala.
  - *Resolución:* La sesión se interrumpe, los Invitados limpian los buffers temporales de su memoria volátil y vuelven a Modo Escucha local.
- **Semántico:** un Invitado intenta enviar comandos de control de reproducción (`play`/`pause`) a la sala.
  - *Resolución:* El protocolo de red del Anfitrión ignora estos comandos y responde con un código de denegación de privilegios.

Catálogo global: [[07-modelo-errores]]
