# eveai-api-unofficial

Unofficial Node.js client để gọi EverAI Text-To-Speech bằng cookie đăng nhập của chính bạn.

> Package này dùng endpoint web hiện tại của EverAI. Chỉ sử dụng với tài khoản/cookie mà bạn có quyền truy cập.

## Cài đặt

```bash
npm install eveai-api-unofficial
```

Yêu cầu Node.js >= 18.

## Dùng nhanh

Không bắt buộc dùng `.env`. Bạn có thể truyền cookie và options trực tiếp trong code:

```js
const { createClient } = require("eveai-api-unofficial");

const client = createClient({
  cookie: "csrftoken=...; sessionid=...",
  logLevel: "info",
});

const result = await client.textToSpeech({
  text: "Xin chào từ EverAI TTS",
  speakerId: "voice-e829405f-8101-414e",
  modelId: "everai-v1.5",
  audioType: "mp3",
});

console.log(result.audioUrl);
```

Gọi một lần ngắn gọn:

```js
const { textToSpeech } = require("eveai-api-unofficial");

const result = await textToSpeech(
  "csrftoken=...; sessionid=...",
  "Xin chào từ EverAI",
  { audioType: "mp3" }
);

console.log(result.audioUrl);
```

## Lấy cookie

1. Đăng nhập EverAI trên browser.
2. Mở DevTools > Network.
3. Gọi thử trang Text-To-Speech.
4. Chọn request tới EverAI.
5. Copy Request Header `Cookie`.
6. Truyền cookie vào `createClient({ cookie })` hoặc biến môi trường `COOKIE`.

Cookie/session có quyền truy cập tài khoản, hãy bảo quản như token đăng nhập.

## Dùng `.env` tùy chọn

```bash
cp .env.example .env
npm run tts
```

Các biến chính:

```env
# Bắt buộc khi gọi API thật nếu không truyền cookie trong code.
COOKIE=django_language=vi; csrftoken=...; sessionid=...

# Có thể dùng riêng thay cho COOKIE.
# CSRFTOKEN=your_csrftoken
# SESSIONID=your_sessionid

# Thường không cần đổi.
BASE_URL=https://www.everai.vn/

# Text mặc định cho CLI.
TTS_TEXT=Xin chào, đây là đoạn thử nghiệm tạo giọng nói bằng EverAI.

# Voice/model mặc định. STYLE_ID không bắt buộc.
SPEAKER_ID=voice-e829405f-8101-414e
MODEL_ID=everai-v1.5
# STYLE_ID=style-optional

# Định dạng audio.
AUDIO_TYPE=mp3

# SPEED: tốc độ đọc. 1.0 là bình thường, tối đa 1.5.
SPEED=1.0

# PITCH: cao độ giọng. 1.0 là bình thường, tối đa 1.5.
PITCH=1.0

# VOLUME: âm lượng. 100 là bình thường, tối đa 150.
VOLUME=100

# Bật/tắt tăng cường giọng nếu tài khoản/model hỗ trợ.
ENHANCE_VOICE=false

# Polling chờ link audio.
ATTEMPTS=20
INTERVAL_MS=3000

# Log: silent, error, warn, info, debug.
LOG_LEVEL=info
```

## CLI

```bash
npm run tts
```

Hoặc:

```bash
node bin/eveai-tts.js --text "Xin chào" --format mp3 --model everai-v1.5 --speed 1.1 --pitch 1.0 --volume 100
```

Kết quả:

```json
{
  "requestId": "626702a3-5db6-432d-9bb2-387018712438",
  "audioUrl": "https://www.everai.vn/media/audio/example.mp3?v=...",
  "html": "...",
  "raw": {},
  "elapsedMs": 12345
}
```

## API

### `createClient(options?)`

```js
const client = createClient({
  baseUrl: "https://www.everai.vn/",
  cookie: "csrftoken=...; sessionid=...",
  csrfToken: "...",
  sessionId: "...",
  logLevel: "silent",
  defaults: {
    speakerId: "voice-e829405f-8101-414e",
    modelId: "everai-v1.5",
    audioType: "mp3",
  },
});
```

### `client.textToSpeech(options)`

```js
const result = await client.textToSpeech({
  text: "Nội dung cần đọc",
  speakerId: "voice-e829405f-8101-414e",
  modelId: "everai-v1.5",
  audioType: "mp3",
  speed: "1.0",
  pitch: "1.0",
  volume: "100",
  enhanceVoice: false,
  attempts: 20,
  intervalMs: 3000,
});
```

Trả về:

```js
{
  requestId: "...",
  audioUrl: "...",
  html: "...",
  raw: {},
  elapsedMs: 12345
}
```

### Shortcuts

```js
const { createEveAi, textToSpeech } = require("eveai-api-unofficial");

const client = createEveAi("csrftoken=...; sessionid=...");

const result = await textToSpeech(
  "csrftoken=...; sessionid=...",
  "Nội dung cần đọc",
  { audioType: "mp3" }
);
```

## Docs site

```bash
npm run docs:dev
npm run docs:build
npm run docs:preview
```

## Publish

Repo có sẵn GitHub Actions:

- `CI`: kiểm tra package entrypoint, build docs, `npm pack --dry-run`.
- `Publish Package`: publish npm khi tạo GitHub Release hoặc chạy thủ công.

Để publish bằng GitHub Actions, thêm secret `NPM_TOKEN` trong repository settings.

## Bảo mật

- Không commit `.env` thật.
- Không đưa cookie/session vào README, issue, log public, npm package hoặc GitHub Actions output.
- `.gitignore` và `.npmignore` đã loại secret, key/cert, build output, dependency, file local/private.
- Khi cookie hết hạn, lấy lại cookie mới từ browser.

## License

MIT
