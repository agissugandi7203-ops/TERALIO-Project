import { z } from 'zod';
import { realtimeService } from '../services/realtimeService.js';

export const realtimeSessionOptionsSchema = z.object({
  model: z.string().min(3).max(80).optional(),
  voice: z.string().min(2).max(40).optional(),
  instructions: z.string().max(4_000).optional(),
  userContext: z.record(z.string(), z.unknown()).optional(),
  outputModality: z.enum(['audio', 'text']).optional(),
  turnDetection: z.enum(['semantic_vad', 'server_vad', 'none']).optional(),
  vadEagerness: z.enum(['low', 'medium', 'high', 'auto']).optional(),
  vadThreshold: z.number().min(0.0).max(1.0).optional(),
  vadSilenceDurationMs: z.number().int().min(200).max(5000).optional(),
  vadPrefixPaddingMs: z.number().int().min(100).max(2000).optional(),
  noiseReduction: z.enum(['near_field', 'far_field', 'none']).optional(),
  transcriptionModel: z.string().max(80).optional(),
  transcriptionLanguage: z.string().min(2).max(10).optional(),
  reasoningEffort: z.enum(['minimal', 'low', 'medium', 'high', 'xhigh']).optional(),
  speed: z.number().min(0.25).max(1.5).optional(),
  maxOutputTokens: z.union([z.number().int().min(1).max(4096), z.literal('inf')]).optional(),
  enableTools: z.boolean().optional(),
  parallelToolCalls: z.boolean().optional(),
  ttlSeconds: z.number().int().min(10).max(7200).optional(),
});

export const realtimeToolRelaySchema = z.object({
  callId: z.string().min(1).max(150),
  name: z.string().min(1).max(150),
  arguments: z.union([z.string().max(20_000), z.record(z.string(), z.unknown())]).optional(),
  autoCreateResponse: z.boolean().optional(),
});

export const sidebandAttachSchema = z.object({
  callId: z.string().min(3).max(150),
});

export const realtimeController = {
  // GET /api/realtime/status
  getStatus(req, res) {
    return res.status(200).json({
      success: true,
      data: realtimeService.getStatus(),
    });
  },

  // POST /api/realtime/config (validasi & pratinjau konfigurasi sesi tanpa memanggil API eksternal)
  async previewConfig(req, res, next) {
    try {
      const session = await realtimeService.previewSessionConfig(req.body);
      return res.status(200).json({
        success: true,
        data: { session },
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/realtime/client-secrets (menerbitkan ephemeral token untuk WebRTC langsung dari browser)
  async createClientSecret(req, res, next) {
    try {
      const result = await realtimeService.createClientSecret(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/realtime/calls (Unified WebRTC SDP Exchange: mendukung raw application/sdp maupun JSON)
  async createCall(req, res, next) {
    try {
      const isRawSdp = typeof req.body === 'string';
      const payload = isRawSdp
        ? {
            sdp: req.body,
            voice: req.query.voice,
            model: req.query.model,
            attachSideband: req.query.sideband === 'true',
          }
        : {
            ...req.body,
            sdp: req.body?.sdp,
          };

      const result = await realtimeService.createWebRtcCall(payload);

      if (result.callId) {
        res.setHeader('X-Realtime-Call-Id', result.callId);
      }

      const wantsRawSdp =
        isRawSdp || String(req.headers.accept || '').toLowerCase().includes('application/sdp');

      if (wantsRawSdp) {
        res.setHeader('Content-Type', 'application/sdp');
        return res.status(201).send(result.sdpAnswer);
      }

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/realtime/calls/:callId/hangup
  async hangupCall(req, res, next) {
    try {
      const result = await realtimeService.hangupCall(req.params.callId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      if (err?.status === 404 || err?.statusCode === 404) {
        return res.status(200).json({
          success: true,
          data: { callId: req.params.callId, hungUp: true, alreadyClosed: true },
        });
      }
      return next(err);
    }
  },

  // POST /api/realtime/tool-call (stateless relay untuk eksekusi tool dari WebRTC DataChannel)
  async executeToolCall(req, res, next) {
    try {
      const result = await realtimeService.executeToolCallForClient(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/realtime/sideband
  listSidebands(req, res) {
    return res.status(200).json({
      success: true,
      data: {
        active: realtimeService.listActiveSidebands(),
      },
    });
  },

  // POST /api/realtime/sideband
  async attachSideband(req, res, next) {
    try {
      const result = await realtimeService.attachSidebandControl(req.body.callId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // DELETE /api/realtime/sideband/:callId
  detachSideband(req, res) {
    const result = realtimeService.detachSidebandControl(req.params.callId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  },
};

export default realtimeController;
