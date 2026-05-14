const { createClient, loadEnv } = require("./src");

loadEnv();

async function demoEverAiTts() {
  const client = createClient();
  const result = await client.textToSpeech({
    text: process.env.TTS_TEXT || "Xin chào, đây là đoạn thử nghiệm tạo giọng nói bằng EverAI.",
    speakerId: process.env.SPEAKER_ID,
    modelId: process.env.MODEL_ID,
    styleId: process.env.STYLE_ID,
    audioType: process.env.AUDIO_TYPE || "mp3",
    speed: process.env.SPEED,
    pitch: process.env.PITCH,
    volume: process.env.VOLUME,
    enhanceVoice: ["1", "true", "yes", "on"].includes(String(process.env.ENHANCE_VOICE || "").toLowerCase()),
  });

  console.log("request_id:", result.requestId);
  console.log("audio_url:", result.audioUrl || "Audio chưa hoàn tất hoặc output HTML chưa chứa link download.");
  return result;
}

if (require.main === module) {
  demoEverAiTts().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  ...require("./src"),
  demoEverAiTts,
};
