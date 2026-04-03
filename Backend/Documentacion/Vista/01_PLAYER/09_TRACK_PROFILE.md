# COMPONENTE: TRACK PROFILE (Perfil del Track)

## Propósito
El **Track Profile** es el centro de mando individual para cada canción. Su misión es permitir al músico personalizar la metadata, el comportamiento técnico y los recursos adicionales de un track específico, asegurando que cada tema esté "curado" para el show.

## Elementos y Funcionalidades (Vista Detallada)

### 1. Metadata Musical (El ADN del Track)
- **Título y Artista**: Permite corregir o refinar los nombres que vienen de los archivos (ID3).
- **BPM (Beats Per Minute)**: Ajuste manual del tempo. Vital para que las transiciones automáticas y efectos rítmicos funcionen con precisión.
- **Key (Tonalidad)**: Especificación de la nota raíz. Ayuda al músico a elegir qué tema sigue basándose en la armonía.

### 2. Configuración Técnica (Performance)
- **Recorte (Trim Start/End)**: Define exactamente cuándo empieza y termina el audio. Permite saltar intros largas o silencios al final sin editar el archivo original.
- **Compensación de Ganancia (Gain Offset)**: Ajuste de volumen individual para que todos los temas del setlist suenen al mismo nivel percibido.
- **Marcadores (Cue Points)**: Puntos de referencia visuales en la waveform para indicar secciones (Intro, Solo, Coro).

### 3. Organización y Notas
- **Etiquetas (Tags)**: Clasificación por género, energía o instrumentos (ej: "Jazz", "High Energy", "Con Piano").
- **Notas del Track**: Un campo de texto libre donde el músico puede anotar recordatorios críticos (ej: "Empezar con fade in", "Ojo con el solo de saxo").

### 4. Recursos Adicionales
- **Partituras / Letras (Sheet Music)**: Permite asociar archivos PDF o imágenes que se abrirán automáticamente cuando el track esté en el reproductor.

## Comportamiento del Componente (UX)
- **Persistencia Reactiva**: Cada cambio guardado se propaga instantáneamente a todas las instancias del track (en la Biblioteca, en el Setlist actual y en el Historial).
- **Validación en Tiempo Real**: Asegura que el tiempo de "Fin" no sea menor al de "Inicio" y que los BPM sean valores lógicos.
- **Cierre de Seguridad**: Pide confirmación si hay cambios sin guardar antes de cerrar el modal.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: El objeto `Track` completo desde el Store.
- **Acciones (Output)**: Llama a funciones globales como `updateTrackMetadata` y `setTrackTrim` para persistir los cambios en el almacenamiento local (IndexedDB).

---
*El Track Profile convierte un simple archivo de audio en una pieza de artillería para el escenario.*
