const fs = require("node:fs");
const path = require("node:path");

function loadEnv(filePath = path.join(process.cwd(), ".env")) {
  if (!fs.existsSync(filePath)) return {};

  const loaded = {};
  const env = fs.readFileSync(filePath, "utf8");

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    loaded[key] = value;

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  return loaded;
}

module.exports = { loadEnv };
