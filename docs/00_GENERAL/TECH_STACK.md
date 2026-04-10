# TECH STACK: SuniPlayer

## 🌍 Idioma y Localización
- **Idioma Principal**: Español (voseo).
- **Estándar**: Toda la UI debe ser nativa en español para maximizar la comodidad del músico en el escenario.

## 🎧 Audio Engine
- **Motor**: `@soundtouchjs/audio-worklet`.
- **Arquitectura**: AudioWorklet (Hilo separado) para estabilidad extrema.
- **Algoritmo**: WSOLA para Pitch y Tempo independientes.
- **Canales**: Arquitectura Dual A/B.

## 💾 Persistencia
- **Storage**: Arquitectura Híbrida OPFS (Binarios) + IndexedDB (Metadata).
- **State**: Zustand con 5 stores de dominio y 1 orquestador (`useProjectStore`).

## 🎨 Frontend
- **Web**: React 18 + Vite + TypeScript.
- **UI**: Vanilla CSS con diseño industrial de alta densidad (Cockpit UI).
- **Icons**: SVG optimizados (Heroicons/Custom).

---
*SuniPlayer utiliza las tecnologías más vanguardistas del navegador para una performance de grado industrial.*
