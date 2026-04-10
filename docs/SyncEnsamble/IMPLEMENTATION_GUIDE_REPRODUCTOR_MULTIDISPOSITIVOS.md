# 🎵 SuniPlayer P2P - Guía de Implementación Completa

## 🎯 Descripción General

SuniPlayer P2P es un sistema de reproducción de audio sincronizado en tiempo real usando:
- **WebRTC Data Channels** para comunicación P2P entre dispositivos
- **Firebase Realtime Database** como servidor de señalización (signaling)
- **Sincronización de timestamps** para reproducción simultánea (<50ms de retraso)

---

## 📋 Requisitos Previos

```bash
Node.js 16+
npm o yarn
Cuenta de Firebase (con base de datos Realtime)
React 16.8+ (o Vue/otro framework)
```

---

## 🚀 PASO 1: Configurar Firebase

### 1.1 Crear proyecto Firebase

1. Ve a https://console.firebase.google.com
2. Haz clic en "Create Project"
3. Nombre: `suniplayer-p2p`
4. Habilita Google Analytics (opcional)
5. Espera a que se cree

### 1.2 Configurar Realtime Database

1. En el panel de Firebase, ve a **Realtime Database**
2. Haz clic en **"Create Database"**
3. Ubicación: Elige la más cercana (ej: `us-central1` o similar)
4. Modo de seguridad: **"Start in test mode"** (para desarrollo)

### 1.3 Reglas de seguridad (test mode)

Reemplaza las reglas con esto (válido por 30 días):

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        "devices": {
          "$deviceId": {
            ".read": true,
            ".write": "auth.uid != null || true"
          }
        },
        "signals": {
          ".read": true,
          ".write": "auth.uid != null || true"
        },
        "signals_received": {
          ".read": true,
          ".write": "auth.uid != null || true"
        },
        "sync_commands": {
          ".read": true,
          ".write": "auth.uid != null || true"
        },
        "pending_commands": {
          ".read": true,
          ".write": "auth.uid != null || true"
        },
        "metrics": {
          ".read": true,
          ".write": "auth.uid != null || true"
        },
        "config": {
          ".read": true,
          ".write": "auth.uid != null || true"
        }
      }
    }
  }
}
```

### 1.4 Obtener credenciales

1. Ve a **Project Settings** (engranaje superior derecho)
2. Ve a la pestaña **"Your apps"**
3. Selecciona **Web** (</>)
4. Copia el objeto `firebaseConfig`
5. Reemplaza en `SuniPlayerP2P.jsx` línea 12-20

---

## 🔧 PASO 2: Instalar Dependencias

```bash
# En tu proyecto React
npm install simple-peer firebase

# O con yarn
yarn add simple-peer firebase
```

### Versiones recomendadas:
```json
{
  "simple-peer": "^9.11.1",
  "firebase": "^9.23.0",
  "react": "^18.2.0"
}
```

---

## 📦 PASO 3: Integrar Componente React

### 3.1 Copiar componente

```bash
# Copia SuniPlayerP2P.jsx a tu proyecto
cp SuniPlayerP2P.jsx src/components/
```

### 3.2 Usar en tu app

```jsx
// src/App.js
import SuniPlayerP2P from './components/SuniPlayerP2P';

function App() {
  return <SuniPlayerP2P />;
}

export default App;
```

### 3.3 Instalar librerías de UI (opcional)

Si usas Tailwind (recomendado):

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Si usas lucide-react para iconos:

```bash
npm install lucide-react
```

---

## ☁️ PASO 4: Desplegar Cloud Functions (Opcional pero Recomendado)

### 4.1 Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 4.2 Inicializar proyecto

```bash
firebase init functions
# Selecciona tu proyecto
# JavaScript como lenguaje
```

### 4.3 Copiar funciones

```bash
# En functions/index.js, reemplaza con firebase-functions.js
cp firebase-functions.js functions/index.js
```

### 4.4 Instalar dependencias de funciones

```bash
cd functions
npm install firebase-admin firebase-functions
```

### 4.5 Desplegar

```bash
firebase deploy --only functions
```

---

## 🔐 Configuración de Credenciales Firebase

En `SuniPlayerP2P.jsx`, línea 12-20, reemplaza:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // De Firebase Console
  authDomain: "YOUR_PROJECT.firebaseapp.com", // Tu proyecto
  databaseURL: "https://YOUR_PROJECT.firebaseio.com", // Tu DB
  projectId: "YOUR_PROJECT",                  // Tu proyecto ID
  storageBucket: "YOUR_PROJECT.appspot.com",  // Tu storage
  messagingSenderId: "YOUR_SENDER_ID",        // De console
  appId: "YOUR_APP_ID"                        // De console
};
```

### Cómo obtenerlas:
1. Firebase Console → Project Settings
2. Copia toda la sección "firebaseConfig"
3. Pégalo en el código

---

## 🧪 PASO 5: Pruebas Locales

### 5.1 Abrir 3 pestañas de navegador

```
Pestaña 1: http://localhost:3000/
Pestaña 2: http://localhost:3000/
Pestaña 3: http://localhost:3000/
```

### 5.2 Verificar que funciona

- [ ] Cada pestaña muestra un **deviceId diferente**
- [ ] Los 3 dispositivos aparecen bajo "Dispositivos Conectados"
- [ ] Selecciona canción en Pestaña 1 → Se reproduce en Pestaña 2 y 3
- [ ] Presiona Play/Pause en Pestaña 1 → Afecta a todas
- [ ] Desincronización (<100ms es normal)

---

## 🎧 PASO 6: Conectar Bluetooth Speaker

### 6.1 Asignar a un dispositivo específico

Modifica `SuniPlayerP2P.jsx` para detectar si es el dispositivo "master":

```javascript
// Línea ~85
const isBluetooth = deviceId === 'device_bluetooth_master'; // Cambia esto

// Si es Bluetooth, amplifica la salida
if (isBluetooth && navigator.mediaDevices) {
  // Canaliza el audio a Bluetooth automáticamente
  // (Se maneja normalmente a nivel del SO)
}
```

### 6.2 Flujo de audio

```
Pestaña 1 (selecciona canción)
  ↓ WebRTC
Pestaña 2 (dispositivo Bluetooth)
  ↓ Web Audio API
Bluetooth Speaker (amplifica)
```

---

## ⚙️ Parámetros Clave de Sincronización

En `SuniPlayerP2P.jsx`:

```javascript
// Línea ~320: Intervalo de sincronización
setInterval(() => {
  broadcastMessage({ type: 'SYNC_REQUEST' });
}, 5000);  // Cada 5 segundos

// Línea ~316: Umbral de desincronización
if (timeDrift > 0.2) {  // Si >200ms de diferencia
  audio.currentTime = syncResponse.currentTime;  // Ajusta
}
```

### Ajustar según necesidad:

- **Baja latencia** (música clásica): `syncInterval = 2000`, `threshold = 0.1`
- **Tolerancia alta** (podcasts): `syncInterval = 10000`, `threshold = 0.5`

---

## 🐛 Troubleshooting

### "Peers conectados pero sin audio"
- ✅ Verifica que `audio.src` sea una URL válida (línea ~262)
- ✅ Comprueba CORS en tu servidor de audio
- ✅ Abre DevTools (F12) → Console para errores

### "Dispositivos no aparecen"
- ✅ Verifica Firebase Realtime DB esté activa
- ✅ Comprueba que `firebaseConfig` sea correcto
- ✅ Ve a Firebase Console → Database → verifica datos en `/rooms`

### "Audio desfasado"
- ✅ Reduce `syncInterval` a 3-4 segundos
- ✅ Aumenta el valor de `threshold` si hay mucho jitter
- ✅ Verifica latencia de red (F12 → Network)

### "WebRTC no conecta"
- ✅ Asegúrate de estar en HTTPS (o localhost)
- ✅ Verifica que STUN/TURN servidores sean accesibles
- ✅ En networks con proxy, agrega servidor TURN propio

---

## 📊 Monitoreo de Sincronización

Abre Firebase Console y navega a:

```
Realtime Database → rooms → suniplayer_room_1 → devices
```

Deberías ver algo como:

```json
{
  "device_abc123": {
    "deviceId": "device_abc123",
    "timestamp": 1712282400000,
    "active": true
  },
  "device_xyz789": {
    "deviceId": "device_xyz789",
    "timestamp": 1712282401000,
    "active": true
  }
}
```

---

## 🚀 Optimizaciones Futuras

### 1. **Autenticación de usuarios**
```javascript
// Reemplazar Device ID anónimo con UID de usuario
const [userId, setUserId] = useState(auth.currentUser.uid);
```

### 2. **Persistencia de playlist**
```javascript
// Guardar en Firebase
set(ref(database, `users/${userId}/playlists`), songQueue);
```

### 3. **Compresión de audio**
```javascript
// Usar codec Opus para mejor eficiencia
// (Requiere WASM + libopus)
```

### 4. **Soporte para 10+ dispositivos**
```javascript
// Implementar Mesh Network o Star Topology
// En lugar de P2P completo
```

### 5. **Control de sesión**
```javascript
// Permitir que un usuario sea "DJ" controlador
const [djMode, setDjMode] = useState(false);
```

---

## 📚 Referencias

- **WebRTC**: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- **simple-peer**: https://github.com/feross/simple-peer
- **Firebase Realtime DB**: https://firebase.google.com/docs/database
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

## ✅ Checklist Final

- [ ] Firebase proyecto creado
- [ ] Realtime Database inicializada
- [ ] `firebaseConfig` correcto en código
- [ ] `simple-peer` y `firebase` instalados
- [ ] Componente integrado en React app
- [ ] Pruebas en 3 pestañas locales exitosas
- [ ] Bluetooth speaker conectado a uno de los dispositivos
- [ ] Música reproduce sincronizada (<50ms retraso)
- [ ] Cloud Functions desplegadas (opcional)
- [ ] HTTPS en producción (requisito WebRTC)

---

## 💬 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador (F12)
2. Verifica logs de Firebase Functions
3. Comprueba estadísticas en Firebase Console
4. Prueba en incógnito (sin cache)

¡Listo para sincronizar! 🎶
