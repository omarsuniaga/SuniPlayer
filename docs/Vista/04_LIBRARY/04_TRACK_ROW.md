# COMPONENTE: TRACK ROW (Fila de Canción - Estilo Premium)

## Propósito
Representar cada track de la biblioteca de forma compacta, elegante y altamente funcional. Su diseño está optimizado para la lectura rápida de metadatos musicales y la interacción táctil precisa.

## Características y Funcionalidades Detalladas

### 1. Estructura Visual (Layout Spotify Style)
- **Compactación**: Fila de 54px de altura con 2px de separación exacta, maximizando la cantidad de tracks visibles en pantalla.
- **Artwork Placeholder (42px)**: Un cuadrado con gradiente tonal y un icono de nota musical que sirve como ancla visual para la fila.
- **Jerarquía de Texto**:
    - **Título**: Blanco puro, negrita (14px), con elipsis para nombres largos.
    - **Subtítulo**: Gris atenuado (12px) que agrupa: [Artista] • [Duración] • [BPM].

### 2. Indicadores de Estado
- **Playing / In Queue**: El título cambia a color Cyan vibrante cuando el track está en el reproductor.
- **Origen del Track**: Iconografía sutil para diferenciar entre temas locales (📱) y temas en la nube (☁️).
- **Key (Armonía)**: Se muestra la tonalidad (ej: 4A, Am) en un lateral, con tipografía monoespaciada para destacar su carácter técnico.

### 3. Interacciones y Acciones
- **Single Click**: Selecciona el track para añadirlo al Setlist Queue (Modo Toggle).
- **Double Click / Hover Play**: Inicia la reproducción inmediata, limpiando la cola previa.
- **Acciones Secundarias (⋮)**: Menú desplegable compacto para abrir el Perfil del Track, verificar en la nube o eliminar.

## Comportamiento (UX)
- **Micro-interacciones**: Efecto de hover sutil (aclarado del fondo) y escala de presión (0.98x) al tocar, para dar feedback físico al músico.
- **Gestión de Memoria**: Como es un componente que se repite miles de veces, el renderizado está optimizado para ser ultra-liviano.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Objeto `Track` completo y estados de pertenencia (`isInQueue`, `isInRepertoire`).
- **Acciones (Output)**: Dispara `onQueue`, `onPlay` y `onOpenTrackProfile`.

---
*El Track Row es la unidad básica de información de SuniPlayer, diseñada para ser invisible pero infalible.*
