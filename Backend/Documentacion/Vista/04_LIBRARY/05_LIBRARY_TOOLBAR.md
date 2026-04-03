# COMPONENTE: LIBRARY TOOLBAR (Barra de Herramientas del Catálogo)

## Propósito
Proporcionar acceso rápido a las funciones de búsqueda, filtrado y acciones masivas sobre la biblioteca. Es la herramienta de navegación principal para encontrar temas en segundos bajo la presión del escenario.

## Características y Funcionalidades Detalladas

### 1. Buscador Inteligente
- **Filtro Global**: Un campo de texto que busca coincidencias parciales en Título, Artista y Etiquetas (Tags).
- **Debounce**: Implementa una espera de milisegundos para no saturar el filtrado de la lista mientras el usuario escribe.

### 2. Filtros Rápidos (Chips)
- **Categorización por Etiquetas**: Botones redondos (Pills) que permiten filtrar instantáneamente por género o energía (ej: Jazz, Balada, Up-tempo).
- **Filtro de Origen**: Permite conmutar la vista entre Temas Locales, Temas en la Nube o Favoritos.

### 3. Acciones de Gestión
- **Botón Importar (+)**: Acceso directo para disparar el explorador de archivos o abrir la **Import Zone**.
- **Borrar Todo (Acción Destructiva)**: Un botón separado visualmente para vaciar la biblioteca local, con confirmación obligatoria para evitar accidentes.

## Comportamiento (UX)
- **Sticky Position**: En la web, la toolbar se mantiene fija en la parte superior mientras el usuario hace scroll en la lista de tracks.
- **Adaptabilidad**: En dispositivos móviles, los elementos se reorganizan para ser accesibles con el pulgar.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: La lista total de tracks y la lista de etiquetas disponibles.
- **Acciones (Output)**: Envía los criterios de búsqueda y filtros al **Library Store** para actualizar la vista filtrada.

---
*La Library Toolbar es el filtro que permite al músico encontrar la aguja en el pajar de su repertorio.*
