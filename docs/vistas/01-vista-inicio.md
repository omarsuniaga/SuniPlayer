---
ruta: docs/vistas/01-vista-inicio.md
tipo: vista
origen: "[[INDEX]]"
estado: estable
---

# Vista de Inicio

## Función

Proveer el punto de entrada principal a la aplicación; mostrar tarjetas de acceso rápido a las Colecciones Inteligentes auto-generadas, Playlists del usuario, y la última sesión de reproducción; y proveer atajos de búsqueda y filtrado estructural de colecciones.

## Entrada

- Modelos y colecciones disponibles en el sistema ← [[02-modelo-colecciones]]
- Tarjetas de colecciones calculadas por el algoritmo ← [[10-algoritmo-mood]]
- Resultados de filtros de colecciones aplicados ← [[11-filtros]]
- Estilos y variables CSS del tema activo ← [[13-tema]]

## Proceso

1. **Carga Inicial:** Lee las colecciones del usuario y las autogeneradas desde la persistencia local.
2. **Visualización de Tarjetas (Foco en Metadatos):** Renderiza las Colecciones Inteligentes y Playlists como tarjetas de alto contraste. Siguiendo el principio de eliminar distractores escénicos, cada tarjeta muestra:
   - Nombre de la colección.
   - Cantidad de canciones.
   - Duración total acumulada.
   - Criterio de generación (ej: "BPM Lineal", "Más Reproducidas").
   - *NO se muestran portadas ni artes de disco.*
3. **Búsqueda e Integración:** Procesa búsquedas de texto plano filtrando colecciones en pantalla y delega filtros avanzados al componente [[11-filtros]].
4. **Modal de Creación/Edición:** Permite al usuario crear o eliminar playlists interactivamente.
5. **Navegación:** Permite transiciones directas al reproductor cargando la colección elegida.

## Salida

- Carga de colección y apertura de la reproducción → [[02-vista-reproductor]]
- Navegación al explorador de archivos → [[03-vista-libreria]]
- Criterios de búsqueda y filtrado de colecciones → [[11-filtros]]

## Errores

- **Lógico:** el sistema no posee ninguna canción importada.
  - *Resolución:* Oculta las secciones de colecciones y playlists, activa la clase CSS `.view-onboarding` y muestra una tarjeta central de bienvenida con el botón "Importar Audio" enlazado a [[03-vista-libreria]].
- **Semántico:** la búsqueda o los filtros activos arrojan cero coincidencias.
  - *Resolución:* Muestra el mensaje "Ninguna colección coincide con los criterios" y habilita el botón "Limpiar Filtros" (clase `.btn-reset-filters`).

Catálogo global: [[07-modelo-errores]]

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ← Perfil       🎵 Suniplayer                     ⚙️  Filtros │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Buscar ─────────────────────────────────────────────────┐ │
│  │  🔍  Buscar canciones, playlists...                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── COLECCIONES INTELIGENTES ─────────────────────────────── │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 📋 CURVA │  │ 📋LINEAL │  │ 📋 EXPO  │  │ 📋 MÁS   │    │
│  │   #3     │  │   120BPM │  │   #1     │  │  REPROD. │    │
│  │ 12 canc. │  │ 8 canc.  │  │ 15 canc. │  │ 20 canc. │    │
│  │ 34 min   │  │ 22 min   │  │ 41 min   │  │ (contad.)│    │
│  │ ⟡ Curva  │  │ ⟡ Lineal │  │ ⟡ Expon. │  │ 🔥 Criter│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ─── REPRODUCIENDO AHORA (Último track) ───────────────────── │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Salsa Brava.mp3                                  [ ▶ ]  │ │
│  │  BPM: 128  |  Tono: +3  |  Tempo: 110%                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── TUS PLAYLISTS ────────────────────────────────────────── │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 📋 Show  │  │ 📋 Favo- │  │ ┌──────┐ │                  │
│  │   Sábado │  │   ritos  │  │ │➕    │ │                  │
│  │ 8 canc.  │  │ 23 canc. │  │ │Nueva │ │                  │
│  │ 27 min   │  │ 72 min   │  │ │      │ │                  │
│  │          │  │          │  │ └──────┘ │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Secciones de la vista

### 1. Barra superior
- **👤 Perfil:** Enlace a [[06-vista-perfil]].
- **🌀 Filtros:** Abre el panel lateral de [[11-filtros]].

### 2. Colecciones Inteligentes (Descubrimiento)
- Muestra las colecciones autogeneradas calculadas por [[10-algoritmo-mood]] (Curva, Lineal, Exponencial) y la colección "Más Reproducidas" basada en contadores de reproducciones de [[04-almacenamiento]].
- Al pulsar sobre una de ellas se abre [[02-vista-reproductor]] con el set cargado.

### 3. Reproduciendo Ahora (Acceso rápido)
- Muestra el track remanente de la sesión anterior con su tono, tempo y BPM activos.
- Permite reanudar la reproducción directamente.

### 4. Crear Playlist manualmente
- El usuario puede crear una Playlist manualmente. Al pulsar en "+ Nueva", se abre un modal interactivo:
  - **Cabezal:** Conteo de canciones agregadas y duración total calculada dinámicamente.
  - **Cuerpo:** Lista paginada de canciones en biblioteca con botones de agregar/quitar.
  - **Pie:** Confirmar guardado o descartar cambios.
- **Eliminación:** Permite la selección múltiple de playlists/sets para darlas de baja de la base de datos de [[04-almacenamiento]] mediante confirmación.
