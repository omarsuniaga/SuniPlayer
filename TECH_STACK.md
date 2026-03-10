# SuniPlayer — Tech Stack

> Arquitectura por capas. Cada capa tiene su tecnología óptima.

## MVP Mobile (Fase 1)
- **React Native** + **Expo** SDK 53
- **TypeScript**
- **Zustand** + React Query (estado)
- **expo-audio** → módulos nativos (gradual)
- **SQLite** (expo-sqlite)
- **NativeWind** + Lucide React Native (UI)

## Desktop / Pro Version (Fase 2)
- **Tauri 2**
- **Rust** (core logic)
- **Vue 3** or **React** + TypeScript + Tailwind
- **SQLite** via Rust

## AI / Machine Learning (Fase 4)
- **Python** (PyTorch / scikit-learn) para entrenamiento
- **ONNX** para exportar modelos
- **ONNX Runtime** para inferencia local (móvil, desktop, web)

## Future Audio Core (Fase 3)
- **Rust** native audio libs (cpal, rodio, symphonia)
- o **JUCE** + C++ si el DSP se vuelve central

---

### En una sola frase

| Momento | Stack |
|---------|-------|
| Para empezar | Expo + TypeScript |
| Para escalar serio | Tauri + Rust |
| Para audio extremo pro | JUCE + C++ |
