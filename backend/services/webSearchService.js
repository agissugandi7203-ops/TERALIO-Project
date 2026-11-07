import { config, isOpenAiConfigured } from '../config/env.js';
import { buildSessionInstructions } from '../config/prompts.js';
import { badRequest, fromOpenAiError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';
import { getOpenAiClient } from './openaiClient.js';

/**
 * OpenAI Native Web Search Service (Responses API `web_search` tool).
 *
 * Digunakan pada dua jalur:
 *  1. Langsung sebagai hosted `web_search` tool di dalam Responses API (`openaiService`).
 *  2. Melalui fungsi `webSearchService.search(...)` untuk endpoint `/api/openai/web-search`
 *     maupun delegasi tool `teralio_web_search` dari sesi suara Realtime (`gpt-realtime-2.1`).
 */
const log = createLogger('WebSearch');

const VALID_CONTEXT_SIZES = new Set(['low', 'medium', 'high']);

/** Normalisasi domain sesuai aturan OpenAI Web Search (tanpa skema http/https, maks 100 domain). */
const normalizeDomains = (domains = []) =>
  domains
    .map((d) =>
      String(d)
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, ''),
    )
    .filter(Boolean)
    .slice(0, 100);

/**
 * Membangun objek konfigurasi tool `{ type: 'web_search', ... }` sesuai spesifikasi Responses API.
 */
export function buildWebSearchToolConfig({
  searchContextSize = config.openai.webSearchContextSize,
  userLocation,
  allowedDomains = config.openai.webSearchAllowedDomains,
  externalWebAccess = true,
} = {}) {
  const contextSize = VALID_CONTEXT_SIZES.has(searchContextSize) ? searchContextSize : 'medium';

  const resolvedLocation = {
    country: userLocation?.country ?? config.openai.webSearchCountry ?? null,
    city: userLocation?.city ?? (config.openai.webSearchCity || null),
    region: userLocation?.region ?? null,
    timezone: userLocation?.timezone ?? (config.openai.webSearchTimezone || null),
  };
  const hasLocation = Boolean(
    resolvedLocation.country || resolvedLocation.city || resolvedLocation.region || resolvedLocation.timezone,
  );

  const normalizedDomains = normalizeDomains(allowedDomains);

  return {
    type: 'web_search',
    search_context_size: contextSize,
    external_web_access: Boolean(externalWebAccess),
    ...(hasLocation
      ? {
          user_location: {
            type: 'approximate',
            ...(resolvedLocation.country ? { country: resolvedLocation.country } : {}),
            ...(resolvedLocation.city ? { city: resolvedLocation.city } : {}),
            ...(resolvedLocation.region ? { region: resolvedLocation.region } : {}),
            ...(resolvedLocation.timezone ? { timezone: resolvedLocation.timezone } : {}),
          },
        }
      : {}),
    ...(normalizedDomains.length > 0
      ? {
          filters: { allowed_domains: normalizedDomains },
        }
      : {}),
  };
}

/**
 * Mengekstrak sitasi inline (`url_citation`), daftar lengkap sumber (`sources`),
 * serta metadata aksi pencarian (`web_search_call`) dari objek Response OpenAI.
 */
export function extractWebSearchArtifacts(response) {
  const outputItems = Array.isArray(response?.output) ? response.output : [];
  const citations = [];
  const searchCalls = [];
  const sourceMap = new Map();

  for (const item of outputItems) {
    if (item?.type === 'web_search_call') {
      const action = item.action || {};
      const queries = Array.isArray(action.queries)
        ? action.queries
        : action.query
          ? [action.query]
          : [];
      const rawSources = Array.isArray(action.sources) ? action.sources : [];

      for (const src of rawSources) {
        if (src?.url && !sourceMap.has(src.url)) {
          sourceMap.set(src.url, { url: src.url, title: src.title || null, origin: 'search_result' });
        }
      }

      searchCalls.push({
        id: item.id ?? null,
        status: item.status ?? 'completed',
        actionType: action.type ?? 'search',
        queries,
        url: action.url ?? null,
        sourcesCount: rawSources.length,
      });
    }

    if (item?.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === 'output_text' && Array.isArray(part.annotations)) {
          for (const ann of part.annotations) {
            if (ann?.type === 'url_citation' && ann.url) {
              citations.push({
                title: ann.title || null,
                url: ann.url,
                startIndex: ann.start_index ?? null,
                endIndex: ann.end_index ?? null,
              });
              const existing = sourceMap.get(ann.url);
              sourceMap.set(ann.url, {
                url: ann.url,
                title: ann.title || existing?.title || null,
                origin: existing ? 'cited_and_searched' : 'cited',
              });
            }
          }
        }
      }
    }
  }

  return {
    searched: searchCalls.length > 0,
    searchCalls,
    citations,
    sources: Array.from(sourceMap.values()),
  };
}

export const webSearchService = {
  getStatus() {
    return {
      service: 'OpenAI Web Search',
      configured: isOpenAiConfigured(),
      model: config.openai.webSearchModel,
      defaultContextSize: config.openai.webSearchContextSize,
      defaultLocation: {
        country: config.openai.webSearchCountry,
        city: config.openai.webSearchCity || null,
        timezone: config.openai.webSearchTimezone,
      },
      allowedDomainsCount: config.openai.webSearchAllowedDomains.length,
    };
  },

  /**
   * Menjalankan pencarian informasi terarah melalui OpenAI Responses API + `web_search`.
   * Secara default `toolChoice = 'auto'` sehingga model memutuskan apakah pencarian web diperlukan;
   * set `forceSearch: true` untuk memaksa eksekusi `web_search`.
   */
  async search({
    query,
    model = config.openai.webSearchModel,
    instructions,
    searchContextSize,
    userLocation,
    allowedDomains,
    externalWebAccess = true,
    forceSearch = false,
  } = {}) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      throw badRequest('Field "query" wajib diisi teks pencarian yang valid');
    }

    const client = getOpenAiClient({ requireConfigured: true });
    const webSearchTool = buildWebSearchToolConfig({
      searchContextSize,
      userLocation,
      allowedDomains,
      externalWebAccess,
    });

    try {
      const response = await client.responses.create({
        model,
        instructions: buildSessionInstructions({
          mode: 'web_search',
          customInstructions: instructions,
        }),
        input: query.trim(),
        tools: [webSearchTool],
        tool_choice: forceSearch ? { type: 'web_search' } : 'auto',
        include: ['web_search_call.action.sources'],
      });

      const artifacts = extractWebSearchArtifacts(response);
      return {
        responseId: response.id,
        model: response.model || model,
        query: query.trim(),
        answer: response.output_text || '',
        searched: artifacts.searched,
        citations: artifacts.citations,
        sources: artifacts.sources,
        searchCalls: artifacts.searchCalls,
        usage: response.usage ?? null,
      };
    } catch (err) {
      const mapped = fromOpenAiError(err);
      log.warn('Pencarian web gagal', { code: mapped.code, status: mapped.status });
      throw mapped;
    }
  },
};

export default webSearchService;
