---
ruta: docs/componentes/18-completador-set.md
tipo: componente
origen: "[[04-vista-show]]"
estado: estable
---

# Completador de Set

## Función

Calcular combinaciones de canciones de la librería que sumen una duración acumulada equivalente al tiempo restante del show (dentro de una tolerancia configurable); y presentar propuestas de relleno para su confirmación e inserción en la QuouList.

## Entrada

- Tiempo restante de show en vivo (segundos) ← [[12-cronometro]]
- Canciones candidatas y sus duraciones efectivas (Fin - Inicio) ← [[02-modelo-colecciones]]
- Solicitud de cálculo de propuesta ← [[04-vista-show]]

## Proceso

1. **Recolección de Candidatas:**
   - Lee todas las canciones de la librería del usuario.
   - Excluye canciones que ya fueron reproducidas en el show actual (obtiene el historial desde [[12-cronometro]]).
   - Calcula la **duración efectiva** de cada canción candidateada: `Duración Efectiva = Fin personalizado − Inicio personalizado`.
2. **Algoritmo de Relleno (Problema de la Mochila):**
   - El algoritmo busca combinaciones de canciones (1 a N tracks) cuya suma de Duraciones Efectivas + Gap sea igual al `Tiempo restante` del show, con una tolerancia configurable (ej. ±30 segundos).
   - Prioriza canciones marcadas como favoritas o más reproducidas en [[04-almacenamiento]].
3. **Propuesta al Músico (Cero sorpresas):**
   - El componente **únicamente propone** una o varias listas combinadas.
   - Muestra la propuesta en [[04-vista-show]].
   - Si el músico toca "Confirmar", el componente inserta los tracks directamente al final de la QuouList en [[02-modelo-colecciones]] de forma automática.
   - Nada se autoejecuta ni se reproduce sin confirmación explícita.

### Diagrama de flujo

```text
┌──────────────────────┐
│  USUARIO TAP         │
│  "COMPLETAR SET"     │
│  ← [[04-vista-show]] │
└──────────┬───────────┘
           │
           ▼
  ┌──────────────────┐
  │  LEER TIEMPO     │
  │  RESTANTE        │
  │ [[12-cronometro]]│
  └────────┬─────────┘
           │
           ▼
┌────────────────────────┐
│  LEER TRACKS LIBRERÍA  │
│[[02-modelo-colecciones]]│
└──────────┬─────────────┘
           │
           ▼
  ┌──────────────────┐
  │  EXCLUIR YA      │
  │  REPRODUCIDOS    │
  │  EN SHOW ACTUAL  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  CALCULAR DURAC. │
  │  EFECTIVA        │
  │  (fin - inicio   │
  │   personalizado) │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ALGORITMO       │
  │  MOCHILA         │
  │  buscar combos   │
  │  ≈ tiempo rest.  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ¿HAY            │
  │  COMBINACIÓN     │
  │  POSIBLE?        │
  └──────┬───────────┘
         │
    ┌────┴────┐
    │         │
 [SÍ]▼         ▼[NO]
 ┌────────┐ ┌──────────────┐
 │ MOSTRAR│ │ MOSTRAR      │
 │ PROPUES│ │ MEJOR        │
 │ TA(S)  │ │ APROX.       │
 │ al     │ │ + desviación │
 │ músico │ └──────┬───────┘
 └───┬────┘        │
     │             │
     ▼             │
 ┌──────────┐      │
 │ ¿USUARIO │      │
 │ CONFIRMA?│      │
 └────┬─────┘      │
      │            │
 ┌────┴────┐       │
 │         │       │
 [SÍ]▼     ▼[NO]   │
 ┌────┐ ┌──────┐   │
 │INS.│ │DESCAR│   │
 │TAR │ │TAR   │   │
 │EN  │ │PROPU │   │
 │COLA│ │ESTA  │   │
 │→02-│ │(sin  │   │
 │mode│ │efecto│   │
 │lo- │ └──────┘   │
 │cole│             │
 │ccio│             │
 │nes)│             │
 └────┘             │
                    │
         ┌──────────┘
         │
         ▼
  ┌──────────────────┐
  │  ¿LIBRERÍA      │
  │  VACÍA O TIEMPO │
  │  < CANCIÓN      │
  │  MÁS CORTA?     │
  └──────┬───────────┘
         │
      [SÍ]▼
  ┌──────────────┐
  │ CANCELAR     │
  │ "No hay      │
  │ suficientes  │
  │ canciones"   │
  └──────────────┘
```

## Salida

- Propuesta de combinación de tracks para el show → [[04-vista-show]]
- Array de tracks confirmados para agregar a la cola → [[02-modelo-colecciones]]

## Errores

- **Lógico (Sin combinación posible):** Ninguna combinación de canciones de la librería puede sumar la duración restante del show dentro del rango de tolerancia.
  - *Resolución:* El componente devuelve la combinación que más se aproxime al tiempo objetivo e informa a la vista la desviación estimada (ej: "Faltan 2 minutos para cubrir todo el set").
- **Semántico:** la librería de canciones del usuario está vacía o el tiempo restante es menor que la duración efectiva de la canción más corta.
  - *Resolución:* Cancela la operación e informa a la vista.

Catálogo global: [[07-modelo-errores]]

---

## Interacción

**Tipo:** button (trigger: «Completar set») + modal (propuesta con lista de tracks) + button (confirmar/descartar propuesta)

**Estados y transiciones:**
- Inactivo → [tap «Completar set»] → Calculando
- Calculando → [combinación encontrada] → Propuesta mostrada
- Calculando → [sin combinación] → Mejor aproximación mostrada
- Calculando → [librería vacía] → Error (sin datos)
- Propuesta mostrada → [tap «Confirmar»] → Insertando en cola
- Propuesta mostrada → [tap «Descartar»] → Inactivo
- Propuesta mostrada → [tap propuesta alternativa] → Alternativa mostrada
- Insertando en cola → [ok] → Completado (feedback visual)
- Insertando en cola → [error] → Error de inserción

**Comportamiento por estado:**
- **Inactivo:** Botón «Completar set» disponible. Tooltip: «Rellenar tiempo restante con canciones de la librería».
- **Calculando:** Botón cambia a spinner + texto «Buscando combinaciones…».
- **Propuesta mostrada:** Modal con lista de tracks propuestos. Muestra duración total de la propuesta vs. tiempo restante. Variante: si hay múltiples propuestas, tabs o chips para alternar.
- **Mejor aproximación:** Misma UI que propuesta pero con badge «⚡ Mejor aproximación» + diferencia: «Faltan 2 min para cubrir el set».
- **Confirmando:** Botón «Confirmar» cambia a spinner + «Insertando…». Feedback háptico al completar.
- **Error:** Modal con mensaje específico. Botón «Cerrar».

---

## Guía de Estilos CSS

**.ui-filler-btn**
- padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600
- cursor: pointer; border: none; transition: all 0.2s
- .theme-dark: background: rgba(255,152,0,0.2); color: #FF9800
- .theme-light: background: rgba(255,152,0,0.1); color: #E65100
- &:hover: background: #FF9800; color: #fff
- &:active: transform: scale(0.97)
- &:disabled: opacity: 0.4; cursor: not-allowed

**.ui-filler-modal**
- position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center
- .theme-dark: background: rgba(0,0,0,0.7)
- .theme-light: background: rgba(0,0,0,0.3)

**.ui-filler-card**
- width: 90%; max-width: 400px; max-height: 80vh; overflow-y: auto
- border-radius: 16px; padding: 20px
- .theme-dark: background: #1e1e1e; border: 1px solid rgba(255,255,255,0.08)
- .theme-light: background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.15)

**.ui-filler-title**
- font-size: 16px; font-weight: bold; margin-bottom: 4px
- .theme-dark: color: #fff; .theme-light: color: #1a1a1a

**.ui-filler-subtitle**
- font-size: 12px; margin-bottom: 16px
- .theme-dark: color: rgba(255,255,255,0.4)
- .theme-light: color: rgba(0,0,0,0.4)

**.ui-filler-track-list**
- display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px

**.ui-filler-track-item**
- display: flex; align-items: center; justify-content: space-between; padding: 8px 12px
- border-radius: 8px; font-size: 13px
- .theme-dark: background: rgba(255,255,255,0.04)
- .theme-light: background: rgba(0,0,0,0.03)

**.ui-filler-track-name**
- font-weight: 500
- .theme-dark: color: rgba(255,255,255,0.85)
- .theme-light: color: rgba(0,0,0,0.85)

**.ui-filler-track-duration**
- font-size: 12px
- .theme-dark: color: rgba(255,255,255,0.4)
- .theme-light: color: rgba(0,0,0,0.4)

**.ui-filler-summary**
- display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid
- font-size: 13px; font-weight: 500; margin-bottom: 16px
- .theme-dark: border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7)
- .theme-light: border-color: rgba(0,0,0,0.08); color: rgba(0,0,0,0.7)

**.ui-filler-actions**
- display: flex; gap: 8px; justify-content: flex-end

**.ui-filler-confirm-btn**
- padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600
- background: #4CAF50; color: #fff
- &:hover: background: #388E3C
- &:active: transform: scale(0.97)
- &:disabled: opacity: 0.5; cursor: not-allowed

**.ui-filler-discard-btn**
- padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px
- .theme-dark: background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6)
- .theme-light: background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.6)
- &:hover: background: rgba(244,67,54,0.15); color: #F44336

**.ui-filler-empty**
- text-align: center; padding: 24px; font-size: 13px
- .theme-dark: color: rgba(255,255,255,0.4)
- .theme-light: color: rgba(0,0,0,0.4)
