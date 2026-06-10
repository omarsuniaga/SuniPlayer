---
ruta: docs/componentes/11-filtros.md
tipo: componente
origen: "[[01-vista-inicio]]"
estado: estable
---

# Sistema de Filtros

## Función

Filtrar y ordenar colecciones de canciones y listas de la librería según criterios estructurales (BPM, duración, tipo de curva, formato, cache local); y entregar los conjuntos filtrados resultantes a las vistas correspondientes.

## Entrada

- Propiedades físicas y de análisis del modelo de audio ← [[01-modelo-audio]]
- Criterios de filtrado seleccionados por el usuario desde la pantalla principal ← [[01-vista-inicio]]
- Criterios de filtrado de canciones seleccionados desde la biblioteca ← [[03-vista-libreria]]

## Proceso

1. **Recopilación:** Recibe el conjunto completo de datos (canciones o colecciones) a procesar.
2. **Evaluación de Reglas:** Aplica las reglas lógicas seleccionadas mediante evaluación condicional (AND lógico):
   - **Duración:** Rango min/max en minutos.
   - **Curva de Energía:** Filtra por lineal, campana o exponencial (sólo para Colecciones Inteligentes).
   - **BPM/Energía:** Rangos de BPM clasificados (Suave `60-85`, Media `86-115`, Alta `116-140`, Muy Alta `141-200`).
   - **Formatos y Persistencia:** Filtra canciones según formato de archivo (.mp3, .wav, etc.) o estado de cache local (IndexedDB/física).
3. **Ordenamiento:** Aplica el criterio de ordenamiento secundario (por fecha, reproducciones, BPM o alfabético).
4. **Retorno:** Si el conjunto resultante está vacío, notifica un estado sin resultados para renderizar un aviso de limpieza de filtros.

## Salida

- Colecciones filtradas y ordenadas para renderizar → [[01-vista-inicio]]
- Lista de canciones filtradas para la biblioteca → [[03-vista-libreria]]

## Errores

- **Lógico:** se envían criterios de filtrado contradictorios (ej: duración máxima menor que duración mínima) — el componente corrige el rango forzando a que `max = min` y ejecuta la consulta de forma segura.
- **Semántico:** la consulta resulta en cero coincidencias — el componente devuelve un arreglo vacío (`[]`) y activa la bandera visual de error semántico de "Sin Coincidencias" en la UI.

Catálogo global: [[07-modelo-errores]]

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

### 2. Filtro por tipo de curva

Muestra solo colecciones que tienen un tipo específico de curva de energía.

```text
[✓] Lineal
[✓] Curva
[ ] Exponencial
```

### 3. Filtro por energía

Muestra colecciones cuyo rango de BPM cae dentro de una categoría de energía.

- **Suave:** 60-85 BPM
- **Media:** 86-115 BPM
- **Alta:** 116-140 BPM
- **Muy Alta:** 141-200 BPM

---

## Dónde aparece cada filtro

| Vista | Filtros disponibles |
|-------|-------------------|
| Inicio (sección colecciones inteligentes) | Por tipo de curva, por duración, por energía |
| Inicio (sección playlists) | Por duración, por cantidad de canciones |
| Librería | Por formato, por energía, por BPM, por estado de cache |
| Reproductor | Filtro rápido de búsqueda |
