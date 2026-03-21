# Energy Curve Animated Charts — Design Doc
**Fecha:** 2026-03-20

## Problema
Los botones de Energy Curve en el Builder son solo texto. No comunican visualmente qué significa cada opción de energía.

## Solución
Reemplazar los botones de texto con mini-gráficas SVG animadas en loop. En el Player, mostrar la curva seleccionada en grande con un cabezal que avanza según el progreso del set completo.

## Componente nuevo: EnergyCurveChart

**Archivo:** `apps/web/src/components/common/EnergyCurveChart.tsx`

**Props:**
- `type: 'steady' | 'ascending' | 'descending' | 'wave'`
- `size: 'mini' | 'large'`
- `playheadPct?: number` — 0 a 1, solo en size='large'
- `active?: boolean` — controla color cuando está seleccionado

**Curvas y colores:**
| Curva | Animación | Color |
|-------|-----------|-------|
| steady | Línea recta con pulso de opacidad | Cyan #06b6d4 |
| ascending | stroke-dashoffset draw de abajo→arriba | Violeta #8b5cf6 |
| descending | stroke-dashoffset draw de arriba→abajo | Rojo #ef4444 |
| wave | stroke-dashoffset draw de seno | Ámbar #f59e0b |

## Archivos modificados

### BuilderConfigSection.tsx
- Reemplazar contenido de cada botón CURVES por `<EnergyCurveChart type={item.id} size="mini" active={curve === item.id} />`
- El label y desc se mantienen debajo de la gráfica

### PlayerSetFooter.tsx (o donde vivan las stats del set)
- Agregar sección "ENERGY CURVE" similar al panel Crossfade
- `playheadPct = (suma duraciones tracks anteriores + posición actual ms) / duración total set ms`
- Curva grande con punto SVG animado que recorre la línea

## Fórmula del cabezal
```ts
const played = sumTrackDurationMs(queue.slice(0, ci)) + positionMs;
const total = sumTrackDurationMs(queue);
const playheadPct = total > 0 ? played / total : 0;
```
