# setup_tasks.ps1 — Register resilient Windows Scheduled Tasks for EPFO Twitter Bot
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$batPath = Join-Path $scriptDir "run_browser_bot.bat"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Registering Resilient EPFO Twitter Tasks in Windows" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Runner Script: $batPath"

# Action: launch batch file
$action = New-ScheduledTaskAction -Execute $batPath -WorkingDirectory $scriptDir

# Settings:
# - StartWhenAvailable: Run as soon as possible if laptop was off/sleeping at scheduled time!
# - DisallowStartIfOnBatteries: False (runs even on battery!)
# - StopIfGoingOnBatteries: False
# - ExecutionTimeLimit: 1 hour
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -MultipleInstances IgnoreNew

# 1. Morning Task: 09:30 AM IST daily
$morningTrigger = New-ScheduledTaskTrigger -Daily -At "09:30 AM"
Register-ScheduledTask -TaskName "EPFO_Twitter_Morning" -Action $action -Trigger $morningTrigger -Settings $settings -Force | Out-Null
Write-Host "✅ Registered Task: EPFO_Twitter_Morning (Daily at 09:30 AM IST + Catchup if missed)" -ForegroundColor Green

# 2. Evening Task: 06:00 PM IST daily
$eveningTrigger = New-ScheduledTaskTrigger -Daily -At "06:00 PM"
Register-ScheduledTask -TaskName "EPFO_Twitter_Evening" -Action $action -Trigger $eveningTrigger -Settings $settings -Force | Out-Null
Write-Host "✅ Registered Task: EPFO_Twitter_Evening (Daily at 06:00 PM IST + Catchup if missed)" -ForegroundColor Green

# 3. Logon / Wakeup Catchup Task: At logon for current user with 1 minute delay
try {
    $logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $logonTrigger.Delay = "PT1M"
    Register-ScheduledTask -TaskName "EPFO_Twitter_LogonCatchup" -Action $action -Trigger $logonTrigger -Settings $settings -User $env:USERNAME -Force | Out-Null
    Write-Host "✅ Registered Task: EPFO_Twitter_LogonCatchup (Runs on boot/logon after 1m delay)" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Note: Logon trigger skipped (Morning & Evening tasks will handle wake-up catchup automatically)." -ForegroundColor Yellow
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " All 3 Scheduled Tasks successfully active in Windows!" -ForegroundColor Green
Write-Host " The bot will automatically post twice daily and catch up whenever your laptop connects to the internet." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
