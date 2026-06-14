  
**SYNCENSEMBLE**

Plataforma de Ensayo Colaborativo Sincronizado

Especificación Técnica v1.0

Autor: Omar Suniaga

Fecha: Abril 2026

Estado: Borrador Inicial

**CONFIDENCIAL**

# **1\. Resumen Ejecutivo**

SyncEnsemble es una aplicación multiplataforma (iPad/tablet/móvil) diseñada para transformar la experiencia de ensayo de músicos de ensamble. Resuelve la fragmentación actual donde cada músico utiliza herramientas aisladas (reproductores individuales, partituras en PDF, notas en WhatsApp) al unificar tres capacidades críticas en un solo entorno colaborativo:

1. Reproducción de audio sincronizada con precisión sub-frame entre múltiples dispositivos.

2. Partituras colaborativas con anotaciones en tiempo real al estilo Google Docs.

3. Gestión de sesión de ensayo con marcadores compartidos, historial y persistencia.

**Mercado objetivo:** Trios, cuartetos, ensambles de cámara, bandas, y secciones orquestales que ensayan repertorio con grabaciones de referencia. Caso de uso primario: músicos de hoteles y eventos con repertorio rotativo extenso.

# **2\. Declaración del Problema**

Los músicos de ensamble enfrentan tres fricciones críticas en cada sesión de ensayo:

| Fricción | Impacto | Solución Actual |
| :---- | :---- | :---- |
| Cada músico reproduce el audio por separado | Desfase temporal, pérdida de contexto compartido | Bluetooth a una sola bocina (sin control individual) |
| Las anotaciones son privadas | Se pierden entre ensayos, no se comparten | Notas en papel, fotos de WhatsApp |
| Las partituras no están vinculadas al audio | Hay que buscar manualmente el compás | Partituras en PDF separadas del reproductor |

# **3\. Arquitectura de Alto Nivel**

## **3.1 Principios Arquitectónicos**

* Offline-first: la app debe funcionar sin conexión a internet. La sincronización entre dispositivos ocurre vía red local (WiFi Direct / LAN).

* Cloud-optional: la nube se usa para persistencia, backup y acceso asíncrono, pero nunca es requisito para el ensayo en tiempo real.

* Leader-follower: un dispositivo actúa como master clock; los demás se sincronizan a él.

* Event-sourced annotations: todas las anotaciones se almacenan como eventos inmutables con timestamps, permitiendo merge sin conflictos.

## **3.2 Capas del Sistema**

| Capa | Responsabilidad | Tecnología Candidata |
| :---- | :---- | :---- |
| UI/Presentación | Interfaz de usuario, renderizado de partituras, visualización de waveform | React Native / Flutter \+ Canvas/WebGL |
| Lógica de Aplicación | Gestión de sesiones, estado de reproducción, merging de anotaciones | State machine (XState), CRDT engine |
| Motor de Audio | Reproducción, sincronización temporal, compensación de latencia | Nativo (AVAudioEngine iOS / Oboe Android) |
| Networking P2P | Descubrimiento de dispositivos, transporte de datos, transferencia de archivos | Multipeer Connectivity (Apple) / Nearby Connections (Google) |
| Persistencia Local | Almacenamiento de audio, partituras, anotaciones, sesiones | SQLite \+ sistema de archivos local |
| Sincronización Cloud | Backup, acceso remoto, merge de sesiones | Firebase Firestore / Supabase |

# **4\. Dominios Funcionales Detallados**

## **4.1 Gestión de Sesión (Session Domain)**

Una sesión es la unidad central de trabajo. Representa un ensayo (o serie de ensayos) donde un grupo de músicos trabaja sobre un repertorio común.

### **4.1.1 Ciclo de Vida de la Sesión**

1. Creación: un usuario crea la sesión y se convierte en líder.

2. Descubrimiento: los dispositivos cercanos detectan la sesión activa vía broadcast local.

3. Conexión: cada dispositivo solicita unirse; el líder aprueba o rechaza.

4. Ensayo activo: reproducción sincronizada, anotaciones en tiempo real.

5. Pausa/Reanudación: cualquiera puede pausar (se notifica a todos).

6. Cierre: el líder cierra la sesión; todo se persiste localmente.

7. Sync a nube: si hay internet, los datos se sincronizan para acceso futuro.

### **4.1.2 Roles**

| Rol | Permisos | Transferible |
| :---- | :---- | :---- |
| Líder (creador) | Control total: aprobar miembros, gestionar audio, pausar/reanudar global, cerrar sesión, asignar partes | Sí, a cualquier miembro |
| Miembro | Reproducir/pausar (local o global según config), anotar, agregar marcadores, compartir archivos | N/A |

## **4.2 Motor de Sincronización de Audio (Sync Engine)**

**Este es el componente técnico más crítico.** El objetivo es que N dispositivos reproduzcan el mismo audio con un desfase máximo de 5ms (imperceptible para el oído humano a nivel de ensamble).

### **4.2.1 Protocolo de Sincronización de Reloj**

Se utiliza un esquema inspirado en NTP (Network Time Protocol) adaptado a redes locales:

1. El líder transmite su timestamp de alta precisión (monotonic clock) periódicamente.

2. Cada follower calcula el round-trip time (RTT) y estima el offset de su reloj respecto al líder.

3. Se aplica un filtro de mediana sobre múltiples muestras para eliminar outliers de latencia.

4. El offset calculado se usa para ajustar el momento exacto de inicio de reproducción.

### **4.2.2 Comandos de Transporte**

| Comando | Emisor | Comportamiento |
| :---- | :---- | :---- |
| PLAY(timestamp, position) | Líder | Todos inician reproducción en el timestamp indicado, en la posición del audio especificada |
| PAUSE(timestamp) | Cualquiera | Todos pausan simultáneamente. Se registra la posición exacta |
| SEEK(position) | Líder | Todos saltan a la posición indicada |
| STOP | Líder | Detiene reproducción y resetea posición a 0 |

***Nota sobre PAUSE por cualquier miembro:** Cuando un miembro pausa, se envía un comando de pausa global con su timestamp corregido. Todos los dispositivos pausan en el mismo punto del audio. Esto es intencional: en un ensayo real, cualquiera puede decir “para, revisemos eso”.*

### **4.2.3 Compensación de Latencia Bluetooth**

El dispositivo líder conectado a un speaker Bluetooth tiene una latencia adicional (típicamente 40–200ms según codec: SBC, AAC, aptX). Para compensar:

* El líder mide su latencia Bluetooth al conectar (enviando un pulso y midiendo el delay).

* El líder inicia su reproducción interna X ms antes que los followers, donde X es la latencia Bluetooth estimada.

* Los followers reproducen por su speaker/auriculares local sin compensación adicional.

## **4.3 Gestión de Audio (Audio Library)**

### **4.3.1 Importación y Distribución**

Cuando un miembro importa un archivo de audio desde su almacenamiento local:

4. El archivo se registra en la biblioteca de la sesión con metadata (nombre, duración, formato, tamaño).

5. Se notifica a todos los dispositivos que hay un nuevo track disponible.

6. Los dispositivos que no tienen el archivo inician una transferencia P2P automática (WiFi Direct o LAN).

7. Se muestra progreso de descarga en cada dispositivo.

8. Una vez descargado, el archivo queda en almacenamiento local permanente (no se borra al cerrar sesión).

### **4.3.2 Formatos Soportados**

| Formato | Extensión | Prioridad | Notas |
| :---- | :---- | :---- | :---- |
| MPEG Audio Layer 3 | .mp3 | Alta | Más común, buena compatibilidad |
| WAV/PCM | .wav | Alta | Sin compresión, ideal para calidad |
| AAC | .m4a | Media | Estándar Apple |
| FLAC | .flac | Media | Lossless, archivos grandes |
| OGG Vorbis | .ogg | Baja | Open source, menos común |

### **4.3.3 Metadata del Track**

Cada track almacena la siguiente información editable por cualquier miembro:

* Título de la obra / canción

* Compositor / Arreglista

* Tempo (BPM) — puede ser múltiple para obras con cambios de tempo

* Tonalidad

* Duración (auto-detectada)

* Notas generales del track

## **4.4 Marcadores y Anotaciones en Timeline (Audio Annotations)**

Los marcadores son puntos de interés sobre la línea de tiempo del audio, visibles como indicadores en la barra de progreso (similar a capítulos de YouTube).

### **4.4.1 Tipos de Marcador**

| Tipo | Visibilidad | Ejemplo de Uso |
| :---- | :---- | :---- |
| Marcador compartido | Todos los dispositivos | Marca la entrada del segundo violín, señalar un corte, indicar un cambio de carácter |
| Marcador personal | Solo el dispositivo que lo creó | Nota personal: “practicar este pasaje”, “revisar afinación” |

### **4.4.2 Estructura de un Marcador**

Cada marcador contiene:

* Posición temporal (en ms desde el inicio del track)

* Etiqueta corta (máx 50 caracteres)

* Nota extendida (texto libre, opcional)

* Categoría/color (dinámica, ritmo, afinación, forma, libre)

* Autor (usuario que lo creó)

* Timestamp de creación

### **4.4.3 Persistencia**

Los marcadores compartidos se sincronizan en tiempo real durante la sesión y se persisten al cierre. En la siguiente sesión con el mismo track, todos los marcadores anteriores están disponibles inmediatamente, creando un historial acumulativo de anotaciones de ensayo.

## **4.5 Partituras Colaborativas (Score Collaboration)**

Esta capa permite adjuntar, visualizar y anotar partituras en tiempo real, con un modelo de colaboración inspirado en Google Docs.

### **4.5.1 Adjuntar Partituras**

* Cualquier miembro puede adjuntar un archivo de partitura (PDF o imagen) a un track de audio.

* Cada miembro puede adjuntar su propia parte (ej. Violín 1, Violín 2, Cello).

* La partitura se distribuye a todos los dispositivos mediante el mismo mecanismo P2P del audio.

* La partitura queda vinculada permanentemente al track.

### **4.5.2 Anotaciones en Tiempo Real**

El sistema de anotación sobre partituras funciona como una capa transparente superpuesta al PDF/imagen:

* Cada usuario tiene un color asignado (automáticamente, como Google Docs: azul, verde, naranja, etc.).

* Herramientas de anotación: lápiz libre (dibujo a mano), texto, símbolos musicales predefinidos (arcos, dinámicas, digitaciones, arcadas).

* Las anotaciones se transmiten en tiempo real a todos los dispositivos vía la red P2P.

* Cada dispositivo puede mostrar/ocultar las anotaciones de usuarios específicos.

* Se mantiene un historial de versiones: se puede volver a la partitura limpia o a un estado anterior.

### **4.5.3 Modelo de Datos de Anotación (CRDT)**

Para evitar conflictos cuando dos usuarios anotan simultáneamente, se utiliza un modelo CRDT (Conflict-free Replicated Data Type):

* Cada anotación es un evento inmutable con: ID único, autor, timestamp, tipo de trazo, coordenadas, página.

* Los eventos se ordenan por timestamp lógico (Lamport clock), no por reloj físico.

* Borrar una anotación genera un evento de eliminación (tombstone), no borra el original.

* Al reconectarse después de un período offline, los eventos se mergean automáticamente sin conflictos.

# **5\. Stack Tecnológico Recomendado**

| Componente | Opción Recomendada | Alternativa | Justificación |
| :---- | :---- | :---- | :---- |
| Framework UI | Flutter | React Native | Rendimiento canvas nativo para partituras, un solo codebase iOS/Android/tablet |
| Motor de Audio | APIs nativas (AVAudioEngine / Oboe) | flutter\_sound | Precisión sub-ms requiere acceso directo al hardware de audio |
| Networking P2P | Nearby Connections (Google) \+ Multipeer (Apple) | WiFi Direct raw | APIs de alto nivel con descubrimiento automático |
| CRDT Engine | Yjs | Automerge | Maduro, bien documentado, soporte para awareness (cursores, presencia) |
| Base de Datos Local | SQLite (drift/sqflite) | Hive/Isar | SQL estándar, migraciones robustas, probado en producción |
| Cloud Sync | Firebase Firestore | Supabase | Ya tienes experiencia, buen soporte offline, real-time listeners |
| Renderizado PDF | pdf\_render \+ custom canvas overlay | pdfx | Necesitamos capa de anotación custom sobre el PDF |
| Waveform Display | Custom Canvas painter | audio\_waveforms pkg | Control total para marcadores interactivos |

# **6\. Modelo de Datos (Entidades Principales)**

**Session**

| Campo | Tipo | Descripción |
| :---- | :---- | :---- |
| id | UUID | Identificador único |
| name | String | Nombre del ensayo/sesión |
| leader\_id | UUID | Usuario líder actual |
| members\[\] | UUID\[\] | Lista de miembros conectados |
| tracks\[\] | TrackRef\[\] | Referencias a tracks de la sesión |
| created\_at | DateTime | Fecha de creación |
| last\_active | DateTime | Última actividad |
| status | Enum | active | paused | closed |

**Track**

| Campo | Tipo | Descripción |
| :---- | :---- | :---- |
| id | UUID | Identificador único |
| title | String | Nombre de la obra |
| composer | String? | Compositor |
| arranger | String? | Arreglista |
| tempo\_bpm | Int\[\] | Tempo(s) de la obra |
| key\_signature | String? | Tonalidad |
| duration\_ms | Int | Duración en milisegundos |
| file\_hash | String | Hash SHA-256 del archivo de audio |
| file\_path | String | Ruta local del archivo |
| scores\[\] | ScoreRef\[\] | Partituras adjuntas |
| markers\[\] | MarkerRef\[\] | Marcadores del track |

**Marker**

| Campo | Tipo | Descripción |
| :---- | :---- | :---- |
| id | UUID | Identificador único |
| track\_id | UUID | Track al que pertenece |
| position\_ms | Int | Posición en el audio (ms) |
| label | String(50) | Etiqueta corta |
| note | String? | Nota extendida |
| category | Enum | dynamics | rhythm | intonation | form | free |
| shared | Boolean | Compartido vs personal |
| author\_id | UUID | Quién lo creó |
| created\_at | DateTime | Timestamp de creación |

**ScoreAnnotation**

| Campo | Tipo | Descripción |
| :---- | :---- | :---- |
| id | UUID | Identificador único (Lamport \+ node ID) |
| score\_id | UUID | Partitura anotada |
| author\_id | UUID | Quién la creó |
| page | Int | Página de la partitura |
| type | Enum | stroke | text | symbol |
| data | JSON | Coordenadas, contenido, estilo |
| color | String | Color asignado al usuario |
| timestamp | LamportClock | Reloj lógico para ordenamiento CRDT |
| deleted | Boolean | Tombstone para eliminación suave |

# **7\. Flujo de Sincronización de Audio (Detalle Técnico)**

El siguiente flujo describe cómo se logra la reproducción sincronizada entre N dispositivos:

**Fase 1: Calibración de Reloj (al unirse a la sesión)**

8. El follower envía PING con su timestamp local T1.

9. El líder recibe en T2, responde PONG con {T2, T3} (T3 \= timestamp de envío del PONG).

10. El follower recibe en T4. Calcula: RTT \= (T4-T1) \- (T3-T2); Offset \= ((T2-T1) \+ (T3-T4)) / 2\.

11. Se repite 10 veces, se toma la mediana del offset.

12. Se recalibra cada 30 segundos durante la sesión.

**Fase 2: Comando de Reproducción**

5. El líder decide reproducir. Calcula: target\_time \= now \+ 200ms (buffer de preparación).

6. Envía PLAY(target\_time\_leader\_clock, audio\_position) a todos.

7. Cada follower convierte target\_time a su reloj local usando su offset calibrado.

8. Cada follower pre-carga el buffer de audio y programa el inicio exacto con un timer de alta precisión.

9. El líder aplica su compensación de latencia Bluetooth (si aplica) iniciando X ms antes.

**Fase 3: Mantenimiento**

* Cada 5 segundos, el líder envía su posición actual de reproducción.

* Los followers comparan y aplican micro-ajustes de velocidad (0.1%) para corregir drift gradual, en lugar de saltos audibles.

# **8\. Requisitos No Funcionales**

| Requisito | Métrica | Prioridad |
| :---- | :---- | :---- |
| Precisión de sincronización | ≤ 5ms de desfase entre dispositivos en red local | Crítica |
| Latencia de anotaciones | ≤ 100ms para ver anotación de otro usuario | Alta |
| Tiempo de transferencia P2P | ≤ 30s para un archivo de 10MB en WiFi local | Media |
| Funcionamiento offline | 100% de features core sin internet | Crítica |
| Dispositivos simultáneos | 2–8 dispositivos por sesión | Alta |
| Formatos de partitura | PDF, PNG, JPG | Alta |
| Consumo de batería | ≤ 15% por hora de ensayo activo | Media |
| Almacenamiento | ≤ 50MB para la app sin contenido | Media |

# **9\. Fases de Desarrollo (Roadmap)**

**Fase 1 — MVP (3–4 meses)**

Objetivo: validar la sincronización de audio entre 2–3 dispositivos.

* Sesión básica: crear, unirse, líder/miembro.

* Reproducción sincronizada con protocolo de reloj.

* Importar audio desde almacenamiento local.

* Transferencia P2P de archivos de audio.

* Marcadores básicos (compartidos, sin categorías).

* Una plataforma: iOS (iPad) o Android tablet.

**Fase 2 — Partituras (2–3 meses)**

Objetivo: integrar partituras con anotaciones colaborativas.

* Adjuntar PDF/imagen de partitura a tracks.

* Visualizador de partituras con zoom y navegación por páginas.

* Capa de anotación: lápiz, texto, colores por usuario.

* Sincronización de anotaciones en tiempo real (CRDT).

* Historial de versiones de anotaciones.

**Fase 3 — Pulido y Nube (2–3 meses)**

Objetivo: persistencia en la nube y experiencia completa.

* Sincronización con Firebase/Supabase.

* Biblioteca de repertorio persistente.

* Historial de sesiones de ensayo.

* Marcadores con categorías y filtros.

* Soporte multiplataforma (iOS \+ Android).

* Símbolos musicales predefinidos para anotaciones.

* Metrónomo sincronizado.

**Fase 4 — Avanzado (futuro)**

* Grabación de ensayo.

* Loop A-B sincronizado.

* Cambio de tempo sin cambio de pitch.

* Ensayo híbrido remoto (WebRTC).

* Integración con metadatos de partituras digitales (MusicXML).

# **10\. Riesgos Técnicos y Mitigaciones**

| Riesgo | Severidad | Mitigación |
| :---- | :---- | :---- |
| Latencia Bluetooth variable e impredecible | Alta | Medir latencia al conectar, recalibrar periódicamente. Considerar reproducción por speaker del dispositivo como fallback |
| Drift de reloj entre dispositivos | Media | Recalibración cada 30s \+ micro-ajustes de velocidad de reproducción (no saltos) |
| Fragmentación Android en APIs de audio | Alta | Usar Oboe (Google) que abstrae las diferencias. Testing extensivo en dispositivos populares |
| Multipeer vs Nearby Connections incompatibles | Alta | Si el grupo es mixto (iOS+Android), usar WiFi LAN como fallback común con descubrimiento mDNS |
| Archivos grandes saturan la red P2P | Media | Compresión previa, transferencia en chunks con resume, límite de 100MB por archivo |
| Conflictos de anotaciones simultáneas | Baja | CRDT por diseño elimina conflictos; cada anotación es un evento independiente |

# **11\. Nombre de Producto (Propuestas)**

Propuestas de nombre para la plataforma:

| Nombre | Concepto | Disponibilidad Estimada |
| :---- | :---- | :---- |
| SyncEnsemble | Sincronización \+ ensamble musical | Alta (nicho específico) |
| RehearsalSync | Directamente descriptivo | Media |
| Tutti | Término musical: todos juntos | Baja (común) |
| Unisono | Término musical: al unísono | Media |
| EnsembleHub | Centro de ensamble | Media |

**Recomendación: SyncEnsemble** comunica inmediatamente las dos propuestas de valor clave (sincronización \+ ensamble) y tiene alta probabilidad de disponibilidad como dominio y en app stores.