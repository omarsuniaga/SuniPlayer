# Sistema de Filtros

## ¿Qué es?

Un mecanismo para **filtrar y ordenar** colecciones (playlists, sets, colecciones inteligentes) según criterios definidos por el usuario. Aparece principalmente en la vista Inicio y en la vista Librería.

No es un buscador de texto (eso es el Buscador). Es un sistema de **filtros estructurales**.

---

## Tipos de filtro

### 1. Filtro por duración

Muestra solo colecciones que duran dentro de un rango específico.

```text
┌── FILTRO POR DURACIÓN ─────────────┐
│                                     │
│  Mostrar colecciones que duren:     │
│                                     │
│  [ 30 min ] a [ 45 min ]           │
│  ═══════════●══════════════════     │
│                                     │
│  Resultados: 3 colecciones          │
└─────────────────────────────────────┘
```

**Casos de uso:**
- "Mostrame solo los sets que entren en 30 minutos."
- "Quiero playlists de entre 20 y 40 minutos para mi viaje al trabajo."

### 2. Filtro por tipo de curva

Muestra solo colecciones que tienen un tipo específico de curva de energía.

```text
[✓] Lineal
[✓] Curva
[ ] Exponencial
```

**Casos de uso:**
- "Mostrame solo las colecciones lineales (BPM constante)."
- "Quiero ver las curvas de energía que preparé."

### 3. Filtro por energía

Muestra colecciones cuyo rango de BPM cae dentro de una categoría de energía.

```text
[ ] Suave (60-85 BPM)
[✓] Media (86-115 BPM)
[✓] Alta (116-140 BPM)
[ ] Muy Alta (141-200 BPM)
```

**Casos de uso:**
- "Mostrame colecciones de música tranquila."
- "Quiero solo música movida para bailar."

### 4. Filtro por cantidad de canciones

```text
[ 5 ] a [ 20 ] canciones
```

### 5. Filtro por estado

```text
[✓] Playlists
[✓] Sets
[✓] Colecciones Inteligentes
[ ] Vacías (colecciones sin canciones)
```

---

## Cómo se combinan los filtros

Los filtros se combinan con **AND lógico** (todos deben cumplirse):

```text
Ejemplo:
  Duración: 20-40 min
  Tipo: Lineal
  Energía: Media o Alta
  → Muestra colecciones que cumplen TODAS las condiciones
```

Si no hay resultados, se muestra:
```text
"Ninguna colección coincide con estos filtros.
Probá con criterios más amplios."
```

---

## Dónde aparece cada filtro

| Vista | Filtros disponibles |
|-------|-------------------|
| Inicio (sección colecciones inteligentes) | Por tipo de curva, por duración, por energía |
| Inicio (sección playlists) | Por duración, por cantidad de canciones |
| Librería | Por formato, por energía, por BPM, por estado de cache |
| Reproductor (cuando se agrega a cola desde librería) | Filtro rápido de búsqueda |

---

## Interfaz de usuario

Los filtros se activan desde un botón "Filtrar" (icono de embudo) en la barra superior de cada vista.

```text
Vista Inicio:
┌──────────────────────────────────────────┐
│  [Logo]      [🔍]   [Filtrar 🌀] [Perfil]│
├──────────────────────────────────────────┤
```

Al tocar "Filtrar", se abre un panel lateral o modal con las opciones de filtro disponibles para esa vista.

---

## Persistencia de filtros

| Comportamiento | Default |
|---------------|---------|
| ¿Los filtros se recuerdan al cerrar la app? | No |
| ¿Los filtros persisten al navegar entre vistas? | No (cada vista tiene sus propios filtros) |
| ¿Se puede guardar un filtro como favorito? | No (futura mejora posible) |

---

## Estados del filtro

| Estado | Comportamiento |
|--------|---------------|
| Sin filtros activos | Se muestran todas las colecciones |
| Filtros activos | Indicador visual en el botón de filtro (ej: "Filtrar • 3") |
| Sin resultados | Mensaje "No hay coincidencias" + botón "Limpiar filtros" |
| Limpiando | Al tocar "Limpiar filtros", se restablece la vista completa |
