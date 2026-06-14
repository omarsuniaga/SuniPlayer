# WORKFLOW: Feature Delivery (Fábrica de Software Autónoma)

**Trigger**: El usuario proporciona un documento de especificación (basado en `TEMPLATE_NUEVA_FEATURE.md`) ubicado en `Backend/Documentacion/Specs/`.

**Agente Responsable**: Orchestrator

---

## FASE 1: Ingesta y Planificación (Orchestrator)
1. Lee la especificación proporcionada por el usuario.
2. Analiza el impacto cruzando la información con `Backend/Documentacion/`.
3. Escribe un plan de acción atómico en `TASKS.md` (Sección "En Progreso").
4. **NO ESCRIBAS CÓDIGO.**

## FASE 2: Diseño de Arquitectura (Architect)
1. El Orquestador delega al **Arquitecto**.
2. El Arquitecto define si se necesitan nuevos atributos en el `DATA_MODEL`, nuevos estados en `Zustand` o cambios en el `Audio Engine`.
3. Deja constancia de las decisiones técnicas en un bloque de comentario o archivo temporal para el desarrollador.

## FASE 3: Interfaz Visual (Designer)
1. El Orquestador delega al **Diseñador (UI/UX)**.
2. Construye los componentes React (Web/Native) aplicando los principios de **Material Expressive** (Touch targets grandes, contraste alto, animaciones elásticas).
3. Utiliza datos mockeados si el estado aún no está conectado.

## FASE 4: Lógica y Conexión (Developer)
1. El Orquestador delega al **Desarrollador**.
2. Conecta los componentes del Diseñador con los Stores de Zustand (`useProjectStore`, etc.).
3. Implementa la lógica de negocio pesada (Web Workers, Web Audio API, persistencia en IndexedDB).

## FASE 5: Validación Implacable (Tester)
1. El Orquestador delega al **Tester**.
2. Verifica que la feature cumpla exactamente con la Sección 5 ("Criterios de Aceptación") del documento original.
3. Si hay errores, el Tester devuelve el flujo al Desarrollador.

## FASE 6: Cierre y Archivo (Documenter)
1. El Orquestador delega al **Documentador**.
2. Se actualiza `GEMINI.md` si hubo cambios en los comandos de build.
3. Se actualizan o crean los archivos correspondientes en `Backend/Documentacion/Vista/` o `Core/`.
4. Se marca la tarea como DONE en `TASKS.md`.
5. El Orquestador informa al humano que la fábrica ha terminado el trabajo.
