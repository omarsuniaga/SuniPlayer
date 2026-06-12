# dispatch.ps1 — Suniplayer V2: despachador de agentes autónomos (v3)
# Cada latido (recomendado: 5 min) hace tres cosas y muere en milisegundos:
#   1. WATCHDOG: tarea [~] cuyo agente no tiene lock vivo = agente muerto sin
#      cerrar protocolo -> la reabre a [ ] automaticamente (cero tokens).
#   2. Lanza EN PARALELO (Start-Process) un tools/run-agent.ps1 por cada
#      agente con tarea lista y sin lock. No espera a nadie.
#   3. Termina. Los dependientes (needs:) se despachan en latidos siguientes.
# dispatch.log ya no queda retenido: la salida de cada agente va a tools/logs/.
# Formato de cola en STATUS.md:
#   - [ ] @agente #id-tarea engram:topic/key needs:#otra-tarea — descripción
#   [ ] = abierta · [~] = reclamada/en curso · [x] = terminada

$ErrorActionPreference = 'Continue'
$Repo    = 'C:\Users\omare\OneDrive\Documentos\SUNIPLAYER_V2'
$Status  = Join-Path $Repo 'STATUS.md'
$LockDir = Join-Path $Repo 'tools\locks'
$Log     = Join-Path $Repo 'tools\dispatch.log'
$Runner  = Join-Path $Repo 'tools\run-agent.ps1'
$Agents  = @('codex','antigravity','zen','claude')
$StaleLockHours = 2

New-Item -ItemType Directory -Force -Path $LockDir | Out-Null

function Write-Log($msg) { Add-Content -Path $Log -Value ("{0} {1}" -f (Get-Date -Format 's'), $msg) }

function Test-LockAlive($agent) {
  $lock = Join-Path $LockDir "$agent.lock"
  if (-not (Test-Path $lock)) { return $false }
  if (((Get-Date) - (Get-Item $lock).LastWriteTime).TotalHours -ge $StaleLockHours) {
    Remove-Item $lock -Force -ErrorAction SilentlyContinue
    Write-Log "$agent lock vencido, eliminado"
    return $false
  }
  return $true
}

# --- Parsear cola ---
$tasks = @()
foreach ($line in (Get-Content $Status -Encoding UTF8)) {
  if ($line -match '^- \[(?<st>[ x~])\] @(?<agent>[\w-]+) #(?<id>[\w-]+)(?<rest>.*)$') {
    $tasks += [pscustomobject]@{
      State = $Matches['st']; Agent = $Matches['agent']
      Id    = $Matches['id']; Rest  = $Matches['rest']; Line = $line
    }
  }
}
if (-not $tasks) { Write-Log 'ALERTA: 0 tareas parseadas (STATUS.md ilegible o cola vacia?)'; exit 0 }

# --- WATCHDOG: [~] sin lock vivo -> reabrir a [ ] o failover a Claude si 2ª muerte ---
$dirty = $false
$content = Get-Content $Status -Raw -Encoding UTF8
foreach ($t in @($tasks | Where-Object { $_.State -eq '~' })) {
  if (-not (Test-LockAlive $t.Agent)) {
    $newLine = $t.Line -replace '^- \[~\]', '- [ ]'
    if ($t.Line -match 'watchdog-retry' -and $t.Agent -ne 'claude') {
      # Segunda muerte del mismo agente sin entregar: reasignar al ejecutor confiable
      $newLine = ($newLine -replace ('@' + [regex]::Escape($t.Agent)), '@claude') + ' (failover->claude)'
      Write-Log ("WATCHDOG: #{0} reasignada @{1} -> @claude (segunda muerte)" -f $t.Id, $t.Agent)
      $t.Agent = 'claude'
    } else {
      $newLine = $newLine + ' (watchdog-retry)'
      Write-Log ("WATCHDOG: reabri #{0} (@{1} estaba en [~] sin lock vivo)" -f $t.Id, $t.Agent)
    }
    $content = $content.Replace($t.Line, $newLine)
    $t.State = ' '
    $dirty = $true
  }
}
if ($dirty) { Set-Content -Path $Status -Value $content -Encoding UTF8 -NoNewline }

# --- Tareas listas: abiertas con dependencia (needs:#id) cumplida ---
$doneIds = @{}
foreach ($t in $tasks) { if ($t.State -eq 'x') { $doneIds[$t.Id] = $true } }
$ready = @($tasks | Where-Object {
  $_.State -eq ' ' -and
  (-not ($_.Rest -match 'needs:#(?<n>[\w-]+)') -or $doneIds[$Matches['n']])
})
if (-not $ready) { Write-Log 'sin tareas listas'; exit 0 }

# --- Lanzar runners en paralelo (uno por agente listo, si no esta ocupado) ---
foreach ($agent in ($ready | Select-Object -ExpandProperty Agent -Unique)) {
  if ($Agents -notcontains $agent) { Write-Log "agente desconocido: $agent"; continue }
  if (Test-LockAlive $agent)       { Write-Log "$agent ocupado (lock), saltado"; continue }
  # El lock lo crea el DISPATCHER (no el runner) para cerrar la ventana de
  # carrera entre dos latidos consecutivos. El runner lo libera al terminar.
  New-Item -ItemType File -Force -Path (Join-Path $LockDir "$agent.lock") | Out-Null
  Start-Process -WindowStyle Hidden -FilePath 'powershell.exe' `
    -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$Runner,'-Agent',$agent)
  Write-Log "lanzado $agent en paralelo (salida: tools\logs\)"
}
