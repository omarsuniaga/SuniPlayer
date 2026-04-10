---
name: sync-ensemble-clock
description: >
  Implementa el protocolo de sincronización de reloj NTP-like para SyncEnsemble.
  Trigger: Al crear o modificar servicios de sincronía, intercambio de PING/PONG o cálculos de offset temporal.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use
- Al implementar el intercambio de marcas de tiempo entre dispositivos.
- Al calcular el Round-Trip Time (RTT) y el Offset del reloj.
- Al portar algoritmos de sincronía de Dart/Flutter a TypeScript.

## Critical Patterns
1. **Reloj Monótono**: NUNCA usar `Date.now()`. Usar siempre `performance.now()` para precisión sub-milisegundo.
2. **Filtro de Mediana**: Descartar el 20% de las muestras con mayor RTT (outliers) antes de calcular el offset.
3. **Calibración Periódica**: Recalibrar cada 30 segundos para compensar el "drift" térmico de los procesadores.
4. **Idempotencia**: Los comandos de tiempo deben ser absolutos (`playAt: 1723456789`), nunca relativos (`playIn: 200ms`).

## Code Example (TypeScript NTP)
```typescript
const t1 = performance.now(); // Follower envía
// ... P2P Mensaje viaja ...
const t2 = msg.leader_recv_time; // Líder recibe
const t3 = msg.leader_send_time; // Líder responde
// ... P2P Mensaje vuelve ...
const t4 = performance.now(); // Follower recibe

const rtt = (t4 - t1) - (t3 - t2);
const offset = ((t2 - t1) + (t3 - t4)) / 2;
```

## Resources
- **Documentación**: docs/SyncEnsemble_AI_Dev_Kit_v1.md
- **Contratos**: packages/core/src/network/types.ts
