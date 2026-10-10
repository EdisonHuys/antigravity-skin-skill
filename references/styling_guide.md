# Antigravity 2.0 换肤技术解析与样式规范

本文档详述 Antigravity 2.0 桌面端换肤的底层实现机理、DOM 结构与最新样式避坑指南。

---

## 一、架构与调试协议 (CDP)

Antigravity 2.0 桌面客户端采用 Electron / Chromium 渲染引擎。其在启动时会开启本地调试服务，端口号记录于：
`/Users/mac/Library/Application Support/Antigravity/DevToolsActivePort`

换肤脚本通过标准的 WebSocket 协议连接到该端口上的 Target Page，动态执行 DOM 插入与清理：
1. `#antigravity-dream-skin-bg`：全屏固定背景图层（`z-index: -99999`）。
2. `#antigravity-dream-skin-style`：覆盖全局样式的 `<style>` 标签。

---

## 二、核心工程避坑机制（五大实战沉淀）

### 1. 吸顶消息防重叠机制 (Sticky Anti-Collision)
* **DOM 特性**：用户发出的提问气泡祖先容器被配置了 `sticky top-0 z-10`。当用户在工作区向下翻阅历史长文时，提问气泡会悬浮吸附在顶部，正文从其背后穿过。
* **致命陷阱**：若气泡为纯透明（或被全局透明规则误伤），底层穿过的正文会直接透过气泡，与气泡内的提问字产生严重的文字重叠错乱。
* **标准方案**：
  * 精准为提问实体卡片（`div[data-testid="user-input-step"] div[class*="bg-card"]`）赋予 `rgba(22, 16, 28, 0.50)` + `blur(20px)` 的单层柔焦毛玻璃。
  * 吸顶时能够完全将底层字迹柔化为隐约微光，彻底消除透字与重叠。

### 2. 根治多层嵌套变黑 (Single-Layer Glass vs Compound Alpha)
* **DOM 特性**：输入框、提问气泡等在 Tailwind 架构下通常采用外层 `bg-card-border` 套内层 `bg-card` 的两层嵌套。
* **致命陷阱**：若外层与内层同时被赋予半透明毛玻璃，多层透明度与 blur 叠合，会导致局部变成深黑死块。
* **标准方案**：
  * 将 `--color-card` 设为 `transparent !important`。
  * 外层容器透明，仅保留细微高光切边（`inset 0 1px 0 rgba(255, 255, 255, 0.16)`），内层卡片统一应用单层微光（`0.28` 磨砂），杜绝叠加。

### 3. 解除原生长文本 10vh 截断与渐变遮罩 (Unmask & Uncap)
* **DOM 特性**：Antigravity 原生当消息包含图片或多行长文本时，默认添加了 `max-h-[10vh] overflow-hidden` 与 `mask-image: linear-gradient(black 85%, transparent 100%)`。
* **致命陷阱**：用户发出的消息超过视口高度 10% 时，下半截被硬性切断，并蒙上一层灰黑雾气遮罩。
* **标准方案**：
  * 强制将气泡内部的 `div[class*="max-h-"]` 设为 `max-height: none !important; overflow: visible !important;`。
  * 全局清除聊天流内部所有 `mask-image: none !important;`。

### 4. 主滚动容器安全留白与抗闪烁抖动 (Anti-Jitter Safe Zone)
* **DOM 特性**：主聊天流滚动容器（`div.isolate.overflow-y-auto.md-table-bleed`）自带原生贴底自动滚动计算逻辑（Auto-scroll anchoring）。
* **致命陷阱**：
  * 若直接在滚动视口容器上加 `padding-bottom`，会在元素高频渲染时引起 `scrollHeight` 与 `clientHeight` 震荡，导致生成时上下剧烈闪烁。
  * 若强行将思考折叠流改为 `overflow: visible`，会破坏虚拟滚动高度约束。
* **标准方案**：
  * 滚动视口自身保持 `padding-bottom: 0px !important;`。
  * 仅在内层内容容器（`div[class*="md-table-bleed"] > div[class*="mx-auto"]`）注入 `padding-bottom: 80px !important;`。
  * 视口顶部配置 `scroll-padding-top: 16px !important;`。

### 5. 对话流自然时序线性排列 (Natural Linear Chat Flow)
* **DOM 特性**：Antigravity 原生使用 `position: sticky` 尝试让用户消息吸顶，但当聊天流滚动或包含块高度变化时，Sticky 元素会在其包含块内持续滞留。
* **致命陷阱**：
  * 若轮次父容器具有高度或滚动偏移，Sticky 用户消息会滞留在容器底部，而 AI 回复（非 Sticky，处于正常流）会向上滚动，导致 AI 回复文字被直接推移到用户提问上方，造成极度反直觉的“回复出现在提问上面”的颠倒错乱。
* **标准方案**：
  * 强制将用户消息设为标准文档流：`div.sticky.top-0, div[role="article"][aria-label="用户消息"] { position: static !important; }`。
  * 彻底移除轮次容器的强制最小高度，保证会话按照“用户提问在上、AI 回复在下”的绝对时序严密排列，杜绝任何位移倒挂与穿透重叠。

### 6. 选项卡片 Tailwind 类名避坑与防抖动悬停
* **React 底层结构**：未选中态包含 `hover:bg-secondary`，选中态包含 `bg-secondary`。
* **致命陷阱**：若使用 `label[class*="bg-secondary"]` 属性选择器，会全量误伤未选中项。
* **标准方案**：
  * 严格使用类选择器 `.bg-secondary` 与 `:has(input:checked)` 伪类。
  * 常态设置 1px 细边框，悬停使用 `inset box-shadow`，几何尺寸恒定零抖动。

---

## 三、核心选择器速查表

| 目标元素 | CSS 选择器 | 关键属性 |
| :--- | :--- | :--- |
| **全屏壁纸** | `#antigravity-dream-skin-bg` | `position: fixed; z-index: -99999; pointer-events: none;` |
| **侧边栏** | `div.bg-sidebar.h-full, aside` | `backdrop-filter: blur(16px); background: rgba(18, 14, 24, 0.40);` |
| **聊天流居中** | `div[class*="mx-auto w-full"]` | `max-width: 896px !important; margin: 0 auto !important;` |
| **底部输入框** | `#antigravity.agentSidePanelInputBox` | `border-radius: 16px; background: rgba(18, 14, 24, 0.28); backdrop-filter: blur(16px);` |
| **吸顶提问气泡** | `div[data-testid="user-input-step"] div[class*="bg-card"]` | `background: rgba(22, 16, 28, 0.50); backdrop-filter: blur(20px); border-radius: 14px;` |
| **斜杠菜单浮层** | `#antigravity.agentSidePanelInputBox div[class*="bottom-full"]` | `background: rgba(22, 16, 28, 0.88); backdrop-filter: blur(28px); border-radius: 16px;` |
| **滚动安全留白** | `div[class*="overflow-y-auto"][class*="md-table-bleed"]` | `padding-bottom: 120px !important;` |
| **未选中选项** | `label[for*="ask-opt-"], [role="radiogroup"] label` | `background: rgba(20, 15, 26, 0.40); box-shadow: inset 0 0 0 1px ...;` |
| **选中选项** | `label[for*="ask-opt-"]:has(input:checked), label[for*="ask-opt-"].bg-secondary` | `background: linear-gradient(90deg, rgba(245, 158, 11, 0.48), ...); box-shadow: 0 0 24px ...;` |
