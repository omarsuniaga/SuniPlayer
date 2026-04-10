---
name: library
description: "Command center for the SuniPlayer library focused on fast, tactile, premium live-music workflows."
---
# SKILL: Library Management (Command Center)

## Contexto
La **Library** de SuniPlayer no es una lista de archivos; es un centro de mando para músicos en vivo. Debe ser ultra-rápida, táctil y visualmente premium.

---

## 🏗️ Arquitectura de la Library

- **Store Principal**: `useLibraryStore` en `packages/core`.
- **UI de Entrada**: `apps/web/src/features/library/`.
- **Componentes Clave**:
    - `LibraryHeader`: Glassmorphism y buscador.
    - `TrackList`: Scroll virtual para performance.
    - `TrackRow`: Swipe actions (iOS style).
    - `ImportZone`: Gestión de ingesta masiva.

---

## 📏 Reglas de Oro (Constraints)

1. **Performance Crítica**: Las búsquedas y filtrados DEBEN resolverse en **<100ms**. No aceptamos bloqueos de UI.
2. **Gestión de Estado**:
    - Usar `useProjectStore` para acciones que afecten la cola de reproducción.
    - La selección múltiple debe persistir solo de forma efímera (a menos que el usuario la guarde como Set).
3. **Interacción Stage-Ready**:
    - Tap simple: Seleccionar / Ver perfil.
    - Double-tap: Reproducción inmediata (Quick Play).
    - Swipe Right: Encolar (Add to Queue).
    - Swipe Left: Acciones destructivas (con confirmación visual).
4. **Validación de Ingesta**: Todo archivo nuevo debe pasar por el `IngestionFlow` para validar metadata antes de entrar a la DB.

---

## 🎨 Estética Premium (Dark Mode)

- **Fondo**: Deep Black (#000000) o Dark Gray (#121212).
- **Acento**: Cyan (#00FFFF) para BPM y elementos activos.
- **Tipografía**: Sans-serif limpia (DM Sans) y Mono para datos técnicos (JetBrains Mono).
- **Efectos**: Glassmorphism (blur) en el Header y Toolbars.

---

## 🧪 Estrategia de Testing

- **Unit**: Validar lógica de filtrado y búsqueda.
- **Integration**: Verificar que al añadir un track de la biblioteca, la cola del `usePlayerStore` se actualiza correctamente.
- **Performance**: Testear el renderizado con bibliotecas de +1000 items.

---
*Si la Library no se siente como un instrumento, la implementación falló.*
