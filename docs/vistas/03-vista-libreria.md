---
ruta: docs/vistas/03-vista-libreria.md
tipo: vista
origen: "[[01-vista-inicio]]"
estado: estable
---

# Vista Librería

## Función

Proveer la interfaz del explorador de archivos para la biblioteca local; permitir la importación masiva de audios desde el filesystem del dispositivo; y administrar las operaciones lógicas de biblioteca (búsqueda, filtros por energía, reanálisis de BPM, caché local offline y vinculación de partituras).

## Entrada

- filesystem del dispositivo (físico)
- Solicitudes de navegación e importación ← [[01-vista-inicio]]
- Colecciones y resultados de filtros estructurales ← [[11-filtros]]
- Estilos y variables CSS del tema activo ← [[13-tema]]

## Proceso

1. **Carga e Importación:** Abre un explorador nativo del dispositivo (`<input type="file" multiple>`).
   - Copia los audios seleccionados (.mp3, .wav, .flac, .ogg, .m4a) al almacenamiento local seguro gestionado por [[04-almacenamiento]].
   - Dispara automáticamente el análisis en segundo plano de [[04-bpm-analyzer]].
2. **Visualización de la Lista (Foco en Alto Contraste):**
   - Muestra filas compactas con: título visible del track, duración, BPM, clase CSS de nivel de energía y estado de caché local (estrella de favorito).
   - *No se reservan espacios para portadas de discos en las listas.*
3. **Menú Contextual (Tap y Mantener):**
   - Abre un menú de acciones rápidas sobre un track: agregar a QuouList, cambiar volumen, o asociar un PDF/imagen como partitura (enlazada al componente [[09-partituras]]).
4. **Búsqueda y Filtros:** Lee las búsquedas del usuario e interactúa con [[11-filtros]] para reducir la lista en tiempo real.

## Salida

- Instanciación y registro de pistas en el modelo de dominio → [[01-modelo-audio]]
- Disparo de cálculo de BPM y energía al importar → [[04-bpm-analyzer]]
- Asignación de tracks a Playlists o Sets → [[02-modelo-colecciones]]
- Parámetros y términos de filtrado → [[11-filtros]]

## Errores

- **Lógico:** el archivo seleccionado por el usuario no tiene formato de audio compatible o está dañado.
  - *Resolución:* La UI muestra la pista en gris (clase `.track-error`), añade el icono de advertencia `⚠️` e impide su reproducción con el aviso: "Formato no soportado o archivo corrupto".
- **Semántico:** la búsqueda activa no tiene resultados.
  - *Resolución:* Muestra el texto "No se encontraron canciones" con un botón de reset.

Catálogo global: [[07-modelo-errores]]

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ← Volver            📂  LIBRERÍA                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Buscar ─────────────────────────────────────────────────┐ │
│  │  🔍  Buscar en tu librería...                            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── 📁  Ruta: /Music/Importadas/ ─────────────────────────── │
│                                                              │
│  ╔══  ♫  Salsa Brava.mp3        ══  03:45  🔶128   ⭐  ══╗ │
│  ║   Nombre: Salsa Brava                  Agregado: 10/06  ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│  ╔══  ♫  Merengón.wav           ══  04:01  🔶135   ⭐  ══╗ │
│  ║   Nombre: Merengón                      Agregado: 09/06  ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│  ╔══  ♫  Bachata Rosa.flac      ══  03:34  🔶118      ══╗ │ │
│  ║   Nombre: Bachata Rosa                   Agregado: 08/06  ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│                                                              │
│  ─── 47 canciones  |  Pág 1 de 5  ──  [◀] [1] [2] [3] ▶  ─ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [📂 + Importar archivos del dispositivo]                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Acciones desde el menú contextual (tocar y mantener)

| Acción | Qué hace |
|--------|----------|
| Reproducir | Abre [[02-vista-reproductor]] con esta canción cargada. |
| Agregar a playlist | Abre selección para agregar el track a una playlist en [[02-modelo-colecciones]]. |
| Agregar a cola | Inserta el track en la QuouList de reproducción dinámica. |
| Vincular Partitura | Abre el navegador de archivos para seleccionar un archivo PDF/imagen de partitura y asociarlo al track (salida a [[09-partituras]]). |
| Ajustar tono/tempo | Abre el reproductor cargando el track en Modo Edit para manipulación de tono/tempo. |
| Guardar en app | Copia el archivo al caché persistente offline de [[04-almacenamiento]]. |
| Eliminar de librería | Quita la canción de la base de datos de [[04-almacenamiento]] sin borrar el archivo del disco. |
