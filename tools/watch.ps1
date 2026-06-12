# watch.ps1 — monitor en vivo del enjambre de agentes (SOLO LECTURA)
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File tools\watch.ps1
# Salir: Ctrl+C

$Repo = 'C:\Users\omare\OneDrive\Documentos\SUNIPLAYER_V2'

# UTF-8 en consola: sin esto, PS 5.1 muestra acentos y guiones como "â€”"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

while ($true) {
  Clear-Host
  Write-Host ("=== SUNIPLAYER - enjambre de agentes  [{0}] ===" -f (Get-Date -Format 'HH:mm:ss')) -ForegroundColor Cyan

  Write-Host "`n-- CORRIENDO AHORA (locks) --" -ForegroundColor Yellow
  $locks = Get-ChildItem (Join-Path $Repo 'tools\locks') -Filter *.lock -ErrorAction SilentlyContinue
  if ($locks) {
    foreach ($l in $locks) {
      $mins = [int]((Get-Date) - $l.LastWriteTime).TotalMinutes
      Write-Host ("  {0}  (hace {1} min)" -f $l.BaseName, $mins) -ForegroundColor Green
    }
  } else {
    Write-Host '  nadie corriendo en este momento'
  }

  Write-Host "`n-- COLA (STATUS.md) --" -ForegroundColor Yellow
  Get-Content (Join-Path $Repo 'STATUS.md') -Encoding UTF8 |
    Where-Object { $_ -match '^- \[.\] @' } |
    ForEach-Object {
      $c = if ($_ -match '^\- \[x\]') { 'DarkGreen' }
           elseif ($_ -match '^\- \[~\]') { 'Green' }
           else { 'Gray' }
      Write-Host ("  " + $_) -ForegroundColor $c
    }

  Write-Host "`n-- ULTIMAS LINEAS DEL LOG --" -ForegroundColor Yellow
  $tmp = Join-Path $env:TEMP 'dispatch-log-copy.txt'
  try {
    Copy-Item (Join-Path $Repo 'tools\dispatch.log') $tmp -Force -ErrorAction Stop
    Get-Content $tmp -Tail 12 | ForEach-Object { Write-Host ("  " + $_) }
  } catch {
    Write-Host '  (log ocupado por un agente escribiendo - reintento en 5s)' -ForegroundColor DarkGray
  }

  Start-Sleep -Seconds 5
}
