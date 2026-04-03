# 🚀 NUEVA FEATURE: METRÓNOMO VISUAL Y TAP TEMPO (Atmosphere Pulse)

## 1. VISIÓN Y PROPÓSITO (El "Qué" y el "Por qué")
Proporcionar una referencia rítmica visual infalible para el músico en el escenario. El sistema debe pulsar en sincronía con el BPM de la canción actual, permitiendo además la corrección manual del tempo mediante toques físicos sobre la interfaz.

## 2. REGLAS DE NEGOCIO (El "Cómo debe comportarse")
- **Regla 1 (Sincronización)**: El metrónomo visual solo parpadea cuando un track está en estado `playing: true`. Si el audio está pausado, el borde se mantiene estático.
- **Regla 2 (Modo Show)**: En modo LIVE, el parpadeo del borde es la prioridad visual. El bloqueo de seguridad NO debe impedir la función de "TAP TEMPO".
- **Regla 3 (Algoritmo de Tap)**: Se requiere un mínimo de 4 clics/taps consecutivos para calcular el promedio del tempo. El intervalo de tiempo entre clics se mapea a BPM. Si el tiempo entre clics excede los 2 segundos, el contador de clics se resetea.
- **Regla 4 (Prioridad de Origen)**: 
    1. Si el track tiene BPM manual, usar ese. 
    2. Si no, usar el BPM analizado automáticamente.
    3. Si no hay BPM disponible, el metrónomo muestra un estado de "Buscando Pulso" (glow suave).

## 3. UX / UI (El "Cómo se ve y se siente")
- **Ubicación**: El parpadeo ocurre en el `Box Shadow` perimetral de la vista PLAYER (el "Glow" de atmósfera).
- **Interacción**: El área sensible para el "TAP TEMPO" es todo el marco exterior de la pantalla en la vista Player.
- **Feedback Visual**: 
    - **El Pulso**: El borde aumenta su opacidad y tamaño de sombra (Glow) en el primer tiempo (beat 1) y parpadea con menor intensidad en los beats 2, 3 y 4.
    - **Confirmación de Tap**: Cada vez que el usuario hace un clic válido de "Tap", el borde emite un destello blanco instantáneo para confirmar la recepción del comando.

## 4. INTEGRACIÓN TÉCNICA (El "Dónde se conecta")
- **Stores (Zustand)**: 
    - Lee `playing`, `pos` y `ci` de `PlayerStore`.
    - Actualiza `bpm` en `LibraryStore` mediante la acción `updateTrackMetadata`.
- **Persistencia**: El nuevo BPM calculado vía "Tap" debe guardarse en **IndexedDB** permanentemente.
- **Servicios**: Sincroniza la frecuencia de parpadeo con el `AudioContext.currentTime` para evitar deriva rítmica (drift).

## 5. CRITERIOS DE ACEPTACIÓN (El "Cuándo está terminado")
- [ ] El parpadeo es visualmente exacto con el BPM configurado del track.
- [ ] Al realizar 4 taps, el valor de BPM del track se actualiza y la animación cambia de ritmo instantáneamente.
- [ ] El metrónomo se detiene inmediatamente al pausar el audio.
- [ ] El cambio de BPM persiste después de reiniciar la aplicación.

---
**Instrucciones para el Orquestador:** 
La especificación es final. Procede a actualizar `TASKS.md` y delega al Arquitecto para el diseño de la estructura de estado.
