import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Konfigurasi environment terpusat untuk backend TERALIO.
 *
 * Seluruh credential & parameter integrasi dibaca HANYA dari environment variables
 * (file `backend/.env` saat lokal, Environment Variables dashboard saat di Vercel).
 * Modul lain wajib membaca konfigurasi melalui `config` ini, bukan langsung dari `process.env`.
 */
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const str = (name, fallback = '') => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
};

const int = (name, fallback) => {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const float = (name, fallback) => {
  const parsed = Number.parseFloat(process.env[name] ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (name, fallback = false) => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const list = (name, fallback = []) => {
  const value = str(name);
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

/** Nilai placeholder dari `.env.example` dianggap belum dikonfigurasi. */
const isPlaceholder = (value) =>
  !value || /placeholder|your[-_]|xxxx|<.*>|here$/i.test(value);

const parseJsonArray = (name) => {
  const raw = str(name);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Jangan log isi variabel (bisa memuat token); cukup nama variabelnya.
    console.warn(`[config] ${name} bukan JSON array yang valid, diabaikan.`);
    return [];
  }
};

const nodeEnv = str('NODE_ENV', 'development');

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test' || Boolean(process.env.VITEST),
  port: int('PORT', 5000),

  http: {
    corsOrigins: list('CORS_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000']),
    trustProxy: bool('TRUST_PROXY', Boolean(process.env.VERCEL)),
    jsonLimit: str('HTTP_JSON_LIMIT', '100kb'),
    uploadLimit: str('HTTP_UPLOAD_LIMIT', '4mb'),
  },

  security: {
    /** Bila true, endpoint AI/Realtime/Maps/MCP-relay mewajibkan Bearer token sesi Supabase. */
    aiRequireAuth: bool('AI_REQUIRE_AUTH', false),
    rateLimitWindowMs: int('RATE_LIMIT_WINDOW_MS', 60_000),
    rateLimitMax: int('RATE_LIMIT_MAX', 30),
    realtimeSessionLimitMax: int('REALTIME_SESSION_RATE_LIMIT_MAX', 10),
  },

  openai: {
    apiKey: str('OPENAI_API_KEY'),
    organization: str('OPENAI_ORG_ID') || undefined,
    project: str('OPENAI_PROJECT_ID') || undefined,
    timeoutMs: int('OPENAI_TIMEOUT_MS', 30_000),
    maxRetries: int('OPENAI_MAX_RETRIES', 2),

    // Responses API (teks + orkestrasi tools). OPENAI_MODEL dipertahankan untuk kompatibilitas lama.
    textModel: str('OPENAI_TEXT_MODEL', str('OPENAI_MODEL', 'gpt-6-astra')),
    textReasoningEffort: str('OPENAI_TEXT_REASONING_EFFORT', 'low'),
    agentMaxToolRounds: int('OPENAI_AGENT_MAX_TOOL_ROUNDS', 5),

    // Web Search (Responses API hosted tool)
    webSearchModel: str('OPENAI_WEB_SEARCH_MODEL', str('OPENAI_TEXT_MODEL', str('OPENAI_MODEL', 'gpt-6-astra'))),
    webSearchContextSize: str('OPENAI_WEB_SEARCH_CONTEXT_SIZE', 'medium'),
    webSearchCountry: str('OPENAI_WEB_SEARCH_COUNTRY', 'ID'),
    webSearchCity: str('OPENAI_WEB_SEARCH_CITY'),
    webSearchTimezone: str('OPENAI_WEB_SEARCH_TIMEZONE', 'Asia/Jakarta'),
    webSearchAllowedDomains: list('OPENAI_WEB_SEARCH_ALLOWED_DOMAINS'),

    // Realtime API (voice, WebRTC)
    realtimeModel: str('OPENAI_REALTIME_MODEL', 'gpt-realtime-2.1'),
    realtimeVoice: str('OPENAI_REALTIME_VOICE', 'marin'),
    realtimeReasoningEffort: str('OPENAI_REALTIME_REASONING_EFFORT', 'low'),
    realtimeTranscriptionModel: str('OPENAI_REALTIME_TRANSCRIPTION_MODEL', 'gpt-transcribe'),
    realtimeTranscriptionLanguage: str('OPENAI_REALTIME_TRANSCRIPTION_LANGUAGE', 'id'),
    realtimeVadEagerness: str('OPENAI_REALTIME_VAD_EAGERNESS', 'auto'),
    realtimeVadThreshold: float('OPENAI_REALTIME_VAD_THRESHOLD', 0.55),
    realtimeVadSilenceDurationMs: int('OPENAI_REALTIME_VAD_SILENCE_DURATION_MS', 1000),
    realtimeVadPrefixPaddingMs: int('OPENAI_REALTIME_VAD_PREFIX_PADDING_MS', 400),
    realtimeTokenTtlSeconds: int('OPENAI_REALTIME_TOKEN_TTL_SECONDS', 600),
    realtimeMaxOutputTokens: int('OPENAI_REALTIME_MAX_OUTPUT_TOKENS', 0) || 'inf',
  },

  mcp: {
    serverEnabled: bool('MCP_SERVER_ENABLED', true),
    /** Bearer token yang wajib dikirim client MCP ke `/api/mcp`. Wajib di production. */
    serverAuthToken: str('MCP_SERVER_AUTH_TOKEN'),
    /** Remote MCP server pihak ketiga yang di-attach ke Responses API sebagai hosted `mcp` tool. */
    externalServers: parseJsonArray('MCP_EXTERNAL_SERVERS'),
    toolTimeoutMs: int('TOOL_TIMEOUT_MS', 20_000),
  },

  googleMaps: {
    serverApiKey: str('GOOGLE_MAPS_SERVER_API_KEY'),
    languageCode: str('GOOGLE_MAPS_LANGUAGE_CODE', 'id'),
    regionCode: str('GOOGLE_MAPS_REGION_CODE', 'ID'),
    timeoutMs: int('GOOGLE_MAPS_TIMEOUT_MS', 10_000),
    maxRetries: int('GOOGLE_MAPS_MAX_RETRIES', 2),
    /** basic (Pro SKU) | contact (Enterprise SKU) | full (Enterprise + Atmosphere SKU). */
    detailsLevel: str('GOOGLE_MAPS_DETAILS_LEVEL', 'contact'),
  },
};

export const isOpenAiConfigured = () =>
  Boolean(config.openai.apiKey) && !isPlaceholder(config.openai.apiKey) && config.openai.apiKey.startsWith('sk-');

export const isGoogleMapsConfigured = () =>
  Boolean(config.googleMaps.serverApiKey) && !isPlaceholder(config.googleMaps.serverApiKey);

export default config;
