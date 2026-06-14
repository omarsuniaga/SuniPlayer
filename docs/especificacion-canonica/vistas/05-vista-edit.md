# Vista Edit

## ¿Qué es?

El "backstage" de Suniplayer. Acá el músico prepara todo antes de subir al escenario: arma sets, ajusta canciones, configura transiciones, carga partituras. Es el taller donde se construye la presentación.

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████████ │
│  █  ← Volver           ✏️  MODO EDIT                     █ │
│  ████████████████████████████████████████████████████████████ │
│                                                              │
│  ─── SET: Show Sábado 15 ─── [▼ Cambiar] ─────────────────── │
│                                                              │
│  ╔══════════════════════════════════════════════════════════╗ │
│  ║  12 canciones  |  Duración: 34:21  |  🟢  Entra en 40min ║│
│  ║                                                          ║│
│  ║     [🎯 Iniciar Show]              [💾 Guardar]          ║│
│  ╚══════════════════════════════════════════════════════════╝ │
│                                                              │
│  ─── ORDEN DEL SET (arrastrar ↕) ──────────────────────────── │
│                                                              │
│  ╔══  ≣  1.  ♫  Salsa Brava.mp3    ══  03:45  🎵⏱📌 ══╗ │ │
│  ║          Tono: +3  |  Tempo: 110%              ║ │ │
│  ╚══════════════════════════════════════════════════╝ │ │
│  ╔══  ≣  2.  ♫  Merengón.wav        ══  04:01  🎵⏱   ══╗ │ │
│  ║          Tono: 0   |  Tempo: 100%              ║ │ │
│  ╚══════════════════════════════════════════════════╝ │ │
│  ╔══  ≣  3.  ♫  Bachata Rosa.flac  ══  03:34  🎵    ══╗ │ │
│  ║          Tono: -2  |  Tempo: 100%              ║ │ │
│  ╚══════════════════════════════════════════════════╝ │ │
│  ╔══  ≣  4.  ♫  Balada Triste.mp3  ══  05:12   ══╗ │ │
│  ║          Tono: 0   |  Tempo: 100%              ║ │ │
│  ╚══════════════════════════════════════════════════╝ │ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [+ Agregar canciones desde librería]                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── CANCIÓN SELECCIONADA: Salsa Brava ────────────────────── │
│                                                              │
│  ┌───────────────────────┐  ┌───────────────────────────────┐│
│  │  🎵 Tono:             │  │  ▶ TRANSICIÓN A SIGUIENTE    ││
│  │   ═══●═══  [+3]      │  │                               ││
│  │  Do → Re              │  │  FadeOut: [3s]  Gap: [1s]   ││
│  │                       │  │  FadeIn:  [2s]               ││
│  │  ⏱ Tempo:             │  │  ─────────────────           ││
│  │   ═══●═══  [110%]    │  │  [Corte seco] [Desvanecer]   ││
│  │                       │  │  [Mezcla]     [Fundido enc.]  ││
│  │  ✂ Inicio:  [00:23]  │  │                               ││
│  │  ✂ Final:   [03:30]  │  └───────────────────────────────┘│
│  │                       │                                   │
│  │  📂 Partitura: [Ver]  │                                   │
│  │  📌 Marcadores: 3     │                                   │
│  └───────────────────────┘                                   │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Secciones de la vista

### 1. Barra superior

- **← Volver**: vuelve a la vista anterior (normalmente Inicio).
- **Indicador "MODO EDIT"**: confirma que estamos en modo preparación.

### 2. Set selector

```text
SET: Show Sábado 15 ── [▼ Cambiar]
```

El usuario puede tener múltiples sets guardados. Desde acá:
- Elegir qué set editar.
- Crear un set nuevo.
- Duplicar un set existente.
- Eliminar un set.

### 3. Información del set

```text
╔══════════════════════════════════════════════════════════╗
║  12 canciones  |  Duración: 34:21  |  🟢  Entra en 40min ║
║                                                          ║
║     [🎯 Iniciar Show]              [💾 Guardar]          ║
╚══════════════════════════════════════════════════════════╝
```

**Advertencias visuales:**
- 🟢 Verde: el set entra en el tiempo disponible.
- 🟡 Amarillo: el set está al 90% del tiempo disponible.
- 🔴 Rojo: el set excede el tiempo disponible.

### 4. Orden del set

```text
╔══  ≣  1.  ♫  Salsa Brava.mp3    ══  03:45  🎵⏱📌 ══╗
║          Tono: +3  |  Tempo: 110%              ║
╚══════════════════════════════════════════════════╝
```

- ≣ → indicador de arrastre (drag & drop).
- ♫ + nombre de la canción.
- Duración.
- Iconos de ajustes activos: 🎵=tono cambiado, ⏱=tempo cambiado, 📌=tiene marcadores.
- Al seleccionar, se muestra el panel de ajustes abajo.

**Menú contextual por canción:**
- Quitar del set.
- Mover al inicio / al final.
- Duplicar (la misma canción aparece dos veces).
- Escuchar (abre el reproductor con esta canción para ensayar).

### 5. Panel de ajustes (canción seleccionada)

```text
┌───────────────────────┐
│  🎵 Tono:             │
│   ═══●═══  [+3]      │
│  Do → Re              │
│                       │
│  ⏱ Tempo:             │
│   ═══●═══  [110%]    │
│                       │
│  ✂ Inicio:  [00:23]  │
│  ✂ Final:   [03:30]  │
│                       │
│  📂 Partitura: [Ver]  │
│  📌 Marcadores: 3     │
└───────────────────────┘
```

| Ajuste | Control |
|--------|---------|
| Tono | Slider -12 a +12 semitonos |
| Tempo | Slider 50% a 200% |
| Inicio personalizado | Timestamp |
| Fin personalizado | Timestamp |
| Partitura | Botón "Cargar archivo" o "Ver" |
| Marcadores | Botón "Editar" → abre el panel |

**Todos los cambios se guardan automáticamente.**

### 6. Panel de transiciones

```text
┌───────────────────────────────┐
│  ▶ TRANSICIÓN A SIGUIENTE    │
│                               │
│  FadeOut: [3s]  Gap: [1s]   │
│  FadeIn:  [2s]               │
│  ─────────────────           │
│  [Corte seco] [Desvanecer]   │
│  [Mezcla]     [Fundido enc.] │
└───────────────────────────────┘
```

| Configuración | Qué hace | Default |
|--------------|----------|---------|
| FadeOut canción actual | Duración del fade al final | 0s |
| Gap | Silencio entre canciones | 1s |
| FadeIn canción siguiente | Duración del fade al inicio | 0s |

**Tipos de transición pre-configurados:**

| Tipo | FadeOut | Gap | FadeIn | Cuándo usarlo |
|------|---------|-----|--------|---------------|
| Corte seco | 0s | 0s | 0s | Cambio abrupto |
| Desvanecer | 3s | 1s | 2s | Transición suave |
| Fundido encadenado | 3s | 0s | 3s | Transición de radio |

---

## ¿Qué se puede hacer en Edit que no en otros modos?

| Acción | Edit | Escucha | Show |
|--------|------|---------|------|
| Crear/editar sets | ✅ | ❌ | ❌ |
| Configurar transiciones | ✅ | ❌ | ❌ |
| Ajustar in/out de canción | ✅ | ❌ | ❌ |
| Cargar partituras | ✅ | ❌ (solo ver) | ❌ |
| Reordenar canciones | ✅ | ❌ | ❌ |

---

## Estados de la vista

| Estado | Qué se ve |
|--------|-----------|
| **Sin sets** | "Aún no tenés sets. Creá uno nuevo." + Botón "Crear set" |
| **Set vacío** | "Agregá canciones desde la librería." + Botón "+" |
| **En preparación** | Todo funcional, ajustes visibles |
| **Set listo** | 🟢 "✅ Listo para el show" + Botón "🎯 Iniciar Show" destacado |
| **Set muy largo** | 🔴 Advertencia de tiempo excedido |

---

## Lo que NO está en esta vista

- No está la reproducción en tiempo real con toda la UI de controles (está en Vista Reproductor). En Edit se puede escuchar una canción para ensayar, pero el control completo está en el Reproductor.
- No está la QuouList en modo show (está en Vista Show).
- No están las Colecciones Inteligentes ni el descubrimiento de canciones (están en Inicio).
- No se pueden importar canciones nuevas desde acá (hay que ir a Librería).
- No está la configuración global de la app (está en Perfil).
