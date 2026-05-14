# eveai-api-unofficial

Thư viện Node.js unofficial để gọi EverAI Text-To-Speech bằng cookie đăng nhập của chính bạn.

> Đây là client không chính thức, dùng endpoint web hiện tại của EverAI. Chỉ dùng với tài khoản/cookie mà bạn có quyền truy cập.

## Cài đặt

```bash
npm install eveai-api-unofficial
```

Yêu cầu Node.js >= 18 vì thư viện dùng `fetch` mặc định của Node.

## Dùng nhanh như thư viện

Bạn chỉ cần truyền nguyên `Cookie` header lấy từ browser DevTools.

```js
const { createClient } = require("eveai-api-unofficial");

const client = createClient({
  cookie: "django_language=vi; csrftoken=...; sessionid=...",
  logLevel: "info",
});

async function main() {
  const result = await client.textToSpeech({
    text: "Xin chào, đây là test EverAI TTS.",
    modelId: "everai-v1.5",
    speakerId: "voice-e829405f-8101-414e",
    audioType: "mp3",
  });

  console.log(result.audioUrl);
}

main().catch(console.error);
```

Nếu muốn gọi một lần ngắn gọn:

```js
const { textToSpeech } = require("eveai-api-unofficial");

const result = await textToSpeech(
  "csrftoken=...; sessionid=...",
  "Xin chào từ EverAI",
  { audioType: "mp3" }
);

console.log(result.audioUrl);
```

## Lấy cookie từ browser

1. Đăng nhập EverAI trên browser.
2. Mở DevTools > Network.
3. Gọi thử trang Text-To-Speech.
4. Chọn request tới EverAI.
5. Copy toàn bộ Request Header `Cookie`.
6. Truyền vào `createClient({ cookie })` hoặc biến môi trường `COOKIE`.

Cookie/session có quyền truy cập tài khoản, hãy xem như token đăng nhập.

## Dùng qua `.env`

`.env` là tùy chọn. Nếu dùng như thư viện, bạn có thể truyền mọi option trực tiếp trong code và không cần tạo `.env`.

Tạo file `.env` từ `.env.example` nếu muốn dùng CLI hoặc cấu hình qua biến môi trường:

```bash
cp .env.example .env
```

Các biến chính:

```env
# Bắt buộc khi gọi API thật nếu không truyền cookie trực tiếp trong code.
COOKIE=django_language=vi; csrftoken=...; sessionid=...

# Có thể dùng riêng thay cho COOKIE.
# CSRFTOKEN=your_csrftoken
# SESSIONID=your_sessionid

# Tùy chọn, thường không cần đổi.
BASE_URL=https://www.everai.vn/

# Tùy chọn cho CLI nếu không truyền --text.
TTS_TEXT=Xin chào, đây là đoạn thử nghiệm tạo giọng nói bằng EverAI.

# Tùy chọn giọng/model. Mặc định chỉ cần SPEAKER_ID, STYLE_ID không bắt buộc.
SPEAKER_ID=voice-e829405f-8101-414e
MODEL_ID=everai-v1.5
# STYLE_ID=style-optional

# Tùy chọn định dạng và tham số giọng đọc.
AUDIO_TYPE=mp3
# SPEED: tốc độ đọc. 1.0 là bình thường, tối đa 1.5.
SPEED=1.0
# PITCH: cao độ giọng. 1.0 là bình thường, tối đa 1.5.
PITCH=1.0
# VOLUME: âm lượng. 100 là bình thường, tối đa 150.
VOLUME=100
# ENHANCE_VOICE: bật/tắt tăng cường giọng nếu tài khoản/model hỗ trợ.
ENHANCE_VOICE=false

# Tùy chọn polling chờ link audio.
ATTEMPTS=20
INTERVAL_MS=3000

# Tùy chọn log: silent, error, warn, info, debug.
LOG_LEVEL=info
```

Ví dụ không dùng `.env`:

```js
const client = createClient({
  cookie: "csrftoken=...; sessionid=...",
  defaults: {
    speakerId: "voice-e829405f-8101-414e",
    modelId: "everai-v1.5",
    audioType: "mp3",
  },
});
```

## CLI

```bash
npm run tts
```

Hoặc:

```bash
node bin/eveai-tts.js --text "Xin chào" --format wav --model everai-v1.5 --speed 1.1 --pitch 1.0 --volume 100
```

Kết quả:

```json
{
  "requestId": "626702a3-5db6-432d-9bb2-387018712438",
  "audioUrl": "https://www.everai.vn/media/audio/example.wav?v=...",
  "html": "...",
  "raw": {},
  "elapsedMs": 12345
}
```

## API reference

### `createClient(options?)`

Tạo client mới.

```js
const client = createClient({
  baseUrl: "https://www.everai.vn/",
  cookie: "csrftoken=...; sessionid=...",
  csrfToken: "...",
  sessionId: "...",
  logLevel: "silent",
});
```

`csrfToken` sẽ tự được tách từ cookie `csrftoken` nếu có.

### `createEveAi(cookie, options?)`

Shortcut tạo client từ cookie.

```js
const client = createEveAi("csrftoken=...; sessionid=...", {
  logLevel: "info",
});
```

### `textToSpeech(cookie, text, options?)`

Shortcut tạo client và gọi TTS một lần.

```js
const result = await textToSpeech(
  "csrftoken=...; sessionid=...",
  "Nội dung cần đọc",
  { audioType: "mp3" }
);
```

### `client.textToSpeech(options)` / `client.tts(text, options?)`

Tạo request TTS và polling đến khi có audio URL.

```js
const result = await client.textToSpeech({
  text: "Nội dung cần đọc",
  speakerId: "voice-e829405f-8101-414e",
  modelId: "everai-v1.5",
  audioType: "mp3",
  speed: "1.0",  // tốc độ đọc, tối đa 1.5
  pitch: "1.0",  // cao độ giọng, tối đa 1.5
  volume: "100", // âm lượng, tối đa 150
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

### `client.createTtsRequest(options)`

Chỉ tạo request, không polling audio.

```js
const { requestId } = await client.createTtsRequest({
  text: "Xin chào",
  audioType: "wav",
});
```

### `client.getTtsOutputHtml(requestId)`

Lấy HTML output/history theo `requestId`.

```js
const html = await client.getTtsOutputHtml(requestId);
```

### `client.waitForAudioUrl(requestId, options?)`

Polling HTML output đến khi tìm được link download.

```js
const { audioUrl } = await client.waitForAudioUrl(requestId, {
  attempts: 20,
  intervalMs: 3000,
});
```

### `client.extractAudioUrl(html)`

Tách URL audio từ HTML output.

```js
const audioUrl = client.extractAudioUrl(html);
```

## Endpoint web đang dùng

Tạo TTS:

```http
POST /text-to-speech/create-request
Content-Type: application/json
X-CSRFToken: <csrftoken>
X-Requested-With: XMLHttpRequest
Cookie: <cookie đăng nhập>
```

Lấy output:

```http
GET /text-to-speech/get-tts-output?rid=<request_id>
X-Requested-With: XMLHttpRequest
Cookie: <cookie đăng nhập>
```

## Log

Mặc định client không log. Bật log khi cần debug:

```js
const client = createClient({
  cookie: "csrftoken=...; sessionid=...",
  logLevel: "debug",
});
```

Các mức log: `silent`, `error`, `warn`, `info`, `debug`.

Log đã loại bỏ `cookie`, `csrfToken`, `sessionId` khỏi dữ liệu log để tránh lộ secret.

## Trang docs bằng Vite

Chạy local:

```bash
npm run docs:dev
```

Build static site:

```bash
npm run docs:build
npm run docs:preview
```

File entry của trang docs là `index.html`, output nằm trong `dist/` và đã được ignore khỏi Git/npm.

## Publish GitHub/npm

Repo đã có:

- `.gitignore` bảo vệ `.env`, key/cert, dependency, build output, file local/private.
- `.npmignore` loại GitHub workflow, local scratch, secret và artifact khỏi npm tarball.
- `.github/workflows/ci.yml` để chạy `npm ci`, `npm run prepack`, `npm run docs:build`, `npm pack --dry-run`.
- `.github/workflows/publish.yml` để publish npm khi tạo GitHub Release hoặc chạy thủ công.

Để publish npm bằng workflow, tạo secret `NPM_TOKEN` trong GitHub repository settings.

## Bảo mật

- Không commit `.env` thật.
- Không đưa cookie/session vào issue, log public, README, npm package hoặc GitHub Actions output.
- Cookie/session cho phép dùng tài khoản EverAI của bạn, cần bảo quản như token đăng nhập.
- Khi cookie hết hạn, hãy lấy lại cookie mới từ browser.
- Chỉ dùng với tài khoản/cookie mà bạn có quyền truy cập.
