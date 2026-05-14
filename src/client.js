const DEFAULT_BASE_URL = "https://www.everai.vn/";
const DEFAULT_TTS_OPTIONS = {
  speakerId: "voice-e829405f-8101-414e",
  modelId: "everai-v1.5",
  audioType: "mp3",
  speed: "1.0",
  pitch: "1.0",
  volume: "100",
  bitrate: "128 kbps",
  enhanceVoice: false,
};

class EveAiClient {
  constructor(options = {}) {
    if (typeof options === "string") {
      options = { cookie: options };
    }

    this.baseUrl = normalizeBaseUrl(options.baseUrl || process.env.BASE_URL || DEFAULT_BASE_URL);
    this.cookie = options.cookie || process.env.COOKIE || process.env.COOKIE_HEADER || process.env.EVERAI_COOKIE || "";
    this.csrfToken = options.csrfToken
      || process.env.CSRFTOKEN
      || process.env.CSRF_TOKEN
      || process.env.csrftoken
      || getCookieFromHeader(this.cookie, "csrftoken");
    this.sessionId = options.sessionId || process.env.SESSIONID || getCookieFromHeader(this.cookie, "sessionid");
    this.fetch = options.fetch || globalThis.fetch;
    this.logger = createLogger(options.logger, options.logLevel || process.env.LOG_LEVEL);
    this.defaults = { ...DEFAULT_TTS_OPTIONS, ...(options.defaults || {}) };

    if (!this.fetch) {
      throw new Error("Node.js 18+ hoặc fetch implementation là bắt buộc");
    }

    if (!this.cookie && (this.csrfToken || this.sessionId)) {
      this.cookie = buildCookie({ csrftoken: this.csrfToken, sessionid: this.sessionId });
    }

    this.log("debug", "client:init", {
      baseUrl: this.baseUrl,
      hasCookie: Boolean(this.cookie),
      hasCsrfToken: Boolean(this.csrfToken),
      hasSessionId: Boolean(this.sessionId),
    });
  }

  async tts(text, options = {}) {
    return this.textToSpeech({ ...options, text });
  }

  async textToSpeech(options = {}) {
    const startedAt = Date.now();
    const { requestId, raw } = await this.createTtsRequest(options);
    const output = await this.waitForAudioUrl(requestId, {
      attempts: options.attempts,
      intervalMs: options.intervalMs,
    });

    const result = {
      requestId,
      audioUrl: output.audioUrl,
      html: output.html,
      raw,
      elapsedMs: Date.now() - startedAt,
    };

    this.log("info", "tts:done", {
      requestId,
      hasAudioUrl: Boolean(result.audioUrl),
      elapsedMs: result.elapsedMs,
    });

    return result;
  }

  async createTtsRequest(options = {}) {
    const payload = this.buildTtsPayload(options);

    this.log("info", "tts:create:start", {
      modelId: payload.model_id,
      speakerId: payload.speaker_id,
      styleId: payload.style_id,
      audioType: payload.audio_type,
      speed: payload.speed,
      pitch: payload.pitch,
      volume: payload.volume,
      characters: payload.input_text.length,
    });

    const data = await this.requestJson("/text-to-speech/create-request", {
      method: "POST",
      csrf: true,
      body: payload,
    });

    if (data.status === 0) {
      const error = new EveAiApiError(data.error_message || "Tạo TTS thất bại", { data });
      error.code = data.error_code;
      this.log("error", "tts:create:error", { code: error.code, message: error.message });
      throw error;
    }

    const requestId = data.result?.request_id;
    this.log("info", "tts:create:success", { requestId, status: data.result?.status });

    return { requestId, raw: data };
  }

  async getTtsOutputHtml(requestId) {
    if (!requestId) {
      throw new Error("Thiếu requestId");
    }

    const url = new URL("/text-to-speech/get-tts-output", this.baseUrl);
    url.searchParams.set("rid", requestId);

    this.log("debug", "tts:output:fetch", { requestId });

    const response = await this.fetch(url, {
      method: "GET",
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new EveAiApiError(`Lấy output thất bại: HTTP ${response.status}`, { response });
    }

    return response.text();
  }

  async waitForAudioUrl(requestId, options = {}) {
    const attempts = Number(options.attempts ?? 20);
    const intervalMs = Number(options.intervalMs ?? 3000);
    let html = "";

    for (let attempt = 1; attempt <= attempts; attempt++) {
      html = await this.getTtsOutputHtml(requestId);
      const audioUrl = this.extractAudioUrl(html);

      this.log("debug", "tts:poll", { requestId, attempt, attempts, hasAudioUrl: Boolean(audioUrl) });

      if (audioUrl) {
        return { audioUrl, html };
      }

      if (attempt < attempts) {
        await delay(intervalMs);
      }
    }

    this.log("warn", "tts:poll:timeout", { requestId, attempts, intervalMs });
    return { audioUrl: null, html };
  }

  extractAudioUrl(html) {
    const hrefMatch = html.match(/id=["']download[^"']*["'][\s\S]*?href=["']([^"']+)["']/i)
      || html.match(/href=["']([^"']+)["'][\s\S]*?id=["']download[^"']*["']/i);

    if (!hrefMatch || !hrefMatch[1] || hrefMatch[1] === "#") {
      return null;
    }

    return new URL(hrefMatch[1], this.baseUrl).href;
  }

  buildTtsPayload(options = {}) {
    const merged = { ...this.defaults, ...options };
    const text = merged.text || merged.inputText;

    if (!text || !String(text).trim()) {
      throw new Error("Thiếu text cần chuyển thành giọng nói");
    }

    const payload = {
      input_text: String(text).trim(),
      audio_type: merged.audioType || merged.format,
      speed: stringifyNumberOption(merged.speed, DEFAULT_TTS_OPTIONS.speed),
      pitch: stringifyNumberOption(merged.pitch, DEFAULT_TTS_OPTIONS.pitch),
      volume: stringifyNumberOption(merged.volume, DEFAULT_TTS_OPTIONS.volume),
      bitrate: merged.bitrate,
      speaker_id: merged.speakerId || merged.speaker_id,
      model_id: merged.modelId || merged.model_id,
      enhance_voice: Boolean(merged.enhanceVoice || merged.enhance_voice),
    };

    const styleId = merged.styleId || merged.style_id;
    if (styleId) {
      payload.style_id = styleId;
    }

    return payload;
  }

  async requestJson(pathname, options = {}) {
    if (options.csrf && !this.csrfToken) {
      throw new Error("Thiếu csrftoken. Hãy truyền cookie có csrftoken hoặc csrfToken riêng.");
    }

    if (!this.cookie) {
      throw new Error("Thiếu cookie đăng nhập. Hãy truyền cookie của tài khoản EverAI.");
    }

    const url = new URL(pathname, this.baseUrl);
    const startedAt = Date.now();

    this.log("debug", "http:request", {
      method: options.method || "GET",
      url: url.href,
      hasBody: Boolean(options.body),
    });

    const response = await this.fetch(url, {
      method: options.method || "GET",
      headers: this.buildHeaders({ csrf: options.csrf, json: Boolean(options.body) }),
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    let data;

    this.log("debug", "http:response", {
      status: response.status,
      ok: response.ok,
      elapsedMs: Date.now() - startedAt,
    });

    try {
      data = JSON.parse(text);
    } catch {
      throw new EveAiApiError(`Response không phải JSON: ${text.slice(0, 500)}`, { response, text });
    }

    if (!response.ok) {
      throw new EveAiApiError(data.error_message || `HTTP ${response.status}`, { response, data });
    }

    return data;
  }

  buildHeaders(options = {}) {
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      "Cookie": this.cookie,
      "Referer": new URL("/text-to-speech", this.baseUrl).href,
      "Origin": new URL(this.baseUrl).origin,
      "User-Agent": "eveai-api-unofficial/0.2.0",
    };

    if (options.json) {
      headers["Content-Type"] = "application/json";
    }

    if (options.csrf) {
      headers["X-CSRFToken"] = this.csrfToken;
    }

    return headers;
  }

  log(level, event, data = {}) {
    this.logger[level]?.(event, sanitizeLogData(data));
  }
}

class EveAiApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "EveAiApiError";
    Object.assign(this, details);
  }
}

function createClient(options) {
  return new EveAiClient(options);
}

function createEveAi(cookie, options = {}) {
  return new EveAiClient({ ...options, cookie });
}

async function textToSpeech(cookie, text, options = {}) {
  return createEveAi(cookie, options).tts(text, options);
}

function createLogger(logger, level = "silent") {
  if (logger === false || level === "silent") {
    return {};
  }

  const levels = ["error", "warn", "info", "debug"];
  const maxIndex = levels.indexOf(level || "info");
  const enabled = maxIndex === -1 ? levels.indexOf("info") : maxIndex;
  const base = logger || console;
  const result = {};

  for (const current of levels) {
    if (levels.indexOf(current) <= enabled) {
      result[current] = (event, data) => base[current === "debug" ? "log" : current]?.(`[eveai:${current}] ${event}`, data);
    }
  }

  return result;
}

function sanitizeLogData(data) {
  const clone = { ...data };
  delete clone.cookie;
  delete clone.csrfToken;
  delete clone.sessionId;
  return clone;
}

function stringifyNumberOption(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function buildCookie(values) {
  return Object.entries(values)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function getCookieFromHeader(cookieHeader, name) {
  const cookies = String(cookieHeader || "").split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const cookie = cookies.find((part) => part.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : "";
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  EveAiClient,
  EveAiApiError,
  DEFAULT_TTS_OPTIONS,
  createClient,
  createEveAi,
  textToSpeech,
};
