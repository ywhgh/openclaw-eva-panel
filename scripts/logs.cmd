@echo off
setlocal
set ROOT=%~dp0..
set LOG_FILE=%ROOT%\server.log
set ERR_FILE=%ROOT%\server.err.log

if exist "%LOG_FILE%" type "%LOG_FILE%"
if exist "%ERR_FILE%" type "%ERR_FILE%"
powershell -NoProfile -Command "$log='%LOG_FILE%'; $err='%ERR_FILE%'; if (Test-Path $log) { Get-Content -Path $log -Wait -Tail 80 }; if (Test-Path $err) { Get-Content -Path $err -Wait -Tail 80 }"
