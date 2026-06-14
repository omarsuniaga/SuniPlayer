# PROCESO TÉCNICO: INGESTION FLOW (Flujo de Análisis y Carga)

## Propósito
Este documento describe la cadena de montaje técnica que ocurre desde que un archivo es soltado en la app hasta que aparece disponible en la Library. Es un proceso de alta intensidad computacional diseñado para no bloquear la interfaz de usuario.

## Pasos del Flujo (Pipeline)

### 1. Extracción de Metadata (ID3 Tags)
- **Prioridad**: El sistema lee los metadatos internos del archivo (Título, Artista, Álbum, Arte de Tapa).
- **Fallback**: Si los tags están vacíos, se aplica un parsing al nombre del archivo para intentar deducir el artista y el título.

### 2. Análisis de Audio (Waveform & BPM)
- **Decodificación**: Se convierte el binario del audio en un `AudioBuffer`.
- **Generación de Onda**: Se calculan los picos de amplitud para crear el array de datos que usará la **Waveform Engine**.
- **Detección de Tempo**: Un algoritmo analiza los transitorios del audio para estimar el BPM (Beats Per Minute) real.
- **Detección de Key**: Analiza el contenido armónico para sugerir la tonalidad de la canción.

### 3. Normalización de Volumen
- **RMS Analysis**: Calcula el volumen promedio del track.
- **Auto-Gain calculation**: Genera un valor de compensación inicial para que el tema no suene mucho más fuerte o despacio que el resto de la biblioteca.

### 4. Persistencia en Almacenamiento Local
- **Binario**: El archivo original se guarda en **IndexedDB** (en la web) para que esté disponible sin conexión a internet.
- **Metadata**: Toda la información técnica y musical se guarda en el store persistente de la aplicación.

## Tecnologías Involucradas
- **Web Workers**: El análisis pesado ocurre en hilos separados para evitar "congelar" la pantalla.
- **Music-Metadata**: Librería para la extracción de tags.
- **Web Audio API**: Para la decodificación y análisis de picos.

---
*El Ingestion Flow es el laboratorio donde SuniPlayer entiende la estructura física de la música.*
