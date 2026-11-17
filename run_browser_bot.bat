@echo off
cd /d "%~dp0"
set "PATH=C:\Users\acer\.local\nodejs;C:\Users\acer\.local\bin;%PATH%"
node daily_runner.js %*
