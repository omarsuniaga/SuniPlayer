---
ruta: docs/diccionario/00-diccionario-dominio.md
tipo: diccionario
origen: "[[INDEX]]"
estado: estable
---

# Diccionario de Dominio (Glosario Canónico)

Este documento define el lenguaje canónico utilizado en todo el ecosistema de Suniplayer V2 (especificaciones, vistas y componentes).

---

## Términos del Dominio

### Colección Inteligente
Agrupación de canciones generada automáticamente por el sistema.
- **Subtipos:** Curvas de ánimo/BPM (Lineal, Curva de campana, Escalada exponencial) e Inteligente por reproducciones (Más Reproducidas).
- **Productor:** [[10-algoritmo-mood]]
- **Documento dueño:** [[02-modelo-colecciones]]

### QuouList (Cola dinámica)
Lista temporal de canciones que se reproducen inmediatamente después del track actual. Se gestiona en caliente por el usuario durante un ensayo o show.
- **Documento dueño:** [[02-modelo-colecciones]]
- **Ecos en UI:** [[02-vista-reproductor]], [[04-vista-show]]

### Set
Lista fija de reproducción que el músico prepara y afina antes de un concierto. Define la lista física de temas y los ajustes persistentes de tono, velocidad y transiciones.
- **Documento dueño:** [[02-modelo-colecciones]]
- **Ecos en UI:** [[05-vista-edit]], [[04-vista-show]]

### Playlist
Agrupación estándar de canciones creada manualmente por el usuario. Permite el modo de reproducción aleatoria y repeticiones.
- **Documento dueño:** [[02-modelo-colecciones]]

### Tempo
Velocidad de reproducción del audio alterada por el músico, expresada como porcentaje (50% a 200%). No altera el tono.
- **Documento dueño:** [[01-modelo-audio]]
- **Componente ejecutor:** [[03-time-stretcher]]

### BPM
Beats Per Minute (Pulsos Por Minuto). Propiedad física rítmica analizada del archivo original.
- **Documento dueño:** [[01-modelo-audio]]
- **Componente ejecutor:** [[04-bpm-analyzer]]

### Gap
Tiempo de silencio en segundos (con precisión de milisegundos) que transcurre entre dos tracks consecutivos dentro de un Set.
- **Documento dueño:** [[02-modelo-colecciones]]
- **Componente ejecutor:** [[05-fade-engine]]

### Modos de Sesión (Escucha, Edit, Show)
Los tres contextos lógicos en los que opera la aplicación, definiendo permisos y políticas.
- **Documento dueño:** [[03-modelo-sesion]]

### Cronómetro de Sesión
Tiempo transcurrido en la app desde su apertura actual. Es volátil (se destruye al cerrar).
- **Documento dueño:** [[03-modelo-sesion]]
- **Componente ejecutor:** [[12-cronometro]]

### Cronómetro de Show
Cronómetro persistente activo durante un concierto, que muestra: `tiempo transcurrido + duración de la cola = tiempo total estimado`.
- **Documento dueño:** [[03-modelo-sesion]]
- **Componente ejecutor:** [[12-cronometro]]

### Marcador y Comentario
Punto en la línea de tiempo de una canción que contiene una anotación de texto recordatoria para el músico en escena.
- **Documento dueño:** [[01-modelo-audio]]
- **Componente ejecutor:** [[07-marcadores]]

### Loop A-B
Herramienta de práctica que repite cíclicamente el fragmento de audio delimitado entre el Punto A y el Punto B.
- **Componente ejecutor:** [[07-marcadores]]

### Jam Session
Modo de red multi-dispositivo (Fase 2) que permite la reproducción sincronizada en tiempo real mediante WebRTC y latencias NTP corregidas.
- **Documento dueño:** [[08-modelo-jam-session]]
- **Componente ejecutor:** [[17-jam-session]]

### Mute de Pánico
Botón de un solo tap que silencia la salida de audio de forma instantánea al 0% en caso de fallas acústicas en escena, sin detener el cronómetro.
- **Ecos en UI:** [[02-vista-reproductor]], [[04-vista-show]]

### Energía Rítmica
Clasificación cualitativa de una canción calculada por el sistema en cuatro niveles (Suave, Media, Alta, Muy Alta) según su BPM.
- **Documento dueño:** [[01-modelo-audio]]
- **Componente ejecutor:** [[04-bpm-analyzer]]

### Fades (FadeIn / FadeOut / FadeMix)
Efectos de rampa de ganancia de volumen aplicados al inicio, fin o transición cruzada entre audios.
- **Componente ejecutor:** [[05-fade-engine]]

### Mirror
Visor de cámara frontal espejada flotante sobre la UI para que el músico controle su digitación y postura física.
- **Componente ejecutor:** [[08-mirror]]

### Inicio y Fin Personalizado (Corte)
Marcas de tiempo en las que el usuario delimita el inicio y fin efectivo de reproducción de un archivo de audio (corte de silencios o intros).
- **Documento dueño:** [[01-modelo-audio]]
