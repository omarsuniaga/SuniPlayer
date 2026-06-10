---
ruta: docs/componentes/09-partituras.md
tipo: componente
origen: "[[02-vista-reproductor]]"
estado: estable
---

# Partituras (Sheet Music)

## Función

Cargar y renderizar archivos asociados de partitura (PDF o imágenes); administrar la lista de timestamps programados para cambio automático de página; y responder a comandos físicos de pedalera o gestos para navegación de páginas.

## Entrada

- Archivo de imagen o PDF asociado a la canción ← [[01-modelo-audio]]
- Señales de cambio de página manuales y configuración de sincronización ← [[02-vista-reproductor]]
- Señales de cambio de página manuales desde el vivo ← [[04-vista-show]]
- Eventos físicos de cambio de página por pedalera Bluetooth ← [[15-sesion-audio]]

## Proceso

1. **Carga y Renderizado:** Al abrir la partitura de un track, lee la ruta local del archivo. Si es un PDF, utiliza un renderizador de páginas embebido; si es una imagen (JPG/PNG), la muestra en un contenedor con zoom pellizco táctil y scroll vertical.
2. **Sincronización Automática por Timestamp:**
   - Lee el array de transiciones programadas de la base de datos (ej: `[ {time: 45.5, page: 2}, {time: 92.1, page: 3} ]`).
   - Monitorea el flujo de reproducción del track. Cuando el tiempo transcurrido del audio cruza una marca configurada, renderiza de inmediato la página correspondiente.
   - En Modo Edit, permite agregar marcas de tiempo capturando la posición actual del audio con un botón "Fijar página en este instante".
3. **Navegación Manual Prioritaria:**
   - Permite cambiar de página usando botones táctiles `[◀]` / `[▶]`.
   - Permite cambiar de página recibiendo eventos de pedalera física mediada por [[15-sesion-audio]] (ej: Pedal 1 = Página siguiente; Pedal 2 = Página anterior).
   - Si el músico ejecuta un cambio de página manual (pedal o táctil) durante la reproducción, se suspende la sincronización automática de páginas durante esa reproducción para dar prioridad al control en vivo y evitar que la partitura retroceda sola si el músico decide improvisar.

## Salida

- Interfaz visual renderizada y transiciones de páginas → [[02-vista-reproductor]]
- Interfaz visual renderizada y transiciones de páginas en vivo → [[04-vista-show]]

## Errores

- **Lógico:** el archivo de partitura fue eliminado del almacenamiento local — la vista muestra un panel vacío con la alerta "Archivo de partitura no disponible".
- **Semántico:** se programa una transición automática a una página que excede el límite del documento PDF (ej: saltar a página 10 en un PDF de 4 páginas) — la operación se rechaza en Modo Edit y el marcador se ajusta al límite superior de páginas.

Catálogo global: [[07-modelo-errores]]

---

## Flujo de uso

### Asociar una partitura a una canción

Desde la vista Edit (o Reproductor → Info de canción):
1. Usuario toca "Cargar partitura"
2. Se abre el explorador de archivos del dispositivo
3. Usuario selecciona: .pdf, .jpg, .png, .gif
4. El archivo se copia al almacenamiento interno de Suniplayer
5. La partitura queda asociada a la canción

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
│  [▶/⏸] [◀◀] [▶▶]                           │
└──────────────────────────────────────────┘
```

**Elementos:**
- **Barra superior:** nombre de la canción, botón cerrar.
- **Área de la partitura:** muestra el contenido del archivo.
- **Controles de página:** si es PDF, navegar entre páginas.
- **Zoom:** slider para acercar/alejar.
- **Barra de reproducción:** se mantiene visible para controlar el audio sin salir de la partitura.
- **Cabezal:** muestra la posición actual.

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
