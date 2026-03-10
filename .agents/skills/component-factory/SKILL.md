# Skill: Component Factory
Description: Guía de ingeniería para la creación de componentes, modales y conectores de datos en SuniPlayer. Su objetivo es evitar la saturación de archivos y maximizar la reutilización.

## Responsabilidades
- Fabricar componentes visuales puros (Presentational Components).
- Implementar conectores/hooks para enlazar la UI con los stores (Zustand).
- Gestionar el Sistema de Modales centralizado para evitar contaminación del DOM.
- Asegurar que cada componente respete el Atomic Design (Átomos, Moléculas, Organismos).

## Reglas de Oro para Agentes
1. **Pureza Visual**: Los componentes en `src/components/` deben ser "tontos". Reciben datos por `props` y emiten eventos.
2. **Lógica Separada**: La lógica de estado global (`useStore`) se maneja en "HOCs", "Wrappers" o archivos en `src/features/`.
3. **Regla de Carga Única**: Un archivo de componente no debe superar las 150 líneas. Si ocurre, debe ser fragmentado.
4. **Modales Desacoplados**: No hardcodear estados `isOpen` dentro de páginas grandes. Usar el sistema de orquestación de modales.
5. **Estilos Consistentes**: Prohibido el uso de colores HEX directos. Usar variables del sistema definidas en `constants.js` o `mockTracks.js`.

## Estructura de Salida
- `src/components/ui/` -> Átomos (Botones, Inputs).
- `src/components/layout/` -> Estructuras (Grillas, Modales base).
- `src/features/[feature]/` -> Conectores y lógica compleja.
