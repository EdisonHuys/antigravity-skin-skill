import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

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
  return null;
}

async function getTargets(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(1500, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

async function checkStateInPage(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    let timer = setTimeout(() => {
      try { ws.close(); } catch (e) {}
      reject(new Error("WS Timeout"));
    }, 2000);

    const onOpen = () => {
      ws.send(JSON.stringify({
        id: id++,
        method: "Runtime.evaluate",
        params: {
          expression: '({ hasSkin: Boolean(document.getElementById("antigravity-dream-skin-style")), hasZh: Boolean(document.getElementById("antigravity-zh-localization-marker")) })',
          returnByValue: true
        }
      }));
    };

    const onMessage = (eventOrData) => {
      clearTimeout(timer);
      const data = eventOrData?.data !== undefined ? eventOrData.data : eventOrData;
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id === 1) {
          try { ws.close(); } catch (e) {}
          resolve(msg.result?.result?.value || { hasSkin: false, hasZh: false });
        }
      } catch (e) {
        resolve({ hasSkin: false, hasZh: false });
      }
    };

    const onError = (err) => {
      clearTimeout(timer);
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

let cachedZhScript = null;
function getZhScript() {
  if (cachedZhScript) return cachedZhScript;
  const zhScriptPath = path.join(__dirname, "zh_translator.js");
  if (fs.existsSync(zhScriptPath)) {
    try {
      cachedZhScript = fs.readFileSync(zhScriptPath, "utf8");
    } catch (e) {}
  }
  return cachedZhScript;
}

async function injectZhInPage(wsUrl) {
  const zhCode = getZhScript();
  if (!zhCode) return;

  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    let timer = setTimeout(() => {
      try { ws.close(); } catch (e) {}
      resolve();
    }, 3000);

    const onOpen = () => {
      ws.send(JSON.stringify({
        id: id++,
        method: "Runtime.evaluate",
        params: {
          expression: zhCode,
          userGesture: true,
          awaitPromise: true
        }
      }));
    };

    const onMessage = () => {
      clearTimeout(timer);
      try { ws.close(); } catch (e) {}
      console.log(`[Daemon ${new Date().toLocaleTimeString()}] 🌐 自动为活动窗口热注入中文汉化引擎！`);
      resolve();
    };

    const onError = () => {
      clearTimeout(timer);
      try { ws.close(); } catch (e) {}
      resolve();
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

function runApplySkin(themeConfig) {
  return new Promise((resolve) => {
    const args = [path.join(__dirname, "apply_skin.mjs")];
    if (themeConfig.theme) {
      args.push("--theme", themeConfig.theme);
    } else if (themeConfig.image) {
      args.push("--image", themeConfig.image);
      if (themeConfig.name) args.push("--name", themeConfig.name);
      if (themeConfig.tagline) args.push("--tagline", themeConfig.tagline);
      if (themeConfig.focusX != null) args.push("--focus-x", String(themeConfig.focusX));
      if (themeConfig.focusY != null) args.push("--focus-y", String(themeConfig.focusY));
    } else {
      args.push("--theme", "pink-hanfu");
    }
    if (themeConfig.blur != null) args.push("--blur", String(themeConfig.blur));
    if (themeConfig.opacity != null) args.push("--opacity", String(themeConfig.opacity));

    console.log(`[Daemon ${new Date().toLocaleTimeString()}] 🚀 自动唤醒并注入主题: ${themeConfig.theme || themeConfig.name || "pink-hanfu"}`);
    const proc = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    proc.stdout?.on("data", (d) => {
      try { process.stdout?.write(d); } catch (e) {}
    });
    proc.stderr?.on("data", (d) => {
      try { process.stderr?.write(d); } catch (e) {}
    });
    proc.on("close", resolve);
    proc.on("error", (err) => {
      console.error("[Daemon] 注入进程异常:", err);
      resolve();
    });
  });
}

process.on("uncaughtException", (err) => {
  try { console.error("[Daemon UncaughtException]:", err); } catch (e) {}
});
process.on("unhandledRejection", (err) => {
  try { console.error("[Daemon UnhandledRejection]:", err); } catch (e) {}
});

let isInjecting = false;

async function checkAndApply() {
  if (isInjecting) return;

  const activeThemePath = path.join(__dirname, "../active_theme.json");
  let themeConfig = { theme: "pink-hanfu", enabled: true };

  if (fs.existsSync(activeThemePath)) {
    try {
      themeConfig = JSON.parse(fs.readFileSync(activeThemePath, "utf8"));
    } catch (e) {}
  }

  if (themeConfig.enabled === false) return;

  const port = detectPort();
  if (!port) return;

  try {
    const targets = await getTargets(port);
    const pages = targets.filter(t => t.type === "page" && t.webSocketDebuggerUrl && !t.url?.startsWith("devtools://"));

    for (const page of pages) {
      try {
        const state = await checkStateInPage(page.webSocketDebuggerUrl);
        if (!state.hasZh) {
          await injectZhInPage(page.webSocketDebuggerUrl);
        }
        if (!state.hasSkin) {
          isInjecting = true;
          await runApplySkin(themeConfig);
          await new Promise(r => setTimeout(r, 1000));
          isInjecting = false;
          break;
        }
      } catch (e) {
        // Page loading
      }
    }
  } catch (e) {
    // Port busy or restarting
  }
}

console.log(`[Daemon ${new Date().toLocaleTimeString()}] 🌸 Antigravity Skin 自动常驻守护进程已启动，正在监控应用启动与窗口事件...`);

checkAndApply();
setInterval(checkAndApply, 1500);
