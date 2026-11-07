import { timeoutError, upstreamError } from './errors.js';

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch JSON dengan timeout (AbortController) dan retry exponential backoff
 * untuk error jaringan / status 429 & 5xx. Hanya dipakai untuk request baca (idempoten).
 *
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number, retries?: number, service?: string }} options
 */
export async function fetchJson(url, options = {}) {
  const { timeoutMs = 10_000, retries = 2, service = 'HTTP', ...init } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const text = await response.text();
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = { raw: text.slice(0, 500) };
      }

      if (response.ok) return { status: response.status, body };

      lastError = { status: response.status, body };
      if (!RETRYABLE_STATUS.has(response.status) || attempt === retries) break;
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
    } finally {
      clearTimeout(timer);
    }
    await sleep(Math.min(250 * 2 ** attempt, 2_000));
  }

  if (lastError?.name === 'AbortError') {
    throw timeoutError(service, `Permintaan ke ${service} melewati batas waktu ${timeoutMs}ms`);
  }
  if (lastError instanceof Error) {
    throw upstreamError(service, `Tidak dapat terhubung ke ${service}: ${lastError.message}`);
  }
  const status = lastError?.status ?? 502;
  throw upstreamError(service, `${service} mengembalikan status ${status}`, status >= 500 ? 502 : status, {
    upstreamStatus: status,
    upstream: lastError?.body?.error ?? lastError?.body ?? null,
  });
}

/** Membatasi durasi sebuah promise (dipakai untuk eksekusi tool). */
export async function withTimeout(promise, timeoutMs, onTimeout) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(onTimeout()), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
