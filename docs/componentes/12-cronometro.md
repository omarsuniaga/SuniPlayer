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

### Diagrama de flujo

```text
           ┌──────────────────┐
           │  INICIO APP      │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │  INICIAR         │
           │  CRONÓMETRO      │
           │  SESIÓN          │
           │  (background)    │
           └────────┬─────────┘
                    │
                    ▼
            ┌──────────────┐
            │  ¿MODO SHOW  │
            │  ACTIVO?     │
            └──────┬───────┘
                   │
             ┌─────┴─────┐
             │           │
          [SÍ]▼           ▼[NO]
         ┌────────┐ ┌──────────────┐
         │ INICIAR│ │ SEGUIR SOLO  │
         │ CRONO  │ │ CRONO SESIÓN │
         │ SHOW   │ └──────────────┘
         └───┬────┘
             │
             ▼
      ┌──────────────┐
      │  ¿COUNTDOWN  │
      │  O ASCEND.   │
      └──────┬───────┘
             │
        ┌────┴────┐
        │         │
     [SÍ]▼         ▼[NO]
   ┌────────┐ ┌──────────┐
   │ACTIVAR │ │ CONTADOR │
   │COUNTDWN│ │ ASCENDENT│
   │CON DURA│ │ (tiempo  │
   │OBJETIVO│ │ transcur.)│
   └───┬────┘ └────┬─────┘
       │           │
       ▼           │
  ┌──────────┐     │
  │ MONITOREAR│     │
  │ HITOS    │     │
  └────┬─────┘     │
       │           │
  ┌────┴─────┐     │
  │          │     │
  ▼          ▼     │
 ┌────┐ ┌────────┐ │
 │10m │ │5m rest │ │
 │rest│ │→ danger│ │
 │→ wa│ └────────┘ │
 │rning│    │      │
 └─────┘    ▼      │
       ┌────────┐  │
       │TIEMPO  │  │
       │CUMPLIDO│  │
       │(flash) │  │
       └────────┘  │
           │       │
           └───┬───┘
               │
               ▼
    ┌─────────────────────────┐
    │  FIN SHOW               │
    │  REPORTAR               │
    │  DURACIÓN →             │
    │  [[04-almacenamiento]]  │
    │  + telemetría           │
    └─────────────────────────┘
```

## Salida

- Tiempos de ejecución y alertas visuales de hitos → [[04-vista-show]]
- Tiempo restante del show para cálculos → [[18-completador-set]]
- Duración de show completado para persistir en `historial_shows` → [[04-almacenamiento]]
- Duraciones acumuladas para telemetría → [[05-telemetria]]
- Estadísticas temporales para visualizar → [[06-vista-perfil]]

## Errores

- **Lógico:** el temporizador intenta ejecutarse mientras la sesión del dispositivo está suspendida (ej. pantalla apagada o cambio de app en segundo plano).
  - *Resolución:* El componente calcula la diferencia de tiempo real utilizando marcas de tiempo de Unix del sistema (`Date.now()`) al reactivarse, en lugar de confiar únicamente en loops de JS (`setInterval`), evitando pérdidas de sincronía.
- **Semántico:** la duración del set es de 0 y el músico inicia la cuenta regresiva en el show
  - *Resolución:* la operación se bloquea y se reporta error.

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

---

## Interacción

**Tipo:** display (cronómetros de solo lectura) + toggle (countdown/ascendente) + progress-bar (visualización de tiempo restante) + alert (notificación visual de hitos)

**Estados y transiciones:**
- Sesión activa → [abrir app] → Crono sesión corriendo
- Show inactivo → [entrar a modo show] → Crono show iniciado
- Show activo → [togle countdown ON] → Countdown con duración objetivo
- Show activo → [toggle countdown OFF] → Ascendente (tiempo transcurrido)
- Countdown → [quedan 10 min] → Alerta warning (amarillo)
- Countdown → [quedan 5 min] → Alerta danger (rojo)
- Countdown → [tiempo = 0] → Alerta overrun (parpadeo)
- Show activo → [salir de modo show] → Crono show detenido + reporte

**Comportamiento por estado:**
- **Sesión corriendo:** Display pequeño en barra de estado. Formato «HH:MM:SS». Solo lectura.
- **Show: ascendente:** Display grande en centro de vista show. Muestra tiempo transcurrido + tiempo de cola + estimado total.
- **Show: countdown:** Display grande con tiempo restante. Barra de progreso circular o lineal.
- **Alerta warning (10 min):** Texto en amarillo. Barra de progreso al 75%+.
- **Alerta danger (5 min):** Texto en rojo. Barra de progreso al 90%+. Sin sonidos (regla de seguridad).
- **Alerta overrun:** Texto en rojo con parpadeo CSS. Muestra «+XX:XX» de excedente.
- **Set (Edit):** Display estático. Solo suma de duraciones de tracks.

---

## Guía de Estilos CSS

**.ui-timer-session**
- font-size: 11px; font-variant-numeric: tabular-nums
- .theme-dark: color: rgba(255,255,255,0.4)
- .theme-light: color: rgba(0,0,0,0.4)

**.ui-timer-show**
- font-size: 48px; font-weight: bold; font-variant-numeric: tabular-nums; text-align: center
- .theme-dark: color: #fff
- .theme-light: color: #1a1a1a

**.ui-timer-show--ascending**
- font-size: 56px; letter-spacing: 2px

**.ui-timer-show--countdown**
- font-size: 64px; letter-spacing: 4px

**.ui-timer-label**
- font-size: 12px; text-align: center
- .theme-dark: color: rgba(255,255,255,0.5)
- .theme-light: color: rgba(0,0,0,0.5)

**.ui-timer-progress-bar**
- width: 100%; height: 6px; border-radius: 3px; overflow: hidden
- .theme-dark: background: rgba(255,255,255,0.1)
- .theme-light: background: rgba(0,0,0,0.08)
- &::-webkit-progress-value: border-radius: 3px; transition: width 0.5s

**.ui-timer-progress-bar--normal**
- &::-webkit-progress-value: background: #4CAF50

**.ui-timer-progress-bar--warning**
- &::-webkit-progress-value: background: #FF9800

**.ui-timer-progress-bar--danger**
- &::-webkit-progress-value: background: #F44336

**.ui-timer-progress-bar--overrun**
- &::-webkit-progress-value: background: #F44336; animation: pulse 1s infinite

**.ui-timer-alert--warning**
- color: #FF9800 !important

**.ui-timer-alert--danger**
- color: #F44336 !important

**.ui-timer-alert--overrun**
- color: #F44336 !important; animation: flash 1s infinite
- @keyframes flash { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

**.ui-timer-toggle**
- display: flex; gap: 8px; align-items: center; justify-content: center
- font-size: 13px
- .theme-dark: color: rgba(255,255,255,0.6)
- .theme-light: color: rgba(0,0,0,0.6)

**.ui-timer-set**
- font-size: 16px; font-weight: 500; font-variant-numeric: tabular-nums
- .theme-dark: color: rgba(255,255,255,0.7)
- .theme-light: color: rgba(0,0,0,0.7)
