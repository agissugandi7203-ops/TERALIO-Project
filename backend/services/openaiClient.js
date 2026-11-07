import OpenAI from 'openai';
import { config, isOpenAiConfigured } from '../config/env.js';
import { notConfigured } from '../utils/errors.js';

let cachedClient = null;
let cachedKey = null;
let overrideClient = null;

/**
 * Mengembalikan instance singleton OpenAI SDK v7 dengan timeout & retry terkonfigurasi.
 * API key utama hanya dibaca dari `config.openai.apiKey` di sisi server.
 */
export function getOpenAiClient({ requireConfigured = true } = {}) {
  if (overrideClient) return overrideClient;

  if (requireConfigured && !isOpenAiConfigured()) {
    throw notConfigured(
      'OPENAI',
      'OPENAI_API_KEY belum dikonfigurasi dengan kunci aktif di backend/.env. Isi OPENAI_API_KEY untuk menjalankan permintaan ke OpenAI.',
    );
  }

  const effectiveKey = isOpenAiConfigured()
    ? config.openai.apiKey
    : 'sk-unconfigured-development-placeholder';

  if (!cachedClient || cachedKey !== effectiveKey) {
    cachedClient = new OpenAI({
      apiKey: effectiveKey,
      organization: config.openai.organization,
      project: config.openai.project,
      timeout: config.openai.timeoutMs,
      maxRetries: config.openai.maxRetries,
    });
    cachedKey = effectiveKey;
  }

  return cachedClient;
}

/** Digunakan khusus pada pengujian terisolasi untuk menyuntikkan stub client. */
export function _setOpenAiClientForTesting(client) {
  overrideClient = client;
}

export function hasOpenAiTestOverride() {
  return Boolean(overrideClient);
}

export default getOpenAiClient;
