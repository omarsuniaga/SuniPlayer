# COMPONENTE: SETLIST QUEUE (Cola de Reproducción)

## Propósito
El **Setlist Queue** es el panel que permite al músico ver qué canciones están programadas para sonar a continuación. Es el "mapa de ruta" del show en vivo.

## Comportamiento
1. **Visualización de Items**: Muestra cada track con su título, artista y duración.
2. **Indicador de Reproducción**: La canción que está sonando actualmente (Current Index) se destaca visualmente para que el músico sepa dónde está parado.
3. **Scroll Virtual**: Como un setlist puede tener muchos temas, el scroll es fluido para evitar lag en el escenario.
4. **Interacción Directa**: El músico puede saltar a cualquier tema de la lista haciendo clic en él (previo aviso o configuración según el modo).
5. **Drag and Drop (Modo Edit)**: En el modo edición, permite reordenar el show simplemente arrastrando los temas.

## Conexiones (Inputs/Outputs)
- **Recibe (Input)**: La lista de tracks (`pQueue`) y el índice actual (`ci`) desde el Store de Proyectos.
- **Acciones (Output)**: Envía comandos para cambiar el track actual (`setCi`) o reordenar la cola.

---
*Este componente es vital para que el músico no pierda el hilo del show y pueda anticipar el siguiente tema.*
