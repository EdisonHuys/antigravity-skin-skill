import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let WebSocket;
try {
  WebSocket = globalThis.WebSocket;
} catch (e) {}

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

async function checkSkinInPage(wsUrl) {
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
          expression: 'Boolean(document.getElementById("antigravity-dream-skin-style"))',
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
          resolve(Boolean(msg.result?.result?.value));
        }
      } catch (e) {
        resolve(false);
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

    console.log(`[Daemon] 🚀 自动唤醒并注入主题: ${themeConfig.theme || themeConfig.name || "pink-hanfu"}`);
    const proc = spawn(process.execPath, args, { stdio: "inherit" });
    proc.on("close", resolve);
    proc.on("error", (err) => {
      console.error("[Daemon] 注入进程异常:", err);
      resolve();
    });
  });
}

let isInjecting = false;

async function checkAndApply() {
  if (isInjecting) return;

  const activeThemePath = path.join(__dirname, "../active_theme.json");
  if (!fs.existsSync(activeThemePath)) return;

  let themeConfig;
  try {
    themeConfig = JSON.parse(fs.readFileSync(activeThemePath, "utf8"));
  } catch (e) {
    return;
  }

  if (themeConfig.enabled === false) return;

  const port = detectPort();
  if (!port) return;

  try {
    const targets = await getTargets(port);
    const pages = targets.filter(t => t.type === "page" && t.webSocketDebuggerUrl);

    for (const page of pages) {
      try {
        const hasSkin = await checkSkinInPage(page.webSocketDebuggerUrl);
        if (!hasSkin) {
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

console.log("🌸 Antigravity Skin 自动常驻守护进程已启动，正在监控应用启动与窗口事件...");

checkAndApply();
setInterval(checkAndApply, 2000);
