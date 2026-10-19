# Antigravity Skin Daemon - Windows 安装与自启动注册脚本
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$skillDir = Split-Path -Parent $scriptDir
$daemonMjs = Join-Path $scriptDir "daemon.mjs"

# 1. 查找 Node.js 路径
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $sysPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $env:Path = "$userPath;$sysPath"
    $nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
}

if (-not $nodePath) {
    Write-Error "未找到 Node.js，请先安装 Node.js！"
    exit 1
}

# 2. 终止任何现有的守护进程
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*daemon.mjs*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# 3. 确保 active_theme.json 为启用状态
$activeThemePath = Join-Path $skillDir "active_theme.json"
if (Test-Path $activeThemePath) {
    try {
        $cfg = Get-Content $activeThemePath -Raw | ConvertFrom-Json
        if ($cfg.enabled -eq $false) {
            $cfg.enabled = $true
            if (-not $cfg.theme -and -not $cfg.image) {
                $cfg.theme = "pink-hanfu"
            }
            $cfg | ConvertTo-Json -Depth 5 | Set-Content $activeThemePath -Encoding UTF8
        }
    } catch {}
} else {
    @{ theme = "pink-hanfu"; enabled = $true } | ConvertTo-Json | Set-Content $activeThemePath -Encoding UTF8
}

# 4. 创建静默启动的 VBS 脚本于 Windows 自启动目录 (开机/登录自动运行)
$startupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$vbsPath = Join-Path $startupDir "antigravity-skin-daemon.vbs"
$line1 = "' Antigravity Skin Daemon Silent Launcher"
$line2 = 'Set shell = CreateObject("WScript.Shell")'
$line3 = 'cmd = Chr(34) & "' + $nodePath + '" & Chr(34) & " " & Chr(34) & "' + $daemonMjs + '" & Chr(34)'
$line4 = 'shell.Run cmd, 0, False'
$vbsContent = @($line1, $line2, $line3, $line4) -join "`r`n"
Set-Content -Path $vbsPath -Value $vbsContent -Encoding Ascii

# 5. 使用 WMI 独立进程树立即启动守护进程 (脱离终端与工作区生命周期，永驻后台)
$cmdLine = "`"$nodePath`" `"$daemonMjs`""
$res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmdLine }

if ($res.ReturnValue -eq 0) {
    Write-Host "✅ Antigravity 皮肤自启动常驻守护服务已成功注册并启动！" -ForegroundColor Green
    Write-Host "守护进程 PID: $($res.ProcessId)" -ForegroundColor Cyan
    Write-Host "开机自启脚本：$vbsPath"
    Write-Host "每次打开 Antigravity 或重启电脑，均会自动为您注入当前主题。"
} else {
    Write-Error "守护进程启动失败，错误代码: $($res.ReturnValue)"
}
