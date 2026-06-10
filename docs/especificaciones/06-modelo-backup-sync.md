---
ruta: docs/especificaciones/06-modelo-backup-sync.md
tipo: especificacion
origen: "[[00-vision-general]]"
estado: estable
---

# Modelo de Respaldo y Sincronización (Backup/Sync)

## Función

Definir la política de sincronización remota y respaldo en la nube de la base de datos local de Suniplayer; determinar qué elementos se respaldan; y establecer las reglas lógicas para la resolución de conflictos sin conexión y protección de privacidad.

## Entrada

- Principios de privacidad y offline-first ← [[00-vision-general]]
- Datos estructurados de usuario (canciones, marcadores, playlists, historial) ← [[04-almacenamiento]]

## Proceso

1. **Estructura Opcional (Opt-In):** La sincronización es 100% opt-in. Si el usuario no inicia sesión, todo opera exclusivamente local en IndexedDB.
2. **Elementos Sincronizados:**
   - Metadatos y configuraciones de canciones (nombres, volumen, tono, tempo, marcas in/out).
   - Estructura de Playlists y Sets.
   - Marcadores y comentarios.
   - Historial de shows completados y estadísticas.
   - *NO se sincronizan archivos binarios de audio (.mp3, .wav, etc.) por razones de derechos de autor y ancho de banda.*
3. **Resolución de Conflictos Offline:**
   - La sincronización utiliza marcas de tiempo de modificación (`ultima_modificacion`).
   - Regla general: "Última escritura gana" (Last-Write-Wins) a nivel de campo para combinar registros.
   - Si una playlist se borró localmente pero se modificó remotamente, se prioriza el borrado.
4. **Política de Privacidad:** Toda la transferencia de metadatos se cifra de extremo a extremo y es anónima.

## Salida

- Contrato de comunicación y sincronización → [[14-sync-engine]]
- Opciones de configuración de cuenta y estado → [[06-vista-perfil]]
- Mecanismo de señalización para multi-dispositivo → [[08-modelo-jam-session]]

## Errores

- **Lógico:** el cliente intenta sincronizar datos sin haber iniciado sesión — el motor bloquea la sincronización remota y opera en local.
- **Semántico:** se detectan marcas de tiempo locales del sistema en el futuro (desfase de reloj del cliente) — el motor ignora las marcas del cliente y utiliza el tiempo del servidor para ordenar los cambios.

Catálogo global: [[07-modelo-errores]]

---

## Diagrama Entidad-Relación (Sync)

El modelo de sincronización extiende el modelo de [[04-almacenamiento]] agregando metadatos de sincronización a las tablas existentes y una tabla de cola de operaciones.

```text
┌──────────────────────────────────────────────────────────────────┐
│              DIAGRAMA ER — RESPALDO Y SINCRONIZACIÓN             │
│              Capa optativa sobre la base local                   │
└──────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────┐
  │        TABLAS LOCALES (desde 04-almacenamiento)│
  │                                              │
  │  Cada tabla local tiene:                     │
  │  • id (PK)                                   │
  │  • updated_at (timestamp UTC)                │
  │  • deleted (boolean, soft-delete)            │
  │                                              │
  │  Se sincronizan: canciones, marcadores,      │
  │  playlists, playlist_canciones,              │
  │  historial_shows, configuracion              │
  └─────────────────────┬────────────────────────┘
                        │
                        │ cada mutación local
                        ▼
  ┌──────────────────────────────────────────────┐
  │        COLA DE SINCRONIZACIÓN                 │
  │  ───────────────────────────────────────────  │
  │  id (PK): string                              │
  │  tabla_afectada: string                       │
  │  registro_id: string                          │
  │  operacion: "insert" | "update" | "delete"    │
  │  payload: JSON (snapshot del registro)        │
  │  creado_en: timestamp (local)                 │
  │  estado: "pendiente"|"enviado"|"confirmado"   │
  └─────────────────────┬────────────────────────┘
                        │
                        │ al recuperar red / sync manual
                        ▼
  ┌──────────────────────────────────────────────┐
  │        CONFLICTOS (resolución LWW)            │
  │  ───────────────────────────────────────────  │
  │                                              │
  │  1. Comparar updated_at local vs remoto      │
  │  2. Si local > remoto: ganan datos locales   │
  │  3. Si remoto > local: ganan datos remotos   │
  │  4. Si igual: gana servidor (autoridad)      │
  │  5. Soft-delete siempre gana sobre modificar │
  │                                              │
  └──────────────────────────────────────────────┘
```

**Nuevos campos en tablas locales (sync-ready):**
- `updated_at` — timestamp ISO8601 en UTC, se actualiza en cada escritura
- `deleted` — booleano, soft-delete para detectar borrados en sync

**Tabla nueva: `cola_sincronizacion`**
- Registra cada mutación local cuando el dispositivo está offline
- Al recuperar conexión, [[14-sync-engine]] drena la cola en orden
- Una vez confirmado por el servidor, el registro pasa a `estado: confirmado`
- Periódicamente se limpian los registros confirmados >30 días
