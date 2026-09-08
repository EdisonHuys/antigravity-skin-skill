---
name: antigravity-skin
description: >-
  Antigravity 2.0 桌面交互端轻量毛玻璃换肤与壁纸定制技能。支持为 Antigravity 2.0 切换全景壁纸（如国风「粉蝶华裳」、实景「桥本有菜」等预设主题或任意自定义图片）、应用左侧边栏同款轻透磨砂毛玻璃视觉、维持聊天阅读流 896px 轴心居中对齐、实现交互选项极高辨识度的选中发光光晕与左侧指示条、无抖动平滑悬停，彻底去除文字水印并锁定无滚动条，随时一键无损还原官方原生外观。当用户提出换肤、更换背景、自定义壁纸、修改毛玻璃透明度、优化弹窗选项视觉或还原皮肤时使用此技能。
---

# Antigravity 2.0 桌面换肤与毛玻璃主题技能 (Antigravity Dream Skin)

本技能用于为 Electron 架构的 **Antigravity 2.0 桌面交互端**提供无侵入式的热注入换肤能力。基于 Chrome DevTools Protocol (CDP)，无需编译或修改应用安装包，即可在运行时实时注入全景壁纸、轻透毛玻璃质感、居中对齐布局与高辨识度交互视觉，并支持一键秒级还原。

---

## 核心设计规范

1. **轻透毛玻璃与沉浸全景（Light Frosted Glass & Zero Watermark）**：
   * 整体视觉与左侧边栏统一，采用高透光磨砂（`rgba(18, 14, 26, 0.18)` + `backdrop-filter: blur(16px)`）。
   * 严禁加入死黑、纯黑的大色块或厚重深色渐变蒙层，确保背景壁纸通透明亮。
   * 界面保持纯粹通透，不展示任何遮挡画面的微水印或文字标识。
2. **居中轴心对齐与滚动条锁定（Centered Layout & Scroll Lock）**：
   * 聊天内容流容器（`div.mx-auto.w-full`）与底部输入框在同一中心轴线上严格居中对齐（宽度 `896px`，`margin: 0 auto !important`）。
   * 全局页面锁定 `overflow: hidden !important`，杜绝桌面端产生多余的全局外层滚动条，聊天仅在主阅读流内部顺畅滚动。
3. **交互选项高对比度与零挤压悬停（High-Contrast Options & Zero-Shift Hover）**：
   * **未选中态**：呈现纯粹深邃的**深透黑曜磨砂质感**（`rgba(20, 15, 28, 0.60)`）与 1px 内嵌精细边框，低调灰白数字徽标，层次分明。
   * **悬停态（Hover）**：仅对未选中项生效（`:not(:has(input:checked)):not(.bg-secondary):hover`），呈现细腻柔粉泛光（`rgba(255, 180, 215, 0.18)`），**尺寸恒定零抖动**，绝不挤压周围排版。
   * **选中态（Selected）**：
     * **明艳粉紫光晕**：`linear-gradient` 高光粉背景 + `0 0 24px rgba(255, 105, 180, 0.70)` 浪漫霓虹外发光。
     * **左侧专属高亮条**：内嵌 4px 亮粉实线指示条（`inset 4px 0 0 0 #ff2d7d`），一眼定睛。
     * **高光发光徽标**：`#ff5599` 至 `#ff1a70` 亮粉渐变底色 + 纯白边框 + 外发光。
     * **文字清晰加粗**：纯白 `#ffffff` 加粗与柔和文字投影，彻底告别模糊。
4. **功能按钮与细节修复**：
   * 任务执行时的暂停/终止按钮红色正方形图标强制高亮（`#ef4444 !important`），确保状态清晰可见。

---

## 常用操作指引

### 1. 应用精选预设主题

#### 主题 A：【粉蝶华裳】（国风 16:9 全景宽屏壁纸，人像黄金右侧排布）
```bash
node scripts/apply_skin.mjs --theme pink-hanfu
```

#### 主题 B：【桥本有菜】（温婉治愈日系实景壁纸）
```bash
node scripts/apply_skin.mjs --theme arina-hashimoto
```

### 2. 使用任意自定义本地图片换肤

支持传入本地任何 JPG / PNG / WebP 格式的壁纸图片：

```bash
node scripts/apply_skin.mjs --image "/path/to/your/wallpaper.jpg" --name "自定义主题" --tagline "心之所向，皆为风景"
```

可选参数：
* `--image <path>`：本地图片绝对路径。
* `--theme <name>`：预设主题目录名称（如 `pink-hanfu` 或 `arina-hashimoto`）。
* `--focus-x <0-1>`：壁纸横向焦点位置（0.0 ~ 1.0，如人像靠右建议 `0.72`，居中为 `0.5`）。
* `--focus-y <0-1>`：壁纸纵向焦点位置（0.0 ~ 1.0，通常设为 `0.45`）。
* `--blur <px>`：毛玻璃模糊度（默认 `16px`）。
* `--opacity <0-1>`：毛玻璃底色不透明度（默认 `0.18`）。
* `--port <number>`：显式指定 Antigravity 调试端口（若省略则自动探测）。

### 3. 一键还原官方原生外观

任何时候无需重启软件，均可秒级卸载注入的样式与背景：

```bash
node scripts/restore_skin.mjs
```

### 4. 查看当前所有可用预设主题

```bash
node scripts/list_themes.mjs
```

---

## 目录结构

```text
antigravity-skin/
├── SKILL.md                  # 本技能主说明文件
├── scripts/
│   ├── apply_skin.mjs        # 核心：CDP 样式与壁纸热注入脚本（含最新高对比度选项与防抖规范）
│   ├── restore_skin.mjs      # 核心：皮肤卸载与官方默认外观还原脚本
│   └── list_themes.mjs       # 工具：扫描并列出本地主题库
├── themes/
│   ├── pink-hanfu/           # 预设主题：粉蝶华裳「浮生若梦，落樱成妆」16:9 全景国风
│   │   ├── background.jpg    # 16:9 扩图超清壁纸
│   │   └── theme.json        # 主题配置（焦点坐标与配色方案）
│   └── arina-hashimoto/      # 预设主题：桥本有菜「把柔光与玫瑰带进今天的工作台」
│       ├── background.jpg    # 壁纸图片
│       └── theme.json        # 主题元数据
└── references/
    └── styling_guide.md      # 样式架构与选择器技术文档（详述 Tailwind 避坑机制）
```

---

## 常见问题与排查 (Troubleshooting)

1. **提示找不到 CDP 端口或连接被拒绝**：
   * 检查 Antigravity 是否正常运行。
   * 脚本会自动读取 `/Users/mac/Library/Application Support/Antigravity/DevToolsActivePort`。
   * 若端口变动，可通过 `curl http://127.0.0.1:<端口>/json/list` 核实。
2. **换肤后部分元素没有立刻刷新**：
   * 重新执行 `node scripts/apply_skin.mjs` 即可瞬间热替换。
3. **选项卡片样式异常**：
   * 检查是否误用了 `[class*="bg-secondary"]` 泛匹配选择器。必须严格使用类选择器 `.bg-secondary` 与 `:has(input:checked)` 伪类。
