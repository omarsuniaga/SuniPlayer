# PROCESO TÉCNICO: BUILDER SERVICE (Algoritmo Monte Carlo)

## Propósito
Este documento detalla la lógica matemática y algorítmica utilizada para la generación automática de sets. El sistema utiliza una variante del método **Monte Carlo** para resolver el problema de optimización de tiempo y energía.

## Lógica del Algoritmo (Paso a Paso)

### 1. Filtrado de Pool (Pre-selección)
- El sistema toma el catálogo completo y aplica filtros iniciales:
    - Excluye tracks que ya están en el setlist si se requiere variedad.
    - Filtra por etiquetas (`tags`) si el usuario definió un estilo.
    - Pondera según el `Venue Type` (ej: elimina temas pesados si es un "Lobby Dinner").

### 2. Generación de Candidatos (Simulaciones)
- El motor no construye un solo setlist. Realiza múltiples iteraciones (simulaciones Monte Carlo).
- En cada iteración, elige una secuencia aleatoria de tracks que se ajusten a la duración objetivo.

### 3. Evaluación de la Función de Costo
Cada set generado recibe una "puntuación" basada en dos factores:
- **Error de Tiempo**: Qué tan cerca está de los minutos solicitados.
- **Ajuste a la Curva**: Qué tan bien coincide la energía de los temas elegidos con la forma de la curva seleccionada (Steady, Build-up, etc.).
- El algoritmo penaliza saltos de energía demasiado bruscos o silencios prolongados.

### 4. Selección del Ganador
- De entre todas las simulaciones realizadas, el sistema devuelve aquella con el **menor costo acumulado** (la mejor combinación encontrada en el tiempo de procesamiento permitido).

## Variables Técnicas
- **Energy Score (0.0 - 1.0)**: Valor asignado a cada track que representa su intensidad percibida.
- **BPM Weight**: Importancia que se le da al tempo en la progresión de la curva.
- **Max Iterations**: Número de intentos que realiza el algoritmo antes de entregar un resultado (usualmente milisegundos de procesamiento).

---
*El Builder Service es la inteligencia que garantiza que SuniPlayer siempre entregue un show con sentido musical y precisión técnica.*
