#!/bin/bash
PLIST_PATH="$HOME/Library/LaunchAgents/com.antigravity.skin-daemon.plist"

if [ -f "$PLIST_PATH" ]; then
    launchctl bootout gui/$(id -u) "$PLIST_PATH" 2>/dev/null || launchctl unload "$PLIST_PATH" 2>/dev/null || true
    rm -f "$PLIST_PATH"
    echo "✅ 已卸载 Antigravity 皮肤后台常驻服务。"
else
    echo "ℹ️ 未发现已安装的常驻服务。"
fi
