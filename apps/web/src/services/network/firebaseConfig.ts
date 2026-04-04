// apps/web/src/services/network/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase (Debes obtener estos valores de la consola de Firebase)
// En producción, carga estos valores desde variables de entorno de Netlify
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD3kNj3CK6cKJuQ7JKd5Z0eWdC1Mg3s8XE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "appai-7a3ec.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "appai-7a3ec",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "appai-7a3ec.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1023972109466",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1023972109466:web:f71872366be9f39d294323"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
