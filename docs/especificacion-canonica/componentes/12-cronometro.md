# Cronómetros

## ¿Qué es?

Un sistema de **medición de tiempo** que funciona en tres niveles distintos según el contexto.

---

## Los tres cronómetros

### 1. Cronómetro de Sesión

Existen DOS métricas relacionadas con el tiempo de uso de la app. Son cosas distintas y no deben confundirse:

**(a) Cronómetro de Sesión — volátil:**
```text
  ¿Cuándo arranca?    →  Al abrir la app
  ¿Cuándo se detiene? →  Al cerrar la app
  ¿Se persiste?       →  NO — se reinicia en cada apertura
  ¿Dónde se ve?       →  Perfil → Estadísticas (sesión actual)
  ¿Para qué sirve?    →  Ver cuánto lleva activa la sesión actual
```

**(b) Tiempo total acumulado — persistido:**
```text
  ¿Cuándo se actualiza? →  Al cerrar la app (se suma la sesión actual al total)
  ¿Se persiste?         →  SÍ — guardado en la DB local
  ¿Dónde se ve?         →  Perfil → Estadísticas (el número grande)
  ¿Para qué sirve?      →  Historial de uso total del usuario

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │     ⏱  Tiempo total de uso:  124h 32m    ← persistido  │
  │     📊  Promedio diario:      2h 15m                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

El valor "124h 32m" que aparece en el Perfil es el **tiempo total acumulado** (persistido). El Cronómetro de Sesión solo mide la apertura actual.

### 2. Cronómetro de Show (Presentación en vivo)

```text
  ¿Cuándo arranca?    →  Al iniciar el modo Show
  ¿Cuándo se detiene? →  Al terminar el modo Show
  ¿Se pausa?          →  NO — ni aunque la música esté en pausa
  ¿Se reinicia?       →  Manualmente desde Perfil
  ¿Dónde se ve?       →  En la vista Show, SIEMPRE visible

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │              ╔══════════════════════════╗                │
  │              ║      ⏱  43:21           ║                │
  │              ║      ─────────           ║                │
  │              ║      + Cola: 10:47       ║                │
  │              ║      ─────────           ║                │
  │              ║      = Total: 54:08      ║                │
  │              ╚══════════════════════════╝                │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ⏱  El "+ Cola" es la función estrella:
      "Llevo 32 min. Agregué 3 canciones = 12 min más.
       Estimo terminar en 44 min total."
```

### 3. Cronómetro de Set (Preparación)

```text
  ¿Cuándo se calcula? →  Cada vez que se modifica el set
  ¿Cómo funciona?     →  Suma la duración de todas las canciones
  ¿Se pausa?          →  No aplica (es una suma, no un contador)
  ¿Dónde se ve?       →  En la vista Edit, cabecera del set

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │   Set: Show Sábado 15                                    │
  │                                                          │
  │   12 canciones  |  Duración: 34:21                      │
  │                                                          │
  │   🟢  Entra en 40 min  (sobran 5:39)                    │
  │                                                          │
  │   [🎯 Iniciar Show]                                     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  Colores de advertencia:
    🟢  El set entra en el tiempo disponible
    🟡  El set está al 90%+
    🔴  El set EXCEDE el tiempo disponible
```

---

## Historial de shows

Cada vez que se completa un show, se guarda:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   📊  HISTORIAL DE SHOWS  (últimos 30 días)                  │
│                                                              │
│   ┌──────┬────────────┬──────────┬──────────┬────────────┐  │
│   │ Fecha│  Set       │  Duración│ Canciones│ Cola extra │  │
│   ├──────┼────────────┼──────────┼──────────┼────────────┤  │
│   │10/06 │ Sábado 15  │  43:21  │   12    │     3      │  │
│   │ 8/06 │ Show Viern.│  38:10  │   10    │     1      │  │
│   │ 1/06 │ Ensayo Gral│  52:00  │   15    │     0      │  │
│   └──────┴────────────┴──────────┴──────────┴────────────┘  │
│                                                              │
│   Promedio: 44:43  |  Total shows: 8  |  18h 45m            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Estados

```text
┌─────────────────┬────────────────────────────────────────────┐
│  Cronómetro     │  Estados                                   │
├─────────────────┼────────────────────────────────────────────┤
│  SESIÓN         │  ● Detenido (app cerrada)                  │
│                 │  ● Corriendo (app abierta)                 │
├─────────────────┼────────────────────────────────────────────┤
│  SHOW           │  ● Detenido (show no iniciado)             │
│                 │  ● Corriendo (show activo)                 │
│                 │  ● Finalizado (show terminó, datos         │
│                 │      guardados en historial)                │
├─────────────────┼────────────────────────────────────────────┤
│  SET            │  ● No calculado (0 canciones)              │
│                 │  ● Calculado (duración conocida)           │
│                 │  ● 🟢 En tiempo                            │
│                 │  ● 🟡 Cerca del límite                     │
│                 │  ● 🔴 Excede tiempo                        │
└─────────────────┴────────────────────────────────────────────┘
```
