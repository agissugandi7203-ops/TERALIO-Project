/**
 * Error terstandarisasi untuk seluruh backend.
 * Dibaca oleh centralized error handler di `app.js` (status, code, message, details).
 */
export class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details = null) => new AppError(400, 'BAD_REQUEST', message, details);
export const notFound = (message) => new AppError(404, 'NOT_FOUND', message);
export const notConfigured = (service, message) =>
  new AppError(503, `${service}_NOT_CONFIGURED`, message);
export const upstreamError = (service, message, status = 502, details = null) =>
  new AppError(status, `${service}_UPSTREAM_ERROR`, message, details);
export const timeoutError = (service, message) => new AppError(504, `${service}_TIMEOUT`, message);

/**
 * Normalisasi error OpenAI SDK menjadi AppError tanpa membocorkan header/credential.
 */
export const fromOpenAiError = (err) => {
  if (err instanceof AppError) return err;
  const name = err?.constructor?.name || err?.name || '';
  if (name === 'APIConnectionTimeoutError') {
    return timeoutError('OPENAI', 'Permintaan ke OpenAI melewati batas waktu');
  }
  if (name === 'APIConnectionError') {
    return upstreamError('OPENAI', 'Tidak dapat terhubung ke OpenAI', 502);
  }
  const upstreamStatus = Number(err?.status) || 502;
  // 401/403 dari OpenAI = masalah credential server, bukan kesalahan client.
  const status = [401, 403].includes(upstreamStatus) ? 502 : upstreamStatus >= 500 ? 502 : upstreamStatus;
  return upstreamError('OPENAI', `OpenAI menolak permintaan: ${err?.message || 'unknown error'}`, status, {
    upstreamStatus,
    requestId: err?.requestID || err?.request_id || null,
    type: err?.error?.type || err?.type || null,
    code: err?.error?.code || err?.code || null,
  });
};
