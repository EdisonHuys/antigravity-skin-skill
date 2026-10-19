# Antigravity Skin Skill (反重力换肤技能)

> 专为 **Google Antigravity 2.0 桌面端** 定制的轻量级全景壁纸与毛玻璃换肤技能。基于 Chrome DevTools Protocol (CDP) 无损热注入，免编译、免重启，随心定制，支持一键秒级还原官方原生外观。

---

## ✨ 核心特性

- 🌸 **全景沉浸壁纸**：支持国风仙侠、二次元、真人唯美胶片等任意壁纸，自动优化人像焦点排布（支持 16:9 黄金靠右布局）。
- 🪟 **单层轻透磨砂毛玻璃**：与 Antigravity 左侧边栏同源质感，高透光磨砂（`blur(16px~20px)`），彻底根治多层嵌套变黑（Compound Alpha），通透清爽。
- 💎 **独立悬浮毛玻璃胶囊吸顶（Floating Glass Capsule）**：用户提问卡片优雅独立悬浮吸顶，彻底消除横跨全屏的生硬通栏切条（`md-sticky-message-bleed` 100% 透明），充裕 24px 呼吸间距，杜绝文字下压截断与上穿漏字。
- 🔓 **解除原生长文本遮罩截断**：彻底移除客户端自带的 `max-h-[10vh]` 截断与 `mask-image` 渐变灰雾，用户长提问与带图消息完整清晰透出。
- 🎯 **聊天流严格居中与抗抖动留白**：主阅读流维持 `896px` 黄金中心轴线，视口双重 padding 冲突消除，AI 生成过程零闪烁零拉扯。
- ⌨️ **斜杠命令菜单独立聚焦**：输入框触发的快捷指令与技能菜单配置深色高斯聚焦（`blur(28px)`），告别无底色导致的与工作区文字“叠罗汉”。
- 💡 **高辨识度选项视觉**：
  - **未选中态**：深透黑曜磨砂质感 + 1px 内嵌精细边框。
  - **悬停态（Hover）**：无抖动零挤压微透粉/金光，盒模型尺寸恒定。
  - **选中态（Selected）**：明艳霓虹发光光晕（`0 0 24px`）+ 左侧专属高亮指示条 + 纯白立体加粗文字，一眼定睛。
- 🧹 **纯净去水印**：彻底去除遮挡画面的微水印与杂色提示。
- 🔄 **开机常驻守护**：支持一键安装系统级守护进程，软件热更、窗口重开自动保真。
- ⏪ **一键无损还原**：随时秒级卸载注入样式与壁纸，无损恢复官方原生界面。

---

## 🎨 预设主题库

| 主题 ID | 主题名称 | 风格特色 | 标语 |
| :--- | :--- | :--- | :--- |
| `lin-yiyi` | **陈一一 · 阳光微热** | 树影斑驳午后唯美真人胶片人像壁纸，香槟金微光切边体系 | 树影斑驳的午后，微热里的心动。 |
| `pink-hanfu` | **粉蝶华裳** | 16:9 全景国风超清宽屏壁纸，人像黄金右侧排布 | 浮生若梦，落樱成妆。 |
| `arina-hashimoto` | **桥本有菜** | 温婉治愈日系实景壁纸，柔粉玫瑰光影 | 把柔光与玫瑰带进今天的工作台。 |

---

## 🚀 快速上手

### 1. 作为独立脚本运行

```bash
# 应用「陈一一 · 阳光微热」最新真人胶片主题
node scripts/apply_skin.mjs --theme lin-yiyi

# 应用「粉蝶华裳」国风主题
node scripts/apply_skin.mjs --theme pink-hanfu

# 应用「桥本有菜」日系主题
node scripts/apply_skin.mjs --theme arina-hashimoto

# 使用任意本地图片自定义换肤
node scripts/apply_skin.mjs --image "/path/to/your/wallpaper.jpg" --name "自定义主题" --tagline "心之所向，皆为风景"

# 查看所有本地可用主题
node scripts/list_themes.mjs

# 一键还原官方原生外观
node scripts/restore_skin.mjs

# 安装开机与重启常驻自动注入服务 (macOS LaunchAgent)
./scripts/install_daemon.sh

# 如需卸载常驻守护服务
./scripts/uninstall_daemon.sh
```

### 2. 作为 Antigravity 全局/工作区技能集成

```bash
# 全局安装（所有工作区通用）
git clone https://github.com/EdisonHuys/antigravity-skin-skill.git ~/.gemini/config/skills/antigravity-skin
```

安装后，在 Antigravity 聊天中即可直接通过自然语言触发：
- *“帮我切换到陈一一壁纸”*
- *“换个背景看看”*
- *“重启后自动保持皮肤”*
- *“还原默认皮肤”*

---

## 📂 项目结构

```text
antigravity-skin-skill/
├── SKILL.md                  # Antigravity 技能主定义文件（含制作标准 6 步流程）
├── README.md                 # 项目使用说明
├── active_theme.json         # 当前激活主题状态持久化配置
├── scripts/
│   ├── apply_skin.mjs        # 核心：CDP 样式与壁纸热注入脚本（含防重叠与去遮罩机制）
│   ├── restore_skin.mjs      # 核心：皮肤卸载与官方默认外观还原脚本
│   ├── daemon.mjs            # 守护进程：监听应用启动并自动注入激活主题
│   ├── install_daemon.sh     # 守护服务安装脚本 (macOS LaunchAgent)
│   ├── uninstall_daemon.sh   # 守护服务卸载脚本
│   └── list_themes.mjs       # 工具：扫描并列出本地主题库
├── themes/
│   ├── lin-yiyi/             # 预设主题：陈一一 · 阳光微热（真人胶片唯美壁纸）
│   │   ├── background.jpg    # 壁纸图片
│   │   └── theme.json        # 主题配置
│   ├── pink-hanfu/           # 预设主题：粉蝶华裳 16:9 全景国风
│   │   ├── background.jpg    # 壁纸图片
│   │   └── theme.json        # 主题配置
│   └── arina-hashimoto/      # 预设主题：桥本有菜 实景壁纸
│       ├── background.jpg    # 壁纸图片
│       └── theme.json        # 主题元数据
└── references/
    └── styling_guide.md      # 底层 CSS 架构与避坑规范全景指南
```

---

## 🛠️ 进阶参数

`apply_skin.mjs` 支持丰富的微调参数：
- `--theme <name>`：指定预设主题（`lin-yiyi`, `pink-hanfu`, `arina-hashimoto`）。
- `--image <path>`：指定自定义图片绝对路径。
- `--focus-x <0-1>`：壁纸横向焦点（默认 `0.72` 黄金靠右，`0.5` 为居中）。
- `--focus-y <0-1>`：壁纸纵向焦点（默认 `0.45`）。
- `--blur <px>`：毛玻璃磨砂模糊半径（默认 `16px`）。
- `--opacity <0-1>`：毛玻璃底色不透明度（默认 `0.18`）。
- `--port <number>`：显式指定 CDP 端口（默认自动探测 `/Library/Application Support/Antigravity/DevToolsActivePort`）。

---

## 📄 开源许可

[MIT License](LICENSE)
