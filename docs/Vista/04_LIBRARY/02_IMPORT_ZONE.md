# COMPONENTE: IMPORT ZONE (Zona de Ingesta)

## Propósito
El **Import Zone** es el portal de entrada para nuevos audios. Su misión es facilitar la carga masiva de archivos del músico al sistema, asegurando que solo los formatos soportados entren a la cadena de procesamiento.

## Características y Funcionalidades Detalladas

### 1. Interfaz de Arrastre (Drag & Drop)
- **Área Sensible**: Una zona visualmente destacada (usualmente con bordes punteados y glow) que detecta cuando se arrastran archivos sobre ella.
- **Feedback de Arrastre**: Cambia de color o animación cuando el usuario tiene los archivos "suspendidos" sobre la zona, indicando que puede soltarlos.

### 2. Validación de Archivos
- **Formatos Soportados**: Filtra automáticamente extensiones como MP3, WAV, AAC, FLAC y OGG.
- **Rechazo Inteligente**: Si un archivo no es de audio o está corrupto, lo excluye del proceso e informa al usuario.

### 3. Modal de Procesamiento por Lote (Batch Processing)
- **Cola de Espera**: Muestra una lista de los archivos seleccionados antes de iniciar el procesamiento pesado.
- **Edición Previa**: Permite al músico corregir el Título y Artista de cada archivo antes de que el sistema genere la waveform y el análisis técnico.

## Comportamiento (UX)
- **Multitarea**: El usuario puede seguir navegando por la app mientras el Import Zone procesa los archivos en segundo plano (vía Web Workers).
- **Prevención de Duplicados**: Compara el nombre y tamaño del archivo para evitar importar dos veces la misma canción.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Eventos de `drop` o selección de archivos desde el explorador del sistema.
- **Acciones (Output)**: Envía los archivos validados al **Ingestion Flow** para su análisis profundo.

---
*El Import Zone es el puerto de carga donde el caos de carpetas se convierte en orden musical.*
