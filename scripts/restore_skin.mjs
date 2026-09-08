import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

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
  const portFile = path.join(process.env.HOME || "/Users/mac", "Library/Application Support/Antigravity/DevToolsActivePort");
  if (fs.existsSync(portFile)) {
    try {
      const content = fs.readFileSync(portFile, "utf8").trim();
      const lines = content.split("\n");
      const port = parseInt(lines[0], 10);
      if (port > 0) return port;
    } catch (e) {}
  }
  return 53735;
}

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

async function main() {
  const port = detectPort();
  console.log(`📡 正在连接 Antigravity CDP 调试端口: ${port}...`);

  let targets;
  try {
    targets = await getTargets(port);
  } catch (e) {
    console.error(`❌ 无法连接到端口 ${port}。`);
    process.exit(1);
  }

  const page = targets.find(t => t.type === "page");
  if (!page) {
    console.error(`❌ 未找到 Antigravity 交互页面。`);
    process.exit(1);
  }

  const res = await evalInPage(page.webSocketDebuggerUrl, `(() => {
    const oldStyle = document.getElementById("antigravity-dream-skin-style");
    if (oldStyle) oldStyle.remove();
    const oldBg = document.getElementById("antigravity-dream-skin-bg");
    if (oldBg) oldBg.remove();
    const oldWm = document.getElementById("dream-skin-watermark");
    if (oldWm) oldWm.remove();

    const chatContainers = document.querySelectorAll('div[class*="mx-auto"], div[class*="md-table-bleed"] > div');
    chatContainers.forEach(el => {
      if (el.getAttribute("style")) el.removeAttribute("style");
    });

    return {
      success: true,
      restored: !document.getElementById("antigravity-dream-skin-style") && !document.getElementById("antigravity-dream-skin-bg")
    };
  })()`);

  if (res && res.success) {
    console.log("✅ 成功还原！Antigravity 2.0 已恢复官方默认原生外观。");
    const activeThemePath = path.join(__dirname, "../active_theme.json");
    try {
      if (fs.existsSync(activeThemePath)) {
        fs.writeFileSync(activeThemePath, JSON.stringify({ enabled: false, restoredAt: new Date().toISOString() }, null, 2));
      }
    } catch (e) {}
  } else {
    console.error("❌ 还原失败:", res);
  }
}

main().catch(console.error);
