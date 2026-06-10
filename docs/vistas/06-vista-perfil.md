---
ruta: docs/vistas/06-vista-perfil.md
tipo: vista
origen: "[[01-vista-inicio]]"
estado: estable
---

# Vista Perfil

## Función

Proveer la pantalla de configuración global del usuario; mostrar estadísticas de uso local y telemetría de presentaciones; configurar las preferencias de tema y sonido; configurar el mapeo de pedales físicos Bluetooth; e inicializar el backup/sync opcional en la nube.

## Entrada

- Estadísticas locales agregadas y registros de uso ← [[05-telemetria]]
- Datos acumulados e historial de shows completados ← [[12-cronometro]]
- Estado actual de la sincronización y backup externo ← [[14-sync-engine]]
- Parámetros y opciones del modelo de backup ← [[06-modelo-backup-sync]]
- Preferencia y selector de tema visual activo ← [[13-tema]]
- Footer persistente de reproducción ← [[19-minireproductor]]

## Proceso

1. **Configuración de Apariencia (Tema):** Permite cambiar entre temas Claro, Oscuro y Seguir sistema delegando la acción en [[13-tema]].
2. **Configuración de Audio y Show:** Ajusta el volumen por defecto y las políticas de brillo/Wake Lock del Modo Show.
3. **Mapeo de Pedalera Bluetooth (Físico):**
   - Provee una interfaz para emparejar y vincular pedales físicos BT.
   - Permite asociar comandos lógicos de una lista por cada pedal físico detectado (típicamente Pedal 1 y Pedal 2):
     - Comandos disponibles: `Siguiente canción`, `Canción anterior`, `Play/Pausa`, `Mute de Pánico`, `Pasar página partitura`, `Retroceder página partitura`, `Crear Marcador Rápido`.
   - Envía esta matriz de mapeo a [[15-sesion-audio]] para su ejecución en segundo plano.
4. **Almacenamiento y Backup/Sync:**
   - Muestra el tamaño de cache de audio de [[04-almacenamiento]] y permite limpiarlo.
   - Provee el panel para activar el backup/sync opcional en la nube, detallando la cuenta del usuario, estado de red y el gatillo de sincronización manual de [[14-sync-engine]].
5. **Estadísticas (Telemetría Local):** Renderiza en formato de tarjetas de alto contraste las horas totales escuchadas, shows realizados, feature más usado y canciones más sonadas, sin revelar nombres de archivos en exportaciones externas.

## Salida

- Actualización de variables de tema visual → [[13-tema]]
- Órdenes de inicio, autenticación y subida de datos del backup → [[14-sync-engine]]
- Persistencia de preferencias de usuario → [[04-almacenamiento]]
- Mapeo de botones físicos/pedales Bluetooth configurados → [[15-sesion-audio]]
- Evento de navegación entre vistas → [[19-minireproductor]]

## Errores

- **Lógico:** el motor de base de datos no está disponible al intentar guardar una preferencia.
  - *Resolución:* Muestra una alerta temporal de error y mantiene las preferencias en memoria volátil de sesión.
- **Semántico:** asignar el mismo comando físico a dos pedales distintos.
  - *Resolución:* La UI valida la colisión, muestra una advertencia en color naranja e impide guardar la configuración hasta que se resuelva la asignación duplicada.

Catálogo global: [[07-modelo-errores]]

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ← Volver                  ⚙️  CONFIGURACIÓN                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ─── TEMA ─────────────────────────────────────────────────── │
│  [🌙 Oscuro]  [☀️ Claro]  [🔄 Seguir sistema]               │
│                                                              │
│  ─── SONIDO ───────────────────────────────────────────────── │
│  Volumen global: [0%] ────────●════════════════════ [100%] 75% │
│                                                              │
│  ─── PEDALERA BLUETOOTH (Mapeo) ───────────────────────────── │
│  [🔄 Sincronizar nueva pedalera BT]                          │
│  · Pedal A ➔ [ Pasar página partitura  ▼ ]                   │
│  · Pedal B ➔ [ Mute de Pánico          ▼ ]                   │
│                                                              │
│  ─── RESPALDO Y SYNC (Opcional) ───────────────────────────── │
│  [✓] Activar backup en la nube                               │
│  Estado: Sincronizado (10/06 12:00) | [🔄 Sincronizar Ahora] │
│                                                              │
│  ─── ALMACENAMIENTO ───────────────────────────────────────── │
│  💾  Espacio usado: 234 MB | 📦  Cacheadas: 12 de 47          │
│  [🧹 Limpiar cache]                                          │
│                                                              │
│  ─── ESTADÍSTICAS ─────────────────────────────────────────── │
│  ⏱  Escuchado: 124h 32m      | 🎤  Shows realizados: 8       │
│  🕐  Tiempo en shows: 18h 45m | 🔥  Más usado: Tono (34x)     │
│  [📤 Exportar estadísticas anónimas]                         │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
└──────────────────────────────────────────────────────────────┘

---

## Interacción

### Tipo
segmented-control (tema: dark/light/system) + slider (volumen global) + dropdown (pedal mapping) + toggle (backup) + button (sync, clear cache, export stats)

### Estados del componente
- `.theme-selector` — selector de tema visual
- `.segmented-control` — control segmentado de 3 opciones
- `.slider-volumen` — slider de volumen global
- `.pedal-mapping-row` — fila de mapeo de pedal Bluetooth
- `.dropdown-comando` — dropdown de selección de comando para pedal
- `.toggle-switch` — interruptor de activación/desactivación

### Transiciones
- De idle a activo: el usuario modifica cualquier configuración
- De activo a idle: la configuración se persiste automáticamente

---

## Guía de Estilos CSS

### Contenedor principal
- `.vista-perfil` — layout base de configuración

### Selector de tema
- `.theme-selector` — contenedor del selector de tema
- `.segmented-control` — control segmentado (🌙 Oscuro / ☀️ Claro / 🔄 Sistema)
- `.segmented-control .active` — opción seleccionada

### Slider de volumen
- `.slider-volumen` — control deslizante de volumen global
- `.slider-volumen:focus` — foco resaltado

### Mapeo de pedalera
- `.pedal-mapping-row` — fila de asignación de pedal
- `.dropdown-comando` — dropdown de selección de comando
- `.dropdown-comando:focus` — foco resaltado

### Interruptor toggle
- `.toggle-switch` — interruptor de backup/activación
- `.toggle-switch.active` — activado

### Botones de acción
- `.btn-sync` — botón de sincronización manual
- `.btn-clear-cache` — botón de limpieza de caché
- `.btn-export` — botón de exportar estadísticas

### Estados de contenido
- `.view-empty` — sin datos de estadísticas
- `.view-loading` — cargando configuración

### Temas
- `.theme-dark` — overrides para modo oscuro
- `.theme-light` — overrides para modo claro

---

## Modal Spec

### Modal: Limpiar caché de audio

- **Trigger:** tap en botón "🧹 Limpiar cache" en la sección ALMACENAMIENTO
- **Título:** "Limpiar caché de audio"
- **Cuerpo:**
  - Texto descriptivo: "Se eliminarán los archivos de audio descargados para uso offline. Los tracks en tu librería no se borrarán."
  - Indicador de tamaño actual: "Espacio ocupado por caché: **234 MB** (12 archivos cacheados)"
  - Nota: el tamaño se lee en tiempo real desde [[04-almacenamiento]] al abrir el modal.
- **Botones:**
  - `Cancelar` — cierra el modal sin realizar cambios; foco vuelve al botón de apertura.
  - `Limpiar` — color rojo destructivo (`.btn-destructive`); requiere un solo tap para confirmar.
- **Al confirmar (tap en "Limpiar"):**
  1. Llama a [[04-almacenamiento]] para vaciar el caché de audio offline.
  2. Muestra un spinner de carga mientras la operación se completa.
  3. Al terminar, cierra el modal y actualiza el indicador de almacenamiento en la vista: "Espacio usado: 0 MB | Cacheadas: 0 de 47".
  4. Muestra un toast de confirmación: "Caché de audio eliminado correctamente."
- **Valores recolectados:** ninguno (acción destructiva sin parámetros adicionales)
