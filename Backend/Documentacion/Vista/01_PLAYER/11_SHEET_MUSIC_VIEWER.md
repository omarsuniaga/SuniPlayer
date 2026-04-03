# COMPONENTE: SHEET MUSIC VIEWER (Visor de Partituras y Letras)

## Propósito
Eliminar la necesidad de carpetas físicas o iPads externos. Permite al músico leer partituras, tablaturas o letras de canciones directamente integradas en el flujo del reproductor.

## Características y Funcionalidades Detalladas

### 1. Renderizado de Documentos
- **Soporte de Formatos**: Visualiza archivos PDF, imágenes (JPG/PNG) o texto enriquecido asociados a cada track.
- **Carga Automática**: Al empezar un track, el visor prepara automáticamente el recurso correspondiente.

### 2. Modos de Visualización
- **Pantalla Completa**: Ocupa todo el viewport para máxima legibilidad.
- **Overlay Transparente**: Se superpone a la waveform permitiendo ver el progreso del audio mientras se lee.

### 3. Navegación de Páginas
- **Auto-Scroll**: El visor puede desplazarse automáticamente basándose en el tiempo transcurrido del audio (configurado previamente).
- **Gestos de Pasaje**: Swipe lateral o clics en los bordes para cambiar de página manualmente.

## Comportamiento (UX)
- **Modo Nocturno**: Ajusta el contraste de los documentos (inversión de colores) para no deslumbrar al músico en escenarios oscuros.
- **Bloqueo de Rotación**: Mantiene la orientación del documento independientemente de cómo se mueva el dispositivo.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: La URL del recurso o el binario (Blob) desde la metadata del track actual.
- **Acciones (Output)**: Informa al sistema sobre la página actual visualizada.

---
*El Sheet Music Viewer convierte a SuniPlayer en un atril digital inteligente.*
