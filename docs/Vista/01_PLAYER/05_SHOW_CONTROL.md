# COMPONENTE: SHOW CONTROL (Control de Modo Show)

## Propósito
Es el panel de mandos para la automatización del show. Permite al músico activar o desactivar las funciones inteligentes de SuniPlayer que facilitan la ejecución sin manos.

## Elementos y Funcionalidades (Los 5 Pilares)

### 1. FLOW (Auto-Next)
- **Función**: Cuando una canción termina, salta automáticamente a la siguiente sin intervención manual.
- **Uso**: Ideal para sets continuos o cuando el músico no puede soltar su instrumento.

### 2. CROSS (Crossfade)
- **Función**: Mezcla el final de la canción actual con el inicio de la siguiente.
- **Configuración**: Se apoya en el tiempo de Crossfade definido en los ajustes globales.

### 3. FADE (Auto Fade In/Out)
- **Función**: Aplica desvanecimientos automáticos al inicio y al final de cada track para evitar cortes abruptos.

### 4. METER (SPL Meter)
- **Función**: Activa un medidor de presión sonora visual para ayudar al músico a mantener un volumen constante y saludable para el público.

### 5. CURVE (Energy Curve)
- **Función**: Permite visualizar y seguir la curva de energía generada por el Builder, asegurando que el show mantenga la intensidad deseada.

## Comportamiento (UX)
- **Estado Visual Claro**: Cada botón usa colores vibrantes (Cyan para activo, Gris para inactivo) para que el estado se reconozca a 3 metros de distancia.
- **Acceso Rápido**: Los botones son grandes y fáciles de presionar en condiciones de escenario.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: Estados de configuración desde el **SettingsStore**.
- **Acciones (Output)**: Actualiza las preferencias globales que afectan directamente el comportamiento del **Audio Transport**.

---
*El Show Control es el copiloto del músico, permitiéndole enfocarse en tocar mientras la app maneja la logística del set.*
