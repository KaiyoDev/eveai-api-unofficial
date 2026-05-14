#!/usr/bin/env node

const { createClient, loadEnv } = require("../src");

loadEnv();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const client = createClient();

  const result = await client.textToSpeech({
    text: args.text || process.env.TTS_TEXT,
    speakerId: args.speaker || process.env.SPEAKER_ID,
    modelId: args.model || process.env.MODEL_ID,
    styleId: args.style || process.env.STYLE_ID,
    audioType: args.format || process.env.AUDIO_TYPE,
    speed: args.speed || process.env.SPEED,
    pitch: args.pitch || process.env.PITCH,
    volume: args.volume || process.env.VOLUME,
    enhanceVoice: parseBoolean(args.enhanceVoice || process.env.ENHANCE_VOICE),
    attempts: Number(args.attempts || process.env.ATTEMPTS || 20),
    intervalMs: Number(args.intervalMs || process.env.INTERVAL_MS || 3000),
  });

  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;

    const eqIndex = arg.indexOf("=");
    if (eqIndex !== -1) {
      args[toCamelCase(arg.slice(2, eqIndex))] = arg.slice(eqIndex + 1);
      continue;
    }

    const key = toCamelCase(arg.slice(2));
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
    } else {
      args[key] = next;
      i++;
    }
  }

  return args;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function parseBoolean(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
