# COMPONENTE: FICHA TÉCNICA (Track Profile)

## Propósito
Modal soberano (`zIndex: 9999`) para el ajuste fino de cada obra musical. Es el puente entre el archivo crudo y la interpretación en el escenario.

## 🛠️ Pestañas Técnicas

### 1. Motor de Audio (Core)
- **Visualizador de Recorte (Trimmer)**: Ajuste de `startTime` y `endTime` mediante visualización de onda (Waveform) con máscaras de exclusión.
- **Normalización**: Slider de ganancia (±6dB) para equilibrar el volumen relativo del track.
- **Pitch & Tempo**: 
    - Cambio de Tono: Ajuste cromático (±12 semitonos). Comparativa de Tono Original vs Objetivo.
    - Cambio de Velocidad: Factor de tiempo (0.8x - 1.2x) sin afectar el tono (WSOLA).
- **Test Audio**: Botón de pre-escucha inmediata de los ajustes.

### 2. Detalles (Metadata)
- Edición de Título, Artista y Autor.
- Gestión de **Mood (Energía)** para el algoritmo del Builder.
- Sistema de Tags dinámicos.

### 3. Notas de Escenario
- Campo de texto enriquecido para recordatorios críticos que se muestran durante el show (ej: "Intro de 4 compases").

### 4. Partituras (Papel)
- Gestión de archivos adjuntos (PDF/Imagen) vinculados al track.

## 🏗️ Diseño Atómico
- **Alta Densidad**: Todo el control del motor de audio cabe en una sola pantalla sin necesidad de scroll.
- **Visualización Pro**: Uso de contrastes entre valores detectados (gris) y ajustados (cian/brillante).

---
*El Track Profile convierte un archivo de audio en un instrumento configurable.*
