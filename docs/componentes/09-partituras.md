---
ruta: docs/componentes/09-partituras.md
tipo: componente
origen: "[[02-vista-reproductor]]"
estado: estable
---

# Partituras (Sheet Music)

## Función

Cargar y renderizar archivos asociados de partitura (PDF o imágenes); administrar la lista de timestamps programados para cambio automático de página; y responder a comandos físicos de pedalera o gestos para navegación de páginas.

## Entrada

- Archivo de imagen o PDF asociado a la canción ← [[01-modelo-audio]]
- Señales de cambio de página manuales y configuración de sincronización ← [[02-vista-reproductor]]
- Señales de cambio de página manuales desde el vivo ← [[04-vista-show]]
- Eventos físicos de cambio de página por pedalera Bluetooth ← [[15-sesion-audio]]

## Proceso

1. **Carga y Renderizado:** Al abrir la partitura de un track, lee la ruta local del archivo. Si es un PDF, utiliza un renderizador de páginas embebido; si es una imagen (JPG/PNG), la muestra en un contenedor con zoom pellizco táctil y scroll vertical.
2. **Sincronización Automática por Timestamp:**
   - Lee el array de transiciones programadas de la base de datos (ej: `[ {time: 45.5, page: 2}, {time: 92.1, page: 3} ]`).
   - Monitorea el flujo de reproducción del track. Cuando el tiempo transcurrido del audio cruza una marca configurada, renderiza de inmediato la página correspondiente.
   - En Modo Edit, permite agregar marcas de tiempo capturando la posición actual del audio con un botón "Fijar página en este instante".
3. **Navegación Manual Prioritaria:**
   - Permite cambiar de página usando botones táctiles `[◀]` / `[▶]`.
   - Permite cambiar de página recibiendo eventos de pedalera física mediada por [[15-sesion-audio]] (ej: Pedal 1 = Página siguiente; Pedal 2 = Página anterior).
   - Si el músico ejecuta un cambio de página manual (pedal o táctil) durante la reproducción, se suspende la sincronización automática de páginas durante esa reproducción para dar prioridad al control en vivo y evitar que la partitura retroceda sola si el músico decide improvisar.

### Diagrama de flujo

```text
  ┌──────────────────┐
  │  ABRIR PARTITURA │
  │  ← archivo local │
  └────────┬─────────┘
           │
           ▼
    ┌──────────────┐
    │  ¿PDF o IMG? │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
  [SÍ]▼           ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ RENDER │ │ MOSTRAR      │
 │ PDF pag│ │ IMAGEN       │
 │ x pag  │ │ completa     │
 └───┬────┘ │ + scroll     │
     │      └──────────────┘
     │
     ▼
  ┌──────────────────┐
  │  ¿HAY TIMESTAMPS │
  │  DE SINCRONÍA?   │
  └──────┬───────────┘
         │
    ┌────┴────┐
    │         │
 [SÍ]▼         ▼[NO]
 ┌────────┐ ┌──────────┐
 │ MONITOR│ │ NAVEGACIÓN│
 │ playback│ │ MANUAL    │
 │ → auto │ │ SOLAMENTE │
 │ cambio │ └──────────┘
 │ página │
 └───┬────┘
     │
     ▼
  ┌──────────────────┐
  │  ¿USUARIO HIZO   │
  │  CAMBIO MANUAL?  │
  └──────┬───────────┘
         │
    ┌────┴────┐
    │         │
 [SÍ]▼         ▼[NO]
 ┌────────┐ ┌──────────┐
 │SUSPENDER│ │ CONTINUAR│
 │ AUTO    │ │ AUTO     │
 │ (esta   │ │ (sigue   │
 │  rep.)  │ │ timestamps│
 └────────┘ └──────────┘
```

## Salida

- Interfaz visual renderizada y transiciones de páginas → [[02-vista-reproductor]]
- Interfaz visual renderizada y transiciones de páginas en vivo → [[04-vista-show]]

## Errores

- **Lógico:** el archivo de partitura fue eliminado del almacenamiento local
  - *Resolución:* la vista muestra un panel vacío con la alerta "Archivo de partitura no disponible".
- **Semántico:** se programa una transición automática a una página que excede el límite del documento PDF (ej: saltar a página 10 en un PDF de 4 páginas)
  - *Resolución:* la operación se rechaza en Modo Edit y el marcador se ajusta al límite superior de páginas.

Catálogo global: [[07-modelo-errores]]

---

## Flujo de uso

### Asociar una partitura a una canción

Desde la vista Edit (o Reproductor → Info de canción):
1. Usuario toca "Cargar partitura"
2. Se abre el explorador de archivos del dispositivo
3. Usuario selecciona: .pdf, .jpg, .png, .gif
4. El archivo se copia al almacenamiento interno de Suniplayer
5. La partitura queda asociada a la canción

---

## Visualización

### Vista de partitura en pantalla

```text
┌──────────────────────────────────────────┐
│  🎵 Salsa Brava              [✕ Cerrar] │
├──────────────────────────────────────────┤
│                                          │
│   ┌────────────────────────────────┐     │
│   │                                │     │
│   │    [PARTITURA / PDF / IMAGEN]  │     │
│   │                                │     │
│   │    (contenido del archivo)     │     │
│   │                                │     │
│   │                                │     │
│   └────────────────────────────────┘     │
│                                          │
│  Página 1 de 4      [◀] [▶]    75%      │
├──────────────────────────────────────────┤
│  ══════════════════════════════════════  │
│  00:42 ───────────●──────────── 03:45    │
│  [▶/⏸] [◀◀] [▶▶]                           │
└──────────────────────────────────────────┘
```

**Elementos:**
- **Barra superior:** nombre de la canción, botón cerrar.
- **Área de la partitura:** muestra el contenido del archivo.
- **Controles de página:** si es PDF, navegar entre páginas.
- **Zoom:** slider para acercar/alejar.
- **Barra de reproducción:** se mantiene visible para controlar el audio sin salir de la partitura.
- **Cabezal:** muestra la posición actual.

### Modo "Pantalla partida"

Si el dispositivo es grande (tablet, desktop), se puede ver:

```text
┌───────────────────┬──────────────────────┐
│                   │                       │
│   GRÁFICA DE      │                       │
│   ONDAS +         │     PARTITURA         │
│   CONTROLES       │                       │
│                   │                       │
│                   │                       │
└───────────────────┴──────────────────────┘
```

- Mitad izquierda: la gráfica de ondas y controles.
- Mitad derecha: la partitura.

---

## Formatos soportados

| Formato | Visualización | Scroll | Zoom | Páginas múltiples |
|---------|--------------|--------|------|-------------------|
| PDF | Renderizado página por página | No | Sí | Sí |
| JPG | Imagen completa | Vertical | Sí | No (un solo archivo) |
| PNG | Imagen completa | Vertical | Sí | No (un solo archivo) |
| GIF | Imagen completa (estático) | Vertical | Sí | No |

---

## Interacción

**Tipo:** button (navegación ◀/▶) + gesture (pellizco zoom, scroll vertical) + icon-button (cerrar) + toggle (auto-sync ON/OFF) + modal-trigger (cargar partitura)

**Estados y transiciones:**
- Sin partitura → [tap "Cargar partitura"] → Selector de archivos
- Selector → [archivo seleccionado] → Cargando
- Cargando → [carga ok] → Visualizando (página 1)
- Cargando → [error archivo] → Error
- Visualizando → [tap ◀ / ▶] → Cambiando página
- Cambiando página → [transición completa] → Visualizando (pág. N)
- Visualizando → [gesto pellizco] → Zoom
- Zoom → [gesto pellizco inverso] → Visualizando
- Auto-sync ON → [timestamp alcanzado] → Cambio automático de página
- Auto-sync ON → [cambio manual por usuario] → Auto-sync SUSPENDIDO (esta rep.)
- Visualizando → [tap ✕] → Cerrado (vuelve a reproductor)

**Comportamiento por estado:**
- **Sin partitura:** Panel vacío. Botón «Cargar partitura» visible.
- **Cargando:** Spinner + texto «Cargando partitura…».
- **Visualizando:** Partitura renderizada. Controles ◀/▶. Número de página. Slider de zoom.
- **Zoom:** Imagen ampliada. Scroll horizontal/vertical. Doble tap para reset.
- **Cambiando página:** Animación de transición (slide left/right).
- **Auto-sync activo:** Indicador visual 🔗. Páginas cambian solas al ritmo del playback. Si el usuario cambia manualmente, el indicador cambia a ⏸ «Sincronización pausada».
- **Error:** Panel con mensaje de error + botón «Reintentar».

---

## Estilos CSS

**.ui-sheet-container**
- width: 100%; height: 100%; position: relative; overflow: hidden
- .theme-dark: background: #1a1a1a; .theme-light: background: #fafafa

**.ui-sheet-header**
- display: flex; align-items: center; justify-content: space-between; padding: 8px 16px
- .theme-dark: background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8)
- .theme-light: background: rgba(0,0,0,0.03); color: rgba(0,0,0,0.8)

**.ui-sheet-page-viewer**
- width: 100%; flex: 1; overflow: auto; display: flex; justify-content: center
- background: #fff (simula papel)

**.ui-sheet-controls**
- display: flex; align-items: center; justify-content: center; gap: 12px; padding: 8px
- .theme-dark: background: rgba(255,255,255,0.03)
- .theme-light: background: rgba(0,0,0,0.02)

**.ui-sheet-nav-btn**
- width: 36px; height: 36px; border-radius: 50%; border: none
- cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center
- transition: background 0.2s, transform 0.15s
- .theme-dark: background: rgba(255,255,255,0.08); color: #fff
- .theme-light: background: rgba(0,0,0,0.05); color: #333
- &:hover: background: rgba(255,152,0,0.2)
- &:active: transform: scale(0.9)
- &:disabled: opacity: 0.3; cursor: not-allowed

**.ui-sheet-page-indicator**
- font-size: 13px; font-weight: 500
- .theme-dark: color: rgba(255,255,255,0.6)
- .theme-light: color: rgba(0,0,0,0.6)

**.ui-sheet-zoom-slider**
- width: 80px; accent-color: #FF9800

**.ui-sheet-sync-indicator**
- font-size: 11px; padding: 2px 8px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px
- .ui-sheet-sync-indicator--active: background: rgba(76,175,80,0.15); color: #4CAF50
- .ui-sheet-sync-indicator--paused: background: rgba(255,152,0,0.15); color: #FF9800

**.ui-sheet-empty**
- display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: 200px
- .theme-dark: color: rgba(255,255,255,0.4)
- .theme-light: color: rgba(0,0,0,0.4)

**.ui-sheet-empty-btn**
- padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer
- .theme-dark: background: rgba(255,255,255,0.1); color: #fff
- .theme-light: background: rgba(0,0,0,0.06); color: #333
- &:hover: background: #FF9800; color: #fff
