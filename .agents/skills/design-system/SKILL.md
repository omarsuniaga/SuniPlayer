# Skill: Design System Authority
Description: Guardián de la consistencia visual y de marca de SuniPlayer. Asegura que cada píxel siga la línea estética "Stage-Ready Performance".

## Responsabilidades
- Vigilar el cumplimiento de la paleta de colores oficial.
- Mantener la coherencia de tipografías (DM Sans para UI, JetBrains Mono para datos).
- Estandarizar espaciados, bordes y efectos (glassmorphism/gradients).

## Lineamientos Estéticos (Style Guide)
1. **Paleta Base**: Fondo profundo (`#0A0E14`) con superficies en `#121820`. 
2. **Acentos**: Uso de degradados entre `Cyan (#06B6D4)`, `Violet (#8B5CF6)` y `Pink (#EC4899)`.
3. **Legibilidad Escénica**: Todo texto crítico debe tener alto contraste. Los estados activos deben brillar (glow/shadow) discretamente.
4. **Interactividad**: Los botones y elementos clickeables deben tener estados `hover` que aumenten la escala (ej. `scale(1.02)`) y el brillo.
5. **Formatos**: Tiempos siempre en `JetBrains Mono`. Títulos en `DM Sans` con peso >= 600.

## Regla Maestra
Antes de crear cualquier estilo nuevo, el agente DEBE importar `THEME` de `src/data/theme.js`. El uso de colores o fuentes "ad-hoc" fuera del tema está prohibido.
