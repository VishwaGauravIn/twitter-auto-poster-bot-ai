@echo off
setlocal
set "PATH=C:\Users\acer\.local\nodejs;C:\Users\acer\.local\bin;%PATH%"
cd /d "%~dp0"

if "%~1"=="" (
    claude
) else (
    cmd /c "claude -p "%*" < nul"
)
