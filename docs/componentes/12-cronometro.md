---
ruta: docs/componentes/12-cronometro.md
tipo: componente
origen: "[[03-modelo-sesion]]"
estado: estable
---

# Cronómetros de Sesión y Show

## Función

Registrar de forma precisa la duración de la sesión actual; gestionar el cronómetro ascendente y la cuenta regresiva del show en vivo; disparar alertas visuales de hito de tiempo; y reportar las duraciones acumuladas al cerrarse.

## Entrada

- Señales de cambio de modo de sesión (inicio/fin de Modo Show/Edit) ← [[03-modelo-sesion]]
- Duración objetivo del Set activo ← [[02-modelo-colecciones]]

## Proceso

1. **Cronómetro de Sesión (Volátil):**
   - Inicia de forma automática al abrir la aplicación.
   - Incrementa un contador en milisegundos en segundo plano.
   - Al cerrar la app, reporta la duración a [[05-telemetria]] para sumarse al total histórico, y se destruye en memoria.
2. **Cronómetro de Show (Vivo):**
   - Se activa únicamente al entrar a Modo Show.
   - **Modo Ascendente:** Registra el tiempo transcurrido desde el inicio de la presentación en vivo.
   - **Modo Cuenta Regresiva (Countdown):**
     - Toma la `duración objetivo` del Set (ej: 45 minutos) o la ingresada al arrancar el show.
     - Decrementa el tiempo restante de forma precisa.
     - **Alertas Visuales de Hitos:** Cuando el tiempo restante cruza marcas críticas, el componente envía eventos visuales a [[04-vista-show]]:
       - Faltan 10 minutos (clase CSS `.alert-time-warning`, texto en amarillo).
       - Faltan 5 minutos (clase CSS `.alert-time-danger`, texto en rojo).
       - Tiempo cumplido (clase CSS `.alert-time-overrun`, parpadeo de seguridad).
       - *REGLA DE SEGURIDAD:* Las alertas son 100% visuales. Está estrictamente prohibido emitir pitidos o sonidos de sistema durante el Modo Show.
3. **Cronómetro de Set (Edit):**
   - Suma estática de la duración efectiva de todos los tracks asignados al Set para validación del músico.

## Salida

- Tiempos de ejecución y alertas visuales de hitos → [[04-vista-show]]
- Tiempo restante del show para cálculos → [[18-completador-set]]
- Duración de show completado para persistir en `historial_shows` → [[04-almacenamiento]]
- Duraciones acumuladas para telemetría → [[05-telemetria]]
- Estadísticas temporales para visualizar → [[06-vista-perfil]]

## Errores

- **Lógico:** el temporizador intenta ejecutarse mientras la sesión del dispositivo está suspendida (ej. pantalla apagada o cambio de app en segundo plano).
  - *Resolución:* El componente calcula la diferencia de tiempo real utilizando marcas de tiempo de Unix del sistema (`Date.now()`) al reactivarse, en lugar de confiar únicamente en loops de JS (`setInterval`), evitando pérdidas de sincronía.
- **Semántico:** la duración del set es de 0 y el músico inicia la cuenta regresiva en el show — la operación se bloquea y se reporta error.

Catálogo global: [[07-modelo-errores]]

---

## Tipos de cronómetro

### 1. Cronómetro de Sesión
- Cuenta el tiempo total que el usuario lleva usando la app desde que la abrió.
- Es volátil: se reinicia al cerrar la app.

### 2. Cronómetro de Show
- Arranca cuando se inicia el modo Show.
- Se muestra SIEMPRE en grande durante el show en vivo.
- Muestra: `[tiempo transcurrido] + [tiempo de cola] = [tiempo total estimado]`.

### 3. Cronómetro de Set (en Edit)
- Muestra la duración total de las canciones del set de forma estática.
- Ayuda al músico a saber si su set entra en el tiempo asignado.
