# Telemetría y Datos de Uso

## ¿Qué queremos saber?

El objetivo no es espiar al usuario — es **entender cómo se usa Suniplayer** para mejorarlo. Pero al ser una app que funciona 100% offline y sin servidor, la telemetría tradicional no aplica.

---

## Principios

1. **El usuario es dueño de sus datos.** Todo queda en su dispositivo.
2. **Privacidad por defecto.** No se recolecta nada sin consentimiento explícito.
3. **Sin IPs.** No tiene sentido capturar IPs en una app offline — no hay servidor al que reportar.
4. **Datos agregados, no individuales.** Si en algún momento se exportan estadísticas, son anónimas.

---

## Qué medimos (localmente)

### Datos de uso de la app

| Qué medimos | Para qué sirve |
|-------------|---------------|
| Cantidad de canciones importadas | Entender el tamaño típico de librería |
| Tipos de archivo más usados (mp3 vs wav vs flac) | Priorizar soporte de formatos |
| Features más usados (pitch shift, tempo, fade, etc.) | Saber qué mejorar y qué mantener |
| Tiempo en Modo Escucha vs Modo Edit vs Modo Show | Entender cómo se usa realmente la app (dato del tiempo total acumulado, persistido en DB; no confundir con el Cronómetro de Sesión que es volátil) |
| Tema más usado (dark vs light) | Decidir defaults en futuras versiones |
| Cantidad de marcadores por canción | Evaluar si el feature de marcadores se usa |
| Tamaño de playlists y sets creados | Guiar decisiones de UI |

### Datos de rendimiento

| Qué medimos | Para qué sirve |
|-------------|---------------|
| Tiempo de análisis de BPM | Optimizar el analizador |
| Memoria usada durante reproducción | Detectar leaks |
| Errores al cargar archivos | Identificar formatos problemáticos |
| Tiempo de carga de la app | Mejorar performance |

---

## ¿Cómo se presenta al usuario?

### En la vista de Perfil / Configuración

```text
ESTADÍSTICAS LOCALES
─────────────────────
Canciones importadas: 47
Tiempo total escuchado: 124 horas
En modo Show: 18 horas
Feature más usado: Cambio de tono (34 veces)

Estos datos están en tu dispositivo y no se comparten.
```

### Si el usuario quiere exportar

Puede generar un archivo JSON con estadísticas anónimas para compartir voluntariamente con el desarrollador.

```text
ESTADÍSTICAS ANÓNIMAS  ───  EXPORTAR
─────────────────────
✓ No incluye nombres de canciones
✓ No incluye rutas de archivos
✓ No incluye identificadores personales
✓ Solo métricas agregadas
```

---

## Lo que NO hacemos (aunque el README viejo lo mencionaba)

| Práctica | Por qué NO |
|----------|-----------|
| Capturar IPs | No hay servidor, no tiene sentido. Si lo hubiera en el futuro, requeriría consentimiento explícito + GDPR compliance. |
| Capturar "dónde se usa la app" | Geolocalización sin permiso es ilegal en casi todos los países. |
| Capturar tiempo de uso oculto | La telemetría debe ser transparente y opt-in. |

---

## ¿Habrá algún día un backend?

Quizás en el futuro para:

- Sincronizar sets entre dispositivos de un mismo músico.
- Compartir playlists con otros usuarios.
- Estadísticas anónimas globales para mejorar la app.

Pero si eso pasa:
1. Será opt-in, no obligatorio.
2. Requerirá una cuenta de usuario.
3. Los datos locales seguirán siendo del usuario.
4. Habrá un documento de privacidad específico.
