# Despachador de agentes autónomos — Suniplayer V2

## Qué hace

`dispatch.ps1` lee la cola `## Cola de despacho autónomo` de `STATUS.md`.
Si hay tareas `[ ]` con dependencias cumplidas, lanza el CLI del agente
correspondiente en modo headless con su prompt fijo de `tools/prompts/`.
Si no hay nada, termina sin lanzar ningún agente (costo: 0 tokens).

El trabajo concreto NUNCA va en el prompt: viaja por Engram (topic_key en la
línea de la cola). Los prompts fijos solo dicen dónde buscar, cómo reclamar,
dónde reportar y cuándo terminar.

## Setup (una sola vez)

1. Probar una pasada manual y mirar el log:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\omare\OneDrive\Documentos\SUNIPLAYER_V2\tools\dispatch.ps1"
Get-Content "C:\Users\omare\OneDrive\Documentos\SUNIPLAYER_V2\tools\dispatch.log" -Tail 20
```

2. Si los binarios difieren (ej: `gemini` en vez de `antigravity`), editar la
   tabla `$AgentCmds` al inicio de `dispatch.ps1`.

3. Registrar el latido cada 30 minutos (PowerShell como usuario normal):

```powershell
$action  = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\omare\OneDrive\Documentos\SUNIPLAYER_V2\tools\dispatch.ps1"'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName 'SuniplayerDispatch' -Action $action -Trigger $trigger -Description 'Despachador de agentes Suniplayer V2'
```

Pausar/reanudar:

```powershell
Disable-ScheduledTask -TaskName 'SuniplayerDispatch'
Enable-ScheduledTask  -TaskName 'SuniplayerDispatch'
```

## Ciclo de vida de una tarea

```
[ ] abierta → agente la reclama [~] → trabaja → reporta a Engram → [x]
                                                      ↓ (si Zen/Claude rechazan)
                                  [x] → [ ] + "(rework: ver Engram review/{id})"
```

Las dependencias se declaran con `needs:#id` — el despachador no lanza una
tarea hasta que su dependencia esté en `[x]`. Así el pipeline
Codex → Zen → Claude se encadena solo, sin humano.

## Cómo agregar trabajo nuevo

1. Claude (arquitecto) define el contrato en Engram (`sdd/{nombre}/tasks`).
2. Se agrega UNA línea a la cola de STATUS.md con el formato máquina.
3. El próximo latido la despacha. Nada más.

## Archivos

- `tools/dispatch.ps1` — el despachador
- `tools/prompts/{codex,antigravity,zen,claude}.txt` — prompts fijos de arranque
- `tools/locks/` — locks anti doble-lanzamiento (auto-gestionados)
- `tools/dispatch.log` — historial de latidos y salidas de agentes
