import { z } from 'zod';
import { config } from '../config/env.js';
import { AppError, badRequest, notFound, timeoutError } from '../utils/errors.js';
import { withTimeout } from '../utils/http.js';
import { createLogger } from '../utils/logger.js';
import { googleMapsService } from './googleMapsService.js';
import { itemsService } from './itemsService.js';
import { mcpClientService } from './mcpClientService.js';
import { buildWebSearchToolConfig, webSearchService } from './webSearchService.js';

/**
 * Pusat registrasi & orkestrasi seluruh tools TERALIO.
 *
 * Satu definisi Zod menjadi sumber kebenaran tunggal untuk:
 *  1. OpenAI Responses API (`type: 'function'` + native `web_search` + remote `mcp`)
 *  2. OpenAI Realtime API (`gpt-realtime-2.1` via WebRTC / Sideband / Relay)
 *  3. TERALIO MCP Server (`/api/mcp` via Streamable HTTP)
 */
const log = createLogger('ToolOrchestrator');

const toCleanJsonSchema = (zodSchema) => {
  const raw = z.toJSONSchema(zodSchema);
  const { $schema, ...clean } = raw;
  return clean;
};

const waypointField = z
  .union([
    z.string().min(1).describe('Alamat lengkap atau nama lokasi, misal "Telkom University Bandung"'),
    z.object({
      placeId: z.string().min(1).optional().describe('Google Maps Place ID'),
      address: z.string().min(1).optional().describe('Alamat teks'),
      lat: z.number().min(-90).max(90).optional().describe('Latitude'),
      lng: z.number().min(-180).max(180).optional().describe('Longitude'),
    }),
  ])
  .describe('Titik lokasi berupa string alamat atau objek koordinat/placeId');

const LOCAL_TOOLS = [
  {
    name: 'teralio_search_accommodations',
    title: 'Cari Hunian / Kos TERALIO',
    category: 'accommodation',
    exposeInResponses: true,
    exposeInRealtime: true,
    exposeInMcp: true,
    description:
      'Mencari daftar hunian/kos yang terdaftar di database TERALIO berdasarkan kata kunci atau kategori.',
    schema: z.object({
      query: z
        .string()
        .max(200)
        .optional()
        .describe('Kata kunci pencarian (nama kos, area kampus, atau fasilitas)'),
      category: z.string().max(80).optional().describe('Filter kategori hunian'),
      limit: z.number().int().min(1).max(20).optional().describe('Jumlah hasil maksimum (1-20, default 10)'),
    }),
    async handler({ query, category, limit = 10 }) {
      const result = await itemsService.getAll();
      let items = Array.isArray(result.items) ? result.items : [];

      if (category) {
        const needle = category.toLowerCase();
        items = items.filter((item) => String(item.category || '').toLowerCase().includes(needle));
      }
      if (query) {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        items = items.filter((item) => {
          const haystack = `${item.title || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
          return terms.every((t) => haystack.includes(t));
        });
      }

      const sliced = items.slice(0, limit);
      return {
        source: result.source,
        totalMatched: items.length,
        returnedCount: sliced.length,
        accommodations: sliced,
      };
    },
  },
  {
    name: 'teralio_get_accommodation_details',
    title: 'Detail Hunian / Kos TERALIO',
    category: 'accommodation',
    exposeInResponses: true,
    exposeInRealtime: true,
    exposeInMcp: true,
    description: 'Mengambil informasi detail satu hunian/kos di TERALIO berdasarkan ID.',
    schema: z.object({
      id: z.string().min(1).max(100).describe('ID unik hunian/item di TERALIO'),
    }),
    async handler({ id }) {
      const item = await itemsService.getById(id);
      if (!item) throw notFound(`Hunian dengan ID '${id}' tidak ditemukan`);
      return { accommodation: item };
    },
  },
  {
    name: 'maps_search_places',
    title: 'Cari Lokasi & Tempat (Google Maps)',
    category: 'google_maps',
    exposeInResponses: true,
    exposeInRealtime: true,
    exposeInMcp: true,
    description:
      'Mencari tempat, kampus, halte/stasiun, minimarket, rumah sakit, atau kos di Google Maps berdasarkan nama/kata kunci dan opsional titik koordinat sekitar.',
    schema: z.object({
      query: z.string().min(2).max(250).describe('Nama tempat atau kata kunci lokasi, misal "kos dekat ITB Bandung"'),
      lat: z.number().min(-90).max(90).optional().describe('Latitude pusat pencarian opsional'),
      lng: z.number().min(-180).max(180).optional().describe('Longitude pusat pencarian opsional'),
      radiusMeters: z
        .number()
        .min(100)
        .max(50_000)
        .optional()
        .describe('Radius bias pencarian dalam meter (100 - 50000, default 3000)'),
      maxResults: z.number().int().min(1).max(20).optional().describe('Jumlah hasil maksimum (1-20, default 5)'),
      includedType: z.string().max(80).optional().describe('Tipe tempat Google Places opsional, misal "university"'),
      openNow: z.boolean().optional().describe('Filter hanya tempat yang sedang buka'),
    }),
    async handler({ query, lat, lng, radiusMeters, maxResults = 5, includedType, openNow }) {
      const location = typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : undefined;
      return googleMapsService.searchPlaces({
        query,
        location,
        radiusMeters,
        maxResults,
        includedType,
        openNow,
      });
    },
  },
  {
    name: 'maps_get_place_details',
    title: 'Detail Lokasi (Google Maps)',
    category: 'google_maps',
    exposeInResponses: true,
    exposeInRealtime: true,
    exposeInMcp: true,
    description:
      'Mengambil detail lengkap suatu tempat dari Google Maps (nama, deskripsi editorial, alamat, koordinat, nomor telepon, website, rating, jam operasional) menggunakan placeId.',
    schema: z.object({
      placeId: z.string().min(3).max(200).describe('Google Maps Place ID hasil pencarian'),
      level: z
        .enum(['basic', 'contact', 'full'])
        .optional()
        .describe('Tingkat kelengkapan data: basic (alamat & koordinat), contact (+telepon/jam buka/rating), full (+deskripsi)'),
    }),
    async handler({ placeId, level }) {
      return googleMapsService.getPlaceDetails({ placeId, level });
    },
  },
  {
    name: 'maps_geocode',
    title: 'Geocoding & Reverse Geocoding (Google Maps)',
    category: 'google_maps',
    exposeInResponses: true,
    exposeInRealtime: true,
    exposeInMcp: true,
    description:
      'Mengonversi alamat teks menjadi koordinat (latitude, longitude) atau sebaliknya dari koordinat menjadi alamat terformat.',
    schema: z.object({
      address: z.string().min(2).max(300).optional().describe('Alamat teks yang ingin diubah ke koordinat'),
      lat: z.number().min(-90).max(90).optional().describe('Latitude untuk reverse geocoding'),
      lng: z.number().min(-180).max(180).optional().describe('Longitude untuk reverse geocoding'),
    }),
    async handler({ address, lat, lng }) {
      return googleMapsService.geocode({ address, lat, lng });
    },
  },
  {
    name: 'maps_compute_route',
    title: 'Hitung Jarak & Rute Perjalanan (Google Maps Routes)',
    category: 'google_maps',
    exposeInResponses: true,
    exposeInRealtime: true,
    exposeInMcp: true,
    description:
      'Menghitung jarak tempuh, durasi perjalanan, dan rute antara dua lokasi (misal dari lokasi kos ke kampus) dengan moda jalan kaki, motor, mobil, sepeda, atau transportasi umum.',
    schema: z.object({
      origin: waypointField.describe('Lokasi asal (alamat, placeId, atau koordinat)'),
      destination: waypointField.describe('Lokasi tujuan (alamat, placeId, atau koordinat)'),
      travelMode: z
        .enum(['DRIVE', 'TWO_WHEELER', 'WALK', 'BICYCLE', 'TRANSIT'])
        .optional()
        .describe('Moda transportasi (default WALK atau DRIVE sesuai konteks)'),
      trafficAware: z
        .boolean()
        .optional()
        .describe('Perhitungkan kondisi lalu lintas terkini (khusus DRIVE/TWO_WHEELER)'),
    }),
    async handler({ origin, destination, travelMode = 'DRIVE', trafficAware = false }) {
      return googleMapsService.computeRoute({ origin, destination, travelMode, trafficAware });
    },
  },
  {
    name: 'teralio_web_search',
    title: 'Pencarian Web Terkini (OpenAI Web Search)',
    category: 'web_search',
    // Pada Responses API native `web_search` dipasang langsung; function ini dipakai oleh Realtime Voice & MCP.
    exposeInResponses: false,
    exposeInRealtime: true,
    exposeInMcp: true,
    description:
      'Mencari informasi faktual terbaru di internet menggunakan OpenAI Web Search dan mengembalikan ringkasan beserta daftar URL sumber referensi.',
    schema: z.object({
      query: z.string().min(2).max(400).describe('Pertanyaan atau kata kunci pencarian web'),
      city: z.string().max(100).optional().describe('Kota konteks lokasi pengguna opsional, misal "Bandung"'),
      country: z.string().length(2).optional().describe('Kode negara ISO 2 huruf opsional, default "ID"'),
    }),
    async handler({ query, city, country }) {
      const res = await webSearchService.search({
        query,
        userLocation: city || country ? { city, country: country || 'ID' } : undefined,
        forceSearch: true,
      });
      return {
        query: res.query,
        answer: res.answer,
        citations: res.citations,
        sources: res.sources,
      };
    },
  },
];

const parseArguments = (rawArgs) => {
  if (rawArgs === undefined || rawArgs === null || rawArgs === '') return {};
  if (typeof rawArgs === 'object' && !Array.isArray(rawArgs)) return rawArgs;
  if (typeof rawArgs === 'string') {
    try {
      const parsed = JSON.parse(rawArgs);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      throw new Error('Argumen JSON harus berupa object');
    } catch (err) {
      throw badRequest(`Format JSON argumen tool tidak valid: ${err.message}`);
    }
  }
  throw badRequest('Argumen tool harus berupa JSON object');
};

export const toolOrchestrator = {
  /** Daftar definisi tool lokal untuk dipasang pada MCP Server (`/api/mcp`). */
  getLocalMcpDefinitions() {
    return LOCAL_TOOLS.filter((t) => t.exposeInMcp).map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      schema: tool.schema,
      inputJsonSchema: toCleanJsonSchema(tool.schema),
      handler: tool.handler,
    }));
  },

  /** Katalog lengkap seluruh tools (lokal + MCP eksternal) untuk observabilitas & dokumentasi. */
  async listAllTools({ includeExternalMcp = true } = {}) {
    const local = LOCAL_TOOLS.map((t) => ({
      name: t.name,
      title: t.title,
      category: t.category,
      source: 'local',
      description: t.description,
      exposeIn: {
        responses: t.exposeInResponses,
        realtime: t.exposeInRealtime,
        mcp: t.exposeInMcp,
      },
      parameters: toCleanJsonSchema(t.schema),
    }));

    const externalBackend = includeExternalMcp
      ? (await mcpClientService.discoverBackendTools()).map((ext) => ({
          name: ext.qualifiedName,
          title: `${ext.serverLabel}: ${ext.remoteName}`,
          category: 'external_mcp',
          source: `mcp:${ext.serverLabel}`,
          description: ext.description,
          exposeIn: { responses: true, realtime: true, mcp: false },
          parameters: ext.inputSchema,
        }))
      : [];

    const remoteOpenAiMcp = mcpClientService.getOpenAiRemoteMcpTools();

    return {
      localCount: local.length,
      externalBackendMcpCount: externalBackend.length,
      openAiRemoteMcpCount: remoteOpenAiMcp.length,
      nativeHostedTools: ['web_search'],
      tools: [...local, ...externalBackend],
      openAiRemoteMcpServers: remoteOpenAiMcp.map(({ authorization, ...safe }) => ({
        ...safe,
        hasAuthorization: Boolean(authorization),
      })),
    };
  },

  /**
   * Menyusun array `tools` untuk OpenAI Responses API:
   * - Function tools lokal (`strict: false` + JSON Schema bersih)
   * - Function tools dari MCP server eksternal bermode `backend`
   * - Hosted `{ type: 'web_search' }` (opsional, aktif secara default)
   * - Hosted `{ type: 'mcp' }` untuk remote MCP server bermode `openai_remote`
   */
  async getResponsesTools({
    enableWebSearch = true,
    enableFunctionTools = true,
    enableExternalMcp = true,
    webSearchOptions,
  } = {}) {
    const tools = [];

    if (enableFunctionTools) {
      for (const tool of LOCAL_TOOLS) {
        if (!tool.exposeInResponses && !(tool.name === 'teralio_web_search' && !enableWebSearch)) {
          continue;
        }
        if (tool.name === 'teralio_web_search') continue;
        tools.push({
          type: 'function',
          name: tool.name,
          description: tool.description,
          parameters: toCleanJsonSchema(tool.schema),
          strict: false,
        });
      }
    }

    if (enableExternalMcp) {
      const externalTools = await mcpClientService.discoverBackendTools();
      for (const ext of externalTools) {
        tools.push({
          type: 'function',
          name: ext.qualifiedName,
          description: ext.description,
          parameters: ext.inputSchema,
          strict: false,
        });
      }
      tools.push(...mcpClientService.getOpenAiRemoteMcpTools());
    }

    if (enableWebSearch) {
      tools.push(buildWebSearchToolConfig(webSearchOptions));
    }

    return tools;
  },

  /**
   * Menyusun array `tools` untuk OpenAI Realtime API (`gpt-realtime-2.1`):
   * Menyertakan seluruh tool domain TERALIO (termasuk `teralio_web_search`),
   * tools dari MCP server eksternal `backend`, serta remote MCP `openai_remote`.
   */
  async getRealtimeTools({ enableExternalMcp = true } = {}) {
    const tools = LOCAL_TOOLS.filter((t) => t.exposeInRealtime).map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: toCleanJsonSchema(tool.schema),
    }));

    if (enableExternalMcp) {
      const externalTools = await mcpClientService.discoverBackendTools();
      for (const ext of externalTools) {
        tools.push({
          type: 'function',
          name: ext.qualifiedName,
          description: ext.description,
          parameters: ext.inputSchema,
        });
      }
      tools.push(...mcpClientService.getOpenAiRemoteMcpTools());
    }

    return tools;
  },

  /**
   * Mengeksekusi satu pemanggilan tool dengan validasi skema, batas waktu, dan error handling konsisten.
   *
   * Secara default (`throwOnError = false`), kegagalan tool dibungkus ke dalam envelope terstruktur
   * `{ ok: false, error: { code, message, status } }` agar model AI tetap menerima `function_call_output`
   * dan dapat menyampaikan kendala secara jujur ke pengguna tanpa memutus sesi percakapan.
   */
  async executeToolCall(name, rawArgs = {}, { throwOnError = false } = {}) {
    const startedAt = Date.now();

    try {
      if (!name || typeof name !== 'string') {
        throw badRequest('Nama tool wajib diisi');
      }

      const parsedArgs = parseArguments(rawArgs);

      // 1. Cek apakah tool berasal dari MCP server eksternal (`mcp__<label>__<tool>`)
      if (name.startsWith('mcp__')) {
        const extResult = await mcpClientService.callQualifiedTool(name, parsedArgs);
        const payload = {
          ok: true,
          tool: name,
          source: `mcp:${extResult.serverLabel}`,
          durationMs: Date.now() - startedAt,
          data: extResult.data,
        };
        return { ...payload, serializedOutput: JSON.stringify(payload) };
      }

      // 2. Cari pada registri tool lokal TERALIO
      const localTool = LOCAL_TOOLS.find((t) => t.name === name);
      if (!localTool) {
        throw badRequest(`Tool '${name}' tidak terdaftar pada orchestrator TERALIO`);
      }

      const validation = localTool.schema.safeParse(parsedArgs);
      if (!validation.success) {
        throw badRequest(`Parameter untuk tool '${name}' tidak valid`, validation.error.issues);
      }

      const data = await withTimeout(
        localTool.handler(validation.data),
        config.mcp.toolTimeoutMs,
        () => timeoutError('TOOL', `Eksekusi tool '${name}' melewati batas waktu ${config.mcp.toolTimeoutMs}ms`),
      );

      const payload = {
        ok: true,
        tool: name,
        source: 'local',
        durationMs: Date.now() - startedAt,
        data,
      };
      return { ...payload, serializedOutput: JSON.stringify(payload) };
    } catch (err) {
      if (throwOnError) throw err;

      const status = err instanceof AppError ? err.status : 500;
      const code = err instanceof AppError ? err.code : 'TOOL_EXECUTION_ERROR';
      log.warn(`Eksekusi tool '${name}' gagal`, { code, status, message: err.message });

      const payload = {
        ok: false,
        tool: name || 'unknown',
        durationMs: Date.now() - startedAt,
        error: {
          code,
          status,
          message: err.message || 'Eksekusi tool gagal',
          details: err instanceof AppError ? err.details : null,
        },
      };
      return { ...payload, serializedOutput: JSON.stringify(payload) };
    }
  },
};

export default toolOrchestrator;
