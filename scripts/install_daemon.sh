#!/bin/bash
set -e

PLIST_PATH="$HOME/Library/LaunchAgents/com.antigravity.skin-daemon.plist"
SCRIPT_PATH="$HOME/.gemini/config/skills/antigravity-skin/scripts/daemon.mjs"
NODE_BIN=$(which node || echo "/opt/homebrew/bin/node")

# Unload old plist if exists
if [ -f "$PLIST_PATH" ]; then
    launchctl bootout gui/$(id -u) "$PLIST_PATH" 2>/dev/null || launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

cat << PLIST > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.antigravity.skin-daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_BIN</string>
        <string>$SCRIPT_PATH</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/antigravity-skin-daemon.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/antigravity-skin-daemon.err</string>
</dict>
</plist>
PLIST

launchctl bootstrap gui/$(id -u) "$PLIST_PATH" 2>/dev/null || launchctl load "$PLIST_PATH"

echo "✅ Antigravity 皮肤自启动常驻服务已成功安装并启动！"
echo "每次打开 Antigravity 或重启电脑，均会自动为您注入当前主题。"
