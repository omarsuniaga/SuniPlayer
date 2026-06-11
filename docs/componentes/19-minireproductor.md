---
ruta: docs/componentes/19-minireproductor.md
tipo: componente
origen: "[[02-vista-reproductor]]"
estado: estable
---

# Minireproductor (Mini-Player)

## Función

Proveer un control persistente y mínimo de reproducción anclado al footer de todas las vistas de la aplicación, permitiendo al usuario navegar entre pantallas sin perder acceso inmediato a los controles esenciales (play/pause, next) ni a la información del track actual y el próximo en cola.

## Entrada

- Track activo y estado de reproducción (playing/paused/stopped/idle) ← [[01-audio-engine]]
- Track siguiente en la QuouList ← [[02-modelo-colecciones]]
- Posición actual y duración del track ← [[01-audio-engine]]
- Tap en botón play/pause → comando ← [[01-audio-engine]]
- Tap en botón next → comando ← [[01-audio-engine]]
- Evento de navegación de vistas ← [[01-vista-inicio]], [[03-vista-libreria]], [[04-vista-show]], [[05-vista-edit]], [[06-vista-perfil]]
- Estado de modo activo (Escucha/Edit/Show) ← [[03-modelo-sesion]]

## Proceso

1. El minireproductor se suscribe al estado del motor de audio y se renderiza como un footer fijo en todas las vistas de navegación.
2. Siempre que haya un track activo, el minireproductor se muestra con información y controles.
3. Si **no hay track activo** (motor en IDLE y QuouList vacía), el minireproductor se contrae a una barra minimalista que solo muestra un mensaje "Sin reproducción activa" o se oculta por completo según la configuración de preferencias del usuario.
4. El usuario puede **tocar en cualquier parte del cuerpo** del minireproductor (excepto los botones de acción) para navegar directamente a la [[02-vista-reproductor]] completa.
5. El botón **play/pause** alterna entre reproducción y pausa según el estado actual.
6. El botón **next** avanza al siguiente track en la QuouList, respetando la resolución de next() del motor.
7. La **barra de progreso** muestra el avance del track actual de forma continua; permite seek táctil solo si el modo activo lo permite.
8. Si el track cambia (por next, prev, fin de canción, o selección desde otra vista), el minireproductor se actualiza inmediatamente.

### Diagrama de flujo

```text
                   ┌─────────────────────────────┐
                   │ ¿Hay track activo            │
                   │ (motor no IDLE)?             │
                   └─────────────┬───────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌──────────────────┐     ┌────────────────────┐
          │     MOSTRAR      │     │      OCULTAR /      │
          │  minireproductor │     │   CONTRAER a barra  │
          │  con controles   │     │   "Sin reproducción"│
          └────────┬─────────┘     └────────────────────┘
                   │
         ┌─────────┴──────────────────────┐
         │                                │
         ▼                                ▼
┌──────────────────┐           ┌──────────────────┐
│  Tap en CUERPO   │           │  Tap en PLAY/    │
│  (no botón)      │           │  PAUSE o NEXT    │
└────────┬─────────┘           └────────┬─────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐           ┌──────────────────┐
│  Navegar a       │           │  Enviar comando  │
│  02-vista-       │           │  a 01-audio-     │
│  reproductor     │           │  engine          │
└──────────────────┘           └──────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  Actualizar UI   │
                              │  con nuevo estado│
                              └──────────────────┘
```

### Resolución de estados del minireproductor

```text
1. El motor notifica un cambio de estado
        │
        ▼
2. ¿Hay track activo?
   ├─ SÍ → ¿Está en IDLE o STOPPED?
   │      ├─ SÍ → ocultar controles, mostrar "Sin reproducción"
   │      └─ NO → mostrar minireproductor completo
   │
   └─ NO → ocultar minireproductor
        │
        ▼
3. ¿El modo activo es SHOW?
   ├─ SÍ → minireproductor visible pero bloqueado:
   │      · No se permite seek en la barra de progreso
   │      · El botón next requiere confirmación (delay 0.5s)
   │      · Tap en cuerpo abre reproductor pero con banner SHOW
   │
   └─ NO → minireproductor operativo normalmente
```

## Salida

- Comando play() o pause() → [[01-audio-engine]]
- Comando next() → [[01-audio-engine]]
- Evento de navegación "abrir reproductor" → [[02-vista-reproductor]]
- Indicador de modo SHOW activo → [[01-vista-inicio]], [[03-vista-libreria]], [[04-vista-show]], [[05-vista-edit]], [[06-vista-perfil]]
- Posición de seek (si aplica) → [[01-audio-engine]]

## Errores

- **Lógico:** el usuario toca play/pause sin que haya un track activo cargado
  - *Resolución:* el minireproductor ignora el toque; el botón permanece en estado deshabilitado y opaco (clase `.mini-player--empty`).
- **Semántico:** el usuario toca next() estando en el último track de la QuouList sin repetición activa
  - *Resolución:* el motor rechaza el avance; el minireproductor muestra una animación visual de "No hay siguiente" (clase `.mini-player__next--end`) y vuelve al estado anterior.

Catálogo global: [[07-modelo-errores]]

---

## Interacción

**Tipo:** barra persistente + button (play/pause) + button (next) + slider (progreso) + tap-target (cuerpo → navegación)

**Estados y transiciones:**
- `MINI_EMPTY` → [track cargado] → `MINI_ACTIVE`
- `MINI_ACTIVE` → [fin de canción, QuouList vacía] → `MINI_EMPTY`
- `MINI_ACTIVE` → [usuario navega a reproductor completo] → mantiene estado, sigue reproduciendo
- `Cualquiera` → [modo SHOW activo] → `MINI_LOCKED` (seek deshabilitado, next con delay)
- `MINI_LOCKED` → [modo SHOW desactivado] → `MINI_ACTIVE`

**Comportamiento por estado:**
- **MINI_EMPTY:** Barra reducida. Sin botones activos. Texto: "Sin reproducción". Opcionalmente oculto si el usuario lo configuró así en preferencias.
- **MINI_ACTIVE:** Barra completa con track info, play/pause, next, progreso. Todos los controles operativos.
- **MINI_LOCKED:** Barra visible pero seek bloqueado. Botón next con retardo anti-tap accidental de 0.5s. Fondo con borde rojo sutil indicando modo show.

---

## Guía de Estilos CSS

### Contenedor base
- `.mini-player` — footer fijo, altura 64px, ancho 100%, z-index alto
- `.theme-dark`: background: rgba(18,18,18,0.95); border-top: 1px solid rgba(255,255,255,0.08)
- `.theme-light`: background: rgba(255,255,255,0.95); border-top: 1px solid rgba(0,0,0,0.08)

### Estado vacío
- `.mini-player--empty` — altura reducida a 32px, sin controles
- `.mini-player--empty .mini-player__info` — texto "Sin reproducción", color gris suave

### Track info
- `.mini-player__info` — contenedor flexible del track actual y siguiente
- `.mini-player__track-name` — nombre del track actual, font-weight: 600, un solo renglón, text-overflow: ellipsis
- `.theme-dark .mini-player__track-name`: color: #fff
- `.theme-light .mini-player__track-name`: color: #1a1a1a

- `.mini-player__next-preview` — texto del próximo track en cola, font-size: 11px
- `.theme-dark .mini-player__next-preview`: color: rgba(255,255,255,0.5)
- `.theme-light .mini-player__next-preview`: color: rgba(0,0,0,0.5)
- Prefix: "Siguiente: " en itálica

### Botón Play/Pause
- `.mini-player__play-btn` — botón circular 36×36, background transparente
- `.mini-player__play-btn.playing` — icono ⏸, color: #4CAF50
- `.mini-player__play-btn.paused` — icono ▶, color: #fff (dark) / #333 (light)
- `.mini-player__play-btn:disabled` — opacity: 0.3, pointer-events: none

### Botón Next
- `.mini-player__next-btn` — botón 36×36, background transparente
- `.mini-player__next-btn—end` — animación shake si no hay siguiente
- `.mini-player__next-btn:disabled` — opacity: 0.3

### Barra de progreso
- `.mini-player__progress` — altura 3px, ancho 100%, cursor: pointer
- `.theme-dark`: accent-color: #FF9800; background: rgba(255,255,255,0.1)
- `.theme-light`: accent-color: #E65100; background: rgba(0,0,0,0.08)
- `.mini-player__progress--locked` — pointer-events: none (en modo show)

### Modo show
- `.mini-player--locked` — borde superior rojo (#F44336) de 2px
- `.mini-player--locked .mini-player__progress` — cursor: not-allowed, opacidad reducida

### Dark/Light overrides
- `.theme-dark .mini-player` — fondo oscuro, texto claro
- `.theme-light .mini-player` — fondo claro, texto oscuro
- `.theme-dark .mini-player__next-btn` — color: rgba(255,255,255,0.7)
- `.theme-light .mini-player__next-btn` — color: rgba(0,0,0,0.6)

---

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     VISTA ACTIVA                             │
│                  (scrollable content)                        │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────┐   ┌────┐  ┌────┐          │
│  │  Salsa Brava                 │   │ ▶ │  │ ▶▶│           │
│  │  Siguiente: Bachata Rosa     │   └────┘  └────┘          │
│  └──────────────────────────────┘                            │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░ 3:45 / 4:30      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Inicio]  [Buscar]  [Perfil]  [Ajustes]     BARRA NAVEG.   │
└──────────────────────────────────────────────────────────────┘

                     ─── O ───

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     VISTA ACTIVA                             │
│                  (sin track cargado)                         │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐    │
│  │           Sin reproducción activa                    │    │
│  └──────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────┤
│  [Inicio]  [Buscar]  [Perfil]  [Ajustes]     BARRA NAVEG.   │
└──────────────────────────────────────────────────────────────┘

                     ─── O ───

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     VISTA ACTIVA                             │
│                  (MODO SHOW activo)                          │
│                                                              │
│                                                              │
│          ⚠️ Minireproductor visible pero bloqueado           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐   ┌────┐  ┌────┐          │
│  │  Salsa Brava                 │   │ ⏸ │  │ ▶▶│ ← con     │
│  │  Siguiente: Bachata Rosa     │   └────┘  └────┘   delay  │
│  └──────────────────────────────┘                            │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░ ██ bloqueado         │
│  🔴─────────────────────── borde rojo                       │
├──────────────────────────────────────────────────────────────┤
│  [Inicio]  [Buscar]  [Perfil]  [Ajustes]     BARRA NAVEG.   │
└──────────────────────────────────────────────────────────────┘
```

---

## Iconografía

**Icono principal:** barra horizontal con nota musical (`.mini-player`)  
**Play:** `▶` (`.mini-player__play-btn.paused`), **Pause:** `⏸` (`.mini-player__play-btn.playing`)  
**Next:** `⏭` (`.mini-player__next-btn`)  

**Tamaño sugerido:**
- Iconos de botones: 18×18px dentro del contenedor de 36×36px
- Nota musical (track activo): 16×16px, sutil, al lado del nombre del track

**Comportamiento dark/light:**
- `.theme-dark .mini-player__play-btn.paused` — icono `▶` blanco (#fff)
- `.theme-light .mini-player__play-btn.paused` — icono `▶` gris oscuro (#333)
- `.mini-player__play-btn.playing` — siempre verde (#4CAF50), independiente del tema
