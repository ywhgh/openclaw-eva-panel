@echo off
setlocal
set ROOT=%~dp0..
set RUN_DIR=%ROOT%\run
set LOG_FILE=%ROOT%\server.log
set ERR_FILE=%ROOT%\server.err.log
set PID_FILE=%RUN_DIR%\server.pid

if not exist "%RUN_DIR%" mkdir "%RUN_DIR%"

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$pidFile='%PID_FILE%'; if (Test-Path $pidFile) { $procId = Get-Content $pidFile -ErrorAction SilentlyContinue; if ($procId -and (Get-Process -Id $procId -ErrorAction SilentlyContinue)) { 'RUNNING' } else { Remove-Item $pidFile -ErrorAction SilentlyContinue; 'STALE' } } else { 'NONE' }"`) do set STATE=%%i

if /I "%STATE%"=="RUNNING" (
  echo EVA PANEL is already running.
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Location '%ROOT%'; npm run build"
if errorlevel 1 (
  echo Failed to build EVA PANEL.
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$root='%ROOT%'; $log='%LOG_FILE%'; $err='%ERR_FILE%'; $pidFile='%PID_FILE%'; $proc = Start-Process -FilePath node -ArgumentList 'server.js' -WorkingDirectory $root -RedirectStandardOutput $log -RedirectStandardError $err -PassThru; $proc.Id | Set-Content -Path $pidFile -Encoding ascii; Start-Sleep -Seconds 2; if (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) { Write-Host ('EVA PANEL started. PID=' + $proc.Id + ' URL=http://localhost:1312') } else { Write-Host 'Failed to start EVA PANEL.'; exit 1 }"
