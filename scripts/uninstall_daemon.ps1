# Antigravity Skin Daemon - Windows 卸载脚本
$ErrorActionPreference = "SilentlyContinue"

# 1. 终止正在运行的守护进程
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -like "*daemon.mjs*" } |
    ForEach-Object { 
        Stop-Process -Id $_.ProcessId -Force
        Write-Host "已终止运行中的守护进程 (PID: $($_.ProcessId))" -ForegroundColor Yellow
    }

# 2. 移除开机自启脚本
$vbsPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\antigravity-skin-daemon.vbs"
if (Test-Path $vbsPath) {
    Remove-Item -Force $vbsPath
    Write-Host "已移除开机自启脚本：$vbsPath" -ForegroundColor Yellow
}

Write-Host "✅ Antigravity 皮肤守护服务已成功注销！" -ForegroundColor Green
