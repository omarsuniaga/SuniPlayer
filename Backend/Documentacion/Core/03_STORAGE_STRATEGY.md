# CORE: STORAGE STRATEGY (Estrategia de Persistencia)

## Propósito
SuniPlayer maneja grandes volúmenes de datos binarios (archivos de audio) y estados JSON complejos. Este documento describe el "Storage Bridge" que permite una persistencia de alta performance y capacidad offline tanto en la web como en dispositivos móviles.

## El Puente de Almacenamiento (Storage Bridge)
Para mantener el Core agnóstico a la plataforma, se utiliza una interfaz común que se implementa de forma diferente según el entorno:

### 1. Persistencia de Estado (JSON)
- **Tecnología**: `LocalStorage` (Web) / `AsyncStorage` (Native).
- **Uso**: Guardar configuraciones pequeñas, preferencias del usuario y punteros a tracks.
- **Middleware**: Gestionado automáticamente por el plugin `persist` de Zustand.

### 2. Almacenamiento de Audios (Blobs/Archivos)
Esta es la parte pesada. SuniPlayer no guarda el audio como Base64 (que es ineficiente), sino como datos binarios reales:
- **Web (PWA)**: Utiliza **IndexedDB** a través de la librería `idb`. Permite guardar archivos de cientos de megabytes sin bloquear el navegador.
- **Native (Móvil)**: Utiliza el sistema de archivos local (`FileSystem`) y **SQLite** para la metadata rápida.

## Gestión de Archivos en Memoria
- **Blob URLs**: En la web, para reproducir un archivo guardado en IndexedDB, SuniPlayer genera una `URL.createObjectURL(blob)`. 
- **Ciclo de Vida**: El sistema se encarga de revocar estas URLs cuando el track ya no es necesario para evitar fugas de memoria (Memory Leaks).

## Integridad de Datos
- **Migraciones**: El sistema de almacenamiento incluye una versión de base de datos. Si la estructura del `Track` cambia, el bridge ejecuta scripts de migración para no perder la biblioteca del músico.
- **Backup**: Soporta la exportación/importación del estado completo en un solo archivo JSON/Binario para respaldar el repertorio.

---
*La estrategia de storage es lo que convierte a SuniPlayer en una herramienta profesional capaz de funcionar en un avión o en un sótano sin internet.*
