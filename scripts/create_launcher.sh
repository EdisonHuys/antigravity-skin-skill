#!/bin/bash
set -e

APP_NAME="Antigravity 换肤版"
DEST_PATH="/Applications/${APP_NAME}.app"
ORIGINAL_APP="/Applications/Antigravity.app"
ICON_SOURCE="${ORIGINAL_APP}/Contents/Resources/icon.icns"

echo "🔨 正在创建 ${APP_NAME}.app (含智能端口探活与自愈引导)..."

if [ ! -d "$ORIGINAL_APP" ]; then
    echo "❌ 未检测到原版 Antigravity.app: ${ORIGINAL_APP}"
    exit 1
fi

rm -rf "$DEST_PATH"

TMP_SCRIPT=$(mktemp /tmp/antigravity_launcher.XXXXXX.applescript)
cat << 'EOF' > "$TMP_SCRIPT"
set portFile to (POSIX path of (path to application support from user domain)) & "Antigravity/DevToolsActivePort"
tell application "System Events"
    set isRunning to (name of processes) contains "Antigravity"
end tell

set hasPort to false
if isRunning then
    try
        do shell script "test -f " & quoted form of portFile
        set hasPort to true
    end try
end if

if isRunning and not hasPort then
    tell application "System Events"
        activate
        set userChoice to button returned of (display dialog "检测到 Antigravity 正在运行，但尚未开启 CDP 调试端口（导致换肤无法挂载）。\n\n是否立即重新启动 Antigravity 以开启自动换肤？\n（重启前请确保已保存重要编辑）" buttons {"取消", "立即重启换肤"} default button "立即重启换肤" with icon caution with title "Antigravity 换肤助手")
    end tell
    
    if userChoice is "立即重启换肤" then
        tell application "Antigravity" to quit
        repeat 6 times
            tell application "System Events"
                if not ((name of processes) contains "Antigravity") then exit repeat
            end tell
            delay 0.5
        end repeat
        do shell script "killall Antigravity 2>/dev/null || true"
        delay 0.5
        do shell script "open -a '/Applications/Antigravity.app' --args --remote-debugging-port=0"
    end if
else
    do shell script "open -a '/Applications/Antigravity.app' --args --remote-debugging-port=0"
end if
EOF

# 1. 使用 osacompile 编译 AppleScript 启动脚本
osacompile -o "$DEST_PATH" "$TMP_SCRIPT"
rm -f "$TMP_SCRIPT"

# 2. 注入原版高清应用图标
if [ -f "$ICON_SOURCE" ]; then
    cp "$ICON_SOURCE" "$DEST_PATH/Contents/Resources/applet.icns"
fi

# 3. 优化 Info.plist 配置
PLIST="$DEST_PATH/Contents/Info.plist"
if [ -f "$PLIST" ]; then
    /usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string com.antigravity.skin-launcher" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.antigravity.skin-launcher" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string '${APP_NAME}'" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName '${APP_NAME}'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :CFBundleName string '${APP_NAME}'" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :CFBundleName '${APP_NAME}'" "$PLIST"
    /usr/libexec/PlistBuddy -c "Add :LSUIElement bool true" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :LSUIElement true" "$PLIST"
fi

# 4. 移除隔离属性并重新进行本地临时签名
xattr -cr "$DEST_PATH" 2>/dev/null || true
codesign --force --deep --sign - "$DEST_PATH" 2>/dev/null || true
touch "$DEST_PATH"

echo "✅ 成功创建专属启动应用: ${DEST_PATH}"
echo "🌟 特性：冷启动秒开端口；若发现老进程未开启端口，将弹出弹窗一键平滑重启换肤！"
