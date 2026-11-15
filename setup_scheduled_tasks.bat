@echo off
echo ========================================================
echo  Registering EPFO Twitter Auto-Poster (Twice Daily)
echo ========================================================
echo.
echo Morning Run: 09:30 AM IST
echo Evening Run: 05:30 PM IST
echo.

set "SCRIPT_PATH=%~dp0run_browser_bot.bat"

schtasks /create /tn "EPFO_Twitter_Morning" /tr "\"%SCRIPT_PATH%\"" /sc daily /st 09:30 /f
schtasks /create /tn "EPFO_Twitter_Evening" /tr "\"%SCRIPT_PATH%\"" /sc daily /st 17:30 /f

echo.
echo ========================================================
echo  SUCCESS: Tasks registered in Windows Task Scheduler!
echo  The bot will post fresh EPFO updates at 9:30 AM & 5:30 PM.
echo ========================================================
pause
