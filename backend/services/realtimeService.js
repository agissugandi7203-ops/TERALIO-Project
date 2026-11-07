import { OpenAIRealtimeWS } from 'openai/realtime/ws';
import { config, isOpenAiConfigured } from '../config/env.js';
import {
  DEPRECATED_REALTIME_MODELS,
  RECOMMENDED_REALTIME_MODELS,
  SUPPORTED_REALTIME_VOICES,
  buildSessionInstructions,
} from '../config/prompts.js';
import { AppError, badRequest, fromOpenAiError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';
import { getOpenAiClient } from './openaiClient.js';
import { extractVerifiedRecommendations } from './recommendationExtractor.js';
import { toolOrchestrator } from './toolOrchestrator.js';

/**
 * OpenAI Realtime API (`gpt-realtime-2.1`) & WebRTC Communication Service.
 *
 * Mengimplementasikan arsitektur WebRTC resmi OpenAI terbaru:
 *  1. **Ephemeral Client Secret (`POST /v1/realtime/client_secrets`)** — Rekomendasi utama untuk
 *     koneksi WebRTC langsung dari browser ke OpenAI (`/v1/realtime/calls`) tanpa pernah
 *     mengekspos `OPENAI_API_KEY` utama ke frontend.
 *  2. **Unified Interface SDP Exchange (`POST /v1/realtime/calls`)** — Backend menerima SDP offer
 *     dari client, menyertakan konfigurasi sesi, dan mengembalikan SDP answer + `callId`.
 *  3. **Sideband Server Controls (`wss://api.openai.com/v1/realtime?call_id=...`)** — Pada runtime
 *     server stateful, backend menempelkan WebSocket kontrol ke `callId` aktif untuk mengeksekusi
 *     function tools secara otomatis di sisi server.
 *  4. **Stateless Tool Relay (`/api/realtime/tool-call`)** — Pada arsitektur direct WebRTC / serverless,
 *     frontend meneruskan event `response.function_call_arguments.done` ke backend dan menerima
 *     paket event `conversation.item.create` (`function_call_output`) + `response.create` siap kirim.
 */
const log = createLogger('RealtimeService');

const OPENAI_REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';
const DATA_CHANNEL_LABEL = 'oai-events';

const VALID_EAGERNESS = new Set(['low', 'medium', 'high', 'auto']);
const VALID_EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh']);
const REASONING_REALTIME_PREFIX = /^gpt-realtime-2/i;

/** Peta koneksi Sideband WebSocket aktif (`callId` -> metadata & instance `OpenAIRealtimeWS`). */
const activeSidebands = new Map();

const extractCallIdFromLocation = (locationHeader) => {
  if (!locationHeader || typeof locationHeader !== 'string') return null;
  const trimmed = locationHeader.trim().replace(/\/+$/, '');
  const parts = trimmed.split('/');
  return parts[parts.length - 1] || null;
};

/**
 * Membangun objek konfigurasi sesi Realtime GA (`RealtimeSessionCreateRequest`) yang tervalidasi.
 */
export async function buildRealtimeSessionConfig({
  model = config.openai.realtimeModel,
  voice = config.openai.realtimeVoice,
  instructions,
  userContext,
  outputModality = 'audio',
  turnDetection = 'semantic_vad',
  vadEagerness = config.openai.realtimeVadEagerness,
  vadThreshold,
  vadSilenceDurationMs,
  vadPrefixPaddingMs,
  noiseReduction = 'near_field',
  transcriptionModel = config.openai.realtimeTranscriptionModel,
  transcriptionLanguage = config.openai.realtimeTranscriptionLanguage,
  reasoningEffort = config.openai.realtimeReasoningEffort,
  speed = 1.0,
  maxOutputTokens = config.openai.realtimeMaxOutputTokens,
  enableTools = true,
  parallelToolCalls = true,
} = {}) {
  if (DEPRECATED_REALTIME_MODELS.has(model)) {
    throw badRequest(
      `Model Realtime '${model}' sudah deprecated. Gunakan model aktif yang direkomendasikan: ${RECOMMENDED_REALTIME_MODELS.join(' atau ')}.`,
    );
  }

  if (!SUPPORTED_REALTIME_VOICES.includes(voice)) {
    throw badRequest(
      `Voice '${voice}' tidak valid. Pilihan yang didukung: ${SUPPORTED_REALTIME_VOICES.join(', ')}.`,
    );
  }

  // Spesifikasi GA Realtime API: output_modalities hanya boleh ['audio'] (audio + transkrip) ATAU ['text'], tidak keduanya sekaligus.
  const modality = outputModality === 'text' ? 'text' : 'audio';

  let resolvedTurnDetection = null;
  if (turnDetection === 'semantic_vad') {
    resolvedTurnDetection = {
      type: 'semantic_vad',
      eagerness: VALID_EAGERNESS.has(vadEagerness) ? vadEagerness : 'auto',
      create_response: true,
      interrupt_response: true,
    };
  } else if (turnDetection === 'server_vad') {
    const threshold =
      typeof vadThreshold === 'number' && vadThreshold >= 0.0 && vadThreshold <= 1.0
        ? vadThreshold
        : config.openai.realtimeVadThreshold;
    const prefixPaddingMs =
      typeof vadPrefixPaddingMs === 'number' && vadPrefixPaddingMs >= 100 && vadPrefixPaddingMs <= 2000
        ? vadPrefixPaddingMs
        : config.openai.realtimeVadPrefixPaddingMs;
    const silenceDurationMs =
      typeof vadSilenceDurationMs === 'number' && vadSilenceDurationMs >= 200 && vadSilenceDurationMs <= 5000
        ? vadSilenceDurationMs
        : config.openai.realtimeVadSilenceDurationMs;

    resolvedTurnDetection = {
      type: 'server_vad',
      threshold,
      prefix_padding_ms: prefixPaddingMs,
      silence_duration_ms: silenceDurationMs,
      create_response: true,
      interrupt_response: true,
    };
  } else if (turnDetection === null || turnDetection === 'none') {
    resolvedTurnDetection = null;
  } else {
    throw badRequest('turnDetection harus bernilai "semantic_vad", "server_vad", atau "none"');
  }

  const tools = enableTools ? await toolOrchestrator.getRealtimeTools({ enableExternalMcp: true }) : [];

  const session = {
    type: 'realtime',
    model,
    output_modalities: [modality],
    instructions: buildSessionInstructions({
      mode: 'realtime',
      customInstructions: instructions,
      userContext,
    }),
    max_output_tokens: maxOutputTokens,
    audio: {
      input: {
        ...(noiseReduction === 'near_field' || noiseReduction === 'far_field'
          ? { noise_reduction: { type: noiseReduction } }
          : {}),
        ...(transcriptionModel
          ? {
              transcription: {
                model: transcriptionModel,
                ...(transcriptionLanguage ? { language: transcriptionLanguage } : {}),
              },
            }
          : {}),
        turn_detection: resolvedTurnDetection,
      },
      output: {
        voice,
        ...(typeof speed === 'number' && speed >= 0.25 && speed <= 1.5 ? { speed } : {}),
      },
    },
    ...(REASONING_REALTIME_PREFIX.test(model)
      ? {
          reasoning: {
            effort: VALID_EFFORTS.has(reasoningEffort) ? reasoningEffort : 'low',
          },
          parallel_tool_calls: Boolean(parallelToolCalls),
        }
      : {}),
    ...(tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
  };

  return session;
}

export const realtimeService = {
  /** Ringkasan status kesiapan & arsitektur Realtime Voice + WebRTC. */
  getStatus() {
    return {
      service: 'OpenAI Realtime Voice & WebRTC',
      configured: isOpenAiConfigured(),
      model: config.openai.realtimeModel,
      recommendedModels: RECOMMENDED_REALTIME_MODELS,
      voice: config.openai.realtimeVoice,
      supportedVoices: SUPPORTED_REALTIME_VOICES,
      transcriptionModel: config.openai.realtimeTranscriptionModel,
      transcriptionLanguage: config.openai.realtimeTranscriptionLanguage,
      tokenTtlSeconds: config.openai.realtimeTokenTtlSeconds,
      activeSidebandCount: activeSidebands.size,
      webrtc: {
        recommendedFlow: 'ephemeral_client_secret',
        callsEndpoint: OPENAI_REALTIME_CALLS_URL,
        dataChannelLabel: DATA_CHANNEL_LABEL,
        unifiedServerEndpoint: '/api/realtime/calls',
        clientSecretEndpoint: '/api/realtime/client-secrets',
        toolRelayEndpoint: '/api/realtime/tool-call',
      },
    };
  },

  /** Pratinjau konfigurasi sesi Realtime tanpa memanggil API eksternal (aman untuk inspeksi/validasi). */
  async previewSessionConfig(options = {}) {
    return buildRealtimeSessionConfig(options);
  },

  /**
   * Menerbitkan ephemeral client credential (`ek_...`) via `POST /v1/realtime/client_secrets`.
   * Digunakan oleh frontend untuk membuka koneksi WebRTC langsung ke OpenAI dengan aman.
   */
  async createClientSecret({ ttlSeconds = config.openai.realtimeTokenTtlSeconds, ...sessionOptions } = {}) {
    const ttl = Number(ttlSeconds);
    if (!Number.isInteger(ttl) || ttl < 10 || ttl > 7200) {
      throw badRequest('ttlSeconds harus berupa bilangan bulat antara 10 hingga 7200 detik');
    }

    const client = getOpenAiClient({ requireConfigured: true });
    const session = await buildRealtimeSessionConfig(sessionOptions);

    try {
      const secret = await client.realtime.clientSecrets.create({
        expires_after: {
          anchor: 'created_at',
          seconds: ttl,
        },
        session,
      });

      return {
        clientSecret: {
          value: secret.value,
          expiresAt: secret.expires_at,
          ttlSeconds: ttl,
        },
        session: secret.session,
        webrtc: {
          callsUrl: OPENAI_REALTIME_CALLS_URL,
          method: 'POST',
          offerContentType: 'application/sdp',
          dataChannelLabel: DATA_CHANNEL_LABEL,
          toolRelayEndpoint: '/api/realtime/tool-call',
        },
      };
    } catch (err) {
      const mapped = fromOpenAiError(err);
      log.warn('Gagal membuat ephemeral client secret Realtime', {
        code: mapped.code,
        status: mapped.status,
      });
      throw mapped;
    }
  },

  /**
   * Unified WebRTC Interface (`POST /v1/realtime/calls`):
   * Menukar SDP offer dari browser dengan SDP answer dari OpenAI menggunakan API key server,
   * serta opsional menempelkan koneksi Sideband WebSocket untuk eksekusi tool otomatis di server.
   */
  async createWebRtcCall({ sdp, attachSideband = false, ...sessionOptions } = {}) {
    if (!sdp || typeof sdp !== 'string' || !sdp.includes('v=0')) {
      throw badRequest('SDP offer WebRTC tidak valid (wajib memuat deskripsi sesi "v=0")');
    }

    const client = getOpenAiClient({ requireConfigured: true });
    const session = await buildRealtimeSessionConfig(sessionOptions);

    try {
      const response = await client.realtime.calls.create({ sdp, session });
      const sdpAnswer = await response.text();
      const callId = extractCallIdFromLocation(response.headers?.get?.('location'));

      let sideband = { attached: false };
      if (attachSideband && callId && !process.env.VERCEL) {
        sideband = await this.attachSidebandControl(callId);
      }

      return {
        callId,
        sdpAnswer,
        model: session.model,
        voice: session.audio?.output?.voice ?? config.openai.realtimeVoice,
        dataChannelLabel: DATA_CHANNEL_LABEL,
        sideband,
      };
    } catch (err) {
      const mapped = fromOpenAiError(err);
      log.warn('Gagal menginisialisasi panggilan WebRTC Realtime', {
        code: mapped.code,
        status: mapped.status,
      });
      throw mapped;
    }
  },

  /**
   * Menempelkan Sideband Server Control WebSocket (`wss://api.openai.com/v1/realtime?call_id=...`)
   * ke panggilan WebRTC yang sedang berlangsung agar eksekusi function tools berjalan murni di backend.
   */
  async attachSidebandControl(callId) {
    if (!callId || !/^[A-Za-z0-9_-]+$/.test(callId)) {
      throw badRequest('callId tidak valid untuk koneksi sideband');
    }

    if (activeSidebands.has(callId)) {
      const existing = activeSidebands.get(callId);
      return { attached: true, callId, connectedAt: existing.connectedAt, reused: true };
    }

    const client = getOpenAiClient({ requireConfigured: true });

    try {
      const rt = await OpenAIRealtimeWS.create(client, { callID: callId });
      const entry = {
        callId,
        connectedAt: new Date().toISOString(),
        toolCallsHandled: 0,
        rt,
      };

      rt.on('error', (err) => {
        log.warn(`Sideband error pada call '${callId}'`, { message: err.message });
      });

      rt.on('reconnecting', () => {
        log.info(`Sideband mencoba menyambung ulang untuk call '${callId}'`);
      });

      rt.on('close', () => {
        activeSidebands.delete(callId);
        log.info(`Sideband ditutup untuk call '${callId}'`);
      });

      // Otomatis tangkap pemanggilan function tool dari model suara & kirim hasilnya kembali
      rt.on('response.function_call_arguments.done', async (event) => {
        try {
          const exec = await toolOrchestrator.executeToolCall(event.name, event.arguments, {
            throwOnError: false,
          });
          entry.toolCallsHandled += 1;

          rt.send({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: event.call_id,
              output: exec.serializedOutput,
            },
          });
          rt.send({ type: 'response.create' });
        } catch (err) {
          log.error(`Gagal memproses tool '${event.name}' pada sideband`, { message: err.message });
        }
      });

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          rt.close();
          reject(new AppError(504, 'REALTIME_SIDEBAND_TIMEOUT', 'Timeout membuka koneksi sideband Realtime'));
        }, 10_000);

        rt.socket.once('open', () => {
          clearTimeout(timer);
          resolve();
        });
        rt.socket.once('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      activeSidebands.set(callId, entry);
      return { attached: true, callId, connectedAt: entry.connectedAt, reused: false };
    } catch (err) {
      throw fromOpenAiError(err);
    }
  },

  /** Menutup koneksi Sideband untuk suatu `callId`. */
  detachSidebandControl(callId) {
    const entry = activeSidebands.get(callId);
    if (!entry) return { detached: false, callId };
    try {
      entry.rt.close();
    } catch {
      // Abaikan bila socket sudah tertutup
    }
    activeSidebands.delete(callId);
    return { detached: true, callId };
  },

  /** Daftar koneksi Sideband aktif (tanpa mengekspos objek socket internal). */
  listActiveSidebands() {
    return Array.from(activeSidebands.values()).map(({ callId, connectedAt, toolCallsHandled }) => ({
      callId,
      connectedAt,
      toolCallsHandled,
    }));
  },

  /** Mengakhiri panggilan Realtime aktif di sisi OpenAI dan membersihkan sideband lokal. */
  async hangupCall(callId) {
    if (!callId || !/^[A-Za-z0-9_-]+$/.test(callId)) {
      throw badRequest('callId tidak valid');
    }
    this.detachSidebandControl(callId);
    const client = getOpenAiClient({ requireConfigured: true });
    try {
      if (typeof client?.realtime?.calls?.hangup === 'function') {
        await client.realtime.calls.hangup(callId);
      }
      return { callId, hungUp: true };
    } catch (err) {
      // Jika panggilan sudah selesai di sisi WebRTC atau OpenAI merespons 404, anggap hangup berhasil (idempotent)
      if (err?.status === 404 || err?.statusCode === 404 || String(err?.message || '').includes('404')) {
        return { callId, hungUp: true, alreadyClosed: true };
      }
      throw fromOpenAiError(err);
    }
  },

  /**
   * Relay eksekusi tool stateless untuk client WebRTC (browser menerima `response.function_call_arguments.done`
   * di data channel `oai-events`, memanggil endpoint ini, lalu mengirim `clientEvents` kembali ke data channel).
   */
  async executeToolCallForClient({ callId, name, arguments: rawArgs, autoCreateResponse = true } = {}) {
    if (!callId || typeof callId !== 'string' || !callId.trim()) {
      throw badRequest('Field "callId" (call_id dari event function_call) wajib diisi');
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw badRequest('Field "name" (nama tool) wajib diisi');
    }

    let parsedArgs = {};
    if (rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs)) {
      parsedArgs = rawArgs;
    } else if (typeof rawArgs === 'string') {
      try {
        parsedArgs = JSON.parse(rawArgs);
      } catch {
        parsedArgs = {};
      }
    }

    const execution = await toolOrchestrator.executeToolCall(name.trim(), rawArgs, {
      throwOnError: false,
    });

    const recommendations = extractVerifiedRecommendations([
      {
        name: name.trim(),
        args: parsedArgs,
        ok: execution.ok,
        data: execution.data ?? null,
      },
    ]);

    const clientEvents = [
      {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId.trim(),
          output: execution.serializedOutput,
        },
      },
      ...(autoCreateResponse ? [{ type: 'response.create' }] : []),
    ];

    return {
      callId: callId.trim(),
      tool: name.trim(),
      ok: execution.ok,
      durationMs: execution.durationMs,
      result: execution.ok ? execution.data : null,
      uiAction: execution.ok ? execution.data?.uiAction ?? null : null,
      error: execution.ok ? null : execution.error,
      recommendations,
      clientEvents,
    };
  },
};

export default realtimeService;
