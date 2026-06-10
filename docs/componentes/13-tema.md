---
ruta: docs/componentes/13-tema.md
tipo: componente
origen: "[[06-vista-perfil]]"
estado: estable
---

# Sistema de Tema (Dark/Light)

## Función

Administrar la apariencia visual de la aplicación (Modos Oscuro, Claro y Sistema); aplicar clases globales y variables CSS al DOM con transiciones suaves; y forzar el Modo Oscuro durante el Modo Show por razones de discreción en el escenario.

## Entrada

- Selección manual de tema por parte del usuario ← [[06-vista-perfil]]
- Preferencia de tema del sistema operativo (Media Query `prefers-color-scheme`) (físico)

## Proceso

1. **Selección del Tema:** El componente lee la preferencia del usuario guardada en la base de datos. Si está en "Seguir sistema", escucha eventos de cambio del SO.
2. **Aplicación de Estilos CSS:** Modifica las variables de CSS custom properties (`--bg-primary`, `--text-primary`, `--accent`) en el elemento `:root` del documento. Aplica una transición global de 300ms.
3. **Optimización de Contraste para Componentes:**
   - En Modo Oscuro, la [grafica-ondas](file:///C:/Users/omare/OneDrive/Documentos/SUNIPLAYER_V2/docs/componentes/06-grafica-ondas.md) se dibuja en verde/azul neón sobre fondo negro.
   - En Modo Claro, la gráfica se dibuja en color oscuro sobre fondo blanco.
   - Las partituras en [[09-partituras]] no se alteran en sí mismas (son archivos PDF/imágenes del usuario), pero el contenedor y la UI que las rodea se ajustan al tema.
4. **Forzado en Modo Show:** Al activarse el Modo Show, el sistema ignora temporalmente el tema seleccionado y fuerza el **Modo Oscuro** (clase `.theme-dark-forced`) para evitar contaminación lumínica en el escenario. Al salir del show, restaura el tema previo.

### Diagrama de flujo

```text
      ┌──────────────────┐
      │  INICIO APP      │
      └────────┬─────────┘
               │
               ▼
  ┌──────────────────────────┐
  │  LEER PREFS              │
  │  TEMA GUARDADO           │
  │  ← [[04-almacenamiento]] │
  └─────────────┬────────────┘
               │
               ▼
        ┌──────────────┐
        │  ¿TEMA =     │
        │  SISTEMA?    │
        └──────┬───────┘
               │
          ┌────┴────┐
          │         │
       [SÍ]▼         ▼[NO]
      ┌────────┐ ┌──────────────┐
      │ ESCUCHAR│ │ APLICAR      │
      │ PREF.  │ │ TEMA         │
      │ SO     │ │ GUARDADO     │
      │ (media │ │ (Dark/Light) │
      │ query) │ └──────────────┘
      └───┬────┘
          │
          ▼
   ┌──────────────┐
   │  APLICAR     │
   │  VARIABLES   │
   │  CSS :root   │
   │  + clase     │
   │  .theme-dark │
   │  / .theme-   │
   │  light       │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  ¿MODO SHOW  │
   │  ACTIVO?     │
   └──────┬───────┘
          │
     ┌────┴────┐
     │         │
  [SÍ]▼         ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ FORZAR │ │ USAR TEMA    │
 │ DARK   │ │ SELECCIONADO │
 │ (class │ │ (sin forzar) │
 │ .theme-│ │              │
 │dark-   │ └──────────────┘
 │forced) │
 └───┬────┘
     │
     ▼
 ┌──────────────┐
 │  TRANSICIÓN  │
 │  CSS 300ms   │
 │  SUAVE       │
 └──────────────┘
```

## Salida

- Persistencia de la preferencia de tema → [[04-almacenamiento]]
- Estilos y variables CSS aplicados en el DOM → [[01-vista-inicio]], [[02-vista-reproductor]], [[03-vista-libreria]], [[04-vista-show]], [[05-vista-edit]], [[06-vista-perfil]]

## Errores

- **Lógico:** el dispositivo no soporta la media query del sistema
  - *Resolución:* se fuerza el Modo Oscuro por defecto.
- **Semántico:** intentar cambiar el tema mientras el Modo Show está activo
  - *Resolución:* la operación se bloquea visualmente y el interruptor permanece deshabilitado.

Catálogo global: [[07-modelo-errores]]

---

## Modos disponibles

- **🌙 Oscuro (Dark):** Fondo oscuro, texto claro. Ideal para escenarios con poca luz.
- **☀️ Claro (Light):** Fondo claro, texto oscuro. Ideal para leer partituras o usar al aire libre.
- **🔄 Seguir sistema:** Usa la configuración del sistema operativo del dispositivo.

---

## Qué cambia cuando cambia el tema

### Colores

| Elemento | Dark | Light |
|----------|------|-------|
| Fondo principal | #121212 (casi negro) | #FFFFFF (blanco) |
| Fondo secundario (tarjetas) | #1E1E1E | #F5F5F5 |
| Texto principal | #FFFFFF | #121212 |
| Texto secundario | #B0B0B0 | #666666 |
| Acento (botones, enlaces) | Color del usuario (ej: #4FC3F7) | Mismo acento |
| Bordes | #333333 | #E0E0E0 |
| Sombra de tarjetas | Sutil (casi sin sombra) | Más notoria |

### Componentes visuales

- **Waveform (gráfica):** Verde/azul neón brillante en Dark; oscuro sobre fondo claro en Light.
- **Botones de control:** Blancos sobre fondo oscuro en Dark; oscuros sobre fondo claro en Light.
- **Cronómetro de Show:** Blanco grande sobre fondo rojo tenue en Dark; mismo estilo con fondo rojo más saturado en Light.
- **Menús y modales:** Fondo oscuro, bordes sutiles en Dark; fondo claro, bordes definidos en Light.
- **Scrollbars:** Delgadas y en color acento en Dark; delgadas y grises en Light.
- **Ilustraciones:** Poseen versiones específicas adaptadas a cada tema.
- **Partituras:** El fondo de la partitura NO cambia (es el archivo mismo). Cambia el fondo y la UI del contenedor.

---

## Interacción

**Tipo:** segmented-control (3 opciones: Dark | Light | Sistema) + badge (tema activo actual)

**Estados y transiciones:**
- Dark → [tap Light] → Light (transición 300ms)
- Light → [tap Sistema] → Sistema (escucha prefers-color-scheme)
- Sistema → [SO cambia a dark] → Dark (automático)
- Sistema → [SO cambia a light] → Light (automático)
- Cualquiera → [Show activo] → Dark forzado (ignora selección)
- Dark forzado → [Show termina] → Tema previo restaurado

**Comportamiento por estado:**
- **Dark:** Clase `.theme-dark` en :root. Fondo #121212. Texto #fff. Interface de bajo perfil.
- **Light:** Clase `.theme-light` en :root. Fondo #fff. Texto #121212. Ideal para exteriores.
- **Sistema:** Escucha `prefers-color-scheme`. Sin clase fija. Badge: «Siguiendo sistema».
- **Dark forzado (Show):** Clase `.theme-dark-forced`. Interruptor de tema deshabilitado visualmente. Tooltip: «Bloqueado durante el show».
- **Transicionando:** Transición CSS global de 300ms en todas las propiedades de color.

---

## Guía de Estilos CSS

**.ui-theme-toggle-group**
- display: flex; gap: 0; border-radius: 10px; overflow: hidden
- .theme-dark: background: rgba(255,255,255,0.06)
- .theme-light: background: rgba(0,0,0,0.04)

**.ui-theme-option**
- padding: 8px 16px; font-size: 13px; cursor: pointer; border: none
- transition: background 0.2s, color 0.2s
- .theme-dark: color: rgba(255,255,255,0.5); background: transparent
- .theme-light: color: rgba(0,0,0,0.5); background: transparent
- &:hover: .theme-dark: background: rgba(255,255,255,0.08)

**.ui-theme-option--active**
- .theme-dark: background: #FF9800; color: #fff
- .theme-light: background: #F57C00; color: #fff

**.ui-theme-option--disabled**
- opacity: 0.4; cursor: not-allowed
- &:hover: background: transparent

**.ui-theme-badge**
- font-size: 11px; padding: 2px 10px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px
- .ui-theme-badge--dark: .theme-dark: background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5)
- .ui-theme-badge--light: .theme-light: background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.5)
- .ui-theme-badge--system: background: rgba(33,150,243,0.15); color: #2196F3
- .ui-theme-badge--forced: background: rgba(244,67,54,0.15); color: #F44336; animation: pulse 1.5s infinite

/* Root CSS custom properties */
:root {
  --transition-theme: color 0.3s, background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

.theme-dark {
  --bg-primary: #121212;
  --bg-secondary: #1E1E1E;
  --bg-card: #252525;
  --text-primary: #FFFFFF;
  --text-secondary: #B0B0B0;
  --border: #333333;
  --shadow: rgba(0,0,0,0.2);
}

.theme-light {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-card: #FFFFFF;
  --text-primary: #121212;
  --text-secondary: #666666;
  --border: #E0E0E0;
  --shadow: rgba(0,0,0,0.08);
}

/* Universal transition for all themed elements */
*, *::before, *::after {
  transition: var(--transition-theme);
}

/* Show mode override */
.theme-dark-forced {
  --bg-primary: #121212 !important;
  --bg-secondary: #1E1E1E !important;
  --text-primary: #FFFFFF !important;
  --text-secondary: #B0B0B0 !important;
  --border: #333333 !important;
}
