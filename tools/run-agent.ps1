# run-agent.ps1 — wrapper de UN agente: corre su CLI headless con su prompt
# fijo, vuelca su salida a tools\logs\<agente>-<fecha>.log y libera su lock
# al terminar (pase lo que pase). Lo lanza dispatch.ps1 con Start-Process.
param([Parameter(Mandatory=$true)][string]$Agent)

$ErrorActionPreference = 'Continue'
$Repo    = 'C:\Users\omare\OneDrive\Documentos\SUNIPLAYER_V2'
$LockDir = Join-Path $Repo 'tools\locks'
$LogDir  = Join-Path $Repo 'tools\logs'
$Lock    = Join-Path $LockDir "$Agent.lock"
$MainLog = Join-Path $Repo 'tools\dispatch.log'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType File -Force -Path $Lock | Out-Null   # refresca timestamp del lock

function Write-Log($msg) { Add-Content -Path $MainLog -Value ("{0} {1}" -f (Get-Date -Format 's'), $msg) }
function Get-NativeArg($s) { if ($PSVersionTable.PSVersion.Major -lt 7) { return ($s -replace '"', '\"') } return $s }
function Resolve-Bin([string[]]$c) {
  foreach ($x in $c) { if (Get-Command $x -ErrorAction SilentlyContinue) { return $x } }
  throw ("sin binario: {0}" -f ($c -join ','))
}

$AgentCmds = @{
  codex       = { param($p) codex exec --sandbox workspace-write -c approval_policy=never -C $Repo (Get-NativeArg $p) }
  antigravity = { param($p) & (Resolve-Bin @('antigravity','gemini')) --yolo -p (Get-NativeArg $p) }
  zen         = { param($p) opencode run (Get-NativeArg $p) }
  claude      = { param($p) claude -p (Get-NativeArg $p) --permission-mode acceptEdits }
}

try {
  if (-not $AgentCmds.ContainsKey($Agent)) { Write-Log "runner: agente desconocido $Agent"; exit 1 }
  $promptFile = Join-Path $Repo "tools\prompts\$Agent.txt"
  if (-not (Test-Path $promptFile)) { Write-Log "runner: falta $promptFile"; exit 1 }
  $prompt = Get-Content $promptFile -Raw -Encoding UTF8

  $outLog = Join-Path $LogDir ("{0}-{1}.log" -f $Agent, (Get-Date -Format 'MMdd-HHmmss'))
  Write-Log ("runner: {0} arranca (salida: {1})" -f $Agent, (Split-Path $outLog -Leaf))
  Push-Location $Repo
  try     { & $AgentCmds[$Agent] $prompt *>&1 | Add-Content -Path $outLog }
  finally { Pop-Location }
  Write-Log ("runner: {0} termino" -f $Agent)
}
finally {
  Remove-Item $Lock -ErrorAction SilentlyContinue
}
