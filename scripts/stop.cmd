@echo off
setlocal
set ROOT=%~dp0..
set PID_FILE=%ROOT%\run\server.pid

powershell -NoProfile -ExecutionPolicy Bypass -Command "$pidFile='%PID_FILE%'; if (-not (Test-Path $pidFile)) { Write-Host 'EVA PANEL is not running.'; exit 0 }; $procId = Get-Content $pidFile -ErrorAction SilentlyContinue; if (-not $procId) { Remove-Item $pidFile -ErrorAction SilentlyContinue; Write-Host 'EVA PANEL is not running.'; exit 0 }; $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue; if ($proc) { Stop-Process -Id $procId -Force; Write-Host ('Stopped EVA PANEL. PID=' + $procId) } else { Write-Host 'Stale PID file removed.' }; Remove-Item $pidFile -ErrorAction SilentlyContinue"
