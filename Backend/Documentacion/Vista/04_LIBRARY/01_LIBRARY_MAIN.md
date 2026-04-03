# VISTA: LIBRARY (Catálogo y Gestión de Repertorio)

## Propósito
La **Library** es el almacén central de SuniPlayer. Su misión es permitir al músico gestionar su colección de audios (locales y en la nube), organizar su repertorio y preparar los tracks para ser enviados al **Setlist Queue**.

## Elementos y Funcionalidades Principales

### 1. Gestión de Catálogo Dual
- **Tracks Locales**: Archivos importados por el usuario que residen en el almacenamiento del dispositivo (IndexedDB en web / SQLite en native).
- **Tracks de Catálogo (Mocks/Cloud)**: Temas pre-cargados o remotos que sirven como base para la generación de sets.

### 2. Acciones de Repertorio
- **Quick Play**: Al hacer doble clic en un track, se limpia la cola actual y se inicia la reproducción inmediata de ese tema.
- **Add to Queue**: Al tocar un track, se añade al final de la cola activa (`pQueue`), permitiendo construir un show de forma manual y rápida.
- **Track Profiling**: Acceso directo al **Track Profile** para cada canción del catálogo.

### 3. Herramientas de Organización (Toolbar)
- **Buscador Dinámico**: Filtrado en tiempo real por título, artista o etiquetas.
- **Batch Actions**: Funciones para "Borrar Todo" o "Sincronizar" la biblioteca local.

## Comportamiento (UX)
- **Virtualización de Lista**: Para bibliotecas de miles de temas, se usa scroll virtual para mantener la fluidez a 60fps.
- **Estado de Disponibilidad**: Indica visualmente si un track está listo para sonar o si requiere descarga/sincronización.

---
*La Library convierte una carpeta de archivos en un repertorio listo para el escenario.*
