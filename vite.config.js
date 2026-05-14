const { defineConfig } = require("vite");

module.exports = defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/eveai-api-unofficial/" : "/",
  build: {
    outDir: "dist",
  },
});
