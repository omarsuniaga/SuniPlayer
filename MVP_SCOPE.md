# MVP Scope — SuniPlayer

**Estado:** Definido  
**Agente Responsable:** Agent 01 — Product Architect

---

## 🎯 Objetivo del MVP
Lanzar una herramienta funcional que permita a un músico en vivo cargar su repertorio, generar un setlist que cumpla con un tiempo específico y reproducirlo con un cronómetro de apoyo.

---

## ✅ Funcionalidades Incluidas (In-Scope)

### 1. Biblioteca Musical (Local)
- Carga de metadatos básicos (Título, Artista, BPM, Key, Mood, Energía).
- Búsqueda y filtrado por Mood.

### 2. Generador de Sets (Builder)
- Selección de duración total (30, 45, 60, 90, 120 min).
- Selección de curva de energía básica (Estable, Ascendente, Descendente, Ola).
- Algoritmo de aproximación al tiempo objetivo.

### 3. Reproductor de Escenario (Player)
- Controles de transporte básicos (Play/Pause, Next/Prev).
- Visualización de Waveform (referencial).
- Barra de progreso de la canción actual.
- Fila de "Siguiente canción" visible.

### 4. Herramientas de Tiempo
- **Set Timer:** Cronómetro con tiempo restante total del set.
- **Set Progress:** Barra visual del avance del set completo.

### 5. Historial y Persistencia
- Guardado local de sets generados.
- Recuperación de sesiones previas (Local-First).

---

## ❌ Funcionalidades Excluidas (Out-of-Scope para MVP)
- **Audio Pro:** Pitch shifting, Time stretching, Crossfade avanzado (se usará el motor nativo del navegador).
- **IA Avanzada:** Clasificación automática de audio, detección de beats en tiempo real.
- **Nativo:** Versiones Desktop (Electron) o Mobile (Capacitor).
- **Nube:** Sincronización entre dispositivos, cuentas de usuario.
- **Hardware:** Soporte para controladores MIDI.

---

## 🚩 Criterios de Éxito del MVP
1. El músico puede generar un set de 45 min en menos de 2 minutos.
2. El audio no tiene micro-cortes durante la sesión.
3. El cronómetro es preciso y ayuda a terminar el set a tiempo.
