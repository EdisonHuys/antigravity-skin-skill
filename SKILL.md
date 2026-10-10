---
name: antigravity-skin
description: >-
  Antigravity 2.0 桌面交互端轻量毛玻璃换肤与壁纸定制技能。支持为 Antigravity 2.0 切换全景壁纸（如国风「粉蝶华裳」、实景「桥本有菜」、真人「陈一一 · 阳光微热」等预设主题或任意自定义图片）、应用左侧边栏同款轻透磨砂毛玻璃视觉、维持聊天阅读流 896px 轴心居中对齐、实现吸顶消息防重叠柔焦毛玻璃、底部输入框与工件单层轻透微光、彻底解除原生 10vh 截断与遮罩、斜杠指令弹窗聚焦磨砂、交互选项极高辨识度的选中发光光晕与指示条、无抖动平滑悬停，以及随时一键无损还原官方原生外观。当用户提出换肤、更换背景、制作新皮肤、自定义壁纸、修改毛玻璃透明度、优化弹窗选项视觉或还原皮肤时使用此技能。
---

# Antigravity 2.0 桌面换肤与毛玻璃主题技能 (Antigravity Dream Skin)

本技能用于为 Electron 架构的 **Antigravity 2.0 桌面交互端**提供无侵入式的热注入换肤能力。基于 Chrome DevTools Protocol (CDP)，无需编译或修改应用安装包，即可在运行时实时注入全景壁纸、轻透毛玻璃质感、居中对齐布局、吸顶消息柔焦防透与高辨识度交互视觉，并支持一键秒级还原与开机常驻守护。

---

## 🎨 皮肤制作与发布标准流程 (Skin Crafting Workflow)

制作一套高质感、高可读性的 Antigravity 2.0 皮肤，遵循以下六步标准闭环：

### 第一步：准备壁纸资产与黄金焦点定位
1. **壁纸规格**：推荐使用 16:9 比例、分辨率不低于 2K (2560×1440) 或 4K 的清晰壁纸（JPG / WebP 格式）。
2. **人像/主体黄金排布**：
   * Antigravity 的左侧为会话侧边栏（宽度 ~260px），中间为聊天阅读流（896px 居中）。
   * 壁纸核心视觉主体（人像面部、焦点景物）最佳放置于**右侧 65% ~ 80%** 区域，避免被中间文字或左侧边栏大面积遮盖。
   * 记录焦点的相对坐标：`focusX`（通常人像靠右设为 `0.72`，居中为 `0.50`）与 `focusY`（视线高度通常设为 `0.45`）。

### 第二步：创建主题目录与元数据
在 `themes/` 目录下以英文小写中划线命名新建主题文件夹（如 `themes/my-theme/`），并准备两个文件：
1. `background.jpg`：放置处理好的超清壁纸文件。
2. `theme.json`：定义主题元数据与焦点：
   ```json
   {
     "name": "主题中文名称",
     "tagline": "一句话诗意中文标语",
     "art": {
       "focusX": 0.72,
       "focusY": 0.45
     }
   }
   ```

### 第三步：调校专属配色与毛玻璃系统
根据壁纸色调（暖阳金、冷萃蓝、浅粉樱、暗夜紫等），在 `scripts/apply_skin.mjs` 中微调配色变量：
* `warmBorder` / 主题细边框：`rgba(255, 222, 190, 0.24)`
* `hoverGlass` / 悬停微光：`rgba(255, 215, 175, 0.18)`
* `activeGlass` / 激活高光：`rgba(255, 205, 155, 0.26)`
* `amberAccent` / 强调高光：`#f59e0b`

### 第四步：执行核心工程避坑原则
所有主题开发必须遵守以下 5 大硬核工程铁律，杜绝视觉残缺：
1. **吸顶消息防重叠（Sticky Message Anti-Collision）**：
   * 用户发出的消息卡片具有 `sticky top-0 z-10` 吸顶特性。当页面滚动时，下方的长文本会从其背后滑过。
   * 必须为用户消息赋予 `rgba(22, 16, 28, 0.50)` + `blur(20px)` 实体毛玻璃与柔和高光切边，彻底雾化底层文字，绝对禁止裸透明。
2. **根治多层嵌套变黑（Single-Layer Glass vs Compound Alpha）**：
   * 输入框、提问气泡等组件在 Tailwind 下常常是外层 `bg-card-border` 套内层 `bg-card`。
   * 必须只保留一层有效磨砂，内层所有多余背景强制清零（`transparent`），防止双重透明度叠加变黑。
3. **解除原生长文本 10vh 截断与渐变灰雾（Unmask & Uncap）**：
   * 强制解除客户端自带的 `max-h-[10vh]` 截断与 `mask-image: linear-gradient`，防止用户长提问或带图消息下半截被吞。
4. **主滚动容器安全留白与抗闪烁（Anti-Jitter Safe Zone）**：
   * 视口自身保持 `padding-bottom: 0px !important`，仅在内层内容容器设置 `padding-bottom: 80px !important`，杜绝自动贴底滚动与双重 padding 产生的振荡闪烁。
5. **新消息发送防顶出上边界（Anti-Overflow on Submit）**：
   * 轮次外层 `flex items-start` 必须配合子容器 `min-height: calc(100cqh - 100px) !important` 强制拉伸，防止刚发送消息时父级高度过矮拖拽吸顶气泡穿透顶部视口；为吸顶气泡保留 `top: 10px !important` 优雅呼吸空间。
6. **快捷指令菜单高斯聚焦（Slash Popup Blur Isolation）**：
   * 输入框触发的 `/` 斜杠命令与技能菜单（`bottom-full`）必须配置深色高聚焦磨砂（`blur(28px)`），防止无底色与工作区文字“叠罗汉”。

### 第五步：CDP 热注入与多窗口实机验证
1. 运行 `node scripts/apply_skin.mjs --theme <theme-id>`，脚本会自动读取活动 CDP 端口并完成注入。
2. 通过 CDP 执行截图抓取，检查：
   * 中间工作区背景是否 100% 透明直现壁纸。
   * 用户吸顶消息在滚动时是否稳固遮挡底层文字且不透字。
   * 输入框、代码块与工件卡片是否具有轻透单层毛玻璃质感，零死黑。
   * 行内代码与正文是否锐利清晰无灰雾。

### 第六步：更新元数据与提交推送
1. 同步修改 `SKILL.md`、`README.md` 与 `references/styling_guide.md`。
2. 将新增的 `themes/<theme-id>/` 资源与脚本提交至 Git，编写规范的简体中文 Conventional Commits 并推送到远程仓库。

---

## 🎨 预设主题库一览

| 主题 ID | 主题名称 | 风格特色 | 标语 |
| :--- | :--- | :--- | :--- |
| `lin-yiyi` | **陈一一 · 阳光微热** | 树影斑驳午后唯美真人胶片人像壁纸，香槟金微光切边体系 | 树影斑驳的午后，微热里的心动。 |
| `pink-hanfu` | **粉蝶华裳** | 16:9 全景国风超清宽屏壁纸，人像黄金右侧排布，仙侠唯美 | 浮生若梦，落樱成妆。 |
| `arina-hashimoto` | **桥本有菜** | 温婉治愈日系实景壁纸，柔粉玫瑰光影 | 把柔光与玫瑰带进今天的工作台。 |

---

## 🚀 常用操作指引

### 1. 应用精选预设主题
```bash
# 应用「陈一一 · 阳光微热」最新真人胶片主题
node scripts/apply_skin.mjs --theme lin-yiyi

# 应用「粉蝶华裳」国风主题
node scripts/apply_skin.mjs --theme pink-hanfu

# 应用「桥本有菜」日系主题
node scripts/apply_skin.mjs --theme arina-hashimoto
```

### 2. 使用任意自定义本地图片换肤
支持传入本地任何 JPG / PNG / WebP 格式的壁纸图片：
```bash
node scripts/apply_skin.mjs --image "/path/to/your/wallpaper.jpg" --name "自定义主题" --tagline "心之所向，皆为风景"
```

可选参数：
* `--image <path>`：本地图片绝对路径。
* `--theme <name>`：预设主题目录名称。
* `--focus-x <0-1>`：壁纸横向焦点位置（0.0 ~ 1.0，人像靠右建议 `0.72`，居中为 `0.5`）。
* `--focus-y <0-1>`：壁纸纵向焦点位置（0.0 ~ 1.0，通常设为 `0.45`）。
* `--blur <px>`：毛玻璃模糊度（默认 `16px`）。
* `--opacity <0-1>`：毛玻璃底色不透明度（默认 `0.18`）。
* `--port <number>`：显式指定 Antigravity 调试端口（若省略则自动探测）。

### 3. 开机与重启自动注入（常驻守护进程）
```bash
# 一键安装常驻守护服务 (macOS LaunchAgent)
./scripts/install_daemon.sh

# 如需卸载常驻守护服务
./scripts/uninstall_daemon.sh
```

### 4. 一键还原官方原生外观
```bash
node scripts/restore_skin.mjs
```

### 5. 查看所有本地可用主题
```bash
node scripts/list_themes.mjs
```

---

## 📂 项目结构

```text
antigravity-skin/
├── SKILL.md                  # 技能主说明文件（含主题制作完整流程与设计规范）
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

## 📄 开源许可

[MIT License](LICENSE)
