# SuniPlayer

**AI Performance Player for Live Musicians**

SuniPlayer es una app para musicos en vivo enfocada en preparar, ordenar y ejecutar sets con menos friccion y mas confianza en escenario.

---

## Estado actual del proyecto

SuniPlayer ya no es un repo web unico. Ahora es un **monorepo multiplataforma** con tres capas principales:

- `apps/web`: app web/PWA en `React + TypeScript + Vite`
- `apps/native`: app mobile en `Expo + React Native` para iOS y Android
- `packages/core`: dominio compartido, stores, tipos y servicios reutilizables

### Realidad actual

- la app web sigue siendo la implementacion mas madura y funcional
- la app nativa ya existe y tiene infraestructura real de plataforma
- el core compartido ya concentra contratos y estado comun, pero la migracion todavia no esta completamente cerrada
- el directorio raiz `src/` ya no es la fuente principal de la app; la implementacion activa vive en `apps/`

---

## Estructura del monorepo

```text
suniplayer/
├── apps/
│   ├── native/         # Expo / React Native (iOS + Android)
│   └── web/            # React + Vite + PWA
├── packages/
│   └── core/           # Tipos, stores, contratos y logica compartida
├── .agents/            # Runtime operativo de agentes
├── docs/               # Documentacion de apoyo
├── legacy/             # Referencias historicas y material retirado
├── AGENTS.md
├── ARCHITECTURE.md
├── DATA_MODEL.md
├── DECISIONS.md
├── MVP_SCOPE.md
├── ROADMAP.md
├── TASKS.md
└── TESTING.md
```

## Stack actual por capa

| Capa | Stack |
|---|---|
| Web | React 18, TypeScript, Vite, Zustand, PWA |
| Native | Expo 55, React Native 0.83, Expo Router, Track Player, SQLite |
| Core | TypeScript, Zustand, contratos y servicios compartidos |

## Que hace hoy el producto

- generar sets por duracion objetivo
- ajustar filtros de repertorio y curvas basicas
- importar audio local
- enviar sets al player
- reproducir con cola y modo live/edit
- guardar metadata, historial y snapshots de sesion
- editar perfil de cancion, incluyendo transposicion tonal

---

## Source Of Truth

Orden recomendado de lectura:

1. `MVP_SCOPE.md`
2. `DECISIONS.md`
3. `ROADMAP.md`
4. `ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `TASKS.md`
7. `TESTING.md`
8. `README.md`

Si la documentacion y el codigo no coinciden, no se debe asumir nada en silencio: hay que registrar o corregir el conflicto.

---

## Scripts de workspace

Desde la raiz del repo:

```bash
pnpm install

pnpm dev:web
pnpm dev:native

pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm validate
```

### Scripts utiles

- `pnpm dev:web`: levanta la PWA/web
- `pnpm dev:native`: inicia Expo dev client
- `pnpm android`: corre la app Android nativa
- `pnpm ios`: corre la app iOS nativa
- `pnpm validate`: lint + typecheck + test + build soportado por el workspace

## Estado de validacion

- web: validacion fuerte disponible
- core: typecheck y test basicos disponibles
- native: tests y typecheck disponibles, pero el build distribuible depende del pipeline Expo/EAS

---

## Notas importantes de plataforma

- la PWA sigue siendo util para iterar rapido y validar UX/flujo
- iPad/iPhone tienen limites reales con archivos locales y sesiones del navegador
- la app nativa existe precisamente para resolver mejor persistencia, audio local y confiabilidad movil

## Estado de migracion

- `apps/web` y `apps/native` son la direccion oficial
- `packages/core` es la base oficial de dominio compartido
- cualquier referencia a `src/` en documentos antiguos debe considerarse legado o transicional salvo que se indique lo contrario

---

## Documentacion relacionada

- `ARCHITECTURE.md`
- `ROADMAP.md`
- `TASKS.md`
- `DECISIONS.md`
- `TESTING.md`
- `AGENTS.md`

---

*SuniPlayer existe para que el musico se concentre en tocar, no en pelear con la herramienta.*
