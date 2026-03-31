@echo off
setlocal
set ROOT=%~dp0..
set PID_FILE=%ROOT%\run\server.pid

powershell -NoProfile -ExecutionPolicy Bypass -Command "$pidFile='%PID_FILE%'; if (-not (Test-Path $pidFile)) { Write-Host 'STATUS: stopped'; exit 0 }; $procId = Get-Content $pidFile -ErrorAction SilentlyContinue; if (-not $procId) { Write-Host 'STATUS: stopped'; exit 0 }; $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue; if ($proc) { Write-Host ('STATUS: running (PID=' + $procId + ')') } else { Write-Host 'STATUS: stopped (stale pid file)'; Remove-Item $pidFile -ErrorAction SilentlyContinue }"
