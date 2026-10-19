import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Locate available WebSocket implementation
let WebSocket;
try {
  WebSocket = globalThis.WebSocket;
} catch (e) {}

if (!WebSocket) {
  const wsPaths = [
    "ws",
    "/Users/mac/.nvm/versions/node/v18.0.0/lib/node_modules/@vue/cli-service/node_modules/webpack-dev-server/node_modules/ws",
    "/usr/local/lib/node_modules/ws"
  ];
  for (const p of wsPaths) {
    try {
      WebSocket = require(p);
      if (WebSocket) break;
    } catch (e) {}
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    theme: null,
    image: null,
    name: "Custom Theme",
    tagline: "个性化毛玻璃主题",
    focusX: 0.5,
    focusY: 0.5,
    blur: 16,
    opacity: 0.18,
    port: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--theme" && args[i + 1]) {
      options.theme = args[++i];
    } else if (arg === "--image" && args[i + 1]) {
      options.image = args[++i];
    } else if (arg === "--name" && args[i + 1]) {
      options.name = args[++i];
    } else if (arg === "--tagline" && args[i + 1]) {
      options.tagline = args[++i];
    } else if (arg === "--focus-x" && args[i + 1]) {
      options.focusX = parseFloat(args[++i]);
    } else if (arg === "--focus-y" && args[i + 1]) {
      options.focusY = parseFloat(args[++i]);
    } else if (arg === "--blur" && args[i + 1]) {
      options.blur = parseInt(args[++i], 10);
    } else if (arg === "--opacity" && args[i + 1]) {
      options.opacity = parseFloat(args[++i]);
    } else if (arg === "--port" && args[i + 1]) {
      options.port = parseInt(args[++i], 10);
    }
  }
  return options;
}

// Auto-detect active Antigravity CDP debugging port
function detectPort() {
  const candidates = [
    process.env.APPDATA ? path.join(process.env.APPDATA, "Antigravity", "DevToolsActivePort") : null,
    path.join(process.env.HOME || "/Users/mac", "Library/Application Support/Antigravity/DevToolsActivePort"),
    process.env.HOME ? path.join(process.env.HOME, ".config/Antigravity/DevToolsActivePort") : null
  ].filter(Boolean);

  for (const portFile of candidates) {
    if (fs.existsSync(portFile)) {
      try {
        const content = fs.readFileSync(portFile, "utf8").trim();
        const lines = content.split("\n");
        const port = parseInt(lines[0], 10);
        if (port > 0) return port;
      } catch (e) {}
    }
  }
  return 53735; // default fallback
}

// Fetch open CDP targets
async function getTargets(port) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// Evaluate JavaScript inside the target page via CDP
async function evalInPage(wsUrl, code) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;

    const onOpen = () => {
      ws.send(JSON.stringify({
        id: id++,
        method: "Runtime.evaluate",
        params: {
          expression: code,
          returnByValue: true,
          awaitPromise: true
        }
      }));
    };

    const onMessage = (eventOrData) => {
      const data = eventOrData?.data !== undefined ? eventOrData.data : eventOrData;
      const msg = JSON.parse(data.toString());
      if (msg.id === 1) {
        try { ws.close(); } catch (e) {}
        if (msg.error) reject(msg.error);
        else resolve(msg.result?.result?.value);
      }
    };

    const onError = (err) => {
      reject(err);
    };

    if (typeof ws.on === 'function') {
      ws.on("open", onOpen);
      ws.on("message", onMessage);
      ws.on("error", onError);
    } else if (typeof ws.addEventListener === 'function') {
      ws.addEventListener("open", onOpen);
      ws.addEventListener("message", onMessage);
      ws.addEventListener("error", onError);
    } else {
      ws.onopen = onOpen;
      ws.onmessage = onMessage;
      ws.onerror = onError;
    }
  });
}

// Generate CSS for pure light frosted glass theme with warm golden tones and aux pane glass
function generateCss({ bgDataUri, focusX, focusY, blur, opacity }) {
  const fx = focusX * 100;
  const fy = focusY * 100;
  const bgGlass = `rgba(18, 14, 26, ${opacity})`;
  // 柔暖香槟金与琥珀微光配色体系（呼应陈一一暖阳微热胶片壁纸）
  const warmBorder = `rgba(255, 222, 190, 0.22)`;
  const hoverGlass = `rgba(255, 215, 175, 0.18)`;
  const activeGlass = `rgba(255, 205, 155, 0.26)`;
  const amberAccent = `#f59e0b`;

  return `
  /* --- Antigravity Warm Golden Dream Skin: Light Frosted Glass & Aux Pane Glass --- */
  :root, .dark, body {
    --color-background: transparent !important;
    --background: transparent !important;
    --sidebar: rgba(255, 255, 255, 0.05) !important;
    --color-sidebar: rgba(255, 255, 255, 0.05) !important;
    --color-sidebar-secondary: ${hoverGlass} !important;
    --color-card: transparent !important;
    --card: transparent !important;
    --color-card-border: ${warmBorder} !important;
    --card-border: ${warmBorder} !important;
    --color-muted: transparent !important;
    --muted: transparent !important;
    --color-secondary: ${hoverGlass} !important;
    --secondary: ${hoverGlass} !important;
    --color-secondary-foreground: #ffffff !important;
    --secondary-foreground: #ffffff !important;
  }

  /* 1. 全景壁纸 */
  #antigravity-dream-skin-bg {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: -99999 !important;
    pointer-events: none !important;
    background-image: url("${bgDataUri}") !important;
    background-size: cover !important;
    background-position: ${fx}% ${fy}% !important;
    background-repeat: no-repeat !important;
  }

  /* 2. 全局底色透明化：中间主工作区 100% 纯净透亮，无弹出时直现高清壁纸 */
  html, body {
    overflow: hidden !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    background-color: transparent !important;
  }
  #root, #root > div,
  .bg-background, [class*="bg-background"],
  div[class*="overflow-hidden"]:not([class*="bg-card"]):not([class*="bottom-full"]), div[class*="h-screen w-screen"],
  div[class*="flex-1 flex min-h-0"], div[class*="h-full w-full"],
  .relative.z-0.flex-1.flex.min-h-0.h-full,
  .relative.z-0.flex-1.flex.min-h-0.h-full > div,
  [data-testid="conversation-view"],
  [data-pane-id="pane-1"],
  div[class*="group/pane"],
  main, [role="main"] {
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* 3. 左侧边栏：轻透磨砂毛玻璃与暖金色微光 */
  div.bg-sidebar.h-full, aside, nav[aria-label="Sidebar"] {
    background: rgba(18, 14, 24, 0.40) !important;
    background-color: rgba(18, 14, 24, 0.40) !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border-right: 1px solid rgba(255, 222, 190, 0.18) !important;
    box-shadow: 2px 0 16px rgba(0, 0, 0, 0.15) !important;
  }

  .bg-sidebar div, .bg-sidebar section, .bg-sidebar ul, .bg-sidebar li,
  .bg-sidebar button, .bg-sidebar a, .bg-sidebar span, .bg-sidebar header,
  div[class*="bg-sidebar"] button, div[class*="bg-sidebar"] a {
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  div[class*="bg-sidebar"] button:hover, div[class*="bg-sidebar"] a:hover {
    background: ${hoverGlass} !important;
    background-color: ${hoverGlass} !important;
    border-radius: 8px !important;
    border: none !important;
    color: #ffffff !important;
  }

  div[class*="bg-sidebar"] [data-active="true"],
  div[class*="bg-sidebar"] [aria-selected="true"],
  div[class*="bg-sidebar"] [class*="bg-sidebar-secondary"] {
    background: ${activeGlass} !important;
    background-color: ${activeGlass} !important;
    border-radius: 8px !important;
  }

  /* 4. 解除用户提问气泡 10vh 截断，平稳防闪烁滚动 (Anti-Jitter) */
  /* 仅精准解除用户提问气泡的 10vh 截断，坚决不改动 AI 思考流与工具容器的 max-height 和 overflow */
  div[class*="group/user-input-step"] div[class*="max-h-"],
  div[data-testid="user-input-step"] div[class*="max-h-"] {
    max-height: none !important;
    overflow: visible !important;
  }

  /* 消除渐变遮罩灰雾（仅清除 mask-image，绝不强加 overflow: visible 破坏内部滚动） */
  div[class*="group/user-input-step"] [style*="mask-image"],
  div[style*="mask-image: linear-gradient(transparent, black"] {
    mask-image: none !important;
    -webkit-mask-image: none !important;
  }

  /* 聊天区居中排版 (896px) 对齐底部输入框 */
  div[class*="mx-auto w-full"],
  div[class*="md-table-bleed"] > div[class*="mx-auto"] {
    max-width: 896px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  /* 轮次与用户消息自然流布局：解除强制最小高度，确保内容按序紧凑自然流动 */
  div.flex.items-start {
    align-items: flex-start !important;
  }
  div.flex.items-start > div[class*="group"][class*="scroll-mt-"],
  div[class*="group"][class*="scroll-mt-"] {
    min-height: 0 !important;
    flex: none !important;
    width: 100% !important;
  }

  /* 滚动视口安全设置：保持视口顶部与底部自如滚动 */
  div[class*="overflow-y-auto"][class*="md-table-bleed"],
  div.isolate.overflow-y-auto {
    scroll-padding-top: 52px !important;
    padding-bottom: 0px !important;
  }
  div[class*="md-table-bleed"] > div[class*="mx-auto"] {
    padding-top: 8px !important;
    padding-bottom: 40px !important;
  }

  [class*="after:bg-gradient-to-b"]::after,
  [class*="before:bg-gradient-to-t"]::before,
  div[class*="after:h-7"]::after {
    display: none !important;
    opacity: 0 !important;
  }

  /* 4.1 用户提问气泡原生独立悬浮吸顶 (Floating Glass Capsule)：
     - 恢复原生 position: sticky 吸顶效果，长内容向下滚动时提问卡片优雅悬浮吸附于视口顶端；
     - 彻底消除横跨全屏的死硬通栏横条（md-sticky-message-bleed 100% 透明），全景壁纸通透无遮切；
     - 提问气泡与紧随其后的回复内容保持充裕的 24px 呼吸间距，杜绝任何压字截断现象；
     - 提问卡片呈现精致圆角毛玻璃药丸质感，微光切边，纯白立体字。 */
  div.sticky.top-0,
  div[role="article"][aria-label="用户消息"],
  div[role="article"][aria-label="User message"],
  div[class*="sticky"][class*="top-"] {
    position: sticky !important;
    top: 4px !important;
    z-index: 25 !important;
    background: transparent !important;
    background-color: transparent !important;
    margin-bottom: 24px !important;
  }

  /* 彻底消除通栏切条：恢复 100% 纯净通透，杜绝全宽色块切线与底部下压投影 */
  div[class*="md-sticky-message-bleed"] {
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }

  /* 提问外层消除冗余顶部内边距，确保卡片紧凑贴顶 */
  div[class*="group/user-input-step"] {
    max-width: 896px !important;
    margin-left: auto !important;
    margin-right: auto !important;
    padding-top: 0px !important;
    margin-top: 0px !important;
    scroll-margin-top: 64px !important;
    margin-bottom: 4px !important;
  }

  /* 智能体回复容器保持充裕间距，杜绝任何字迹遮挡 */
  div[role="article"][aria-label="智能体 response"],
  div[role="article"][aria-label*="response"] {
    position: relative !important;
    z-index: 1 !important;
    margin-top: 6px !important;
  }
  div[class*="group/user-input-step"] [data-testid="lifted-context-menu-trigger"],
  div[class*="group/user-input-step"] [class*="bg-card-border"] {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  div[class*="group/user-input-step"] div[class*="bg-card"],
  div[data-testid="user-input-step"] div[class*="bg-card"] {
    background: rgba(22, 16, 28, 0.50) !important;
    background-color: rgba(22, 16, 28, 0.50) !important;
    backdrop-filter: blur(20px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(140%) !important;
    border: 1px solid rgba(255, 222, 190, 0.28) !important;
    border-radius: 14px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
  }
  div[class*="group/user-input-step"] div[class*="bg-card"] div {
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow: none !important;
  }
  div[class*="group/user-input-step"] * {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.80) !important;
  }
  div[class*="group/user-input-step"] img {
    border-radius: 8px !important;
    border: 1px solid rgba(255, 222, 190, 0.25) !important;
  }

  /* 6. Artifact 工件卡片：极度轻透磨砂毛玻璃 */
  .artifact-card, div[class*="artifact-card"] {
    background: rgba(18, 14, 24, 0.28) !important;
    background-color: rgba(18, 14, 24, 0.28) !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border: 1px solid rgba(255, 222, 190, 0.22) !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  }
  .artifact-card *, div[class*="artifact-card"] * {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75) !important;
  }

  /* 7. 底部输入框：左右两边同款单层极轻透磨砂毛玻璃，微光切边，杜绝死黑硬块 */
  #antigravity\\.agentSidePanelInputBox,
  div[id="antigravity.agentSidePanelInputBox"] {
    background: rgba(18, 14, 24, 0.28) !important;
    background-color: rgba(18, 14, 24, 0.28) !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border: 1px solid rgba(255, 222, 190, 0.26) !important;
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.16) !important;
  }
  #antigravity\\.agentSidePanelInputBox form,
  div[id="antigravity.agentSidePanelInputBox"] form,
  #antigravity\\.agentSidePanelInputBox > div,
  div[id="antigravity.agentSidePanelInputBox"] > div,
  #antigravity\\.agentSidePanelInputBox div[class*="rounded-[calc"]:not([class*="bottom-full"]),
  div[id="antigravity.agentSidePanelInputBox"] div[class*="rounded-[calc"]:not([class*="bottom-full"]) {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* 7.0 斜杠指令 / 技能与提及浮层菜单：高级深暖紫磨砂毛玻璃，彻底杜绝透明导致文字重叠遮挡 */
  #antigravity\\.agentSidePanelInputBox div[class*="bottom-full"],
  div[id="antigravity.agentSidePanelInputBox"] div[class*="bottom-full"],
  div[class*="bottom-full"][class*="bg-card"],
  div[class*="bottom-full"][class*="rounded-2xl"] {
    background: rgba(22, 16, 28, 0.88) !important;
    background-color: rgba(22, 16, 28, 0.88) !important;
    backdrop-filter: blur(28px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(140%) !important;
    border: 1px solid rgba(255, 222, 190, 0.32) !important;
    border-radius: 16px !important;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 222, 190, 0.15) !important;
  }
  #antigravity\\.agentSidePanelInputBox div[class*="bottom-full"] div[class*="cursor-pointer"]:hover,
  div[id="antigravity.agentSidePanelInputBox"] div[class*="bottom-full"] div[class*="cursor-pointer"]:hover,
  #antigravity\\.agentSidePanelInputBox div[class*="bottom-full"] [data-active="true"] {
    background: rgba(255, 215, 175, 0.18) !important;
    background-color: rgba(255, 215, 175, 0.18) !important;
    border-radius: 8px !important;
  }
  #antigravity\\.agentSidePanelInputBox div[class*="bottom-full"] * {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  }
  #antigravity\\.agentSidePanelInputBox textarea,
  div[id="antigravity.agentSidePanelInputBox"] textarea,
  #antigravity\\.agentSidePanelInputBox [contenteditable="true"],
  div[id="antigravity.agentSidePanelInputBox"] [contenteditable="true"] {
    background: transparent !important;
    background-color: transparent !important;
    color: #ffffff !important;
  }
  #antigravity\\.agentSidePanelInputBox textarea::placeholder,
  div[id="antigravity.agentSidePanelInputBox"] textarea::placeholder,
  #antigravity\\.agentSidePanelInputBox [contenteditable="true"]::placeholder {
    color: rgba(255, 240, 225, 0.75) !important;
  }
  #antigravity\\.agentSidePanelInputBox button:hover {
    background: ${hoverGlass} !important;
    border-radius: 8px !important;
  }

  /* 7.1 暂停/停止/取消按钮与红色停止方块 */
  #antigravity\\.agentSidePanelInputBox button[aria-label*="Cancel"],
  div[id="antigravity.agentSidePanelInputBox"] button[aria-label*="Cancel"],
  #antigravity\\.agentSidePanelInputBox button[data-tooltip-id*="cancel"],
  div[id="antigravity.agentSidePanelInputBox"] button[data-tooltip-id*="cancel"] {
    background: rgba(255, 255, 255, 0.18) !important;
    background-color: rgba(255, 255, 255, 0.18) !important;
    border-radius: 9999px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  #antigravity\\.agentSidePanelInputBox button[aria-label*="Cancel"]:hover,
  div[id="antigravity.agentSidePanelInputBox"] button[aria-label*="Cancel"]:hover,
  #antigravity\\.agentSidePanelInputBox button[data-tooltip-id*="cancel"]:hover,
  div[id="antigravity.agentSidePanelInputBox"] button[data-tooltip-id*="cancel"]:hover {
    background: rgba(239, 68, 68, 0.35) !important;
    background-color: rgba(239, 68, 68, 0.35) !important;
  }
  #antigravity\\.agentSidePanelInputBox button [class*="bg-red"],
  div[id="antigravity.agentSidePanelInputBox"] button [class*="bg-red"],
  #antigravity\\.agentSidePanelInputBox div.bg-red-500,
  div[id="antigravity.agentSidePanelInputBox"] div.bg-red-500 {
    background: #ef4444 !important;
    background-color: #ef4444 !important;
    border-radius: 2px !important;
    display: block !important;
    min-width: 10px !important;
    min-height: 10px !important;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.6) !important;
  }

  /* 7.2 发送按钮常态与高亮 */
  #antigravity\\.agentSidePanelInputBox button[aria-label*="Send"],
  div[id="antigravity.agentSidePanelInputBox"] button[aria-label*="Send"],
  #antigravity\\.agentSidePanelInputBox button[data-tooltip-id*="send"],
  div[id="antigravity.agentSidePanelInputBox"] button[data-tooltip-id*="send"] {
    background: rgba(255, 225, 195, 0.24) !important;
    background-color: rgba(255, 225, 195, 0.24) !important;
    border-radius: 9999px !important;
  }

  /* 8. 行内代码与大代码块彻底分流：告别黑色色块与灰雾遮罩，呈现清透高质感 */
  code:not(pre code),
  [class*="[&_code:not(pre_code)]"] code,
  .leading-relaxed code,
  p code, li code {
    background: rgba(255, 220, 190, 0.12) !important;
    background-color: rgba(255, 220, 190, 0.12) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: 1px solid rgba(255, 222, 190, 0.22) !important;
    color: #ffffff !important;
    border-radius: 6px !important;
    padding: 1px 6px !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  }

  /* pre 容器单层优雅微光毛玻璃，内部 pre code 100% 透明，杜绝双层叠加黑块 */
  pre, [class*="group/run-command"] {
    background: rgba(18, 14, 24, 0.25) !important;
    background-color: rgba(18, 14, 24, 0.25) !important;
    backdrop-filter: blur(12px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(12px) saturate(130%) !important;
    border: 1px solid rgba(255, 222, 190, 0.20) !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
  }
  pre code, pre div, pre span {
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* 9. 聊天区 Hover 纯净化：无背景杂色，无边框厚度挤压 */
  div[class*="mx-auto w-full"] *:hover,
  div[class*="md-table-bleed"] *:hover,
  div[class*="group/user-input-step"] *:hover,
  button.group.flex.items-center.gap-1:hover,
  button[data-testid="thinking-collapsible-trigger"]:hover,
  button[data-testid="worked-for-collapsible"]:hover,
  .artifact-card:hover, div[class*="artifact-card"]:hover {
    background: transparent !important;
    background-color: transparent !important;
    border-color: transparent !important;
    outline: none !important;
    box-shadow: none !important;
  }

  button.group.flex.items-center.gap-1,
  button[data-testid="thinking-collapsible-trigger"],
  button[data-testid="worked-for-collapsible"] {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    color: #ffffff !important;
  }
  button.group.flex.items-center.gap-1 *,
  button[data-testid="thinking-collapsible-trigger"] *,
  button[data-testid="worked-for-collapsible"] * {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  }

  /* 10. 交互问答（Ask Question / Permission 弹窗）选项卡片：左右同款轻透磨砂毛玻璃 */
  div[class*="rounded-2xl"][class*="bg-card-border"],
  div[class*="bg-card"][class*="rounded-"] {
    background: rgba(18, 14, 24, 0.38) !important;
    background-color: rgba(18, 14, 24, 0.38) !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border: 1px solid rgba(255, 222, 190, 0.20) !important;
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  }
  div[class*="bg-card-border"] span,
  div[class*="bg-card-border"] p,
  div[class*="bg-card-border"] h3,
  div[class*="bg-card-border"] [class*="text-foreground"] {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  }

  div[class*="bg-card-border"] textarea[class*="font-mono"],
  textarea[aria-label="Edit permission target"] {
    background: rgba(18, 14, 24, 0.55) !important;
    background-color: rgba(18, 14, 24, 0.55) !important;
    border: 1px solid rgba(255, 222, 190, 0.22) !important;
    color: #ffffff !important;
    border-radius: 8px !important;
  }

  /* 选项盒模型常态锁定 1px 柔和边框，轻透毛玻璃 */
  label[for*="ask-opt-"],
  label:has(input[name*="ask-question"]),
  [role="radiogroup"] label,
  div[class*="bg-card-border"] [role="radiogroup"] label,
  div[class*="bg-card-border"] label {
    background: rgba(20, 15, 26, 0.40) !important;
    background-color: rgba(20, 15, 26, 0.40) !important;
    background-image: none !important;
    border: 1px solid rgba(255, 230, 205, 0.18) !important;
    border-radius: 10px !important;
    box-shadow: inset 0 0 0 1px rgba(255, 230, 205, 0.18) !important;
    box-sizing: border-box !important;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
    cursor: pointer !important;
  }

  /* 未选中状态徽标与文字 */
  label[for*="ask-opt-"] div[class*="bg-border"],
  label:has(input[name*="ask-question"]) div[class*="bg-border"],
  [role="radiogroup"] label div[class*="bg-border"],
  div[class*="bg-card-border"] label div[class*="bg-border"] {
    background: rgba(255, 255, 255, 0.12) !important;
    background-color: rgba(255, 255, 255, 0.12) !important;
    background-image: none !important;
    border: 1px solid rgba(255, 225, 195, 0.22) !important;
    box-shadow: none !important;
    border-radius: 6px !important;
    transition: all 0.18s ease !important;
  }
  label[for*="ask-opt-"] div[class*="bg-border"] span,
  label:has(input[name*="ask-question"]) div[class*="bg-border"] span,
  [role="radiogroup"] label div[class*="bg-border"] span,
  div[class*="bg-card-border"] label div[class*="bg-border"] span {
    color: rgba(255, 245, 235, 0.75) !important;
    font-weight: 600 !important;
    text-shadow: none !important;
  }
  label[for*="ask-opt-"] span,
  label:has(input[name*="ask-question"]) span,
  [role="radiogroup"] label span,
  div[class*="bg-card-border"] label span {
    color: rgba(255, 255, 255, 0.90) !important;
    font-weight: 400 !important;
    text-shadow: none !important;
  }

  /* 选项 Hover：柔暖香槟金微光高亮 */
  label[for*="ask-opt-"]:not(:has(input:checked)):not(.bg-secondary):hover,
  label:has(input[name*="ask-question"]):not(:has(input:checked)):not(.bg-secondary):hover,
  [role="radiogroup"] label:not(:has(input:checked)):not(.bg-secondary):hover,
  div[class*="bg-card-border"] [role="radiogroup"] label:not(:has(input:checked)):not(.bg-secondary):hover,
  div[class*="bg-card-border"] label:not(:has(input:checked)):not(.bg-secondary):hover {
    background: ${hoverGlass} !important;
    background-color: ${hoverGlass} !important;
    border: 1px solid rgba(255, 222, 190, 0.50) !important;
    box-shadow: inset 0 0 0 1px rgba(255, 222, 190, 0.50), 0 0 14px rgba(255, 200, 140, 0.20) !important;
  }
  label[for*="ask-opt-"]:not(:has(input:checked)):not(.bg-secondary):hover div[class*="bg-border"] span,
  label:has(input[name*="ask-question"]):not(:has(input:checked)):not(.bg-secondary):hover div[class*="bg-border"] span,
  [role="radiogroup"] label:not(:has(input:checked)):not(.bg-secondary):hover div[class*="bg-border"] span,
  div[class*="bg-card-border"] label:not(:has(input:checked)):not(.bg-secondary):hover div[class*="bg-border"] span {
    color: #ffffff !important;
  }

  /* 选项 选中态 (Selected)：琥珀暖金微光与清晰发光光晕 */
  label[for*="ask-opt-"]:has(input:checked),
  label[for*="ask-opt-"].bg-secondary,
  label[for*="ask-opt-"][data-state="checked"],
  label[for*="ask-opt-"][aria-checked="true"],
  label:has(input[name*="ask-question"]:checked),
  label:has(input[type="radio"]:checked),
  label:has(input[type="checkbox"]:checked),
  [role="radiogroup"] label:has(input:checked),
  [role="radiogroup"] label.bg-secondary,
  [role="radiogroup"] label[data-state="checked"],
  [role="radiogroup"] label[aria-checked="true"],
  [role="radiogroup"] label[data-active="true"],
  div[class*="bg-card-border"] label:has(input:checked),
  div[class*="bg-card-border"] label.bg-secondary,
  div[class*="bg-card-border"] label[data-state="checked"],
  div[class*="bg-card-border"] label[aria-checked="true"] {
    background: linear-gradient(90deg, rgba(245, 158, 11, 0.48), rgba(217, 119, 6, 0.32)) !important;
    background-color: rgba(230, 140, 30, 0.38) !important;
    border: 1.5px solid rgba(255, 235, 205, 0.95) !important;
    border-radius: 10px !important;
    box-shadow: 0 0 24px rgba(245, 158, 11, 0.65), inset 4px 0 0 0 ${amberAccent}, inset 0 0 0 1.5px rgba(255, 235, 205, 0.95), inset 0 0 14px rgba(255, 215, 160, 0.40) !important;
  }

  /* 选中态内部序号徽标：璀璨琥珀暖金 */
  label[for*="ask-opt-"]:has(input:checked) div[class*="bg-border"],
  label[for*="ask-opt-"].bg-secondary div[class*="bg-border"],
  label:has(input[name*="ask-question"]:checked) div[class*="bg-border"],
  label:has(input[type="radio"]:checked) div[class*="bg-border"],
  label:has(input[type="checkbox"]:checked) div[class*="bg-border"],
  [role="radiogroup"] label:has(input:checked) div[class*="bg-border"],
  [role="radiogroup"] label.bg-secondary div[class*="bg-border"],
  [role="radiogroup"] label[data-state="checked"] div[class*="bg-border"],
  [role="radiogroup"] label[aria-checked="true"] div[class*="bg-border"],
  div[class*="bg-card-border"] label:has(input:checked) div[class*="bg-border"],
  div[class*="bg-card-border"] label.bg-secondary div[class*="bg-border"],
  div[class*="bg-card-border"] label[data-state="checked"] div[class*="bg-border"] {
    background: linear-gradient(135deg, #fbbf24, #d97706) !important;
    background-color: #d97706 !important;
    border: 1.5px solid #ffffff !important;
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.8), 0 2px 6px rgba(0, 0, 0, 0.5) !important;
  }
  label[for*="ask-opt-"]:has(input:checked) div[class*="bg-border"] span,
  label[for*="ask-opt-"].bg-secondary div[class*="bg-border"] span,
  label:has(input[name*="ask-question"]:checked) div[class*="bg-border"] span,
  label:has(input[type="radio"]:checked) div[class*="bg-border"] span,
  label:has(input[type="checkbox"]:checked) div[class*="bg-border"] span,
  [role="radiogroup"] label:has(input:checked) div[class*="bg-border"] span,
  [role="radiogroup"] label.bg-secondary div[class*="bg-border"] span,
  [role="radiogroup"] label[data-state="checked"] div[class*="bg-border"] span,
  [role="radiogroup"] label[aria-checked="true"] div[class*="bg-border"] span,
  div[class*="bg-card-border"] label:has(input:checked) div[class*="bg-border"] span,
  div[class*="bg-card-border"] label.bg-secondary div[class*="bg-border"] span {
    color: #ffffff !important;
    font-weight: 800 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7) !important;
  }

  /* 选中态文字纯白加粗，带立体阴影 */
  label[for*="ask-opt-"]:has(input:checked) span,
  label[for*="ask-opt-"].bg-secondary span,
  label:has(input[name*="ask-question"]:checked) span,
  label:has(input[type="radio"]:checked) span,
  label:has(input[type="checkbox"]:checked) span,
  [role="radiogroup"] label:has(input:checked) span,
  [role="radiogroup"] label.bg-secondary span,
  [role="radiogroup"] label[data-state="checked"] span,
  [role="radiogroup"] label[aria-checked="true"] span,
  div[class*="bg-card-border"] label:has(input:checked) span,
  div[class*="bg-card-border"] label.bg-secondary span {
    color: #ffffff !important;
    font-weight: 700 !important;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9) !important;
  }

  label[for*="ask-opt-"] textarea,
  [role="radiogroup"] label textarea {
    background: transparent !important;
    color: #ffffff !important;
    border: none !important;
  }
  label[for*="ask-opt-"] textarea::placeholder,
  [role="radiogroup"] label textarea::placeholder {
    color: rgba(255, 240, 225, 0.65) !important;
  }

  /* 11. 正文文字与次级文字排版加固（杜绝日光背景下发虚发飘） */
  .text-foreground, [class*="text-foreground"],
  [class*="leading-relaxed"] p, [class*="leading-relaxed"] li,
  [class*="leading-relaxed"] h1, [class*="leading-relaxed"] h2,
  [class*="leading-relaxed"] h3, [class*="leading-relaxed"] h4 {
    color: #ffffff !important;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.90), 0 0 1px rgba(0, 0, 0, 0.75) !important;
  }

  /* 次级说明文字从暗灰强制提亮为暖白/浅米白 */
  .text-muted-foreground, [class*="text-muted-foreground"],
  .text-secondary-foreground, [class*="text-secondary-foreground"],
  span.text-xs, p.text-xs {
    color: rgba(255, 242, 232, 0.88) !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.80) !important;
  }

  /* =========================================================================
     12. 右侧辅助窗口（Auxiliary Pane / 文件查看 / 评审 / 终端 / 工件）
     与左侧边栏完全一致的轻透磨砂毛玻璃视觉；未弹出时完全透明，绝不污染中间工作区
     ========================================================================= */
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]),
  div[data-pane-id]:not([data-pane-id="pane-1"]) {
    background: rgba(18, 14, 24, 0.40) !important;
    background-color: rgba(18, 14, 24, 0.40) !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border-left: 1px solid rgba(255, 222, 190, 0.18) !important;
    box-shadow: -2px 0 16px rgba(0, 0, 0, 0.15) !important;
  }

  /* 辅助窗格内部多层容器全部保持透明，杜绝多层叠加导致的黑色死块 */
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) div:not([class*="bg-border"]):not(button):not(pre):not(code) {
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* 辅助窗格内部顶部 Tab 栏 */
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) div.shrink-0 {
    background: transparent !important;
    border-bottom: 1px solid rgba(255, 222, 190, 0.15) !important;
  }

  /* 辅助窗格内部标签按钮 */
  [data-tooltip-id*="aux-tab"] {
    color: rgba(255, 245, 235, 0.88) !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  }
  [data-tooltip-id*="aux-tab"]:hover,
  [data-tooltip-id*="aux-tab"][data-active="true"],
  [data-tooltip-id*="aux-tab"][aria-selected="true"],
  [data-tooltip-id*="aux-tab"].bg-muted {
    background: ${hoverGlass} !important;
    color: #ffffff !important;
  }

  /* 辅助窗格内部所有文字与正文 */
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) p,
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) span,
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) h1,
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) h2,
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) h3,
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) li {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  }

  /* 辅助窗格内部代码、文件卡片、变更列表：轻透微光，杜绝深黑死块 */
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) pre,
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) code,
  .relative.z-0.flex-1.flex.min-h-0.h-full > .relative.flex.w-full.h-full.outline-none > div:has([data-tooltip-id*="aux-tab"]) [class*="rounded"] {
    background: rgba(255, 220, 190, 0.08) !important;
    background-color: rgba(255, 220, 190, 0.08) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: 1px solid rgba(255, 222, 190, 0.16) !important;
  }

  /* 左右窗格拖拽分割线 Handle */
  div.bg-border.flex-shrink-0.relative.z-30 {
    background: rgba(255, 222, 190, 0.22) !important;
    transition: background 0.2s ease, box-shadow 0.2s ease !important;
  }
  div.bg-border.flex-shrink-0.relative.z-30:hover {
    background: rgba(245, 158, 11, 0.80) !important;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.6) !important;
  }

  /* =========================================================================
     13. 弹窗、模态框、悬浮卡片 (Hover Card / Tooltip) 与下拉菜单
     解决左侧栏 Hover 卡片（如“PC与小程序代办同步”）背景发灰字迹不清问题
     ========================================================================= */
  .settings-modal-backdrop,
  div[class*="backdrop"] {
    background: rgba(0, 0, 0, 0.25) !important;
    backdrop-filter: blur(6px) !important;
    -webkit-backdrop-filter: blur(6px) !important;
  }

  [role="dialog"],
  [aria-modal="true"],
  .settings-modal-container,
  div[class*="settings-modal-container"],
  div[class*="modal-container"],
  div[role="dialog"].bg-background,
  div[aria-modal="true"].bg-background {
    background: rgba(26, 20, 32, 0.70) !important;
    background-color: rgba(26, 20, 32, 0.70) !important;
    backdrop-filter: blur(28px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(140%) !important;
    border: 1px solid rgba(255, 222, 190, 0.30) !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 222, 190, 0.15) !important;
  }

  /* 弹窗内部左侧导航与分割线 */
  [role="dialog"] div[class*="bg-sidebar"],
  [role="dialog"] div[class*="border-r"] {
    background: rgba(14, 10, 20, 0.28) !important;
    background-color: rgba(14, 10, 20, 0.28) !important;
    border-color: rgba(255, 222, 190, 0.20) !important;
  }

  [role="dialog"] * {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75) !important;
  }

  [role="dialog"] button,
  [role="dialog"] [role="button"],
  [role="dialog"] select,
  [role="dialog"] input {
    color: #ffffff !important;
  }

  /* 下拉菜单、浮层、Popover、以及 HoverCard / Tooltip */
  [role="tooltip"],
  [data-radix-tooltip-content],
  [data-radix-hover-card-content],
  [data-radix-popper-content-wrapper] > div,
  [role="menu"],
  [role="listbox"],
  [data-radix-menu-content],
  [data-radix-select-content],
  div[class*="popover"],
  div[class*="dropdown"] {
    background: rgba(24, 18, 30, 0.88) !important;
    background-color: rgba(24, 18, 30, 0.88) !important;
    backdrop-filter: blur(28px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(140%) !important;
    border: 1px solid rgba(255, 222, 190, 0.28) !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45) !important;
    border-radius: 10px !important;
  }

  [role="tooltip"] *,
  [data-radix-tooltip-content] *,
  [data-radix-hover-card-content] * {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85) !important;
  }

  /* 14. 细滚动条：柔暖琥珀金滑块 */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 200, 140, 0.45);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255, 215, 165, 0.75); }
  `;
}

async function main() {
  const options = parseArgs();

  // 1. Resolve theme or image
  let bgBase64 = "";
  let themeName = options.name;
  let tagline = options.tagline;
  let focusX = options.focusX;
  let focusY = options.focusY;

  if (options.theme) {
    const themeDir = path.resolve(__dirname, "../themes", options.theme);
    if (!fs.existsSync(themeDir)) {
      console.error(`❌ 未找到主题目录: ${themeDir}`);
      process.exit(1);
    }
    const themeJsonPath = path.join(themeDir, "theme.json");
    const bgPath = path.join(themeDir, "background.jpg");
    if (!fs.existsSync(bgPath)) {
      console.error(`❌ 主题目录下未找到 background.jpg: ${bgPath}`);
      process.exit(1);
    }
    const meta = fs.existsSync(themeJsonPath) ? JSON.parse(fs.readFileSync(themeJsonPath, "utf8")) : {};
    themeName = meta.name || options.theme;
    tagline = meta.tagline || tagline;
    focusX = meta.art?.focusX ?? focusX;
    focusY = meta.art?.focusY ?? focusY;
    bgBase64 = fs.readFileSync(bgPath).toString("base64");
  } else if (options.image) {
    const imgPath = path.resolve(options.image);
    if (!fs.existsSync(imgPath)) {
      console.error(`❌ 未找到指定壁纸文件: ${imgPath}`);
      process.exit(1);
    }
    bgBase64 = fs.readFileSync(imgPath).toString("base64");
  } else {
    // Default fallback to arina-hashimoto
    const defaultDir = path.resolve(__dirname, "../themes/arina-hashimoto");
    if (fs.existsSync(defaultDir)) {
      const meta = JSON.parse(fs.readFileSync(path.join(defaultDir, "theme.json"), "utf8"));
      themeName = meta.name;
      tagline = meta.tagline;
      focusX = meta.art?.focusX ?? 0.72;
      focusY = meta.art?.focusY ?? 0.45;
      bgBase64 = fs.readFileSync(path.join(defaultDir, "background.jpg")).toString("base64");
    } else {
      console.error("❌ 请通过 --theme 或 --image 参数指定换肤壁纸");
      process.exit(1);
    }
  }

  const bgDataUri = `data:image/jpeg;base64,${bgBase64}`;
  const css = generateCss({
    bgDataUri,
    focusX,
    focusY,
    blur: options.blur,
    opacity: options.opacity
  });

  // 2. Connect to CDP
  const port = options.port || detectPort();
  console.log(`📡 正在探测 Antigravity CDP 调试端口: ${port}...`);

  let targets;
  try {
    targets = await getTargets(port);
  } catch (e) {
    console.error(`❌ 无法连接到端口 ${port}。请确认 Antigravity 2.0 桌面端正在运行。`);
    process.exit(1);
  }

  const pages = targets.filter(t => t.type === "page" && t.webSocketDebuggerUrl && !t.url?.startsWith("devtools://"));
  if (pages.length === 0) {
    console.error(`❌ 端口 ${port} 上未找到 Antigravity 交互页面。`);
    process.exit(1);
  }

  // 3. Inject skin into all valid window pages
  const payload = JSON.stringify({ css, themeName, tagline });
  let injectedCount = 0;

  for (const page of pages) {
    try {
      console.log(`🎯 命中交互窗口:「${page.title || page.url}」`);
      const res = await evalInPage(page.webSocketDebuggerUrl, `(() => {
        const data = ${payload};
        
        if (!document.body || !document.head) {
          return { success: false, notReady: true };
        }

        // Clean up lingering inline styles on chat containers
        const chatContainers = document.querySelectorAll('div[class*="mx-auto"], div[class*="md-table-bleed"] > div');
        chatContainers.forEach(el => {
          if (el.getAttribute("style")) el.removeAttribute("style");
        });

        // 1. Remove old skin & test styles
        const oldStyle = document.getElementById("antigravity-dream-skin-style");
        if (oldStyle) oldStyle.remove();
        const testStyle = document.getElementById("test-fix-style");
        if (testStyle) testStyle.remove();
        const testShield = document.getElementById("test-sticky-shield");
        if (testShield) testShield.remove();
        const cleanSticky = document.getElementById("clean-sticky-style");
        if (cleanSticky) cleanSticky.remove();
        const oldBg = document.getElementById("antigravity-dream-skin-bg");
        if (oldBg) oldBg.remove();
        const oldWm = document.getElementById("dream-skin-watermark");
        if (oldWm) oldWm.remove();

        // 2. Inject Background
        const bgDiv = document.createElement("div");
        bgDiv.id = "antigravity-dream-skin-bg";
        document.body.prepend(bgDiv);

        // 3. Inject CSS
        const styleEl = document.createElement("style");
        styleEl.id = "antigravity-dream-skin-style";
        styleEl.textContent = data.css;
        document.head.appendChild(styleEl);

        // 4. Inject Chinese Localization Engine (Antigravity 2.0 中文汉化挂载)
        if (!window.__antigravity_zh_installed) {
          window.__antigravity_zh_installed = true;
          const zhDict = {
            "New Conversation": "新建会话",
            "Conversation History": "历史会话",
            "Conversations": "会话列表",
            "Automations": "自动化任务",
            "Scheduled Tasks": "定时与后台任务",
            "Customizations": "定制与技能",
            "Projects": "项目工作区",
            "Settings": "系统设置",
            "Feedback": "意见反馈",
            "Documentation": "官方文档",
            "Help": "帮助中心",
            "Sign Out": "退出登录",
            "Account": "用户账户",
            "Overview": "概览",
            "Files": "文件变动",
            "Terminal": "终端控制台",
            "Plugins": "插件中心",
            "Background Tasks": "后台任务",
            "Subagents": "子智能体",
            "Artifacts": "生成工件",
            "Changes": "代码更改",
            "Review": "审查评审",
            "Load older messages": "加载历史对话记录",
            "Conversation Log": "完整会话日志",
            "Export": "导出记录",
            "Share": "分享会话",
            "Delete": "删除会话",
            "Rename": "重命名",
            "High": "深度思考",
            "Turbo": "极速响应",
            "Fast": "快速模式",
            "Thinking": "思考分析中",
            "Model Selection": "切换大模型",
            "Proceed": "继续执行",
            "Cancel": "取消操作",
            "Stop": "终止执行",
            "Run": "立即运行",
            "Reject": "拒绝更改",
            "Accept": "接受更改",
            "Accept All": "全部接受",
            "Discard": "丢弃更改",
            "Working": "处理中",
            "Completed": "已完成",
            "Failed": "失败",
            "Running": "正在运行",
            "Paused": "已暂停",
            "Finished": "执行完毕",
            "General": "通用偏好",
            "Appearance": "界面外观",
            "Theme": "主题颜色",
            "Dark": "深色暗夜",
            "Light": "浅色明亮",
            "System": "跟随系统",
            "Model": "模型架构",
            "Permissions": "安全与权限",
            "Strict Mode": "严格安全模式",
            "Terminal Sandbox": "终端沙盒隔离",
            "Browser Tools": "浏览器自动化工具",
            "Auto-Continue": "长回复自动继续",
            "Sounds": "提示音效",
            "Keyboard Shortcuts": "快捷键配置",
            "About": "关于软件",
            "Version": "客户端版本",
            "Check for Updates": "检查新版本"
          };
          const zhPlaceholders = {
            "Ask anything, @ to mention, / for actions": "随时提问，输入 @ 引用上下文，/ 调用快捷指令",
            "Search conversations...": "搜索历史会话...",
            "Search...": "搜索...",
            "Type a message...": "输入消息...",
            "Filter...": "筛选..."
          };

          function translateNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
              const val = node.nodeValue;
              if (!val) return;
              const trimmed = val.trim();
              if (zhDict[trimmed]) {
                node.nodeValue = val.replace(trimmed, zhDict[trimmed]);
              } else if (trimmed.startsWith("Worked for ")) {
                node.nodeValue = val.replace("Worked for ", "用时 ").replace("s", "秒").replace("m", "分");
              } else if (trimmed.startsWith("Thought for ")) {
                node.nodeValue = val.replace("Thought for ", "思考 ").replace("s", "秒").replace("m", "分");
              }
              return;
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.placeholder && zhPlaceholders[node.placeholder]) {
                node.placeholder = zhPlaceholders[node.placeholder];
              }
              const phAttr = node.getAttribute && node.getAttribute("data-placeholder");
              if (phAttr && zhPlaceholders[phAttr]) {
                node.setAttribute("data-placeholder", zhPlaceholders[phAttr]);
              }
              if (node.title && zhDict[node.title.trim()]) {
                node.title = zhDict[node.title.trim()];
              }
              const aria = node.getAttribute && node.getAttribute("aria-label");
              if (aria && zhDict[aria.trim()]) {
                node.setAttribute("aria-label", zhDict[aria.trim()]);
              }
              const tag = node.tagName?.toLowerCase();
              if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'code' || tag === 'pre') return;
              for (let child = node.firstChild; child; child = child.nextSibling) {
                translateNode(child);
              }
            }
          }

          translateNode(document.body);
          const obs = new MutationObserver((mutations) => {
            for (const m of mutations) {
              if (m.type === 'childList') {
                m.addedNodes.forEach(node => translateNode(node));
              } else if (m.type === 'characterData') {
                translateNode(m.target);
              }
            }
          });
          obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        }

        return {
          success: true,
          bg: Boolean(document.getElementById("antigravity-dream-skin-bg")),
          style: Boolean(document.getElementById("antigravity-dream-skin-style"))
        };
      })()`);

      if (res && res.success) {
        injectedCount++;
      }
    } catch (e) {
      console.error(`⚠️ 窗口「${page.title}」注入跳过:`, e.message);
    }
  }

  if (injectedCount > 0) {
    console.log(`✨ 换肤成功！已注入主题:【${themeName}】（标语: ${tagline}）`);
    // 持久化当前激活的主题配置，供后台守护进程开机/重启自动注入
    const activeThemePath = path.join(__dirname, "../active_theme.json");
    try {
      fs.writeFileSync(activeThemePath, JSON.stringify({
        theme: options.theme,
        image: options.image,
        name: themeName,
        tagline: tagline,
        focusX,
        focusY,
        blur: options.blur,
        opacity: options.opacity,
        enabled: true,
        updatedAt: new Date().toISOString()
      }, null, 2));
    } catch (e) {}
  } else {
    console.error("❌ 注入失败，页面可能正在加载中。");
  }
}

main().catch(err => {
  console.error("❌ 执行失败:", err);
  process.exit(1);
});
