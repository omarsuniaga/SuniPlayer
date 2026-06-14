# Vista Perfil

## ¿Qué es?

El centro de configuración y estadísticas personales de Suniplayer.

---

## Layout general

```text
┌──────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████████ │
│  █  ← Volver                  ⚙️  CONFIGURACIÓN          █ │
│  ████████████████████████████████████████████████████████████ │
│                                                              │
│  ─── TEMA ─────────────────────────────────────────────────── │
│                                                              │
│  [🌙 Oscuro]  [☀️ Claro]  [🔄 Seguir sistema]               │
│                                                              │
│  ─── SONIDO ───────────────────────────────────────────────── │
│                                                              │
│  Volumen global:                                             │
│  [0%] ────────●════════════════════ [100%]  75%             │
│                                                              │
│  ─── REPRODUCCIÓN ─────────────────────────────────────────── │
│                                                              │
│  [✓] Reanudar al abrir la app                               │
│  [ ] Reproducción automática                                │
│  [✓] Preservar tono al cambiar velocidad                    │
│                                                              │
│  ─── MODO SHOW ────────────────────────────────────────────── │
│                                                              │
│  Brillo de pantalla:     [───●──]  100%                     │
│  [✓] Bloquear notificaciones                                │
│  [✓] Mantener pantalla encendida                            │
│                                                              │
│  ─── ALMACENAMIENTO ───────────────────────────────────────── │
│                                                              │
│  ╔══════════════════════════════════════════════════════════╗ │
│  ║  💾  Espacio usado:          234 MB                     ║ │
│  ║  📦  Canciones cacheadas:    12 de 47                  ║ │
│  ║                                                          ║ │
│  ║  [🧹 Limpiar cache]                                     ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│                                                              │
│  ─── ESTADÍSTICAS ─────────────────────────────────────────── │
│                                                              │
│  ╔══════════════════════════════════════════════════════════╗ │
│  ║  ⏱  Tiempo total escuchado:     124h 32m               ║ │
│  ║  🎤  Shows realizados:          8                       ║ │
│  ║  🕐  Tiempo en shows:           18h 45m                ║ │
│  ║  🔥  Feature más usado:         Cambio de tono (34x)   ║ │
│  ║  ♫  Canciones más reproducida:  Salsa Brava (47x)      ║ │
│  ║  📊  BPM promedio:              118 BPM                 ║ │
│  ║                                                          ║ │
│  ║  [📤 Exportar estadísticas anónimas]                     ║ │
│  ╚══════════════════════════════════════════════════════════╝ │
│                                                              │
│  ─── ACERCA DE ────────────────────────────────────────────── │
│                                                              │
│  Suniplayer v1.0.0                                          │
│  [📜 Licencias]  [🔒 Privacidad]                            │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [🏠 Inicio]  [▶ Reproductor]  [📂 Librería]  [✏️  Edit]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Secciones

### 1. Tema
```text
[🌙 Oscuro]  [☀️ Claro]  [🔄 Seguir sistema]
```
Cambio instantáneo. Persiste entre sesiones.

### 2. Sonido
```text
Volumen global:
[0%] ────────●════════════════════ [100%]  75%
```
Define el volumen por defecto al abrir la app.

### 3. Reproducción
| Opción | Default |
|--------|---------|
| Reanudar al abrir la app | ✅ Sí |
| Reproducción automática | ❌ No |
| Preservar tono al cambiar velocidad | ✅ Sí |

### 4. Modo Show
| Opción | Default |
|--------|---------|
| Brillo de pantalla | 100% |
| Bloquear notificaciones | ✅ Sí |
| Mantener pantalla encendida | ✅ Sí |

### 5. Almacenamiento
```text
╔══════════════════════════════════════════════════════════╗
║  💾  Espacio usado:          234 MB                     ║
║  📦  Canciones cacheadas:    12 de 47                  ║
║                                                          ║
║  [🧹 Limpiar cache]                                     ║
╚══════════════════════════════════════════════════════════╝
```
**Limpiar cache:**
```text
Modal:
┌─────────────────────────────────────────────────────────┐
│  ¿Eliminar las copias cacheadas?                        │
│  Las canciones seguirán en tu librería,                 │
│  pero necesitarán el archivo original.                  │
│                                                         │
│       [Cancelar]        [Eliminar cache]                │
└─────────────────────────────────────────────────────────┘
```

### 6. Estadísticas
```text
╔══════════════════════════════════════════════════════════╗
║  ⏱  Tiempo total escuchado:     124h 32m               ║
║  🎤  Shows realizados:          8                       ║
║  🕐  Tiempo en shows:           18h 45m                ║
║  🔥  Feature más usado:         Cambio de tono (34x)   ║
║  ♫  Canciones más reproducida:  Salsa Brava (47x)      ║
║  📊  BPM promedio:              118 BPM                 ║
║                                                          ║
║  [📤 Exportar estadísticas anónimas]                     ║
╚══════════════════════════════════════════════════════════╝
```

**Exportar anónimas:**
Genera un JSON sin nombres de canciones ni rutas de archivos.

### 7. Acerca de
```text
Suniplayer v1.0.0
[📜 Licencias]  [🔒 Privacidad]
```

---

## Lo que NO está en esta vista

- No están los controles de reproducción (están en Vista Reproductor).
- No está la preparación de sets ni la configuración de transiciones (está en Edit).
- No está el modo show en vivo (está en Vista Show).
- No se pueden importar ni gestionar canciones desde acá (está en Librería).
- No están las Colecciones Inteligentes ni el acceso al catálogo (están en Inicio).
