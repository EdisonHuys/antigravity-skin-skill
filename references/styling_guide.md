# Antigravity 2.0 换肤技术解析与样式规范

本文档详述 Antigravity 2.0 桌面端换肤的底层实现机理、DOM 结构与样式避坑指南。

---

## 一、架构与调试协议 (CDP)

Antigravity 2.0 桌面客户端采用 Electron / Chromium 渲染引擎。其在启动时会开启本地调试服务，端口号记录于：
`/Users/mac/Library/Application Support/Antigravity/DevToolsActivePort`

换肤脚本通过标准的 WebSocket 协议连接到该端口上的 Target Page，动态执行 DOM 插入与清理：
1. `#antigravity-dream-skin-bg`：全屏固定背景图层（`z-index: -99999`）。
2. `#antigravity-dream-skin-style`：覆盖全局样式的 `<style>` 标签。

---

## 二、四大设计规范与核心避坑机制

### 1. 坚决杜绝“深色黑底大蒙层”
* **设计考量**：保持壁纸通透光鲜。
* **避坑**：深色大色块、深紫托底（如 `rgba(16, 11, 22, 0.72)`）或线性渐变会把画面变成黑乎乎的补丁，严重破坏观感。
* **标准方案**：全景保持原图高光，所有容器使用高透光轻透磨砂毛玻璃（`rgba(18, 14, 26, 0.18)` + `blur(16px)`）。

### 2. 聊天阅读区鼠标 Hover 绝不亮背景色
* **设计考量**：聊天区域内包含海量微型交互单元（代码块复制按钮、步骤折叠条、展开内容等）。
* **避坑**：若使用宽泛选择器在 `:hover` 上添加背景色，鼠标划过阅读内容时会产生令人烦躁的色块闪烁。
* **标准方案**：聊天流内所有元素鼠标悬停完全保持原生透明（`background: transparent !important`）。

### 3. 盒模型零挤压无抖动
* **设计考量**：杜绝鼠标划过选项时产生像素级形变或文字抖动。
* **避坑**：在未设置边框的元素上直接加 `border: 1px solid` 会增加 2px 物理尺寸，挤压相邻内容。
* **标准方案**：常态预设 1px 盒模型与 `box-sizing: border-box`，Hover 态使用 `inset box-shadow`，几何尺寸 100% 保持恒定。

### 4. 选项卡片 Tailwind CSS 属性选择器泛匹配避坑（重点！）
* **React 底层结构**：
  * Antigravity 的选项组件在未选中时分配 `className="... border hover:bg-secondary !border-transparent"`。
  * 在选中时分配 `className="... border bg-secondary border-border"`。
* **致命陷阱**：
  * 若使用 `label[class*="bg-secondary"]` 属性子串匹配，由于未选中态包含 `hover:bg-secondary`，会**全量误伤所有未选中项**，导致未选中项也显示为粉色发光，彻底丧失选中对比度。
* **标准方案**：
  * 严禁使用 `[class*="bg-secondary"]`。
  * 严格使用独立类名选择器 `.bg-secondary` 与输入框勾选状态伪类 `:has(input:checked)`、`:has(input[type="radio"]:checked)`、`:has(input[type="checkbox"]:checked)`。
  * 采用 `box-shadow: inset 0 0 0 1px ...` 机制，彻底免疫 Tailwind `.\!border-transparent` 对边框颜色的强制覆盖。

---

## 三、核心选择器速查表

| 目标元素 | CSS 选择器 | 关键属性 |
| :--- | :--- | :--- |
| **全屏壁纸** | `#antigravity-dream-skin-bg` | `position: fixed; z-index: -99999; pointer-events: none;` |
| **侧边栏** | `div.bg-sidebar.h-full, aside` | `backdrop-filter: blur(16px); background: rgba(18, 14, 26, 0.18);` |
| **聊天流居中** | `div[class*="mx-auto w-full"]` | `max-width: 896px !important; margin: 0 auto !important;` |
| **底部输入框** | `#antigravity.agentSidePanelInputBox` | `border-radius: 16px; background: rgba(18, 14, 26, 0.18);` |
| **提问气泡** | `div[class*="group/user-input-step"]` | `border-radius: 12px; background: rgba(18, 14, 26, 0.18);` |
| **未选中选项** | `label[for*="ask-opt-"], [role="radiogroup"] label` | `background: rgba(20, 15, 28, 0.60); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);` |
| **选项 Hover** | `label[for*="ask-opt-"]:not(:has(input:checked)):not(.bg-secondary):hover` | `background: rgba(255, 180, 215, 0.18); box-shadow: inset 0 0 0 1px rgba(255, 190, 215, 0.45);` |
| **选中选项** | `label[for*="ask-opt-"]:has(input:checked), label[for*="ask-opt-"].bg-secondary` | `background: linear-gradient(90deg, rgba(255, 120, 190, 0.50), ...); box-shadow: 0 0 24px rgba(255, 105, 180, 0.70), inset 4px 0 0 0 #ff2d7d;` |
| **选中序号徽标** | `label[for*="ask-opt-"]:has(input:checked) div[class*="bg-border"]` | `background: linear-gradient(135deg, #ff5599, #ff1a70); box-shadow: 0 0 12px rgba(255, 26, 112, 0.9);` |
| **暂停/终止按钮** | `button[aria-label*="Pause"] div` | `background-color: #ef4444 !important;` |
