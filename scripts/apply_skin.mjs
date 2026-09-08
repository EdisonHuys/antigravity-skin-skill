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
  const portFile = path.join(process.env.HOME || "/Users/mac", "Library/Application Support/Antigravity/DevToolsActivePort");
  if (fs.existsSync(portFile)) {
    try {
      const content = fs.readFileSync(portFile, "utf8").trim();
      const lines = content.split("\n");
      const port = parseInt(lines[0], 10);
      if (port > 0) return port;
    } catch (e) {}
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

// Generate CSS for pure light frosted glass theme
function generateCss({ bgDataUri, focusX, focusY, blur, opacity }) {
  const fx = focusX * 100;
  const fy = focusY * 100;
  const bgGlass = `rgba(18, 14, 26, ${opacity})`;
  const hoverGlass = `rgba(255, 180, 215, 0.18)`;
  const activeGlass = `rgba(255, 180, 215, 0.24)`;

  return `
  /* --- Antigravity Dream Skin: Light Frosted Glass & Zero-Shift Hover --- */
  :root, .dark, body {
    --color-background: transparent !important;
    --background: transparent !important;
    --sidebar: rgba(255, 255, 255, 0.05) !important;
    --color-sidebar: rgba(255, 255, 255, 0.05) !important;
    --color-sidebar-secondary: ${hoverGlass} !important;
    --color-card: ${bgGlass} !important;
    --card: ${bgGlass} !important;
    --color-card-border: rgba(255, 180, 215, 0.25) !important;
    --card-border: rgba(255, 180, 215, 0.25) !important;
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

  /* 2. 全局底色透明化与窗口级滚动条消除 */
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
  div[class*="overflow-hidden"], div[class*="h-screen w-screen"],
  div[class*="flex-1 flex min-h-0"], div[class*="h-full w-full"],
  main, [role="main"] {
    background: transparent !important;
    background-color: transparent !important;
  }

  /* 3. 左侧边栏：轻透毛玻璃 */
  div.bg-sidebar.h-full, aside, nav[aria-label="Sidebar"] {
    background: ${bgGlass} !important;
    background-color: ${bgGlass} !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border-right: 1px solid rgba(255, 190, 215, 0.2) !important;
    box-shadow: 2px 0 16px rgba(0, 0, 0, 0.10) !important;
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

  /* 4. 聊天区居中排版 (896px) 对齐底部输入框 */
  div[class*="mx-auto w-full"],
  div[class*="md-table-bleed"] > div[class*="mx-auto"] {
    max-width: 896px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  [class*="after:bg-gradient-to-b"]::after,
  [class*="before:bg-gradient-to-t"]::before,
  div[class*="after:h-7"]::after {
    display: none !important;
    opacity: 0 !important;
  }

  div[class*="sticky"] {
    background: transparent !important;
    background-color: transparent !important;
  }

  /* 5. 用户提问气泡：左侧同款轻透毛玻璃 */
  div[class*="group/user-input-step"] {
    max-width: 896px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  div[class*="group/user-input-step"] [class*="bg-card-border"] {
    background: transparent !important;
    background-color: transparent !important;
  }
  div[class*="group/user-input-step"] div[class*="bg-card"],
  div[class*="group/user-input-step"] [class*="rounded-xl"] {
    background: ${bgGlass} !important;
    background-color: ${bgGlass} !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border: 1px solid rgba(255, 190, 215, 0.22) !important;
    border-radius: 12px !important;
  }
  div[class*="group/user-input-step"] * {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }

  /* 6. Artifact 工件卡片 */
  .artifact-card, div[class*="artifact-card"] {
    background: ${bgGlass} !important;
    background-color: ${bgGlass} !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border: 1px solid rgba(255, 190, 215, 0.22) !important;
    border-radius: 12px !important;
  }
  .artifact-card *, div[class*="artifact-card"] * {
    color: #ffffff !important;
  }

  /* 7. 底部输入框 */
  #antigravity\\.agentSidePanelInputBox,
  div[id="antigravity.agentSidePanelInputBox"] {
    background: ${bgGlass} !important;
    background-color: ${bgGlass} !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border: 1px solid rgba(255, 190, 215, 0.25) !important;
    border-radius: 16px !important;
  }
  #antigravity\.agentSidePanelInputBox form,
  div[id="antigravity.agentSidePanelInputBox"] form,
  #antigravity\.agentSidePanelInputBox div:not(button):not(button *),
  div[id="antigravity.agentSidePanelInputBox"] div:not(button):not(button *) {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
  }
  #antigravity\.agentSidePanelInputBox textarea,
  div[id="antigravity.agentSidePanelInputBox"] textarea,
  #antigravity\.agentSidePanelInputBox [contenteditable="true"],
  div[id="antigravity.agentSidePanelInputBox"] [contenteditable="true"] {
    background: transparent !important;
    background-color: transparent !important;
    color: #ffffff !important;
  }
  #antigravity\.agentSidePanelInputBox textarea::placeholder,
  div[id="antigravity.agentSidePanelInputBox"] textarea::placeholder,
  #antigravity\.agentSidePanelInputBox [contenteditable="true"]::placeholder {
    color: rgba(255, 255, 255, 0.70) !important;
  }
  #antigravity\.agentSidePanelInputBox button:hover {
    background: ${hoverGlass} !important;
    border-radius: 8px !important;
  }

  /* 7.1 暂停/停止/取消按钮与红色停止方块 */
  #antigravity\.agentSidePanelInputBox button[aria-label*="Cancel"],
  div[id="antigravity.agentSidePanelInputBox"] button[aria-label*="Cancel"],
  #antigravity\.agentSidePanelInputBox button[data-tooltip-id*="cancel"],
  div[id="antigravity.agentSidePanelInputBox"] button[data-tooltip-id*="cancel"] {
    background: rgba(255, 255, 255, 0.18) !important;
    background-color: rgba(255, 255, 255, 0.18) !important;
    border-radius: 9999px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  #antigravity\.agentSidePanelInputBox button[aria-label*="Cancel"]:hover,
  div[id="antigravity.agentSidePanelInputBox"] button[aria-label*="Cancel"]:hover,
  #antigravity\.agentSidePanelInputBox button[data-tooltip-id*="cancel"]:hover,
  div[id="antigravity.agentSidePanelInputBox"] button[data-tooltip-id*="cancel"]:hover {
    background: rgba(239, 68, 68, 0.30) !important;
    background-color: rgba(239, 68, 68, 0.30) !important;
  }
  #antigravity\.agentSidePanelInputBox button [class*="bg-red"],
  div[id="antigravity.agentSidePanelInputBox"] button [class*="bg-red"],
  #antigravity\.agentSidePanelInputBox div.bg-red-500,
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
  #antigravity\.agentSidePanelInputBox button[aria-label*="Send"],
  div[id="antigravity.agentSidePanelInputBox"] button[aria-label*="Send"],
  #antigravity\.agentSidePanelInputBox button[data-tooltip-id*="send"],
  div[id="antigravity.agentSidePanelInputBox"] button[data-tooltip-id*="send"] {
    background: rgba(255, 255, 255, 0.20) !important;
    background-color: rgba(255, 255, 255, 0.20) !important;
    border-radius: 9999px !important;
  }

  /* 8. 代码块与终端块 */
  pre, code, [class*="group/run-command"] {
    background: ${bgGlass} !important;
    background-color: ${bgGlass} !important;
    backdrop-filter: blur(${blur}px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(${blur}px) saturate(130%) !important;
    border: 1px solid rgba(255, 190, 215, 0.20) !important;
    border-radius: 10px !important;
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
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6) !important;
  }

  /* 10. 仅针对询问对话（Ask Question / Permission 弹窗）选项的 Hover 效果 */
  div[class*="rounded-2xl"][class*="bg-card-border"],
  div[class*="bg-card"][class*="rounded-"] {
    background: rgba(18, 14, 26, 0.22) !important;
    background-color: rgba(18, 14, 26, 0.22) !important;
    backdrop-filter: blur(20px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(130%) !important;
    border: 1px solid rgba(255, 190, 215, 0.30) !important;
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  }
  div[class*="bg-card-border"] span,
  div[class*="bg-card-border"] p,
  div[class*="bg-card-border"] h3,
  div[class*="bg-card-border"] [class*="text-foreground"] {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6) !important;
  }

  div[class*="bg-card-border"] textarea[class*="font-mono"],
  textarea[aria-label="Edit permission target"] {
    background: ${bgGlass} !important;
    background-color: ${bgGlass} !important;
    border: 1px solid rgba(255, 190, 215, 0.22) !important;
    color: #ffffff !important;
    border-radius: 8px !important;
  }

  /* 选项盒模型常态锁定 1px 柔和边框，杜绝尺寸变动与挤压 */
  label[for*="ask-opt-"],
  label:has(input[name*="ask-question"]),
  [role="radiogroup"] label,
  div[class*="bg-card-border"] [role="radiogroup"] label,
  div[class*="bg-card-border"] label {
    background: rgba(20, 15, 28, 0.60) !important;
    background-color: rgba(20, 15, 28, 0.60) !important;
    background-image: none !important;
    border: 1px solid rgba(255, 255, 255, 0.14) !important;
    border-radius: 10px !important;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14) !important;
    box-sizing: border-box !important;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
    cursor: pointer !important;
  }

  /* 未选中状态徽标与文字 */
  label[for*="ask-opt-"] div[class*="bg-border"],
  label:has(input[name*="ask-question"]) div[class*="bg-border"],
  [role="radiogroup"] label div[class*="bg-border"],
  div[class*="bg-card-border"] label div[class*="bg-border"] {
    background: rgba(255, 255, 255, 0.10) !important;
    background-color: rgba(255, 255, 255, 0.10) !important;
    background-image: none !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    box-shadow: none !important;
    border-radius: 6px !important;
    transition: all 0.18s ease !important;
  }
  label[for*="ask-opt-"] div[class*="bg-border"] span,
  label:has(input[name*="ask-question"]) div[class*="bg-border"] span,
  [role="radiogroup"] label div[class*="bg-border"] span,
  div[class*="bg-card-border"] label div[class*="bg-border"] span {
    color: rgba(255, 255, 255, 0.65) !important;
    font-weight: 600 !important;
    text-shadow: none !important;
  }
  label[for*="ask-opt-"] span,
  label:has(input[name*="ask-question"]) span,
  [role="radiogroup"] label span,
  div[class*="bg-card-border"] label span {
    color: rgba(255, 255, 255, 0.85) !important;
    font-weight: 400 !important;
    text-shadow: none !important;
  }

  /* 选项 Hover：保持 1px 边框厚度不挤压，柔粉透光高亮 */
  label[for*="ask-opt-"]:not(:has(input:checked)):not(.bg-secondary):hover,
  label:has(input[name*="ask-question"]):not(:has(input:checked)):not(.bg-secondary):hover,
  [role="radiogroup"] label:not(:has(input:checked)):not(.bg-secondary):hover,
  div[class*="bg-card-border"] [role="radiogroup"] label:not(:has(input:checked)):not(.bg-secondary):hover,
  div[class*="bg-card-border"] label:not(:has(input:checked)):not(.bg-secondary):hover {
    background: rgba(255, 180, 215, 0.18) !important;
    background-color: rgba(255, 180, 215, 0.18) !important;
    border: 1px solid rgba(255, 190, 215, 0.45) !important;
    box-shadow: inset 0 0 0 1px rgba(255, 190, 215, 0.45), 0 0 14px rgba(255, 180, 215, 0.18) !important;
  }
  label[for*="ask-opt-"]:not(:has(input:checked)):not(.bg-secondary):hover div[class*="bg-border"] span,
  label:has(input[name*="ask-question"]):not(:has(input:checked)):not(.bg-secondary):hover div[class*="bg-border"] span,
  [role="radiogroup"] label:not(:has(input:checked)):not(.bg-secondary):hover div[class*="bg-border"] span,
  div[class*="bg-card-border"] label:not(:has(input:checked)):not(.bg-secondary):hover div[class*="bg-border"] span {
    color: #ffffff !important;
  }

  /* 选项 选中态 (Selected) 强视觉辨识度与发光光晕（严禁使用 class*="bg-secondary" 泛匹配） */
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
    background: linear-gradient(90deg, rgba(255, 120, 190, 0.50), rgba(255, 75, 160, 0.32)) !important;
    background-color: rgba(255, 100, 175, 0.42) !important;
    border: 1.5px solid rgba(255, 220, 245, 0.95) !important;
    border-radius: 10px !important;
    box-shadow: 0 0 24px rgba(255, 105, 180, 0.70), inset 4px 0 0 0 #ff2d7d, inset 0 0 0 1.5px rgba(255, 220, 245, 0.95), inset 0 0 14px rgba(255, 180, 220, 0.40) !important;
  }

  /* 选中态内部序号徽标：明艳发光高亮粉，一眼即识 */
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
    background: linear-gradient(135deg, #ff5599, #ff1a70) !important;
    background-color: #ff1a70 !important;
    border: 1.5px solid #ffffff !important;
    box-shadow: 0 0 12px rgba(255, 26, 112, 0.9), 0 2px 6px rgba(0, 0, 0, 0.5) !important;
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
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6) !important;
  }

  /* 选中态文字纯白加粗，带柔和光晕与阴影 */
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
    color: rgba(255, 255, 255, 0.6) !important;
  }

  /* 11. 正文文字自然排版 */
  .text-foreground, [class*="text-foreground"],
  [class*="leading-relaxed"] p, [class*="leading-relaxed"] li,
  [class*="leading-relaxed"] h1, [class*="leading-relaxed"] h2,
  [class*="leading-relaxed"] h3, [class*="leading-relaxed"] h4 {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6) !important;
  }

  /* 12. 弹窗、设置面板、模态框与气泡浮层（轻透高质感毛玻璃） */
  .settings-modal-backdrop,
  div[class*="backdrop"] {
    background: rgba(0, 0, 0, 0.18) !important;
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
  }

  [role="dialog"],
  [aria-modal="true"],
  .settings-modal-container,
  div[class*="settings-modal-container"],
  div[class*="modal-container"],
  div[role="dialog"].bg-background,
  div[aria-modal="true"].bg-background {
    background: rgba(28, 20, 36, 0.40) !important;
    background-color: rgba(28, 20, 36, 0.40) !important;
    backdrop-filter: blur(24px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(24px) saturate(140%) !important;
    border: 1px solid rgba(255, 190, 215, 0.28) !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 190, 215, 0.15) !important;
  }

  /* 弹窗内部左侧导航与分割线：轻透层级感 */
  [role="dialog"] div[class*="bg-sidebar"],
  [role="dialog"] div[class*="border-r"] {
    background: rgba(14, 10, 20, 0.18) !important;
    background-color: rgba(14, 10, 20, 0.18) !important;
    border-color: rgba(255, 190, 215, 0.20) !important;
  }

  [role="dialog"] * {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7) !important;
  }

  [role="dialog"] button,
  [role="dialog"] [role="button"],
  [role="dialog"] select,
  [role="dialog"] input {
    color: #ffffff !important;
  }

  /* 下拉菜单、浮层与 Popover */
  [role="menu"],
  [role="listbox"],
  [data-radix-popper-content-wrapper] > div,
  [data-radix-menu-content],
  [data-radix-select-content],
  div[class*="popover"],
  div[class*="dropdown"] {
    background: rgba(26, 20, 36, 0.65) !important;
    background-color: rgba(26, 20, 36, 0.65) !important;
    backdrop-filter: blur(24px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(24px) saturate(140%) !important;
    border: 1px solid rgba(255, 190, 215, 0.25) !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  }

  /* 13. 细滚动条 */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 150, 185, 0.45);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255, 150, 185, 0.75); }
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

        // 1. Remove old skin
        const oldStyle = document.getElementById("antigravity-dream-skin-style");
        if (oldStyle) oldStyle.remove();
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
