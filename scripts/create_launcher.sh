#!/bin/bash
set -e

APP_NAME="Antigravity 换肤版"
DEST_PATH="/Applications/${APP_NAME}.app"
ORIGINAL_APP="/Applications/Antigravity.app"
ICON_SOURCE="${ORIGINAL_APP}/Contents/Resources/icon.icns"

echo "🔨 正在创建 ${APP_NAME}.app ..."

if [ ! -d "$ORIGINAL_APP" ]; then
    echo "❌ 未检测到原版 Antigravity.app: ${ORIGINAL_APP}"
    exit 1
fi

rm -rf "$DEST_PATH"

# 1. 使用 osacompile 编译 AppleScript 启动脚本
osacompile -o "$DEST_PATH" -e 'do shell script "open -a \"/Applications/Antigravity.app\" --args --remote-debugging-port=0"'

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
    # 后台静默执行，启动时不弹额外菜单栏与多余跳动图标
    /usr/libexec/PlistBuddy -c "Add :LSUIElement bool true" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :LSUIElement true" "$PLIST"
fi

# 4. 移除隔离属性并重新进行本地临时签名
xattr -cr "$DEST_PATH" 2>/dev/null || true
codesign --force --deep --sign - "$DEST_PATH" 2>/dev/null || true
touch "$DEST_PATH"

echo "✅ 成功创建专属启动应用: ${DEST_PATH}"
echo "🌟 你可以直接在 Spotlight（聚焦搜索）中输入「${APP_NAME}」回车启动，或直接拖入 Dock 栏！"
