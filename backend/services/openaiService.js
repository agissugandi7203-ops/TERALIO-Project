import crypto from 'node:crypto';
import path from 'node:path';
import { toFile } from 'openai';
import { config, isOpenAiConfigured } from '../config/env.js';
import { buildSessionInstructions } from '../config/prompts.js';
import { badRequest, fromOpenAiError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';
import { getOpenAiClient, _setOpenAiClientForTesting, hasOpenAiTestOverride } from './openaiClient.js';
import { extractVerifiedRecommendations } from './recommendationExtractor.js';
import { toolOrchestrator } from './toolOrchestrator.js';
import { extractWebSearchArtifacts } from './webSearchService.js';

/**
 * OpenAI Responses API, SSE Streaming, File/Image Attachment, & Multi-Tool Agent Orchestration Service.
 *
 * Menggunakan primitif resmi terbaru **Responses API** (`POST /v1/responses`) pada model `gpt-6-astra`,
 * lengkap dengan:
 *  - Stateful multi-turn context (`previous_response_id` & `store`)
 *  - Agentic loop eksekusi function tools & external MCP tools terpusat (sinkron & SSE streaming)
 *  - Native `web_search` beserta ekstraksi sitasi URL terstruktur
 *  - Ekstraksi entitas rekomendasi kos/tempat terverifikasi (`recommendationExtractor`)
 *  - Upload & normalisasi lampiran gambar (`input_image`) dan dokumen (`input_file` / teks)
 */
const log = createLogger('OpenAiService');

const REASONING_MODEL_PREFIX = /^(gpt-5|gpt-6|o1|o3|o4)/i;
const VALID_REASONING_EFFORTS = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh']);

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4 MB (selaras batas aman Vercel Serverless 4.5 MB)
const MAX_TEXT_ATTACHMENT_CHARS = 120_000;

const IMAGE_MIME_SET = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const TEXT_MIME_SET = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/tab-separated-values',
]);
const TEXT_EXT_SET = new Set(['.txt', '.md', '.markdown', '.csv', '.tsv', '.json']);
const IMAGE_EXT_MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const buildReasoningParam = (model, effort) => {
  if (!REASONING_MODEL_PREFIX.test(String(model || ''))) return undefined;
  const resolved = VALID_REASONING_EFFORTS.has(effort) ? effort : config.openai.textReasoningEffort;
  return resolved ? { effort: resolved } : undefined;
};

const safeParseJsonObject = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const describeToolActivity = (toolName) => {
  switch (toolName) {
    case 'teralio_search_accommodations':
    case 'teralio_get_accommodation_details':
      return 'Mencari data hunian & kos di TERALIO...';
    case 'maps_search_places':
      return 'Mencari lokasi & tempat di Google Maps...';
    case 'maps_get_place_details':
      return 'Memeriksa alamat, rating, & kontak lokasi...';
    case 'maps_geocode':
      return 'Memvalidasi titik koordinat lokasi...';
    case 'maps_compute_route':
      return 'Menghitung jarak & estimasi waktu tempuh...';
    case 'teralio_web_search':
      return 'Menelusuri informasi terkini di web...';
    default:
      return toolName?.startsWith('mcp__')
        ? 'Menjalankan konektor MCP...'
        : 'Menjalankan pencarian pendukung...';
  }
};

/**
 * Menyusun payload `input` untuk OpenAI Responses API dari kombinasi teks/item dan daftar `attachments`.
 */
export function buildResponsesUserInput({ input, message, prompt, attachments } = {}) {
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  const rawInput = input ?? message ?? prompt;

  if (!hasAttachments) {
    if (
      rawInput === undefined ||
      rawInput === null ||
      (typeof rawInput === 'string' && !rawInput.trim()) ||
      (Array.isArray(rawInput) && rawInput.length === 0)
    ) {
      throw badRequest('Field "input" (atau "message" / "prompt") wajib diisi');
    }
    return typeof rawInput === 'string' ? rawInput.trim() : rawInput;
  }

  // Jika input sudah berupa array item multi-turn kustom, tambahkan bagian attachment ke pesan user
  const contentParts = [];

  for (const att of attachments) {
    if (!att || typeof att !== 'object') continue;

    if (att.kind === 'image') {
      if (att.fileId) {
        contentParts.push({
          type: 'input_image',
          file_id: String(att.fileId),
          detail: att.detail || 'auto',
        });
      } else if (typeof att.dataUrl === 'string' && att.dataUrl.startsWith('data:image/')) {
        contentParts.push({
          type: 'input_image',
          image_url: att.dataUrl,
          detail: att.detail || 'auto',
        });
      } else {
        throw badRequest(`Lampiran gambar '${att.filename || 'image'}' tidak memiliki referensi fileId atau dataUrl valid`);
      }
    } else if (att.kind === 'file') {
      if (att.fileId) {
        contentParts.push({
          type: 'input_file',
          file_id: String(att.fileId),
        });
      } else if (typeof att.dataUrl === 'string' && att.dataUrl.startsWith('data:')) {
        contentParts.push({
          type: 'input_file',
          filename: att.filename || 'attachment.pdf',
          file_data: att.dataUrl,
        });
      } else {
        throw badRequest(`Lampiran file '${att.filename || 'file'}' tidak memiliki referensi fileId atau dataUrl valid`);
      }
    } else if (att.kind === 'text_file') {
      const safeName = String(att.filename || 'dokumen.txt').slice(0, 160);
      const safeBody = String(att.extractedText || '').slice(0, MAX_TEXT_ATTACHMENT_CHARS);
      contentParts.push({
        type: 'input_text',
        text: `[Lampiran Dokumen: ${safeName}]\n${safeBody}`,
      });
    }
  }

  const userText = typeof rawInput === 'string' ? rawInput.trim() : '';
  if (userText) {
    contentParts.push({
      type: 'input_text',
      text: userText,
    });
  } else if (contentParts.length > 0) {
    contentParts.push({
      type: 'input_text',
      text: 'Tolong analisis lampiran ini dan berikan penjelasan yang relevan.',
    });
  }

  if (contentParts.length === 0) {
    throw badRequest('Lampiran atau teks pesan tidak valid');
  }

  return [
    {
      role: 'user',
      content: contentParts,
    },
  ];
}

export { isOpenAiConfigured, hasOpenAiTestOverride, getOpenAiClient, _setOpenAiClientForTesting };

export const openaiService = {
  /**
   * Status konfigurasi & kapabilitas OpenAI (kompatibel penuh dengan kontrak `/api/openai/status`).
   */
  getStatus() {
    const configured = isOpenAiConfigured();
    return {
      service: 'OpenAI',
      apiMode: 'responses',
      configured,
      hasKey: Boolean(config.openai.apiKey),
      // `model` dipertahankan untuk kompatibilitas komponen frontend lama
      model: config.openai.textModel,
      textModel: config.openai.textModel,
      webSearchModel: config.openai.webSearchModel,
      realtimeModel: config.openai.realtimeModel,
      realtimeVoice: config.openai.realtimeVoice,
      capabilities: {
        responsesApi: true,
        streamingSse: true,
        attachments: true,
        realtimeWebRtc: true,
        functionCalling: true,
        mcpTools: true,
        webSearch: true,
      },
    };
  },

  /**
   * Memvalidasi & menyiapkan lampiran gambar atau dokumen untuk dikirim ke Responses API.
   * - Gambar (`PNG`, `JPEG`, `WEBP`, `GIF`) & `PDF` diunggah ke OpenAI Files API (`purpose: 'user_data'`)
   *   ketika `OPENAI_API_KEY` terkonfigurasi, atau disiapkan sebagai inline `data:` URL tervalidasi.
   * - Dokumen berbasis teks (`.txt`, `.md`, `.csv`, `.json`) diekstrak UTF-8 secara aman.
   */
  async prepareAttachment({ buffer, filename = 'attachment', mimeType = '' } = {}) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw badRequest('File lampiran kosong atau tidak terbaca');
    }
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      throw badRequest('Ukuran file melebihi batas maksimum 4 MB per lampiran');
    }

    const sanitizedName = path
      .basename(String(filename || 'attachment'))
      .replace(/[^\w.\-() ]+/g, '_')
      .slice(0, 140) || 'attachment';
    const ext = path.extname(sanitizedName).toLowerCase();
    const normalizedMime = String(mimeType || '').split(';')[0].trim().toLowerCase();

    const resolvedMime =
      normalizedMime && normalizedMime !== 'application/octet-stream'
        ? normalizedMime
        : IMAGE_EXT_MIME_MAP[ext] || (ext === '.pdf' ? 'application/pdf' : '');

    const isImage = IMAGE_MIME_SET.has(resolvedMime);
    const isPdf = resolvedMime === 'application/pdf' || ext === '.pdf';
    const isTextDoc = TEXT_MIME_SET.has(resolvedMime) || TEXT_EXT_SET.has(ext);

    if (!isImage && !isPdf && !isTextDoc) {
      throw badRequest(
        'Format file tidak didukung. Gunakan gambar (PNG, JPG, WEBP, GIF) atau dokumen (PDF, TXT, MD, CSV, JSON).',
      );
    }

    if (isTextDoc) {
      const textContent = buffer.toString('utf8').slice(0, MAX_TEXT_ATTACHMENT_CHARS);
      return {
        id: `att_txt_${crypto.randomUUID()}`,
        fileId: null,
        mode: 'extracted_text',
        kind: 'text_file',
        filename: sanitizedName,
        mimeType: resolvedMime || 'text/plain',
        size: buffer.length,
        extractedText: textContent,
      };
    }

    const effectiveMime = isImage ? (resolvedMime === 'image/jpg' ? 'image/jpeg' : resolvedMime) : 'application/pdf';
    const kind = isImage ? 'image' : 'file';

    if (isOpenAiConfigured() || hasOpenAiTestOverride()) {
      const client = getOpenAiClient({ requireConfigured: true });
      if (typeof client.files?.create === 'function') {
        try {
          const uploadable = await toFile(buffer, sanitizedName, { type: effectiveMime });
          const created = await client.files.create({
            file: uploadable,
            purpose: 'user_data',
          });
          return {
            id: created.id,
            fileId: created.id,
            mode: 'openai_file',
            kind,
            filename: sanitizedName,
            mimeType: effectiveMime,
            size: buffer.length,
          };
        } catch (err) {
          throw fromOpenAiError(err);
        }
      }
    }

    // Fallback inline data URL tervalidasi (ketika di mode test stub atau sebelum OPENAI_API_KEY diisi)
    const dataUrl = `data:${effectiveMime};base64,${buffer.toString('base64')}`;
    return {
      id: `att_inline_${crypto.randomUUID()}`,
      fileId: null,
      mode: 'inline_data',
      kind,
      filename: sanitizedName,
      mimeType: effectiveMime,
      size: buffer.length,
      dataUrl,
    };
  },

  /**
   * Menjalankan percakapan Responses API sinkron dengan orkestrasi multi-round tools.
   * Membutuhkan `OPENAI_API_KEY` valid (melempar 503 `OPENAI_NOT_CONFIGURED` bila belum diisi).
   */
  async respond({
    input,
    message,
    prompt,
    attachments,
    instructions,
    userContext,
    model = config.openai.textModel,
    previousResponseId,
    store = true,
    reasoningEffort,
    maxOutputTokens,
    enableTools = true,
    enableWebSearch = true,
    userLocation,
    allowedDomains,
  } = {}) {
    const resolvedInput = buildResponsesUserInput({ input, message, prompt, attachments });

    const client = getOpenAiClient({ requireConfigured: true });
    const systemInstructions = buildSessionInstructions({
      mode: 'text',
      customInstructions: instructions,
      userContext,
    });

    const tools =
      enableTools || enableWebSearch
        ? await toolOrchestrator.getResponsesTools({
            enableWebSearch,
            enableFunctionTools: enableTools,
            enableExternalMcp: enableTools,
            webSearchOptions: { userLocation, allowedDomains },
          })
        : [];

    const include = enableWebSearch ? ['web_search_call.action.sources'] : undefined;
    const reasoning = buildReasoningParam(model, reasoningEffort);

    const toolCallsTrace = [];
    const rawToolExecutions = [];
    const aggregatedCitations = [];
    const aggregatedSourcesMap = new Map();
    const aggregatedSearchCalls = [];

    let currentInput = resolvedInput;
    let currentPreviousId = previousResponseId || undefined;
    let latestResponse = null;

    try {
      for (let round = 0; round <= config.openai.agentMaxToolRounds; round += 1) {
        latestResponse = await client.responses.create({
          model,
          instructions: systemInstructions,
          input: currentInput,
          store: Boolean(store),
          ...(currentPreviousId ? { previous_response_id: currentPreviousId } : {}),
          ...(reasoning ? { reasoning } : {}),
          ...(typeof maxOutputTokens === 'number' ? { max_output_tokens: maxOutputTokens } : {}),
          ...(tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
          ...(include ? { include } : {}),
        });

        // Kumpulkan sitasi & sumber pencarian web dari putaran ini
        const searchArtifacts = extractWebSearchArtifacts(latestResponse);
        aggregatedCitations.push(...searchArtifacts.citations);
        aggregatedSearchCalls.push(...searchArtifacts.searchCalls);
        for (const src of searchArtifacts.sources) {
          if (!aggregatedSourcesMap.has(src.url)) aggregatedSourcesMap.set(src.url, src);
        }

        const outputItems = Array.isArray(latestResponse.output) ? latestResponse.output : [];
        const functionCalls = outputItems.filter((item) => item?.type === 'function_call');

        if (functionCalls.length === 0 || round === config.openai.agentMaxToolRounds) {
          break;
        }

        const executions = await Promise.all(
          functionCalls.map(async (call) => {
            const parsedArgs = safeParseJsonObject(call.arguments);
            const execResult = await toolOrchestrator.executeToolCall(call.name, call.arguments, {
              throwOnError: false,
            });
            toolCallsTrace.push({
              callId: call.call_id,
              name: call.name,
              ok: execResult.ok,
              source: execResult.source ?? null,
              durationMs: execResult.durationMs,
              error: execResult.error ?? null,
            });
            rawToolExecutions.push({
              name: call.name,
              args: parsedArgs,
              ok: execResult.ok,
              data: execResult.data ?? null,
            });
            return {
              type: 'function_call_output',
              call_id: call.call_id,
              output: execResult.serializedOutput,
            };
          }),
        );

        if (store) {
          currentPreviousId = latestResponse.id;
          currentInput = executions;
        } else {
          const priorItems = Array.isArray(currentInput)
            ? currentInput
            : [{ role: 'user', content: String(currentInput) }];
          currentInput = [...priorItems, ...outputItems, ...executions];
          currentPreviousId = undefined;
        }
      }

      const recommendations = extractVerifiedRecommendations(rawToolExecutions);

      return {
        source: 'openai-responses',
        configured: true,
        responseId: latestResponse.id,
        previousResponseId: previousResponseId || null,
        model: latestResponse.model || model,
        status: latestResponse.status || 'completed',
        response: latestResponse.output_text || '',
        outputText: latestResponse.output_text || '',
        toolCalls: toolCallsTrace,
        recommendations,
        webSearch: {
          searched: aggregatedSearchCalls.length > 0,
          searchCalls: aggregatedSearchCalls,
          citations: aggregatedCitations,
          sources: Array.from(aggregatedSourcesMap.values()),
        },
        usage: latestResponse.usage ?? null,
      };
    } catch (err) {
      const mapped = fromOpenAiError(err);
      log.warn('Permintaan Responses API gagal', { code: mapped.code, status: mapped.status });
      throw mapped;
    }
  },

  /**
   * Menjalankan percakapan Responses API secara **Streaming (SSE)** lengkap dengan multi-round tool loop,
   * pemetaan event semantik untuk `@yogesharc/thinking-orbs`, dan ekstraksi rekomendasi terverifikasi.
   */
  async streamRespond(
    {
      input,
      message,
      prompt,
      attachments,
      instructions,
      userContext,
      model = config.openai.textModel,
      previousResponseId,
      store = true,
      reasoningEffort,
      maxOutputTokens,
      enableTools = true,
      enableWebSearch = true,
      userLocation,
      allowedDomains,
    } = {},
    { onEvent, signal } = {},
  ) {
    const emit = (type, payload) => {
      if (typeof onEvent === 'function' && !signal?.aborted) {
        onEvent(type, payload);
      }
    };

    const resolvedInput = buildResponsesUserInput({ input, message, prompt, attachments });
    const client = getOpenAiClient({ requireConfigured: true });
    const systemInstructions = buildSessionInstructions({
      mode: 'text',
      customInstructions: instructions,
      userContext,
    });

    const tools =
      enableTools || enableWebSearch
        ? await toolOrchestrator.getResponsesTools({
            enableWebSearch,
            enableFunctionTools: enableTools,
            enableExternalMcp: enableTools,
            webSearchOptions: { userLocation, allowedDomains },
          })
        : [];

    const include = enableWebSearch ? ['web_search_call.action.sources'] : undefined;
    const reasoning = buildReasoningParam(model, reasoningEffort);
    const isDeepThinking = reasoning?.effort === 'high' || reasoning?.effort === 'xhigh';

    const toolCallsTrace = [];
    const rawToolExecutions = [];
    const aggregatedCitations = [];
    const aggregatedSourcesMap = new Map();
    const aggregatedSearchCalls = [];

    let currentInput = resolvedInput;
    let currentPreviousId = previousResponseId || undefined;
    let latestResponse = null;
    let accumulatedText = '';

    emit('status', {
      orbState: 'reasoning',
      variant: isDeepThinking ? 'twins' : 'default',
      label: isDeepThinking ? 'Menalar secara mendalam...' : 'Memproses permintaan...',
    });

    try {
      for (let round = 0; round <= config.openai.agentMaxToolRounds; round += 1) {
        if (signal?.aborted) break;

        const requestPayload = {
          model,
          instructions: systemInstructions,
          input: currentInput,
          store: Boolean(store),
          stream: true,
          ...(currentPreviousId ? { previous_response_id: currentPreviousId } : {}),
          ...(reasoning ? { reasoning } : {}),
          ...(typeof maxOutputTokens === 'number' ? { max_output_tokens: maxOutputTokens } : {}),
          ...(tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
          ...(include ? { include } : {}),
        };

        const streamOrResponse = await client.responses.create(
          requestPayload,
          signal ? { signal } : undefined,
        );

        let roundResponse = null;
        let roundText = '';

        // Mendukung async iterable stream resmi OpenAI SDK v7
        if (streamOrResponse && typeof streamOrResponse[Symbol.asyncIterator] === 'function') {
          for await (const event of streamOrResponse) {
            if (signal?.aborted) break;
            if (!event || typeof event !== 'object') continue;

            switch (event.type) {
              case 'response.queued':
                emit('status', {
                  orbState: 'waiting',
                  variant: 'default',
                  label: 'Menunggu antrean pemrosesan...',
                });
                break;

              case 'response.compaction.compacting':
                emit('status', {
                  orbState: 'compacting',
                  variant: 'squeeze',
                  label: 'Memadatkan konteks percakapan...',
                });
                break;

              case 'response.reasoning_summary_part.added':
              case 'response.reasoning_summary_text.delta':
              case 'response.reasoning_text.delta':
                emit('status', {
                  orbState: 'reasoning',
                  variant: isDeepThinking ? 'twins' : 'default',
                  label: isDeepThinking ? 'Menalar secara mendalam...' : 'Menganalisis permintaan...',
                });
                break;

              case 'response.web_search_call.in_progress':
              case 'response.web_search_call.searching':
                emit('status', {
                  orbState: 'searching',
                  variant: 'lighthouse',
                  label: 'Menelusuri informasi terkini di web...',
                });
                break;

              case 'response.mcp_list_tools.in_progress':
              case 'response.mcp_call.in_progress':
                emit('status', {
                  orbState: 'working',
                  variant: 'gyro',
                  label: 'Menjalankan konektor MCP...',
                });
                break;

              case 'response.output_item.added': {
                const item = event.item;
                if (item?.type === 'function_call') {
                  const isWebTool = item.name === 'teralio_web_search';
                  const orbState = isWebTool ? 'searching' : 'working';
                  const variant = isWebTool ? 'lighthouse' : 'gyro';
                  const label = describeToolActivity(item.name);

                  emit('status', { orbState, variant, label });
                  emit('tool_start', {
                    callId: item.call_id || item.id || null,
                    name: item.name,
                    orbState,
                    variant,
                    label,
                  });
                } else if (item?.type === 'web_search_call') {
                  emit('status', {
                    orbState: 'searching',
                    variant: 'lighthouse',
                    label: 'Menelusuri informasi terkini di web...',
                  });
                }
                break;
              }

              case 'response.output_text.delta': {
                const delta = typeof event.delta === 'string' ? event.delta : '';
                if (delta) {
                  roundText += delta;
                  accumulatedText += delta;
                  emit('text_delta', {
                    itemId: event.item_id || null,
                    delta,
                  });
                }
                break;
              }

              case 'response.output_text.annotation.added': {
                const ann = event.annotation;
                if (ann?.type === 'url_citation' && ann.url) {
                  emit('citation', {
                    title: ann.title || null,
                    url: ann.url,
                    startIndex: ann.start_index ?? null,
                    endIndex: ann.end_index ?? null,
                  });
                }
                break;
              }

              case 'response.completed':
                roundResponse = event.response;
                break;

              case 'response.incomplete':
                roundResponse = event.response;
                break;

              case 'response.failed':
                throw fromOpenAiError(
                  event.response?.error || new Error('Pemrosesan streaming OpenAI gagal'),
                );

              case 'error':
                throw fromOpenAiError(event.error || event);

              default:
                break;
            }
          }
        } else if (streamOrResponse && typeof streamOrResponse === 'object') {
          // Fallback aman apabila mock/stub mengembalikan objek Response langsung
          roundResponse = streamOrResponse;
          if (typeof roundResponse.output_text === 'string' && roundResponse.output_text) {
            roundText = roundResponse.output_text;
            accumulatedText += roundText;
            emit('text_delta', { itemId: roundResponse.id || null, delta: roundText });
          }
        }

        if (signal?.aborted) break;

        latestResponse = roundResponse || {
          id: `resp_${crypto.randomUUID()}`,
          model,
          status: 'completed',
          output_text: roundText,
          output: [],
        };

        const searchArtifacts = extractWebSearchArtifacts(latestResponse);
        aggregatedCitations.push(...searchArtifacts.citations);
        aggregatedSearchCalls.push(...searchArtifacts.searchCalls);
        for (const src of searchArtifacts.sources) {
          if (!aggregatedSourcesMap.has(src.url)) aggregatedSourcesMap.set(src.url, src);
        }

        const outputItems = Array.isArray(latestResponse.output) ? latestResponse.output : [];
        const functionCalls = outputItems.filter((item) => item?.type === 'function_call');

        if (functionCalls.length === 0 || round === config.openai.agentMaxToolRounds) {
          break;
        }

        // Jalankan seluruh function_call secara paralel melalui orchestrator terpusat
        const executions = await Promise.all(
          functionCalls.map(async (call) => {
            const parsedArgs = safeParseJsonObject(call.arguments);
            const execResult = await toolOrchestrator.executeToolCall(call.name, call.arguments, {
              throwOnError: false,
            });

            const traceEntry = {
              callId: call.call_id,
              name: call.name,
              ok: execResult.ok,
              source: execResult.source ?? null,
              durationMs: execResult.durationMs,
              error: execResult.error ?? null,
            };
            toolCallsTrace.push(traceEntry);
            rawToolExecutions.push({
              name: call.name,
              args: parsedArgs,
              ok: execResult.ok,
              data: execResult.data ?? null,
            });

            emit('tool_end', {
              callId: call.call_id,
              name: call.name,
              ok: execResult.ok,
              durationMs: execResult.durationMs,
              error: execResult.error?.message || null,
            });

            return {
              type: 'function_call_output',
              call_id: call.call_id,
              output: execResult.serializedOutput,
            };
          }),
        );

        // Segera kirim rekomendasi tempat/kos tervalidasi ke frontend begitu tool selesai
        const currentRecs = extractVerifiedRecommendations(rawToolExecutions);
        if (currentRecs.hasValidRecommendations) {
          emit('recommendations', currentRecs);
        }

        emit('status', {
          orbState: 'reasoning',
          variant: isDeepThinking ? 'twins' : 'default',
          label: 'Menyusun jawaban berdasarkan hasil pencarian...',
        });

        if (store) {
          currentPreviousId = latestResponse.id;
          currentInput = executions;
        } else {
          const priorItems = Array.isArray(currentInput)
            ? currentInput
            : [{ role: 'user', content: String(currentInput) }];
          currentInput = [...priorItems, ...outputItems, ...executions];
          currentPreviousId = undefined;
        }
      }

      const finalOutputText = accumulatedText || latestResponse?.output_text || '';
      const finalRecommendations = extractVerifiedRecommendations(rawToolExecutions);

      const finalPayload = {
        source: 'openai-responses-stream',
        configured: true,
        responseId: latestResponse?.id || null,
        previousResponseId: previousResponseId || null,
        model: latestResponse?.model || model,
        status: signal?.aborted ? 'cancelled' : latestResponse?.status || 'completed',
        response: finalOutputText,
        outputText: finalOutputText,
        toolCalls: toolCallsTrace,
        recommendations: finalRecommendations,
        webSearch: {
          searched: aggregatedSearchCalls.length > 0,
          searchCalls: aggregatedSearchCalls,
          citations: aggregatedCitations,
          sources: Array.from(aggregatedSourcesMap.values()),
        },
        usage: latestResponse?.usage ?? null,
      };

      emit('done', finalPayload);
      return finalPayload;
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError') {
        return {
          source: 'openai-responses-stream',
          configured: true,
          status: 'cancelled',
          outputText: accumulatedText,
        };
      }
      const mapped = fromOpenAiError(err);
      log.warn('Permintaan streaming Responses API gagal', { code: mapped.code, status: mapped.status });
      throw mapped;
    }
  },

  /**
   * Endpoint percakapan `/api/openai/chat` (mempertahankan kompatibilitas kontrak UI lama,
   * namun kini berjalan penuh di atas Responses API & tool orchestrator ketika API key tersedia).
   */
  async chat({
    message,
    prompt,
    input,
    model = config.openai.textModel,
    previousResponseId,
    instructions,
    userContext,
    enableTools = true,
    enableWebSearch = true,
  } = {}) {
    const userContent = message ?? prompt ?? input;
    if (!userContent || typeof userContent !== 'string' || !userContent.trim()) {
      throw badRequest('Field "message" atau "prompt" wajib diisi dengan teks valid');
    }

    if (!isOpenAiConfigured()) {
      return {
        source: 'mock-fallback',
        configured: false,
        model,
        response: `[Simulasi OpenAI - Kunci API Belum Dikonfigurasi]: Anda mengirimkan: "${userContent}". Untuk mendapatkan respon dari OpenAI sungguhan, masukkan OPENAI_API_KEY Anda di file backend/.env.`,
      };
    }

    return this.respond({
      input: userContent,
      model,
      previousResponseId,
      instructions,
      userContext,
      enableTools,
      enableWebSearch,
    });
  },
};

export default openaiService;
