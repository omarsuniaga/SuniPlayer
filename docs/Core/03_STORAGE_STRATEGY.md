# CORE: STORAGE STRATEGY (Persistencia)

## Propósito
Garantizar la resiliencia de los datos del músico en entornos de navegador (PWA), protegiendo tanto la metadata como los archivos binarios pesados.

## 🏗️ Arquitectura Híbrida (v2.0)

### 1. Origin Private File System (OPFS)
- **Rol**: Almacén de archivos binarios (`.mp3`, `.wav`, `.ogg`).
- **Razón**: Máximo rendimiento de lectura/escritura. Al guardar el audio fuera de la base de datos, evitamos bloqueos de transacciones y deadlocks en la UI.
- **Acceso**: Operaciones atómicas de sistema de archivos real.

### 2. IndexedDB (v2)
- **Rol**: Almacén de Metadata y Análisis.
- **Tablas**:
    - `analysis`: BPM, Key, Energy, GainOffset.
    - `waveforms`: Datos de visualización de onda.
- **Razón**: Búsquedas rápidas por ID y persistencia estructurada liviana.

### 3. LocalStorage
- **Rol**: Preferencias de usuario y estado de la UI.
- **Razón**: Carga inmediata sincrónica al inicio de la app.

## 🛡️ Blindaje de Datos
- **Persistencia Persistente**: La app solicita el modo `persistent` al navegador vía `navigator.storage.persist()`.
- **Monitoreo de Cuota**: Diagnóstico en tiempo real del espacio disponible y uso en MB/GB desde el panel de ajustes.

---
*La arquitectura híbrida asegura que SuniPlayer sea un tanque de guerra en cuanto a estabilidad de datos.*
