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

## Salida

- Propuesta de combinación de tracks para el show → [[04-vista-show]]
- Array de tracks confirmados para agregar a la cola → [[02-modelo-colecciones]]

## Errores

- **Lógico (Sin combinación posible):** Ninguna combinación de canciones de la librería puede sumar la duración restante del show dentro del rango de tolerancia.
  - *Resolución:* El componente devuelve la combinación que más se aproxime al tiempo objetivo e informa a la vista la desviación estimada (ej: "Faltan 2 minutos para cubrir todo el set").
- **Semántico:** la librería de canciones del usuario está vacía o el tiempo restante es menor que la duración efectiva de la canción más corta.
  - *Resolución:* Cancela la operación e informa a la vista.

Catálogo global: [[07-modelo-errores]]
