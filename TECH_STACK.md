# SuniPlayer — Tech Stack

> Estado actual del monorepo y direccion tecnica por plataforma.

## Workspace actual

- **Monorepo:** `pnpm workspace`
- **Apps:** `apps/web`, `apps/native`
- **Shared core:** `packages/core`

## Web App (`apps/web`)

- **React 18**
- **TypeScript**
- **Vite 5**
- **Zustand**
- **PWA** con `vite-plugin-pwa`
- **IndexedDB** + `localStorage` para persistencia web
- **HTML5 Audio / Web Audio** y tooling de analisis web

## Native App (`apps/native`)

- **React Native** + **Expo 55**
- **Expo Router**
- **TypeScript**
- **Zustand** compartido via `@suniplayer/core`
- **AsyncStorage** para estado movil
- **expo-sqlite** para persistencia local fuerte
- **react-native-track-player** para audio nativo
- **expo-document-picker** + **expo-file-system** para acceso a archivos

## Shared Core (`packages/core`)

- **TypeScript**
- **Zustand stores** compartidos
- **shared domain types**
- **set builder logic**
- **platform interfaces** (`IAudioEngine`, `IStorage`, `IFileAccess`)

## Future direction

- mejorar parity entre web y native
- endurecer la experiencia nativa en iPad/iPhone y Android para uso real de escenario
- mantener la PWA como superficie rapida de iteracion y validacion
- evaluar audio avanzado y DSP de mayor calidad solo cuando el MVP de escenario este probado

---

### En una sola frase

| Momento | Stack |
|---------|-------|
| Hoy | Monorepo con Web + Native + Core compartido |
| Para shows moviles serios | Expo / React Native + audio nativo |
| Para evolucion futura | mejorar parity, persistencia y audio avanzado |
