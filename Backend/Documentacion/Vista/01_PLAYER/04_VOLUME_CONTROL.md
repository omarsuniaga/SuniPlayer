# COMPONENTE: VOLUME CONTROL (Control de Volumen Maestro)

## Propósito
Gestionar el nivel de salida sonora de la aplicación. Su diseño está optimizado para evitar cambios de volumen accidentales y proporcionar una respuesta visual clara de la ganancia aplicada.

## Características y Funcionalidades Detalladas

### 1. Slider de Alta Precisión
- **Control Logarítmico**: El slider no es lineal; sigue una curva logarítmica para que el aumento de volumen se sienta natural al oído humano.
- **Hit-Area Generosa**: El área de toque para arrastrar el slider es más grande que el componente visual, facilitando el ajuste con dedos en pantallas táctiles.

### 2. Feedback Visual de Intensidad
- **Indicador de Color**: El slider cambia de color o intensidad según el volumen. A niveles altos (cerca del 100%), puede mostrar un color de advertencia (Amarillo/Rojo) para indicar posible saturación.
- **Label de Porcentaje**: Muestra el valor numérico exacto (0-100) para que el músico pueda memorizar sus niveles ideales.

### 3. Interacción con el Audio Mixer
- **Real-time Gain**: Cada movimiento del slider actualiza instantáneamente el nodo de ganancia del motor de audio.
- **Mute / Unmute**: Un toque rápido sobre el icono de parlante alterna entre el volumen actual y el silencio total, recordando el nivel previo al restaurar.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: El valor de volumen global desde el **SettingsStore**.
- **Acciones (Output)**: Envía el nuevo valor de volumen al store y, consecuentemente, al hardware de audio.

---
*El Volume Control es el acelerador del show, permitiendo al músico dominar la potencia del sonido.*
