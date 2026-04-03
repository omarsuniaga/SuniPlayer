# FUNCIONAMIENTO TÉCNICO: DASHBOARD (Consola de Configuración de Performance)

## Propósito
El **Dashboard** es el panel de control técnico que permite al músico ajustar los parámetros de automatización y visualización del show. Es donde se define el comportamiento "inteligente" de la app.

## Características y Parámetros Detallados

### 1. Ajustes de Transición (Fade/Crossfade)
- **Fade In/Out Time (ms)**: Permite ajustar la duración de los desvanecimientos automáticos al inicio y al final de cada track.
- **Crossfade Duration (ms)**: Define el tiempo de solapamiento entre dos tracks cuando el modo "Cross" está activo.
- **Curva de Fade**: El Dashboard permite elegir si el fade es lineal o exponencial (más natural al oído humano).

### 2. Configuración del SPL Meter (Medidor de Nivel)
- **SPL Target (dB)**: Permite definir el nivel de volumen objetivo para el show (ej: "Studio", "Small Venue", "Hall").
- **Visualización de Pico (Peak Hold)**: Muestra el nivel máximo alcanzado recientemente para evitar distorsiones.

### 3. Parámetros de Flow (Auto-Next)
- **Playback Gap (ms)**: Tiempo de silencio obligatorio entre tracks cuando no hay crossfade activo. 
- **Auto-Stop en el Final**: Configura si la app se detiene al terminar el setlist o si vuelve a empezar (Loop).

### 4. Visualización de Curva (Energy Chart)
- **Visibilidad de la Curva**: Activa o desactiva la capa visual de energía sobre la waveform.
- **Escala de Gráfico**: Permite expandir o contraer la visualización de la curva para ajustarla al tamaño de la pantalla.

## Comportamiento del Componente (UX)
- **Panel Desplegable**: Para ahorrar espacio en la vista principal, el Dashboard suele ser un cajón (Drawer) o una sección colapsable que no interfiere con la visualización del reproductor.
- **Acceso Directo**: Los parámetros críticos están a un solo clic de distancia, con selectores grandes y fáciles de manejar.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Lee las preferencias del usuario desde el **SettingsStore**.
- **Acciones (Output)**: Envía actualizaciones al **SettingsStore**, las cuales se persisten automáticamente en el almacenamiento local para la siguiente sesión.

---
*El Dashboard es el cerebro logístico de SuniPlayer, permitiendo que cada show tenga su propia configuración técnica a medida.*
