import { z } from 'zod';
import { isOpenAiConfigured, hasOpenAiTestOverride, openaiService } from '../services/openaiService.js';
import { webSearchService } from '../services/webSearchService.js';
import { badRequest, notConfigured } from '../utils/errors.js';
import { redact } from '../utils/logger.js';

const userLocationSchema = z
  .object({
    country: z.string().length(2).optional(),
    city: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
    timezone: z.string().max(80).optional(),
  })
  .optional();

export const attachmentItemSchema = z.object({
  id: z.string().max(200).optional(),
  fileId: z.string().max(200).nullable().optional(),
  mode: z.enum(['openai_file', 'inline_data', 'extracted_text']).optional(),
  kind: z.enum(['image', 'file', 'text_file']),
  filename: z.string().max(200).optional(),
  mimeType: z.string().max(120).optional(),
  size: z.number().int().min(0).max(10 * 1024 * 1024).optional(),
  dataUrl: z.string().max(6_000_000).optional(),
  extractedText: z.string().max(200_000).optional(),
  detail: z.enum(['low', 'high', 'auto', 'original']).optional(),
});

export const responsesBodySchema = z
  .object({
    input: z
      .union([z.string().max(20_000), z.array(z.record(z.string(), z.unknown())).min(1)])
      .optional(),
    message: z.string().max(20_000).optional(),
    prompt: z.string().max(20_000).optional(),
    attachments: z.array(attachmentItemSchema).max(6).optional(),
    instructions: z.string().max(4_000).optional(),
    userContext: z.record(z.string(), z.unknown()).optional(),
    model: z.string().min(2).max(80).optional(),
    previousResponseId: z.string().max(120).optional(),
    store: z.boolean().optional(),
    reasoningEffort: z.enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh']).optional(),
    maxOutputTokens: z.number().int().min(16).max(16_384).optional(),
    enableTools: z.boolean().optional(),
    enableWebSearch: z.boolean().optional(),
    userLocation: userLocationSchema,
    allowedDomains: z.array(z.string().max(200)).max(100).optional(),
  })
  .refine(
    (val) => {
      const hasText =
        (typeof val.input === 'string' && val.input.trim().length > 0) ||
        (Array.isArray(val.input) && val.input.length > 0) ||
        (typeof val.message === 'string' && val.message.trim().length > 0) ||
        (typeof val.prompt === 'string' && val.prompt.trim().length > 0);
      const hasAttachments = Array.isArray(val.attachments) && val.attachments.length > 0;
      return hasText || hasAttachments;
    },
    {
      message: 'Pesan teks atau minimal satu lampiran (attachment) wajib diisi',
    },
  );

export const webSearchBodySchema = z.object({
  query: z.string().min(2).max(1_000),
  model: z.string().min(2).max(80).optional(),
  instructions: z.string().max(2_000).optional(),
  searchContextSize: z.enum(['low', 'medium', 'high']).optional(),
  userLocation: userLocationSchema,
  allowedDomains: z.array(z.string().max(200)).max(100).optional(),
  externalWebAccess: z.boolean().optional(),
  forceSearch: z.boolean().optional(),
});

const decodeFilenameHeader = (raw) => {
  if (!raw || typeof raw !== 'string') return 'attachment';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export const openaiController = {
  // GET /api/openai/status
  getStatus(req, res) {
    return res.status(200).json({
      success: true,
      data: openaiService.getStatus(),
    });
  },

  // POST /api/openai/chat (kompatibilitas UI lama + Responses API)
  async chat(req, res, next) {
    try {
      const result = await openaiService.chat(req.body ?? {});
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/openai/responses (Responses API penuh + multi-turn + tool orchestration)
  async createResponse(req, res, next) {
    try {
      const result = await openaiService.respond(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/openai/responses/stream (SSE Streaming Responses API + tool orchestration + recommendations)
  async streamResponse(req, res, next) {
    if (!isOpenAiConfigured() && !hasOpenAiTestOverride()) {
      return next(
        notConfigured(
          'OPENAI',
          'OPENAI_API_KEY belum dikonfigurasi dengan kunci aktif di backend/.env. Isi OPENAI_API_KEY untuk memulai percakapan AI TERALIO.',
        ),
      );
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const writeSse = (eventName, payload) => {
      if (res.writableEnded || abortController.signal.aborted) return;
      res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      await openaiService.streamRespond(req.body, {
        onEvent: writeSse,
        signal: abortController.signal,
      });
    } catch (err) {
      if (!abortController.signal.aborted && !res.writableEnded) {
        const status = Number(err?.status) || 502;
        const code = err?.code || 'STREAM_ERROR';
        const message = redact(err?.message || 'Terjadi kesalahan saat menerima streaming respons AI');
        writeSse('error', { status, code, message });
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
    return undefined;
  },

  // POST /api/openai/files (Upload lampiran gambar / dokumen via raw binary atau JSON base64)
  async uploadFile(req, res, next) {
    try {
      let buffer = null;
      let filename = 'attachment';
      let mimeType = '';

      if (Buffer.isBuffer(req.body)) {
        buffer = req.body;
        filename = decodeFilenameHeader(req.headers['x-file-name']);
        mimeType = String(req.headers['x-file-type'] || req.headers['content-type'] || '');
      } else if (req.body && typeof req.body === 'object' && typeof req.body.data === 'string') {
        filename = String(req.body.filename || 'attachment');
        mimeType = String(req.body.mimeType || '');
        const rawBase64 = req.body.data.includes(',') ? req.body.data.split(',')[1] : req.body.data;
        buffer = Buffer.from(rawBase64, 'base64');
      } else {
        throw badRequest('Payload file tidak valid. Kirim biner langsung atau objek JSON { filename, mimeType, data }.');
      }

      const attachment = await openaiService.prepareAttachment({
        buffer,
        filename,
        mimeType,
      });

      return res.status(201).json({
        success: true,
        data: attachment,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/openai/web-search (Grounded Web Search dengan sitasi & sumber URL terstruktur)
  async webSearch(req, res, next) {
    try {
      const result = await webSearchService.search(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },
};

export default openaiController;
