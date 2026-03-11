# SuniPlayer

**AI Performance Player for Live Musicians**

SuniPlayer es un reproductor musical inteligente para musicos que actuan en vivo. Su objetivo es ayudar a preparar, ordenar y ejecutar sets sin aumentar la carga mental del musico en escenario.

---

## Estado actual del proyecto

SuniPlayer esta hoy en una etapa de **alpha tecnica / prototipo funcional web**.

- El repositorio actual corre con `React + TypeScript + Vite + Zustand`.
- El flujo principal ya existe como prototipo: builder, player e historial.
- La arquitectura todavia esta en transicion: el codigo activo ya es TypeScript, pero se conserva un prototipo legacy como referencia historica.
- La documentacion de producto ya apunta a una evolucion futura mas ambiciosa, pero esa plataforma objetivo todavia no esta implementada en este repo.

## Que hace hoy el prototipo

- generar sets por duracion objetivo
- ajustar venue y curva de energia
- explorar repertorio por busqueda y mood
- importar audio local por archivos individuales o carpeta seleccionada
- guardar perfil musical por cancion, incluyendo tono objetivo y transposicion en semitonos
- enviar el set al player
- simular reproduccion con cola y timer
- guardar sets en historial local dentro del prototipo

## Stack actual

| Capa | Tecnologia actual |
|------|-------------------|
| Frontend | React 18 |
| Lenguaje | TypeScript + JSX legacy en transicion |
| Bundler | Vite 5 |
| Estado | Zustand |
| Estilos | estilos inline + theme tokens |
| Audio | simulacion de reproduccion en UI / prototipo |
| Persistencia | `localStorage` para configuracion, historial y contexto ligero del player |

## Importacion local de audio

- `ImportZone` permite arrastrar archivos, seleccionar multiples archivos o elegir una carpeta local de audio.
- En navegadores compatibles con File System Access API, tambien puede volver a sincronizar la carpeta elegida dentro de la misma sesion.
- Los tracks importados por el usuario siguen siendo assets de sesion porque usan `blob_url` locales del navegador.

## Perfil y transposicion

- Cada cancion puede guardar un `key` base y un `targetKey` para performance.
- SuniPlayer calcula y persiste `transposeSemitones` para recordar el cambio tonal deseado.
- En la etapa web actual, la reproduccion aplica la transposicion via `playbackRate`, por lo que cambia pitch y tempo juntos.

## Direccion futura

La direccion de producto sigue contemplando una evolucion hacia una app mas robusta para uso real en shows. Eso puede incluir:

- audio real en web como siguiente paso del prototipo
- persistencia local mas solida
- decision formal de plataforma entre continuar web o migrar a Expo / React Native
- evolucion futura a capacidades nativas si el audio en vivo lo exige

**Importante:** esa direccion futura no debe confundirse con el estado actual del repositorio.

---

## Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Build de produccion
npm run build
```

## Scripts disponibles hoy

| Comando | Estado | Descripcion |
|---------|--------|-------------|
| `npm run dev` | Disponible | Inicia Vite en modo desarrollo |
| `npm run build` | Disponible | Ejecuta TypeScript y build de Vite |
| `npm run preview` | Disponible | Previsualiza el build |
| `npm run lint` | Disponible | Ejecuta ESLint |
| `npm run typecheck` | Disponible | Ejecuta `tsc --noEmit` |
| `npm run test` | Disponible | Ejecuta tests unitarios con Vitest |
| `npm run test:watch` | Disponible | Ejecuta Vitest en modo watch |
| `npm run validate` | Disponible | Corre lint + typecheck + test + build |

## Estado de validaciones

- Validaciones automatizadas disponibles hoy: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run validate`
- CI base disponible en `.github/workflows/validate.yml`
- Gap pendiente para una base mas autonoma: ampliar la cobertura de tests y endurecer quality gates de producto

---

## Estructura actual del repo

```text
suniplayer/
├── legacy/                    # Prototipos y referencias retiradas
├── src/
│   ├── App.tsx                # App principal actual
│   ├── app/                   # Shell y composicion principal de la app
│   ├── components/            # Componentes reutilizables
│   ├── data/                  # Constantes, theme y mocks
│   ├── features/              # Estructura por dominio en adopcion gradual
│   ├── pages/                 # Vistas legacy/parciales
│   ├── services/              # Logica de negocio
│   ├── store/                 # Stores de Zustand
│   ├── types.ts               # Tipos principales actuales
│   └── utils/                 # Utilidades
├── .agents/                   # Skills y workflows operativos
├── AGENTS.md                  # Sistema multi-agente del proyecto
├── MVP_SCOPE.md               # Fuente principal de verdad del alcance
├── ROADMAP.md                 # Secuencia de evolucion del proyecto
├── ARCHITECTURE.md            # Arquitectura tecnica actual / proxima
├── DATA_MODEL.md              # Contratos de datos del dominio
├── DECISIONS.md               # Registro de decisiones tecnicas
├── TASKS.md                   # Backlog operativo
├── TESTING.md                 # Estrategia de validacion
└── package.json
```

## Estructura objetivo a medio plazo

La estructura esta migrando hacia una organizacion mas clara por dominios, con separacion entre:

- `app/` bootstrap
- `shared/` utilidades y contratos base
- `entities/` modelos de dominio
- `features/` funcionalidad por modulo, ya usada en `set-builder`
- `pages/` pantallas
- `legacy/` codigo retirado gradualmente

---

## Modelo de datos principal

Las entidades oficiales estan definidas en `DATA_MODEL.md`, pero a nivel conceptual el MVP gira en torno a:

```text
Track        -> cancion con metadata musical
SetPlan      -> set generado para una duracion objetivo
SetHistory   -> set guardado o ejecutado previamente
QueueItem    -> track dentro de la cola activa
Session      -> sesion de performance futura
Reaction     -> señal futura de respuesta del publico
```

## Fuente de verdad documental

Orden recomendado de lectura para humanos y agentes:

1. `MVP_SCOPE.md`
2. `DECISIONS.md`
3. `ROADMAP.md`
4. `ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `TASKS.md`
7. `TESTING.md`
8. `README.md`

## Principios del proyecto

1. **Musician-first**: cada feature debe resolver una necesidad real en vivo.
2. **MVP before sophistication**: primero utilidad real, despues complejidad.
3. **Offline-first**: lo critico del flujo debe funcionar sin internet.
4. **Stage-ready**: la UI debe resistir uso rapido y bajo presion.
5. **Arquitectura clara**: evitar mezclar UI, audio, negocio y datos en el mismo bloque.

---

## Documentacion relacionada

- `MVP_SCOPE.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `DECISIONS.md`
- `TASKS.md`
- `TESTING.md`
- `AGENTS.md`

---

*SuniPlayer existe para que el musico se concentre en tocar, no en pelear con la herramienta.*
