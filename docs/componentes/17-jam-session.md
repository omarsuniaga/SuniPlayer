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

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  ANFITRIÓN       │
  │  INICIA SESIÓN   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ABRIR CANALES   │
  │  WebRTC a cada   │
  │  INVITADO        │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  INTERCAMBIO NTP │
  │  ping/pong para  │
  │  medir RTT       │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ¿RTT < 150ms?   │
  └──────┬───────────┘
         │
    ┌────┴────┐
    │         │
 [SÍ]▼         ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ CALCULAR│ │ REPORTAR     │
 │ DESFASE│ │ ERROR LAG    │
 │ RELOJ  │ │ EXCESIVO     │
 │ lógico │ │ INTERRUMPIR  │
 └───┬────┘ │ EN INVITADO  │
     │      └──────────────┘
     ▼
 ┌──────────────┐
 │ PRECARGAR    │
 │ BUFFER DE    │
 │ AUDIO A      │
 │ INVITADOS    │
 └──────┬───────┘
        │
        ▼
 ┌──────────────┐
 │ ¿BUFFER      │
 │ COMPLETO?    │
 └──────┬───────┘
        │
   ┌────┴────┐
   │         │
 [SÍ]▼         ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ ENVIAR │ │ ESPERAR      │
 │ playAt │ │ CARGA        │
 │ (T     │ │ SUSPENDER    │
 │ unix)  │ │ DISPARO      │
 │ + comp.│ └──────────────┘
 │ latencia│
 └───┬────┘
     │
     ▼
 ┌──────────────┐
 │ CADA         │
 │ DISPOSITIVO  │
 │ REPRODUCE EN │
 │ INSTANTE T   │
 └──────────────┘
```

## Salida

- Comandos programados de arranque en instante T (`playAt()`) → [[01-audio-engine]]

## Errores

- **Lógico (Lag Excesivo):** el RTT de la red local supera los 150ms
  - *Resolución:* el componente reporta error de sincronía e interrumpe la reproducción en el Invitado afectado para evitar cacofonía.
- **Semántico:** un cliente Invitado intenta iniciar reproducción sin haber recibido el buffer de audio completo de precarga
  - *Resolución:* se suspende el disparo y se reporta error de carga.

Catálogo global: [[07-modelo-errores]]

---

## Roles

### Anfitrión (Host)
- Inicia la sesión de Jam
- Abre canales WebRTC con cada Invitado
- Ejecuta el algoritmo NTP con cada Invitado
- Envía el comando `playAt(timestamp_unix)` a todos los Invitados
- Es la fuente de verdad del estado de reproducción

### Invitado (Guest)
- Se une a una sesión existente
- Participa en el intercambio NTP
- Recibe buffer de audio de precarga
- Ejecuta `playAt()` en el instante T exacto
- Reporta su estado (buffer listo, reproducido, error)

---

## Formato de mensajes (protocolo interno)

### Ping/Pong NTP
```json
{
  "tipo": "ntp_ping" | "ntp_pong",
  "originante": "host" | "guest",
  "t1": 1718042400000,
  "t2": 1718042400010,
  "t3": 1718042400015
}
```
- `t1`: timestamp de envío del ping (Host)
- `t2`: timestamp de recepción del ping (Guest)
- `t3`: timestamp de envío del pong (Guest)
- El Host calcula RTT = (ahora - t1) y desfase = (t2 + (RTT/2)) - t1

### Comando playAt
```json
{
  "tipo": "comando_playat",
  "instante_absoluto": 1718042405300,
  "cancion_id": "uuid-de-la-cancion",
  "compensacion_hardware_ms": 15,
  "timestamp_envio": 1718042405285
}
```
- `instante_absoluto`: timestamp Unix en ms para disparar reproducción
- `compensacion_hardware_ms`: latencia estimada de salida de audio del dispositivo

### Estado
```json
{
  "tipo": "reporte_estado",
  "dispositivo_id": "uuid-unico",
  "estado": "buffer_listo" | "reproduciendo" | "error",
  "timestamp_local": 1718042405310
}
```

---

## Máquina de estados de conexión

```text
┌──────────┐
│ DESCONEC.│
└────┬─────┘
     │ iniciar/unirse sesión
     ▼
┌──────────┐
│ CONECT.  │
│ (canales │
│ WebRTC   │
│ abiertos)│
└────┬─────┘
     │ NTP ping/pong exitoso (RTT < 150ms)
     ▼
┌──────────┐
│ SINCRON. │
│ (reloj   │
│ lógico   │
│ corregido)│
└────┬─────┘
     │ buffer de audio precargado
     ▼
┌──────────┐
│ LISTO    │
│ (espera  │
│ playAt)  │
└────┬─────┘
     │ recibe playAt(T)
     ▼
┌──────────┐
│ REPROD.  │
│ (audio   │
│ sincrono)│
└────┬─────┘
     │ canción termina
     ▼
┌──────────┐
│ ESPERA   │
│ (siguiente│
│ comando  │
│ o fin    │
│ sesión)  │
└──────────┘
```

### Transiciones de error
- Cualquier estado → [RTT > 150ms] → ERROR_LAG → DESCONECTADO
- Cualquier estado → [timeout > 5s sin mensaje] → ERROR_TIMEOUT → DESCONECTADO
- Cualquier estado → [buffer no disponible en precarga] → ERROR_BUFFER
- ERROR_BUFFER → [reintento] → SINCRONIZADO (reintenta precarga)
- DESCONECTADO → [reconexión manual] → CONECTADO

---

## Configuración WebRTC
- ICE servers: STUN público (google, cloudflare) + TURN opcional si hay NAT restrictivo
- Canales de datos: RTCDataChannel con protocolo UDP (ordenado, no fiable para baja latencia)
- Negociación: Offer/Answer con el Host como peers
- Codificación de datos: JSON para señalización, ArrayBuffer para chunks de audio binario

---

## Interacción

**Tipo:** panel lateral / modal con indicador de estado + botón de acción + lista de dispositivos conectados

### Estados visuales del panel Jam

| Estado UI | Qué ve el usuario | Condición de entrada | Transición siguiente |
|-----------|-------------------|----------------------|----------------------|
| **DESCONECTADO** | Icono de red inactivo (gris). Botón "Iniciar sesión Jam" (Anfitrión) o "Unirse" (Invitado). Sin lista de dispositivos. | Estado inicial o tras cierre de sesión. | Tap en "Iniciar" / "Unirse" → CONECTANDO |
| **CONECTANDO** | Spinner animado. Texto "Conectando con dispositivos...". Canales WebRTC en negociación. Botón "Cancelar". | El usuario inicia o acepta sesión; se abren canales WebRTC. | NTP exitoso (RTT < 150ms) → SINCRONIZADO / Timeout o RTT alto → ERROR |
| **SINCRONIZADO** | Icono de red activo (verde). Lista de dispositivos con latencia RTT de cada uno (ej. "Tablet B · 12ms"). Botón "Reproducir en sincronía" habilitado. Indicador de buffer: "Precargando..." → "Listo". | Todos los dispositivos superaron el intercambio NTP con RTT < 150ms y el buffer de audio está completo. | Tap en "Reproducir" → la UI informa T de arranque; al ejecutar `playAt()` mantiene SINCRONIZADO con estado de reproducción activo. Cierre de sesión → DESCONECTADO |
| **ERROR** | Banner rojo en la parte superior del panel. Descripción del error: "Latencia excesiva (> 150ms)", "Timeout de conexión" o "Buffer incompleto". Dispositivo afectado resaltado en rojo en la lista. Botón "Reintentar" (para ERROR_BUFFER) o "Reconectar" (para ERROR_LAG / ERROR_TIMEOUT). | RTT supera 150ms, timeout > 5s sin mensaje, o buffer de precarga no disponible en el invitado. | Tap en "Reintentar" / "Reconectar" → CONECTANDO. Si el error es irrecuperable → DESCONECTADO |

### Coherencia con la máquina de estados interna

Los estados visuales son un mapeo simplificado de la máquina técnica:
- `DESCONECTADO` (técnico) → panel en estado **DESCONECTADO**
- `CONECTADO` (canales WebRTC abiertos, NTP en curso) → panel en estado **CONECTANDO**
- `SINCRONIZADO` + `LISTO` + `REPRODUCIENDO` + `ESPERA` → panel en estado **SINCRONIZADO** (con sub-indicadores de buffer y reproducción activa)
- Cualquier transición de error (`ERROR_LAG`, `ERROR_TIMEOUT`, `ERROR_BUFFER`) → panel en estado **ERROR**

---

## Dependencias técnicas
- WebRTC API (RTCPeerConnection, RTCDataChannel)
- AudioContext.currentTime como reloj de alta resolución (precisión de ms)
- Chunks de audio: 4096 samples @ 44100 Hz (~93ms por chunk)
- Buffer de precarga: mínimo 2 chunks (186ms) antes de playAt
- Tamaño máximo de chunk de audio: 64KB
- Desfase máximo tolerable entre dispositivos: ±20ms para que sea imperceptible
