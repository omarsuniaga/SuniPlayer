# CORE: STATE MANAGEMENT (Gestión de Estado)

## Propósito
SuniPlayer utiliza **Zustand** para la gestión del estado global. La arquitectura está dividida en 5 almacenes (stores) de dominio específicos y un orquestador compuesto, permitiendo un flujo de datos reactivo, modular y de alta performance.

## Los 5 Stores de Dominio

### 1. Library Store (`useLibraryStore`)
- **Responsabilidad**: Gestionar el catálogo total de tracks (locales y remotos).
- **Datos Clave**: `customTracks`, `repertoire`, `trackOverrides`.
- **Acciones**: Importación de archivos, actualización de metadata individual, persistencia de recortes (Trims).

### 2. Builder Store (`useBuilderStore`)
- **Responsabilidad**: Gestionar la configuración y el resultado de la generación de sets.
- **Datos Clave**: `targetMin`, `curve`, `venue`, `genSet`.
- **Acciones**: Ejecutar el algoritmo Monte Carlo, limpiar el set generado.

### 3. Player Store (`usePlayerStore`)
- **Responsabilidad**: Controlar la sesión de reproducción activa.
- **Datos Clave**: `pQueue` (cola activa), `ci` (índice actual), `playing`, `pos` (posición en ms), `mode` (Edit/Show).
- **Acciones**: Play/Pause, Saltar track, Buscar posición (Seek), Sincronizar con el hardware.

### 4. Settings Store (`useSettingsStore`)
- **Responsabilidad**: Preferencias técnicas, globales y reglas del algoritmo de curaduría.
- **Datos Clave**: `autoNext`, `crossfadeMs`, `masterVolume`, `pedalBindings`, `harmonicMixing`, `maxBpmJump`, `energyContinuity`.
- **Acciones**: Cambiar volumen maestro, mapear pedales Bluetooth, ajustar tiempos de fade, configurar el "Cerebro DJ".

### 5. History Store (`useHistoryStore`)
- **Responsabilidad**: Archivo de shows realizados.
- **Datos Clave**: `history` (Array de `Show` o `SetHistoryItem`).
- **Acciones**: Guardar sesión actual, borrar historial.

---

## El Orquestador: Project Store (`useProjectStore`)
Para simplificar el desarrollo y mantener la compatibilidad, SuniPlayer utiliza un "Composite Hook" que unifica los 5 stores en una sola API.
- **Función**: Actúa como un puente (Facade) permitiendo que los componentes de la UI accedan a cualquier dato o acción sin importar en qué store resida.
- **Ventaja**: Centraliza las "Cross-Domain Actions" (acciones que afectan a más de un store, como enviar un set generado al reproductor).

## Persistencia
- Todos los stores (excepto estados efímeros como `pos` o `blob_url`) están configurados con el middleware `persist` de Zustand.
- Los datos se guardan automáticamente en el almacenamiento configurado (LocalStorage para JSON simple, IndexedDB/SQLite para datos pesados).

---
*La arquitectura de stores de SuniPlayer garantiza que el estado sea predecible, persistente y extremadamente rápido en el escenario.*
