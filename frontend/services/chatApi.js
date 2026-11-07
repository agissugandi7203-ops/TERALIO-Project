import { authApi } from './authApi.js';

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4 MB

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const ALLOWED_FILE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.md',
  '.markdown',
  '.csv',
  '.tsv',
  '.json',
]);

function getExtension(filename = '') {
  const idx = String(filename).lastIndexOf('.');
  return idx >= 0 ? String(filename).slice(idx).toLowerCase() : '';
}

export function buildAuthHeaders(extraHeaders = {}) {
  const session = authApi.getStoredSession();
  const token = session?.accessToken || session?.access_token || null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

function createApiError(status, code, message) {
  const err = new Error(message || 'Permintaan ke layanan AI gagal diproses.');
  err.status = status || 500;
  err.code = code || 'API_ERROR';
  return err;
}

export function parseSseBlock(rawBlock) {
  const trimmed = rawBlock.trim();
  if (!trimmed) return null;

  let event = 'message';
  const dataLines = [];

  for (const line of trimmed.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = line.slice(6).trim() || 'message';
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  const rawData = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(rawData) };
  } catch {
    return { event, data: rawData };
  }
}

export const chatApi = {
  /**
   * Mengambil status kesiapan integrasi backend (`/api/integrations/status`).
   */
  async getIntegrationsStatus({ signal } = {}) {
    const res = await fetch('/api/integrations/status', {
      method: 'GET',
      headers: buildAuthHeaders(),
      signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createApiError(res.status, payload?.code, payload?.message);
    }
    return payload?.data || null;
  },

  /**
   * Memvalidasi & mengunggah lampiran gambar atau dokumen ke `/api/openai/files`.
   */
  async uploadAttachment(file, { category = 'file', signal } = {}) {
    if (!file) {
      throw createApiError(400, 'EMPTY_FILE', 'Tidak ada file yang dipilih.');
    }
    if (file.size === 0) {
      throw createApiError(400, 'EMPTY_FILE', `File "${file.name}" kosong (0 byte).`);
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw createApiError(
        400,
        'FILE_TOO_LARGE',
        `Ukuran "${file.name}" melebihi batas maksimum 4 MB per lampiran.`,
      );
    }

    const ext = getExtension(file.name);
    const mime = String(file.type || '').toLowerCase();

    if (category === 'image') {
      const validImage = mime.startsWith('image/') || ALLOWED_IMAGE_EXTENSIONS.has(ext);
      if (!validImage) {
        throw createApiError(
          400,
          'UNSUPPORTED_IMAGE',
          'Format gambar tidak didukung. Pilih file PNG, JPG, WEBP, atau GIF.',
        );
      }
    } else {
      const validDoc =
        mime.startsWith('image/') ||
        mime === 'application/pdf' ||
        mime.startsWith('text/') ||
        mime === 'application/json' ||
        ALLOWED_FILE_EXTENSIONS.has(ext);
      if (!validDoc) {
        throw createApiError(
          400,
          'UNSUPPORTED_FILE',
          'Format dokumen tidak didukung. Gunakan PDF, TXT, MD, CSV, JSON, atau gambar.',
        );
      }
    }

    const res = await fetch('/api/openai/files', {
      method: 'POST',
      headers: buildAuthHeaders({
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name || 'attachment'),
        'X-File-Type': file.type || '',
      }),
      body: file,
      signal,
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      throw createApiError(
        res.status,
        payload?.code || 'UPLOAD_FAILED',
        payload?.message || 'Gagal mengunggah lampiran.',
      );
    }

    return payload.data;
  },

  /**
   * Mengirim pesan ke `/api/openai/responses/stream` dan memproses event SSE secara progresif.
   */
  async streamChatResponse(
    requestBody,
    {
      onStatus,
      onToolStart,
      onToolEnd,
      onRecommendations,
      onTextDelta,
      onCitation,
      onDone,
      onError,
      signal,
    } = {},
  ) {
    const res = await fetch('/api/openai/responses/stream', {
      method: 'POST',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }),
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => ({}));
      throw createApiError(
        res.status,
        errPayload?.code || 'CHAT_REQUEST_FAILED',
        errPayload?.message || `Permintaan gagal dengan status HTTP ${res.status}.`,
      );
    }

    let finalDonePayload = null;
    let streamError = null;

    const dispatchParsedFrame = (parsed) => {
      if (!parsed) return;
      const { event, data } = parsed;

      switch (event) {
        case 'status':
          onStatus?.(data);
          break;
        case 'tool_start':
          onToolStart?.(data);
          break;
        case 'tool_end':
          onToolEnd?.(data);
          break;
        case 'recommendations':
          onRecommendations?.(data);
          break;
        case 'text_delta':
          onTextDelta?.(data);
          break;
        case 'citation':
          onCitation?.(data);
          break;
        case 'done':
          finalDonePayload = data;
          onDone?.(data);
          break;
        case 'error': {
          const err = createApiError(
            data?.status || 502,
            data?.code || 'STREAM_ERROR',
            data?.message || 'Terjadi kendala saat memproses respons streaming AI.',
          );
          streamError = err;
          onError?.(err);
          break;
        }
        default:
          break;
      }
    };

    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            dispatchParsedFrame(parseSseBlock(frame));
          }
        }

        buffer += decoder.decode().replace(/\r\n/g, '\n');
        if (buffer.trim()) {
          for (const frame of buffer.split('\n\n')) {
            dispatchParsedFrame(parseSseBlock(frame));
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // ignore lock release errors
        }
      }
    } else {
      const fullText = (await res.text()).replace(/\r\n/g, '\n');
      for (const frame of fullText.split('\n\n')) {
        dispatchParsedFrame(parseSseBlock(frame));
      }
    }

    if (streamError) {
      throw streamError;
    }

    return finalDonePayload;
  },
};

export default chatApi;
