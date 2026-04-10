# SyncEnsemble Technical Documentation

Este documento detalla el funcionamiento del motor de sincronía de alta precisión de SuniPlayer.

## 1. El Protocolo de Sincronía (NTP-like)

Utilizamos un algoritmo inspirado en NTP para calcular el offset entre el **Reloj del Líder** y el **Reloj Local**.

### Proceso de Calibración:
1. El Seguidor envía un `CLOCK_PING` con su timestamp local `T1`.
2. El Líder recibe en `T2` y responde con `CLOCK_PONG` en `T3` (incluyendo `T1` y `T2`).
3. El Seguidor recibe en `T4`.
4. **Cálculos**:
   - `RTT = (T4 - T1) - (T3 - T2)`
   - `Offset = ((T2 - T1) + (T3 - T4)) / 2`

### Filtrado de Calidad:
- **Median Filter**: Se toman las últimas 10 muestras y se descarta el 20% con mayor RTT.
- **EMA (Exponential Moving Average)**: Se aplica un suavizado ($\alpha=0.3$) para evitar saltos bruscos en el offset.

## 2. Reproducción Sincronizada (`playAt`)

Para lograr que todos los dispositivos arranquen al mismo tiempo, utilizamos **Scheduling a Futuro**.

1. El Líder define un tiempo de inicio global: `T_target = performance.now() + 5000ms`.
2. El Líder envía un mensaje `PLAY(T_target, positionMs)`.
3. Los Seguidores reciben el mensaje y calculan su tiempo local equivalente: `T_local = T_target - Offset`.
4. Ambos dispositivos programan el arranque exacto en su motor de audio para el instante `T_local`.

## 3. Corrección de Drift Activa

Durante la reproducción, el Líder envía un `POSITION_REPORT` cada 5 segundos.
- Si la diferencia es de **5ms a 150ms**: Se ajusta el `playbackRate` en $\pm0.1\%$ (suave).
- Si la diferencia es **> 150ms**: Se realiza un `seek` forzado (salto).

## 4. Infraestructura Serverless (Firebase)

Para permitir el descubrimiento de pares sin servidores persistentes:
- **Colección `rooms`**: Almacena los códigos de sala (insensibles a mayúsculas).
- **Subcolección `members`**: Registro de presencia.
- **Subcolección `signals`**: Canal de señalización WebRTC. Los mensajes se eliminan inmediatamente después de ser procesados para minimizar el almacenamiento.

## 5. Glosario de Estados
- `UNCALIBRATED`: Estado inicial.
- `CALIBRATING`: Juntando muestras NTP.
- `SYNCED`: Offset estable (StdDev < 2ms).
- `DRIFTING`: Desfase detectado en tiempo real.
