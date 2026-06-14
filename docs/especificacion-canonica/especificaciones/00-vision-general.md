# Visión General de Suniplayer

## ¿Qué es?

Suniplayer es un reproductor de audio diseñado específicamente para **músicos, cantantes e intérpretes**. No es un reproductor más — es una herramienta de trabajo que le da al músico control total sobre el audio en tiempo real.

## ¿Para quién?

- **Músicos** que necesitan practicar con canciones en diferente tono o velocidad.
- **Cantantes** que usan pistas para sus presentaciones y necesitan organizar sets en vivo.
- **Intérpretes** que requieren partituras sincronizadas con la reproducción.
- **DJs y productores** que analizan BPM y estructuran transiciones.

## ¿Qué lo diferencia de un reproductor común?

Un reproductor común (Spotify, VLC, Windows Media Player) reproduce archivos y ya. Suniplayer le da al músico control sobre **la materia prima del audio**:

| Capacidad | Reproductor común | Suniplayer |
|-----------|------------------|------------|
| Reproducir | Sí | Sí |
| Playlist | Sí | Sí |
| Cambiar tono | No | Sí (sin afectar velocidad) |
| Cambiar velocidad | No | Sí (sin afectar tono) |
| Analizar BPM | No | Sí |
| Fade entre canciones | No | Sí (FadeIn/Out/Mix) |
| Marcadores en canción | No | Sí |
| Partituras sincronizadas | No | Sí |
| Modo show en vivo | No | Sí |
| Cámara superpuesta (mirror) | No | Sí |
| Colecciones inteligentes por ánimo | No | Sí |

## ¿Dónde funciona?

Al ser una PWA (Progressive Web App), Suniplayer se instala en:

- Android
- iOS / iPad
- Windows
- Mac
- Cualquier navegador moderno

## Principios de diseño

1. **El músico primero**: cada decisión prioriza al usuario que está en un escenario o ensayando.
2. **Sin pérdida de calidad**: el procesamiento de audio (tono, velocidad) debe preservar la fidelidad.
3. **Modo show vs modo edit**: dos caras de la misma app. Edit para preparar, Show para ejecutar.
4. **Persistencia local**: todo se guarda en el dispositivo. Sin cloud obligatorio.
5. **Funciona offline**: una vez cargados los audios, la app es completamente funcional sin internet.
6. **Sin sorpresas en vivo**: el modo Show bloquea lo que pueda interrumpir una presentación.

## ¿Qué NO es Suniplayer?

- No es un editor de audio (no graba, no corta archivos).
- No es un servicio de streaming.
- No reemplaza un DAW (Ableton, Logic, etc.).

Es una herramienta de **interpretación y práctica**, no de producción.
