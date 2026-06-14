# COMPONENTE: ENERGY CURVE CHART (Gráfico de Intensidad)

## Propósito
Visualizar el arco emocional del setlist generado. Permite al músico validar de un vistazo si el flujo de energía de las canciones elegidas coincide con su intención para el show.

## Características y Funcionalidades Detalladas

### 1. Representación de Datos
- **Eje X (Tiempo)**: Representa el progreso del set desde el minuto 0 hasta el final.
- **Eje Y (Energía/BPM)**: Muestra el nivel de intensidad de cada track seleccionado.
- **Área Sombreada**: Utiliza un gráfico de área con gradientes (usualmente del Cyan al Violeta) para dar una sensación de volumen y peso musical.

### 2. Sincronización con el Algoritmo
- **Actualización en Caliente**: Cada vez que se presiona "Generate Set", el gráfico se redibuja instantáneamente para reflejar la nueva combinación de temas.
- **Puntos de Referencia (Dots)**: Pequeños indicadores sobre la curva que representan canciones individuales. Al pasar el cursor, puede mostrar el nombre del tema.

### 3. Visualización de la Curva Ideal
- **Referencia de Diseño**: En el fondo, el gráfico puede mostrar una línea tenue que representa la "curva ideal" solicitada (ej: la línea ascendente del Build-up), permitiendo ver cuánto se alejó el algoritmo de lo ideal debido a las canciones disponibles en la biblioteca.

## Tecnologías de Dibujo
- **SVG / Recharts**: Utiliza componentes de vectores para asegurar que el gráfico sea nítido en cualquier resolución de pantalla y que las animaciones de transición sean fluidas.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: El array de tracks del `genSet` desde el **BuilderStore**, extrayendo la propiedad `energy` o `bpm` de cada uno.
- **Acciones (Output)**: Principalmente visual (solo lectura).

---
*El gráfico de curva es el electrocardiograma del show, asegurando que la música tenga el pulso correcto.*
