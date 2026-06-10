---
ruta: docs/componentes/17-jam-session.md
tipo: componente
origen: "[[08-modelo-jam-session]]"
estado: borrador
---

# Transmisor Jam Session (Jam Session Sync)

> ⚠️ **FASE 2 — borrador.** Esta especificación define características de la Fase 2 (sincronización de red) y no bloquea el desarrollo del MVP de la Fase 1.

## Función

Coordinar el transporte de datos y sincronización de red entre múltiples dispositivos en una red local; estimar desfases de reloj entre clientes estilo NTP; y calcular el instante exacto de disparo del motor de audio (compensación de latencia).

## Entrada

- Contrato de la sesión de red y roles ← [[08-modelo-jam-session]]
- Estado de reproducción local y ticks de reloj ← [[01-audio-engine]]
- Canal de datos WebRTC o túnel de señalización ← [[14-sync-engine]]

## Proceso

1. **Establecimiento de Conexiones:** Abre canales de datos WebRTC (`RTCDataChannel`) directamente con los Invitados en la red local.
2. **Sincronización de Relojes (Estilo NTP):**
   - El Anfitrión e Invitados intercambian mensajes de ping-pong de tiempo para medir el tiempo de viaje de ida y vuelta (RTT) y calcular el desfase del reloj del sistema.
   - Corrige el reloj lógico de los Invitados con precisión de milisegundos.
3. **Arranque Programado con Compensación de Latencia:**
   - En lugar de enviar un comando "Reproducir Ahora" (que causaría desfases debido al lag de red), el Anfitrión envía: "Reproducir en el instante absoluto Unix T (ej: `1718042405300`)".
   - Cada dispositivo programa el arranque de [[01-audio-engine]] para ese instante exacto.
   - Aplica una compensación por la latencia de salida de hardware estimada de cada dispositivo (~10-20ms).
4. **Tránsito de Audio (Precarga):** Transmite bloques binarios cifrados del track actual hacia la memoria volátil del Invitado antes de que deban sonar en la QuouList.

## Salida

- Comandos programados de arranque en instante T (`playAt()`) → [[01-audio-engine]]

## Errores

- **Lógico (Lag Excesivo):** el RTT de la red local supera los 150ms — el componente reporta error de sincronía e interrumpe la reproducción en el Invitado afectado para evitar cacofonía.
- **Semántico:** un cliente Invitado intenta iniciar reproducción sin haber recibido el buffer de audio completo de precarga — se suspende el disparo y se reporta error de carga.

Catálogo global: [[07-modelo-errores]]
