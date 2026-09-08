import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const themesDir = path.resolve(__dirname, "../themes");

function main() {
  if (!fs.existsSync(themesDir)) {
    console.log("暂无本地预设主题目录。");
    return;
  }

  const entries = fs.readdirSync(themesDir, { withFileTypes: true });
  const themeList = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const themePath = path.join(themesDir, entry.name);
      const metaPath = path.join(themePath, "theme.json");
      const bgPath = path.join(themePath, "background.jpg");
      let meta = { name: entry.name, tagline: "无标语说明" };
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        } catch (e) {}
      }
      themeList.push({
        id: entry.name,
        name: meta.name || entry.name,
        tagline: meta.tagline || "-",
        hasBackground: fs.existsSync(bgPath)
      });
    }
  }

  console.log("\n🎨 Antigravity 2.0 本地可用主题清单：\n");
  console.log("ID".padEnd(20) + "主题名称".padEnd(20) + "标语 / 特色".padEnd(35) + "壁纸就绪");
  console.log("-".repeat(85));

  for (const t of themeList) {
    console.log(
      t.id.padEnd(20) +
      t.name.padEnd(20) +
      t.tagline.padEnd(35) +
      (t.hasBackground ? "✅ 是" : "❌ 否")
    );
  }
  console.log("\n💡 使用方法: node scripts/apply_skin.mjs --theme <ID>\n");
}

main();
