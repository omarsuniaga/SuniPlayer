# Partituras (Sheet Music)

## ¿Qué es?

Un sistema que permite **asociar archivos de imagen o PDF** a una canción. Estos archivos contienen la **partitura** o el **sheet music** de la canción, y se pueden visualizar mientras suena el audio.

---

## ¿Para qué sirve?

```text
🎻 Violinista: tiene la partitura en pantalla mientras toca.
🎤 Cantante: tiene la letra con anotaciones.
🎹 Pianista: ve los acordes mientras suena la pista.
🎸 Guitarrista: tiene el tablatura sincronizada.
🥁 Baterista: ve la notación rítmica.
```

---

## Flujo de uso

### Asociar una partitura a una canción

```text
Desde la vista Edit (o Reproductor → Info de canción):
1. Usuario toca "Cargar partitura"
2. Se abre el explorador de archivos del dispositivo
3. Usuario selecciona: .pdf, .jpg, .png, .gif
4. El archivo se copia al almacenamiento interno de Suniplayer
5. La partitura queda asociada a la canción
```

### Ver la partitura durante la reproducción

```text
1. Canción está sonando
2. Usuario toca el botón "📄 Partitura"
3. La partitura se abre en pantalla completa o semi-pantalla
4. Se puede hacer scroll, zoom, y navegar entre páginas (si es PDF)
5. La partitura se puede cerrar en cualquier momento
```

---

## Visualización

### Vista de partitura en pantalla

```text
┌──────────────────────────────────────────┐
│  🎵 Salsa Brava              [✕ Cerrar] │
├──────────────────────────────────────────┤
│                                          │
│   ┌────────────────────────────────┐     │
│   │                                │     │
│   │    [PARTITURA / PDF / IMAGEN]  │     │
│   │                                │     │
│   │    (contenido del archivo)     │     │
│   │                                │     │
│   │                                │     │
│   └────────────────────────────────┘     │
│                                          │
│  Página 1 de 4      [◀] [▶]    75%      │
├──────────────────────────────────────────┤
│  ══════════════════════════════════════  │
│  00:42 ───────────●──────────── 03:45    │
│  [▶⏸] [◀◀] [▶▶]                    │
└──────────────────────────────────────────┘
```

**Elementos:**
- **Barra superior**: nombre de la canción, botón cerrar.
- **Área de la partitura**: muestra el contenido del archivo.
- **Controles de página**: si es PDF, navegar entre páginas.
- **Zoom**: slider para acercar/alejar (importante para leer en pantalla chica).
- **Barra de reproducción**: se mantiene visible para controlar el audio sin salir de la partitura.
- **Cabezal**: muestra la posición actual (el músico ve el tiempo mientras lee).

### Modo "Pantalla partida"

Si el dispositivo es grande (tablet, desktop), se puede ver:

```text
┌───────────────────┬──────────────────────┐
│                   │                       │
│   GRÁFICA DE      │                       │
│   ONDAS +         │     PARTITURA         │
│   CONTROLES       │                       │
│                   │                       │
│                   │                       │
└───────────────────┴──────────────────────┘
```

- Mitad izquierda: la gráfica de ondas y controles.
- Mitad derecha: la partitura.

---

## Formatos soportados

| Formato | Visualización | Scroll | Zoom | Páginas múltiples |
|---------|--------------|--------|------|-------------------|
| PDF | Renderizado página por página | No | Sí | Sí |
| JPG | Imagen completa | Vertical | Sí | No (un solo archivo) |
| PNG | Imagen completa | Vertical | Sí | No (un solo archivo) |
| GIF | Imagen completa (estático) | Vertical | Sí | No |

**Si el archivo no se puede visualizar:**
Mensaje: "No se pudo cargar esta partitura. ¿El archivo está dañado?"

---

## Almacenamiento

- La partitura se copia al almacenamiento interno de Suniplayer (no referencia al original por si se mueve).
- Ocupa espacio en el dispositivo — el usuario puede ver cuánto desde Perfil → Almacenamiento.
- Se puede eliminar la partitura de una canción sin borrar la canción.

---

## Relación con otros componentes

| Componente | Relación |
|-----------|----------|
| Modelo de Audio | La partitura es una propiedad opcional de la canción |
| Vista Reproductor | Botón para abrir la partitura |
| Vista Edit | Se puede cargar/quitar la partitura |

---

## Estados

| Estado | Comportamiento |
|--------|---------------|
| Sin partitura | El botón de partitura dice "Cargar partitura" |
| Con partitura | Botón dice "Ver partitura" |
| Visualizando | La partitura ocupa la pantalla (o mitad) |
| Cargando | Spinner mientras se renderiza el archivo |
| Error | "No se pudo cargar la partitura. Archivo corrupto o formato no soportado." |
