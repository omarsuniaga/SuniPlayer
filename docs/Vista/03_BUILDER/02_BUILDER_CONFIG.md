# COMPONENTE: BUILDER CONFIG (Parámetros de Generación)

## Propósito
Proporcionar una interfaz simple para configurar las variables complejas que alimentan al motor de generación Monte Carlo.

## Elementos y Funcionalidades Detalladas

### 1. Selector de Duración (Target Minutes)
- **Rango**: Usualmente de 15 a 180 minutos.
- **Lógica de Cálculo**: El motor intenta acercarse lo máximo posible a este valor usando la suma de las duraciones reales de los tracks (incluyendo los recortes de Trim).

### 2. Selector de Curva de Energía (Energy Curve)
Define la "forma" del show. Las opciones reales en el código son:
- **Steady**: Mantiene una intensidad constante durante todo el set.
- **Build-up**: Empieza muy tranquilo y sube gradualmente hasta el final.
- **Peak**: Tiene el pico de energía en la mitad del show y luego desciende.
- **Random**: Una montaña rusa de intensidades sin un patrón fijo.

### 3. Selector de Lugar (Venue Type)
Afecta la ponderación de los tracks elegidos:
- **Lobby / Dinner**: Prioriza tracks con etiquetas de baja energía y moods relajados.
- **Party / Club**: Prioriza tracks con alto BPM y energía agresiva.
- **Concert / Stage**: Busca un balance dinámico entre temas lentos y potentes.

### 4. Botón GENERATE SET
- **Función**: Dispara la ejecución del servicio `buildSet`.
- **Feedback**: El botón puede mostrar un estado de carga breve mientras se realizan las simulaciones.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Carga las preferencias previas desde el **BuilderStore**.
- **Acciones (Output)**: Actualiza el estado global del builder, disparando automáticamente la actualización del gráfico de curva.

---
*La configuración del Builder es el 'prompt' musical que define el destino del show.*
