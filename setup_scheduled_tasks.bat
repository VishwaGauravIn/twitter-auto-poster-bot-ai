@echo off
cd /d "%~dp0"
echo ========================================================
echo  Registering Resilient EPFO Twitter Tasks (Twice Daily)
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_tasks.ps1"
echo.
pause
