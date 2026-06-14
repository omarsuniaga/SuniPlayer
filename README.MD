# Suniplayer

> ⚠️ **Documento de origen.** La especificación vigente y fuente de verdad está en `docs/INDEX.md`. Este archivo conserva el volcado inicial de ideas solo por valor histórico. No usarlo como referencia para implementación.

---

## Qué es Suniplayer

Un reproductor de audio con esteroides para músicos, cantantes e intérpretes. Se instala como PWA en Android, iOS, iPad, Windows, Mac y cualquier navegador moderno.

Funciona 100% offline. Todo se guarda localmente. Sin cloud obligatorio.

→ Especificación completa y fuente de verdad: [`docs/INDEX.md`](docs/INDEX.md)

---

## Notas de origen (sin curar)

El texto debajo es el brain-dump original. Se conserva solo por contexto histórico. Tiene imprecisiones terminológicas y features que fueron redefinidos o rechazados:

- **"álbum automático"** y **"generador de álbumes"** fueron redefinidos. El término canónico es **Colección Inteligente**. Ver `docs/especificaciones/02-modelo-colecciones.md`.
- **"álbum con las canciones más reproducidas"** fue redefinido como **Colección Inteligente: Más Reproducidas** (basada en contador de reproducciones, no en BPM). Ver `docs/especificaciones/02-modelo-colecciones.md`.
- **"captura de IPs"** fue **RECHAZADO**. Suniplayer es offline; capturar IPs sin servidor ni consentimiento no tiene sentido técnico ni legal. Ver `docs/especificaciones/05-telemetria.md`.
- **"cronómetro de escucha"** fue renombrado a **Cronómetro de Sesión**. Ver `docs/componentes/12-cronometro.md`.

---

```
Que es suniplayer?
Es un reproductor de audio con esteroides, dedicado para los usuarios musicos, cantantes o
interpretes, la idea principal es que usando una PWA, este reproductor pueda instalarse en
cualquier plataforma mobile, iphone, ipad, windows, mac, browser, etc.

Qué nos diferencia?
- Seleccionar desde donde empieza una cancion y donde termina.
- Cambiar el tono original de la cancion sin afectar la velocidad.
- Cambiar la velocidad sin que sufra la calidad.
- Creación de playlist y QuouList (lista de canciones en cola).
- Analizador de BPM para detectar el estado de animo de la cancion.
- Cambiar nombre de la canción (nombre visible, no el archivo original).
- Contadores de reproduccion de cada canción.
- Creador automatico inteligente de Colecciones Inteligentes (algoritmo que agrupa por BPM).
- Colección Inteligente: Más Reproducidas (basada en contador, no en BPM).
- Cronómetro de Sesión y Cronómetro de Show.
- Modo Edit (preparar) y Modo Show (ejecutar, bloqueado para edición).
- QuouList en Show: visualiza tiempo de cola + tiempo transcurrido.
- FadeIn, FadeOut, FadeMix.
- Marcadores con comentarios en la línea de tiempo.
- Partituras (PDF/imagen) sincronizadas con el audio.
- Mirror (cámara del dispositivo superpuesta).
- Gráfica de ondas (waveform).
- Base de datos local persistente.
- Tema dark/light.

Features RECHAZADOS durante la especificación:
- Captura de IPs: rechazado (ver docs/especificaciones/05-telemetria.md).
```
