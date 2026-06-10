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

### Diagrama de flujo

```text
        ┌──────────────────┐
        │  EVENTO RED      │
        │  online/offline  │
        └────────┬─────────┘
                 │
                 ▼
          ┌──────────────┐
          │  ¿ESTADO     │
          │  ONLINE?     │
          └──────┬───────┘
                 │
           ┌─────┴─────┐
           │           │
        [SÍ]▼           ▼[NO]
       ┌────────┐ ┌──────────────┐
       │ ¿COLA  │ │ ENCOLAR      │
       │ LOCAL  │ │ MUTACIONES   │
       │ VACÍA? │ │ LOCALES      │
       └───┬────┘ └──────────────┘
           │
      ┌────┴────┐
      │         │
   [SÍ]▼         ▼[NO]
  ┌────────┐ ┌──────────────┐
  │ SINCR. │ │ AUTENTICAR   │
  │ AL DÍA │ │ + ENVIAR     │
  │ (idle) │ │ MUTACIONES   │
  └────────┘ └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │ DESCARGAR    │
             │ MUTACIONES   │
             │ REMOTAS      │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │ ¿HAY        │
             │ CONFLICTOS? │
             └──────┬───────┘
                    │
              ┌─────┴─────┐
              │           │
           [SÍ]▼           ▼[NO]
          ┌────────┐ ┌──────────────┐
          │ APLICAR│ │ ACTUALIZAR   │
          │ LWW    │ │ DB LOCAL     │
          │ c/conf.│ │ LIMPIAR COLA │
          └───┬────┘ └──────┬───────┘
              │             │
              └──────┬──────┘
                     ▼
          ┌──────────────────────┐
          │ REPORTAR             │
          │ ESTADO A             │
          │ [[06-vista-perfil]]  │
          └──────────────────────┘
```

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

---

## Estrategia

### Algoritmo propuesto
LWW (Last-Write-Wins) con timestamp del servidor como autoridad. Cada documento tiene `updated_at` (servidor) y si hay conflicto, gana el servidor. Para colecciones (playlists): merge de arrays por ID único, no reemplazo completo.

### Fork técnico / Alternativas
- **Opción A (LWW):** Simple, suficiente para MVP. Resolución por timestamp. Riesgo de pérdida de cambios simultáneos, aceptable para uso individual.
- **Opción B (CRDT):** Conflict-Free Replicated Data Type. Complejo, requiere estructura de datos específica (ej. RGA para listas). Necesario para jam session multi-dispositivo donde varios usuarios modifican el mismo estado concurrentemente.

### Decisión
LWW para MVP (1 dispositivo por cuenta). CRDT diferido para Fase 2, cuando [[17-jam-session]] requiera edición colaborativa en tiempo real.

### Dependencias técnicas
- Cada registro necesita: `id` (UUID), `updated_at` (ISO8601, timezone UTC), `deleted` (boolean, soft delete)
- Colecciones: merge por `id` con last-write-wins por campo individual
- Cola de mutaciones locales: tabla `cola_sincronizacion` con operación, payload, timestamp

---

## Interacción

**Tipo:** toggle (sync automático ON/OFF) + button (sync manual: «Sincronizar ahora») + badge (estado de conexión) + progress-bar (progreso de sync)

**Estados y transiciones:**
- ONLINE → [red ok] → Conectado
- OFFLINE → [red perdida] → Desconectado
- Conectado + auto-sync ON → [mutación local] → Sincronizando
- Sincronizando → [ok] → Sincronizado
- Sincronizando → [error de red] → Error de red
- Sincronizando → [sesión expirada] → Error de autenticación
- Sincronizado → [sin cambios] → Al día (idle)
- Cualquiera → [tap «Sincronizar ahora»] → Sincronizando (forzado)
- Error → [recuperar red] → Sincronizando (automático)
- Error → [toggle OFF/ON] → reintento

**Comportamiento por estado:**
- **Conectado:** Indicador verde «🟢 En línea». Sync automático activo.
- **Desconectado:** Indicador gris «⚫ Sin conexión». Los cambios se encolan localmente.
- **Sincronizando:** Barra de progreso indeterminada + texto «Sincronizando…».
- **Sincronizado:** Badge verde «✅ Sincronizado» + timestamp última sync.
- **Al día:** Badge «💤 Al día» sin necesidad de sync.
- **Error de red:** Badge rojo «🔴 Error de red». Botón «Reintentar».
- **Error de autenticación:** Badge naranja «🟠 Sesión expirada». Botón «Iniciar sesión».

---

## Guía de Estilos CSS

**.ui-sync-status-bar**
- display: flex; align-items: center; justify-content: space-between; padding: 8px 16px
- border-radius: 8px; font-size: 13px
- .theme-dark: background: rgba(255,255,255,0.03)
- .theme-light: background: rgba(0,0,0,0.02)

**.ui-sync-badge**
- display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 10px; font-size: 12px

**.ui-sync-badge--online**
- .theme-dark: background: rgba(76,175,80,0.15); color: #4CAF50
- .theme-light: background: rgba(76,175,80,0.1); color: #2E7D32

**.ui-sync-badge--offline**
- .theme-dark: background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4)
- .theme-light: background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.4)

**.ui-sync-badge--syncing**
- .theme-dark: background: rgba(33,150,243,0.15); color: #2196F3
- .theme-light: background: rgba(33,150,243,0.1); color: #1565C0

**.ui-sync-badge--synced**
- .theme-dark: background: rgba(76,175,80,0.15); color: #4CAF50
- .theme-light: background: rgba(76,175,80,0.1); color: #2E7D32

**.ui-sync-badge--error**
- .theme-dark: background: rgba(244,67,54,0.15); color: #F44336
- .theme-light: background: rgba(244,67,54,0.1); color: #C62828

**.ui-sync-badge--auth-error**
- .theme-dark: background: rgba(255,152,0,0.15); color: #FF9800
- .theme-light: background: rgba(255,152,0,0.1); color: #E65100

**.ui-sync-timestamp**
- font-size: 11px
- .theme-dark: color: rgba(255,255,255,0.3)
- .theme-light: color: rgba(0,0,0,0.3)

**.ui-sync-btn**
- padding: 6px 14px; border-radius: 8px; font-size: 12px; cursor: pointer; border: none
- .theme-dark: background: rgba(255,255,255,0.08); color: #fff
- .theme-light: background: rgba(0,0,0,0.04); color: #333
- &:hover: background: #FF9800; color: #fff
- &:active: transform: scale(0.97)
- &:disabled: opacity: 0.4; cursor: not-allowed

**.ui-sync-toggle**
- appearance: switch; cursor: pointer; font-size: 12px
- .theme-dark: accent-color: #4CAF50; .theme-light: accent-color: #388E3C

**.ui-sync-progress**
- width: 100%; height: 3px; border-radius: 2px
- .theme-dark: background: rgba(255,255,255,0.08)
- .theme-light: background: rgba(0,0,0,0.05)
- &::-webkit-progress-value: background: #2196F3; border-radius: 2px
