# 🚀 NUEVA FEATURE: REDISEÑO INTEGRAL LIBRARY (Command Center UI)

## 1. VISIÓN Y PROPÓSITO (El "Qué" y el "Por qué")
Transformar la biblioteca de una simple lista a un **Centro de Mando de Repertorio**. Buscamos una estética "Dark Premium" ultra-limpia que permita encontrar y procesar temas en milisegundos, incluso con poca luz y alta tensión.

## 2. REGLAS DE NEGOCIO (El "Cómo debe comportarse")
- **Regla 1 (Filtros Inteligentes)**: Los filtros por etiquetas (Tags) deben ser acumulativos (ej: Jazz + High Energy).
- **Regla 2 (Gestión Masiva)**: Permitir la selección múltiple para borrar temas o enviarlos al Repertoire de un solo movimiento.
- **Regla 3 (Prioridad de Carga)**: El scroll debe ser infinito y virtualizado (ya existe, pero debe optimizarse el renderizado de imágenes/iconos).
- **Regla 4 (Importación Blindada)**: Los archivos nuevos deben pasar por un modal de "Pre-Check" donde el músico valide Título/Artista antes de que entren a la DB.

## 3. UX / UI (El "Cómo se ve y se siente")
- **Layout**: 
    - **Header**: Buscador flotante con efecto de desenfoque (Glassmorphism).
    - **Filtros**: Fila de chips horizontales deslizables para géneros y estados (Local/Cloud).
    - **Lista**: Filas de 56px, gap de 2px. Tipografía DM Sans (White) y JetBrains Mono (Cyan para BPM).
- **Interacción**: 
    - **Swipe Actions**: Deslizar a la izquierda para borrar, a la derecha para encolar (estilo iOS).
    - **Long Press**: Activar modo selección múltiple.
- **Feedback**: Animación de entrada "Cascade" para los items de la lista.

## 4. INTEGRACIÓN TÉCNICA (El "Dónde se conecta")
- **Stores (Zustand)**: `LibraryStore` (filtros, selección masiva).
- **Persistencia**: Mantener IndexedDB para los binarios y LocalStorage para las preferencias de filtrado.
- **Servicios**: Optimizar el `MetadataService` para que no bloquee la UI durante importaciones masivas.

## 5. CRITERIOS DE ACEPTACIÓN (El "Cuándo está terminado")
- [ ] La búsqueda encuentra temas por cualquier campo (Título, Artista, Tag) en menos de 100ms.
- [ ] El modal de importación permite editar metadata de 10 archivos simultáneamente.
- [ ] El scroll virtual no presenta "blancos" al scrollear rápido.
- [ ] Las acciones de Swipe son fluidas a 60fps.

---
**Instrucciones para el Orquestador:** 
Lee esta especificación, actualiza `TASKS.md` y activa al Arquitecto para definir los nuevos estados de selección múltiple.
