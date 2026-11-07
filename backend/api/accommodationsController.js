import { z } from 'zod';
import { accommodationsService } from '../services/accommodationsService.js';
import { osmGeoService } from '../services/osmGeoService.js';
import { badRequest, notFound } from '../utils/errors.js';
import { redact } from '../utils/logger.js';

export const smartKosSearchStreamSchema = z.object({
  message: z.string().min(1, 'Prompt pencarian kos wajib diisi').max(4_000),
  campusId: z.string().max(40).optional(),
  reasoningEffort: z.enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh']).optional(),
  stepDelayMs: z.number().int().min(0).max(1500).optional(),
});

export const smartKosRouteSchema = z.object({
  origin: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  destination: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  mode: z.enum(['foot', 'driving', 'bike']).optional(),
});

export const accommodationsController = {
  // GET /api/accommodations
  async listAccommodations(req, res, next) {
    try {
      const { campusId, city, type, maxPrice, query, limit } = req.query || {};
      const parsedMaxPrice = maxPrice ? Number.parseInt(String(maxPrice), 10) : undefined;
      const parsedLimit = limit ? Number.parseInt(String(limit), 10) : 20;

      if (!campusId && !city && !type && !parsedMaxPrice && !query) {
        const catalog = await accommodationsService.loadCatalog();
        return res.status(200).json({
          success: true,
          source: catalog.source,
          supabaseConfigured: catalog.supabaseConfigured,
          tableReady: catalog.tableReady,
          campusHubs: catalog.campusHubs,
          count: catalog.items.length,
          data: catalog.items,
        });
      }

      const result = await accommodationsService.search({
        campusId: campusId ? String(campusId) : undefined,
        city: city ? String(city) : undefined,
        type: type ? String(type) : undefined,
        maxPrice: Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : undefined,
        query: query ? String(query) : undefined,
        limit: Number.isFinite(parsedLimit) ? parsedLimit : 20,
      });

      return res.status(200).json({
        success: true,
        source: result.source,
        supabaseConfigured: result.supabaseConfigured,
        tableReady: result.tableReady,
        campusId: result.campusId,
        campus: result.campus,
        primaryMatch: result.primaryMatch,
        count: result.items.length,
        data: result.items,
      });
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/accommodations/:id
  async getAccommodationById(req, res, next) {
    try {
      const item = await accommodationsService.getById(req.params.id);
      if (!item) {
        return next(notFound(`Data kos '${req.params.id}' tidak ditemukan`));
      }
      return res.status(200).json({
        success: true,
        data: item,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/accommodations/route
  async computeRoute(req, res, next) {
    try {
      const parsed = smartKosRouteSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(badRequest('Koordinat origin & destination wajib valid', parsed.error.issues));
      }
      const route = await osmGeoService.computeCampusRoute(
        parsed.data.origin,
        parsed.data.destination,
        { mode: parsed.data.mode || 'foot' },
      );
      return res.status(200).json({
        success: true,
        data: route,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/accommodations/ai-search/stream
  async streamAiSearch(req, res, next) {
    const parsed = smartKosSearchStreamSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return next(badRequest('Parameter pencarian AI Smart Kos tidak valid', parsed.error.issues));
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
      await accommodationsService.streamSmartKosSearch(parsed.data, {
        onEvent: writeSse,
        signal: abortController.signal,
      });
    } catch (err) {
      if (!abortController.signal.aborted && !res.writableEnded) {
        writeSse('error', {
          status: Number(err?.status) || 500,
          code: err?.code || 'SMART_KOS_STREAM_ERROR',
          message: redact(err?.message || 'Gagal menjalankan pencarian Smart Kos AI'),
        });
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
    return undefined;
  },

  // POST /api/accommodations/seed
  async seedSupabase(req, res, next) {
    try {
      const result = await accommodationsService.seedToSupabase();
      return res.status(200).json({
        success: true,
        message: `Berhasil menyinkronkan ${result.insertedOrUpdated} data kos ke tabel public.accommodations di Supabase`,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },
};

export default accommodationsController;
