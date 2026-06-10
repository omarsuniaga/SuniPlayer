---
ruta: docs/componentes/14-sync-engine.md
tipo: componente
origen: "[[06-modelo-backup-sync]]"
estado: estable
---

# Motor de Sincronización (Sync Engine)

## Función

Ejecutar las tareas de respaldo, descarga y mezcla de datos estructurados entre la base de datos local y la base de datos externa en la nube; gestionar el estado de conexión a internet; y resolver colisiones lógicas.

## Entrada

- Contrato de sincronización y políticas de colisión ← [[06-modelo-backup-sync]]
- Datos estructurados de la base de datos local ← [[04-almacenamiento]]
- Señal de sincronización manual o cambio de interruptor ← [[06-vista-perfil]]

## Proceso

1. **Monitoreo de Red:** Escucha eventos del navegador (`navigator.onLine`) para alternar entre estados `ONLINE` y `OFFLINE`.
2. **Cola de Mutaciones Locales:**
   - Si está sin conexión, cada inserción, modificación o borrado se encola en una tabla local de transacciones pendientes (`cola_sincronizacion`).
3. **Flujo de Sincronización (al recuperar red o forzar manual):**
   - Autentica la sesión del usuario con el servicio en la nube.
   - Envía la lista de mutaciones locales pendientes.
   - Descarga las mutaciones remotas generadas desde la última fecha de sincronización.
   - Aplica el algoritmo de resolución de conflictos (Last-Write-Wins) a nivel de campo.
   - Actualiza la base de datos local en [[04-almacenamiento]] y limpia la cola de transacciones locales.
4. **Estado de Sincronización:** Reporta el progreso (Sincronizando, Sincronizado, Error de red) a la vista de perfil.

## Salida

- Escribe y lee registros estructurados → base de datos externa (físico)
- Envía el estado actual del proceso y última fecha de éxito → [[06-vista-perfil]]
- Provee túnel de transporte de señalización de baja latencia → [[17-jam-session]]

## Errores

- **Lógico:** la sesión del usuario expira o las credenciales son revocadas en medio de la transmisión.
  - *Resolución:* Detiene la transferencia, mantiene los cambios locales en la cola de sincronización, marca el estado como `SESIÓN_EXPIRADA` en [[06-vista-perfil]] y solicita reautenticación al usuario.
- **Semántico:** error de colisión irresoluble de datos (datos estructurados malformados en base externa).
  - *Resolución:* Rechaza la mezcla remota, conserva los datos locales intactos y registra la excepción en el log local.

Catálogo global: [[07-modelo-errores]]
