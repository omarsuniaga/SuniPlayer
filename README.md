# SuniPlayer

**AI Performance Player for Live Musicians**

SuniPlayer es un reproductor musical inteligente para musicos que actuan en vivo. Funciona como un copiloto de escenario: organiza tu repertorio, arma sets por duracion exacta, gestiona el flujo del show y analiza la reaccion del publico.

---

## Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Tests
npm run test
```

## Stack Tecnico

| Capa | Tecnologia |
|------|-----------|
| Platform | React Native + Expo SDK 53 |
| Language | TypeScript (strict) |
| State | Zustand |
| Audio | expo-audio (MVP), modulos nativos (futuro) |
| Database | SQLite (expo-sqlite) |
| UI | NativeWind + Lucide React Native |
| Navigation | Expo Router v5 |
| Testing | Jest + @testing-library/react-native |

## Estructura del Proyecto

```
suniplayer/
├── app/                    # Expo Router pages
│   ├── (tabs)/
│   │   ├── index.tsx       # Home / Player
│   │   ├── library.tsx     # Music Library
│   │   ├── sets.tsx        # Set Builder
│   │   └── profile.tsx     # Settings
│   ├── _layout.tsx         # Root layout
│   └── +not-found.tsx
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── player/         # Player controls, waveform
│   │   ├── queue/          # Queue list, track rows
│   │   ├── library/        # Library browser, filters
│   │   ├── timer/          # Set timer, alerts
│   │   └── set-builder/    # Set generation UI
│   ├── services/           # Business logic
│   │   ├── AudioService.ts
│   │   ├── SetBuilderService.ts
│   │   ├── DatabaseService.ts
│   │   └── SuggestionService.ts
│   ├── stores/             # Zustand stores
│   │   ├── audioStore.ts
│   │   ├── queueStore.ts
│   │   ├── setStore.ts
│   │   └── libraryStore.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── audio.ts
│   │   ├── set.ts
│   │   └── database.ts
│   ├── utils/              # Helper functions
│   │   ├── time.ts
│   │   ├── duration.ts
│   │   └── validation.ts
│   └── constants/          # App constants
│       ├── Colors.ts
│       ├── Audio.ts
│       └── Venues.ts
├── docs/                   # Project documentation
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   └── ALIGNMENT.md
├── __tests__/              # Test files
│   ├── services/
│   ├── stores/
│   └── utils/
├── .github/
│   └── workflows/
│       └── ci.yml          # CI pipeline
├── TASKS.md                # Development backlog
├── TESTING.md              # Testing strategy
├── AGENTS.md               # AI agent autonomy rules
├── app.json                # Expo config
├── tsconfig.json           # TypeScript config
├── package.json
└── README.md               # This file
```

## Modelo de Datos Principal

```
Track       → cancion con metadata (bpm, key, energy, mood, duration)
Set         → lista de tracks con duracion objetivo y tipo de venue
SetTrack    → track dentro de un set con posicion y config
CuePoint    → marca temporal dentro de un track
Session     → una presentacion real (fecha, venue, sets tocados)
Reaction    → score de respuesta del publico por track
```

## Scripts Disponibles

| Comando | Descripcion |
|---------|------------|
| `npm run dev` | Inicia Expo en modo desarrollo |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Corrige errores de lint automaticamente |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm run test` | Ejecuta suite de tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run validate` | Ejecuta lint + typecheck + test (pre-commit) |

## Roadmap

- **v0.1** — Reproductor + Set Builder + Timer (actual)
- **v0.2** — Biblioteca musical con importacion de archivos
- **v0.3** — Persistencia SQLite + historial
- **v0.4** — Crossfade basico + transiciones
- **v1.0** — MVP completo para uso en shows reales

## Documentacion

- [Arquitectura Tecnica](docs/ARCHITECTURE.md)
- [Estrategia de Stack](docs/TECH_STACK.md)
- [Backlog de Tareas](TASKS.md)
- [Estrategia de Testing](TESTING.md)
- [Reglas de Agentes IA](AGENTS.md)

## Principios de Desarrollo

1. **Offline-first**: todo funciona sin internet
2. **Stage-ready**: la UI debe ser usable en escenario con poca luz
3. **Zero-crash**: la app no puede fallar durante un show
4. **Musician-first**: cada feature debe resolver un problema real de performance

---

*SuniPlayer — porque el musico debe concentrarse en tocar, no en gestionar playlists.*
