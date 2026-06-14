---
ruta: docs/especificaciones/01-modelo-audio.md
tipo: especificacion
origen: "[[00-vision-general]]"
estado: estable
---

# Modelo de Audio (La Canción)

## Función

Definir la unidad fundamental del sistema: qué es una canción en Suniplayer, qué propiedades la componen y cómo se relaciona con el resto del sistema.

## Entrada

- Marco de referencia del sistema ← [[00-vision-general]]
- BPM y energía analizados ← [[04-bpm-analyzer]]
- Canciones importadas por el usuario ← [[03-vista-libreria]]

## Proceso

El modelo de audio describe una canción como un objeto compuesto por cuatro capas: propiedades físicas extraídas del archivo, propiedades calculadas por análisis automático, ajustes persistentes del músico y configuraciones de presentación efímeras. Cada capa tiene distinto ciclo de vida y responsable de escritura.

## Salida

- Canción con todas sus propiedades → [[01-audio-engine]]
- Unidades a agrupar en colecciones → [[02-modelo-colecciones]]
- Qué datos persistir y en qué tablas → [[04-almacenamiento]]
- Archivo asociado (imagen/PDF) → [[09-partituras]]
- Propiedades filtrables (BPM, energía, formato) → [[11-filtros]]

## Errores

- **Lógico:** el archivo referenciado por `ruta_archivo` no existe o no es legible en el momento de reproducción (fue movido o borrado) — la canción queda en estado "sin fuente"; se resuelve con caché local o reimportación.
- **Semántico:** `tono_ajuste` ya está en +12 y el músico intenta aplicar otro +12 adicional — el valor resultante superaría el rango definido (-12 a +12); la operación se rechaza con aviso.

Catálogo global: [[07-modelo-errores]]

---

## ¿Qué es una "Canción" en Suniplayer?

Es la unidad fundamental del sistema. Una canción no es solo un archivo .mp3 — es un **objeto con propiedades físicas, metadatos, y configuraciones de interpretación** que el músico puede ajustar.

---

## Propiedades físicas (lectura automática)

Son datos que Suniplayer extrae del archivo de audio al importarlo.

| Propiedad | Descripción | ¿Cómo se obtiene? |
|-----------|-------------|-------------------|
| Archivo original | Ruta al archivo .mp3, .wav, .ogg, .flac, .m4a | Del sistema de archivos |
| Duración total | Tiempo total en segundos | Metadata del archivo |
| Formato | Códec del archivo | Extensión y header |
| Tamaño | Peso del archivo en bytes | Sistema de archivos |
| Tasa de muestreo | 44100 Hz, 48000 Hz, etc. | Header del archivo |
| Bits por muestra | 16, 24, 32 | Header del archivo |
| Canales | Mono o estéreo | Header del archivo |

## Propiedades analizadas (cálculo automático)

Suniplayer procesa el audio al importarlo y calcula:

| Propiedad | Descripción | Rango típico |
|-----------|-------------|--------------|
| BPM | Beats per minute — velocidad rítmica | 60-200 |
| Tono original | Tonalidad fundamental estimada | Do, Re, Mi, etc. |
| Amplitud media | Volumen promedio | 0.0 - 1.0 |
| Picos | Secciones de mayor intensidad | Lista de timestamps |
| Silencios | Pausas detectadas en el audio | Lista de timestamps |
| Energía general | Clasificación gruesa según BPM | Suave, Media, Alta |

Estas propiedades no las ingresa el usuario: las calcula el componente [[04-bpm-analyzer]] al importar la canción y quedan guardadas como parte del modelo.

> **Nota terminológica:** En Suniplayer, "Tempo" refiere a la velocidad de reproducción expresada como porcentaje (50%–200%); el BPM es una propiedad analizada del archivo de audio que indica el pulso rítmico original de la canción. Son cosas distintas: el BPM describe la canción tal como es; el Tempo es el ajuste que el músico aplica para reproducirla más rápido o más lento.

## Propiedades ajustables por el usuario

Son cambios que el músico hace y que la app recuerda para siempre.

| Propiedad | Descripción | Default |
|-----------|-------------|---------|
| Nombre visible | Cómo se muestra en la UI (puede diferir del nombre del archivo). Es editable por el usuario. El archivo físico NO se renombra — se preserva intacto en el filesystem. | Nombre del archivo |
| Tono | Desplazamiento en semitonos (-12 a +12) | 0 (tono original) |
| Tempo | Velocidad como porcentaje (50% a 200%) | 100% |
| Volumen | Ganancia individual de la canción | 75% |
| Inicio | Timestamp donde empieza la reproducción (corte de intro) | 00:00 |
| Fin | Timestamp donde termina la reproducción (corte de outro) | Duración total |
| FadeIn | ¿Activar fade in al inicio? Duración en segundos | 0 (desactivado) |
| FadeOut | ¿Activar fade out al final? Duración en segundos | 0 (desactivado) |
| Imagen/Partitura | Archivo opcional asociado (PDF, JPG, PNG) | Ninguno |
| Contador de reproducciones | Número de veces que se reprodujo | 0 |

> **Nota sobre el Gap:** el Gap (silencio entre canciones, default 1 segundo) NO es una propiedad de la canción individual. Es una configuración de transición que pertenece al Set o a la relación entre dos canciones consecutivas. La tabla de propiedades de canción no lo incluye por esa razón.

## Propiedades del set (se pierden al salir del modo Show)

Estas son configuraciones de una presentación en vivo — no se guardan con la canción.

| Propiedad | Descripción |
|-----------|-------------|
| En cola | ¿Está en la QuouList para sonar después de la actual? |
| Orden en el set | Posición dentro de la presentación actual |
| Transición | ¿FadeIn/Out configurado para esta transición específica? |

## Marcadores y comentarios

Cada canción puede tener N marcadores en su línea de tiempo:

```text
Canción "La Mejor.mp3"
  ├── Marcador 1: 00:23 — "Entra guitarra"
  ├── Marcador 2: 01:15 — "Sube volumen, viene el coro"
  └── Marcador 3: 02:47 — "Casi termina, preparar siguiente"
```

Cada marcador tiene:
- **Timestamp** (posición en segundos)
- **Texto** (lo que el músico quiere recordar)
- **Color** (opcional, para categorizar: rojo = peligro, verde = entrada, etc.)

## Representación gráfica del modelo

En lenguaje natural, una canción en Suniplayer es:

```text
un ARCHIVO DE AUDIO
  + sus METADATOS físicos (duración, formato, etc.)
  + análisis AUTOMÁTICO (BPM, tono estimado)
  + ajustes del MÚSICO (tono, tempo, in/out, volumen)
  + contenido ASOCIADO (partitura, imagen)
  + MARCADORES en la línea de tiempo
  + un CONTADOR de reproducciones
  + configuraciones de TRANSICIÓN (fade)
```

## Lo que NO es una canción en Suniplayer

- No es un streaming (no hay URL remota).
- No es un video.
- No es una grabación en vivo hecha desde la app.
